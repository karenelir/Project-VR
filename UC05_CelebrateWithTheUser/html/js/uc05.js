// UC05 - Celebrate with the User: small helpers shared by the UC05 tablet pages.
// ES5 only (Pepper's tablet browser is old): no arrow functions, no let/const, no template strings.
// Events are sent to Pepper with raiseEvent(name, value) from ../js/qievents.js.

function uc05Param(name, defaultVal) {
    var match = new RegExp("[?&]" + name + "=([^&]*)").exec(window.location.href);
    if (!match) { return defaultVal; }
    try { return decodeURIComponent(match[1].replace(/\+/g, " ")); }
    catch (e) { return match[1]; }
}

// Game name (as sent by the result source) -> picture in ../pics/
function uc05GameArt(game) {
    var g = (game || "").toLowerCase();
    if (g.indexOf("outbreak") > -1 || g.indexOf("zombie") > -1) { return "../pics/outbreak.png"; }
    if (g.indexOf("far") > -1) { return "../pics/farcry.png"; }
    if (g.indexOf("space") > -1 || g.indexOf("marine") > -1) { return "../pics/spacemarines.png"; }
    return "../pics/zerovr.png";
}

function uc05SetBackdrop(id, src) {
    var el = document.getElementById(id);
    if (el) { el.style.backgroundImage = "url('" + src + "')"; }
}

// Mark the tapped button, fade the others in the same page, lock the page, then raise the event.
function uc05Choose(btn, eventName, eventValue) {
    if (document.body.className.indexOf("locked") !== -1) { return; }
    var all = document.getElementsByClassName("btn");
    for (var i = 0; i < all.length; i++) {
        if (all[i] !== btn) { all[i].className += " fade"; }
    }
    btn.className += " chosen";
    document.body.className += " locked";
    raiseEvent(eventName, eventValue);
}

// Escape text before putting it in innerHTML
function uc05Esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
