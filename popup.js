var statusLabel;
var startButton;
var stopButton;
var videoPlayer;

// start click
function startCapture() {
  disableButtons(true, false);
}

// stop click
function stopCapture() {
  disableButtons(false, true);
}

// button toggle helper
function disableButtons(start, stop) {
  startButton.style.display = start ? 'none' : 'block';
  stopButton.style.display = stop ? 'none' : 'block';
}

// listens for messages from eventHandler
chrome.runtime.onMessage.addListener(function(msg, sender) {
  if (msg.task == 'toggle') {
    console.log('tab active')//
  }
});

// play given media stream on video object
function playMediaStream(stream) {
  videoPlayer.addEventListener('canplay', function() {
    this.volume = 0.75;
    this.muted = false;
    this.play();
  }); 
  videoPlayer.srcObject = stream;
}

// initialize popup menu 
document.addEventListener('DOMContentLoaded', function() {
  startButton = document.getElementById('start');
  stopButton = document.getElementById('stop');
  statusLabel = document.getElementById('status');
  videoPlayer = document.getElementById('player');
  startButton.addEventListener('click', startCapture);
  stopButton.addEventListener('click', stopCapture);
  disableButtons(false, true);
});