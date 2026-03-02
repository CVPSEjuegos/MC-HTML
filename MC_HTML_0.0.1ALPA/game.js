import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        // Esperamos a que el HTML cargue para conectar los botones
        window.addEventListener('DOMContentLoaded', () => this.init());
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

        this.setupEventListeners();
        this.updateWorldList();
        console.log("🎮 Motor MC_HTML listo.");
    }

    setupEventListeners() {
        // BOTÓN: SERVIDOR OFICIAL
        const officialBtn = document.getElementById('official-server');
        if(officialBtn) {
            officialBtn.onclick = () => {
                this.world.setSeed("test1_02/03/2026");
                this.startGame();
            };
        }

        // BOTÓN: CREAR MUNDO (Un Jugador)
        const createBtn = document.getElementById('btn-create');
        if(createBtn) {
            createBtn.onclick = () => {
                const name = prompt("Nombre del nuevo mundo:");
                if(name) {
                    this.saveSystem.saveNewWorld(name);
                    this.updateWorldList();
                }
            };
        }

        // BOTÓN: JUGAR SELECCIONADO
        const playBtn = document.getElementById('btn-play');
        if(playBtn) {
            playBtn.onclick = () => {
                if(this.selectedWorld) {
                    this.world.setSeed(this.selectedWorld.seed);
                    this.startGame();
                } else {
                    alert("Selecciona un mundo de la lista.");
                }
            };
        }
    }

    updateWorldList() {
        const list = document.getElementById('world-list');
        if(!list) return;
        list.innerHTML = '';
        const worlds = this.saveSystem.getWorlds();
        worlds.forEach(w => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerText = w.name;
            div.onclick = () => {
                this.selectedWorld = w;
                Array.from(list.children).forEach(c => c.style.background = '#333');
                div.style.background = '#448032';
            };
            list.appendChild(div);
        });
    }

    async startGame() {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        document.getElementById('crosshair').style.display = 'block';
        await this.world.generateInitialTerrain();
        this.camera.position.set(25, 10, 25);
        this.controls.lock();
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
