import * as THREE from 'https://unpkg.com/three@0.132.2/build/three.module.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.chunkSize = 16;
        this.renderDistance = 4; // Ajuste para rendimiento Alpha
    }

    async generateInitialTerrain() {
        // Generar zona inicial (0,0)
        for (let x = -this.renderDistance; x < this.renderDistance; x++) {
            for (let z = -this.renderDistance; z < this.renderDistance; z++) {
                this.createChunk(x * this.chunkSize, z * this.chunkSize);
            }
        }
    }

    createChunk(xOff, zOff) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x44aa44 });
        const mesh = new THREE.InstancedMesh(geometry, material, this.chunkSize * this.chunkSize);

        let i = 0;
        const matrix = new THREE.Matrix4();
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                // Altura simple procedimental
                const y = Math.floor(Math.sin((x + xOff) * 0.1) * 2);
                matrix.setPosition(x + xOff, y, z + zOff);
                mesh.setMatrixAt(i++, matrix);
            }
        }
        this.scene.add(mesh);
        this.chunks.set(`${xOff},${zOff}`, mesh);
    }

    update(playerPosition) {
        // Aquí se gestionaría la Zona 2 y 3 (carga/descarga) en el futuro
    }
}
