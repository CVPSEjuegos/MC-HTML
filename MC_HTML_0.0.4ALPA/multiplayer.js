export class Multiplayer {
    constructor(game) {
        this.game = game;
        this.peer = null;
        this.connections = [];
    }

    // Lógica para el Servidor Oficial de Pruebas
    connectToOfficialTestServer() {
        console.log("Conectando al servidor oficial...");
        const officialSeed = "test1_02/03/2026";
        this.game.world.setSeed(officialSeed);
        this.game.startWorld(); // Inicia el mundo con la semilla especial
    }

    abrirServidor() {
        this.peer = new Peer(); // Genera un ID aleatorio para invitar amigos
        this.peer.on('open', (id) => {
            alert("Servidor abierto. Tu ID es: " + id);
            this.game.world.setSeed(Date.now()); // Semilla aleatoria por tiempo
        });

        this.peer.on('connection', (conn) => {
            console.log("Jugador conectado!");
            this.connections.push(conn);
        });
    }
}
