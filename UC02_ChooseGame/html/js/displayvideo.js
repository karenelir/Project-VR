var videoName = decodeURIComponent(getUrlParam("pageVideo", ""));
var el = document.getElementById("pageVideo");
if (videoName) {
  el.src = "../videos/" + videoName;
  el.load();
  var p = el.play();
  if (p && p.catch) { p.catch(function (e) { console.log("play() failed: " + e); }); }
}
