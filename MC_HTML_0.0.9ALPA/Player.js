import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.scene = scene;
        this.controls = new PointerLockControls(camera, domElement);
        this.velocity = new THREE.Vector3();
        this.keys = {};
        this.selectedSlot = 1;
        this.canJump = false;

        // Mano de Steve
        const handGeom = new THREE.BoxGeometry(0.3, 0.4, 0.8);
        const handMat = new THREE.MeshStandardMaterial({ color: 0xdbac82 });
        this.hand = new THREE.Mesh(handGeom, handMat);
        this.camera.add(this.hand);
        this.hand.position.set(0.6, -0.5, -0.7);

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code.startsWith('Digit')) this.updateSlot(e.code.replace('Digit', ''));
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    updateSlot(slot) {
        if (slot >= 1 && slot <= 9) {
            this.selectedSlot = slot;
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
            document.getElementById('slot' + slot).classList.add('selected');
        }
    }

    handleInteraction(world, type) {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = ray.intersectObjects(world.blocks);
        if (intersects.length > 0 && intersects[0].distance < 5) {
            if (type === 'break') {
                this.scene.remove(intersects[0].object);
                world.blocks = world.blocks.filter(b => b !== intersects[0].object);
            } else if (type === 'place') {
                const color = world.blockTypes[this.selectedSlot];
                const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color }));
                b.position.copy(intersects[0].object.position).add(intersects[0].face.normal);
                this.scene.add(b);
                world.blocks.push(b);
            }
        }
    }

    update(world, delta) {
        if (!this.controls.isLocked) return;

        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.y -= 25.0 * delta;

        if (this.keys['KeyW']) this.velocity.z -= 150.0 * delta;
        if (this.keys['KeyS']) this.velocity.z += 150.0 * delta;
        if (this.keys['KeyA']) this.velocity.x -= 150.0 * delta;
        if (this.keys['KeyD']) this.velocity.x += 150.0 * delta;

        this.controls.moveForward(-this.velocity.z * delta);
        this.controls.moveRight(this.velocity.x * delta);
        this.camera.position.y += (this.velocity.y * delta);

        // Colisiones
        let ground = false;
        for (let b of world.blocks) {
            if (Math.abs(this.camera.position.x - b.position.x) < 0.6 &&
                Math.abs(this.camera.position.z - b.position.z) < 0.6 &&
                (this.camera.position.y - b.position.y) < 2.1 && (this.camera.position.y - b.position.y) > 1.4) {
                this.camera.position.y = b.position.y + 2;
                this.velocity.y = 0;
                ground = true;
                break;
            }
        }
        this.canJump = ground;
        if (this.keys['Space'] && this.canJump) this.velocity.y = 8;

        this.hand.position.y = -0.5 + Math.sin(performance.now() * 0.008) * 0.03;
    }
}
