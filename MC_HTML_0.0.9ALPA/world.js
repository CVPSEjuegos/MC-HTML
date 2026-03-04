import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.blocks = []; // Para colisiones
        this.chunkSize = 16;
        this.renderDistance = 2; // Distancia inicial estable
        
        this.blockTypes = {
            1: 0x448032, // Grass
            2: 0x5d3a1a, // Dirt
            3: 0x777777  // Stone
        };

        scene.fog = new THREE.FogExp2(0x87CEEB, 0.05);
    }

    generateChunk(cx, cz) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ vertexColors: false });
        
        // Calculamos cuántos bloques habrá aprox. para el InstancedMesh
        const count = this.chunkSize * this.chunkSize * 5; 
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        const dummy = new THREE.Object3D();
        let idx = 0;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;
                
                // Generación de relieve suave
                const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3) + 2;

                for (let y = 0; y <= h; y++) {
                    let color = new THREE.Color(y === h ? 0x448032 : (y > h - 2 ? 0x5d3a1a : 0x777777));
                    
                    dummy.position.set(worldX, y, worldZ);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(idx, dummy.matrix);
                    mesh.setColorAt(idx, color);

                    // Guardamos una referencia simple para colisiones del Player
                    this.blocks.push({ position: new THREE.Vector3(worldX, y, worldZ) });
                    idx++;
                }
            }
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        
        this.scene.add(mesh);
        this.chunks.set(`${cx},${cz}`, mesh);
    }

    update(playerPos) {
        const px = Math.floor(playerPos.x / this.chunkSize);
        const pz = Math.floor(playerPos.z / this.chunkSize);
        
        for (let x = px - this.renderDistance; x <= px + this.renderDistance; x++) {
            for (let z = pz - this.renderDistance; z <= pz + this.renderDistance; z++) {
                if (!this.chunks.has(`${x},${z}`)) {
                    this.generateChunk(x, z);
                }
            }
        }
    }
}
