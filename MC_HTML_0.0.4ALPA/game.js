import * as THREE from "three";
import { Player } from "./Player.js";
import { World } from "./World.js";
import { Multiplayer } from "./Multiplayer.js";

let scene, camera, renderer, player, world, multiplayer;
let clock = new THREE.Clock();
let keys = {};

window.initGame = async function(isHost = false, joinId = null) {
    // 1. Configuración básica
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    scene.add(light);

    // 2. Inicializar clases
    world = new World(scene);
    player = new Player(scene, camera, world);
    multiplayer = new Multiplayer(camera, scene);

    // 3. Carga de terreno y Spawn
    document.getElementById('loading-screen').classList.add('active');
    await world.generateInitialTerrain();
    
    const spawnY = world.getHeight(0, 0) + 2;
    player.controls.getObject().position.set(0, spawnY, 0);

    if (isHost) multiplayer.host();
    else if (joinId) multiplayer.join(joinId);

    document.getElementById('loading-screen').classList.remove('active');
    animate();
};

window.setPause = (state) => { if(player) state ? player.controls.unlock() : player.controls.lock(); };

window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
window.addEventListener("keydown", (e) => { if(e.code === "Space" && player) player.jump(); });

function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();
    if (player && player.controls.isLocked) {
        player.update(keys, delta);
        if (multiplayer) multiplayer.update();
    }
    renderer.render(scene, camera);
}
