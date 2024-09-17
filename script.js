// General Three.js Setup
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add lights
let light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);

let ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Ambient light for overall lighting
scene.add(ambientLight);

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
    drumKit.position.set(0, -1, 0);
    scene.add(drumKit);

    // Load Microphone Model
    loader.load('assets/d112_microphone.glb', function (micGltf) {
        let microphone = micGltf.scene;
        microphone.position.set(0, 0.1, 1.5); // Adjust Z axis for height
        scene.add(microphone);

        // Make mic rotate with drumkit
        function rotateDrumKit(angle) {
            drumKit.rotation.y += angle;
            microphone.rotation.y += angle;
        }

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

        let zoomSpeed = 0.05;
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
            rotateDrumKit(-0.05);
        }

        function rotateRight() {
            rotateDrumKit(0.05);
        }

        function zoomIn() {
            camera.position.z -= zoomSpeed;
        }

        function zoomOut() {
            camera.position.z += zoomSpeed;
        }
    });

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
