// Player.js
import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.controls = new PointerLockControls(camera, document.body);
        
        // Atributos físicos
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;

        // Inventario (Slots de la Hotbar)
        this.selectedSlot = 0;

        // Activar controles al hacer clic
        document.body.addEventListener('click', () => {
            if (!this.controls.isLocked && document.getElementById('main-menu').style.display === 'none') {
                this.controls.lock();
            }
        });

        // Escuchar teclas numéricas para la Hotbar
        window.addEventListener('keydown', (e) => {
            if (e.key >= 1 && e.key <= 9) {
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
        
        console.log("Bloque seleccionado:", slotIndex + 1);
    }

    update(keys, delta) {
        if (!this.controls.isLocked) return;

        // Fricción y Gravedad
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 2.5 * delta; 

        // Movimiento WASD
        this.direction.z = Number(keys["w"] || false) - Number(keys["s"] || false);
        this.direction.x = Number(keys["d"] || false) - Number(keys["a"] || false);
        this.direction.normalize();

        const speed = 400.0;
        if (keys["w"] || keys["s"]) this.velocity.z -= this.direction.z * speed * delta;
        if (keys["a"] || keys["d"]) this.velocity.x -= this.direction.x * speed * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        
        this.controls.getObject().position.y += (this.velocity.y * delta);

        // Suelo (Altura de ojos 1.6)
        if (this.controls.getObject().position.y < 1.6) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = 1.6;
            this.canJump = true;
        }
    }

    jump() {
        if (this.canJump) {
            this.velocity.y += 10;
            this.canJump = false;
        }
    }
}
