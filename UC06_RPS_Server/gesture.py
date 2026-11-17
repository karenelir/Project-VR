"""Rock / paper / scissors from 21 hand landmarks (MediaPipe Hands layout).

No training data. A finger counts as extended when its tip reaches well beyond its knuckle,
measured from the wrist:

    reach = distance(wrist, fingertip) / distance(wrist, knuckle)

A curled finger's tip folds back towards the palm (reach about 0.8-1.3); an extended finger's
tip is far out (about 1.6-2.1). The ratio does not depend on where the hand is in the picture,
how big it is, or how it is rotated.

Reach is measured twice: in the flat picture, and in MediaPipe's 3D "world" landmarks. The flat
one is the most reliable when the hand is seen from the front or the back; the 3D one still
works when the fingers point towards the camera and look short in the picture. A finger is
extended if either says so.

    rock      no finger extended
    paper     at least three of index / middle / ring / pinky extended
    scissors  index and middle extended, ring and pinky curled

The thumb is ignored: people hold it in or out with every one of the three shapes.
"""
import numpy as np

ROCK, PAPER, SCISSORS, UNKNOWN = "rock", "paper", "scissors", "unknown"

WRIST = 0
# MediaPipe landmark indexes: finger -> (knuckle, tip)
FINGERS = {"index": (5, 8), "middle": (9, 12), "ring": (13, 16), "pinky": (17, 20)}
FINGER_ORDER = ("index", "middle", "ring", "pinky")

# Landmark pairs that make up the hand's skeleton, for drawing it.
HAND_BONES = ((0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (7, 8), (5, 9), (9, 10), (10, 11), (11, 12),
              (9, 13), (13, 14), (14, 15), (15, 16), (13, 17), (17, 18), (18, 19), (19, 20), (0, 17))

# Reach above which a finger is extended, and how far past it counts as fully certain.
# Measured on 369 labelled hands: curled fingers stay below 1.10 (flat) / 1.40 (3D),
# extended fingers start at 1.60 in both.
FLAT_EXTENDED_AT, FLAT_CERTAIN = 1.35, 0.25
WORLD_EXTENDED_AT, WORLD_CERTAIN = 1.50, 0.12


def _reach(points, dims):
    points = np.asarray(points, dtype=float)[:, :dims]
    out = {}
    for name, (knuckle, tip) in FINGERS.items():
        base = np.linalg.norm(points[knuckle] - points[WRIST])
        out[name] = float(np.linalg.norm(points[tip] - points[WRIST]) / base) if base > 1e-9 else 0.0
    return out


def finger_scores(world_points, image_points=None):
    """{finger: score}, above 0 = extended, below 0 = curled, clipped to -1..1 (how clear it is).

    world_points: (21, 3) metric landmarks. image_points: (21, 2+) landmarks in pixels (so that x and y
    use the same unit), or None to use the 3D landmarks only.
    """
    world = _reach(world_points, 3)
    flat = _reach(image_points, 2) if image_points is not None else None
    scores = {}
    for name in FINGER_ORDER:
        score = (world[name] - WORLD_EXTENDED_AT) / WORLD_CERTAIN
        if flat is not None:
            score = max(score, (flat[name] - FLAT_EXTENDED_AT) / FLAT_CERTAIN)
        scores[name] = float(np.clip(score, -1.0, 1.0))
    return scores


def classify(world_points, image_points=None):
    """Returns (label, confidence 0..1) for one hand."""
    scores = finger_scores(world_points, image_points)
    extended = [scores[f] > 0 for f in FINGER_ORDER]
    clarity = [abs(scores[f]) for f in FINGER_ORDER]
    index, middle, ring, pinky = extended
    count = sum(extended)

    if count == 0:
        return ROCK, min(clarity)
    if index and middle and not ring and not pinky:
        return SCISSORS, min(clarity)
    if count >= 3:
        # With exactly three, the odd finger out does not weaken the call.
        clear = sorted(clarity, reverse=True)[:3] if count == 3 else clarity
        return PAPER, min(clear)
    return UNKNOWN, 0.0
