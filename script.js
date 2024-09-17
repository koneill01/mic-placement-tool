// Initialize scene, camera, renderer
let scene = new THREE.Scene(); // Ensure scene is defined at the start
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Set a new background color for better contrast
scene.background = new THREE.Color(0x404040); // Light gray background for contrast

// Adjust the camera position
camera.position.set(0, 5, 20); // Move the camera further back to fit the drum kit

// Add lighting
const light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Load GLTFLoader and the drumkit model
const loader = new THREE.GLTFLoader();
let drumKit, micModel;

loader.load('assets/drumkit.glb', function(gltf) {
    drumKit = gltf.scene;
    drumKit.scale.set(4, 4, 4); // Scale drum kit
    drumKit.position.set(0, -2, 0); // Center the drum kit
    scene.add(drumKit);

    console.log('Drumkit loaded successfully');

    // Load the microphone model after the drum kit
    loader.load('assets/d112_microphone.glb', function(gltfMic) {
        micModel = gltfMic.scene;
        micModel.scale.set(0.03, 0.03, 0.03); // Slightly larger microphone size
        micModel.position.set(0, -1.2, 2.5); // Move it closer in front of the kick drum

        // Rotate the microphone 180 degrees to face the drum kit correctly
        micModel.rotation.set(0, Math.PI, 0); // Flip microphone

        drumKit.add(micModel); // Attach the microphone to the drum kit so it rotates together
        console.log('Microphone loaded successfully');
    }, undefined, function(error) {
        console.error('Error loading microphone:', error);
    });
}, undefined, function(error) {
    console.error('An error occurred while loading the drum kit:', error);
});

// Create an invisible plane for mic movement (x-y plane, fixed at z=0)
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, 0); // Plane for movement
scene.add(plane);

// Raycaster and draggable object (Microphone simulation)
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let draggable = null;

// Ensure smoother dragging
window.addEventListener('mousedown', onMouseDown);

function onMouseDown(event) {
    event.preventDefault(); // Prevent any default action
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Make the microphone draggable independently
    let intersects = raycaster.intersectObjects([micModel]);

    if (intersects.length > 0) {
        draggable = intersects[0].object;
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
}

function onMouseMove(event) {
    event.preventDefault();
    if (draggable) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObject(plane);

        if (intersects.length > 0) {
            let point = intersects[0].point;
            draggable.position.set(point.x, point.y, draggable.position.z); // Allow microphone dragging
        }
    }
}

function onMouseUp(event) {
    event.preventDefault();
    draggable = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
}

// Continuous rotation on button press
let rotating = false;
let rotationDirection = 0;

document.getElementById('moveLeft').addEventListener('mousedown', () => {
    rotating = true;
    rotationDirection = 1; // Rotate left
});

document.getElementById('moveRight').addEventListener('mousedown', () => {
    rotating = true;
    rotationDirection = -1; // Rotate right
});

document.getElementById('moveLeft').addEventListener('mouseup', stopRotation);
document.getElementById('moveRight').addEventListener('mouseup', stopRotation);
document.getElementById('moveLeft').addEventListener('mouseleave', stopRotation);
document.getElementById('moveRight').addEventListener('mouseleave', stopRotation);

function stopRotation() {
    rotating = false;
    rotationDirection = 0;
}

document.getElementById('moveCenter').addEventListener('click', () => {
    drumKit.rotation.y = 0; // Center/Reset the drum kit rotation
});

// Fix for audio playback (start/stop audio)
let audioContext;
let audioElement;
let gainNode;

document.getElementById('startAudio').addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioElement = new Audio('assets/drum-loop.mp3'); // Replace with your audio file
        let track = audioContext.createMediaElementSource(audioElement);
        gainNode = audioContext.createGain();
        track.connect(gainNode).connect(audioContext.destination);
        audioElement.loop = true;
        audioElement.play(); // Start playing the audio
        document.getElementById('startAudio').style.display = 'none'; // Hide the button
        document.getElementById('stopAudio').style.display = 'inline'; // Show stop button
    }
    audioContext.resume(); // Ensure audio starts after interaction
});

// Add Stop Audio button functionality
document.getElementById('stopAudio').addEventListener('click', () => {
    if (audioElement) {
        audioElement.pause(); // Stop the audio
        document.getElementById('stopAudio').style.display = 'none'; // Hide the stop button
        document.getElementById('startAudio').style.display = 'inline'; // Show start button again
    }
});

// Render loop
function animate() {
    if (rotating) {
        drumKit.rotation.y += rotationDirection * 0.02; // Continuous rotation based on direction
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Window resize handling
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
