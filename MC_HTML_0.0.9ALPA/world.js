import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.blocks = [];
        this.renderDistance = 4; // Ajustado para mejor rendimiento inicial
        this.chunkSize = 16;
        
        // Bloques disponibles
        this.blockTypes = {
            1: 0x448032, 2: 0x5d3a1a, 3: 0x777777, 4: 0x3a2614, 
            5: 0x2d4c1e, 6: 0x999999, 7: 0x222222, 8: 0xd4af37, 9: 0xffffff
        };

        // Niebla optimizada
        scene.fog = new THREE.Fog(0x87CEEB, 4, 35);
    }

    generateChunk(cx, cz) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;
                // Generación de relieve
                const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3) + 2;

                for (let y = 0; y <= h; y++) {
                    let color = 0x777777;
                    if (y === h) color = 0x448032; // Césped
                    else if (y > h - 2) color = 0x5d3a1a; // Tierra

                    const block = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
                    block.position.set(worldX, y, worldZ);
                    this.scene.add(block);
                    this.blocks.push(block);
                }
            }
        }
        this.chunks.set(`${cx},${cz}`, true);
    }

    update(playerPos) {
        const px = Math.floor(playerPos.x / 16);
        const pz = Math.floor(playerPos.z / 16);
        
        // Generar nuevos chunks alrededor del jugador
        for (let x = px - this.renderDistance; x <= px + this.renderDistance; x++) {
            for (let z = pz - this.renderDistance; z <= pz + this.renderDistance; z++) {
                if (!this.chunks.has(`${x},${z}`)) {
                    this.generateChunk(x, z);
                }
            }
        }
    }
}
