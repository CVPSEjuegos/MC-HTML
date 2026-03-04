import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.blocks = [];
        this.chunkSize = 16;
        this.renderDistance = 6;
        this.noise = new ImprovedNoise();

        scene.fog = new THREE.FogExp2(0x87CEEB, 0.05);
    }

    generateChunk(cx, cz) {
        const geometry = new THREE.BoxGeometry(1,1,1);
        const material = new THREE.MeshStandardMaterial();
        const count = this.chunkSize*this.chunkSize*10;
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        let idx = 0;

        for (let x=0; x<this.chunkSize; x++){
            for (let z=0; z<this.chunkSize; z++){
                const wx = cx*this.chunkSize + x;
                const wz = cz*this.chunkSize + z;

                // Generación Perlin
                const height = Math.floor((this.noise.noise(wx/20, wz/20, 0)*0.5 + 0.5)*6) + 4;

                for (let y=0; y<=height; y++){
                    if (y === height) color.setHex(0x448032); // pasto
                    else if (y > height-2) color.setHex(0x5d3a1a); // tierra
                    else color.setHex(0x777777); // piedra

                    dummy.position.set(wx, y, wz);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(idx, dummy.matrix);
                    mesh.setColorAt(idx, color);

                    this.blocks.push(new THREE.Vector3(wx, y, wz));
                    idx++;
                }
            }
        }

        mesh.instanceMatrix.needsUpdate = true;
        if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        this.scene.add(mesh);
        this.chunks.set(`${cx},${cz}`, mesh);
    }

    update(playerPos){
        const px = Math.floor(playerPos.x / this.chunkSize);
        const pz = Math.floor(playerPos.z / this.chunkSize);

        for (let x = px - this.renderDistance; x <= px + this.renderDistance; x++){
            for (let z = pz - this.renderDistance; z <= pz + this.renderDistance; z++){
                if(!this.chunks.has(`${x},${z}`)){
                    this.generateChunk(x,z);
                }
            }
        }
    }
}
