import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- CONFIGURACIÓN ---
let scene, camera, renderer, controls, peer;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let prevTime = performance.now();

// --- INICIALIZAR EL MOTOR 3D ---
function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x78a7ff);
    scene.fog = new THREE.Fog(0x78a7ff, 20, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);

    // Generar suelo básico
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x448032 });
    const mesh = new THREE.InstancedMesh(geo, mat, 2500);
    const dummy = new THREE.Object3D();

    let i = 0;
    for(let x = -25; x < 25; x++) {
        for(let z = -25; z < 25; z++) {
            dummy.position.set(x, Math.floor(Math.sin(x/5)*2), z);
            dummy.updateMatrix();
            mesh.setMatrixAt(i++, dummy.matrix);
        }
    }
    scene.add(mesh);
    camera.position.y = 5;

    animate();
}

// --- CONTROLES DE TECLADO ---
document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Escape' && controls.isLocked) {
        controls.unlock();
        document.getElementById('esc-menu').classList.add('active');
    }
});

document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
});

// --- LÓGICA DE INTERFAZ ---
document.getElementById('btn-create').addEventListener('click', startNewGame);
document.getElementById('btn-play').addEventListener('click', startNewGame);
document.getElementById('btn-reanudar').addEventListener('click', () => {
    document.getElementById('esc-menu').classList.remove('active');
    controls.lock();
});

function startNewGame() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('crosshair').style.display = 'block';
    if(!scene) initEngine();
    controls.lock();
}

// --- MULTIJUGADOR (PeerJS) ---
document.getElementById('btn-host').addEventListener('click', () => {
    peer = new Peer();
    peer.on('open', (id) => {
        alert("Servidor Abierto. Comparte esta ID: " + id);
        document.getElementById('peer-id-display').innerText = "Tu ID: " + id;
        startNewGame();
    });
    peer.on('connection', (conn) => {
        conn.on('data', (data) => console.log("Recibido:", data));
    });
});

document.getElementById('btn-join').addEventListener('click', () => {
    const remoteId = prompt("Ingresa la ID del Host:");
    if(remoteId) {
        peer = new Peer();
        peer.on('open', () => {
            const conn = peer.connect(remoteId);
            conn.on('open', () => {
                conn.send('¡Hola, me he unido!');
                startNewGame();
            });
        });
    }
});

// --- BUCLE DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        prevTime = time;
    }
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if(camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
