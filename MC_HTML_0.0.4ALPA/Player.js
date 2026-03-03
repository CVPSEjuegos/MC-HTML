// Player.js
import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.controls = new PointerLockControls(camera, document.body);
        
        // Estado físico
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;

        // Inventario básico
        this.inventory = {
            selectedSlot: 0,
            slots: ["grass", "dirt", "stone", null, null, null, null, null, null]
        };

        // Evento para activar el ratón al hacer clic
        document.body.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });

        this.scene.add(this.controls.getObject());
    }

    update(keys, delta) {
        if (!this.controls.isLocked) return;

        // Fricción y gravedad simple
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 2.0 * delta; // Gravedad

        this.direction.z = Number(keys["w"] || false) - Number(keys["s"] || false);
        this.direction.x = Number(keys["d"] || false) - Number(keys["a"] || false);
        this.direction.normalize();

        const speed = 400.0;
        if (keys["w"] || keys["s"]) this.velocity.z -= this.direction.z * speed * delta;
        if (keys["a"] || keys["d"]) this.velocity.x -= this.direction.x * speed * delta;

        // Aplicar movimiento
        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        
        this.controls.getObject().position.y += (this.velocity.y * delta);

        // Suelo temporal (y=1.6 es la altura de los ojos)
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
