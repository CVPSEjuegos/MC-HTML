// game.js
import * as THREE from "three";

let scene, camera, renderer;
let player, playerId;
let players = {}; // otros jugadores
let world = [];
let multiplayer = {
    peer: null,
    connections: {},
    isHost: false
};

// ==================== INIT 3D ====================
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0,2,5);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(10,10,10);
    scene.add(light);

    // Jugador local
    const geometry = new THREE.BoxGeometry(1,2,1);
    const material = new THREE.MeshStandardMaterial({color:0x448032});
    player = new THREE.Mesh(geometry, material);
    player.position.y = 1;
    scene.add(player);
    playerId = generateId();
    players[playerId] = player;

    // Mundo simple
    createWorld();

    animate();
}

// ==================== WORLD ====================
function createWorld() {
    const floorMat = new THREE.MeshStandardMaterial({color:0x555555});
    for(let x=-5;x<5;x++){
        for(let z=-5;z<5;z++){
            const block = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), floorMat);
            block.position.set(x,-0.5,z);
            scene.add(block);
            world.push(block);
        }
    }
}

// ==================== ANIMATE ====================
const keys = {};
window.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
window.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);

function animate() {
    requestAnimationFrame(animate);
    handleMovement();
    renderer.render(scene,camera);
}

// ==================== MOVEMENT ====================
function handleMovement() {
    const speed = 0.1;
    if(keys["w"]) player.position.z -= speed;
    if(keys["s"]) player.position.z += speed;
    if(keys["a"]) player.position.x -= speed;
    if(keys["d"]) player.position.x += speed;

    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 5;
    camera.lookAt(player.position);

    // Enviar posición a otros jugadores si es host o cliente conectado
    broadcastPosition();
}

// ==================== MULTIPLAYER ====================
function generateId() {
    return 'player_'+Math.floor(Math.random()*10000);
}

window.hostServer = function() {
    multiplayer.peer = new Peer(undefined,{host:'peerjs.com', port:443, secure:true});
    multiplayer.isHost = true;

    multiplayer.peer.on('open', id => {
        playerId = id;
        alert("Servidor creado! ID: "+id);
    });

    multiplayer.peer.on('connection', conn => {
        multiplayer.connections[conn.peer] = conn;
        conn.on('data', data => handleData(conn.peer, data));
        conn.on('close', ()=> delete multiplayer.connections[conn.peer]);

        // Enviar estado inicial del mundo
        conn.send({type:'init', players:getAllPlayerStates()});
    });
};

window.joinServer = function(id) {
    multiplayer.peer = new Peer({host:'peerjs.com', port:443, secure:true});
    const conn = multiplayer.peer.connect(id);
    conn.on('open', ()=>{
        multiplayer.connections[id] = conn;
        alert("Conectado al servidor!");
    });
    conn.on('data', data => handleData(id, data));
};

// ==================== HANDLE DATA ====================
function handleData(peerId, data) {
    if(data.type==='position') {
        if(!players[peerId]){
            // Crear jugador nuevo
            const geometry = new THREE.BoxGeometry(1,2,1);
            const material = new THREE.MeshStandardMaterial({color:0x884488});
            const p = new THREE.Mesh(geometry, material);
            p.position.set(data.pos.x, data.pos.y, data.pos.z);
            scene.add(p);
            players[peerId] = p;
        } else {
            // Actualizar posición
            players[peerId].position.set(data.pos.x,data.pos.y,data.pos.z);
        }
    }

    if(data.type==='init') {
        // Recibir todos los jugadores existentes al unirse
        for(const pid in data.players){
            if(pid!==playerId && !players[pid]){
                const info = data.players[pid];
                const geometry = new THREE.BoxGeometry(1,2,1);
                const material = new THREE.MeshStandardMaterial({color:0x884488});
                const p = new THREE.Mesh(geometry, material);
                p.position.set(info.x, info.y, info.z);
                scene.add(p);
                players[pid] = p;
            }
        }
    }
}

// ==================== BROADCAST ====================
function broadcastPosition() {
    const pos = {x:player.position.x, y:player.position.y, z:player.position.z};
    const data = {type:'position', pos};
    for(const pid in multiplayer.connections){
        multiplayer.connections[pid].send(data);
    }
}

// ==================== SINGLEPLAYER ====================
window.initSinglePlayer = initScene;

// ==================== EXPORTS ====================
window.saveWorld = function(){
    const state = {player:{x:player.position.x,y:player.position.y,z:player.position.z}};
    localStorage.setItem('MC_HTML_WORLD',JSON.stringify(state));
    alert("Mundo guardado!");
};

window.loadWorld = function(){
    const state = JSON.parse(localStorage.getItem('MC_HTML_WORLD'));
    if(state){
        player.position.set(state.player.x,state.player.y,state.player.z);
        alert("Mundo cargado!");
    }
};
