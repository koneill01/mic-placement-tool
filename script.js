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
    
        // Set position and scale for the entire microphone
        microphone.scale.set(0.08, 0.08, 0.08); // Now that the scale has been handled in Blender
        microphone.position.set(-2, -1.5, 5); // Adjust position
        microphone.rotation.set(0, 3 * Math.PI / 2, 0); // Adjust rotation
    
        rotationGroup.add(microphone); // Adding the microphone to the rotationGroup
    
        // Adding Drag Controls for the mic group (to ensure the whole thing moves)
        const dragControls = new THREE.DragControls([microphone], camera, renderer.domElement);
    
        // Optional: Highlight dragged object
        dragControls.addEventListener('dragstart', function (event) {
            if (event.object.material && event.object.material.emissive) {
                event.object.material.emissive.set(0xaaaaaa);  // Highlight mic during drag (optional)
            }
        });
        
        dragControls.addEventListener('dragend', function (event) {
            if (event.object.material && event.object.material.emissive) {
                event.object.material.emissive.set(0x000000);  // Remove highlight after drag (optional)
            }
        });
    
        // Constrain dragging to specific axes (e.g., only on x and z)
        dragControls.addEventListener('drag', function (event) {
            event.object.position.y = microphone.position.y; // Lock Y-axis (optional)
        });

        // Add 3D positional audio
        let listener = new THREE.AudioListener();
        camera.add(listener);

        // Create a positional audio source
        let sound = new THREE.PositionalAudio(listener);
        let audioLoader = new THREE.AudioLoader();
        audioLoader.load('assets/drum-loop-kick.mp3', function(buffer) {
            sound.setBuffer(buffer);
            sound.setRefDistance(1); // Smaller ref distance to make the spatial effect more noticeable
            sound.setRolloffFactor(2); // Increase the rolloff to make the audio change more drastically
            sound.setDistanceModel('exponential'); // Exponential rolloff
            sound.loop = true;
        });

        // Position audio source at the kick drum (replace with actual kick drum coordinates)
        let kickDrumPosition = new THREE.Vector3(0, -2.5, 0); // Adjust based on your model
        sound.position.copy(kickDrumPosition);
        scene.add(sound);

        // Function to calculate mic distance and update sound
        function updateAudioBasedOnMic() {
            if (microphone && sound.isPlaying) {
                let micPosition = microphone.position;
                let distance = micPosition.distanceTo(kickDrumPosition);

                // Adjust the sound properties based on distance
                sound.setRefDistance(Math.max(0.5, distance));  // Ensure a minimum refDistance
            }
        }

        // Button to start/stop audio
        document.getElementById('startAudio').onclick = function () {
            if (!sound.isPlaying) {
                sound.play();
                document.getElementById('startAudio').style.display = 'none';
                document.getElementById('stopAudio').style.display = 'block';
            }
        };

        document.getElementById('stopAudio').onclick = function () {
            if (sound.isPlaying) {
                sound.stop();
                document.getElementById('startAudio').style.display = 'block';
                document.getElementById('stopAudio').style.display = 'none';
            }
        };

        // Include updateAudioBasedOnMic in the animate loop
        function animate() {
            requestAnimationFrame(animate);
            updateAudioBasedOnMic(); // Update audio properties based on mic position
            renderer.render(scene, camera);
        }
        animate();
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
