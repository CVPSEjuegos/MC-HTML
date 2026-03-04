import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './World.js';

let scene, camera, renderer, controls, world;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, lastTime = performance.now();
const velocity = new THREE.Vector3();

// Variables de Estado
let isLoaded = false;
let health = 10;
let lastY = 0;
let settings = { fov: 70, fps: 120, fog: 0.02 };

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    
    controls = new PointerLockControls(camera, document.body);

    // Inicializar Mundo
    world = new World(scene);

    controls.addEventListener('lock', () => {
        window.showScreen('none');
        document.getElementById('crosshair').style.display = 'block';
    });

    controls.addEventListener('unlock', () => {
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
    document.getElementById('slider-fov').oninput = (e) => {
        settings.fov = e.target.value;
        document.getElementById('val-fov').innerText = settings.fov;
        camera.fov = parseInt(settings.fov);
        camera.updateProjectionMatrix();
    };

    document.getElementById('slider-fog').oninput = (e) => {
        let val = e.target.value / 500;
        if(scene.fog) scene.fog.density = val;
        document.getElementById('val-fog').innerText = e.target.value;
    };
    
    document.getElementById('btn-resume').onclick = () => controls.lock();
}

async function loadWorld() {
    window.showScreen('loading-screen');
    const progress = document.getElementById('progress');
    
    // Generar terreno inicial en el origen
    world.update(new THREE.Vector3(0, 0, 0)); 
    
    if (progress) progress.style.width = "100%";
    await new Promise(r => setTimeout(r, 600));

    // Spawn seguro
    camera.position.set(0, 20, 0); 
    lastY = 20;
    health = 10;
    isLoaded = true;

    window.showScreen('none');
    controls.lock();
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (!controls.isLocked || !isLoaded) return;

    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;
    velocity.y -= 25 * delta; // Gravedad

    if (moveForward) velocity.z -= 150 * delta;
    if (moveBackward) velocity.z += 150 * delta;
    if (moveLeft) velocity.x -= 150 * delta;
    if (moveRight) velocity.x += 150 * delta;

    controls.moveForward(-velocity.z * delta);
    controls.moveRight(velocity.x * delta);
    camera.position.y += velocity.y * delta;

    // --- SISTEMA DE COLISIONES ---
    let ground = false;
    const px = camera.position.x;
    const py = camera.position.y;
    const pz = camera.position.z;
    
    for (let i = 0; i < world.blocks.length; i++) {
        const b = world.blocks[i];
        if (Math.abs(px - b.position.x) < 0.7 && Math.abs(pz - b.position.z) < 0.7) {
            // Detección de suelo (pies del jugador)
            if (py - b.position.y < 2.1 && py - b.position.y > 1.0) {
                let fallDist = lastY - py;
                if(fallDist > 6) takeDamage(Math.floor(fallDist - 5));
                
                camera.position.y = b.position.y + 2;
                velocity.y = 0;
                ground = true;
                lastY = camera.position.y;
                break;
            }
        }
    }
    canJump = ground;
    if (!ground && py > lastY) lastY = py;

    // Actualizar generación infinita
    world.update(camera.position);

    // Muerte por caída al vacío
    if (py < -30) takeDamage(10);

    renderer.render(scene, camera);
}

document.getElementById('btn-play-alpha').onclick = () => init();

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
