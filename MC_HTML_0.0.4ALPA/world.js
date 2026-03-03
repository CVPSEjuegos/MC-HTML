import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 16;
        this.renderDistance = 4; // 4+1+4 = 9 chunks de ancho (Zona 1)
        this.unloadDistance = 6; // Distancia para borrar (Zona 2)
        this.limit = 10000;      // Límite del mundo (Zona 4)
        this.chunks = {};
        this.materials = {
            grass: new THREE.MeshLambertMaterial({ color: 0x55aa55 })
        };

        // --- ZONA 2: NEBLINA ---
        // La neblina empieza a los 32 metros y se vuelve opaca a los 64
        this.scene.fog = new THREE.Fog(0x87ceeb, 32, 64);
    }

    // ZONA 3: Generación Preparada
    generateChunk(cx, cz) {
        // ZONA 4: Límite de 10,000 chunks
        if (Math.abs(cx) > this.limit || Math.abs(cz) > this.limit) return;

        const key = `${cx},${cz}`;
        if (this.chunks[key]) return;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.InstancedMesh(geometry, this.materials.grass, this.chunkSize * this.chunkSize);
        const matrix = new THREE.Matrix4();

        let i = 0;
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;
                
                // Generación simple de suelo
                matrix.setPosition(worldX, 0, worldZ);
                mesh.setMatrixAt(i++, matrix);
            }
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        this.scene.add(mesh);
        this.chunks[key] = mesh;
    }

    // ZONA 2: DETECCIÓN Y DESCARGA
    update(playerPosition) {
        const pCX = Math.floor(playerPosition.x / this.chunkSize);
        const pCZ = Math.floor(playerPosition.z / this.chunkSize);

        // Cargar nuevos chunks (Zona 1: 9x9)
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(pCX + x, pCZ + z);
            }
        }

        // Descargar chunks lejanos (Optimización de Memoria)
        Object.keys(this.chunks).forEach(key => {
            const [cx, cz] = key.split(',').map(Number);
            const dist = Math.sqrt(Math.pow(cx - pCX, 2) + Math.pow(cz - pCZ, 2));

            if (dist > this.unloadDistance) {
                this.unloadChunk(key);
            }
        });
    }

    unloadChunk(key) {
        if (this.chunks[key]) {
            // Aquí se guardarían los datos en localStorage antes de borrar
            this.scene.remove(this.chunks[key]);
            this.chunks[key].dispose(); // Libera memoria de video
            delete this.chunks[key];
            console.log(`Chunk ${key} descargado para ahorrar RAM`);
        }
    }
}
