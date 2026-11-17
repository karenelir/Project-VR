// Camera mode: the "Rock Paper Scissors Camera" box runs the match and sends "rpsTablet" events
//   mode|camera, mode|touch, live|<shape>, count|<n>, shoot, nohand,
//   result|<yours>|<Pepper's>|<win/lose/tie>|<your score>|<Pepper's score>, final|<win/lose>|<yours>|<Pepper's>
// and this page only displays them. Touch mode (no hand-shape server): the guest taps a move and the
// page runs the game itself, as before. The page says "rpsPageReady" once it is listening, which
// starts the match; if Pepper has not answered after WAIT_LIMIT_MS, it falls back to touch mode.
var ICONS = {
    rock:     '<circle cx="50" cy="50" r="28"/>',
    paper:    '<rect x="30" y="22" width="40" height="56" rx="6"/>',
    scissors: '<circle cx="35" cy="68" r="10"/><circle cx="65" cy="68" r="10"/><path d="M25 22 L75 72 M75 22 L25 72"/>'
};
var NAMES = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' };
var WAIT_LIMIT_MS = 8000;
var REVEAL_MS = 1500;      // how long Pepper's move is shown big before both moves appear
var mode = 'wait', waitTimer = null, revealTimer = null;
var youScore = 0, pepScore = 0, locked = false;

function byId(id) { return document.getElementById(id); }

function setMode(newMode) {
    mode = newMode;
    document.body.className = 'mode-' + newMode;
    clearTimeout(waitTimer);
    if (newMode === 'wait') { waitTimer = setTimeout(function () { if (mode === 'wait') setMode('touch'); }, WAIT_LIMIT_MS); }
}

function setCenter(text, cls) {
    byId('center').textContent = text;
    byId('center').className = cls ? 'vs ' + cls : 'vs';
}

function showMoves(you, pep) {
    byId('youBox').querySelector('svg').innerHTML = you ? ICONS[you] : '';
    byId('pepBox').querySelector('svg').innerHTML = pep ? ICONS[pep] : '';
    byId('youMove').textContent = you ? NAMES[you] : '';
    byId('pepMove').textContent = pep ? NAMES[pep] : '';
}

// Show Pepper's move very big on its own, then call done() to show both moves side by side.
function revealPepper(pep, done) {
    clearTimeout(revealTimer);
    var reveal = byId('pepReveal');
    reveal.querySelector('svg').innerHTML = ICONS[pep];
    byId('pepRevealName').textContent = NAMES[pep];
    reveal.className = '';
    void reveal.offsetWidth;                 // restart the pop animation
    reveal.className = 'on';
    revealTimer = setTimeout(function () {
        reveal.className = '';
        done();
    }, REVEAL_MS);
}

function hideReveal() {
    clearTimeout(revealTimer);
    byId('pepReveal').className = '';
}

function showResult(result, text) {
    byId('resultText').className = 'result-text ' + result;
    byId('resultText').textContent = text;
}

function showScores() {
    byId('youScore').textContent = youScore;
    byId('pepScore').textContent = pepScore;
}

function getResult(you, pep) {
    if (you === pep) return 'tie';
    if ((you === 'rock' && pep === 'scissors') ||
        (you === 'paper' && pep === 'rock') ||
        (you === 'scissors' && pep === 'paper')) return 'win';
    return 'lose';
}

function resultSentence(result) {
    return result === 'win' ? 'You win this round!' : result === 'lose' ? 'Pepper wins this round!' : "It's a tie!";
}

// ---- camera mode: display what Pepper sends ----

function onRobot(value) {
    var parts = String(value).split('|');
    var what = parts[0];
    if (what === 'mode') {
        setMode(parts[1] === 'camera' ? 'camera' : 'touch');
        if (parts[1] !== 'camera') { locked = false; setCenter('VS'); }
        return;
    }
    if (mode !== 'camera') return;

    if (what === 'live') {
        var seen = !!NAMES[parts[1]];
        byId('liveShape').textContent = seen ? NAMES[parts[1]] : 'no hand yet';
        byId('live').className = seen ? 'live seen' : 'live';
    } else if (what === 'count') {
        showMoves(null, null);
        showResult('', '');
        setCenter(parts[1], 'count');
    } else if (what === 'shoot') {
        setCenter('SHOOT!', 'shoot');
    } else if (what === 'nohand') {
        setCenter('VS');
        showResult('tie', "I couldn't see your hand. Let's try again!");
    } else if (what === 'result') {
        setCenter('VS');
        showMoves(null, null);
        revealPepper(parts[2], function () {
            showMoves(parts[1], parts[2]);
            showResult(parts[3], resultSentence(parts[3]));
            youScore = parseInt(parts[4], 10) || 0;
            pepScore = parseInt(parts[5], 10) || 0;
            showScores();
        });
    } else if (what === 'final') {
        hideReveal();
        youScore = parseInt(parts[2], 10) || 0;
        pepScore = parseInt(parts[3], 10) || 0;
        showScores();
        showFinal(parts[1] === 'win');
    }
}

// ---- touch mode: the original tap-to-play game ----

function play(youChoice) {
    if (locked || mode !== 'touch') return;
    locked = true;

    var options = ['rock', 'paper', 'scissors'];
    var pepChoice = options[Math.floor(Math.random() * 3)];
    var result = getResult(youChoice, pepChoice);

    if (result === 'win') youScore++;
    if (result === 'lose') pepScore++;

    revealPepper(pepChoice, function () {
        showMoves(youChoice, pepChoice);
        showResult(result, resultSentence(result));
        showScores();
        raiseEvent(result === 'win' ? 'rpsRoundWin' : result === 'lose' ? 'rpsRoundLose' : 'rpsRoundTie', 1);
    });

    setTimeout(function () {
        if (youScore === 2 || pepScore === 2) {
            showFinal(youScore === 2);
            raiseEvent(youScore === 2 ? 'rpsFinalWin' : 'rpsFinalLose', 1);
        } else {
            showResult('', '');
            showMoves(null, null);
            locked = false;
        }
    }, REVEAL_MS + 2200);
}

// ---- both modes ----

function showFinal(youWon) {
    byId('finalTitle').textContent = youWon ? 'You Win!' : 'Pepper Wins!';
    byId('finalTitle').style.color = youWon ? '#8fe25a' : '#ff6b6b';
    byId('finalSub').textContent = youScore + ' rounds to ' + pepScore + '.';
    byId('playArea').style.display = 'none';
    byId('finalScreen').style.display = 'flex';
}

function resetGame() {
    hideReveal();
    youScore = 0; pepScore = 0; locked = false;
    showScores();
    showResult('', '');
    showMoves(null, null);
    setCenter('VS');
    byId('finalScreen').style.display = 'none';
    byId('playArea').style.display = 'block';
}

function announceReady() {
    // Pepper answers with mode|camera or mode|touch and, in camera mode, starts the countdown.
    setMode('wait');
    raiseEvent('rpsPageReady', 1);
}

function playAgain() {
    resetGame();
    announceReady();
}

function leave() {
    clearTimeout(waitTimer);
    hideReveal();
    raiseConfirmationEvent('backToGames');   // hub_d also stops a running camera match
}

QiSession(function (session) {
    session.service('ALMemory').then(function (memory) {
        memory.subscriber('rpsTablet').then(function (sub) {
            var connected = sub.signal.connect(onRobot);
            if (connected && connected.then) { connected.then(announceReady, announceReady); } else { announceReady(); }
        }, announceReady);
    }, announceReady);
}, function () { setMode('touch'); });
