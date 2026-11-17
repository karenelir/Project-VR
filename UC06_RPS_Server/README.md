# Hand-shape server for Pepper's camera Rock Paper Scissors (UC06)

In UC06 Waiting Room, Rock Paper Scissors is played with a real hand in front of Pepper's eyes.
Pepper cannot run the hand detection itself, so it sends its camera frames to this program on a PC.

```
Pepper (box "Rock Paper Scissors Camera")                 PC (rps_server.py)
  head camera, 320x240, 30 frames/s
  JPEG-compress each frame (12 KB instead of 225 KB)  -->  MediaPipe finds the hand (21 points)
                                                           rock / paper / scissors from the fingers
  vote over the frames after "Shoot!"                 <--  6-byte answer per frame
  score, tablet display, Pepper's reactions
```

## Run it

1. Start the UC06 behavior on Pepper (Choregraphe).
2. Double-click `start_server.bat`, or with another robot address: `start_server.bat 10.10.42.150`.
   The server connects to Pepper and reconnects by itself whenever the behavior is restarted.
3. On the tablet: Play a Game, then Rock Paper Scissors. Hold your hand up in front of Pepper's eyes
   and show your move when Pepper says "Shoot!".

If the server is not running, the tablet falls back to the tap-to-play version by itself.

`python rps_server.py --robot <ip> --show` also opens a window with what Pepper's camera sees.

## Try it without the robot

`.venv\Scripts\python.exe webcam_demo.py` reads this PC's webcam through the same detection code,
at Pepper's resolution and compression.

## Files

| File | What it is |
|---|---|
| `rps_server.py` | The server: connects to Pepper, reads each frame, answers with the hand shape. |
| `gesture.py` | Rock / paper / scissors from the 21 hand points (finger-reach rules, no training). |
| `protocol.py` | The message format shared with the box on Pepper. |
| `gesture_recognizer.task` | Google's MediaPipe hand model (detector, 21-point tracker, trained gesture classifier). |
| `evaluate.py` | Measures the detection on a folder of labelled pictures. |
| `webcam_demo.py` | Live test with the PC's webcam. |
| `start_server.bat` | Starts the server with the environment in `.venv`. |

## How a hand shape is decided

Two answers are combined for every frame:

- MediaPipe's trained gesture classifier (closed fist, open palm, victory sign).
- Finger rules in `gesture.py`: a finger is extended when its tip is far from the wrist compared
  with its knuckle. No finger extended is rock, index and middle only is scissors, three or more is paper.

They usually agree. If only one of them recognises a shape, that one is used; if they contradict
each other, the more confident one wins.

Pepper then takes a vote over the newest 20 frames after "Shoot!" (about 0.7 seconds), so one
misread frame does not decide a round.

## Measured

- On Pepper: 25.8 frames/s when capturing and compressing in one loop at 320x240 (10.2 at 640x480).
  The box does the two in separate threads to get closer to the camera's 30 frames/s; that reached
  30 with a simulated camera, and is not yet measured on the robot (the box logs its rate after each match).
- Detection on Google's rock-paper-scissors test set (372 pictures): 98.9 % of single pictures
  correct at full size, 99.2 % at Pepper's 320x240 with JPEG compression. The two thresholds in
  `gesture.py` were set on these same pictures.
- Server speed on a laptop CPU (Intel i7-8650U): 25 to 40 ms per frame, about 30 frames/s.

## Set up on another PC

Python 3.12, then in this folder:

```
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

`gesture_recognizer.task` comes from
https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/latest/gesture_recognizer.task
