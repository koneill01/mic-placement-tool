// Initialize scene, camera, renderer
let scene = new THREE.Scene();
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

// Loading bar
const loadingContainer = document.createElement('div');
loadingContainer.id = 'loadingContainer';
loadingContainer.style.position = 'absolute';
loadingContainer.style.width = '300px';
loadingContainer.style.height = '20px';
loadingContainer.style.backgroundColor = '#fff';
loadingContainer.style.top = '50%';
loadingContainer.style.left = '50%';
loadingContainer.style.transform = 'translate(-50%, -50%)';
loadingContainer.style.borderRadius = '5px';
loadingContainer.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.5)';
document.body.appendChild(loadingContainer);

const loadingBar = document.createElement('div');
loadingBar.id = 'loadingBar';
loadingBar.style.width = '0';
loadingBar.style.height = '100%';
loadingBar.style.backgroundColor = '#007bff';
loadingContainer.appendChild(loadingBar);

let drumKit, micModel;

const loader = new THREE.GLTFLoader();
loader.load('assets/drumkit.glb', function (gltf) {
    drumKit = gltf.scene;
    drumKit.scale.set(4, 4, 4);
    drumKit.position.set(0, -2, 0);
    scene.add(drumKit);

    // After drum kit loads, load the microphone
    loader.load('assets/d112_microphone.glb', function (gltfMic) {
        micModel = gltfMic.scene;
        micModel.scale.set(0.02, 0.02, 0.02); // Slightly smaller microphone
        micModel.position.set(0, -0.5, 1.3); // Closer and higher to the drum kit

        micModel.rotation.set(0, Math.PI / 2, 0); // Rotate microphone to face drum kit

        drumKit.add(micModel); // Attach microphone to drum kit for rotation

        // Remove loading bar once both models are loaded
        document.body.removeChild(loadingContainer);
        console.log('Microphone loaded successfully');
    }, undefined, function (error) {
        console.error('Error loading microphone:', error);
    });

}, function (xhr) {
    // Update loading bar progress
    const percentComplete = xhr.loaded / xhr.total * 100;
    loadingBar.style.width = `${percentComplete}%`;
    console.log(percentComplete + '% loaded');
}, function (error) {
    console.error('An error occurred while loading the drum kit:', error);
});

// Invisible plane for X-axis mic movement
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, 0);
scene.add(plane);

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let draggable = null;

window.addEventListener('mousedown', onMouseDown);

function onMouseDown(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
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
            draggable.position.set(point.x, draggable.position.y, draggable.position.z); // X-axis dragging only
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

// Add zoom buttons
document.getElementById('zoomIn').addEventListener('click', () => {
    camera.position.z -= 1; // Zoom in
});
document.getElementById('zoomOut').addEventListener('click', () => {
    camera.position.z += 1; // Zoom out
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
