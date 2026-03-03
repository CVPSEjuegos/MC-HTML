import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls, hand, audioListener;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, prevTime = performance.now();
const velocity = new THREE.Vector3();

let chunks = new Map(), blocks = [], pigs = [];
const CHUNK_SIZE = 16, RENDER_DIST = 6;
const BLOCK_TYPES = { 1: 0x448032, 2: 0x5d3a1a, 3: 0x777777, 4: 0x3a2614, 5: 0x2d4c1e, 6: 0x999999, 7: 0x222222, 8: 0xd4af37, 9: 0xffffff };
let selectedSlot = 1;

function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 4, 40); 

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    controls = new PointerLockControls(camera, document.body);

    hand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0xdbac82 }));
    camera.add(hand);
    hand.position.set(0.6, -0.5, -0.7);
    scene.add(camera);

    controls.addEventListener('unlock', () => {
        if(document.getElementById('loading-screen').style.display !== 'flex') {
            document.getElementById('esc-menu').style.display = 'flex';
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    window.addEventListener('mousedown', (e) => {
        if (!controls.isLocked) return;
        if (e.button === 0) breakBlock();
        if (e.button === 2) placeBlock();
    });

    // Iniciar carga del mundo
    pregenerateWorld();
}

async function pregenerateWorld() {
    const menu = document.getElementById('main-menu');
    const loading = document.getElementById('loading-screen');
    const progress = document.getElementById('progress');
    const status = document.getElementById('status');
    
    menu.style.display = 'none';
    loading.style.display = 'flex';

    const totalChunks = (RENDER_DIST * 2 + 1) * (RENDER_DIST * 2 + 1);
    let count = 0;

    for(let x = -RENDER_DIST; x <= RENDER_DIST; x++) {
        for(let z = -RENDER_DIST; z <= RENDER_DIST; z++) {
            generateChunk(x, z);
            count++;
            let pct = Math.floor((count / totalChunks) * 100);
            progress.style.width = pct + "%";
            status.innerText = pct + "%";
            // Pequeña pausa para no bloquear el navegador y permitir que la barra se vea
            if(count % 5 === 0) await new Promise(r => setTimeout(r, 10));
        }
    }

    // Spawn en lo más alto del centro (0,0)
    let maxY = 5;
    blocks.forEach(b => {
        if(Math.abs(b.position.x) < 1 && Math.abs(b.position.z) < 1) {
            if(b.position.y > maxY) maxY = b.position.y;
        }
    });
    camera.position.set(0, maxY + 2, 0);

    loading.style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    controls.lock();
    animate();
}

function generateChunk(cx, cz) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for(let x = 0; x < CHUNK_SIZE; x++) {
        for(let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3) + 4;

            for(let y = 0; y <= h; y++) {
                let color = (y < h - 2) ? BLOCK_TYPES[3] : (y < h ? BLOCK_TYPES[2] : BLOCK_TYPES[1]);
                const block = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
                block.position.set(worldX, y, worldZ);
                scene.add(block);
                blocks.push(block);
            }
        }
    }
    chunks.set(`${cx},${cz}`, true);
}

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

        // COLISIÓN OPTIMIZADA (Solo bloques muy cercanos)
        let ground = false;
        const pX = camera.position.x, pY = camera.position.y, pZ = camera.position.z;
        for(let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            if (Math.abs(pX - b.position.x) < 0.6 && Math.abs(pZ - b.position.z) < 0.6) {
                if (pY - b.position.y < 2.1 && pY - b.position.y > 1.2) {
                    camera.position.y = b.position.y + 2;
                    velocity.y = 0;
                    ground = true;
                    break;
                }
            }
        }
        canJump = ground;
        hand.position.y = -0.5 + Math.sin(time * 0.008) * 0.03;
        prevTime = time;
    }
    renderer.render(scene, camera);
}

document.getElementById('btn-play-alpha').onclick = () => initEngine();
document.getElementById('btn-resume').onclick = () => controls.lock();

document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveForward = true;
    if(e.code === 'KeyS') moveBackward = true;
    if(e.code === 'KeyA') moveLeft = true;
    if(e.code === 'KeyD') moveRight = true;
    if(e.code === 'Space' && canJump) velocity.y = 8;
    if(e.code.startsWith('Digit')) {
        let n = parseInt(e.code.replace('Digit',''));
        if(n >= 1 && n <= 9) {
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
