import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        
        // NIEBLA: Color del cielo, distancia mínima, distancia máxima
        // Esto oculta el final del mundo y ahorra recursos
        scene.fog = new THREE.Fog(0x87ceeb, 5, 25); 

        this.generate();
    }

    generate() {
        const size = 32; // Tamaño del mapa
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
        
        // Optimizamos: Usamos InstancedMesh en lugar de miles de Meshes individuales
        this.mesh = new THREE.InstancedMesh(geometry, material, size * size);
        
        let i = 0;
        const matrix = new THREE.Matrix4();
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                // Generación de terreno simple (puedes añadir Perlin Noise después)
                matrix.setPosition(x - size/2, 0, z - size/2);
                this.mesh.setMatrixAt(i, matrix);
                i++;
            }
        }
        this.scene.add(this.mesh);
    }
}
