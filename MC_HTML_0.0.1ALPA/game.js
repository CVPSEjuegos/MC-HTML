import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        this.saveSystem = new SaveSystem();
        this.initEngine();
        this.setupMenuLogic();
    }

    initEngine() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        
        this.world = new World(this.scene);
        this.controls = new PointerLockControls(this.camera, document.body);
        
        const light = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(light);
    }

    setupMenuLogic() {
        const btnPlay = document.getElementById('btn-play-world');
        const btnCreate = document.getElementById('btn-create-world');
        const worldListContainer = document.getElementById('world-list');

        // Cargar lista inicial desde "AppData" (LocalStorage)
        this.refreshWorldList();

        btnCreate.addEventListener('click', () => {
            const name = prompt("Nombre del nuevo mundo:");
            if(name) {
                this.saveSystem.createWorld(name);
                this.refreshWorldList();
            }
        });

        btnPlay.addEventListener('click', () => {
            if(this.selectedWorld) {
                this.startWorld();
            } else {
                alert("Selecciona un mundo primero");
            }
        });

        this.controls.addEventListener('unlock', () => {
            document.getElementById('main-menu').classList.add('active');
            document.getElementById('crosshair').style.display = 'none';
        });
    }

    refreshWorldList() {
        const worlds = this.saveSystem.getAllWorlds();
        const container = document.getElementById('world-list');
        container.innerHTML = '';
        worlds.forEach(w => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerText = w;
            div.onclick = () => {
                this.selectedWorld = w;
                // Resaltar visualmente
                Array.from(container.children).forEach(c => c.style.border = '1px solid #444');
                div.style.border = '1px solid #448032';
            };
            container.appendChild(div);
        });
    }

    async startWorld() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('crosshair').style.display = 'block';
        
        await this.world.generateInitialTerrain();
        this.camera.position.set(8, 10, 8);
        this.controls.lock();
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
