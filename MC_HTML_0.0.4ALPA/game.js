import * as THREE from "three";
import { Player } from "./Player.js";
import { World } from "./World.js";
import { Multiplayer } from "./Multiplayer.js";

let scene, camera, renderer, player, world, multiplayer;
let clock = new THREE.Clock();
let keys = {};

// Esta función se llama desde el index.html
window.startGame = function(worldName, isHost = false, joinId = null) {
    init(isHost, joinId);
};

function init(isHost, joinId) {
    // 1. Configuración de Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Cielo azul

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 2. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);

    // 3. Inicializar el Mundo (Zonas, Altura -64 y Árboles)
    world = new World(scene);

    // 4. Inicializar al Jugador (Pasándole el mundo para las colisiones/carga)
    player = new Player(scene, camera, world);

    // 5. Inicializar el Sistema Multijugador
    multiplayer = new Multiplayer(camera, scene);

    if (isHost) {
        multiplayer.host(); // Crea el ID para que otros se unan
    } else if (joinId) {
        multiplayer.join(joinId); // Se une al ID del amigo
    }

    // 6. Generación Inicial
    world.update(player.controls.getObject().position);

    animate();
}

// Controles de teclado actualizados
window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // El salto se maneja aquí o dentro de Player.js
    if (e.code === "Space") {
        if (player) player.jump();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Función de Pausa para el index.html
window.setPause = function(state) {
    if (!player) return;
    if (state) {
        player.controls.unlock();
    } else {
        player.controls.lock();
    }
};

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Si el jugador existe y el puntero está bloqueado, actualizamos
    if (player && player.controls.isLocked) {
        player.update(keys, delta);
        
        // Sincronizar posición en multijugador
        if (multiplayer) {
            multiplayer.update();
        }
    }

    renderer.render(scene, camera);
}

// Ajuste de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
