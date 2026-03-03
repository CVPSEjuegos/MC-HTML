import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 16;
        this.renderDistance = 4; 
        this.unloadDistance = 6;
        this.limit = 10000;      
        this.chunks = {};
        this.seed = Math.random();
        
        this.materials = {
            grass: new THREE.MeshLambertMaterial({ color: 0x55aa55 }),
            dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
            stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
            wood: new THREE.MeshLambertMaterial({ color: 0x5d3a1a }),
            leaves: new THREE.MeshLambertMaterial({ color: 0x228b22 })
        };

        this.scene.fog = new THREE.Fog(0x87ceeb, 32, 80);
        document.getElementById('val-seed').innerText = this.seed.toFixed(4);
    }

    // Función de ruido simple para terreno
    getHeight(x, z) {
        return Math.floor(Math.sin(x * 0.1) * 5 + Math.cos(z * 0.1) * 5 + 10);
    }

    generateChunk(cx, cz) {
        if (Math.abs(cx) > this.limit || Math.abs(cz) > this.limit) return;
        const key = `${cx},${cz}`;
        if (this.chunks[key]) return;

        // InstancedMesh para optimizar el dibujo de miles de bloques
        const maxBlocks = this.chunkSize * this.chunkSize * 40; 
        const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1), this.materials.grass, maxBlocks);
        const matrix = new THREE.Matrix4();

        let i = 0;
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                
                const groundHeight = this.getHeight(wx, wz);

                // Dibujar desde -64 hasta la altura del suelo
                for (let y = -64; y <= groundHeight; y++) {
                    matrix.setPosition(wx, y, wz);
                    mesh.setMatrixAt(i++, matrix);
                }

                // Generar Árboles aleatorios
                if (Math.random() > 0.98) {
                    this.spawnTree(wx, groundHeight + 1, wz);
                }
            }
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        this.scene.add(mesh);
        this.chunks[key] = mesh;
    }

    spawnTree(x, y, z) {
        // Tronco
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), this.materials.wood);
        trunk.position.set(x, y + 2, z);
        this.scene.add(trunk);
        // Hojas
        const leaves = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), this.materials.leaves);
        leaves.position.set(x, y + 5, z);
        this.scene.add(leaves);
    }

    update(playerPosition) {
        const pCX = Math.floor(playerPosition.x / this.chunkSize);
        const pCZ = Math.floor(playerPosition.z / this.chunkSize);

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(pCX + x, pCZ + z);
            }
        }

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
            this.scene.remove(this.chunks[key]);
            this.chunks[key].dispose();
            delete this.chunks[key];
        }
    }
}
