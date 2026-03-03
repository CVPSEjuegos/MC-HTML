import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './World.js';
import { Player } from './Player.js';
import { Multiplayer } from './Multiplayer.js';

// Configuración Básica
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cielo azul
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Falso para mejor rendimiento en tu laptop
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luz
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(light);

// Inicializar Componentes
const world = new World(scene);
const player = new Player(camera, renderer.domElement);
const multiplayer = new Multiplayer(camera, scene);

// Bucle de Juego
function animate() {
    requestAnimationFrame(animate);
    
    const delta = 0.1; // Tiempo entre frames
    player.update(world); // Movimiento y colisiones
    multiplayer.update(); // Sincronizar posición
    
    renderer.render(scene, camera);
}

// Eventos de construcción (Mecánicas completas)
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) world.breakBlock(camera); // Click izquierdo: Romper
    if (e.button === 2) world.placeBlock(camera);  // Click derecho: Poner
});

animate();
