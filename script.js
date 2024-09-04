const mic = document.getElementById('mic');
const instrument = document.getElementById('instrument');
const audio = document.getElementById('audio');

let audioContext;
let source;
let panner;

window.onload = () => {
    const playButton = document.createElement('button');
    playButton.innerText = 'Start Audio';
    document.body.appendChild(playButton);

    playButton.addEventListener('click', () => {
        // Initialize AudioContext and connect the audio element once
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            source = audioContext.createMediaElementSource(audio);
            panner = audioContext.createStereoPanner();

            source.connect(panner).connect(audioContext.destination);
        }

        audio.play();
        playButton.remove(); // Remove button after audio starts
    });
};

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
        updateAudio(x, rect.width);
    }
});

document.addEventListener('mouseup', () => {
    dragging = false;
    mic.style.cursor = 'grab';
});

function updateAudio(x, width) {
    if (panner) {
        const panValue = (x / width) * 2 - 1;  // Convert x position to range [-1, 1]
        panner.pan.value = panValue;  // Adjust panning based on mic position
    }
}
