// game.js
import * as THREE from "three";
import { Player } from "./Player.js";

let scene, camera, renderer, playerInstance;
let clock = new THREE.Clock();
let keys = {};

window.startGame = function(worldName) {
    init();
};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Cielo azul

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    // CREAR AL JUGADOR (Primera Persona)
    playerInstance = new Player(scene, camera);

    generateTerrain();
    animate();
}

function generateTerrain() {
    // Generar un suelo de cubos de 32x32 para que parezca Minecraft
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x4d7a32 }); // Color pasto

    for (let x = -16; x < 16; x++) {
        for (let z = -16; z < 16; z++) {
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, 0, z);
            scene.add(block);
        }
    }
}

// Controles de teclado
window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") playerInstance.jump();
});
window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (playerInstance) {
        playerInstance.update(keys, delta);
    }

    renderer.render(scene, camera);
}
