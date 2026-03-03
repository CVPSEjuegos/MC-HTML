import * as THREE from 'three';

export class World {

    constructor(scene) {
        this.scene = scene;
        this.seed = 0;
        this.chunkSize = 16;
        this.renderDistance = 2;
        this.chunks = {};
    }

    setSeed(seed) {
        this.seed = typeof seed === "string" ? seed.length : Number(seed);
    }

    generateChunk(cx, cz) {

        const key = `${cx},${cz}`;
        if (this.chunks[key]) return;

        const geometry = new THREE.BoxGeometry(1,1,1);
        const material = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
        const mesh = new THREE.InstancedMesh(geometry, material, this.chunkSize * this.chunkSize);
        const matrix = new THREE.Matrix4();

        let i = 0;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {

                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;

                const y = Math.floor(
                    Math.sin((worldX + this.seed) * 0.1) * 2 +
                    Math.cos((worldZ + this.seed) * 0.1) * 2
                );

                matrix.setPosition(worldX, y, worldZ);
                mesh.setMatrixAt(i++, matrix);
            }
        }

        this.scene.add(mesh);
        this.chunks[key] = mesh;
    }

    updateChunks(position) {

        const currentChunkX = Math.floor(position.x / this.chunkSize);
        const currentChunkZ = Math.floor(position.z / this.chunkSize);

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(currentChunkX + x, currentChunkZ + z);
            }
        }
    }

    generateInitialTerrain() {
        this.updateChunks(new THREE.Vector3(0,0,0));
    }
}
