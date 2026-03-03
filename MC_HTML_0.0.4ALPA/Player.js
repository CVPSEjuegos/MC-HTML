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

        document.body.addEventListener('click', () => {
            const isMenuOpen = document.querySelector('.screen.active');
            if (!this.controls.isLocked && !isMenuOpen) {
                this.controls.lock();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key >= "1" && e.key <= "9") {
                this.changeSlot(parseInt(e.key) - 1);
            }
        });

        this.scene.add(this.controls.getObject());
        // Empezar alto para no quedar bajo tierra
        this.controls.getObject().position.y = 35; 
    }

    changeSlot(slotIndex) {
        this.selectedSlot = slotIndex;
        document.querySelectorAll('.slot').forEach(el => el.classList.remove('active-slot'));
        const activeEl = document.getElementById(`slot-${slotIndex}`);
        if (activeEl) activeEl.classList.add('active-slot');
    }

    update(keys, delta) {
        if (!this.controls.isLocked) return;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 3.0 * delta; 

        this.direction.z = Number(keys["w"] || false) - Number(keys["s"] || false);
        this.direction.x = Number(keys["d"] || false) - Number(keys["a"] || false);
        this.direction.normalize();

        const speed = 400.0;
        if (keys["w"] || keys["s"]) this.velocity.z -= this.direction.z * speed * delta;
        if (keys["a"] || keys["d"]) this.velocity.x -= this.direction.x * speed * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        this.controls.getObject().position.y += (this.velocity.y * delta);

        // --- ACTUALIZACIÓN F3 ---
        const pos = this.controls.getObject().position;
        document.getElementById('val-pos').innerText = `${Math.floor(pos.x)} / ${Math.floor(pos.y)} / ${Math.floor(pos.z)}`;
        document.getElementById('val-chunk').innerText = `${Math.floor(pos.x/16)}, ${Math.floor(pos.z/16)}`;

        // Colisión simple temporal hasta tener Raycasting completo
        if (this.controls.getObject().position.y < 2) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = 2;
            this.canJump = true;
        }

        if (this.world) {
            this.world.update(this.controls.getObject().position);
        }
    }

    jump() {
        if (this.canJump) {
            this.velocity.y += 12;
            this.canJump = false;
        }
    }
}
