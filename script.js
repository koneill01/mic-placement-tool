// Initialize scene, camera, renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

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
let drumKit;

loader.load('assets/drumkit.glb', function(gltf) {
    drumKit = gltf.scene;
    drumKit.scale.set(4, 4, 4); // Restore previous size of drum kit
    drumKit.position.set(0, -2, 0); // Center the drum kit
    scene.add(drumKit);
}, undefined, function(error) {
    console.error('An error occurred while loading the model:', error);
});

// Create a draggable microphone object
const micGeometry = new THREE.SphereGeometry(1, 32, 32); // Restore previous microphone size
const micMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const microphone = new THREE.Mesh(micGeometry, micMaterial);
microphone.position.set(5, 0, 0); // Position the microphone
scene.add(microphone);

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

// Listen for mouse down to drag the microphone
window.addEventListener('mousedown', onMouseDown, false);

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects([microphone]);

    if (intersects.length > 0) {
        draggable = intersects[0].object;
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mouseup', onMouseUp, false);
    }
}

function onMouseMove(event) {
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

function onMouseUp() {
    draggable = null;
    window.removeEventListener('mousemove', onMouseMove, false);
    window.removeEventListener('mouseup', onMouseUp, false);
}

// Rotate the drum kit left and right
document.getElementById('moveLeft').addEventListener('click', () => {
    if (drumKit) drumKit.rotation.y += 0.1; // Rotate drum kit to the left
});

document.getElementById('moveRight').addEventListener('click', () => {
    if (drumKit) drumKit.rotation.y -= 0.1; // Rotate drum kit to the right
});

document.getElementById('moveCenter').addEventListener('click', () => {
    if (drumKit) drumKit.rotation.y = 0; // Center/Reset the drum kit rotation
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
