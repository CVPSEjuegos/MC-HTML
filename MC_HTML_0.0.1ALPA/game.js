import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- VARIABLES GLOBALES ---
let scene, camera, renderer, controls, worldMesh;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();

// MULTIJUGADOR DATA
let peer = null;
let connections = [];
let remotePlayers = {}; // Aquí guardamos los cubos de otros jugadores
let isHost = false;
let myName = JSON.parse(localStorage.getItem('MC_HTML_SETTINGS'))?.name || "Steve";

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
            const y = Math.floor(Math.sin((x + parseFloat(seed || 0)) * 0.1) * 2);
            matrix.setPosition(x, y, z);
            worldMesh.setMatrixAt(i++, matrix);
        }
    }
    scene.add(worldMesh);
    camera.position.set(0, 5, 10);
}

// --- SISTEMA DE TAB / PANEL DE JUGADORES ---
const tabPane = document.createElement('div');
tabPane.id = 'tab-list';
tabPane.style = "position:fixed; top:20%; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:20px; border:2px solid #555; display:none; min-width:300px; z-index:1000; font-family:monospace;";
document.body.appendChild(tabPane);

function updateTabList() {
    let html = `<h3>JUGADORES CONECTADOS</h3><hr>`;
    // Nosotros
    html += `<div>${isHost ? '👑' : '👤'} <b>${myName}</b> (Tú) ${isHost ? '<small>['+peer.id+']</small>' : ''}</div>`;
    
    // Otros
    for (let id in remotePlayers) {
        const p = remotePlayers[id];
        html += `<div>👤 ${p.name || 'Jugador'} ${isHost ? '<small>['+id+']</small>' : ''}</div>`;
    }
    tabPane.innerHTML = html;
}

// --- MOVIMIENTO Y ANIMACIÓN ---
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

        // Enviar nuestra posición a los demás si estamos conectados
        if (connections.length > 0 || Object.keys(remotePlayers).length > 0) {
            broadcastPosition();
        }
    }
    renderer.render(scene, camera);
}

function broadcastPosition() {
    const data = {
        type: 'pos',
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        name: myName
    };
    connections.forEach(conn => {
        if (conn.open) conn.send(data);
    });
}

function handlePeerData(id, data) {
    if (data.type === 'pos') {
        if (!remotePlayers[id]) {
            // Crear cubo para nuevo jugador
            const geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
            const mat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
            const mesh = new THREE.Mesh(geo, mat);
            scene.add(mesh);
            remotePlayers[id] = { mesh: mesh, name: data.name };
            updateTabList();
        }
        remotePlayers[id].mesh.position.set(data.x, data.y - 1, data.z);
    }
}

// --- FUNCIONES DE BOTONES (NO ELIMINADAS, SOLO AMPLIADAS) ---

window.conectarServidor = (id) => {
    if(!navigator.onLine) return alert("¡No tienes internet!");
    isHost = false;
    peer = new Peer();
    peer.on('open', () => {
        const conn = peer.connect(id);
        setupConnection(conn);
    });
    startPlaying(id);
};

document.getElementById('btn-host').onclick = () => {
    if(!navigator.onLine) return alert("Necesitas internet para crear un servidor.");
    isHost = true;
    peer = new Peer();
    peer.on('open', (id) => {
        prompt("Servidor Creado. Copia esta ID para tus amigos:", id);
        updateTabList();
        startPlaying(id);
    });
    peer.on('connection', (conn) => {
        setupConnection(conn);
    });
};

function setupConnection(conn) {
    connections.push(conn);
    conn.on('data', (data) => {
        handlePeerData(conn.peer, data);
    });
    conn.on('open', () => {
        updateTabList();
        conn.send({ type: 'pos', x: 0, y: 0, z: 0, name: myName });
    });
}

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

// --- EVENTOS DE TECLADO (TAB Y WASD) ---
document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Tab') {
        e.preventDefault();
        updateTabList();
        tabPane.style.display = 'block';
    }
});

document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
    if(e.code === 'Tab') {
        tabPane.style.display = 'none';
    }
});

document.getElementById('btn-play-alpha').onclick = () => startPlaying(Date.now());
document.getElementById('btn-resume').onclick = () => controls.lock();
