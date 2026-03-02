import * as THREE from 'three';

export class World {
    constructor(scene, seed = Math.random()) {
        this.scene = scene;
        this.seed = seed;
        this.chunkSize = 16;

        // Configuración de Zonas
        this.renderDist = 12;      // Zona 1 & 2 (Dibujado)
        this.dataDist = 30;        // Zona 3 (Solo datos en RAM)

        this.chunks = new Map();   // Aquí guardamos los datos (Zona 3)
        this.activeMeshes = new Map(); // Aquí lo que se ve (Zona 1 y 2)

        this.blockGeo = new THREE.BoxGeometry(1, 1, 1);
        this.materials = {
            grass: new THREE.MeshLambertMaterial({ color: 0x567d46 }),
            stone: new THREE.MeshLambertMaterial({ color: 0x808080 })
        };
    }

    // Generación matemática (Zona 4 -> Zona 3)
    getChunkData(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return this.chunks.get(key);

        const data = new Uint8Array(this.chunkSize * this.chunkSize);
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                // Usamos la semilla para que el mundo sea único y no se duplique
                const h = Math.floor(Math.abs(Math.sin(wx * 0.1 * this.seed) * Math.cos(wz * 0.1 * this.seed)) * 5) + 10;
                data[x + z * this.chunkSize] = h;
            }
        }
        this.chunks.set(key, data);
        return data;
    }

    // Gestión de Zonas (Cargar/Descargar según posición del jugador)
    update(playerPos) {
        const px = Math.floor(playerPos.x / this.chunkSize);
        const pz = Math.floor(playerPos.z / this.chunkSize);

        // 1. Cargar Zona 1 y 2 (Visual)
        for (let x = px - this.renderDist; x <= px + this.renderDist; x++) {
            for (let z = pz - this.renderDist; z <= pz + this.renderDist; z++) {
                const dist = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);

                if (dist <= this.renderDist) { // Forma de círculo
                    this.drawChunk(x, z);
                }
            }
        }

        // 2. Limpieza (Si el chunk está lejos, eliminar de la escena pero mantener datos)
        for (const [key, mesh] of this.activeMeshes) {
            const [cx, cz] = key.split(',').map(Number);
            const dist = Math.sqrt((cx - px) ** 2 + (cz - pz) ** 2);
            if (dist > this.renderDist + 2) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                this.activeMeshes.delete(key);
            }
        }
    }

    drawChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.activeMeshes.has(key)) return;

        const data = this.getChunkData(cx, cz);
        const mesh = new THREE.InstancedMesh(this.blockGeo, this.materials.grass, this.chunkSize * this.chunkSize);
        const dummy = new THREE.Object3D();

        let i = 0;
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const h = data[x + z * this.chunkSize];
                dummy.position.set(cx * this.chunkSize + x, h, cz * this.chunkSize + z);
                dummy.updateMatrix();
                mesh.setMatrixAt(i++, dummy.matrix);
            }
        }

        this.scene.add(mesh);
        this.activeMeshes.set(key, mesh);
    }
}