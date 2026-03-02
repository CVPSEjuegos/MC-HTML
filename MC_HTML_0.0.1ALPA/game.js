import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { SaveSystem } from './save_system.js';

class Game {
    constructor() {
        this.playerData = { name: "Steve", skin: null };
        this.init();
    }

    async init() {
        // 1. CARGAR DATOS DEL LAUNCHER
        const saved = localStorage.getItem('MC_HTML_SETTINGS');
        if(saved) {
            this.playerData = JSON.parse(saved);
            console.log("👤 Jugador cargado:", this.playerData.name);
        }

        // 2. CONFIGURACIÓN 3D
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // 3. MUNDO Y PERSONAJE
        this.world = new World(this.scene);
        this.saveSystem = new SaveSystem();
        
        // Pasamos la skin al mundo para que cree el avatar
        await this.world.generateInitialTerrain();
        this.createPlayerAvatar();

        this.controls = new PointerLockControls(this.camera, document.body);
        this.setupMenu();
        this.animate();
    }

    createPlayerAvatar() {
        // Si hay una skin personalizada, la cargamos como textura
        const loader = new THREE.TextureLoader();
        const skinTexture = this.playerData.skin 
            ? loader.load(this.playerData.skin) 
            : loader.load('https://minecraft.net/static/theme/img/characters/steve.png');
        
        // Filtro para que no se vea borrosa (Pixel Art)
        skinTexture.magFilter = THREE.NearestFilter;

        const geometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const material = new THREE.MeshLambertMaterial({ map: skinTexture });
        this.avatar = new THREE.Mesh(geometry, material);
        
        // Lo ponemos en la escena (aunque tú no te ves a ti mismo en 1ª persona)
        // Esto servirá para cuando hagamos el Multijugador
        this.scene.add(this.avatar);
    }

    setupMenu() {
        const btn = document.getElementById('playBtn');
        if(btn) btn.addEventListener('click', () => this.controls.lock());
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // El avatar sigue a la cámara (para el multijugador)
        if(this.avatar) {
            this.avatar.position.copy(this.camera.position);
            this.avatar.position.y -= 1; 
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
