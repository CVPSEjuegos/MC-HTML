import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- VARIABLES ---
let scene, camera, renderer, controls, hand;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();

let chunks = new Map();
let blocks = []; // Para colisiones futuras
let pigs = [];

// MULTIPLAYER DATA
let peer = null;
let connections = [];
let remotePlayers = {}; 
let isHost = false;
let myName = "Steve";

// --- MOTOR ---
function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // NIEBLA
    scene.fog = new THREE.Fog(0x87CEEB, 10, 40);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false }); // Mejor rendimiento
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1.5);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);

    // LA MANO
    const handGeom = new THREE.BoxGeometry(0.3, 0.3, 0.7);
    const handMat = new THREE.MeshStandardMaterial({ color: 0xdbac82 });
    hand = new THREE.Mesh(handGeom, handMat);
    camera.add(hand);
    hand.position.set(0.5, -0.4, -0.6);
    scene.add(camera);

    controls.addEventListener('unlock', () => {
        document.getElementById('esc-menu').style.display = 'flex';
        document.getElementById('crosshair').style.display = 'none';
    });

    animate();
}

// --- GENERACIÓN POR CHUNKS ---
function generateChunk(cx, cz, s) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x448032 });
    const mesh = new THREE.InstancedMesh(geometry, material, 16 * 16);
    const matrix = new THREE.Matrix4();
    
    let i = 0;
    for(let x = 0; x < 16; x++) {
        for(let z = 0; z < 16; z++) {
            const worldX = cx * 16 + x;
            const worldZ = cz * 16 + z;
            const y = Math.floor(Math.sin((worldX + s) * 0.1) * 2);
            matrix.setPosition(worldX, y, worldZ);
            mesh.setMatrixAt(i++, matrix);
        }
    }
    scene.add(mesh);
    chunks.set(`${cx},${cz}`, mesh);

    // CERDOS
    if(Math.random() > 0.8) spawnPig(cx * 16 + 8, 2, cz * 16 + 8);
}

function spawnPig(x, y, z) {
    const pigMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.5, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xffc0cb })
    );
    pigMesh.position.set(x, y, z);
    scene.add(pigMesh);
    pigs.push({ mesh: pigMesh, dir: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5) });
}

function updateWorld() {
    const px = Math.floor(camera.position.x / 16);
    const pz = Math.floor(camera.position.z / 16);
    const seed = 12345;

    for(let x = px-1; x <= px+1; x++) {
        for(let z = pz-1; z <= pz+1; z++) {
            if(!chunks.has(`${x},${z}`)) generateChunk(x, z, seed);
        }
    }
}

// --- BUCLE PRINCIPAL ---
function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.z -= velocity.z * 10.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.y -= 9.8 * 2.0 * delta; // GRAVEDAD

        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveForward(-velocity.z * delta);
        controls.moveRight(-velocity.x * delta);
        camera.position.y += (velocity.y * delta);

        // COLISIÓN SIMPLE SUELO
        if (camera.position.y < 2.5) {
            velocity.y = 0;
            camera.position.y = 2.5;
            canJump = true;
        }

        // ANIMACIÓN MANO
        hand.position.y = -0.4 + Math.sin(time * 0.005) * 0.02;

        updateWorld();
        pigs.forEach(p => {
            p.mesh.position.addScaledVector(p.dir, 0.02);
            if(Math.random() < 0.01) p.dir.set(Math.random()-0.5, 0, Math.random()-0.5);
        });

        // RED
        if (connections.length > 0) {
            const data = { type:'pos', x:camera.position.x, y:camera.position.y, z:camera.position.z, name:myName };
            connections.forEach(c => { if(c.open) c.send(data); });
        }
        prevTime = time;
    }
    renderer.render(scene, camera);
}

// --- RED Y BOTONES ---
function startPlaying() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('esc-menu').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    if(!scene) initEngine();
    controls.lock();
}

document.getElementById('btn-play-alpha').onclick = () => startPlaying();
document.getElementById('btn-resume').onclick = () => controls.lock();
document.getElementById('btn-host').onclick = () => {
    peer = new Peer();
    peer.on('open', (id) => { prompt("ID de tu servidor (pásala a tus amigos):", id); isHost = true; startPlaying(); });
    peer.on('connection', setupConnection);
};
document.getElementById('btn-join').onclick = () => {
    const id = prompt("ID del Servidor:");
    if(id) {
        peer = new Peer();
        peer.on('open', () => {
            const conn = peer.connect(id);
            setupConnection(conn);
            startPlaying();
        });
    }
};

function setupConnection(conn) {
    connections.push(conn);
    conn.on('data', (data) => {
        if(data.type === 'pos') {
            if(!remotePlayers[conn.peer]) {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), new THREE.MeshStandardMaterial({color: 0xff0000}));
                scene.add(mesh);
                remotePlayers[conn.peer] = { mesh: mesh, name: data.name };
            }
            remotePlayers[conn.peer].mesh.position.set(data.x, data.y - 1, data.z);
        }
    });
}

// --- TECLADO ---
document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Space' && canJump) { velocity.y += 8; canJump = false; }
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
});
