import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, lastTime = performance.now();
const velocity = new THREE.Vector3();

// Variables de Juego
let worldBlocks = [];
let isLoaded = false;
let health = 10;
let lastY = 0;
const CHUNK_SIZE = 16;
const RENDER_DIST = 3; 

let settings = { fov: 60, fps: 120, fog: 0.02 };

function init() {
    // 1. ESCENA Y NIEBLA
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, settings.fog);

    // 2. CÁMARA
    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // 3. RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    document.body.appendChild(renderer.domElement);

    // 4. LUCES
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    
    // 5. CONTROLES
    controls = new PointerLockControls(camera, document.body);

    controls.addEventListener('lock', () => {
        window.showScreen('none');
        document.getElementById('crosshair').style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
        // Solo mostrar menú si no estamos muertos
        if(isLoaded && health > 0) {
            window.showScreen('esc-menu');
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    setupUIListeners();
    initHearts();
    loadWorld();
}

function initHearts() {
    const container = document.getElementById('ui-hearts');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const h = document.createElement('div');
        h.className = 'heart';
        h.id = `heart-${i}`;
        container.appendChild(h);
    }
}

function takeDamage(amt) {
    if (health <= 0 || !isLoaded) return;
    health -= amt;
    
    // Actualizar corazones en pantalla
    for (let i = 0; i < 10; i++) {
        const heart = document.getElementById(`heart-${i}`);
        if (heart) {
            if (i >= health) heart.classList.add('empty');
            else heart.classList.remove('empty');
        }
    }

    if (health <= 0) die();
}

function die() {
    isLoaded = false;
    controls.unlock();
    window.showScreen('death-screen');
    document.getElementById('crosshair').style.display = 'none';
}

function setupUIListeners() {
    const fovS = document.getElementById('slider-fov');
    if (fovS) {
        fovS.oninput = () => {
            settings.fov = fovS.value;
            document.getElementById('val-fov').innerText = settings.fov;
            camera.fov = parseInt(settings.fov);
            camera.updateProjectionMatrix();
        };
    }

    const fogS = document.getElementById('slider-fog');
    if (fogS) {
        fogS.oninput = () => {
            let val = fogS.value / 500; 
            settings.fog = val;
            document.getElementById('val-fog').innerText = fogS.value;
            scene.fog.density = val;
        };
    }
    
    document.getElementById('btn-resume').onclick = () => controls.lock();
}

async function loadWorld() {
    window.showScreen('loading-screen');
    const progress = document.getElementById('progress');
    const total = (RENDER_DIST * 2 + 1) * (RENDER_DIST * 2 + 1);
    let count = 0;

    // Generar el mundo inicial
    for (let x = -RENDER_DIST; x <= RENDER_DIST; x++) {
        for (let z = -RENDER_DIST; z <= RENDER_DIST; z++) {
            createChunk(x, z);
            count++;
            if (progress) progress.style.width = (count / total * 100) + "%";
            if(count % 2 === 0) await new Promise(r => setTimeout(r, 1));
        }
    }

    // Configuración de aparición segura
    camera.position.set(0, 25, 0); // Aparece arriba
    lastY = 25; // Reset de altura de caída
    health = 10;
    isLoaded = true;

    // Quitar pantallas y bloquear mouse
    window.showScreen('none');
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
                if (y > h - 2) {
                    const color = (y === h) ? 0x448032 : 0x5d3a1a;
                    const b = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
                    b.position.set(wx, y, wz);
                    scene.add(b);
                    worldBlocks.push(b);
                }
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (!controls.isLocked || !isLoaded) return;

    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    // Rozamiento y Gravedad
    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;
    velocity.y -= 25 * delta; 

    // Movimiento
    if (moveForward) velocity.z -= 150 * delta;
    if (moveBackward) velocity.z += 150 * delta;
    if (moveLeft) velocity.x -= 150 * delta;
    if (moveRight) velocity.x += 150 * delta;

    controls.moveForward(-velocity.z * delta);
    controls.moveRight(velocity.x * delta);
    camera.position.y += velocity.y * delta;

    // --- COLISIONES ---
    let ground = false;
    const px = camera.position.x;
    const py = camera.position.y;
    const pz = camera.position.z;
    
    for (let i = 0; i < worldBlocks.length; i++) {
        const b = worldBlocks[i];
        if (Math.abs(px - b.position.x) < 0.7 && Math.abs(pz - b.position.z) < 0.7) {
            // Suelo detectado
            if (py - b.position.y < 2.1 && py - b.position.y > 1.0) {
                
                // Daño por caída (si cae más de 6 bloques)
                let fallDist = lastY - py;
                if(fallDist > 6) {
                    takeDamage(Math.floor(fallDist - 5));
                }
                
                camera.position.y = b.position.y + 2;
                velocity.y = 0;
                ground = true;
                lastY = camera.position.y;
                break;
            }
        }
    }
    canJump = ground;
    
    // Si saltamos o subimos, actualizamos el punto más alto para la caída
    if (!ground && py > lastY) {
        lastY = py;
    }

    // Muerte por vacío
    if (py < -50) takeDamage(10);

    renderer.render(scene, camera);
}

// EVENTOS DE ENTRADA
document.getElementById('btn-play-alpha').onclick = () => init();

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') moveForward = true;
    if (e.code === 'KeyS') moveBackward = true;
    if (e.code === 'KeyA') moveLeft = true;
    if (e.code === 'KeyD') moveRight = true;
    if (e.code === 'Space' && canJump) velocity.y = 8;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') moveForward = false;
    if (e.code === 'KeyS') moveBackward = false;
    if (e.code === 'KeyA') moveLeft = false;
    if (e.code === 'KeyD') moveRight = false;
});
