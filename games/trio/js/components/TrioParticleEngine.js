/**
 * TrioParticleEngine - Canvas-based Particle Effects for Trio
 * 
 * Adapted from Connect4/Gomoku ParticleEngine for Trio puzzle celebrations.
 * Creates premium confetti effects when trio solutions are found.
 * 
 * Features:
 * - Canvas-based particle system with hardware acceleration
 * - Trio-specific celebration effects (green/gold theme)
 * - Object pooling for memory efficiency
 * - Physics-based particle movement
 * - Auto-cleanup and resource management
 * - Reduced motion support for accessibility
 */

export class TrioParticleEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Canvas configuration
        this.setupCanvas();
        
        // Particle system configuration
        this.particles = [];
        this.particlePool = [];
        this.maxParticles = 150;
        this.isAnimating = false;
        this.animationFrame = null;
        
        // Trio-specific colors (green/gold theme for success)
        this.trioColors = [
            '#10B981', // emerald-500
            '#059669', // emerald-600  
            '#047857', // emerald-700
            '#F59E0B', // amber-500
            '#D97706', // amber-600
            '#92400E', // amber-700
            '#34D399', // emerald-400
            '#FCD34D', // amber-300
        ];
        
        // Physics configuration
        this.gravity = 0.3;
        this.friction = 0.99;
        this.bounce = 0.7;
        
        // Reduced motion support
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Initialize particle pool
        this.initializeParticlePool();
        
        console.log('🎊 TrioParticleEngine initialized');
    }

    /**
     * Setup canvas for particles
     * @private
     */
    setupCanvas() {
        // Position canvas over game area
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
        
        // Set canvas size to match viewport
        this.resizeCanvas();
        
        // Listen for window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Resize canvas to match viewport
     * @private
     */
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    /**
     * Initialize object pool for particles
     * @private
     */
    initializeParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlePool.push(this.createParticle(0, 0, 0, 0, '#10B981'));
        }
    }

    /**
     * Create a particle object
     * @private
     */
    createParticle(x, y, vx, vy, color) {
        return {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            color: color,
            size: Math.random() * 6 + 3,
            life: 1.0,
            decay: Math.random() * 0.02 + 0.01,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            shape: Math.random() > 0.5 ? 'circle' : 'square',
            active: true
        };
    }

    /**
     * Get particle from pool or create new one
     * @private
     */
    getParticle(x, y, vx, vy, color) {
        let particle = this.particlePool.pop();
        
        if (!particle) {
            particle = this.createParticle(x, y, vx, vy, color);
        } else {
            // Reset particle properties
            particle.x = x;
            particle.y = y;
            particle.vx = vx;
            particle.vy = vy;
            particle.color = color;
            particle.size = Math.random() * 6 + 3;
            particle.life = 1.0;
            particle.decay = Math.random() * 0.02 + 0.01;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
            particle.shape = Math.random() > 0.5 ? 'circle' : 'square';
            particle.active = true;
        }
        
        return particle;
    }

    /**
     * Return particle to pool
     * @private
     */
    returnParticle(particle) {
        particle.active = false;
        this.particlePool.push(particle);
    }

    /**
     * Create trio victory explosion from solved trio positions
     */
    createTrioVictoryExplosion(positions, calculation) {
        if (this.reducedMotion) {
            console.log('🎊 Skipping particle effects (reduced motion)');
            return;
        }

        console.log(`🎊 Creating trio victory explosion: ${calculation}`);
        
        // Get screen positions for trio cells
        const explosionPoints = positions.map(pos => {
            const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cell) {
                const rect = cell.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
            return null;
        }).filter(point => point !== null);

        // Create explosion from each trio cell
        explosionPoints.forEach((point, index) => {
            const delay = index * 150; // Stagger explosions
            
            setTimeout(() => {
                this.createExplosionAt(point.x, point.y, 40); // 40 particles per cell
            }, delay);
        });

        // Create additional celebration burst from center
        if (explosionPoints.length > 0) {
            const centerX = explosionPoints.reduce((sum, p) => sum + p.x, 0) / explosionPoints.length;
            const centerY = explosionPoints.reduce((sum, p) => sum + p.y, 0) / explosionPoints.length;
            
            setTimeout(() => {
                this.createExplosionAt(centerX, centerY, 80); // Big center burst
            }, 500);
        }

        // Start animation loop
        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    /**
     * Create explosion at specific point
     * @private
     */
    createExplosionAt(x, y, particleCount) {
        for (let i = 0; i < particleCount; i++) {
            // Random angle and velocity
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const velocity = Math.random() * 8 + 4;
            
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity - Math.random() * 3; // Slight upward bias
            
            // Random color from trio palette
            const color = this.trioColors[Math.floor(Math.random() * this.trioColors.length)];
            
            // Create and add particle
            const particle = this.getParticle(x, y, vx, vy, color);
            this.particles.push(particle);
        }
    }

    /**
     * Start particle animation loop
     * @private
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
        
        console.log('🎊 Particle animation started');
    }

    /**
     * Stop particle animation
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.isAnimating = false;
        
        console.log('🎊 Particle animation stopped');
    }

    /**
     * Animation loop
     * @private
     */
    animate() {
        if (!this.isAnimating) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and render particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (!particle.active || particle.life <= 0) {
                // Remove dead particle and return to pool
                this.particles.splice(i, 1);
                this.returnParticle(particle);
                continue;
            }

            // Update physics
            particle.vx *= this.friction;
            particle.vy += this.gravity;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width / (window.devicePixelRatio || 1)) {
                particle.vx *= -this.bounce;
                particle.x = Math.max(0, Math.min(particle.x, this.canvas.width / (window.devicePixelRatio || 1)));
            }
            
            if (particle.y > this.canvas.height / (window.devicePixelRatio || 1)) {
                particle.vy *= -this.bounce;
                particle.y = this.canvas.height / (window.devicePixelRatio || 1);
            }

            // Update life and rotation
            particle.life -= particle.decay;
            particle.rotation += particle.rotationSpeed;

            // Render particle
            this.renderParticle(particle);
        }

        // Continue animation if particles remain
        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.stopAnimation();
        }
    }

    /**
     * Render individual particle
     * @private
     */
    renderParticle(particle) {
        const { ctx } = this;
        
        ctx.save();
        
        // Move to particle position
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        // Set particle appearance
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        
        const size = particle.size * particle.life;
        
        // Draw particle based on shape
        if (particle.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Square/rectangle
            ctx.fillRect(-size / 2, -size / 2, size, size);
        }
        
        ctx.restore();
    }

    /**
     * Clear all particles
     */
    clear() {
        // Return all active particles to pool
        this.particles.forEach(particle => this.returnParticle(particle));
        this.particles = [];
        
        // Stop animation
        this.stopAnimation();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        console.log('🧹 All particles cleared');
    }

    /**
     * Get current particle count
     */
    getParticleCount() {
        return this.particles.length;
    }

    /**
     * Check if animation is running
     */
    isRunning() {
        return this.isAnimating;
    }

    /**
     * Update particle colors
     */
    setTrioColors(colors) {
        this.trioColors = colors;
        console.log('🎨 Trio colors updated');
    }

    /**
     * Enable/disable reduced motion
     */
    setReducedMotion(enabled) {
        this.reducedMotion = enabled;
        
        if (enabled) {
            this.clear();
        }
        
        console.log(`🎊 Reduced motion ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Cleanup and destroy particle engine
     */
    destroy() {
        // Stop animation
        this.stopAnimation();
        
        // Clear all particles
        this.clear();
        
        // Remove resize listener
        window.removeEventListener('resize', () => this.resizeCanvas());
        
        // Clear canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // Clear references
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.particlePool = [];
        
        console.log('🎊 TrioParticleEngine destroyed');
    }
}

export default TrioParticleEngine;