import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.blocks = [];
        this.generate();
    }

    generate() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x55aa55 });

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 0, z);
                this.scene.add(mesh);
                this.blocks.push(mesh);
            }
        }
    }

    breakBlock(camera) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({x: 0, y: 0}, camera);
        const intersects = raycaster.intersectObjects(this.blocks);
        if (intersects.length > 0) {
            const obj = intersects[0].object;
            this.scene.remove(obj);
            this.blocks = this.blocks.filter(b => b !== obj);
        }
    }
    
    placeBlock(camera) {
        // Lógica para poner bloque en la cara del seleccionado
    }
}
