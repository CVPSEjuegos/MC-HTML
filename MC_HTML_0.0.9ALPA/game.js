import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './World.js';

let scene, camera, renderer, controls, world;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, velocity = new THREE.Vector3(), lastTime = performance.now();
let isLoaded = false, health = 10;

// --------------------------------------------------
// INIT GAME
// --------------------------------------------------
export function init() {
    if (isLoaded) return;

    // Mostrar loading screen
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('loading-screen').classList.add('active');

    // --- Escena y cámara ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    
    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // --- Luces ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    // --- Controles ---
    controls = new PointerLockControls(camera, document.body);
    controls.addEventListener('lock', () => {
        document.getElementById('crosshair').style.display = 'block';
    });
    controls.addEventListener('unlock', () => {
        if (isLoaded && health > 0) {
            window.showScreen('esc-menu');
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    // --- Mundo ---
    world = new World(scene);

    // --- UI ---
    setupUI();
    initHearts();

    // --- Generar mundo con barra de carga ---
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        document.getElementById('progress').style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);

            // Generar chunk inicial
            world.update(new THREE.Vector3(8, 0, 8));
            camera.position.set(8, 15, 8);

            isLoaded = true;

            // Ocultar loading screen
            document.getElementById('loading-screen').classList.remove('active');

            // Bloquear controles y mostrar crosshair
            controls.lock();

            // Iniciar animación
            animate();
        }
    }, 50);
}

// --------------------------------------------------
// CORAZONES DE VIDA
// --------------------------------------------------
function initHearts() {
    const container = document.getElementById('ui-hearts');
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const h = document.createElement('div');
        h.className = 'heart';
        h.id = `heart-${i}`;
        container.appendChild(h);
    }
}

export function takeDamage(amt) {
    health -= amt;
    for (let i = 0; i < 10; i++) {
        const heart = document.getElementById(`heart-${i}`);
        if (heart && i >= health) heart.classList.add('empty');
    }
    if (health <= 0) {
        isLoaded = false;
        controls.unlock();
        window.showScreen('death-screen');
    }
}

// --------------------------------------------------
// UI SLIDERS
// --------------------------------------------------
function setupUI() {
    document.getElementById('slider-fov').oninput = (e) => {
        camera.fov = e.target.value;
        camera.updateProjectionMatrix();
        document.getElementById('val-fov').innerText = e.target.value;
    };
    document.getElementById('slider-fog').oninput = (e) => {
        if (scene.fog) scene.fog.density = e.target.value / 200;
        document.getElementById('val-fog').innerText = e.target.value;
    };
    document.getElementById('slider-chunks').oninput = (e) => {
        if (world) world.renderDistance = parseInt(e.target.value);
        document.getElementById('val-chunks').innerText = e.target.value;
    };
    document.getElementById('btn-resume').onclick = () => controls.lock();
}

// --------------------------------------------------
// ANIMACIÓN PRINCIPAL
// --------------------------------------------------
function animate() {
    if (!isLoaded) return;
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (controls.isLocked) {
        // --- Movimiento ---
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 25.0 * delta;

        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveRight(velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += velocity.y * delta;

        // --- Colisiones con bloques ---
        let onGround = false;
        for (let b of world.blocks) {
            if (Math.abs(camera.position.x - b.x) < 0.6 && Math.abs(camera.position.z - b.z) < 0.6) {
                if (camera.position.y < b.y + 2 && camera.position.y > b.y) {
                    camera.position.y = b.y + 2;
                    velocity.y = Math.max(0, velocity.y);
                    onGround = true;
                    break;
                }
            }
        }
        canJump = onGround;

        // --- Caída mortal ---
        if (camera.position.y < -20) takeDamage(10);
    }

    // --- Actualizar mundo ---
    world.update(camera.position);

    // --- Render ---
    renderer.render(scene, camera);
}

// --------------------------------------------------
// INPUT TECLADO
// --------------------------------------------------
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') moveForward = true;
    if (e.code === 'KeyS') moveBackward = true;
    if (e.code === 'KeyA') moveLeft = true;
    if (e.code === 'KeyD') moveRight = true;
    if (e.code === 'Space' && canJump) velocity.y = 10;
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') moveForward = false;
    if (e.code === 'KeyS') moveBackward = false;
    if (e.code === 'KeyA') moveLeft = false;
    if (e.code === 'KeyD') moveRight = false;
});

// --------------------------------------------------
// BOTÓN CARGAR MUNDO
// --------------------------------------------------
document.getElementById('btn-play-alpha').onclick = () => init();
