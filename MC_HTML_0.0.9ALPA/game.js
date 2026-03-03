import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, lastTime = performance.now();
const velocity = new THREE.Vector3();

// Variables de Mundo y Optimización
let worldBlocks = [];
let isLoaded = false;
const CHUNK_SIZE = 16;
const RENDER_DIST = 4; // Radio optimizado para evitar lag

// Ajustes por defecto
let settings = { fov: 60, fps: 120, fog: 10 };

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 1, settings.fog);

    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // Optimización para pantallas 4K/Retina
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    
    controls = new PointerLockControls(camera, document.body);

    // Eventos de Menú
    controls.addEventListener('lock', () => {
        showScreen('none');
        document.getElementById('crosshair').style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
        if(isLoaded) {
            showScreen('esc-menu');
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    // Escuchar cambios en los Sliders
    setupUIListeners();

    loadWorld();
}

function setupUIListeners() {
    const fovS = document.getElementById('slider-fov');
    fovS.oninput = () => {
        settings.fov = fovS.value;
        document.getElementById('val-fov').innerText = settings.fov;
        camera.fov = parseInt(settings.fov);
        camera.updateProjectionMatrix();
    };

    const fpsS = document.getElementById('slider-fps');
    fpsS.oninput = () => {
        settings.fps = fpsS.value;
        document.getElementById('val-fps').innerText = settings.fps;
    };

    const fogS = document.getElementById('slider-fog');
    fogS.oninput = () => {
        settings.fog = fogS.value;
        document.getElementById('val-fog').innerText = settings.fog;
        scene.fog.far = parseInt(settings.fog);
    };
}

async function loadWorld() {
    showScreen('loading-screen');
    const progress = document.getElementById('progress');
    
    const total = (RENDER_DIST * 2 + 1) * (RENDER_DIST * 2 + 1);
    let count = 0;

    for (let x = -RENDER_DIST; x <= RENDER_DIST; x++) {
        for (let z = -RENDER_DIST; z <= RENDER_DIST; z++) {
            createChunk(x, z);
            count++;
            progress.style.width = (count / total * 100) + "%";
            if(count % 2 === 0) await new Promise(r => setTimeout(r, 1));
        }
    }

    respawn();
    isLoaded = true;
    showScreen('none');
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
                // Solo renderizar bloques de superficie o cerca de ella para quitar lag
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

function respawn() {
    camera.position.set(0, 20, 0);
    velocity.set(0, 0, 0);
}

function animate() {
    // Limitador de FPS
    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / settings.fps);

    if (!controls.isLocked) return;

    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;

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

    // Colisión y Muerte
    if (camera.position.y < -120) {
        respawn();
    }

    // Colisión optimizada (solo bloques muy cerca)
    let ground = false;
    const px = camera.position.x, py = camera.position.y, pz = camera.position.z;
    for (let i = 0; i < worldBlocks.length; i++) {
        const b = worldBlocks[i];
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

    renderer.render(scene, camera);
}

// Controles de teclado
document.getElementById('btn-play-alpha').onclick = () => init();
document.getElementById('btn-resume').onclick = () => controls.lock();

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
