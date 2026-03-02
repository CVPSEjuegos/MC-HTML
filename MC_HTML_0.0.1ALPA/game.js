// game.js - Motor principal MC_HTML 0.0.1 ALPHA
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// CONEXIONES CON TUS OTROS ARCHIVOS
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

console.log("🎮 MC_HTML: Iniciando conexiones de módulos...");

class Game {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // 1. Configuración de la Escena
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB); // Cielo azul
            this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.domElement);

            // 2. Conexión con el Sistema de Guardado
            this.saveSystem = new SaveSystem();
            console.log("📂 Sistema de archivos .MCtx conectado.");

            // 3. Conexión con el Mundo (Las 4 Zonas)
            this.world = new World(this.scene);
            await this.world.generateInitialTerrain();
            console.log("🌍 Generación de terreno por Chunks lista.");

            // 4. Controles y Físicas
            this.controls = new PointerLockControls(this.camera, document.body);
            this.setupControls();

            // 5. Luces
            const light = new THREE.HemisphereLight(0xeeeeee, 0x888888, 1);
            this.scene.add(light);

            this.animate();
            
            // Quitar mensaje de carga si existe
            const loadingMsg = document.getElementById('loading-msg');
            if(loadingMsg) loadingMsg.style.display = 'none';

        } catch (error) {
            console.error("❌ Error Crítico al conectar módulos:", error);
            document.body.innerHTML = `<div style="color:white; padding:20px; background:red;">
                <h1>Error de Conexión</h1>
                <p>No se pudo cargar un módulo. Revisa que world.js y save_system.js estén en la misma carpeta.</p>
                <small>${error.message}</small>
            </div>`;
        }
    }

    setupControls() {
        document.addEventListener('click', () => {
            this.controls.lock();
        });

        // Movimiento básico WASD
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        document.addEventListener('keydown', (e) => {
            if(e.code === 'Space' && this.camera.position.y <= 2) {
                this.velocity.y += 0.2; // Salto simple
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Actualizar zona activa del mundo según posición de cámara
        if (this.world) {
            this.world.update(this.camera.position);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Iniciar el juego cuando la ventana cargue
window.onload = () => {
    new Game();
};
