// Flow: countdown starts -> "photoPrepare" (Pepper holds still) -> countdown ends -> "photoTake"
// -> hub_d says "Cheese!" and triggers the "Take Photo" box -> the box saves html/photos/<file>.jpg
// and raises "photoReady" with {"file": ..., "url": ...} (url = the robot's Wi-Fi address), or
// "photoFailed". Leaving mid-way sends "photoCancel" so Pepper can move again.
var WAIT_LIMIT_MS = 15000;
var waiting = false, waitTimer = null, countTimer = null;

function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) { screens[i].classList.remove('on'); }
    document.getElementById(id).classList.add('on');
}

function startCountdown() {
    showScreen('countScreen');
    raiseEvent('photoPrepare', 1);
    var n = 3;
    var el = document.getElementById('count');
    el.textContent = n;
    countTimer = setInterval(function () {
        n--;
        if (n > 0) {
            el.textContent = n;
        } else {
            clearInterval(countTimer);
            countTimer = null;
            takePhoto();
        }
    }, 1000);
}

function takePhoto() {
    showScreen('processingScreen');
    waiting = true;
    clearTimeout(waitTimer);
    waitTimer = setTimeout(onPhotoFailed, WAIT_LIMIT_MS);
    raiseEvent('photoTake', 1);
}

function onPhotoReady(value) {
    if (!waiting) return;
    waiting = false;
    clearTimeout(waitTimer);
    var info;
    try { info = JSON.parse(value); } catch (e) { onPhotoFailed(); return; }

    document.getElementById('photoImg').src = '../photos/' + info.file + '?t=' + Date.now();

    var qr = qrcode(0, 'M');
    qr.addData(info.url);
    qr.make();
    document.getElementById('qrBox').innerHTML = qr.createSvgTag({ cellSize: 1, margin: 0, scalable: true });

    showScreen('resultScreen');
}

function onPhotoFailed() {
    waiting = false;
    clearTimeout(waitTimer);
    showScreen('errorScreen');
}

function leave() {
    if (countTimer || waiting) { raiseEvent('photoCancel', 1); }
    clearInterval(countTimer);
    countTimer = null;
    waiting = false;
    clearTimeout(waitTimer);
    raiseConfirmationEvent('backToHub');
}

QiSession(function (session) {
    session.service('ALMemory').then(function (memory) {
        memory.subscriber('photoReady').then(function (sub) { sub.signal.connect(onPhotoReady); });
        memory.subscriber('photoFailed').then(function (sub) { sub.signal.connect(function () { if (waiting) onPhotoFailed(); }); });
    });
});
