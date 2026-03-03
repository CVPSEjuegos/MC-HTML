import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- VARIABLES ---
let scene, camera, renderer, controls, worldMesh;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();

// MULTIPLAYER DATA
let peer = null;
let connections = [];
let remotePlayers = {}; 
let isHost = false;
let myName = JSON.parse(localStorage.getItem('MC_HTML_SETTINGS'))?.name || "Steve";

// --- MOTOR ---
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

    // FIX ESC: Resetear movimiento al pausar
    controls.addEventListener('unlock', () => {
        if (document.getElementById('esc-menu').style.display !== 'flex') {
            moveForward = moveBackward = moveLeft = moveRight = false;
            velocity.set(0,0,0);
            window.showScreen('esc-menu');
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    animate();
}

function generateWorld(seed) {
    if(worldMesh) scene.remove(worldMesh);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x448032 });
    worldMesh = new THREE.InstancedMesh(geometry, material, 2500);
    const matrix = new THREE.Matrix4();
    let i = 0;
    let s = typeof seed === 'string' ? seed.length : seed;
    for(let x = -25; x < 25; x++) {
        for(let z = -25; z < 25; z++) {
            const y = Math.floor(Math.sin((x + s) * 0.1) * 2);
            matrix.setPosition(x, y, z);
            worldMesh.setMatrixAt(i++, matrix);
        }
    }
    scene.add(worldMesh);
    camera.position.set(0, 5, 10);
}

// --- PANEL TAB ---
const tabPane = document.createElement('div');
tabPane.style = "position:fixed; top:20%; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); color:white; padding:20px; border:2px solid #555; display:none; min-width:350px; z-index:1000; font-family:monospace; border-radius:5px;";
document.body.appendChild(tabPane);

window.copyID = () => {
    if(peer && peer.id) {
        navigator.clipboard.writeText(peer.id);
        alert("ID Copiada al portapapeles");
    }
};

function updateTabList() {
    let html = `<div style="text-align:center; font-weight:bold; color:#448032;">--- JUGADORES ---</div><br>`;
    
    // Yo
    html += `<div>${isHost ? '👑' : '👤'} <b>${myName}</b> (Tú)</div>`;
    if(isHost && peer) {
        html += `<div style="font-size:10px; color:#aaa; margin-bottom:10px;">Tu ID: ${peer.id} <button onclick="copyID()" style="font-size:9px; cursor:pointer;">Copiar</button></div>`;
    }

    // Otros
    for (let id in remotePlayers) {
        html += `<div style="display:flex; justify-content:space-between;">
                    <span>👤 ${remotePlayers[id].name}</span>
                    ${isHost ? `<span style="color:#555; font-size:9px;">[${id}]</span>` : ''}
                 </div>`;
    }
    tabPane.innerHTML = html;
}

// --- LOGICA DE RED ---
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

        if (connections.length > 0 || Object.keys(remotePlayers).length > 0) {
            const data = { type:'pos', x:camera.position.x, y:camera.position.y, z:camera.position.z, name:myName };
            connections.forEach(c => { if(c.open) c.send(data); });
        }
    }
    renderer.render(scene, camera);
}

function setupConnection(conn) {
    connections.push(conn);
    conn.on('data', (data) => {
        if(data.type === 'pos') {
            if(!remotePlayers[conn.peer]) {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), new THREE.MeshStandardMaterial({color: 0xff0000}));
                scene.add(mesh);
                remotePlayers[conn.peer] = { mesh: mesh, name: data.name };
                updateTabList();
            }
            remotePlayers[conn.peer].mesh.position.set(data.x, data.y - 1, data.z);
        }
    });
    conn.on('close', () => {
        if(remotePlayers[conn.peer]) scene.remove(remotePlayers[conn.peer].mesh);
        delete remotePlayers[conn.peer];
        updateTabList();
    });
}

// --- BOTONES ---
window.conectarServidor = (id) => {
    isHost = false;
    peer = new Peer();
    peer.on('open', () => {
        const conn = peer.connect(id);
        setupConnection(conn);
        startPlaying(id);
    });
};

document.getElementById('btn-host').onclick = () => {
    isHost = true;
    peer = new Peer();
    peer.on('open', (id) => {
        alert("Servidor Creado con ID: " + id);
        startPlaying(id);
    });
    peer.on('connection', setupConnection);
};

document.getElementById('btn-join').onclick = () => {
    const id = prompt("ID del Servidor:");
    if(id) window.conectarServidor(id);
};

function startPlaying(seed) {
    window.showScreen('none'); 
    document.getElementById('crosshair').style.display = 'block';
    if(!scene) initEngine();
    generateWorld(seed);
    controls.lock();
}

document.getElementById('btn-play-alpha').onclick = () => startPlaying(Date.now());
document.getElementById('btn-resume').onclick = () => controls.lock();

// --- TECLADO ---
document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Tab') { e.preventDefault(); updateTabList(); tabPane.style.display = 'block'; }
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
    if(e.code === 'Tab') tabPane.style.display = 'none';
});
