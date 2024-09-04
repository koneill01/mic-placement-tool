const mic = document.getElementById('mic');
const instrument = document.getElementById('instrument');
const audio = document.getElementById('audio');
const toggleButton = document.createElement('button'); // Create the toggle button

// Set initial button text
toggleButton.innerText = 'Start Audio';
document.body.appendChild(toggleButton); // Add the button to the body

let audioContext;
let source;
let panner;
let bassEQ;

toggleButton.addEventListener('click', () => {
    if (!audioContext || audioContext.state === 'suspended') {
        if (!audioContext) {
            // Initialize AudioContext and connect the audio element once
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            source = audioContext.createMediaElementSource(audio);

            // Create bass EQ filter
            bassEQ = audioContext.createBiquadFilter();
            bassEQ.type = 'lowshelf';  // Boost or cut low frequencies
            bassEQ.frequency.setValueAtTime(100, audioContext.currentTime); // 100Hz

            panner = audioContext.createStereoPanner();

            // Connect audio source -> bassEQ -> panner -> destination
            source.connect(bassEQ).connect(panner).connect(audioContext.destination);
        }

        audio.play();
        audioContext.resume();  // Ensure the AudioContext is active

        // Change button to Stop Audio
        toggleButton.innerText = 'Stop Audio';
    } else {
        // Stop the audio and reset the button to Start Audio
        audio.pause();
        audio.currentTime = 0;  // Reset to the beginning
        audioContext.suspend();  // Suspend the AudioContext to stop audio processing

        toggleButton.innerText = 'Start Audio';
    }
});

let dragging = false;

mic.addEventListener('mousedown', (e) => {
    dragging = true;
    mic.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (dragging) {
        const rect = instrument.getBoundingClientRect();
        let x = e.clientX - rect.left - (mic.offsetWidth / 2);
        let y = e.clientY - rect.top - (mic.offsetHeight / 2);

        // Boundaries to prevent mic from going out of instrument
        x = Math.max(0, Math.min(x, rect.width - mic.offsetWidth));
        y = Math.max(0, Math.min(y, rect.height - mic.offsetHeight));

        mic.style.left = `${x}px`;
        mic.style.top = `${y}px`;

        // Update audio based on mic position
        updateAudio(x, y, rect.width, rect.height);
    }
});

document.addEventListener('mouseup', () => {
    dragging = false;
    mic.style.cursor = 'grab';
});

function updateAudio(x, y, width, height) {
    if (panner) {
        const panValue = (x / width) * 2 - 1;  // Convert x position to range [-1, 1]
        panner.pan.value = panValue;  // Adjust panning based on mic position
    }

    if (bassEQ) {
        // Fine-tune EQ to prevent extreme distortion (-10dB to +10dB)
        const eqValue = -10 + (y / height) * 20;  // Adjust the bass EQ from -10dB to +10dB
        bassEQ.gain.setValueAtTime(eqValue, audioContext.currentTime);
    }
}
