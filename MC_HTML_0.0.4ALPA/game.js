// game.js
import * as THREE from "three";
import { Player } from "./Player.js";

let scene, camera, renderer, playerInstance;
let isPaused = false;
let clock = new THREE.Clock();

window.startGame = function(worldName) {
    if (!renderer) initScene();
};

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    // Inicializamos al jugador como objeto de la clase Player
    playerInstance = new Player(scene, camera);

    createWorld();
    animate();
}

function createWorld() {
    const loader = new THREE.TextureLoader();
    // Suelo de pasto (puedes añadir una textura de pasto aquí luego)
    const floorGeo = new THREE.BoxGeometry(1, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x567d46 });

    for (let x = -16; x < 16; x++) {
        for (let z = -16; z < 16; z++) {
            const block = new THREE.Mesh(floorGeo, floorMat);
            block.position.set(x, 0, z);
            scene.add(block);
        }
    }
}

const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space" && playerInstance) playerInstance.jump();
});
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (!isPaused && playerInstance) {
        playerInstance.update(keys, delta);
    }
    
    renderer.render(scene, camera);
}
