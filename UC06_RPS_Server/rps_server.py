"""Hand-shape server for Pepper's camera Rock Paper Scissors (UC06 Waiting Room).

Pepper streams JPEG-compressed camera frames; this program finds the hand in each frame with
MediaPipe Hands, decides rock / paper / scissors from the finger positions (gesture.py) and
answers every frame with a 6-byte result. Pepper runs the game: countdown, voting over the
frames after "Shoot!", score and reactions.

The server connects to Pepper (not the other way round), so the robot never needs this PC's
address and no firewall rule is needed on the PC:

    python rps_server.py --robot 10.10.42.150

It keeps retrying until the UC06 behavior is running, and reconnects by itself after a restart.
"""
import argparse
import collections
import os
import socket
import threading
import time
import zlib

import cv2
import numpy as np

import gesture
import protocol


MODEL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gesture_recognizer.task")

# MediaPipe's trained gesture classifier knows eight hand signs; three of them are the game's shapes.
TRAINED_TO_GAME = {"Closed_Fist": gesture.ROCK, "Open_Palm": gesture.PAPER, "Victory": gesture.SCISSORS}


def combine(trained, trained_score, geometric, geometric_score):
    """Merge the trained classifier's answer with the finger-geometry answer for one hand.

    Each is rock / paper / scissors / unknown with a 0..1 score. They agree most of the time;
    when only one of them recognises a shape, that one is used; when they contradict each other,
    the more confident one wins, with its score reduced.
    """
    shapes = (gesture.ROCK, gesture.PAPER, gesture.SCISSORS)
    if trained in shapes and geometric in shapes:
        if trained == geometric:
            return trained, max(trained_score, geometric_score)
        if trained_score >= geometric_score:
            return trained, trained_score * 0.5
        return geometric, geometric_score * 0.5
    if trained in shapes:
        return trained, trained_score
    if geometric in shapes:
        return geometric, geometric_score
    return gesture.UNKNOWN, 0.0


class HandReader(object):
    """Camera frame (BGR) -> (label, confidence 0..1, hand landmarks or None).

    stream=True tracks the hand from frame to frame (faster and steadier on video);
    stream=False treats every picture on its own (for testing on photos).
    """

    def __init__(self, stream=True, model_file=MODEL_FILE):
        import mediapipe as mp
        self._mp = mp
        vision = mp.tasks.vision
        self._stream = stream
        self._started = time.time()
        self._last_ms = -1
        self._recognizer = vision.GestureRecognizer.create_from_options(vision.GestureRecognizerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=model_file),
            running_mode=vision.RunningMode.VIDEO if stream else vision.RunningMode.IMAGE,
            num_hands=1))

    def read(self, bgr):
        detail = self.read_detail(bgr)
        if detail is None:
            return "none", 0.0, None
        label, confidence = combine(*(detail["trained"] + detail["geometric"]))
        return label, confidence, detail["landmarks"]

    def read_detail(self, bgr):
        """None if no hand, else {"trained": (label, score), "geometric": (label, score), "landmarks": ...}."""
        height, width = bgr.shape[:2]
        rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        image = self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=rgb)
        if self._stream:
            # Video mode needs a strictly increasing timestamp for every frame.
            now_ms = max(int((time.time() - self._started) * 1000), self._last_ms + 1)
            self._last_ms = now_ms
            found = self._recognizer.recognize_for_video(image, now_ms)
        else:
            found = self._recognizer.recognize(image)
        if not found.hand_landmarks:
            return None

        trained, trained_score = gesture.UNKNOWN, 0.0
        if found.gestures and found.gestures[0]:
            best = found.gestures[0][0]
            trained = TRAINED_TO_GAME.get(best.category_name, gesture.UNKNOWN)
            trained_score = float(best.score) if trained != gesture.UNKNOWN else 0.0
        # Two views of the same hand: metric 3D points centred on the hand, and its position in
        # the picture in pixels (so that x and y are in the same unit).
        world = np.array([(p.x, p.y, p.z) for p in found.hand_world_landmarks[0]])
        flat = np.array([(p.x * width, p.y * height) for p in found.hand_landmarks[0]])
        return {"trained": (trained, trained_score), "geometric": gesture.classify(world, flat),
                "landmarks": found.hand_landmarks[0]}

    def draw(self, bgr, landmarks):
        height, width = bgr.shape[:2]
        pixels = [(int(p.x * width), int(p.y * height)) for p in landmarks]
        for a, b in gesture.HAND_BONES:
            cv2.line(bgr, pixels[a], pixels[b], (0, 255, 0), 2)
        for x, y in pixels:
            cv2.circle(bgr, (x, y), 3, (0, 0, 255), -1)

    def close(self):
        self._recognizer.close()


def decode_frame(fmt, width, height, payload):
    if fmt == protocol.FMT_JPEG:
        return cv2.imdecode(np.frombuffer(payload, np.uint8), cv2.IMREAD_COLOR)
    if fmt == protocol.FMT_ZLIB_BGR:
        return np.frombuffer(zlib.decompress(payload), np.uint8).reshape(height, width, 3)
    return None


def recv_exact(sock, count):
    chunks = []
    while count:
        chunk = sock.recv(count)
        if not chunk:
            raise EOFError("connection closed")
        chunks.append(chunk)
        count -= len(chunk)
    return b"".join(chunks)


def serve(sock, reader, show=False, log=print):
    """Answer frames on one connection until it closes."""
    pending = collections.deque()
    ready = threading.Condition()
    state = {"closed": False, "received": 0}

    def receive():
        try:
            while True:
                fmt, seq, width, height, length = protocol.FRAME_HEADER.unpack(recv_exact(sock, protocol.FRAME_HEADER.size))
                payload = recv_exact(sock, length)
                with ready:
                    pending.append((fmt, seq, width, height, payload))
                    state["received"] += 1
                    ready.notify()
        except (EOFError, OSError):
            pass
        with ready:
            state["closed"] = True
            ready.notify()

    threading.Thread(target=receive, daemon=True).start()

    stats_from = time.time()
    received_before = classified = skipped = 0
    busy = 0.0
    last = ("none", 0.0)
    try:
        while True:
            with ready:
                while not pending and not state["closed"]:
                    ready.wait(0.5)
                if not pending and state["closed"]:
                    return
                frames = list(pending)
                pending.clear()

            # If frames arrived faster than they can be read, only the newest matters: answering
            # old ones late would make Pepper's picture of the hand lag behind.
            for stale in frames[:-1]:
                sock.sendall(protocol.RESULT.pack(stale[1], protocol.CODE["skipped"], 0))
                skipped += 1
            fmt, seq, width, height, payload = frames[-1]

            started = time.time()
            image = decode_frame(fmt, width, height, payload)
            if image is None:
                label, confidence, landmarks = "none", 0.0, None
            else:
                label, confidence, landmarks = reader.read(image)
            sock.sendall(protocol.RESULT.pack(seq, protocol.CODE[label], int(round(confidence * 100))))
            busy += time.time() - started
            classified += 1
            last = (label, confidence)

            if show and image is not None:
                view = image.copy()
                if landmarks is not None:
                    reader.draw(view, landmarks)
                cv2.putText(view, "%s %d%%" % (label, confidence * 100), (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.imshow("Pepper's camera", view)
                cv2.waitKey(1)

            elapsed = time.time() - stats_from
            if elapsed >= 2.0:
                received = state["received"] - received_before
                log("  %4.1f frames/s in, %4.1f classified/s (%d skipped), %4.1f ms per frame, sees: %s %d%%" % (
                    received / elapsed, classified / elapsed, skipped,
                    1000.0 * busy / max(classified, 1), last[0], last[1] * 100))
                stats_from = time.time()
                received_before = state["received"]
                classified = skipped = 0
                busy = 0.0
    finally:
        if show:
            cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="Hand-shape server for Pepper's camera Rock Paper Scissors.")
    parser.add_argument("--robot", default="10.10.42.150", help="Pepper's IP address (default: %(default)s)")
    parser.add_argument("--port", type=int, default=protocol.PORT, help="port the UC06 box listens on (default: %(default)s)")
    parser.add_argument("--show", action="store_true", help="show Pepper's camera with the detected hand in a window")
    args = parser.parse_args()

    print("Loading the hand model...")
    reader = HandReader()
    reader.read(np.zeros((240, 320, 3), np.uint8))   # first call loads the model; do it before the game needs it
    print("Ready. Looking for Pepper at %s:%d (start the UC06 behavior; Ctrl+C to quit)." % (args.robot, args.port))

    waiting_printed = turned_away_printed = False
    while True:
        try:
            sock = socket.create_connection((args.robot, args.port), timeout=3)
        except OSError:
            if not waiting_printed:
                print("Waiting for the UC06 behavior to start on Pepper...")
                waiting_printed = True
            time.sleep(1.0)
            continue
        waiting_printed = False
        sock.settimeout(None)
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)   # results are tiny: send them at once
        connected_at = time.time()
        try:
            sock.sendall(protocol.HELLO)
            if not turned_away_printed:
                print("Connected to Pepper. Frames arrive while a Rock Paper Scissors game is running.")
            serve(sock, reader, args.show)
        except OSError as error:
            print("Connection error: %s" % error)
        finally:
            sock.close()
        if time.time() - connected_at < 1.5:
            # Pepper closed the connection straight away: it keeps the hand-shape server it already has.
            if not turned_away_printed:
                print("Pepper is already connected to another hand-shape server. Close the other server window;\n"
                      "this one keeps trying and takes over when the other one is closed.")
                turned_away_printed = True
            time.sleep(3.0)
            continue
        turned_away_printed = False
        print("Disconnected from Pepper. Reconnecting...")
        time.sleep(1.0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
