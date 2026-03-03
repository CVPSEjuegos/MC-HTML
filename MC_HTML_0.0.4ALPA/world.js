import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 16;
        this.renderDistance = 4;
        this.chunks = {};
        this.seed = Math.random() * 1000;
        
        this.materials = {
            grass: new THREE.MeshLambertMaterial({ color: 0x55aa55 }),
            stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
            wood: new THREE.MeshLambertMaterial({ color: 0x5d3a1a }),
            leaves: new THREE.MeshLambertMaterial({ color: 0x228b22 })
        };
        document.getElementById('val-seed').innerText = this.seed.toFixed(2);
    }

    getHeight(x, z) {
        // Ruido simple combinado para montañas
        return Math.floor(
            Math.sin(x * 0.1) * 4 + 
            Math.cos(z * 0.1) * 4 + 
            Math.sin(x * 0.05 + z * 0.05) * 8 + 15
        );
    }

    async generateInitialTerrain() {
        const total = (this.renderDistance * 2 + 1) ** 2;
        let loaded = 0;
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(x, z);
                loaded++;
                const pct = Math.floor((loaded / total) * 100);
                document.getElementById('loading-bar').style.width = pct + "%";
                if (loaded % 2 === 0) await new Promise(r => setTimeout(r, 1));
            }
        }
    }

    generateChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks[key]) return;

        const group = new THREE.Group();
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                const h = this.getHeight(wx, wz);

                // Superficie
                const grass = new THREE.Mesh(geometry, this.materials.grass);
                grass.position.set(wx, h, wz);
                group.add(grass);

                // Relleno hasta -64 (Optimizado con escala para evitar exceso de mallas)
                const stoneScale = h - (-64);
                if (stoneScale > 0) {
                    const stone = new THREE.Mesh(geometry, this.materials.stone);
                    stone.position.set(wx, (h + (-64)) / 2, wz);
                    stone.scale.set(1, stoneScale, 1);
                    group.add(stone);
                }

                // Generar Árboles
                if (Math.random() > 0.985) {
                    this.spawnTree(group, wx, h + 1, wz);
                }
            }
        }
        this.scene.add(group);
        this.chunks[key] = group;
    }

    spawnTree(group, x, y, z) {
        for (let i = 0; i < 4; i++) {
            const log = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.materials.wood);
            log.position.set(x, y + i, z);
            group.add(log);
        }
        const leaves = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), this.materials.leaves);
        leaves.position.set(x, y + 4, z);
        group.add(leaves);
    }

    update(pos) {
        const pCX = Math.floor(pos.x / this.chunkSize);
        const pCZ = Math.floor(pos.z / this.chunkSize);
        // Aquí se puede añadir carga de chunks en tiempo real si se desea
    }
}
