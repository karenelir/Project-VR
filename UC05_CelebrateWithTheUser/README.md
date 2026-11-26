# UC05 - Celebrate with the User

Choregraphe project for Pepper, built the same way as `UC02_ChooseGame`: Say boxes, qichat dialog boxes,
Python "Show Web View" boxes and tablet pages that send taps back as ALMemory events (`html/js/qievents.js`
from the course template). Open `UC05_CelebrateWithTheUser.pml` in Choregraphe.

## Flow (behavior_1): 10 boxes

| Use case | Box | Tablet |
|---|---|---|
| Step 1 - close the session | Close Session (step 1) | `closing.html` |
| PRECOND-2 - get the result | Get Game Result: **score server on the venue PC** (`/api/scores`) | `staffresult.html` (only if the server gives nothing) |
| Step 2 - result, victory dance, personalized reaction / 2a - no result | Celebrate Result (step 2): input `onResult` or `onNoResult` | `result.html` |
| Step 3 - team photo? / 3a - declined | Ask: Team photo? (step 3) | `confirmation.html` |
| Step 4 - who takes the photo | Ask: Who takes the photo? (step 4) | `photomode.html` |
| Step 4a - Pepper takes the picture (+ QR code) | Take Team Photo (step 4) | `countdown.html`, `photo.html` |
| Step 4b - selfie with Pepper | Strike a Pose (step 4) | `posechoice.html`, `photologo.html` |
| Steps 5-6 - 5-star rating, 6a replies / 5a declined | Rating (steps 5-6) - also saves the rating | `rating.html` |
| 6b - low rating follow-up | Ask Improvement (6b) - also saves the idea | `improve.html` |
| Step 7 - farewell | Farewell (step 7) | `goodbye.html` |

Reusable boxes:
- **Say with Tablet** (Close Session, Farewell): `Page`, `Query`, `Text`, `Stand up first`.
- **Ask on Tablet** (Team photo?, Who takes the photo?): `Page`, `Query`, `Say`, `Taps` (tablet event=output),
  `Words` (spoken words=output), `Replies` (output=Pepper's answer), `If nobody answers (s)`, `Timeout output`.
  The first tap or spoken answer wins and interrupts Pepper's sentence.

The yes/no photo question and the rating are recognized with Pepper's speech recognition (same words and replies
as the old `photo_d` / `rating_d` dialogs, which are no longer needed).
On the virtual robot (no tablet / speech recognition) the Ask boxes use their `Timeout output` after 5 s.

## Where the result comes from (Get Game Result box parameters)

Pepper tries these sources in order and uses the first one that works:

1. **Score server on the venue PC** (`app.py`, endpoint `/api/scores`, reads `scores.csv`).
   - `Server URL`: `http://<IP of the laptop running app.py>:5000/api/scores` (default `http://10.10.42.225:5000/api/scores`). Empty or `off` = not used.
   - `Session ID`: optional, empty = the latest session in `scores.csv`.
   - `Server timeout (s)`: 5 by default. If the server is off, unreachable, answers 404 or has no player scores, Pepper moves on to the next source (the reason is in the Choregraphe log).
   - The server answer gives the game, outcome (`win`, `lose`, `tie`, or `played` when the CSV has no outcome), team, team score and every player's name and score.
2. **ALMemory** key `UC05/GameResult` (`outcome|game|score|team`), if another program writes it. Cleared once used.
3. **Simulated** (testing without the PC): `Simulated result`, default `off`. Choose `win|Outbreak|8200|`, `lose|...`, `tie|...` or `none` (extension 2a).
4. **Manual staff input**: if `Use staff input` is checked, Pepper says it could not get the scores and shows `staffresult.html`. Staff tap outcome + game (+ score, team name) or "No result". After `Staff timeout (s)` with no answer, Pepper continues with 2a.

Result passed to Celebrate Result: `outcome|game|score|team|players` (players = JSON list, empty for staff / simulated results).

### Score server on another laptop

Any laptop works if it is on the **same Wi-Fi / network as Pepper**:
1. Run `app.py` on that laptop (its `scores.csv` is in `%LOCALAPPDATA%\ZeroLatencyCheckIn\` on Windows).
2. Find its IP (`ipconfig` on Windows, "IPv4 Address") and put it in `Server URL`. The IP can change when the laptop reconnects: check it before a demo.
3. Allow TCP port 5000 in the laptop's firewall (click "Allow" when Windows asks the first time).
4. Test: open `http://<laptop IP>:5000/api/scores` in a browser on another device on the same Wi-Fi. If you see the scores, Pepper can reach them too.

### The result screen

`result.html` shows the title for the outcome, the game, the **team total** (from the server or the sum of the player scores; not shown for a low score) and a **player scores** list: 1 column up to 4 players, 2 columns up to 10, 3 columns above, so it always fits on the tablet. Pepper then reads every player's name and score (`Read player scores` = `always` / `never` on Celebrate Result). Names are cleaned before Pepper reads them, and accents (e.g. Élie) are supported.

## Design choices tied to the requirements

- **Positive wording whatever the score**: the team total of a low score is never said aloud or shown (each player's own score from the server is still listed, as the team asked). Pepper praises teamwork and teases the game's enemies (zombies, pirates, aliens) instead.
- **Open issue (ties / mixed scores)**: the whole group is praised together and no player is singled out.
- **Rating input**: 5 tappable stars on the tablet, or speech ("four", "five stars", "I'd give it three out of five"). The use case says 1-to-10; the team changed it to 5 stars for a quicker, friendlier rating. Values go to ALMemory `UC05/LastRating` / `UC05/LastFeedback` and to `~/uc05_ratings.csv` on the robot.
- **Camera (optional module)**: `ALPhotoCapture` saves the photo to `html/pics/photos/` and the tablet shows it. On the virtual robot the camera is simulated: a placeholder is shown and the flow carries on.
- **QR code**: next to Pepper's photo, linking to `http://<Pepper's Wi-Fi IP>/apps/<app id>/pics/photos/...` on Pepper's own web server. The phone must be on the same Wi-Fi as Pepper. The IP is detected automatically; if the QR code does not appear, type Pepper's IP in `Robot Wi-Fi IP (optional)` on the Take Team Photo box. Drawn by `html/js/qrcode.js` (qrcode-generator, MIT), no internet needed.
- **Applause**: `sounds/applause.ogg` comes from the course template EX03 (Three Musketeers).
- **Pose with Pepper**: the tablet shows 4 poses (The Champion, The Superstar, The Cool Robot, The Group Hug). The group taps one, the tablet switches to the Zero Latency logo, and Pepper freezes in that pose (breathing and idle moves off) for `Hold pose (s)` (default 10) while the group takes photos with their phones. Then the choices come back with "Back to photo options" and "Continue to rating". No choice for `Wait for a choice (s)` (default 60) ends the photo shoot.
- **Recommendations after a low rating**: Pepper waits on `improve.html` until the group taps an idea, says one, or says skip. Unclear speech or silence only makes Pepper ask again.
- **Tone**: the lines are playful (robot jokes about the vacuum cleaner, expensive hands, not having skin), but never at the players' expense, as the requirements ask.
- **Victory dance**: as soon as the result is on the tablet, Pepper dances for about 10 seconds, ending with a bow. The moves and music are a 10 s excerpt of the course template EX01 (Date Dance): timeline frames 2250-2500 and `sounds/dance.ogg`. The `Dance on` parameter of the Celebrate Result box chooses when Pepper dances: `all results` (default), `win, tie and played`, `win and tie`, `win only` or `never`.

## Testing on the virtual robot

Without the PC server, set `Simulated result` on the Get Game Result box to `win|Outbreak|8200|`, `lose|Far Cry|1450|`, `tie|Space Marines|5000|` or `none` (the server is tried first, then the simulation). The virtual robot has no tablet and no speech recognition: set `Timeout output` on the Ask boxes (e.g. `yes`, then `selfie`) to test a path; the rating then goes to the farewell after its wait.
Tablet pages can be opened in a desktop browser from `html/pages/` to check their layout (tablet events need the real robot).
