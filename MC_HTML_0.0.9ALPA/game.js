import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './World.js';

let scene, camera, renderer, controls, world;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, lastTime = performance.now();
const velocity = new THREE.Vector3();

let isLoaded = false;
let health = 10;
let lastY = 0;
let settings = { fov: 75, fog: 0.02 };

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    controls = new PointerLockControls(camera, document.body);

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
}

function setupUIListeners() {
    const fovSlider = document.getElementById('slider-fov');
    if(fovSlider) {
        fovSlider.oninput = (e) => {
            camera.fov = parseInt(e.target.value);
            camera.updateProjectionMatrix();
            document.getElementById('val-fov').innerText = e.target.value;
        };
    }
    
    const btnResume = document.getElementById('btn-resume');
    if(btnResume) btnResume.onclick = () => controls.lock();
}

async function loadWorld() {
    window.showScreen('loading-screen');
    
    // Generación inicial
    world.update(new THREE.Vector3(0, 0, 0)); 
    
    // Spawn en altura segura
    camera.position.set(0, 15, 0); 
    lastY = 15;
    isLoaded = true;

    setTimeout(() => {
        window.showScreen('none');
        controls.lock();
        animate();
    }, 1000);
}

function animate() {
    requestAnimationFrame(animate);
    if (!controls.isLocked || !isLoaded) return;

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

    // Colisiones simplificadas
    let ground = false;
    for (let b of world.blocks) {
        if (Math.abs(camera.position.x - b.position.x) < 0.6 && 
            Math.abs(camera.position.z - b.position.z) < 0.6) {
            if (camera.position.y - b.position.y < 2.1 && camera.position.y - b.position.y > 1.0) {
                let fallDist = lastY - camera.position.y;
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
    if (!ground && camera.position.y > lastY) lastY = camera.position.y;
    
    if (camera.position.y < -30) takeDamage(10);

    renderer.render(scene, camera);
}

// Escuchas de teclado
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

// Botón de inicio
document.getElementById('btn-play-alpha').onclick = () => init();
