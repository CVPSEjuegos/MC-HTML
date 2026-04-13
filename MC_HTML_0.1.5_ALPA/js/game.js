function loop() {
  Player.update();
  render();
  requestAnimationFrame(loop);
}

loop();
