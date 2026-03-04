import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js'; // Para Perlin Noise

// --- CLASE WORLD ACTUALIZADA ---
class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.blocks = []; 
        this.chunkSize = 16;
        this.renderDistance = 5; // default, configurable
        this.noise = new ImprovedNoise();

        scene.fog = new THREE.FogExp2(0x87CEEB, 0.05);
    }

    generateChunk(cx, cz) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial();
        const count = this.chunkSize * this.chunkSize * 16; // aprox
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        let idx = 0;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;

                // Terreno con Perlin Noise
                const height = Math.floor(this.noise.noise(worldX / 20, worldZ / 20, 0) * 5) + 5;

                for (let y = 0; y <= height; y++) {
                    if (y === height) color.setHex(0x448032); // Pasto
                    else if (y > height - 2) color.setHex(0x5d3a1a); // Tierra
                    else color.setHex(0x777777); // Piedra

                    dummy.position.set(worldX, y, worldZ);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(idx, dummy.matrix);
                    mesh.setColorAt(idx, color);

                    this.blocks.push(new THREE.Vector3(worldX, y, worldZ));
                    idx++;
                }
            }
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        this.scene.add(mesh);
        this.chunks.set(`${cx},${cz}`, mesh);
    }

    // Generación circular alrededor del jugador
    update(playerPos) {
        const px = Math.floor(playerPos.x / this.chunkSize);
        const pz = Math.floor(playerPos.z / this.chunkSize);

        for (let x = px - this.renderDistance; x <= px + this.renderDistance; x++) {
            for (let z = pz - this.renderDistance; z <= pz + this.renderDistance; z++) {
                const distance = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
                if (distance <= this.renderDistance && !this.chunks.has(`${x},${z}`)) {
                    this.generateChunk(x, z);
                }
            }
        }
    }
}

// --- LÓGICA DEL JUEGO (COLISIONES MEJORADAS) ---
function handleCollisions() {
    let onGround = false;
    for (let b of world.blocks) {
        if (Math.abs(camera.position.x - b.x) < 0.6 && Math.abs(camera.position.z - b.z) < 0.6) {
            // Salta sobre el bloque en lugar de atorarse
            if (camera.position.y < b.y + 2) {
                camera.position.y = b.y + 2;
                velocity.y = Math.max(0, velocity.y); // evita caer dentro
                onGround = true;
            }
        }
    }
    canJump = onGround;
    if (camera.position.y < -20) takeDamage(10);
}

// --- ANIMATE ACTUALIZADO ---
function animate() {
    if (!isLoaded) return;
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 25.0 * delta;

        if (moveForward) velocity.z -= 150.0 * delta;
        if (moveBackward) velocity.z += 150.0 * delta;
        if (moveLeft) velocity.x -= 150.0 * delta;
        if (moveRight) velocity.x += 150.0 * delta;

        controls.moveRight(velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += velocity.y * delta;

        handleCollisions(); // nueva función
    }

    world.update(camera.position);
    renderer.render(scene, camera);
}
