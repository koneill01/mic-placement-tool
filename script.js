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

// Create a placeholder object (later replace with a drum kit model)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Create a larger draggable microphone object
const micGeometry = new THREE.SphereGeometry(1, 32, 32); // Larger sphere for the mic
const micMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for visibility
const microphone = new THREE.Mesh(micGeometry, micMaterial);
microphone.position.set(2, 0, 0); // Place it slightly to the side of the cube
scene.add(microphone);

// Set camera position
camera.position.set(0, 0, 15); // Move camera further back

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

// Check WebGL availability
if (!WEBGL.isWebGLAvailable()) {
    const warning = WEBGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}

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
    let intersects = raycaster.intersectObjects(scene.children);

    // Log which object is being clicked
    if (intersects.length > 0) {
        console.log("Intersected Object: ", intersects[0].object);
        draggable = intersects[0].object; // Assign the clicked object to draggable
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mouseup', onMouseUp, false);
    } else {
        console.log("No object intersected.");
    }
}

function onMouseMove(event) {
    if (draggable) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            let point = intersects[0].point;
            draggable.position.copy(point);
            console.log("Dragging to: ", point); // Log dragging process
        }
    }
}

function onMouseUp() {
    draggable = null;
    window.removeEventListener('mousemove', onMouseMove, false);
    window.removeEventListener('mouseup', onMouseUp, false);
}
