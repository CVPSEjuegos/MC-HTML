import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 16;
        this.renderDistance = 3;
        this.chunks = {};
        this.materials = {
            grass: new THREE.MeshLambertMaterial({ color: 0x55aa55 }),
            stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
            wood: new THREE.MeshLambertMaterial({ color: 0x5d3a1a }),
            leaves: new THREE.MeshLambertMaterial({ color: 0x228b22 })
        };
    }

    getHeight(x, z) {
        return Math.floor(Math.sin(x * 0.1) * 4 + Math.cos(z * 0.1) * 4 + 10);
    }

    async generateInitialTerrain() {
        let total = (this.renderDistance * 2 + 1) ** 2;
        let loaded = 0;
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(x, z);
                loaded++;
                let pct = Math.floor((loaded / total) * 100);
                document.getElementById('loading-bar').style.width = pct + "%";
                await new Promise(r => setTimeout(r, 10));
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

                // Bloque de superficie (Gras)
                const grass = new THREE.Mesh(geometry, this.materials.grass);
                grass.position.set(wx, h, wz);
                group.add(grass);

                // Relleno hasta -64 (Stone)
                for (let y = h - 1; y >= -64; y -= 8) { // Optimizado: cada 8 bloques para no saturar
                    const stone = new THREE.Mesh(geometry, this.materials.stone);
                    stone.position.set(wx, y, wz);
                    stone.scale.set(1, 8, 1);
                    group.add(stone);
                }

                // Árboles aleatorios
                if (Math.random() > 0.98) this.spawnTree(group, wx, h + 1, wz);
            }
        }
        this.scene.add(group);
        this.chunks[key] = group;
    }

    spawnTree(group, x, y, z) {
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), this.materials.wood);
        trunk.position.set(x, y + 1.5, z);
        group.add(trunk);
        const leaves = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), this.materials.leaves);
        leaves.position.set(x, y + 4, z);
        group.add(leaves);
    }

    update(pos) { /* Aquí iría la carga infinita de chunks lejanos */ }
}
