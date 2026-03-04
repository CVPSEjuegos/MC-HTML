import * as THREE from 'three';

export class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;

        this.speed = 5;
        this.jumpPower = 10;

        // Altura y tamaño del jugador (para colisiones)
        this.height = 2;
        this.radius = 0.5;
    }

    update(delta, input) {
        // Movimiento según input
        this.direction.set(0, 0, 0);
        if (input.forward) this.direction.z -= 1;
        if (input.backward) this.direction.z += 1;
        if (input.left) this.direction.x -= 1;
        if (input.right) this.direction.x += 1;
        this.direction.normalize();

        // Aplicar movimiento horizontal
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(this.camera.up, forward).normalize();

        const move = new THREE.Vector3();
        move.copy(forward).multiplyScalar(this.direction.z * this.speed * delta);
        move.add(right.multiplyScalar(this.direction.x * this.speed * delta));

        this.checkCollisionAndMove(move);

        // Gravedad
        this.velocity.y -= 25 * delta;
        this.camera.position.y += this.velocity.y * delta;

        // Checar suelo
        if (this.isOnGround()) {
            this.velocity.y = 0;
            this.canJump = true;
        }
    }

    jump() {
        if (this.canJump) {
            this.velocity.y = this.jumpPower;
            this.canJump = false;
        }
    }

    isOnGround() {
        const pos = this.camera.position.clone();
        pos.y -= 0.1;
        for (let b of this.world.blocks) {
            if (Math.abs(pos.x - b.x) < this.radius && Math.abs(pos.z - b.z) < this.radius) {
                if (pos.y <= b.y + 0.01) {
                    this.camera.position.y = b.y + this.height;
                    return true;
                }
            }
        }
        return false;
    }

    checkCollisionAndMove(move) {
        const nextPos = this.camera.position.clone().add(move);

        for (let b of this.world.blocks) {
            // Colisión lateral (X-Z)
            const dx = nextPos.x - b.x;
            const dz = nextPos.z - b.z;
            const dy = nextPos.y - b.y;

            // Detecta si hay bloque justo al frente
            if (Math.abs(dx) < this.radius + 0.5 &&
                Math.abs(dz) < this.radius + 0.5 &&
                dy >= 0 && dy <= this.height + 0.5) {
                
                // Bloque detectado: saltar sobre él si se puede
                if (dy < this.height) {
                    nextPos.y = b.y + this.height;
                    this.velocity.y = 0; // detiene caída
                } else {
                    move.set(0, 0, 0); // bloqueado
                }
            }
        }

        this.camera.position.add(move);
    }
}
