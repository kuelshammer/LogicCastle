export class KeyboardController {
  constructor(keymap) {
    this.keymap = keymap;
    this.listeners = {};
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    const action = this.keymap[e.key];
    if (action && this.listeners[action]) {
      e.preventDefault();
      this.listeners[action]();
    }
  }

  register(key, action, callback) {
    this.keymap[key] = action;
    this.listeners[action] = callback;
  }

  destroy() {
    document.removeEventListener('keydown', (e) => this.handleKeyDown(e));
  }
}
