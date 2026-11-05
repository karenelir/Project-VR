displayPageInformation();
var src = document.getElementById("pageImage").getAttribute("src");
document.getElementById("backdropImg").style.backgroundImage = "url('" + src + "')";
document.getElementById("thumbImg").style.backgroundImage = "url('" + src + "')";
if (src.indexOf("farcry.png") > -1 || src.indexOf("outbreak.png") > -1) {
    document.getElementById("backdropImg").className = "backdrop shift-left";
    document.getElementById("thumbImg").className = "thumb shift-left";
}
