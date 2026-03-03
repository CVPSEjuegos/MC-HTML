// Player.js
import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world; // Conectamos el mundo aquí
        this.controls = new PointerLockControls(camera, document.body);
        
        // Atributos físicos
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;

        // Inventario (Slots de la Hotbar)
        this.selectedSlot = 0;

        // Activar controles al hacer clic
        document.body.addEventListener('click', () => {
            // Solo bloqueamos el puntero si no estamos en un menú
            const isMenuOpen = document.getElementById('main-menu').classList.contains('active') || 
                               document.getElementById('esc-menu').classList.contains('active') ||
                               document.getElementById('singleplayer').classList.contains('active');

            if (!this.controls.isLocked && !isMenuOpen) {
                this.controls.lock();
            }
        });

        // Escuchar teclas numéricas para la Hotbar
        window.addEventListener('keydown', (e) => {
            if (e.key >= "1" && e.key <= "9") {
                this.changeSlot(parseInt(e.key) - 1);
            }
        });

        this.scene.add(this.controls.getObject());
    }

    changeSlot(slotIndex) {
        this.selectedSlot = slotIndex;
        // Actualizar visualmente la Hotbar en el HTML
        document.querySelectorAll('.slot').forEach(el => el.classList.remove('active-slot'));
        const activeEl = document.getElementById(`slot-${slotIndex}`);
        if (activeEl) activeEl.classList.add('active-slot');
        
        console.log("Bloque seleccionado slot:", slotIndex + 1);
    }

    update(keys, delta) {
        if (!this.controls.isLocked) return;

        // --- LÓGICA DE MOVIMIENTO ---
        // Aplicamos fricción (puedes ajustar el 10.0 para que frene más rápido o más lento)
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        
        // Gravedad
        this.velocity.y -= 9.8 * 2.5 * delta; 

        // Determinar dirección según WASD
        this.direction.z = Number(keys["w"] || false) - Number(keys["s"] || false);
        this.direction.x = Number(keys["d"] || false) - Number(keys["a"] || false);
        this.direction.normalize();

        const speed = 400.0;
        if (keys["w"] || keys["s"]) this.velocity.z -= this.direction.z * speed * delta;
        if (keys["a"] || keys["d"]) this.velocity.x -= this.direction.x * speed * delta;

        // Aplicar movimiento a los controles
        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        
        // Movimiento vertical (gravedad/salto)
        this.controls.getObject().position.y += (this.velocity.y * delta);

        // --- COLISIÓN BÁSICA CON SUELO (Y=1.6 es la altura de ojos) ---
        if (this.controls.getObject().position.y < 1.6) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = 1.6;
            this.canJump = true;
        }

        // --- ZONA 2: CARGA DINÁMICA ---
        // Avisamos al mundo dónde estamos para que gestione los chunks
        if (this.world) {
            this.world.update(this.controls.getObject().position);
        }
    }

    jump() {
        if (this.canJump) {
            this.velocity.y += 11; // Un poco más de fuerza de salto
            this.canJump = false;
        }
    }
}
