import * as THREE from "three";
import { Player } from "./Player.js";
import { World } from "./World.js";
import { Multiplayer } from "./Multiplayer.js";

let scene, camera, renderer, player, world, multiplayer;
let clock = new THREE.Clock();
let keys = {};

window.startGame = async function(worldName, isHost = false, joinId = null) {
    init(isHost, joinId);
};

async function init(isHost, joinId) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    world = new World(scene);
    player = new Player(scene, camera, world);
    multiplayer = new Multiplayer(camera, scene);

    // Pantalla de carga y generación inicial
    document.getElementById('loading-screen').classList.add('active');
    await world.generateInitialTerrain();
    
    // Spawn en la superficie más alta en 0,0
    const spawnY = world.getHeight(0, 0) + 2;
    player.controls.getObject().position.set(0, spawnY, 0);

    if (isHost) multiplayer.host();
    else if (joinId) multiplayer.join(joinId);

    document.getElementById('loading-screen').classList.remove('active');
    animate();
}

window.setPause = (state) => {
    if (!player) return;
    state ? player.controls.unlock() : player.controls.lock();
};

window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && player) player.jump();
});

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (player && player.controls.isLocked) {
        player.update(keys, delta);
        if (multiplayer) multiplayer.update();
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
