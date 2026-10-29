# UC05 - Celebrate with the User

Choregraphe project for Pepper, built the same way as `UC02_ChooseGame`: Say boxes, qichat dialog boxes,
Python "Show Web View" boxes and tablet pages that send taps back as ALMemory events (`html/js/qievents.js`
from the course template). Open `UC05_CelebrateWithTheUser.pml` in Choregraphe.

## Flow (behavior_1)

| Use case | Box(es) | Tablet page |
|---|---|---|
| Step 1 - close the session | Init → Close Session (step 1) | `closing.html` |
| PRECOND-2 - get the result | Get Game Result | `staffresult.html` (only if needed) |
| Step 2 - personalized reaction | Celebrate Result (step 2) | `result.html` (confetti on a win) |
| 2a - no result | Generic Closing (2a) | `result.html?outcome=none` |
| Steps 3-4 - team photo | Ask Photo (step 3) → photo_d → Take Team Photo (step 4) | `confirmation.html`, `countdown.html`, `photo.html` |
| 3a - photo declined | photo_d.photoDeclined → Ask Rating (no second invitation) | - |
| Step 5 - rating 1-10 | Ask Rating (step 5) → rating_d → Save Rating | `rating.html` |
| 6a - high / neutral rating | rating_d `%highRating` (7-10), `%okRating` (5-6) | - |
| 6b - low rating (1-4) | rating_d `%lowRating` → one follow-up question | `improve.html` |
| 5a - rating declined | rating_d `~declineRating` / `e:ratingDeclined` | - |
| Step 7 - farewell | Farewell (step 7) | `goodbye.html` |

## Where the result comes from (Get Game Result box parameters)

Result format: `outcome|game|score|team` where outcome is `win`, `lose` or `tie` (tie = tie or mixed group scores).

1. **Venue system / API**: writes the ALMemory key `UC05/GameResult` (e.g. `win|Outbreak|8200|Night Owls`) then starts the behavior. The key is cleared once it has been used.
2. **Simulated** (prototype, use case assumption): the `Simulated result` parameter. Default `win|Outbreak|8200|`. Choose `lose|...` or `tie|...` to test the other reactions, `none` to test extension 2a, `off` to turn simulation off.
3. **Manual staff input**: if nothing above gave a result and `Use staff input` is checked, Pepper shows `staffresult.html`. Staff tap outcome + game (+ score, team name) or "No result". After `Staff timeout (s)` with no answer, Pepper continues with 2a.

## Design choices tied to the requirements

- **Positive wording whatever the score**: a low score is never said aloud or shown on the tablet. Pepper praises teamwork and teases the game's enemies (zombies, pirates, aliens) instead.
- **Open issue (ties / mixed scores)**: the whole group is praised together and no player is singled out.
- **Rating input**: tablet buttons 1-10, or speech ("seven", "I'd give it eight out of ten"). Values go to ALMemory `UC05/LastRating` / `UC05/LastFeedback` and to `~/uc05_ratings.csv` on the robot.
- **Camera (optional module)**: `ALPhotoCapture` saves the photo to `html/pics/photos/` and the tablet shows it. On the virtual robot the camera is simulated: a placeholder is shown and the flow carries on.
- **Applause**: `sounds/applause.ogg` comes from the course template EX03 (Three Musketeers).

## Testing on the virtual robot

Run it with the default parameters (win). Then change `Simulated result` on the Get Game Result box to `lose|Far Cry|1450|`, `tie|Space Marines|5000|` and `none`. In the Dialog panel, type `yes` / `no` for the photo, then a number (`three` gives the low-rating follow-up, `nine` gives the thank you) or `no thanks`.
Tablet pages can be opened in a desktop browser from `html/pages/` to check their layout (tablet events need the real robot).
