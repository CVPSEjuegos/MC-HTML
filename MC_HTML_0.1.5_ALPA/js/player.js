const Player = {
  x: 10,
  y: 10,
  speed: 0.2,

  update() {
    if (Input.isDown("w")) this.y -= this.speed;
    if (Input.isDown("s")) this.y += this.speed;
    if (Input.isDown("a")) this.x -= this.speed;
    if (Input.isDown("d")) this.x += this.speed;
  }
};
