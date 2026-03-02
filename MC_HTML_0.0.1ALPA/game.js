import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        this.playerID = 7; // ID Asignado
        this.maxFPS = 60;
        this.isMultiplayer = false;
        
        // Físicas
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.move = { forward: false, backward: false, left: false, right: false };
        this.canJump = false;

        this.init();
    }

    async init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.world = new World(this.scene);
        this.saveSystem = new SaveSystem();
        this.controls = new PointerLockControls(this.camera, document.body);

        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        this.scene.add(light);

        this.setupEvents();
        this.animate();
    }

    setupEvents() {
        // Movimiento
        const onKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyS': this.move.backward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyD': this.move.right = true; break;
                case 'Space': if (this.canJump) this.velocity.y += 0.15; this.canJump = false; break;
                case 'Tab': e.preventDefault(); document.getElementById('player-list').style.display = 'block'; this.updateTabList(); break;
            }
        };
        const onKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = false; break;
                case 'KeyS': this.move.backward = false; break;
                case 'KeyA': this.move.left = false; break;
                case 'KeyD': this.move.right = false; break;
                case 'Tab': document.getElementById('player-list').style.display = 'none'; break;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // UI de Opciones
        document.getElementById('fov-range').oninput = (e) => {
            this.camera.fov = e.target.value;
            this.camera.updateProjectionMatrix();
        };
        document.getElementById('fps-select').onchange = (e) => {
            this.maxFPS = parseInt(e.target.value);
        };

        // Menús
        document.getElementById('official-server').onclick = () => {
            this.isMultiplayer = true;
            this.world.setSeed("test1_02/03/2026");
            this.start();
        };

        document.getElementById('btn-reanudar').onclick = () => this.controls.lock();

        this.controls.addEventListener('lock', () => {
            document.getElementById('esc-menu').classList.remove('active');
            document.getElementById('crosshair').style.display = 'block';
        });

        this.controls.addEventListener('unlock', () => {
            document.getElementById('esc-menu').classList.add('active');
            document.getElementById('crosshair').style.display = 'none';
        });
    }

    updateTabList() {
        const container = document.getElementById('players-container');
        container.innerHTML = `ID: ${this.playerID} (Tú) <br> PING: 20ms`;
    }

    async start() {
        showScreen('none'); // Función definida en el HTML
        document.getElementById('crosshair').style.display = 'block';
        await this.world.generateInitialTerrain();
        this.camera.position.set(10, 10, 10);
        this.controls.lock();
    }

    animate() {
        setTimeout(() => {
            requestAnimationFrame(() => this.animate());
        }, 1000 / this.maxFPS);

        if (this.controls.isLocked) {
            // FÍSICAS (Gravedad)
            this.velocity.y -= 0.0075; // Fuerza de gravedad

            this.direction.z = Number(this.move.forward) - Number(this.move.backward);
            this.direction.x = Number(this.move.right) - Number(this.move.left);
            this.direction.normalize();

            if (this.move.forward || this.move.backward) this.velocity.z -= this.direction.z * 0.1;
            if (this.move.left || this.move.right) this.velocity.x -= this.direction.x * 0.1;

            this.controls.moveRight(-this.velocity.x);
            this.controls.moveForward(-this.velocity.z);
            
            this.camera.position.y += this.velocity.y;

            // Suelo simple (colisión con el plano Y=2)
            if (this.camera.position.y < 2) {
                this.velocity.y = 0;
                this.camera.position.y = 2;
                this.canJump = true;
            }

            // Fricción
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
