// General Three.js Setup
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x555555); // Setting the background color

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 18); // Adjusted camera position

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add lights
let light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);

let ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Ambient light for overall lighting
scene.add(ambientLight);

// Create a group for the drum kit and microphone for common axis rotation
let rotationGroup = new THREE.Group();
scene.add(rotationGroup);

// Loading Bar Logic
let loadingManager = new THREE.LoadingManager();
let progressBar = document.getElementById('loadingBar');
let progressContainer = document.getElementById('loadingContainer');

loadingManager.onStart = function () {
    progressContainer.style.display = 'block';
};

loadingManager.onProgress = function (url, loaded, total) {
    let progress = (loaded / total) * 100;
    progressBar.style.width = progress + "%";
    progressBar.innerHTML = Math.floor(progress) + "% Loading";
};

loadingManager.onLoad = function () {
    progressContainer.style.display = 'none';
};

// Load Drum Kit Model
let loader = new THREE.GLTFLoader(loadingManager);
loader.load('assets/drumkit.glb', function (gltf) {
    let drumKit = gltf.scene;
    drumKit.scale.set(6, 6, 6); // Scaling drum kit to be larger
    drumKit.position.set(0, -2.5, 0); // Adjusting position to sit on the ground
    rotationGroup.add(drumKit); // Adding to the rotation group

    // Load Microphone Model
    loader.load('assets/d112_microphone.glb', function (micGltf) {
        let microphone = micGltf.scene;
        console.log(microphone); // Debugging: Check if the model is loaded properly
    
        // Create a group to hold the microphone and its parts
        let micGroup = new THREE.Group();

        if (microphone) {
            // Traverse the scene and add each mesh to the group
            microphone.traverse(function(child) {
                if (child.isMesh) {
                    if (!child.material) {
                        // Fallback material in case there's no material
                        child.material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
                    }
                    micGroup.add(child); // Add each mesh part of the microphone to the group
                }
            });
        } else {
            console.error("Microphone model not loaded properly.");
        }
    
        // Set position and scale for the entire group
        micGroup.scale.set(0.08, 0.08, 0.08); // Adjust mic scale
        micGroup.position.set(-2, -1.5, 5); // Adjust position
        micGroup.rotation.set(0, 1.57, 0); // Adjust rotation
    
        rotationGroup.add(micGroup); // Adding the group to the rotationGroup
    
        // Adding Drag Controls for the mic group (to ensure the whole thing moves)
        const dragControls = new THREE.DragControls([micGroup], camera, renderer.domElement);
    
        // Optional: Highlight dragged object
        dragControls.addEventListener('dragstart', function (event) {
            // Ensure the object has material and it supports emissive before setting it
            if (event.object.material && event.object.material.emissive) {
                event.object.material.emissive.set(0xaaaaaa);  // Highlight mic during drag (optional)
            }
        });
        
        dragControls.addEventListener('dragend', function (event) {
            // Ensure the object has material and it supports emissive before resetting it
            if (event.object.material && event.object.material.emissive) {
                event.object.material.emissive.set(0x000000);  // Remove highlight after drag (optional)
            }
        });
    
        // Constrain dragging to specific axes (e.g., only on x and z)
        dragControls.addEventListener('drag', function (event) {
            event.object.position.y = micGroup.position.y; // Lock Y-axis (optional)
        });
    });

    // Rotate and zoom controls
    document.getElementById('moveLeft').onmousedown = function () {
        rotateLeft();
        interval = setInterval(rotateLeft, 100);
    };
    document.getElementById('moveLeft').onmouseup = function () {
        clearInterval(interval);
    };

    document.getElementById('moveRight').onmousedown = function () {
        rotateRight();
        interval = setInterval(rotateRight, 100);
    };
    document.getElementById('moveRight').onmouseup = function () {
        clearInterval(interval);
    };

    document.getElementById('moveCenter').onclick = function () {
        rotationGroup.rotation.set(0, 0, 0); // Reset both drum kit and mic rotation
    };

    let zoomSpeed = 0.2;
    document.getElementById('zoomIn').onmousedown = function () {
        zoomIn();
        interval = setInterval(zoomIn, 100);
    };
    document.getElementById('zoomIn').onmouseup = function () {
        clearInterval(interval);
    };

    document.getElementById('zoomOut').onmousedown = function () {
        zoomOut();
        interval = setInterval(zoomOut, 100);
    };
    document.getElementById('zoomOut').onmouseup = function () {
        clearInterval(interval);
    };

    function rotateLeft() {
        rotationGroup.rotation.y -= 0.05;  // Rotating the entire group to the left
    }

    function rotateRight() {
        rotationGroup.rotation.y += 0.05;  // Rotating the entire group to the right
    }

    function zoomIn() {
        camera.position.z -= zoomSpeed;
    }

    function zoomOut() {
        camera.position.z += zoomSpeed;
    }

    animate();
});

// Animate Scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Audio logic (unchanged)
document.getElementById('startAudio').onclick = function () {
    let audioContext = new AudioContext();
    let audio = new Audio('assets/drumbeat.mp3');
    let audioSource = audioContext.createMediaElementSource(audio);
    audioSource.connect(audioContext.destination);
    audio.play();
    document.getElementById('startAudio').style.display = 'none';
    document.getElementById('stopAudio').style.display = 'block';
};

document.getElementById('stopAudio').onclick = function () {
    audio.pause();
    document.getElementById('startAudio').style.display = 'block';
    document.getElementById('stopAudio').style.display = 'none';
};
