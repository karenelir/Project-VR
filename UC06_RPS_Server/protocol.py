"""Wire format shared by Pepper (the "Rock Paper Scissors Camera" box in UC06) and this server.

Pepper opens PORT and waits. The server connects to it and sends HELLO. From then on:

    Pepper -> server   FRAME_HEADER + payload     one compressed camera frame
    server -> Pepper   RESULT                     6 bytes: what the hand in that frame shows

All integers are big-endian. The same numbers are written into the box script in
UC06_WaitingRoom/behavior_1/behavior.xar - change both together.
"""
import struct

PORT = 5065
HELLO = b"RPS1"

FRAME_HEADER = struct.Struct("!BIHHI")   # format, frame number, width, height, payload bytes
FMT_JPEG = 1                             # payload is a JPEG file
FMT_ZLIB_BGR = 2                         # payload is zlib-compressed raw BGR (if Pepper has no OpenCV)

RESULT = struct.Struct("!IBB")           # frame number, label code, confidence 0..100
LABELS = ("none", "rock", "paper", "scissors", "unknown", "skipped")
CODE = dict((name, code) for code, name in enumerate(LABELS))
