import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.chunkSize = 16;
        this.renderDistance = 2; 
        this.blocks = []; 
        this.pigs = [];

        // Niebla clásica de Minecraft
        scene.fog = new THREE.Fog(0x87ceeb, 15, 45); 
    }

    update(playerPos) {
        const px = Math.floor(playerPos.x / this.chunkSize);
        const pz = Math.floor(playerPos.z / this.chunkSize);

        for (let x = px - this.renderDistance; x <= px + this.renderDistance; x++) {
            for (let z = pz - this.renderDistance; z <= pz + this.renderDistance; z++) {
                const key = `${x},${z}`;
                if (!this.chunks.has(key)) {
                    this.generateChunk(x, z);
                }
            }
        }
        // Actualizar movimiento de cerdos
        this.pigs.forEach(pig => pig.update());
    }

    generateChunk(cx, cz) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x55aa55 });

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;
                
                // Generación de relieve con ruido simple
                const y = Math.floor(Math.sin(worldX / 8) * Math.cos(worldZ / 8) * 3);

                const block = new THREE.Mesh(geometry, material);
                block.position.set(worldX, y, worldZ);
                this.scene.add(block);
                this.blocks.push(block); // Guardar para colisiones
            }
        }

        // Aparecer cerdos aleatoriamente
        if (Math.random() > 0.8) {
            this.spawnPig(cx * 16 + 8, 5, cz * 16 + 8);
        }
        this.chunks.set(`${cx},${cz}`, true);
    }

    spawnPig(x, y, z) {
        const pig = new Pig(this.scene, x, y, z);
        this.pigs.push(pig);
    }
}

class Pig {
    constructor(scene, x, y, z) {
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.6, 1),
            new THREE.MeshStandardMaterial({ color: 0xffc0cb }) // Rosa cerdo
        );
        this.mesh.position.set(x, y, z);
        scene.add(this.mesh);
        this.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05);
    }

    update() {
        this.mesh.position.add(this.velocity);
        if (Math.random() < 0.01) { // Cambiar de dirección al azar
            this.velocity.set((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05);
        }
    }
}
