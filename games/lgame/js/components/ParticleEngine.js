export class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationFrameId = null;
  }

  start() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    cancelAnimationFrame(this.animationFrameId);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach((particle, index) => {
      particle.update();
      particle.draw(this.ctx);
      if (particle.isDead()) {
        this.particles.splice(index, 1);
      }
    });
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  addParticle(x, y, options = {}) {
    this.particles.push(new Particle(x, y, options));
  }
}

class Particle {
  constructor(x, y, { color = '#fff', size = 5, speed = 2, angle = -Math.PI / 2, gravity = 0.1, life = 100 }) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.vx = speed * Math.cos(angle);
    this.vy = speed * Math.sin(angle);
    this.gravity = gravity;
    this.life = life;
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  isDead() {
    return this.life <= 0;
  }
}
