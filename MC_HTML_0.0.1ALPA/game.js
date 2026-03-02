import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        this.init();
    }

    async init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.world = new World(this.scene);
        this.saveSystem = new SaveSystem();
        this.controls = new PointerLockControls(this.camera, document.body);

        // Luces
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);

        // INICIO DE GENERACIÓN
        await this.world.generateInitialTerrain();
        
        // Posición inicial: Un poco elevado para ver el suelo
        this.camera.position.set(16, 10, 16);
        this.camera.lookAt(0, 0, 0);

        this.setupMenu();
        this.animate();

        // Avisar al status del HTML que ya cargó
        const status = document.getElementById('status');
        if(status) status.innerText = "¡Mundo Cargado! Haz clic para jugar.";
    }

    setupMenu() {
        const btn = document.getElementById('playBtn');
        if(btn) {
            btn.addEventListener('click', () => {
                this.controls.lock();
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
