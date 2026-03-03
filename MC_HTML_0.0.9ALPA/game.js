import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls, hand;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, prevTime = performance.now();
const velocity = new THREE.Vector3();

let blocks = [];
let renderDist = 4; // Empezamos en 4 para menos lag
const CHUNK_SIZE = 16;
const BLOCK_TYPES = { 1: 0x448032, 2: 0x5d3a1a, 3: 0x777777, 4: 0x3a2614, 5: 0x2d4c1e, 6: 0x999999, 7: 0x222222, 8: 0xd4af37, 9: 0xffffff };
let selectedSlot = 1;
let isReady = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 2, 45);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 1.5 : 1); // Optimización de pixeles
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    
    controls = new PointerLockControls(camera, document.body);

    hand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0xdbac82 }));
    camera.add(hand);
    hand.position.set(0.6, -0.5, -0.7);
    scene.add(camera);

    controls.addEventListener('lock', () => {
        document.getElementById('esc-menu').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
        if (isReady) {
            document.getElementById('esc-menu').style.display = 'flex';
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    window.addEventListener('mousedown', (e) => {
        if (!controls.isLocked) return;
        if (e.button === 0) interact('break');
        if (e.button === 2) interact('place');
    });

    loadWorld();
}

async function loadWorld() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'flex';
    const progress = document.getElementById('progress');

    const total = (renderDist * 2 + 1) * (renderDist * 2 + 1);
    let count = 0;

    for (let x = -renderDist; x <= renderDist; x++) {
        for (let z = -renderDist; z <= renderDist; z++) {
            createChunk(x, z);
            count++;
            progress.style.width = Math.floor((count / total) * 100) + "%";
            if (count % 3 === 0) await new Promise(r => setTimeout(r, 1));
        }
    }

    // Spawn inteligente
    let highest = 0;
    blocks.forEach(b => { if(Math.abs(b.position.x) < 2 && Math.abs(b.position.z) < 2) highest = Math.max(highest, b.position.y); });
    
    camera.position.set(0, highest + 3, 0);
    isReady = true;
    document.getElementById('loading-screen').style.display = 'none';
    controls.lock();
    animate();
}

function createChunk(cx, cz) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;
            const h = Math.floor(Math.sin(wx * 0.1) * Math.cos(wz * 0.1) * 3) + 4;

            for (let y = 0; y <= h; y++) {
                let color = (y < h - 2) ? BLOCK_TYPES[3] : (y < h ? BLOCK_TYPES[2] : BLOCK_TYPES[1]);
                const b = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
                b.position.set(wx, y, wz);
                scene.add(b);
                blocks.push(b);
            }
        }
    }
}

function interact(type) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hit = ray.intersectObjects(blocks);
    if (hit.length > 0 && hit[0].distance < 5) {
        if (type === 'break') {
            scene.remove(hit[0].object);
            blocks = blocks.filter(b => b !== hit[0].object);
        } else {
            const b = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({color: BLOCK_TYPES[selectedSlot]}));
            b.position.copy(hit[0].object.position).add(hit[0].face.normal);
            scene.add(b); blocks.push(b);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!controls.isLocked) return;

    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.05);

    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;
    velocity.y -= 25 * delta;

    if (moveForward) velocity.z -= 150 * delta;
    if (moveBackward) velocity.z += 150 * delta;
    if (moveLeft) velocity.x -= 150 * delta;
    if (moveRight) velocity.x += 150 * delta;

    controls.moveForward(-velocity.z * delta);
    controls.moveRight(velocity.x * delta);
    camera.position.y += velocity.y * delta;

    // Colisión mejorada
    let ground = false;
    const px = camera.position.x, py = camera.position.y, pz = camera.position.z;
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (Math.abs(px - b.position.x) < 0.6 && Math.abs(pz - b.position.z) < 0.6) {
            if (py - b.position.y < 2.1 && py - b.position.y > 1.2) {
                camera.position.y = b.position.y + 2;
                velocity.y = 0;
                ground = true;
                break;
            }
        }
    }
    canJump = ground;
    if (py < -20) camera.position.y = 30; // Anti-vacío

    hand.position.y = -0.5 + Math.sin(time * 0.008) * 0.02;
    renderer.render(scene, camera);
    prevTime = time;
}

document.getElementById('btn-play').onclick = () => init();
document.getElementById('btn-resume').onclick = () => controls.lock();

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') moveForward = true;
    if (e.code === 'KeyS') moveBackward = true;
    if (e.code === 'KeyA') moveLeft = true;
    if (e.code === 'KeyD') moveRight = true;
    if (e.code === 'Space' && canJump) velocity.y = 8;
    if (e.code === 'KeyF') { // Tecla F para optimizar renderizado
        renderDist = renderDist === 4 ? 2 : 4;
        alert("Renderizado ajustado a: " + renderDist + " chunks. (Reinicia para aplicar)");
    }
    if (e.code.startsWith('Digit')) {
        let n = e.code.replace('Digit','');
        if (BLOCK_TYPES[n]) {
            selectedSlot = n;
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
            document.getElementById('slot' + n).classList.add('selected');
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') moveForward = false;
    if (e.code === 'KeyS') moveBackward = false;
    if (e.code === 'KeyA') moveLeft = false;
    if (e.code === 'KeyD') moveRight = false;
});
