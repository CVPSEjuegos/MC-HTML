import * as THREE from 'three';

export class World {
    constructor(scene, audioListener) {
        this.scene = scene;
        this.audioListener = audioListener;
        this.chunks = new Map();
        this.blocks = [];
        this.pigs = [];
        this.renderDistance = 6;
        this.chunkSize = 16;
        
        // Bloques disponibles (9 slots)
        this.blockTypes = {
            1: 0x448032, 2: 0x5d3a1a, 3: 0x777777, 4: 0x3a2614, 
            5: 0x2d4c1e, 6: 0x999999, 7: 0x222222, 8: 0xd4af37, 9: 0xffffff
        };

        // Niebla optimizada
        scene.fog = new THREE.Fog(0x87CEEB, 4, 35);
    }

    generateChunk(cx, cz) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;
                const h = Math.floor(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 3) + 2;

                for (let y = 0; y <= h; y++) {
                    let color = 0x777777;
                    if (y === h) color = 0x448032;
                    else if (y > h - 2) color = 0x5d3a1a;

                    const block = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
                    block.position.set(worldX, y, worldZ);
                    this.scene.add(block);
                    this.blocks.push(block);
                }
            }
        }
        if (Math.random() > 0.8) this.spawnPig(cx * 16 + 8, 5, cz * 16 + 8);
        this.chunks.set(`${cx},${cz}`, true);
    }

    spawnPig(x, y, z) {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1), new THREE.MeshStandardMaterial({ color: 0xffc0cb }));
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffc0cb }));
        head.position.set(0, 0.2, 0.6);
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0x0 }));
        const e1 = eye.clone(); e1.position.set(0.15, 0.1, 0.2);
        const e2 = eye.clone(); e2.position.set(-0.15, 0.1, 0.2);
        head.add(e1, e2); group.add(body, head);
        group.position.set(x, y, z);
        this.scene.add(group);
        this.pigs.push({ 
            mesh: group, 
            dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5),
            nextSound: Date.now() + Math.random() * 8000 
        });
    }

    playPigSound(pos) {
        const osc = this.audioListener.context.createOscillator();
        const gain = this.audioListener.context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioListener.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioListener.context.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, this.audioListener.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioListener.context.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.audioListener.context.destination);
        osc.start(); osc.stop(this.audioListener.context.currentTime + 0.2);
    }

    update(playerPos) {
        const px = Math.floor(playerPos.x / 16);
        const pz = Math.floor(playerPos.z / 16);
        for (let x = px - this.renderDistance; x <= px + this.renderDistance; x++) {
            for (let z = pz - this.renderDistance; z <= pz + this.renderDistance; z++) {
                if (!this.chunks.has(`${x},${z}`)) this.generateChunk(x, z);
            }
        }
        this.pigs.forEach(p => {
            p.mesh.position.addScaledVector(p.dir, 0.02);
            if (Date.now() > p.nextSound) {
                this.playPigSound(p.mesh.position);
                p.nextSound = Date.now() + 5000 + Math.random() * 10000;
            }
            if (Math.random() < 0.01) p.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5);
            p.mesh.lookAt(p.mesh.position.clone().add(p.dir));
        });
    }
}
