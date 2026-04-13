const Input = {
  keys: {},

  init() {
    window.addEventListener("keydown", e => this.keys[e.key] = true);
    window.addEventListener("keyup", e => this.keys[e.key] = false);
  },

  isDown(key) {
    return this.keys[key];
  }
};

Input.init();
