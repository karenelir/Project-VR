// Mark the tapped card, fade the others, then tell Pepper's dialog which game was chosen.
function choose(card, eventName) {
    if (document.body.className.indexOf("locked") !== -1) { return; }
    var cards = document.getElementsByClassName("card");
    for (var i = 0; i < cards.length; i++) {
        if (cards[i] !== card) { cards[i].className += " fade"; }
    }
    card.className += " chosen";
    document.body.className += " locked";
    raiseConfirmationEvent(eventName);   // defined in ../js/qievents.js
}
