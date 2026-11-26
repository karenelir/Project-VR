// Photo with Pepper - Christmas theme: falling snow + a string of twinkling lights on every page.
// ES5 only (Pepper's tablet browser is old). Include it at the END of <body>.
(function () {
    var body = document.body;

    // snow: plain white dots (no special characters, so it works on every tablet font)
    var snow = document.createElement("div");
    snow.className = "snow";
    var count = window.XMAS_SNOWFLAKES || 55;
    for (var i = 0; i < count; i++) {
        var f = document.createElement("div");
        var size = (0.35 + Math.random() * 0.9).toFixed(2);       // in vw
        var dur = (7 + Math.random() * 9).toFixed(1) + "s";
        var delay = (-Math.random() * 16).toFixed(1) + "s";
        f.className = "flake";
        f.style.left = (Math.random() * 100).toFixed(1) + "vw";
        f.style.width = size + "vw";
        f.style.height = size + "vw";
        f.style.opacity = (0.45 + Math.random() * 0.5).toFixed(2);
        f.style.webkitAnimationDuration = dur; f.style.animationDuration = dur;
        f.style.webkitAnimationDelay = delay; f.style.animationDelay = delay;
        snow.appendChild(f);
    }
    body.appendChild(snow);

    // lights
    if (!window.XMAS_NO_LIGHTS) {
        var lights = document.createElement("div");
        lights.className = "lights";
        var colors = ["r", "g", "y", "b"];
        for (var j = 0; j < 22; j++) {
            var b = document.createElement("div");
            b.className = "bulb " + colors[j % 4];
            lights.appendChild(b);
        }
        body.appendChild(lights);
    }
})();

// ---------- extra decorations: holly in the top corners, snowy ground with little trees, hanging ornaments ----------
(function () {
    var body = document.body;
    if (window.XMAS_NO_DECOR) { return; }
    var HOLLY = '<svg viewBox="0 0 120 90"><path d="M60 40 C40 10 18 14 4 22 C14 28 12 40 22 44 C16 54 26 62 36 58 C40 66 52 64 60 52 Z" fill="#1f7a3a"/>' +
        '<path d="M60 40 C80 10 102 14 116 22 C106 28 108 40 98 44 C104 54 94 62 84 58 C80 66 68 64 60 52 Z" fill="#26914a"/>' +
        '<circle cx="52" cy="52" r="9" fill="#d7263d"/><circle cx="68" cy="52" r="9" fill="#e3343f"/><circle cx="60" cy="40" r="9" fill="#c81d33"/>' +
        '<circle cx="49" cy="49" r="2.5" fill="#fff" opacity=".7"/><circle cx="65" cy="49" r="2.5" fill="#fff" opacity=".7"/></svg>';
    var l = document.createElement("div"); l.className = "holly left"; l.innerHTML = HOLLY; body.appendChild(l);
    var r = document.createElement("div"); r.className = "holly right"; r.innerHTML = HOLLY; body.appendChild(r);

    var ground = document.createElement("div");
    ground.className = "snowground";
    ground.innerHTML = '<svg viewBox="0 0 1000 60" preserveAspectRatio="none"><path d="M0 30 C80 10 160 40 250 24 C340 8 420 38 520 22 C620 6 700 36 800 20 C880 8 950 26 1000 18 L1000 60 L0 60 Z" fill="#f4f8ff"/></svg>' +
        '<svg class="ptree l" viewBox="0 0 40 60"><path d="M20 2 L34 26 L27 26 L38 44 L2 44 L13 26 L6 26 Z" fill="#1f8a43"/><rect x="17" y="44" width="6" height="10" fill="#7a4b24"/><circle cx="20" cy="4" r="3" fill="#f5c451"/></svg>' +
        '<svg class="ptree r" viewBox="0 0 40 60"><path d="M20 2 L34 26 L27 26 L38 44 L2 44 L13 26 L6 26 Z" fill="#1f8a43"/><rect x="17" y="44" width="6" height="10" fill="#7a4b24"/><circle cx="20" cy="4" r="3" fill="#f5c451"/></svg>';
    body.appendChild(ground);

    var colors = ["#d7263d", "#f5c451", "#5cc8ff", "#3fe07a", "#ffffff"];
    var positions = [9, 23, 77, 91];
    for (var i = 0; i < positions.length; i++) {
        var o = document.createElement("div");
        o.className = "ornament";
        o.style.left = positions[i] + "vw";
        o.style.height = (6 + (i % 2) * 4) + "vh";
        o.innerHTML = '<span style="background:' + colors[i % colors.length] + '"></span>';
        body.appendChild(o);
    }
})();

// ---------- tell Pepper when this page is really on the screen (event pageReady = page file name) ----------
// Pepper waits for it before talking, so it never talks over the previous screen.
(function () {
    function ready() {
        try {
            if (!window.QiSession) { return; }
            var page = window.location.pathname.split("/").pop();
            QiSession(function (session) {
                session.service("ALMemory").then(function (mem) { mem.raiseEvent("pageReady", page); });
            }, function () {});
        } catch (e) { console.log("pageReady: " + e); }
    }
    if (document.readyState === "complete") { ready(); } else { window.addEventListener("load", ready); }
})();
