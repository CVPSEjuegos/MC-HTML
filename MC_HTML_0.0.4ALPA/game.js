import * as THREE from "three";

let scene, camera, renderer;
let player, playerId;
let players = {}; 
let world = [];
let isPaused = false;
let currentWorldName = "";

let multiplayer = {
    peer: null,
    connections: {},
    isHost: false
};

// ==================== INICIALIZACIÓN EXPORTADA ====================
window.startGame = function(worldName) {
    currentWorldName = worldName;
    if (!renderer) {
        initScene();
    }
    loadWorld(worldName);
};

window.setPause = function(state) {
    isPaused = state;
};

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // Jugador Local
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x448032 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 1, 0);
    scene.add(player);

    playerId = 'player_' + Math.floor(Math.random() * 10000);
    players[playerId] = player;

    createWorld();
    animate();
}

function createWorld() {
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    for (let x = -10; x < 10; x++) {
        for (let z = -10; z < 10; z++) {
            const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), floorMat);
            block.position.set(x, -0.5, z);
            scene.add(block);
            world.push(block);
        }
    }
}

// ==================== BUCLE DE ANIMACIÓN ====================
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function animate() {
    requestAnimationFrame(animate);
    if (!isPaused && player) {
        handleMovement();
    }
    if (renderer) renderer.render(scene, camera);
}

function handleMovement() {
    const speed = 0.1;
    if (keys["w"]) player.position.z -= speed;
    if (keys["s"]) player.position.z += speed;
    if (keys["a"]) player.position.x -= speed;
    if (keys["d"]) player.position.x += speed;

    camera.position.set(player.position.x, player.position.y + 4, player.position.z + 6);
    camera.lookAt(player.position);

    broadcastPosition();
}

// ==================== GUARDADO ====================
function loadWorld(name) {
    const data = localStorage.getItem('MC_HTML_' + name);
    if (data) {
        const state = JSON.parse(data);
        if(state.player) player.position.set(state.player.x, state.player.y, state.player.z);
    }
}

window.saveGame = function() {
    if(!player) return;
    const state = {
        player: { x: player.position.x, y: player.position.y, z: player.position.z }
    };
    localStorage.setItem('MC_HTML_' + currentWorldName, JSON.stringify(state));
};

// ==================== MULTIJUGADOR (PeerJS) ====================
window.hostServer = function() {
    multiplayer.peer = new Peer();
    multiplayer.isHost = true;
    multiplayer.peer.on('open', id => alert("Servidor iniciado. ID: " + id));
    multiplayer.peer.on('connection', conn => {
        multiplayer.connections[conn.peer] = conn;
        conn.on('data', data => handleData(conn.peer, data));
    });
};

window.joinServer = function(id) {
    multiplayer.peer = new Peer();
    const conn = multiplayer.peer.connect(id);
    conn.on('open', () => {
        multiplayer.connections[id] = conn;
        alert("¡Conectado!");
    });
    conn.on('data', data => handleData(id, data));
};

function handleData(peerId, data) {
    if (data.type === 'position') {
        if (!players[peerId]) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
            scene.add(p);
            players[peerId] = p;
        }
        players[peerId].position.set(data.pos.x, data.pos.y, data.pos.z);
    }
}

function broadcastPosition() {
    if (!multiplayer.peer) return;
    const pos = { x: player.position.x, y: player.position.y, z: player.position.z };
    for (const id in multiplayer.connections) {
        multiplayer.connections[id].send({ type: 'position', pos });
    }
}
