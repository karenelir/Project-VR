"""Measure the hand-shape detection on a folder of labelled pictures.

    python evaluate.py <folder>            # <folder>/rock/*.png, <folder>/paper/*.png, <folder>/scissors/*.png
    python evaluate.py <folder> --pepper   # first shrink each picture to Pepper's 320x240 and JPEG-compress it

Prints the accuracy of the trained classifier alone, the finger geometry alone, and the two combined
(what the server uses), plus the time per picture.
"""
import argparse
import glob
import os
import time

import cv2
import numpy as np

import gesture
import rps_server

SHAPES = (gesture.ROCK, gesture.PAPER, gesture.SCISSORS)


def as_pepper_sees_it(image, quality=75):
    """Letterbox into a 320x240 frame and JPEG-compress, like a frame from the robot."""
    height, width = image.shape[:2]
    scale = min(320.0 / width, 240.0 / height)
    small = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
    frame = np.full((240, 320, 3), 255, np.uint8)
    y, x = (240 - small.shape[0]) // 2, (320 - small.shape[1]) // 2
    frame[y:y + small.shape[0], x:x + small.shape[1]] = small
    ok, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return cv2.imdecode(jpeg, cv2.IMREAD_COLOR)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("folder")
    parser.add_argument("--pepper", action="store_true", help="test at Pepper's resolution and compression")
    args = parser.parse_args()

    reader = rps_server.HandReader(stream=False)
    totals = dict((name, {"right": 0, "wrong": 0, "unsure": 0}) for name in ("trained", "geometry", "combined"))
    confusion = {}
    count = no_hand = 0
    spent = 0.0

    for truth in SHAPES:
        for path in sorted(glob.glob(os.path.join(args.folder, truth, "*"))):
            image = cv2.imread(path)
            if image is None:
                continue
            if args.pepper:
                image = as_pepper_sees_it(image)
            count += 1
            started = time.time()
            detail = reader.read_detail(image)
            answers = {"trained": gesture.UNKNOWN, "geometry": gesture.UNKNOWN, "combined": gesture.UNKNOWN}
            if detail is not None:
                answers = {"trained": detail["trained"][0], "geometry": detail["geometric"][0],
                           "combined": rps_server.combine(*(detail["trained"] + detail["geometric"]))[0]}
            else:
                no_hand += 1
            spent += time.time() - started
            for name, answer in answers.items():
                key = "right" if answer == truth else "unsure" if answer == gesture.UNKNOWN else "wrong"
                totals[name][key] += 1
            confusion[(truth, answers["combined"])] = confusion.get((truth, answers["combined"]), 0) + 1

    print("%d pictures%s, hand found in %d (%.1f%%), %.1f ms per picture" % (
        count, " at 320x240 JPEG" if args.pepper else "", count - no_hand, 100.0 * (count - no_hand) / max(count, 1),
        1000.0 * spent / max(count, 1)))
    for name in ("trained", "geometry", "combined"):
        t = totals[name]
        print("  %-9s right %5.1f%%   wrong %5.1f%%   no answer %5.1f%%" % (
            name, 100.0 * t["right"] / count, 100.0 * t["wrong"] / count, 100.0 * t["unsure"] / count))
    print("  combined, by true shape:")
    for truth in SHAPES:
        row = ", ".join("%s %d" % (answer, confusion.get((truth, answer), 0)) for answer in SHAPES + (gesture.UNKNOWN,))
        print("    %-9s -> %s" % (truth, row))


if __name__ == "__main__":
    main()
