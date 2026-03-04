import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js'; // Perlin noise

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.chunkSize = 16;
        this.chunkHeight = 20;
        this.renderRadius = 3; // cantidad de chunks a generar alrededor
        this.blocks = [];
        this.noise = new ImprovedNoise();
        this.seed = Math.random() * 100;

        scene.fog = new THREE.FogExp2(0x87CEEB, 0.02);
    }

    // Genera un chunk en (cx, cz)
    generateChunk(cx, cz) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial();
        const count = this.chunkSize * this.chunkSize * this.chunkHeight;
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        let idx = 0;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                // Coordenadas en el mundo
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;

                // Altura usando Perlin Noise
                const height = Math.floor(this.noise.noise(worldX / 20, worldZ / 20, this.seed) * 10 + 10);

                for (let y = 0; y <= height; y++) {
                    // Color según capa
                    if (y === height) color.setHex(0x448032); // pasto
                    else if (y > height - 3) color.setHex(0x5d3a1a); // tierra
                    else color.setHex(0x777777); // piedra

                    dummy.position.set(worldX, y, worldZ);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(idx, dummy.matrix);
                    mesh.setColorAt(idx, color);

                    // Guardar bloque para colisiones
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

    // Actualiza chunks alrededor del jugador
    update(playerPos) {
        const pcx = Math.floor(playerPos.x / this.chunkSize);
        const pcz = Math.floor(playerPos.z / this.chunkSize);

        const activeChunks = new Set();

        for (let dx = -this.renderRadius; dx <= this.renderRadius; dx++) {
            for (let dz = -this.renderRadius; dz <= this.renderRadius; dz++) {
                const dist = Math.sqrt(dx*dx + dz*dz);
                if (dist <= this.renderRadius) { // círculo alrededor del jugador
                    const cx = pcx + dx;
                    const cz = pcz + dz;
                    activeChunks.add(`${cx},${cz}`);
                    if (!this.chunks.has(`${cx},${cz}`)) this.generateChunk(cx, cz);
                }
            }
        }

        // Descargar chunks que están fuera del radio
        for (let key of this.chunks.keys()) {
            if (!activeChunks.has(key)) {
                const mesh = this.chunks.get(key);
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
                this.chunks.delete(key);
            }
        }
    }
}
