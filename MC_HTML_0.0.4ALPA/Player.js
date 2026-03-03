import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        this.controls = new PointerLockControls(camera, document.body);
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;
        this.selectedSlot = 0;

        window.addEventListener('keydown', (e) => {
            if (e.key >= "1" && e.key <= "9") this.changeSlot(parseInt(e.key) - 1);
        });

        this.scene.add(this.controls.getObject());
    }

    changeSlot(slotIndex) {
        this.selectedSlot = slotIndex;
        document.querySelectorAll('.slot').forEach(el => el.classList.remove('active-slot'));
        const activeEl = document.getElementById(`slot-${slotIndex}`);
        if (activeEl) activeEl.classList.add('active-slot');
    }

    update(keys, delta) {
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 30.0 * delta; // Gravedad

        this.direction.z = Number(keys["w"] || false) - Number(keys["s"] || false);
        this.direction.x = Number(keys["d"] || false) - Number(keys["a"] || false);
        this.direction.normalize();

        const speed = 400.0;
        if (keys["w"] || keys["s"]) this.velocity.z -= this.direction.z * speed * delta;
        if (keys["a"] || keys["d"]) this.velocity.x -= this.direction.x * speed * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        this.controls.getObject().position.y += (this.velocity.y * delta);

        // Colisión y Actualización F3
        const pos = this.controls.getObject().position;
        const groundHeight = this.world.getHeight(Math.floor(pos.x), Math.floor(pos.z));

        if (pos.y < groundHeight + 1.6) {
            this.velocity.y = 0;
            pos.y = groundHeight + 1.6;
            this.canJump = true;
        }

        document.getElementById('val-pos').innerText = `${Math.floor(pos.x)} / ${Math.floor(pos.y)} / ${Math.floor(pos.z)}`;
        document.getElementById('val-chunk').innerText = `${Math.floor(pos.x/16)}, ${Math.floor(pos.z/16)}`;
        
        this.world.update(pos);
    }

    jump() {
        if (this.canJump) {
            this.velocity.y = 12;
            this.canJump = false;
        }
    }
}
