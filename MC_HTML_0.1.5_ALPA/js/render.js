const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // bloques
  for (let x = 0; x < World.size; x++) {
    for (let y = 0; y < World.size; y++) {
      if (World.get(x, y) === 1) {
        ctx.fillStyle = "#3a7";
        ctx.fillRect(x * 10, y * 10, 10, 10);
      }
    }
  }

  // jugador
  ctx.fillStyle = "red";
  ctx.fillRect(Player.x * 10, Player.y * 10, 10, 10);
}
