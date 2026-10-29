# UC01 - Welcome the Customer

Choregraphe project for Pepper, built the same way as `UC02_ChooseGame` and `UC05_CelebrateWithTheUser`
(Say boxes, a qichat dialog box, Python "Show Web View" boxes, tablet pages sending taps back as
ALMemory events through the course template's `html/js/qievents.js`).
Open `UC01_WelcomeTheCustomer.pml` in Choregraphe.

## Flow (behavior_1)

| Use case | Box(es) | Tablet page |
|---|---|---|
| PRECOND-1 - idle in reception | Init (stand, basic awareness on) | `welcome.html` (attract screen) |
| Step 1 - detect a customer | Wait For Customer (step 1) | `welcome.html` switches to "Hello!" |
| Step 2 - welcome + introduce itself | Welcome (step 2), with a wave | - |
| Step 3 - first time? | Ask First Time (step 3) | `visitor.html` (Yes / No buttons) |
| 3a / 3a1 - group | Welcome Group (3a) → Ask Group (3a1) | `visitor.html`, group version with "Some of us" |
| Step 4 / 3a2 - answer | visitor_d → Save Visitor Status | - |
| 4a - answer not recognized | visitor_d `e:Dialog/NotUnderstood` → asks again + highlights the buttons | `visitor.html?hint=1` |
| 5a - new customer | New Customer Intro (5a) | `newvisitor.html` |
| 5b - returning customer | Welcome Back (5b) | `welcomeback.html` |
| Open issue - conflicting group answers | Mixed Group Welcome → New Customer Intro | `newvisitor.html?mixed=1` |

## Detection (Wait For Customer box)

- **Real robot**: waits for `EngagementZones/PersonEnteredZone1`, `PersonEnteredZone2` or `PersonApproached`
  (ALPeoplePerception), then counts the people in zones 1 and 2. 2 or more people means a group (extension 3a).
- **Tablet fallback**: "Tap to start" on the welcome screen.
- **Virtual robot** (no camera / no tablet): detection is simulated after 3 seconds.
  `Simulated people count` = 1 tests the single customer, 2 or more tests the group path.
  `Simulate detection after (s)` > 0 forces simulation on the real robot too.

## Postconditions

- **POSTCOND-1**: the visitor status is stored in ALMemory `UC01/VisitorStatus` (`new`, `returning` or `mixed`)
  together with `UC01/GroupSize`, so the next use case can read it.
- **POSTCOND-2**: both endings finish with "let's get you checked in" and the behavior ends (next: UC-02 Check In).

## Open issue: groups with conflicting answers

If the group answers "some of us" (by voice or with the third button), Pepper welcomes back the regulars,
welcomes the first-timers, and then gives the full introduction so nobody is left out.

## Testing on the virtual robot

Press Play, wait 3 seconds for the simulated detection, then type in the Dialog panel:
`yes` (5a), `no` (5b), `some of us` (mixed group), or something random like `banana` (extension 4a).
Set `Simulated people count` to 3 on the Wait For Customer box to test the group version.
