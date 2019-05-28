// notifies other scripts when the tab icon is clicked
var save = [];
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.sendMessage(tab.id, {task: 'toggle', page: 0});
	if (!save[tab.id]) {
		getMediaStreams(tab);
	} else {
		closeMediaStreams(tab);
	}
});

chrome.runtime.onMessage.addListener(function(msg, sender) {
	if (msg.task == 'start') {
		startRecording(sender.tab)
	} else if (msg.task == 'stop') {
		stopRecording(sender.tab);
	}
});

function startRecording(tab) {
	let tabRecorder = save[tab.id].tabRecorder;
	let micRecorder = save[tab.id].micRecorder;
	let tabChunks = [];
	let micChunks = [];

	tabRecorder.ondataavailable = function(chunk) {
		tabChunks.push(chunk.data);
		console.log(chunk);
	}

	micRecorder.ondataavailable = function(chunk) {
		micChunks.push(chunk.data);
	}

	tabRecorder.start();
	micRecorder.start();
	console.log(tabRecorder.state);
}

function tab(chunk) {

}

function stopRecording(tab) {

}

async function getMediaStreams(tab) {
	let tabStream = null;
	let micStream = null;
	let tabRecorder = null;
	let micRecorder = null;
  	
  	//capture microphone audio
  	try {
  		micStream = await navigator.mediaDevices.getUserMedia({audio: true});
  		micRecorder = new MediaRecorder(micStream);
  	} catch (err) {
  		console.error(err);
  	}

  	//capture tab audio
  	chrome.tabCapture.capture({audio: true}, function(stream) {
  		tabStream = stream;
  		tabRecorder = new MediaRecorder(tabStream);
  		
  		save[tab.id] = {tabStream: tabStream, micStream: micStream,
  						tabRecorder: tabRecorder, micRecorder: micRecorder,
  						tabChunks: null, micChunks: null};
  	});
}

function closeMediaStreams(tab) {
	let tabStream = save[tab.id].tab;
	let micStream = save[tab.id].mic;
	let tabTracks = tabStream.getTracks();
	let micTracks = micStream.getTracks();
	tabTracks.forEach(track => track.stop());
	micTracks.forEach(track => track.stop());
	save[tab.id] = null;
}