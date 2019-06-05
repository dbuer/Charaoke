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

// listens for button clicks from the iframe
chrome.runtime.onMessage.addListener(function(msg, sender) {
	if (msg.task == 'start') {
		startRecording(sender.tab)
	} else if (msg.task == 'stop') {
		stopRecording(sender.tab);
	} else if (msg.task == 'perms' && msg.allow) {
		getMediaStreams(sender.tab);
	} else if (msg.task == 'close') {
		closeMediaStreams(sender.tab);
	}
});

// starts recording all streams
function startRecording(tab) {
	let media = save[tab.id];
	let tabRecorder = media.tab.recorder;
	let micRecorder = media.mic.recorder;

	tabRecorder.ondataavailable = function(chunk) {
		media.tab.chunks.push(chunk.data);
	}

	micRecorder.ondataavailable = function(chunk) {
		media.mic.chunks.push(chunk.data);
	}

	tabRecorder.onstop = onStop;
	micRecorder.onstop = onStop;

	tabRecorder.start();
	micRecorder.start();
}

function stopRecording(tab) {
	let media = save[tab.id];
	media.tab.recorder.stop();
	media.mic.recorder.stop();
}

function onStop(event) {
	let stream = event.srcElement.stream;
	let chunks = stream.chunks;
	let blob = new Blob(chunks, {'type' : 'audio/ogg; codecs=opus'});
	let micURL = window.URL.createObjectURL(blob);
	if (stream.type == 'mic') {
		let mic = new Audio();
		mic.src = micURL;
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

// opens all streams and intializes recording object
async function getMediaStreams(tab) {
	let audio = new Audio();
	let media = {}
  	
  	//capture microphone audio
  	try {
  		media.mic = await navigator.mediaDevices.getUserMedia({audio: true});
  		media.mic.recorder = new MediaRecorder(media.mic);
  		media.mic.chunks = [];
  		media.mic.type = 'mic';
  	} catch (err) {
  		printError(err);
  	}

  	//capture tab audio
  	chrome.tabCapture.capture({audio: true}, function(stream) {
  		media.tab = stream;
  		media.tab.recorder = new MediaRecorder(stream);
  		media.tab.chunks = [];
  		media.mic.type = 'mic';
  		audio.srcObject = stream;
  		media.audio = audio;
  		save[tab.id] = media;
  	});
}

function printError(error) {
	console.error(error.name + ': ' + error.message);
}

function closeMediaStreams(tab) {
	let tabStream = save[tab.id].tab;
	let micStream = save[tab.id].mic;
	tabStream.getTracks().forEach(track => track.stop());
	micStream.getTracks().forEach(track => track.stop());
	save[tab.id] = null;
}

/*
	Main Voice Factors to consider:
	Pitch and Volume
	
	S_1 = Pitch
	S_2 = Volume
	sampleRate = 44100

	Score = w_1(S_1) + w_2(S_2) where w_1, w_2 are weights summing to 1.

	w_1 = 0.74
	w_2 = 0.26   Best weights according to paper.
	
	Pitch Evaluation (S_1) ~
	
	Convert Waveform to MIDI notes:
	1. Divide the waveform signal into frames using a sliding Hamming window.
	2. Perform Fast Fourier Transform with respect to each frame.
	3. Compute the signal's enery with respect to each FFT index (frequency bin) in a frame.
	4. Estimate the signal's energy with respect to each MIDI note number in a frame using:
		-MIDI note = floor(12 * log_2(Hz/440) + 69.5)
	5. Sum the signal's energy belonging to a note and its harmonic note numbers to obtain 
	   a strength value, i.e., the strength of note (m) in frame (t) is obtained by:
	   	-y_t,m = sum[0->C]((h^c * e_t,m) + (12 * c))
	   	-e_t,m is the signal's energy at note m of frame t
	   	-C is the number of harmonics considered
	   	-h is a weight that discounts higher harmonics
	6. Determine note in frame t by choosing the the note number associated with the largest
	   value of the strength accumulated for adjacent +-B frames:
	   	-argmax[1->M](sum[-B->B](y_t+b,m))
	   	-M is the number of the possible notes performed by the singer
	7. Remove jitters between adjacent frames by replacing each note with the local median of 
	   notes of its neighboring +-B frames.

	Evaluation parameters:
	Length of frame: 30ms
	FFT Size: 2048
	C: 2   for eq 3&4
	h: 0.8
	B: 2

	Weight 
	
	(Goal: 6/4/19)
	Signal Processing:
	1. Convert the stream into wav format, i.e. pcm data
		-web audio api? recording api? blobs?
		-get blob -> new Response(blob).arrayBuffer() -> ctx.decodeAudioData(buffer)
	2. divide the data into frames of 30ms length
	3. overlap 50% of the data from the frames
	4. apply the hamming algorithm to the frame
		-new[i] = (0.54 - 0.46 * cos(2pi/N * i)) * old[i]
	5. apply fft to the frame

*/