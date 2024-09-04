const mic = document.getElementById('mic');
const instrument = document.getElementById('instrument');
const audio = document.getElementById('audio');
const toggleButton = document.createElement('button'); // Create the toggle button
/* const holeMarker = document.getElementById('holeMarker'); // Hole marker */

// Set initial button text
toggleButton.innerText = 'Start Audio';
document.body.appendChild(toggleButton); // Add the button to the body

let audioContext;
let source;
let panner;
let bassEQ;

// Define the position of the hole on the drum
let holeX = 390;  // Increase this to move the marker to the right
let holeY = 400;  // Increase this to move the marker down

// Position the hole marker visually based on holeX and holeY
/* holeMarker.style.left = `${holeX - 10}px`;  // Center the marker horizontally
holeMarker.style.top = `${holeY - 10}px`;   // Center the marker vertically
 */

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

        // Change button text to "Stop Audio" without removing it
        toggleButton.innerText = 'Stop Audio';
    } else {
        // Stop the audio and reset the button to "Start Audio"
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
        updateAudio(x, y);
    }
});

document.addEventListener('mouseup', () => {
    dragging = false;
    mic.style.cursor = 'grab';
});

// Function to calculate the distance between two points
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function updateAudio(micX, micY) {
    if (panner) {
        const panValue = (micX / instrument.offsetWidth) * 2 - 1;  // Convert x position to range [-1, 1]
        panner.pan.value = panValue;  // Adjust panning based on mic position
    }

    if (bassEQ) {
        // Calculate the distance between the mic and the hole
        const distance = calculateDistance(micX, micY, holeX, holeY);

        // Adjust the bass based on the distance from the hole
        const maxDistance = 300;  // Define a maximum distance where the effect becomes minimal
        const bassBoost = Math.max(0, (maxDistance - distance) / maxDistance) * 10;  // Maximum boost is 10dB

        bassEQ.gain.setValueAtTime(bassBoost, audioContext.currentTime);
    }
}
