var X_SVG = '<svg viewBox="0 0 100 100" fill="none" stroke-width="10" stroke-linecap="round"><path d="M22 22 L78 78 M78 22 L22 78"/></svg>';
var O_SVG = '<svg viewBox="0 0 100 100" fill="none" stroke-width="10"><circle cx="50" cy="50" r="30"/></svg>';
var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
var LEVEL_LABEL = { low: 'Vs Pepper - Low', medium: 'Vs Pepper - Medium', high: 'Vs Pepper - High' };
var LEVEL_EVENT = { low: 'tttLevelLow', medium: 'tttLevelMedium', high: 'tttLevelHigh' };

// mode: 'pvp' or 'pepper'. In pvp, X and O are two guests; in pepper mode the guest is X.
var mode = 'pepper', level = 'medium';
var board, turn, over, busy, startMark = 'x';
var p1Score = 0, p2Score = 0, drawScore = 0;

function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) { screens[i].classList.remove('on'); }
    document.getElementById(id).classList.add('on');
}

function resetScores() {
    p1Score = 0; p2Score = 0; drawScore = 0; startMark = 'x';
    updateScores();
}

function updateScores() {
    document.getElementById('p1Score').textContent = p1Score;
    document.getElementById('p2Score').textContent = p2Score;
    document.getElementById('drawScore').textContent = drawScore;
}

function choosePvp() {
    mode = 'pvp';
    document.getElementById('p1Name').textContent = 'Player X';
    document.getElementById('p2Name').textContent = 'Player O';
    document.getElementById('modeTag').textContent = '2 Players';
    resetScores();
    raiseEvent('tttPvp', 1);
    showScreen('gameScreen');
    newGame();
}

function chooseLevel(l) {
    mode = 'pepper';
    level = l;
    document.getElementById('p1Name').textContent = 'You (X)';
    document.getElementById('p2Name').textContent = 'Pepper (O)';
    document.getElementById('modeTag').textContent = LEVEL_LABEL[l];
    resetScores();
    raiseEvent(LEVEL_EVENT[l], 1);
    showScreen('gameScreen');
    newGame();
}

function setStatus(text, cls) {
    var s = document.getElementById('status');
    s.textContent = text;
    s.className = cls;
}

function cellEl(i) { return document.querySelector('.cell[data-i="' + i + '"]'); }

function buildBoard() {
    var el = document.getElementById('board');
    el.innerHTML = '';
    for (var r = 0; r < 3; r++) {
        var row = document.createElement('div');
        row.className = 'brow';
        for (var c = 0; c < 3; c++) {
            var i = r * 3 + c;
            var cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'cell';
            cell.setAttribute('data-i', i);
            cell.onclick = (function (idx) { return function () { tapCell(idx); }; })(i);
            row.appendChild(cell);
        }
        el.appendChild(row);
    }
}

function place(i, mark) {
    board[i] = mark;
    var cell = cellEl(i);
    cell.className = 'cell ' + mark;
    cell.innerHTML = mark === 'x' ? X_SVG : O_SVG;
}

function winnerOf(b) {
    for (var k = 0; k < LINES.length; k++) {
        var l = LINES[k];
        if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { mark: b[l[0]], line: l };
    }
    return null;
}

function freeCells(b) {
    var free = [];
    for (var i = 0; i < 9; i++) { if (!b[i]) free.push(i); }
    return free;
}

// Cell that completes three-in-a-row for `mark`, or -1
function finishingCell(mark) {
    for (var k = 0; k < LINES.length; k++) {
        var l = LINES[k], mine = 0, empty = -1;
        for (var j = 0; j < 3; j++) {
            if (board[l[j]] === mark) mine++;
            else if (!board[l[j]]) empty = l[j];
        }
        if (mine === 2 && empty !== -1) return empty;
    }
    return -1;
}

function randomFree() {
    var free = freeCells(board);
    return free[Math.floor(Math.random() * free.length)];
}

// Perfect play for 'o'; prefers faster wins and slower losses.
function minimax(b, toMove, depth) {
    var w = winnerOf(b);
    if (w) return w.mark === 'o' ? 10 - depth : depth - 10;
    var free = freeCells(b);
    if (!free.length) return 0;
    var best = toMove === 'o' ? -Infinity : Infinity;
    for (var i = 0; i < free.length; i++) {
        b[free[i]] = toMove;
        var score = minimax(b, toMove === 'o' ? 'x' : 'o', depth + 1);
        b[free[i]] = '';
        best = toMove === 'o' ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
}

function bestMove() {
    var free = freeCells(board), bestScore = -Infinity, choices = [];
    for (var i = 0; i < free.length; i++) {
        board[free[i]] = 'o';
        var score = minimax(board, 'x', 1);
        board[free[i]] = '';
        if (score > bestScore) { bestScore = score; choices = [free[i]]; }
        else if (score === bestScore) { choices.push(free[i]); }
    }
    return choices[Math.floor(Math.random() * choices.length)];
}

function pepperChoice() {
    var win = finishingCell('o');
    var threat = finishingCell('x');
    if (level === 'low') {
        if (win !== -1 && Math.random() < 0.3) return win;
        return randomFree();
    }
    if (level === 'medium') {
        if (win !== -1) return win;
        if (threat !== -1 && Math.random() < 0.75) return threat;
        if (!board[4]) return 4;
        return randomFree();
    }
    return bestMove();
}

function checkEnd() {
    var w = winnerOf(board);
    if (w) {
        for (var j = 0; j < 3; j++) { cellEl(w.line[j]).classList.add('winline'); }
        if (w.mark === 'x') p1Score++; else p2Score++;
        if (mode === 'pvp') {
            setStatus(w.mark === 'x' ? 'Player X wins!' : 'Player O wins!', 'win');
            raiseEvent(w.mark === 'x' ? 'tttXWins' : 'tttOWins', 1);
        } else if (w.mark === 'x') {
            setStatus('You win!', 'win');
            raiseEvent('tttWin', 1);
        } else {
            setStatus('Pepper wins!', 'lose');
            raiseEvent('tttLose', 1);
        }
        finish();
        return true;
    }
    if (!freeCells(board).length) {
        drawScore++;
        setStatus("It's a draw!", 'draw');
        raiseEvent('tttDraw', 1);
        finish();
        return true;
    }
    return false;
}

function finish() {
    over = true;
    updateScores();
    document.getElementById('endButtons').style.visibility = 'visible';
}

function announceTurn() {
    if (mode === 'pvp') {
        setStatus(turn === 'x' ? "Player X's turn" : "Player O's turn", turn === 'x' ? 'p1' : 'p2');
    } else {
        setStatus('Your turn', 'p1');
    }
}

function pepperTurn() {
    busy = true;
    setStatus('Pepper is thinking...', 'p2');
    setTimeout(function () {
        var threat = finishingCell('x');
        var cell = pepperChoice();
        place(cell, 'o');
        if (!checkEnd()) {
            if (threat !== -1 && cell === threat) raiseEvent('tttBlock', 1);
            turn = 'x';
            busy = false;
            announceTurn();
        }
    }, 700);
}

function tapCell(i) {
    if (over || busy || board[i]) return;
    place(i, turn);
    if (checkEnd()) return;
    turn = turn === 'x' ? 'o' : 'x';
    if (mode === 'pepper' && turn === 'o') { pepperTurn(); }
    else { announceTurn(); }
}

function newGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    over = false; busy = false;
    document.getElementById('endButtons').style.visibility = 'hidden';
    buildBoard();
    turn = startMark;
    startMark = startMark === 'x' ? 'o' : 'x';   // alternate who starts
    if (mode === 'pepper' && turn === 'o') { pepperTurn(); }
    else { announceTurn(); }
}
