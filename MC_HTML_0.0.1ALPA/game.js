import * as THREE from 'https://unpkg.com/three@0.132.2/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// CONEXIONES CRÍTICAS
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        this.init();
    }

    async init() {
        // 1. Escena y Renderizado
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(8, 5, 8); // Posición inicial

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // 2. Iluminación
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 20, 10);
        this.scene.add(new THREE.AmbientLight(0x404040));
        this.scene.add(light);

        // 3. Inicializar Componentes
        this.saveSystem = new SaveSystem();
        this.world = new World(this.scene);
        
        // 4. Generar Terreno
        await this.world.generateInitialTerrain();

        // 5. Controles
        this.controls = new PointerLockControls(this.camera, document.body);
        document.addEventListener('click', () => this.controls.lock());

        this.animate();
        console.log("🚀 MC_HTML 0.0.1 ALPA: Motor iniciado.");
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.world.update(this.camera.position);
        this.renderer.render(this.scene, this.camera);
    }
}

// Iniciar
new Game();
