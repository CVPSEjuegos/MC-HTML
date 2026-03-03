import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- CONFIGURACIÓN Y VARIABLES ---
let scene, camera, renderer, controls, hand, audioListener, sun;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, prevTime = performance.now();
const velocity = new THREE.Vector3();

let chunks = new Map();
let blocks = []; 
let pigs = [];
const CHUNK_SIZE = 16;
const RENDER_DIST = 6; 

// MULTIPLAYER
let peer = null, connections = [], remotePlayers = {}, isHost = false, myName = "Steve";

const BLOCK_TYPES = {
    1: 0x448032, 2: 0x5d3a1a, 3: 0x777777, 4: 0x3a2614, 
    5: 0x2d4c1e, 6: 0x999999, 7: 0x222222, 8: 0xd4af37, 9: 0xffffff
};
let selectedSlot = 1;

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 4, 35); 

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // LUZ Y SOL
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    controls = new PointerLockControls(camera, document.body);

    // MANO
    hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xdbac82 })
    );
    camera.add(hand);
    hand.position.set(0.6, -0.5, -0.7);
    scene.add(camera);

    controls.addEventListener('unlock', () => {
        document.getElementById('esc-menu').style.display = 'flex';
        document.getElementById('crosshair').style.display = 'none';
    });

    window.addEventListener('mousedown', (e) => {
        if (!controls.isLocked) return;
        if (e.button === 0) breakBlock();
        if (e.button === 2) placeBlock();
    });

    animate();
}

// --- SONIDO DE CERDO ---
function playPigSound() {
    const osc = audioListener.context.createOscillator();
    const gain = audioListener.context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioListener.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioListener.context.currentTime + 0.2);
    gain.gain.setValueAtTime(0.05, audioListener.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioListener.context.currentTime + 0.2);
    osc.connect(gain); gain.connect(audioListener.context.destination);
    osc.start(); osc.stop(audioListener.context.currentTime + 0.2);
}

// --- GENERACIÓN DE MUNDO POR CAPAS (PIEDRA, TIERRA, PASTO) ---
function generateChunk(cx, cz) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for(let x = 0; x < CHUNK_SIZE; x++) {
        for(let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // Altura basada en ruido simple
            const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3) + 4;

            for(let y = 0; y <= h; y++) {
                let color;
                // CAPA 1: PIEDRA (Profundidad)
                if (y < h - 2) color = BLOCK_TYPES[3];
                // CAPA 2: TIERRA (Intermedia)
                else if (y < h) color = BLOCK_TYPES[2];
                // CAPA 3: PASTO (Superficie)
                else color = BLOCK_TYPES[1];

                const block = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
                block.position.set(worldX, y, worldZ);
                scene.add(block);
                blocks.push(block);
            }
            
            // Generar Árboles aleatorios
            if (Math.random() > 0.98) spawnTree(worldX, h + 1, worldZ);
        }
    }
    // Spawn Cerdos
    if(Math.random() > 0.7) spawnPig(cx * 16 + 8, 10, cz * 16 + 8);
    chunks.set(`${cx},${cz}`, true);
}

function spawnTree(x, y, z) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // Tronco
    for(let i=0; i<3; i++) {
        const trunk = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: BLOCK_TYPES[4] }));
        trunk.position.set(x, y+i, z);
        scene.add(trunk); blocks.push(trunk);
    }
    // Hojas
    const leaves = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: BLOCK_TYPES[5] }));
    leaves.position.set(x, y+3, z);
    scene.add(leaves); blocks.push(leaves);
}

function spawnPig(x, y, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1), new THREE.MeshStandardMaterial({color: 0xffc0cb}));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshStandardMaterial({color: 0xffc0cb}));
    head.position.set(0, 0.2, 0.6);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({color: 0x000000}));
    const e1 = eye.clone(); e1.position.set(0.15, 0.1, 0.2);
    const e2 = eye.clone(); e2.position.set(-0.15, 0.1, 0.2);
    head.add(e1, e2); group.add(body, head);
    group.position.set(x, y, z);
    scene.add(group);
    pigs.push({ mesh: group, dir: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5), nextSound: Date.now() + 5000 });
}

// --- INTERACCIÓN ---
function breakBlock() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const inter = ray.intersectObjects(blocks);
    if (inter.length > 0 && inter[0].distance < 5) {
        scene.remove(inter[0].object);
        blocks = blocks.filter(b => b !== inter[0].object);
    }
}

function placeBlock() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const inter = ray.intersectObjects(blocks);
    if (inter.length > 0 && inter[0].distance < 5) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({color: BLOCK_TYPES[selectedSlot]}));
        b.position.copy(inter[0].object.position).add(inter[0].face.normal);
        scene.add(b); blocks.push(b);
    }
}

// --- LOOP PRINCIPAL ---
function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.z -= velocity.z * 10.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.y -= 25.0 * delta; 

        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveForward(-velocity.z * delta);
        controls.moveRight(-velocity.x * delta);
        camera.position.y += (velocity.y * delta);

        // Colisión suelo
        let ground = false;
        for(let b of blocks) {
            if (Math.abs(camera.position.x - b.position.x) < 0.6 && 
                Math.abs(camera.position.z - b.position.z) < 0.6 &&
                (camera.position.y - b.position.y) < 2.1 && (camera.position.y - b.position.y) > 1.4) {
                camera.position.y = b.position.y + 2;
                velocity.y = 0;
                ground = true;
                break;
            }
        }
        canJump = ground;

        // Carga de chunks
        const px = Math.floor(camera.position.x / 16);
        const pz = Math.floor(camera.position.z / 16);
        for(let x = px-RENDER_DIST; x <= px+RENDER_DIST; x++) {
            for(let z = pz-RENDER_DIST; z <= pz+RENDER_DIST; z++) {
                if(!chunks.has(`${x},${z}`)) generateChunk(x, z);
            }
        }

        // Cerdos e IA
        pigs.forEach(p => {
            p.mesh.position.addScaledVector(p.dir, 0.02);
            if(Date.now() > p.nextSound) {
                playPigSound();
                p.nextSound = Date.now() + 5000 + Math.random() * 10000;
            }
            if(Math.random() < 0.01) p.dir.set(Math.random()-0.5, 0, Math.random()-0.5);
            p.mesh.lookAt(p.mesh.position.clone().add(p.dir));
        });

        // Ciclo solar (Sol moviéndose lento)
        sun.position.x = Math.sin(time * 0.0001) * 100;
        sun.position.y = Math.cos(time * 0.0001) * 100;

        hand.position.y = -0.5 + Math.sin(time * 0.008) * 0.03;
        prevTime = time;

        // Multijugador Posición
        if (connections.length > 0) {
            connections.forEach(c => { if(c.open) c.send({type:'pos', x:camera.position.x, y:camera.position.y, z:camera.position.z}); });
        }
    }
    renderer.render(scene, camera);
}

// --- RED Y BOTONES ---
document.getElementById('btn-play-alpha').onclick = () => {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    if(!scene) initEngine();
    controls.lock();
};

document.getElementById('btn-resume').onclick = () => controls.lock();

document.getElementById('btn-host').onclick = () => {
    peer = new Peer();
    peer.on('open', (id) => { prompt("ID de Servidor:", id); isHost = true; });
    peer.on('connection', (c) => connections.push(c));
    document.getElementById('btn-play-alpha').click();
};

document.getElementById('btn-join').onclick = () => {
    const id = prompt("ID del Servidor:");
    if(id) {
        peer = new Peer();
        peer.on('open', () => {
            const conn = peer.connect(id);
            connections.push(conn);
            document.getElementById('btn-play-alpha').click();
        });
    }
};

document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Space' && canJump) velocity.y = 8;
    if(e.code.startsWith('Digit')) {
        let n = e.code.replace('Digit','');
        if(BLOCK_TYPES[n]) {
            selectedSlot = n;
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
            document.getElementById('slot'+n).classList.add('selected');
        }
    }
});

document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
});
