let scene, camera, micCamera, renderer, sound, microphone, rotationGroup, audioContext, soundInitialized = false;

// Setup scene, camera, renderer, etc.
function init() {
    // Disable the start audio button until the audio is loaded
    document.getElementById('startAudio').disabled = true;

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x555555); // Set background color
    
    // Add lights
    let light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);

    let ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Ambient light for overall lighting
    scene.add(ambientLight);

    // Create the main camera for viewing
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Create mic camera to follow microphone for sound only
    micCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement); // Attach to #container

    // Create rotation group
    rotationGroup = new THREE.Group();
    scene.add(rotationGroup);

    // Set up resize listener
    window.addEventListener('resize', onWindowResize, false);

    // Load models
    loadModels();

    // Set up rotate and zoom controls
    setupControls();
}

function loadModels() {
    let loader = new THREE.GLTFLoader();

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

    loader = new THREE.GLTFLoader(loadingManager);

    loader.load('assets/drumkit.glb', function (gltf) {
        let drumKit = gltf.scene;
        drumKit.scale.set(6, 6, 6); // Scaling drum kit to be larger
        drumKit.position.set(0, -2.5, 0); // Adjusting position to sit on the ground
        rotationGroup.add(drumKit); // Adding to the rotation group
        console.log("Drum kit added:", drumKit.position);

        loader.load('assets/d112_microphone.glb', function (micGltf) {
            microphone = micGltf.scene;
            microphone.scale.set(0.08, 0.08, 0.08); // Now that the scale has been handled in Blender
            microphone.position.set(4.3, -1.5, 5); // Adjust position
            microphone.rotation.set(0, Math.PI / 2, 0); // Adjust rotation
            rotationGroup.add(microphone);
            console.log("Microphone added:", microphone.position);

            // Constrain microphone dragging
            setupDragControls();

            // Set the mic camera to follow the microphone's position
            micCamera.position.copy(microphone.position);
            micCamera.lookAt(0, 0, 0); // Make it look at the drum kit

            fitCameraToScene();  // Fit camera after loading both models

            // Now that models are loaded, we can initialize the audio
            setupAudio();
        });
    });
}

function fitCameraToScene() {
    const box = new THREE.Box3().setFromObject(rotationGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    cameraZ *= 1.5;  // Zoom out a bit more

    camera.position.set(center.x, center.y, center.z + cameraZ);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
}

function setupAudio() {
    // Initialize the AudioContext here but don't start until user interaction
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    let listener = new THREE.AudioListener();
    micCamera.add(listener);  // Attach listener to the mic camera

    sound = new THREE.PositionalAudio(listener);
    let audioLoader = new THREE.AudioLoader();
    audioLoader.load('assets/drum-loop-kick.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setRefDistance(1);  // Adjusted distance for positional audio
        sound.setRolloffFactor(10);  // More drastic rolloff factor
        sound.setDistanceModel('exponential');  // Exponential distance model
        sound.setVolume(5);  // Volume for testing
        sound.loop = true;
        sound.position.set(0, -2.5, 0);  // Set sound at the kick drum position
        scene.add(sound);

        soundInitialized = true; // Indicate the sound is fully loaded
        console.log("Audio setup complete. Sound position:", sound.position);

        // Enable the start audio button
        document.getElementById('startAudio').disabled = false;
    });
}

function setupDragControls() {
    if (!microphone) {
        console.error("Microphone not loaded yet");
        return;
    }
    const dragControls = new THREE.DragControls([microphone], camera, renderer.domElement);
    dragControls.addEventListener('drag', function (event) {
        console.log("Dragging microphone. New position:", microphone.position);
        updateAudioBasedOnMic();
    });

    // Constrain dragging to specific axes (x-axis movement only)
    dragControls.addEventListener('drag', function (event) {
        event.object.position.y = -1.5; // Lock Y-axis
        event.object.position.z = 5; // Lock Z-axis

        // Update the mic camera's position to match the microphone
        micCamera.position.copy(microphone.position);
        micCamera.lookAt(0, 0, 0); // Make sure the mic camera continues to "look" at the drum kit
    });
}

function updateAudioBasedOnMic() {
    if (!sound || !microphone) return;

    let micWorldPosition = new THREE.Vector3();
    microphone.getWorldPosition(micWorldPosition);

    let kickDrumPosition = new THREE.Vector3(0, -2.5, 0);

    let distance = micWorldPosition.distanceTo(kickDrumPosition);

    // Sharper volume change based on distance
    let volume = 10 / (distance * distance);
    volume = Math.max(0, Math.min(1, volume));

    sound.setVolume(volume);

    console.log("Mic distance:", distance.toFixed(2), "Volume:", volume.toFixed(2));
}

function animate() {
    requestAnimationFrame(animate);
    updateAudioBasedOnMic();
    renderer.render(scene, camera);  // Render from the main camera's perspective
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupControls() {
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
}

// Audio control buttons
document.getElementById('startAudio').onclick = function () {
    if (audioContext && soundInitialized) {
        // Resume AudioContext after user interaction
        audioContext.resume().then(() => {
            if (!sound.isPlaying) {
                sound.play();
                console.log("Audio started. Is playing:", sound.isPlaying);
            } else {
                console.log("Audio is already playing");
            }
            document.getElementById('startAudio').style.display = 'none';
            document.getElementById('stopAudio').style.display = 'block';
        });
    } else {
        console.log("Sound object not initialized yet");
    }
};

document.getElementById('stopAudio').onclick = function () {
    if (sound && sound.isPlaying) {
        sound.stop();
        console.log("Audio stopped");
        document.getElementById('startAudio').style.display = 'block';
        document.getElementById('stopAudio').style.display = 'none';
    }
};

// Initialize the scene
init();

// Start the animation loop
animate();
