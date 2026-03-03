import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- VARIABLES DE MOTOR ---
let scene, camera, renderer, controls, hand;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, prevTime = performance.now();
const velocity = new THREE.Vector3();

// --- MUNDO Y ENTIDADES ---
let chunks = new Map();
let blocks = []; 
let pigs = [];
const CHUNK_SIZE = 16;
const RENDER_DIST = 2;

// MULTIPLAYER
let peer = null, connections = [], remotePlayers = {}, isHost = false, myName = "Steve";

// CONFIGURACIÓN DE BLOQUES
const BLOCK_TYPES = {
    1: { name: 'Pasto', color: 0x448032 },
    2: { name: 'Tierra', color: 0x5d3a1a },
    3: { name: 'Piedra', color: 0x777777 },
    4: { name: 'Tronco', color: 0x3a2614 },
    5: { name: 'Hojas', color: 0x2d4c1e }
};
let selectedSlot = 1;

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);

    // MANO DEL JUGADOR
    const handGeom = new THREE.BoxGeometry(0.3, 0.4, 0.8);
    const handMat = new THREE.MeshStandardMaterial({ color: 0xdbac82 });
    hand = new THREE.Mesh(handGeom, handMat);
    camera.add(hand);
    hand.position.set(0.6, -0.5, -0.7);
    scene.add(camera);

    controls.addEventListener('unlock', () => {
        document.getElementById('esc-menu').style.display = 'flex';
        document.getElementById('crosshair').style.display = 'none';
    });

    animate();
}

// --- GENERACIÓN DE MUNDO MULTI-BLOQUE ---
function generateChunk(cx, cz) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    for(let x = 0; x < CHUNK_SIZE; x++) {
        for(let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // Altura base con ruido
            const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3) + 2;

            for(let y = 0; y <= h; y++) {
                let color = BLOCK_TYPES[3].color; // Piedra profundo
                if (y === h) color = BLOCK_TYPES[1].color; // Pasto arriba
                else if (y > h - 3) color = BLOCK_TYPES[2].color; // Tierra debajo

                const material = new THREE.MeshStandardMaterial({ color: color });
                const block = new THREE.Mesh(geometry, material);
                block.position.set(worldX, y, worldZ);
                scene.add(block);
                blocks.push(block);
            }

            // Árboles aleatorios
            if (Math.random() > 0.98 && cx === 0) { 
                spawnTree(worldX, h + 1, worldZ);
            }
        }
    }
    if(Math.random() > 0.7) spawnPig(cx * 16 + 8, 10, cz * 16 + 8);
    chunks.set(`${cx},${cz}`, true);
}

function spawnTree(x, y, z) {
    const geom = new THREE.BoxGeometry(1,1,1);
    for(let i=0; i<3; i++) { // Tronco
        const t = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({color: BLOCK_TYPES[4].color}));
        t.position.set(x, y+i, z);
        scene.add(t); blocks.push(t);
    }
    // Hojas
    const h = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({color: BLOCK_TYPES[5].color}));
    h.position.set(x, y+3, z);
    scene.add(h); blocks.push(h);
}

// --- CERDOS CON "TEXTURA" ---
function spawnPig(x, y, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1), new THREE.MeshStandardMaterial({color: 0xffc0cb}));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshStandardMaterial({color: 0xffc0cb}));
    head.position.set(0, 0.2, 0.6);
    
    // Ojos (Mini cubos negros)
    const eyeGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const eyeMat = new THREE.MeshStandardMaterial({color: 0x000000});
    const e1 = new THREE.Mesh(eyeGeom, eyeMat); e1.position.set(0.15, 0.1, 0.2);
    const e2 = new THREE.Mesh(eyeGeom, eyeMat); e2.position.set(-0.15, 0.1, 0.2);
    head.add(e1, e2);
    
    group.add(body, head);
    group.position.set(x, y, z);
    scene.add(group);
    pigs.push({ mesh: group, dir: new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5) });
}

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.z -= velocity.z * 10.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.y -= 9.8 * 2.0 * delta; 

        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveForward(-velocity.z * delta);
        controls.moveRight(-velocity.x * delta);
        camera.position.y += (velocity.y * delta);

        // COLISIÓN CON BLOQUES VISIBLES
        let standing = false;
        blocks.forEach(b => {
            if (Math.abs(camera.position.x - b.position.x) < 0.7 && 
                Math.abs(camera.position.z - b.position.z) < 0.7 &&
                (camera.position.y - b.position.y) < 2 && (camera.position.y - b.position.y) > 1.5) {
                camera.position.y = b.position.y + 2;
                velocity.y = 0;
                standing = true;
            }
        });
        canJump = standing;

        // Actualizar chunks
        const px = Math.floor(camera.position.x / 16);
        const pz = Math.floor(camera.position.z / 16);
        for(let x = px-RENDER_DIST; x <= px+RENDER_DIST; x++) {
            for(let z = pz-RENDER_DIST; z <= pz+RENDER_DIST; z++) {
                if(!chunks.has(`${x},${z}`)) generateChunk(x, z);
            }
        }

        pigs.forEach(p => {
            p.mesh.position.addScaledVector(p.dir, 0.02);
            p.mesh.lookAt(p.mesh.position.clone().add(p.dir));
            if(Math.random() < 0.01) p.dir.set(Math.random()-0.5, 0, Math.random()-0.5);
        });

        hand.position.y = -0.5 + Math.sin(time * 0.008) * 0.03;
        prevTime = time;
    }
    renderer.render(scene, camera);
}

// --- BOTONES Y MULTIPLAYER ---
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
    peer.on('open', (id) => { prompt("ID de Servidor:", id); isHost = true; startPlaying(); });
    peer.on('connection', (c) => connections.push(c));
};

document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Space' && canJump) velocity.y = 7;
    if(e.code.startsWith('Digit')) {
        selectedSlot = e.code.replace('Digit','');
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
        document.getElementById('slot'+selectedSlot)?.classList.add('selected');
    }
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveForward = false;
    if(e.code === 'KeyS') moveBackward = false;
    if(e.code === 'KeyA') moveLeft = false;
    if(e.code === 'KeyD') moveRight = false;
});
