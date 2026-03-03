import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- VARIABLES DE MOTOR ---
let scene, camera, renderer, controls, hand, audioListener;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, prevTime = performance.now();
const velocity = new THREE.Vector3();

// --- MUNDO Y ENTIDADES ---
let chunks = new Map();
let blocks = []; 
let pigs = [];
const CHUNK_SIZE = 16;
const RENDER_DIST = 6; // Radio de generación de 6

// MULTIPLAYER DATA
let peer = null;
let connections = [];
let remotePlayers = {}; 
let isHost = false;
let myName = "Steve";

// CONFIGURACIÓN DE BLOQUES (9 SLOTS)
const BLOCK_TYPES = {
    1: 0x448032, // Pasto
    2: 0x5d3a1a, // Tierra
    3: 0x777777, // Piedra
    4: 0x3a2614, // Tronco
    5: 0x2d4c1e, // Hojas
    6: 0x999999, // Arena/Grava
    7: 0x222222, // Obsidiana
    8: 0xd4af37, // Oro
    9: 0xffffff  // Nieve
};
let selectedSlot = 1;

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // NIEBLA: Empieza en 4 y termina en 35 para cubrir el radio de 6 chunks
    scene.fog = new THREE.Fog(0x87CEEB, 4, 35); 

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // AUDIO LISTENER PARA SONIDO DE CERDOS
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.4);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);

    // MANO DEL JUGADOR
    const handGeom = new THREE.BoxGeometry(0.3, 0.4, 0.8);
    const handMat = new THREE.MeshStandardMaterial({ color: 0xdbac82 });
    hand = new THREE.Mesh(handGeom, handMat);
    camera.add(hand);
    hand.position.set(0.6, -0.5, -0.7);
    scene.add(camera);

    // FIX ESC Y REANUDAR
    controls.addEventListener('unlock', () => {
        if (document.getElementById('esc-menu').style.display !== 'flex') {
            document.getElementById('esc-menu').style.display = 'flex';
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    // CLICS: Izquierdo (Romper), Derecho (Poner)
    window.addEventListener('mousedown', (e) => {
        if (!controls.isLocked) return;
        if (e.button === 0) breakBlock();
        if (e.button === 2) placeBlock();
    });

    animate();
}

// --- SONIDO DE CERDO (OINK SINTETIZADO) ---
function playPigSound(position) {
    const sound = new THREE.PositionalAudio(audioListener);
    const osc = audioListener.context.createOscillator();
    const gain = audioListener.context.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioListener.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioListener.context.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, audioListener.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioListener.context.currentTime + 0.2);
    
    osc.connect(gain);
    sound.setNodeSource(gain);
    sound.setRefDistance(2);
    
    const sourcePos = new THREE.Object3D();
    sourcePos.position.copy(position);
    scene.add(sourcePos);
    sourcePos.add(sound);
    
    osc.start();
    osc.stop(audioListener.context.currentTime + 0.2);
    setTimeout(() => scene.remove(sourcePos), 500);
}

// --- GENERACIÓN DE TERRENO ---
function generateChunk(cx, cz) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for(let x = 0; x < CHUNK_SIZE; x++) {
        for(let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3) + 2;

            for(let y = 0; y <= h; y++) {
                let color = 0x777777; // Piedra por defecto
                if (y === h) color = 0x448032; // Pasto arriba
                else if (y > h - 2) color = 0x5d3a1a; // Tierra

                const block = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: color }));
                block.position.set(worldX, y, worldZ);
                scene.add(block);
                blocks.push(block);
            }
        }
    }
    if(Math.random() > 0.8) spawnPig(cx * 16 + 8, 5, cz * 16 + 8);
    chunks.set(`${cx},${cz}`, true);
}

function spawnPig(x, y, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1), new THREE.MeshStandardMaterial({color: 0xffc0cb}));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshStandardMaterial({color: 0xffc0cb}));
    head.position.set(0, 0.2, 0.6);
    
    const eyeGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const eyeMat = new THREE.MeshStandardMaterial({color: 0x000000});
    const e1 = new THREE.Mesh(eyeGeom, eyeMat); e1.position.set(0.15, 0.1, 0.2);
    const e2 = new THREE.Mesh(eyeGeom, eyeMat); e2.position.set(-0.15, 0.1, 0.2);
    head.add(e1, e2);
    
    group.add(body, head);
    group.position.set(x, y, z);
    scene.add(group);
    pigs.push({ 
        mesh: group, 
        dir: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5),
        nextSound: Date.now() + Math.random() * 8000
    });
}

// --- MECÁNICAS DE BLOQUES ---
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
        scene.add(b);
        blocks.push(b);
    }
}

// --- BUCLE DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.z -= velocity.z * 10.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.y -= 25.0 * delta; // Gravedad

        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveForward(-velocity.z * delta);
        controls.moveRight(-velocity.x * delta);
        camera.position.y += (velocity.y * delta);

        // COLISIÓN OPTIMIZADA
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

        // CARGA DE CHUNKS DINÁMICA (RADIO 6)
        const px = Math.floor(camera.position.x / 16);
        const pz = Math.floor(camera.position.z / 16);
        for(let x = px - RENDER_DIST; x <= px + RENDER_DIST; x++) {
            for(let z = pz - RENDER_DIST; z <= pz + RENDER_DIST; z++) {
                if(!chunks.has(`${x},${z}`)) generateChunk(x, z);
            }
        }

        // IA Y SONIDO DE CERDOS
        pigs.forEach(p => {
            p.mesh.position.addScaledVector(p.dir, 0.02);
            if(Date.now() > p.nextSound) {
                playPigSound(p.mesh.position);
                p.nextSound = Date.now() + 5000 + Math.random() * 10000;
            }
            if(Math.random() < 0.01) p.dir.set(Math.random()-0.5, 0, Math.random()-0.5);
            p.mesh.lookAt(p.mesh.position.clone().add(p.dir));
        });

        hand.position.y = -0.5 + Math.sin(time * 0.008) * 0.03;
        prevTime = time;
    }
    renderer.render(scene, camera);
}

// --- CONTROL DE MENÚS Y RED ---
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
    peer.on('open', (id) => { 
        prompt("Tu ID de Servidor:", id); 
        isHost = true; 
        startPlaying(); 
    });
    peer.on('connection', (c) => connections.push(c));
};

document.getElementById('btn-join').onclick = () => {
    const id = prompt("ID del Servidor al que unirse:");
    if(id) {
        peer = new Peer();
        peer.on('open', () => {
            const conn = peer.connect(id);
            connections.push(conn);
            startPlaying();
        });
    }
};

// TECLADO
document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Space' && canJump) velocity.y = 8;
    
    // Selección de Hotbar 1-9
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
