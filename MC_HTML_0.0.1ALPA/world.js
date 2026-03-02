import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.seed = 0;
    }

    // Convierte texto/números en una semilla numérica válida
    setSeed(input) {
        if (isNaN(input)) {
            let hash = 0;
            let str = String(input);
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            this.seed = Math.abs(hash);
        } else {
            this.seed = Number(input);
        }
    }

    async generateInitialTerrain() {
        // Limpiar terreno previo si existe
        this.scene.children = this.scene.children.filter(c => c.type !== 'InstancedMesh');

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
        const mesh = new THREE.InstancedMesh(geometry, material, 2500); // 50x50
        const matrix = new THREE.Matrix4();
        
        let i = 0;
        for (let x = 0; x < 50; x++) {
            for (let z = 0; z < 50; z++) {
                // Algoritmo de relieve basado en la semilla numérica
                const frequency = 0.1;
                const y = Math.floor(
                    Math.sin((x + this.seed) * frequency) * 2 + 
                    Math.cos((z + this.seed) * frequency) * 2
                );
                matrix.setPosition(x, y, z);
                mesh.setMatrixAt(i++, matrix);
            }
        }
        this.scene.add(mesh);
    }
}
