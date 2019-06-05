//https://www.youtube.com/watch* left side
//https://play.hbogo.com/episode*  left side

const panelWidth = 200;														// Width of side panel
const netflixContainer = document.getElementsByClassName('sizing-wrapper'); // Netflix video container
const youtubeContainer = null;												// TODO: Youtube video container
const hboContainer = null;													// TODO: HBO video container
const supportedPages = [netflixContainer, youtubeContainer, hboContainer];

// Creates the frame and appends it to the DOM
var iframe = document.createElement('iframe');
iframe.id = 'charaoke';
iframe.allow = 'microphone *';
iframe.style.background = 'black';
iframe.style.height = '100%';
iframe.style.width = '0px';
iframe.style.position = 'fixed';
iframe.style.top = '0px';
iframe.style.right = '0px';
iframe.style.zIndex = 9000000000;
iframe.frameBorder = 'none';
iframe.src = chrome.runtime.getURL('popup.html');
document.body.appendChild(iframe);


//class=touchable PlayerControls--control-element nfp-button-control default-control-button button-nfplayerSubtitles PlayerControls--control-element--active
//data-uia="track-subtitle-English"


// Receives messages from the extension
chrome.runtime.onMessage.addListener(function(msg, sender) {
  if (msg.task == 'toggle') {
    toggleView(supportedPages[msg.page]);
  } else if (msg.task == 'close') {
  	closeView(supportedPages[0]); // TODO
  }
});

// Toggles the panel visibility
function toggleView(page) {
	if (iframe.style.width == '0px') {
		openView(page);
	} else {
		closeView(page);
	}
}

function closeView(page) {
	iframe.style.width = '0px';
	page[0].style.width = window.innerWidth.toString() + 'px';
}

function openView(page) {
	var size = window.innerWidth - panelWidth;
	iframe.style.width = panelWidth.toString() + 'px';
	page[0].style.width = size.toString() + 'px';
}