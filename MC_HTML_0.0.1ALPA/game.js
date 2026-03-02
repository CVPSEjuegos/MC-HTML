import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        // CONFIGURACIÓN DE JUGADOR
        this.playerID = 7; // ID Asignado fijo
        this.fov = 75;
        this.maxFPS = 60;
        
        // ESTADOS DE MOVIMIENTO
        this.move = { forward: false, backward: false, left: false, right: false };
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;
        this.isMultiplayer = false;

        window.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        // 1. ESCENA
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.world = new World(this.scene);
        this.saveSystem = new SaveSystem();
        this.controls = new PointerLockControls(this.camera, document.body);

        // 2. LUCES
        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        this.scene.add(light);

        this.setupControls();
        this.setupMenus();
        this.animate();
    }

    setupControls() {
        const onKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyS': this.move.backward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyD': this.move.right = true; break;
                case 'Space': if (this.canJump) this.velocity.y += 0.15; this.canJump = false; break;
                case 'Tab': e.preventDefault(); this.showPlayerList(true); break;
            }
        };
        const onKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': this.move.forward = false; break;
                case 'KeyS': this.move.backward = false; break;
                case 'KeyA': this.move.left = false; break;
                case 'KeyD': this.move.right = false; break;
                case 'Tab': this.showPlayerList(false); break;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    setupMenus() {
        // Botón Servidor Oficial
        document.getElementById('official-server').onclick = () => {
            this.isMultiplayer = true;
            this.world.setSeed("test1_02/03/2026");
            this.startGame();
        };

        // Menú ESC (Pausa)
        this.controls.addEventListener('unlock', () => {
            if (!this.isMultiplayer) {
                // Si es un jugador, pausamos lógica (opcional)
            }
            document.getElementById('esc-menu').style.display = 'flex';
        });

        // Botón Reanudar
        window.reanudar = () => {
            this.controls.lock();
            document.getElementById('esc-menu').style.display = 'none';
        };

        // Ajustes FOV
        window.updateFOV = (val) => {
            this.fov = val;
            this.camera.fov = val;
            this.camera.updateProjectionMatrix();
        };
    }

    showPlayerList(show) {
        const list = document.getElementById('player-list');
        if (list) list.style.display = show ? 'block' : 'none';
        if (show) list.innerHTML = `Jugadores Online: <br> - ID: ${this.playerID} (Tú)`;
    }

    async startGame() {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
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
            const time = performance.now();
            const delta = 0.1; // Velocidad de física

            // APLICAR GRAVEDAD
            this.velocity.y -= 0.008; 

            // MOVIMIENTO
            this.direction.z = Number(this.move.forward) - Number(this.move.backward);
            this.direction.x = Number(this.move.right) - Number(this.move.left);
            this.direction.normalize();

            if (this.move.forward || this.move.backward) this.velocity.z -= this.direction.z * 4.0 * delta;
            if (this.move.left || this.move.right) this.velocity.x -= this.direction.x * 4.0 * delta;

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            this.camera.position.y += (this.velocity.y);

            // COLISIÓN SIMPLE CON SUELO (Y=2)
            if (this.camera.position.y < 2) {
                this.velocity.y = 0;
                this.camera.position.y = 2;
                this.canJump = true;
            }

            // Fricción para que no deslice infinitamente
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
