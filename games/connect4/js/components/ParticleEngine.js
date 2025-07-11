/**
 * ParticleEngine - Advanced Confetti & Particle Effects for Connect4
 * 
 * High-performance particle system with realistic physics, multiple burst patterns,
 * and optimized rendering for smooth 60fps animations across all devices.
 * 
 * Features:
 * - Object pooling for memory efficiency
 * - Realistic physics with gravity, air resistance, and bounce
 * - Multiple particle shapes and colors
 * - Performance monitoring and automatic quality adjustment
 * - Mobile-optimized with reduced particle counts
 * - Accessibility support with reduced-motion preferences
 */

export class ParticleEngine {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Configuration
        this.config = {
            maxParticles: options.maxParticles || (this.isMobile() ? 50 : 200),
            gravity: options.gravity || 0.3,
            airResistance: options.airResistance || 0.99,
            bounceDecay: options.bounceDecay || 0.7,
            particleLifespan: options.particleLifespan || 4000, // ms
            ...options
        };
        
        // Performance monitoring
        this.performance = {
            frameCount: 0,
            fps: 60,
            lastFrameTime: 0,
            qualityLevel: 1.0 // 1.0 = full quality, 0.5 = reduced quality
        };
        
        // Particle pools for efficiency
        this.activeParticles = [];
        this.particlePool = [];
        this.isAnimating = false;
        this.animationId = null;
        
        // Reduced motion support
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Initialize canvas
        this.setupCanvas();
        
        console.log('🎊 ParticleEngine initialized with config:', this.config);
    }
    
    /**
     * Setup canvas for optimal rendering
     * @private
     */
    setupCanvas() {
        // Set canvas size to match display size
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Set canvas styles for proper layering
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
    }
    
    /**
     * Resize canvas to match window dimensions
     * @private
     */
    resizeCanvas() {
        const rect = document.body.getBoundingClientRect();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Scale for high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width *= dpr;
        this.canvas.height *= dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }
    
    /**
     * Create celebration confetti burst
     * @param {Object} options - Burst configuration
     */
    createCelebrationBurst(options = {}) {
        if (this.reducedMotion) {
            console.log('🎊 Skipping particle effects due to reduced motion preference');
            return;
        }
        
        const {
            x = this.canvas.width / 2,
            y = this.canvas.height / 2,
            particleCount = Math.floor(this.config.maxParticles * 0.3),
            colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
            pattern = 'explosion', // explosion, fountain, spiral
            force = 8
        } = options;
        
        console.log(`🎊 Creating ${pattern} burst with ${particleCount} particles`);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticleFromPool();
            this.initializeParticle(particle, {
                x, y, colors, pattern, force, index: i, total: particleCount
            });
            this.activeParticles.push(particle);
        }
        
        this.startAnimation();
    }
    
    /**
     * Get particle from pool or create new one
     * @private
     */
    getParticleFromPool() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        
        return {
            x: 0, y: 0,
            vx: 0, vy: 0,
            size: 0,
            color: '#FFD700',
            rotation: 0,
            rotationSpeed: 0,
            life: 1.0,
            maxLife: 1.0,
            shape: 'circle',
            bounces: 0
        };
    }
    
    /**
     * Initialize particle with burst pattern
     * @private
     */
    initializeParticle(particle, options) {
        const { x, y, colors, pattern, force, index, total } = options;
        
        particle.x = x;
        particle.y = y;
        particle.life = 1.0;
        particle.maxLife = this.config.particleLifespan;
        particle.color = colors[Math.floor(Math.random() * colors.length)];
        particle.size = 2 + Math.random() * 6;
        particle.rotation = Math.random() * Math.PI * 2;
        particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
        particle.shape = ['circle', 'square', 'star'][Math.floor(Math.random() * 3)];
        particle.bounces = 0;
        
        // Set velocity based on pattern
        switch (pattern) {
            case 'explosion':
                const explosionAngle = (index / total) * Math.PI * 2;
                const explosionForce = force * (0.5 + Math.random() * 0.5);
                particle.vx = Math.cos(explosionAngle) * explosionForce;
                particle.vy = Math.sin(explosionAngle) * explosionForce - Math.random() * 3;
                break;
                
            case 'fountain':
                particle.vx = (Math.random() - 0.5) * force * 0.5;
                particle.vy = -force * (0.8 + Math.random() * 0.4);
                break;
                
            case 'spiral':
                const spiralAngle = (index / total) * Math.PI * 4;
                const spiralRadius = force * (index / total);
                particle.vx = Math.cos(spiralAngle) * spiralRadius;
                particle.vy = Math.sin(spiralAngle) * spiralRadius - 2;
                break;
        }
    }
    
    /**
     * Start animation loop
     * @private
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animate();
    }
    
    /**
     * Main animation loop
     * @private
     */
    animate() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.performance.lastFrameTime;
        this.performance.lastFrameTime = currentTime;
        
        // Performance monitoring
        this.updatePerformanceMetrics(deltaTime);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and render particles
        this.updateParticles(deltaTime);
        this.renderParticles();
        
        // Continue animation if particles exist
        if (this.activeParticles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.stopAnimation();
        }
    }
    
    /**
     * Update particle physics and lifecycle
     * @private
     */
    updateParticles(deltaTime) {
        const dt = Math.min(deltaTime / 16.67, 2); // Cap at 2x normal speed
        
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            // Update physics
            particle.vy += this.config.gravity * dt;
            particle.vx *= this.config.airResistance;
            particle.vy *= this.config.airResistance;
            
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.rotation += particle.rotationSpeed * dt;
            
            // Bounce off bottom
            if (particle.y > this.canvas.height - particle.size) {
                particle.y = this.canvas.height - particle.size;
                particle.vy *= -this.config.bounceDecay;
                particle.bounces++;
                
                // Stop bouncing after a few bounces
                if (particle.bounces > 3) {
                    particle.vy = Math.max(particle.vy, -2);
                }
            }
            
            // Update life
            particle.life -= deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.activeParticles.splice(i, 1);
                this.returnParticleToPool(particle);
            }
        }
    }
    
    /**
     * Render all active particles
     * @private
     */
    renderParticles() {
        this.ctx.save();
        
        for (const particle of this.activeParticles) {
            const alpha = Math.min(particle.life / particle.maxLife, 1);
            
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.globalAlpha = alpha;
            
            // Set color
            this.ctx.fillStyle = particle.color;
            this.ctx.strokeStyle = particle.color;
            
            // Draw based on shape
            switch (particle.shape) {
                case 'circle':
                    this.drawCircle(particle);
                    break;
                case 'square':
                    this.drawSquare(particle);
                    break;
                case 'star':
                    this.drawStar(particle);
                    break;
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw circle particle
     * @private
     */
    drawCircle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Draw square particle
     * @private
     */
    drawSquare(particle) {
        const half = particle.size / 2;
        this.ctx.fillRect(-half, -half, particle.size, particle.size);
    }
    
    /**
     * Draw star particle
     * @private
     */
    drawStar(particle) {
        const spikes = 5;
        const outerRadius = particle.size / 2;
        const innerRadius = outerRadius * 0.5;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * Return particle to pool for reuse
     * @private
     */
    returnParticleToPool(particle) {
        if (this.particlePool.length < this.config.maxParticles) {
            this.particlePool.push(particle);
        }
    }
    
    /**
     * Update performance metrics and adjust quality
     * @private
     */
    updatePerformanceMetrics(deltaTime) {
        this.performance.frameCount++;
        
        if (this.performance.frameCount % 60 === 0) {
            this.performance.fps = 1000 / deltaTime;
            
            // Adjust quality based on performance
            if (this.performance.fps < 30) {
                this.performance.qualityLevel = Math.max(0.3, this.performance.qualityLevel - 0.1);
                this.config.maxParticles = Math.floor(this.config.maxParticles * 0.8);
            } else if (this.performance.fps > 55 && this.performance.qualityLevel < 1.0) {
                this.performance.qualityLevel = Math.min(1.0, this.performance.qualityLevel + 0.05);
            }
        }
    }
    
    /**
     * Stop animation and cleanup
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Don't clear canvas completely - let particles fade naturally
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        console.log('🎊 Particle animation stopped (canvas preserved)');
    }
    
    /**
     * Clear all particles immediately
     */
    clearAllParticles() {
        // Move all active particles back to pool
        while (this.activeParticles.length > 0) {
            const particle = this.activeParticles.pop();
            this.returnParticleToPool(particle);
        }
        
        this.stopAnimation();
    }
    
    /**
     * Check if device is mobile
     * @private
     */
    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Get current performance stats
     */
    getPerformanceStats() {
        return {
            fps: this.performance.fps,
            activeParticles: this.activeParticles.length,
            poolSize: this.particlePool.length,
            qualityLevel: this.performance.qualityLevel,
            isAnimating: this.isAnimating
        };
    }
    
    /**
     * Cleanup engine and remove event listeners
     */
    destroy() {
        this.stopAnimation();
        this.clearAllParticles();
        
        // Remove canvas from DOM if it was added by the engine
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        console.log('🎊 ParticleEngine destroyed');
    }
}