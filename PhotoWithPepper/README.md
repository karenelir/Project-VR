# Photo with Pepper - Christmas edition (standalone)

The photo part of UC05 as its own Choregraphe project. Open `PhotoWithPepper.pml` in Choregraphe and press Play.

## Christmas theme

- Every tablet page: festive red / green / gold colours, falling snow and a string of twinkling Christmas lights
  (`html/css/xmas.css` + `html/js/xmas.js`, added at the end of each page).
- Original cartoon illustrations (`html/pics/xmas/`, SVG + PNG): a cute Santa Claus, a reindeer, a snowman, a Christmas tree with presents, and a Santa hat on the corner of the photo frame.
- Decorations on every page: snow, twinkling lights with hanging ornaments, holly in the corners, a snowy ground with little trees.
- Pepper only starts talking once the new page is really on the tablet: every page raises the ALMemory event `pageReady` when it has loaded (`html/js/xmas.js`), and the boxes wait for it (max 2.5 s).
- Pepper's eyes: one red, one green. Christmas lines ("Ho ho ho! Merry Christmas!", "Say Merry Christmas!").
- Poses: The Santa (waving high), The Reindeer (arms up like antlers), The Snowman (both arms straight out to the front), The Christmas Hug.
- During selfies the tablet shows the picture that matches the pose (Santa, reindeer, snowman or tree), so it shows in the photos. No venue logo anywhere.
- Sounds: Jingle Bells during the photo countdown, and sleigh bells (`sounds/bells.ogg`, synthesized) when the photo is taken and when Pepper freezes in a pose.
- Music: "Jingle Bells" - the 1857 melody is public domain; `sounds/jingle_short.ogg` (start) and `sounds/jingle.ogg`
  (goodbye) were synthesized for this project, so there is no copyright issue.
- Tip: a real Santa hat on Pepper's head makes the selfies even better (keep it light and away from the cameras in the eyes and mouth).

## Flow (behavior_1): 6 boxes

| # | Box | Tablet buttons | Goes to |
|---|---|---|---|
| 1 | Init | - | 2 |
| 2 | **Ask: Christmas photo?** (`photoask.html`, giant buttons for kids) | YES / NO (or say "yes", "no", "selfie", "you take it") | 3 / 6 / 5 / 4 |
| 3 | **Ask: Who takes the photo?** | Pepper takes the picture · Selfie with Pepper · ← Back · No photo, finish → | 4 / 5 / 2 / 6 |
| 4 | Pepper Takes the Picture | ↻ **Retake photo** (deletes it, new countdown) · ← Photo options · Finish → | 4 again / 3 / 6 |
| 5 | Selfie with Pepper (poses) | 4 Christmas poses · ← Back to photo options · Finish → | 3 / 6 |
| 6 | **Ask: Goodbye (more photos?)** | ← Take more photos · Finish → (Jingle Bells plays) | 3 / end |

Boxes 2, 3 and 6 are the same reusable **Ask on Tablet** box with different parameters:
`Page`, `Query`, `Say` (what Pepper says), `Taps` (tablet event=output), `Words` (spoken words=output),
`Replies` (output=what Pepper answers), `Sound`, `If nobody answers (s)`, `Timeout output`.
To add another question, copy one of these boxes, add outputs in Choregraphe, and change the parameters.
The first tap or spoken answer wins; a tap interrupts Pepper's sentence.

On the virtual robot (no tablet, no speech recognition) each Ask box uses its `Timeout output` after 5 s.
To test a path there, set it, e.g. `yes` on "Ask: Christmas photo?" and `selfie` on "Ask: Who takes the photo?".

## QR code

When Pepper takes the picture, the photo is saved in the app (`html/pics/photos/`) and a QR code appears next to it.
The QR code opens a Christmas page on Pepper's own web server (`html/pages/myphoto.html`): the photo in a candy-cane frame with a Santa hat, snow, lights, the date and a **Save my photo** button. Link: `http://<Pepper's Wi-Fi IP>/apps/<app id>/pages/myphoto.html?p=team_<time>.jpg`.

- The phone must be on **the same Wi-Fi as Pepper**. The photo never leaves the local network.
- Pepper's Wi-Fi IP is detected automatically. If the QR code does not appear, press Pepper's chest button (it says its IP)
  and type it in the **Robot Wi-Fi IP (optional)** parameter of the "Pepper Takes the Picture" box.
- `Show QR code` turns the QR code on/off. On the virtual robot there is no camera, so there is no photo and no QR code.
- QR codes are drawn on the tablet by `html/js/qrcode.js` (qrcode-generator by Kazuhiko Arase, MIT license), so no internet is needed.

## Settings

- Choose Photo Mode: `Wait for a choice (s)` (45), `If nobody chooses` (tablet / selfie, also used on the virtual robot).
- Pepper Takes the Picture: `Show QR code`, `Robot Wi-Fi IP (optional)`, `Show photo for (s)` (90), camera and resolution.
- Selfie with Pepper: `Hold pose (s)` (10), `Wait for a choice (s)` (60).

## Testing on the virtual robot

Press Play, type `yes` in the Dialog panel. With no tablet, Choose Photo Mode picks `If nobody chooses` after 45 s
(set it to `selfie` to test the poses path, or type `selfie` / `you take it` instead of `yes`).
