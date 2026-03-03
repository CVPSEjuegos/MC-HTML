import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);
        
        // Estado del movimiento
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;

        // Teclado
        this.keys = {};
        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // ESC y Reanudar (Fix para que no se trabe)
        domElement.addEventListener('click', () => {
            if (!this.controls.isLocked) this.controls.lock();
        });
    }

    update(world) {
        if (!this.controls.isLocked) return;

        const time = 0.016; // Aproximación a 60fps
        
        // Fricción y Gravedad
        this.velocity.x -= this.velocity.x * 10.0 * time;
        this.velocity.z -= this.velocity.z * 10.0 * time;
        this.velocity.y -= 9.8 * 2.0 * time; // Gravedad (9.8 m/s^2)

        this.direction.z = Number(this.keys['KeyW'] || false) - Number(this.keys['KeyS'] || false);
        this.direction.x = Number(this.keys['KeyD'] || false) - Number(this.keys['KeyA'] || false);
        this.direction.normalize();

        if (this.keys['KeyW'] || this.keys['KeyS']) this.velocity.z -= this.direction.z * 400.0 * time;
        if (this.keys['KeyA'] || this.keys['KeyD']) this.velocity.x -= this.direction.x * 400.0 * time;

        // Aplicar movimiento
        this.controls.moveRight(-this.velocity.x * time);
        this.controls.moveForward(-this.velocity.z * time);

        // --- COLISIONES SIMPLES CON EL SUELO ---
        this.camera.position.y += (this.velocity.y * time);

        if (this.camera.position.y < 1.8) { // 1.8 es la altura de los ojos
            this.velocity.y = 0;
            this.camera.position.y = 1.8;
            this.canJump = true;
        }

        // Salto
        if (this.keys['Space'] && this.canJump) {
            this.velocity.y += 8.0; 
            this.canJump = false;
        }
    }
}
