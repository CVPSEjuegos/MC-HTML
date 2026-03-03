import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

// 1. Configuración Básica
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Color cielo

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Iluminación (Crucial para ver el 3D)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 3. Generación de Terreno Optimizada (InstancedMesh)
const gridSize = 50; // 50x50 bloques
const count = gridSize * gridSize;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x55aa55 }); // Color pasto
const mesh = new THREE.InstancedMesh(geometry, material, count);

const dummy = new THREE.Object3D();
let i = 0;

for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
        // Generamos un relieve simple basado en ondas
        const y = Math.floor(Math.sin(x * 0.1) * 2 + Math.cos(z * 0.1) * 2);
        
        dummy.position.set(x - gridSize/2, y, z - gridSize/2);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
    }
}

scene.add(mesh);

// 4. Posición de cámara y Controles
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// 5. Bucle de Animación
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Ajuste de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
