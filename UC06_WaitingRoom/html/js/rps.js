var ICONS = {
    rock:     '<circle cx="50" cy="50" r="28"/>',
    paper:    '<rect x="30" y="22" width="40" height="56" rx="6"/>',
    scissors: '<circle cx="35" cy="68" r="10"/><circle cx="65" cy="68" r="10"/><path d="M25 22 L75 72 M75 22 L25 72"/>'
};
var youScore = 0, pepScore = 0, locked = false;

function getResult(you, pep) {
    if (you === pep) return 'tie';
    if ((you === 'rock' && pep === 'scissors') ||
        (you === 'paper' && pep === 'rock') ||
        (you === 'scissors' && pep === 'paper')) return 'win';
    return 'lose';
}

function play(youChoice) {
    if (locked) return;
    locked = true;

    var options = ['rock', 'paper', 'scissors'];
    var pepChoice = options[Math.floor(Math.random() * 3)];
    var result = getResult(youChoice, pepChoice);

    document.getElementById('youBox').querySelector('svg').innerHTML = ICONS[youChoice];
    document.getElementById('pepBox').querySelector('svg').innerHTML = ICONS[pepChoice];

    var resultText = document.getElementById('resultText');
    resultText.className = 'result-text ' + result;
    resultText.textContent = result === 'win' ? 'You win this round!' : result === 'lose' ? 'Pepper wins this round!' : "It's a tie!";

    raiseEvent(result === 'win' ? 'rpsRoundWin' : result === 'lose' ? 'rpsRoundLose' : 'rpsRoundTie', 1);

    if (result === 'win') youScore++;
    if (result === 'lose') pepScore++;
    document.getElementById('youScore').textContent = youScore;
    document.getElementById('pepScore').textContent = pepScore;

    setTimeout(function () {
        if (youScore === 2 || pepScore === 2) {
            showFinal();
        } else {
            resultText.textContent = '';
            document.getElementById('youBox').querySelector('svg').innerHTML = '';
            document.getElementById('pepBox').querySelector('svg').innerHTML = '';
            locked = false;
        }
    }, 1600);
}

function showFinal() {
    var youWon = youScore === 2;
    document.getElementById('finalTitle').textContent = youWon ? 'You Win!' : 'Pepper Wins!';
    document.getElementById('finalTitle').style.color = youWon ? '#8fe25a' : '#ff6b6b';
    document.getElementById('finalSub').textContent = youScore + ' rounds to ' + pepScore + '.';
    document.getElementById('playArea').style.display = 'none';
    document.getElementById('finalScreen').style.display = 'flex';
    raiseEvent(youWon ? 'rpsFinalWin' : 'rpsFinalLose', 1);
}

function resetGame() {
    youScore = 0; pepScore = 0; locked = false;
    document.getElementById('youScore').textContent = '0';
    document.getElementById('pepScore').textContent = '0';
    document.getElementById('resultText').textContent = '';
    document.getElementById('youBox').querySelector('svg').innerHTML = '';
    document.getElementById('pepBox').querySelector('svg').innerHTML = '';
    document.getElementById('finalScreen').style.display = 'none';
    document.getElementById('playArea').style.display = 'block';
}
