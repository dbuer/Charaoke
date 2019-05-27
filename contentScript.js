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

// Receives messages from the extension
chrome.runtime.onMessage.addListener(function(msg, sender) {
  if (msg.task == 'toggle') {
    toggleView(supportedPages[msg.page]);
  }
});

// Toggles the panel visibility
function toggleView(page) {
	var size = window.innerWidth - panelWidth; 	// Width of new video container
	
	if (iframe.style.width == '0px') {
		iframe.style.width = panelWidth.toString() + 'px';
		setPageSize(page, size.toString() + 'px');
	} else {
		iframe.style.width = '0px';
		setPageSize(page, window.innerWidth.toString() + 'px');
	}
}

// sets the video width
function setPageSize(page, size) {
	page[0].style.width = size;
}