/**
 * GomokuParticleEngine - Confetti & Particle Effects for Gomoku
 * 
 * Adapted from Connect4 ParticleEngine for Gomoku victory celebrations.
 * High-performance particle system optimized for intersection-based games.
 * 
 * Features:
 * - Victory confetti from winning stone positions
 * - Object pooling for memory efficiency
 * - Realistic physics with gravity and air resistance
 * - Multiple particle shapes and colors (black/white theme)
 * - Performance monitoring and automatic quality adjustment
 * - Mobile-optimized with reduced particle counts
 * - Accessibility support with reduced-motion preferences
 */

export class GomokuParticleEngine {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Configuration
        this.config = {
            maxParticles: options.maxParticles || (this.isMobile() ? 30 : 150),
            gravity: options.gravity || 0.25,
            airResistance: options.airResistance || 0.995,
            bounceDecay: options.bounceDecay || 0.6,
            particleLifespan: options.particleLifespan || 3500, // ms
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
        
        // Gomoku-specific colors
        this.colors = {
            black: ['#2c2c2c', '#1a1a1a', '#404040', '#595959'],
            white: ['#ffffff', '#f5f5f5', '#e8e8e8', '#d3d3d3'],
            gold: ['#ffd700', '#ffed4e', '#fbbf24', '#f59e0b'],
            celebration: ['#10b981', '#06d6a0', '#3b82f6', '#8b5cf6']
        };
        
        // Initialize canvas
        this.setupCanvas();
        
        console.log('🎊 GomokuParticleEngine initialized');
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
        
        // Store logical dimensions for physics calculations
        this.width = rect.width;
        this.height = rect.height;
        
        // Set actual canvas dimensions
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        // Scale context for crisp rendering
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    /**
     * Create victory confetti explosion from winning line
     * @param {Array} winningPositions - Array of {row, col} winning stone positions
     * @param {number} winner - Winner player (1=black, 2=white)
     */
    createVictoryExplosion(winningPositions, winner = 1) {
        if (this.reducedMotion) {
            console.log('🎊 Reduced motion: Skipping confetti animation');
            return;
        }
        
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) {
            console.warn('⚠️ Game board not found for particle emission');
            return;
        }
        
        const boardRect = gameBoard.getBoundingClientRect();
        const particleCount = Math.floor(this.config.maxParticles * this.performance.qualityLevel);
        
        // Choose colors based on winner
        const primaryColors = winner === 1 ? this.colors.black : this.colors.white;
        const accentColors = this.colors.celebration;
        
        console.log(`🎊 Creating victory explosion with ${particleCount} particles for player ${winner}`);
        
        // Create particles from each winning stone position
        winningPositions.forEach((position, index) => {
            const intersection = gameBoard.querySelector(`[data-row="${position.row}"][data-col="${position.col}"]`);
            if (!intersection) return;
            
            const intersectionRect = intersection.getBoundingClientRect();
            const centerX = intersectionRect.left + intersectionRect.width / 2;
            const centerY = intersectionRect.top + intersectionRect.height / 2;
            
            // Stagger particle creation for visual effect
            setTimeout(() => {
                this.createParticleBurst(centerX, centerY, {
                    count: Math.floor(particleCount / winningPositions.length),
                    colors: [...primaryColors, ...accentColors],
                    intensity: 1.5,
                    spread: 120
                });
            }, index * 150); // Stagger by 150ms
        });
        
        // Start animation loop
        this.startAnimation();
    }
    
    /**
     * Create a burst of particles from specific position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Burst configuration
     */
    createParticleBurst(x, y, options = {}) {
        const config = {
            count: options.count || 20,
            colors: options.colors || this.colors.celebration,
            intensity: options.intensity || 1.0,
            spread: options.spread || 90,
            size: options.size || { min: 3, max: 8 },
            ...options
        };
        
        for (let i = 0; i < config.count; i++) {
            const particle = this.getParticle();
            
            // Position
            particle.x = x + (Math.random() - 0.5) * 20;
            particle.y = y + (Math.random() - 0.5) * 20;
            
            // Velocity - spread in all directions
            const angle = (Math.random() * config.spread - config.spread / 2) * Math.PI / 180;
            const speed = (3 + Math.random() * 4) * config.intensity;
            particle.vx = Math.cos(angle) * speed * (Math.random() + 0.5);
            particle.vy = Math.sin(angle) * speed * (Math.random() + 0.5) - 2; // Upward bias
            
            // Visual properties
            particle.size = config.size.min + Math.random() * (config.size.max - config.size.min);
            particle.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.3;
            particle.alpha = 1.0;
            particle.shape = Math.random() < 0.7 ? 'circle' : 'square'; // 70% circles, 30% squares
            
            // Lifecycle
            particle.life = this.config.particleLifespan;
            particle.maxLife = this.config.particleLifespan;
            particle.active = true;
            
            this.activeParticles.push(particle);
        }
    }
    
    /**
     * Get particle from pool or create new one
     * @private
     */
    getParticle() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        
        return {
            x: 0, y: 0,
            vx: 0, vy: 0,
            size: 5,
            color: '#ffffff',
            rotation: 0,
            rotationSpeed: 0,
            alpha: 1,
            shape: 'circle',
            life: 0,
            maxLife: 0,
            active: false
        };
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
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.performance.lastFrameTime = performance.now();
        this.animate();
    }
    
    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Main animation loop
     * @private
     */
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.performance.lastFrameTime;
        this.performance.lastFrameTime = currentTime;
        
        // Update performance monitoring
        this.updatePerformance(deltaTime);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Update and render particles
        this.updateParticles(deltaTime);
        this.renderParticles();
        
        // Continue animation if particles remain
        if (this.activeParticles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.stopAnimation();
        }
    }
    
    /**
     * Update particle physics
     * @private
     */
    updateParticles(deltaTime) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            // Update lifetime
            particle.life -= deltaTime;
            if (particle.life <= 0) {
                this.returnParticle(particle);
                this.activeParticles.splice(i, 1);
                continue;
            }
            
            // Physics update
            particle.vy += this.config.gravity; // Gravity
            particle.vx *= this.config.airResistance; // Air resistance
            particle.vy *= this.config.airResistance;
            
            // Position update
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Rotation update
            particle.rotation += particle.rotationSpeed;
            
            // Alpha fade based on lifetime
            particle.alpha = particle.life / particle.maxLife;
            
            // Bounce off bottom
            if (particle.y > this.height && particle.vy > 0) {
                particle.y = this.height;
                particle.vy *= -this.config.bounceDecay;
                particle.vx *= this.config.bounceDecay;
            }
            
            // Remove particles that fall off screen
            if (particle.x < -50 || particle.x > this.width + 50 || particle.y > this.height + 100) {
                this.returnParticle(particle);
                this.activeParticles.splice(i, 1);
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
            this.ctx.save();
            
            // Set alpha
            this.ctx.globalAlpha = particle.alpha;
            
            // Move to particle position
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            // Set color
            this.ctx.fillStyle = particle.color;
            
            // Render based on shape
            if (particle.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (particle.shape === 'square') {
                const halfSize = particle.size;
                this.ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Update performance monitoring
     * @private
     */
    updatePerformance(deltaTime) {
        this.performance.frameCount++;
        this.performance.fps = 1000 / deltaTime;
        
        // Auto-adjust quality based on performance
        if (this.performance.frameCount % 60 === 0) { // Check every 60 frames
            if (this.performance.fps < 30 && this.performance.qualityLevel > 0.3) {
                this.performance.qualityLevel *= 0.8;
                console.log(`🎊 Performance: Reducing quality to ${(this.performance.qualityLevel * 100).toFixed(0)}%`);
            } else if (this.performance.fps > 55 && this.performance.qualityLevel < 1.0) {
                this.performance.qualityLevel = Math.min(1.0, this.performance.qualityLevel * 1.1);
            }
        }
    }
    
    /**
     * Check if device is mobile
     * @private
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Clear all particles immediately
     */
    clear() {
        // Return all active particles to pool
        for (const particle of this.activeParticles) {
            this.returnParticle(particle);
        }
        this.activeParticles = [];
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Stop animation
        this.stopAnimation();
        
        console.log('🎊 Particle system cleared');
    }
    
    /**
     * Get performance stats
     */
    getPerformanceStats() {
        return {
            fps: Math.round(this.performance.fps),
            activeParticles: this.activeParticles.length,
            pooledParticles: this.particlePool.length,
            qualityLevel: Math.round(this.performance.qualityLevel * 100),
            isAnimating: this.isAnimating
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAnimation();
        this.clear();
        
        window.removeEventListener('resize', this.resizeCanvas);
        
        // Clear references
        this.activeParticles = [];
        this.particlePool = [];
        this.canvas = null;
        this.ctx = null;
        
        console.log('🎊 GomokuParticleEngine destroyed');
    }
}

export default GomokuParticleEngine;