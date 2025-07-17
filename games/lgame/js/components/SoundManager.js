export class SoundManager {
  constructor() {
    this.sounds = {};
  }

  loadSound(name, src) {
    this.sounds[name] = new Audio(src);
  }

  playSound(name) {
    if (this.sounds[name]) {
      this.sounds[name].play();
    }
  }
}
