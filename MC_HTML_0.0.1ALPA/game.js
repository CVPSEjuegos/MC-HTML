import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { SaveSystem } from './save_system.js';
import { World } from './world.js';

let scene, camera, renderer, controls, world, peer;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let prevTime = performance.now();

// EXPOSICIÓN DE FUNCIONES AL HTML
window.switchScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    if (id === 'world-list') renderWorlds();
};

window.promptCreateWorld = () => {
    const n = prompt("Nombre:");
    if (n) { SaveSystem.saveWorld(n); renderWorlds(); }
};

window.renderWorlds = () => {
    const container = document.getElementById('worlds-container');
    container.innerHTML = SaveSystem.getAll().map(w => `
        <div class="world-item">
            <span>${w.name} (.MCtx)</span>
            <button class="mc-btn" style="width:100px" onclick="startGame()">Jugar</button>
        </div>
    `).join('');
};

window.startGame = () => {
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    controls.lock();
};

// INICIALIZACIÓN
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new PointerLockControls(camera, document.body);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    world = new World(scene);
    world.generate();
    camera.position.set(16, 20, 16);

    // PeerJS Setup
    peer = new Peer();
    peer.on('open', id => document.getElementById('my-id').innerText = id);

    setupControls();
    animate();
}

function setupControls() {
    const onKey = (v) => (e) => {
        if (e.code === 'KeyW') moveForward = v;
        if (e.code === 'KeyS') moveBackward = v;
        if (e.code === 'KeyA') moveLeft = v;
        if (e.code === 'KeyD') moveRight = v;
        if (e.code === 'Space' && v && camera.position.y <= 15) velocity.y = 10;
    };
    document.addEventListener('keydown', onKey(true));
    document.addEventListener('keyup', onKey(false));
}

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        if (camera.position.y > 14) velocity.y -= 9.8 * 2.0 * delta;

        if (moveForward) velocity.z -= 100.0 * delta;
        if (moveBackward) velocity.z += 100.0 * delta;
        if (moveLeft) velocity.x -= 100.0 * delta;
        if (moveRight) velocity.x += 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += (velocity.y * delta);

        if (camera.position.y < 14) { velocity.y = 0; camera.position.y = 14; }
        prevTime = time;

        world.update(camera.position);
    }
    renderer.render(scene, camera);
}

init();