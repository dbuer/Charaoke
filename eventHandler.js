// notifies other scripts when the tab icon is clicked
var save = [];
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.sendMessage(tab.id, {task: 'toggle', page: 0});
	if (!save[tab.id]) {
		// checks for microphone permission
		navigator.permissions.query({name:'microphone'}).then(function(result) {
			if (result.state == 'granted') { // get the stream if allowed
				getMediaStreams(tab);
			} else {						 // ask for permission if denied
				chrome.tabs.sendMessage(tab.id, {task: 'perms', allow: false});
			}
		});
	} else {
		closeMediaStreams(tab);
	}
});

chrome.runtime.onMessage.addListener(function(msg, sender) {
	if (msg.task == 'start') {
		startRecording(sender.tab)
	} else if (msg.task == 'stop') {
		stopRecording(sender.tab);
	} else if (msg.task == 'perms' && msg.allow) {
		getMediaStreams(sender.tab);
	}
});

function startRecording(tab) {
	let tabRecorder = save[tab.id].tab.recorder;
	let micRecorder = save[tab.id].mic.recorder;
	let tabChunks = save[tab.id].tab.chunks;
	let micChunks = save[tab.id].mic.chunks;

	tabRecorder.ondataavailable = function(chunk) {
		tabChunks.push(chunk.data);
	}

	micRecorder.ondataavailable = function(chunk) {
		micChunks.push(chunk.data);
	}

	tabRecorder.onstop = onStop;
	micRecorder.onstop = onStop;

	tabRecorder.start();
	micRecorder.start();
}

function onStop(event) {
	let stream = event.srcElement.stream;
	let chunks = stream.chunks;
	let blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
	let audioURL = window.URL.createObjectURL(blob);
	if (stream.name == 'mic') {
		let mic = new Audio();
		mic.src = audioURL;
		mic.play();
	}
  	stream.chunks = [];
}

function stopRecording(tab) {
	let tabRecorder = save[tab.id].tab.recorder;
	let micRecorder = save[tab.id].mic.recorder;
	tabRecorder.stop();
	micRecorder.stop();
}

async function getMediaStreams(tab) {
	let tabStream = null;
	let micStream = null;
  	
  	//capture microphone audio
  	try {
  		micStream = await navigator.mediaDevices.getUserMedia({audio: true});
  		micStream.recorder = new MediaRecorder(micStream);
  		micStream.chunks = [];
  		micStream.name = 'mic';
  	} catch (err) {
  		printError(err);
  	}

  	//capture tab audio
  	chrome.tabCapture.capture({audio: true}, function(stream) {
  		tabStream = stream;
  		tabStream.recorder = new MediaRecorder(tabStream);
  		tabStream.chunks = [];
  		tabStream.name = 'tab';
  		
  		save[tab.id] = {tab: tabStream, mic: micStream};
  	});
}

function printError(error) {
	console.error(error.name + ': ' + error.message);
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