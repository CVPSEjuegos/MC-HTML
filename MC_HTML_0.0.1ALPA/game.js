import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls, worldMesh;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);
    generateWorld(Math.random() * 100);
    animate();
}

function generateWorld(seed) {
    if(worldMesh) scene.remove(worldMesh);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x448032 });
    worldMesh = new THREE.InstancedMesh(geometry, material, 2500);
    const matrix = new THREE.Matrix4();
    let i = 0;
    for(let x = -25; x < 25; x++) {
        for(let z = -25; z < 25; z++) {
            const y = Math.floor(Math.sin((x + seed) * 0.1) * 2);
            matrix.setPosition(x, y, z);
            worldMesh.setMatrixAt(i++, matrix);
        }
    }
    scene.add(worldMesh);
    camera.position.set(0, 5, 10);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;
        controls.moveForward(-velocity.z * delta);
        controls.moveRight(-velocity.x * delta);
        prevTime = time;
    }
    renderer.render(scene, camera);
}

// --- CONEXIONES MULTIJUGADOR ---

window.conectarServidor = (id) => {
    if(!navigator.onLine) return alert("¡No tienes internet!");
    console.log("Conectando a:", id);
    // Aquí cargarías la semilla del servidor
    startPlaying(id === 'OFFICIAL_TEST_2026' ? 2026 : Math.random());
};

document.getElementById('btn-host').onclick = () => {
    if(!navigator.onLine) return alert("Necesitas internet para crear un servidor.");
    
    const peer = new Peer();
    peer.on('open', (id) => {
        prompt("Servidor Creado. Copia esta ID para tus amigos:", id);
        startPlaying(id);
    });
};

document.getElementById('btn-join').onclick = () => {
    const id = prompt("Ingresa la ID del servidor de tu amigo:");
    if(id) window.conectarServidor(id);
};

function startPlaying(seed) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('crosshair').style.display = 'block';
    if(!scene) initEngine();
    generateWorld(seed);
    controls.lock();
}

// Botones de sistema
document.getElementById('btn-play-alpha').onclick = () => startPlaying(Date.now());
document.getElementById('btn-resume').onclick = () => controls.lock();

document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
});
