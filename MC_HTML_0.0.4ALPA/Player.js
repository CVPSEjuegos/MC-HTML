import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(scene, camera, world) {
        this.camera = camera;
        this.world = world;
        this.controls = new PointerLockControls(camera, document.body);
        this.velocity = new THREE.Vector3();
        this.canJump = false;
        scene.add(this.controls.getObject());
    }

    update(keys, delta) {
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 30.0 * delta; // Gravedad

        const speed = 400.0;
        if (keys["w"]) this.velocity.z -= speed * delta;
        if (keys["s"]) this.velocity.z += speed * delta;
        if (keys["a"]) this.velocity.x -= speed * delta;
        if (keys["d"]) this.velocity.x += speed * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        this.controls.getObject().position.y += this.velocity.y * delta;

        // Colisión con suelo dinámico
        const pos = this.controls.getObject().position;
        const ground = this.world.getHeight(Math.floor(pos.x), Math.floor(pos.z));
        
        if (pos.y < ground + 1.6) {
            this.velocity.y = 0;
            pos.y = ground + 1.6;
            this.canJump = true;
        }

        // F3 Update
        document.getElementById('val-pos').innerText = `${Math.floor(pos.x)} / ${Math.floor(pos.y)} / ${Math.floor(pos.z)}`;
        document.getElementById('val-chunk').innerText = `${Math.floor(pos.x/16)}, ${Math.floor(pos.z/16)}`;
    }

    jump() { if (this.canJump) { this.velocity.y = 12; this.canJump = false; } }
}
