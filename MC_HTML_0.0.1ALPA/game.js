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
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.world = new World(this.scene);
        this.saveSystem = new SaveSystem();
        this.controls = new PointerLockControls(this.camera, document.body);

        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        this.scene.add(light);

        this.setupButtons();
        this.animate();
    }

    setupButtons() {
        // SERVIDOR OFICIAL
        document.getElementById('official-server').onclick = () => {
            this.world.setSeed("test1_02/03/2026");
            this.startGame();
        };

        // UN JUGADOR
        document.getElementById('btn-create').onclick = () => {
            const n = prompt("Nombre del mundo:");
            if(n) { this.saveSystem.saveNewWorld(n); this.updateWorldList(); }
        };

        document.getElementById('btn-play').onclick = () => {
            if(this.selectedWorld) {
                this.world.setSeed(this.selectedWorld.seed);
                this.startGame();
            }
        };

        // HOST MULTIJUGADOR (PRUEBAS)
        document.getElementById('btn-host').onclick = () => {
            const peer = new Peer();
            peer.on('open', (id) => alert("ID de tu servidor: " + id));
            this.world.setSeed(Date.now());
            this.startGame();
        };

        this.updateWorldList();
    }

    updateWorldList() {
        const list = document.getElementById('world-list');
        list.innerHTML = '';
        this.saveSystem.getWorlds().forEach(w => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerText = w.name;
            div.onclick = () => this.selectedWorld = w;
            list.appendChild(div);
        });
    }

    async startGame() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('crosshair').style.display = 'block';
        await this.world.generateInitialTerrain();
        this.camera.position.set(25, 10, 25);
        this.controls.lock();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
