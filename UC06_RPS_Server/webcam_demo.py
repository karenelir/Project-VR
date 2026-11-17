"""Try the hand-shape detection with this PC's webcam, without the robot.

    python webcam_demo.py

Each webcam frame is shrunk to Pepper's 320x240 and JPEG-compressed like a frame from the robot,
then read by the same code the server uses. The window shows the hand skeleton and the detected
shape. Press Q or Esc to quit.
"""
import time

import cv2

import rps_server


def main():
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("No webcam found.")
        return
    reader = rps_server.HandReader()
    frames, started, rate = 0, time.time(), 0.0
    print("Show rock, paper or scissors to the webcam. Press Q or Esc in the window to quit.")
    while True:
        ok, frame = camera.read()
        if not ok:
            break
        small = cv2.resize(frame, (320, 240), interpolation=cv2.INTER_AREA)
        ok, jpeg = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 75])
        seen = cv2.imdecode(jpeg, cv2.IMREAD_COLOR)

        label, confidence, landmarks = reader.read(seen)
        if landmarks is not None:
            reader.draw(seen, landmarks)

        frames += 1
        if time.time() - started >= 1.0:
            rate, frames, started = frames / (time.time() - started), 0, time.time()
        view = cv2.resize(seen, (960, 720), interpolation=cv2.INTER_NEAREST)
        cv2.putText(view, "%s  %d%%" % (label, confidence * 100), (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0, 255, 0), 3)
        cv2.putText(view, "%.0f frames/s" % rate, (20, 700), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.imshow("Rock Paper Scissors - what the server sees", view)
        if cv2.waitKey(1) & 0xFF in (ord("q"), 27):
            break
    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
