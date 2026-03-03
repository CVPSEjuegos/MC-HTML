import * as THREE from 'three';

export class Multiplayer {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.peer = null;
        this.connections = [];
        this.players = {};
    }

    host() {
        this.peer = new Peer();
        this.peer.on('open', (id) => {
            console.log("Tu ID de servidor es: " + id);
            document.getElementById('val-peer').innerText = id;
            alert("ID de tu servidor: " + id);
        });
        this.peer.on('connection', conn => this.setupConnection(conn));
    }

    join(id) {
        this.peer = new Peer();
        this.peer.on('open', () => {
            const conn = this.peer.connect(id);
            this.setupConnection(conn);
            document.getElementById('val-peer').innerText = "Conectado a: " + id;
        });
    }

    setupConnection(conn) {
        this.connections.push(conn);
        conn.on('data', data => {
            if (!this.players[conn.peer]) {
                const mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 1.8, 0.8),
                    new THREE.MeshStandardMaterial({color: 0xff0000})
                );
                this.scene.add(mesh);
                this.players[conn.peer] = mesh;
            }
            this.players[conn.peer].position.set(data.x, data.y - 1, data.z);
        });
    }

    update() {
        if (!this.peer || this.connections.length === 0) return;
        const data = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        };
        this.connections.forEach(conn => {
            if (conn.open) conn.send(data);
        });
    }
}
