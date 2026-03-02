import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        this.init();
    }

    async init() {
        // 1. ESCENA Y MOTOR DE RENDER
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Cielo Azul Minecraft
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100); // Niebla para ocultar carga

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // 2. COMPONENTES DEL MOTOR
        this.world = new World(this.scene);
        this.saveSystem = new SaveSystem();
        this.controls = new PointerLockControls(this.camera, document.body);

        // 3. VARIABLES DE MOVIMIENTO Y FÍSICA
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // 4. ILUMINACIÓN
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
        sunLight.position.set(10, 50, 10);
        this.scene.add(sunLight);

        // 5. EVENTOS DE INTERFAZ
        this.setupUI();
        this.setupEventListeners();

        // 6. INICIO DE GENERACIÓN
        console.log("🛠️ Generando terreno...");
        await this.world.generateInitialTerrain();
        
        // Posicionar jugador sobre el suelo
        this.camera.position.set(8, 15, 8); 
        
        this.animate();
    }

    setupUI() {
        const playBtn = document.getElementById('playBtn');
        const menu = document.getElementById('menu');
        const crosshair = document.getElementById('crosshair');

        playBtn.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            menu.style.display = 'none';
            crosshair.style.display = 'block';
        });

        this.controls.addEventListener('unlock', () => {
            menu.style.display = 'block';
            crosshair.style.display = 'none';
        });
    }

    setupEventListeners() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space': if (this.canJump) this.velocity.y += 0.15; this.canJump = false; break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyD': this.moveRight = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            // Simulación de Gravedad Simple
            this.velocity.y -= 0.005; 

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            // Caminado
            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 0.01;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 0.01;

            this.controls.moveRight(-this.velocity.x);
            this.controls.moveForward(-this.velocity.z);
            this.camera.position.y += this.velocity.y;

            // Suelo básico (colisión simple en Y=10)
            if (this.camera.position.y < 5) {
                this.velocity.y = 0;
                this.camera.position.y = 5;
                this.canJump = true;
            }

            // Fricción
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;

            // Actualizar mundo (Chunks)
            this.world.update(this.camera.position);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Iniciar el juego
new Game();
