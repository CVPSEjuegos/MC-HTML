import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { Multiplayer } from './multiplayer.js';
import { SaveSystem } from './save_system.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let world, multiplayer, saveSystem;

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(20, 40, 20);
    light.castShadow = true;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    controls = new PointerLockControls(camera, document.body);

    world = new World(scene);
    multiplayer = new Multiplayer(camera, scene);
    saveSystem = new SaveSystem();

    camera.position.y = 10;

    document.addEventListener('click', () => controls.lock());

    animate();
}

function startWorld(seed) {
    world.setSeed(seed);
    world.generateInitialTerrain();
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked === true) {

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 20.0 * delta; // gravedad

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.y += velocity.y * delta;

        if (camera.position.y < 5) {
            velocity.y = 0;
            camera.position.y = 5;
            canJump = true;
        }

        world.updateChunks(camera.position);
        multiplayer.update();
    }

    renderer.render(scene, camera);
    prevTime = time;
}

document.addEventListener('keydown', (event) => {

    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space':
            if (canJump === true) velocity.y += 15;
            canJump = false;
            break;
    }

});

document.addEventListener('keyup', (event) => {

    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }

});

window.startPlaying = (seed) => {
    if (!scene) init();
    startWorld(seed || Date.now());
};

window.addEventListener('resize', () => {
    if (!camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
