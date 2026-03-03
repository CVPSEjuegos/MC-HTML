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

        // --- SISTEMA DE INVENTARIO ---
        this.inventory = {
            slots: ["grass", "dirt", "stone", "wood", "leaves", null, null, null, null],
            selected: 0
        };

        // Bloqueo del puntero (Click para jugar)
        document.body.addEventListener('click', () => {
            if (document.getElementById('main-menu').style.display === 'none') {
                this.controls.lock();
            }
        });

        this.scene.add(this.controls.getObject());
    }

    update(keys, delta) {
        if (!this.controls.isLocked) return;

        // Simulación de fricción (para que no deslice infinitamente)
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 2.5 * delta; // Gravedad

        // Dirección del movimiento basada en WASD
        this.direction.z = Number(keys["w"] || false) - Number(keys["s"] || false);
        this.direction.x = Number(keys["d"] || false) - Number(keys["a"] || false);
        this.direction.normalize();

        const speed = 400.0;
        if (keys["w"] || keys["s"]) this.velocity.z -= this.direction.z * speed * delta;
        if (keys["a"] || keys["d"]) this.velocity.x -= this.direction.x * speed * delta;

        // Aplicar movimiento a los controles
        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        
        this.controls.getObject().position.y += (this.velocity.y * delta);

        // Suelo básico (Colisión con el piso en Y=1.6)
        if (this.controls.getObject().position.y < 1.6) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = 1.6;
            this.canJump = true;
        }
    }

    jump() {
        if (this.canJump) {
            this.velocity.y += 12; // Fuerza de salto
            this.canJump = false;
        }
    }
}
