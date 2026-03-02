import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- CLASE MUNDO ---
class World {
    constructor(scene) {
        this.scene = scene;
        this.seed = 0;
        this.mesh = null;
    }

    setSeed(input) {
        if (isNaN(input)) {
            let hash = 0;
            let str = String(input);
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            this.seed = Math.abs(hash);
        } else {
            this.seed = Number(input);
        }
        console.log("🌱 Semilla aplicada:", this.seed);
    }

    generate() {
        // Limpiar mundo previo
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
        const count = 2500; // 50x50 bloques
        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        
        const matrix = new THREE.Matrix4();
        let i = 0;

        for (let x = 0; x < 50; x++) {
            for (let z = 0; z < 50; z++) {
                // Algoritmo de elevación simple
                const y = Math.floor(
                    Math.sin((x + this.seed) * 0.2) * 1.5 + 
                    Math.cos((z + this.seed) * 0.2) * 1.5
                );
                
                matrix.setPosition(x - 25, y, z - 25);
                this.mesh.setMatrixAt(i++, matrix);
            }
        }
        this.scene.add(this.mesh);
    }
}

// --- VARIABLES DEL MOTOR ---
let scene, camera, renderer, controls, world;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();

// --- INICIALIZACIÓN ---
function initEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 15, 60);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    controls = new PointerLockControls(camera, document.body);
    world = new World(scene);

    // Controles
    document.addEventListener('keydown', (e) => toggleMove(e.code, true));
    document.addEventListener('keyup', (e) => toggleMove(e.code, false));

    // Menú de pausa
    controls.addEventListener('unlock', () => {
        if (!document.querySelector('.screen.active')) {
            window.showScreen('esc-menu');
            document.getElementById('crosshair').style.display = 'none';
        }
    });

    animate();
}

function toggleMove(code, isPressed) {
    if (code === 'KeyW') moveForward = isPressed;
    if (code === 'KeyS') moveBackward = isPressed;
    if (code === 'KeyA') moveLeft = isPressed;
    if (code === 'KeyD') moveRight = isPressed;
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        if (moveForward) velocity.z -= 180.0 * delta;
        if (moveBackward) velocity.z += 180.0 * delta;
        if (moveLeft) velocity.x -= 180.0 * delta;
        if (moveRight) velocity.x += 180.0 * delta;

        controls.moveForward(-velocity.z * delta);
        controls.moveRight(-velocity.x * delta);

        prevTime = time;
    }
    renderer.render(scene, camera);
}

// --- FUNCIONES DE LANZAMIENTO ---

window.startWorld = (seedValue) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('crosshair').style.display = 'block';

    if (!scene) initEngine();
    
    world.setSeed(seedValue);
    world.generate();
    
    camera.position.set(0, 5, 10);
    controls.lock();
};

// BOTONES
document.getElementById('btn-play-alpha').onclick = () => window.startWorld(Date.now());

// Esta función debe llamarse desde el "item" del servidor oficial en tu HTML
window.conectarServidorOficial = () => window.startWorld("test1_02/03/2026");

document.getElementById('btn-host').onclick = () => {
    const peer = new Peer();
    peer.on('open', (id) => {
        alert("ID DE TU SERVIDOR: " + id);
        window.startWorld("host_" + id);
    });
};

document.getElementById('btn-join').onclick = () => {
    const id = prompt("Ingresa el ID del Servidor:");
    if (id) window.startWorld("host_" + id);
};

document.getElementById('btn-resume').onclick = () => {
    document.getElementById('esc-menu').classList.remove('active');
    document.getElementById('crosshair').style.display = 'block';
    controls.lock();
};

window.addEventListener('resize', () => {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
