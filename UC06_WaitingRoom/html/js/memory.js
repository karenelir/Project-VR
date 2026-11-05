var IMAGES = {
    outbreak:     '../pics/outbreak.png',
    farcry:       '../pics/farcry.png',
    spacemarines: '../pics/spacemarines.png',
    zerovr:       '../pics/zerovr.png',
    peppervr:     '../pics/pepper_vr.jpg',
    headset:      '../pics/vr_headset.jpg',
    blaster:      '../pics/vr_blaster.jpg'
};
// Per level: which pictures are used, cards per row, the time limit (s), and the move counts
// Pepper's end-of-game reactions use (a perfect game takes one move per pair).
var LEVELS = {
    easy: { label: 'Easy', images: ['outbreak', 'farcry', 'spacemarines', 'zerovr'], perRow: 4, seconds: 60, great: 6, good: 10 },
    hard: { label: 'Hard', images: ['outbreak', 'farcry', 'spacemarines', 'zerovr', 'peppervr', 'headset', 'blaster'], perRow: 7, seconds: 90, great: 12, good: 18 }
};
var LEVEL_EVENT = { easy: 'memoryLevelEasy', hard: 'memoryLevelHard' };
var HURRY_AT = 0.25;   // share of the time left when the "Hurry!" effect starts

var level = 'easy', cfg = LEVELS.easy;
var moves = 0, firstIndex = -1, secondIndex = -1, locked = false, matchedCount = 0, over = false;
var deck = [];
var endAt = 0, clockTimer = null, hurrying = false;

function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
}

function showScreen(id) {
    stopClock();
    document.getElementById('levelScreen').className = id === 'levelScreen' ? 'screen on' : 'screen';
    document.getElementById('gameScreen').className = id === 'gameScreen' ? 'screen on' : 'screen';
}

function chooseLevel(l) {
    level = l;
    cfg = LEVELS[l];
    var tag = document.getElementById('levelTag');
    tag.textContent = cfg.label;
    tag.className = 'level ' + l;
    showScreen('gameScreen');
    startGame();
    raiseEvent(LEVEL_EVENT[l], 1);
}

function buildGrid() {
    var grid = document.getElementById('grid');
    grid.innerHTML = '';
    grid.className = level;
    deck = shuffle(cfg.images.concat(cfg.images));

    var rowDiv = null;
    for (var idx = 0; idx < deck.length; idx++) {
        if (idx % cfg.perRow === 0) {
            rowDiv = document.createElement('div');
            rowDiv.className = 'grow';
            grid.appendChild(rowDiv);
        }
        var symbol = deck[idx];
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'card';
        card.setAttribute('data-i', idx);
        card.setAttribute('data-symbol', symbol);
        card.onclick = (function (i) { return function () { flip(i); }; })(idx);
        card.innerHTML =
            '<svg class="back" viewBox="0 0 100 100" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="50" cy="50" r="30"/><path d="M40 40 a10 10 0 1 1 15 9 c-5 3 -5 6 -5 10"/><circle cx="50" cy="68" r="2.5" fill="currentColor" stroke="none"/></svg>' +
            '<img class="front" src="' + IMAGES[symbol] + '" alt="">';
        rowDiv.appendChild(card);
    }
}

function flip(i) {
    if (locked) return;
    var card = document.querySelector('.card[data-i="' + i + '"]');
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');

    if (firstIndex === -1) {
        firstIndex = i;
        return;
    }

    secondIndex = i;
    moves++;
    document.getElementById('movesVal').textContent = moves;

    var firstCard = document.querySelector('.card[data-i="' + firstIndex + '"]');
    var secondCard = document.querySelector('.card[data-i="' + secondIndex + '"]');

    if (firstCard.getAttribute('data-symbol') === secondCard.getAttribute('data-symbol')) {
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        matchedCount++;
        firstIndex = -1; secondIndex = -1;
        if (matchedCount === cfg.images.length) {
            over = true;
            stopClock();
            setTimeout(showFinal, 500);
        }
    } else {
        locked = true;
        setTimeout(function () {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            firstIndex = -1; secondIndex = -1;
            locked = false;
        }, 800);
    }
}

// Time bar. Uses the real clock (not tick counting) so a slow tablet can't stretch the time.
function startClock() {
    endAt = new Date().getTime() + cfg.seconds * 1000;
    hurrying = false;
    document.getElementById('timebox').className = 'timebox';
    document.body.className = '';
    tickClock();
    clockTimer = setInterval(tickClock, 100);
}

function stopClock() {
    clearInterval(clockTimer);
    clockTimer = null;
    document.body.className = '';
}

function tickClock() {
    var left = Math.max(0, endAt - new Date().getTime());
    var share = left / (cfg.seconds * 1000);
    document.getElementById('timeFill').style.width = (share * 100) + '%';
    var secs = Math.ceil(left / 1000);
    document.getElementById('timeText').textContent = hurrying ? 'Hurry! ' + secs + 's' : secs + 's';
    if (!hurrying && share <= HURRY_AT) {
        hurrying = true;
        document.getElementById('timebox').className = 'timebox low';
        document.body.className = 'hurry';
        raiseEvent('memoryHurry', 1);
    }
    if (left <= 0) { timeUp(); }
}

function timeUp() {
    if (over) return;
    over = true;
    locked = true;
    stopClock();
    var title = document.getElementById('finalTitle');
    title.textContent = "Time's Up!";
    title.className = 'timeout';
    document.getElementById('finalSub').textContent = 'You found ' + matchedCount + ' of ' + cfg.images.length + ' pairs.';
    document.getElementById('grid').style.display = 'none';
    document.getElementById('finalScreen').style.display = 'flex';
    raiseEvent('memoryTimeout', matchedCount);
}

function showFinal() {
    var title = document.getElementById('finalTitle');
    title.textContent = 'All Matched!';
    title.className = '';
    document.getElementById('finalSub').textContent = 'Finished in ' + moves + (moves === 1 ? ' move.' : ' moves.');
    document.getElementById('grid').style.display = 'none';
    document.getElementById('finalScreen').style.display = 'flex';
    raiseEvent(moves <= cfg.great ? 'memoryGreat' : moves <= cfg.good ? 'memoryGood' : 'memoryTry', moves);
}

function startGame() {
    moves = 0; firstIndex = -1; secondIndex = -1; locked = false; matchedCount = 0; over = false;
    document.getElementById('movesVal').textContent = '0';
    document.getElementById('finalScreen').style.display = 'none';
    document.getElementById('grid').style.display = 'flex';
    buildGrid();
    stopClock();
    startClock();
}
