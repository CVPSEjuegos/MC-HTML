import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, scene, domElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);
        this.velocity = new THREE.Vector3();
        this.keys = {};
        
        // --- LA MANO ---
        const handGeom = new THREE.BoxGeometry(0.3, 0.3, 0.7);
        const handMat = new THREE.MeshStandardMaterial({ color: 0xdbac82 });
        this.hand = new THREE.Mesh(handGeom, handMat);
        this.camera.add(this.hand);
        this.hand.position.set(0.5, -0.4, -0.6); // Posición estilo Minecraft

        // --- INVENTARIO ---
        this.selectedSlot = 1;
        this.blockColors = { 1: 0x55aa55, 2: 0x808080, 3: 0x8b4513 };

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Digit1') this.selectSlot(1);
            if (e.code === 'Digit2') this.selectSlot(2);
            if (e.code === 'Digit3') this.selectSlot(3);
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    selectSlot(slot) {
        this.selectedSlot = slot;
        document.querySelectorAll('.slot').forEach(s => s.style.borderColor = '#555');
        document.getElementById('slot' + slot).style.borderColor = 'white';
    }

    update(world) {
        if (!this.controls.isLocked) return;

        const speed = 0.12;
        this.velocity.y -= 0.015; // Gravedad constante

        if (this.keys['KeyW']) this.controls.moveForward(speed);
        if (this.keys['KeyS']) this.controls.moveForward(-speed);
        if (this.keys['KeyA']) this.controls.moveRight(-speed);
        if (this.keys['KeyD']) this.controls.moveRight(speed);

        this.camera.position.y += this.velocity.y;

        // --- COLISIÓN Y SALTO ---
        // Chequeo simple de suelo a altura y=2
        if (this.camera.position.y < 2) {
            this.velocity.y = 0;
            this.camera.position.y = 2;
            if (this.keys['Space']) this.velocity.y = 0.3; // Salto
        }

        // Animación de la mano al caminar
        this.hand.position.y = -0.4 + Math.sin(Date.now() * 0.01) * 0.05;
        this.hand.position.x = 0.5 + Math.cos(Date.now() * 0.005) * 0.02;
    }
}
