// Per level: board size, how long a mole stays up, the gap before the next one (ms), and the
// scores Pepper's end-of-game reactions use. Easy is the original game. Timings are tuned for
// the real tablet, which reacts more slowly than a PC.
var LEVELS = {
    easy: { label: 'Easy', size: 3, upMs: 1000, nextMinMs: 750, nextRandomMs: 450, great: 15, good: 8 },
    hard: { label: 'Hard', size: 5, upMs: 650,  nextMinMs: 450, nextRandomMs: 300, great: 20, good: 10 }
};
var LEVEL_EVENT = { easy: 'moleLevelEasy', hard: 'moleLevelHard' };
var MOLE_HTML = '<span class="mole"><span class="eye l"></span><span class="eye r"></span><span class="mouth"></span></span>';

var level = 'easy', cfg = LEVELS.easy, holes = [];
var score = 0, timeLeft = 30, activeHole = -1, spawnTimer = null, hideTimer = null, countdownTimer = null, running = false;

// className helpers instead of classList, for the tablet's old browser.
function setUp(hole, up) { hole.className = up ? 'hole up' : 'hole'; }
function isUp(hole) { return (' ' + hole.className + ' ').indexOf(' up ') !== -1; }

function showScreen(id) {
    stopTimers();
    running = false;
    document.getElementById('levelScreen').className = id === 'levelScreen' ? 'screen on' : 'screen';
    document.getElementById('gameScreen').className = id === 'gameScreen' ? 'screen on' : 'screen';
}

function chooseLevel(l) {
    level = l;
    cfg = LEVELS[l];
    var tag = document.getElementById('levelTag');
    tag.textContent = cfg.label;
    tag.className = 'level ' + l;
    buildGrid();
    showScreen('gameScreen');
    startGame();
    raiseEvent(LEVEL_EVENT[l], 1);
}

function buildGrid() {
    var grid = document.getElementById('grid');
    grid.innerHTML = '';
    grid.className = level;
    holes = [];
    for (var r = 0; r < cfg.size; r++) {
        var row = document.createElement('div');
        row.className = 'grow';
        for (var c = 0; c < cfg.size; c++) {
            var hole = document.createElement('div');
            hole.className = 'hole';
            hole.innerHTML = MOLE_HTML;
            // Register hits on touchstart: the old tablet browser waits ~300ms before firing a click,
            // long enough to miss a mole. mousedown covers testing with a mouse on a PC.
            (function (i) {
                hole.addEventListener('touchstart', function (e) { e.preventDefault(); whack(i); }, false);
                hole.addEventListener('mousedown', function () { whack(i); }, false);
            })(holes.length);
            holes.push(hole);
            row.appendChild(hole);
        }
        grid.appendChild(row);
    }
}

function spawnMole() {
    if (!running) return;
    var count = holes.length;
    if (activeHole >= 0) { setUp(holes[activeHole], false); }
    var next = Math.floor(Math.random() * count);
    if (next === activeHole) { next = (next + 1 + Math.floor(Math.random() * (count - 1))) % count; }
    activeHole = next;
    setUp(holes[next], true);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
        setUp(holes[next], false);
        if (activeHole === next) activeHole = -1;
    }, cfg.upMs);
    spawnTimer = setTimeout(spawnMole, cfg.nextMinMs + Math.random() * cfg.nextRandomMs);
}

function whack(i) {
    if (!running) return;
    if (i === activeHole && isUp(holes[i])) {
        score++;
        document.getElementById('scoreVal').textContent = score;
        holes[i].className = 'hole up hit';
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { setUp(holes[i], false); }, 200);
        activeHole = -1;
    }
}

function tickClock() {
    timeLeft--;
    document.getElementById('timeVal').textContent = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

function stopTimers() {
    clearTimeout(spawnTimer); clearTimeout(hideTimer); clearInterval(countdownTimer);
}

function startGame() {
    stopTimers();
    running = true;
    score = 0; timeLeft = 30; activeHole = -1;
    document.getElementById('scoreVal').textContent = '0';
    document.getElementById('timeVal').textContent = '30';
    for (var i = 0; i < holes.length; i++) { setUp(holes[i], false); }
    document.getElementById('finalScreen').style.display = 'none';
    document.getElementById('grid').style.display = 'flex';
    spawnTimer = setTimeout(spawnMole, 500);
    countdownTimer = setInterval(tickClock, 1000);
}

function endGame() {
    running = false;
    stopTimers();
    for (var i = 0; i < holes.length; i++) { setUp(holes[i], false); }
    document.getElementById('finalSub').textContent = 'You whacked ' + score + (score === 1 ? ' mole.' : ' moles.');
    document.getElementById('grid').style.display = 'none';
    document.getElementById('finalScreen').style.display = 'flex';
    raiseEvent(score >= cfg.great ? 'moleGreat' : score >= cfg.good ? 'moleGood' : 'moleTry', score);
}
