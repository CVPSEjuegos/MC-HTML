import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);

    // Eventos de movimiento
    document.addEventListener('keydown', (e) => {
        if(e.code === 'KeyW') moveForward = true;
        if(e.code === 'KeyS') moveBackward = true;
        if(e.code === 'KeyA') moveLeft = true;
        if(e.code === 'KeyD') moveRight = true;
    });
    document.addEventListener('keyup', (e) => {
        if(e.code === 'KeyW') moveForward = false;
        if(e.code === 'KeyS') moveBackward = false;
        if(e.code === 'KeyA') moveLeft = false;
        if(e.code === 'KeyD') moveRight = false;
    });

    // Crear suelo de prueba
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x348C31 });
    const floor = new THREE.InstancedMesh(geometry, material, 1000);
    const dummy = new THREE.Object3D();

    let i = 0;
    for(let x = -15; x < 15; x++) {
        for(let z = -15; z < 15; z++) {
            dummy.position.set(x, 0, z);
            dummy.updateMatrix();
            floor.setMatrixAt(i++, dummy.matrix);
        }
    }
    scene.add(floor);
    camera.position.set(0, 2, 5);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;

        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveForward(-velocity.z * delta);
        controls.moveRight(-velocity.x * delta);
        prevTime = time;
    }
    renderer.render(scene, camera);
}

// Botón de jugar dentro del menú
document.getElementById('btn-play-alpha').onclick = () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('crosshair').style.display = 'block';
    if (!scene) init();
    controls.lock();
};

// Reanudar desde pausa
document.getElementById('btn-resume').onclick = () => {
    document.getElementById('esc-menu').classList.remove('active');
    controls.lock();
};

// Si el usuario presiona ESC, mostrar menú de pausa
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== document.body) {
        document.getElementById('esc-menu').classList.add('active');
        document.getElementById('crosshair').style.display = 'none';
    }
});
