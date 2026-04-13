const World = {
  size: 50,
  grid: [],

  init() {
    for (let x = 0; x < this.size; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.size; y++) {
        this.grid[x][y] = y > 30 ? 1 : 0; // suelo básico
      }
    }
  },

  get(x, y) {
    return this.grid[x]?.[y] ?? 0;
  }
};

World.init();
