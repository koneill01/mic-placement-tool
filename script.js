// Initialize scene, camera, and renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add lighting
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);

// Ambient lighting to ensure all objects are visible
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Softer ambient light
scene.add(ambientLight);

// Load GLTFLoader
const loader = new THREE.GLTFLoader();

// Load the drumkit model from the assets folder
loader.load('assets/drumkit.glb', function(gltf) {
    const model = gltf.scene;
    model.position.set(0, 0, 0); // Center the drumkit model
    scene.add(model);
}, undefined, function(error) {
    console.error('An error occurred while loading the model:', error);
});

// Set camera position
camera.position.set(0, 0, 15); // Move camera further back

// Create a draggable microphone object
const micGeometry = new THREE.SphereGeometry(1, 32, 32); // Larger sphere for the mic
const micMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for visibility
const microphone = new THREE.Mesh(micGeometry, micMaterial);
microphone.position.set(2, 0, 0); // Place it slightly to the side of the drumkit
scene.add(microphone);

// Create an invisible plane for mic movement (x-y plane, fixed at z=0)
const planeGeometry = new THREE.PlaneGeometry(100, 100); // Large plane
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, 0); // Fixed at z=0
scene.add(plane);

// Raycaster and draggable object (Microphone simulation)
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let draggable = null;

// Listen for mouse down
window.addEventListener('mousedown', onMouseDown, false);

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    // Check if we're clicking the microphone first
    let intersects = raycaster.intersectObjects([microphone]);

    if (intersects.length > 0) {
        console.log("Object clicked: ", intersects[0].object);
        draggable = intersects[0].object;
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mouseup', onMouseUp, false);
    } else {
        console.log("No objects intersected.");
    }
}

function onMouseMove(event) {
    if (draggable) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // Intersect the plane instead of free space
        let intersects = raycaster.intersectObject(plane);

        if (intersects.length > 0) {
            let point = intersects[0].point; // Constrain the mic to this plane
            console.log("Dragging to point: ", point);
            draggable.position.set(point.x, point.y, draggable.position.z); // Only update x and y
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
