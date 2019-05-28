var statusLabel;
var startButton;
var stopButton;
var videoPlayer;

// start click
async function startCapture() {
  disableButtons(true, false);
  chrome.runtime.sendMessage({task: 'start'});
}

// stop click
function stopCapture() {
  disableButtons(false, true);
  chrome.runtime.sendMessage({task: 'stop'});
}

// button toggle helper
function disableButtons(start, stop) {
  startButton.style.display = start ? 'none' : 'block';
  stopButton.style.display = stop ? 'none' : 'block';
}

// listens for messages from eventHandler
chrome.runtime.onMessage.addListener(function(msg, sender) {
  
});

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