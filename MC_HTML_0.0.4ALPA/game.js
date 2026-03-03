// game.js
import * as THREE from "three";

let scene, camera, renderer, player;
let world = [];
let multiplayer = {
    peer: null,
    connections: {},
    id: null,
};

// ==================== INIT SINGLEPLAYER ====================
window.initSinglePlayer = function() {
    console.log("Inicializando mundo local...");

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Render
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // Jugador
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({color: 0x448032});
    player = new THREE.Mesh(geometry, material);
    player.position.y = 1;
    scene.add(player);

    // Mundo simple
    createWorld();

    animate();
};

// ==================== CREATE WORLD ====================
function createWorld() {
    // Crea un piso simple 10x10
    const floorMat = new THREE.MeshStandardMaterial({color: 0x555555});
    for(let x=-5;x<5;x++){
        for(let z=-5;z<5;z++){
            const block = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), floorMat);
            block.position.set(x, -0.5, z);
            scene.add(block);
            world.push(block);
        }
    }
}

// ==================== ANIMATE ====================
function animate() {
    requestAnimationFrame(animate);

    // Placeholder: movimiento simple con WASD
    handleMovement();

    renderer.render(scene, camera);
}

// ==================== MOVEMENT ====================
const keys = {};
window.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
window.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);

function handleMovement() {
    const speed = 0.1;
    if(keys["w"]) player.position.z -= speed;
    if(keys["s"]) player.position.z += speed;
    if(keys["a"]) player.position.x -= speed;
    if(keys["d"]) player.position.x += speed;

    // Mantener la cámara detrás del jugador
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 5;
    camera.lookAt(player.position);
}

// ==================== MULTIPLAYER ====================
window.hostServer = function() {
    multiplayer.peer = new Peer(undefined, {host: 'peerjs.com', port: 443, secure:true});
    multiplayer.peer.on('open', id => {
        multiplayer.id = id;
        alert(`Servidor creado! ID: ${id}`);
    });

    multiplayer.peer.on('connection', conn => {
        multiplayer.connections[conn.peer] = conn;
        conn.on('data', data => handleMultiplayerData(conn.peer, data));
        conn.on('close', ()=> delete multiplayer.connections[conn.peer]);
    });
};

window.joinServer = function(id) {
    if(!multiplayer.peer) multiplayer.peer = new Peer({host: 'peerjs.com', port: 443, secure:true});

    const conn = multiplayer.peer.connect(id);
    conn.on('open', ()=>{
        multiplayer.connections[id] = conn;
        alert("Conectado al servidor!");
    });
    conn.on('data', data => handleMultiplayerData(id, data));
};

// ==================== HANDLE MULTIPLAYER DATA ====================
function handleMultiplayerData(peerId, data) {
    console.log(`Recibido de ${peerId}:`, data);
    // Aquí puedes procesar movimiento de otros jugadores, chat, etc.
}

// ==================== UTILIDADES ====================
window.saveWorld = function() {
    // Guardar posición del jugador y mundo simple
    const state = {
        player: {x: player.position.x, y: player.position.y, z: player.position.z}
    };
    localStorage.setItem('MC_HTML_WORLD', JSON.stringify(state));
    alert("Mundo guardado!");
};

window.loadWorld = function() {
    const state = JSON.parse(localStorage.getItem('MC_HTML_WORLD'));
    if(state) {
        player.position.set(state.player.x, state.player.y, state.player.z);
        alert("Mundo cargado!");
    }
};
