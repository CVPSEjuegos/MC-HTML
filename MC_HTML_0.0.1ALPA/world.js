import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 16;
        this.blocks = [];
    }

    async generateInitialTerrain() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x55aa55 }); // Verde Pasto
        
        // Generamos un área de 32x32 bloques
        const mesh = new THREE.InstancedMesh(geometry, material, 1024);
        const matrix = new THREE.Matrix4();
        
        let i = 0;
        for (let x = 0; x < 32; x++) {
            for (let z = 0; z < 32; z++) {
                // Elongación suave del terreno
                const y = Math.floor(Math.sin(x * 0.2) * 2 + Math.cos(z * 0.2) * 2);
                matrix.setPosition(x, y, z);
                mesh.setMatrixAt(i++, matrix);
            }
        }
        this.scene.add(mesh);
        console.log("🌍 Terreno generado correctamente.");
    }

    update(playerPosition) {
        // Reservado para carga de chunks dinámica
    }
}
