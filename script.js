// Initialize scene, camera, renderer, and controls
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add controls for moving the drum kit around
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 20); // Adjust camera position
controls.update();

// Add lighting
const light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Load GLTFLoader and the drumkit model
const loader = new THREE.GLTFLoader();

let drumKit; // Variable to store the drumkit model

loader.load('assets/drumkit.glb', function(gltf) {
    drumKit = gltf.scene;
    drumKit.scale.set(5, 5, 5);
    drumKit.position.set(0, -2, 0);
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

// Load and play an audio file using the Web Audio API
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioElement = new Audio('assets/drum-loop.mp3'); // Add your audio file here
let track = audioContext.createMediaElementSource(audioElement);
let gainNode = audioContext.createGain(); // Control volume
track.connect(gainNode).connect(audioContext.destination);
audioElement.loop = true; // Loop the sound
audioElement.play(); // Start playing the audio

// Listen for mouse down to start dragging the microphone
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

            // Calculate distance from the microphone to the drum kit and adjust volume
            if (drumKit) {
                let distance = microphone.position.distanceTo(drumKit.position);
                let volume = Math.max(0.1, 1 - distance / 20); // Adjust volume based on distance
                gainNode.gain.value = volume;
                console.log("Distance: ", distance, "Volume: ", volume);
            }
        }
    }
}

function onMouseUp() {
    draggable = null;
    window.removeEventListener('mousemove', onMouseMove, false);
    window.removeEventListener('mouseup', onMouseUp, false);
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update orbit controls
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
