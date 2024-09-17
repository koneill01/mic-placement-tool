// Initialize scene, camera, renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

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
    drumKit.scale.set(5, 5, 5);
    drumKit.position.set(0, -2, 0); // Start centered
    scene.add(drumKit);
}, undefined, function(error) {
    console.error('An error occurred while loading the model:', error);
});

// Create a draggable microphone object
const micGeometry = new THREE.SphereGeometry(1, 32, 32);
const micMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const microphone = new THREE.Mesh(micGeometry, micMaterial);
microphone.position.set(5, 0, 0);
scene.add(microphone);

// Create an invisible plane for mic movement (x-y plane, fixed at z=0)
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, 0);
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
            draggable.position.set(point.x, point.y, draggable.position.z);
        }
    }
}

function onMouseUp() {
    draggable = null;
    window.removeEventListener('mousemove', onMouseMove, false);
    window.removeEventListener('mouseup', onMouseUp, false);
}

// Add buttons to move the drum kit to preset positions
document.getElementById('moveLeft').addEventListener('click', () => {
    if (drumKit) drumKit.position.x -= 2; // Move left
});

document.getElementById('moveRight').addEventListener('click', () => {
    if (drumKit) drumKit.position.x += 2; // Move right
});

document.getElementById('moveCenter').addEventListener('click', () => {
    if (drumKit) drumKit.position.x = 0; // Center drum kit
});

// Fix for audio playback (add a button to start audio after user interaction)
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioElement = new Audio('assets/drum-loop.mp3'); // Replace with your audio file
let track = audioContext.createMediaElementSource(audioElement);
let gainNode = audioContext.createGain();
track.connect(gainNode).connect(audioContext.destination);
audioElement.loop = true;

document.getElementById('startAudio').addEventListener('click', () => {
    audioContext.resume().then(() => {
        audioElement.play(); // Play audio after interaction
        document.getElementById('startAudio').style.display = 'none'; // Hide the button after starting
    });
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
