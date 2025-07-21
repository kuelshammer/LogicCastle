/**
 * GomokuAnimationManager - Gomoku Animation & Visual Effects
 * 
 * Adapted from Connect4 AnimationManager for Gomoku gameplay.
 * Implements Connect4 Goldstandard 3-Phase Victory Sequence:
 * Phase 1 (1000ms): Winning line highlight with stagger
 * Phase 2 (3000ms): Confetti explosion from winning stones
 * Phase 3 (Auto-Reset): Board clearing + new game trigger
 * 
 * Features:
 * - Stone placement animations
 * - 3-Phase victory sequence with premium effects
 * - Particle engine integration
 * - Sound manager integration
 * - Smooth transitions and visual feedback
 */

export class GomokuAnimationManager {
    constructor(boardRenderer) {
        this.boardRenderer = boardRenderer;
        
        // Animation configuration
        this.animationDuration = 300;
        this.particleCount = 150;
        this.confettiDuration = 3000;
        
        // Victory sequence timing (Connect4 Pattern)
        this.victoryTiming = {
            phase1Duration: 1000,  // Highlight phase
            phase2Duration: 3000,  // Confetti phase
            phase3Delay: 2000      // Auto-reset delay
        };
        
        // Active animations for cleanup
        this.activeAnimations = new Set();
        this.activeTimeouts = new Set();
        
        // Premium effects engines
        this.particleEngine = null;
        this.soundManager = null;
        this.isAnimating = false;
        
        // Victory sequence state
        this.victorySequenceActive = false;
        this.currentPhase = null;
        
        // Initialize premium effects
        this.initializePremiumEffects();
    }

    /**
     * Initialize premium effects systems
     * @private
     */
    async initializePremiumEffects() {
        try {
            // Initialize particle engine
            await this.initializeParticleEngine();
            
            // Initialize sound manager
            await this.initializeSoundManager();
            
            console.log('✨ GomokuAnimationManager premium effects initialized');
        } catch (error) {
            console.warn('⚠️ Premium effects initialization failed:', error.message);
        }
    }

    /**
     * Initialize particle engine for confetti effects
     * @private
     */
    async initializeParticleEngine() {
        try {
            const { GomokuParticleEngine } = await import('./GomokuParticleEngine.js');
            
            // Create canvas for particles
            let canvas = document.getElementById('gomokuParticleCanvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'gomokuParticleCanvas';
                document.body.appendChild(canvas);
            }
            
            this.particleEngine = new GomokuParticleEngine(canvas);
            console.log('🎊 GomokuParticleEngine initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize particle engine:', error.message);
        }
    }

    /**
     * Initialize sound manager for audio effects
     * @private
     */
    async initializeSoundManager() {
        try {
            const { GomokuSoundManager } = await import('./GomokuSoundManager.js');
            
            this.soundManager = new GomokuSoundManager();
            console.log('🔊 GomokuSoundManager initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize sound manager:', error.message);
        }
    }

    /**
     * Animate stone placement at position
     */
    animateStonePlace(row, col, player) {
        const intersection = this.boardRenderer.getIntersectionAt(row, col);
        if (!intersection) return;

        const stone = intersection.querySelector('.stone');
        if (!stone) return;

        // Add placement animation class
        stone.classList.add('placing');
        
        // Remove animation class after completion
        const timeout = setTimeout(() => {
            stone.classList.remove('placing');
            this.activeTimeouts.delete(timeout);
        }, this.animationDuration);
        
        this.activeTimeouts.add(timeout);
        
        // Add ripple effect for special moves (center or key positions)
        if (this._isSpecialPosition(row, col)) {
            stone.classList.add('placing-special');
            
            const specialTimeout = setTimeout(() => {
                stone.classList.remove('placing-special');
                this.activeTimeouts.delete(specialTimeout);
            }, this.animationDuration + 200);
            
            this.activeTimeouts.add(specialTimeout);
        }

        console.log(`🎬 Animated stone placement at (${row}, ${col}) for player ${player}`);
    }

    /**
     * Start 3-Phase Victory Sequence (Connect4 Goldstandard Pattern)
     * Phase 1: Winning line highlight with stagger animation
     * Phase 2: Confetti explosion from winning stones  
     * Phase 3: Auto-reset after delay
     */
    start3PhaseVictorySequence(winner, winningLine, gameInstance) {
        if (this.victorySequenceActive) {
            console.log('🏆 Victory sequence already active, skipping');
            return;
        }
        
        this.victorySequenceActive = true;
        this.gameInstance = gameInstance;
        
        console.log(`🏆 Starting 3-Phase Victory Sequence for player ${winner}`);
        
        // Play victory sound
        if (this.soundManager) {
            this.soundManager.playVictory();
        }
        
        // PHASE 1: Winning line highlight (1000ms)
        this.startPhase1(winningLine);
        
        // PHASE 2: Confetti explosion (3000ms) - starts after Phase 1
        const phase2Timeout = setTimeout(() => {
            this.startPhase2(winner, winningLine);
            this.activeTimeouts.delete(phase2Timeout);
        }, this.victoryTiming.phase1Duration);
        this.activeTimeouts.add(phase2Timeout);
        
        // PHASE 3: Auto-reset - starts after Phase 2
        const phase3Timeout = setTimeout(() => {
            this.startPhase3();
            this.activeTimeouts.delete(phase3Timeout);
        }, this.victoryTiming.phase1Duration + this.victoryTiming.phase2Duration + this.victoryTiming.phase3Delay);
        this.activeTimeouts.add(phase3Timeout);
    }
    
    /**
     * PHASE 1: Winning line highlight with stagger animation
     * @private
     */
    startPhase1(winningLine) {
        this.currentPhase = 'phase1';
        console.log('🏆 PHASE 1: Highlighting winning line');
        
        if (!winningLine || winningLine.length === 0) {
            console.warn('⚠️ No winning line provided for Phase 1');
            return;
        }
        
        // Highlight each stone in the winning line with stagger
        winningLine.forEach((position, index) => {
            const staggerDelay = index * 150; // 150ms stagger between stones
            
            const staggerTimeout = setTimeout(() => {
                const intersection = this.boardRenderer.getIntersectionAt(position.row, position.col);
                if (intersection) {
                    intersection.classList.add('winning-stone');
                    console.log(`🏆 Highlighted winning stone ${index + 1}/${winningLine.length} at (${position.row}, ${position.col})`);
                }
                this.activeTimeouts.delete(staggerTimeout);
            }, staggerDelay);
            
            this.activeTimeouts.add(staggerTimeout);
        });
    }
    
    /**
     * PHASE 2: Confetti explosion from winning stones
     * @private
     */
    startPhase2(winner, winningLine) {
        this.currentPhase = 'phase2';
        console.log('🏆 PHASE 2: Confetti explosion');
        
        if (this.particleEngine && winningLine && winningLine.length > 0) {
            this.particleEngine.createVictoryExplosion(winningLine, winner);
        } else {
            console.warn('⚠️ ParticleEngine not available or no winning line for confetti');
        }
    }
    
    /**
     * PHASE 3: Auto-reset board and start new game
     * @private
     */
    startPhase3() {
        this.currentPhase = 'phase3';
        console.log('🏆 PHASE 3: Auto-reset');
        
        // Clear all effects
        this.clearAllEffects();
        
        // Trigger new game through game instance
        if (this.gameInstance && typeof this.gameInstance.newGame === 'function') {
            this.gameInstance.newGame();
            console.log('🏆 Auto-reset: New game started');
        } else {
            console.warn('⚠️ Game instance not available for auto-reset');
        }
        
        // Reset victory sequence state
        this.victorySequenceActive = false;
        this.currentPhase = null;
        this.gameInstance = null;
    }
    
    /**
     * Legacy method for backward compatibility
     */
    showWinningAnimation(winner, winningLine, gameInstance) {
        // Forward to new 3-phase system
        this.start3PhaseVictorySequence(winner, winningLine, gameInstance);
    }

    /**
     * Highlight winning line with animation
     */
    highlightWinningLine(positions) {
        if (!Array.isArray(positions)) return;

        console.log(`🎯 Highlighting winning line with ${positions.length} positions`);

        // Animate each position in sequence
        positions.forEach((position, index) => {
            const timeout = setTimeout(() => {
                let row, col;
                
                if (Array.isArray(position)) {
                    [row, col] = position;
                } else {
                    row = position.row;
                    col = position.col;
                }
                
                const intersection = this.boardRenderer.getIntersectionAt(row, col);
                if (intersection) {
                    intersection.classList.add('winning-stone');
                    this.boardRenderer.highlightWinningLine(positions);
                }
                
                this.activeTimeouts.delete(timeout);
            }, index * 100); // Stagger animation
            
            this.activeTimeouts.add(timeout);
        });
    }

    /**
     * Start confetti celebration
     */
    startConfettiCelebration(winner) {
        // Create confetti colors based on winner
        const colors = winner === 1 
            ? ['#2C3E50', '#34495E', '#5D6D7E', '#85929E'] // Black/gray theme
            : ['#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA']; // White/light theme
        
        this.isAnimating = true;
        
        // Get board center for confetti origin
        const boardRect = this.boardRenderer.gameBoard.getBoundingClientRect();
        const centerX = boardRect.left + boardRect.width / 2;
        const centerY = boardRect.top + boardRect.height / 2;
        
        // Create confetti burst
        this.createConfettiBurst(centerX, centerY, colors);
        
        // Stop confetti after duration
        const stopTimeout = setTimeout(() => {
            this.stopConfettiCelebration();
            this.activeTimeouts.delete(stopTimeout);
        }, this.confettiDuration);
        
        this.activeTimeouts.add(stopTimeout);
        
        console.log(`🎊 Started confetti celebration for player ${winner}`);
    }

    /**
     * Create confetti burst at position
     */
    createConfettiBurst(centerX, centerY, colors) {
        for (let i = 0; i < this.particleCount; i++) {
            const timeout = setTimeout(() => {
                this.createConfettiParticle(centerX, centerY, colors);
                this.activeTimeouts.delete(timeout);
            }, Math.random() * 1000);
            
            this.activeTimeouts.add(timeout);
        }
    }

    /**
     * Create single confetti particle
     */
    createConfettiParticle(centerX, centerY, colors) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        
        // Random color from theme
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Random size and shape
        const size = Math.random() * 8 + 4;
        
        Object.assign(particle.style, {
            position: 'fixed',
            width: `${size}px`,
            height: `${size}px`,
            background: color,
            left: `${centerX + (Math.random() - 0.5) * 100}px`,
            top: `${centerY + (Math.random() - 0.5) * 50}px`,
            zIndex: '1000',
            pointerEvents: 'none',
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animation: 'confetti-fall 3s linear forwards'
        });
        
        document.body.appendChild(particle);
        
        // Remove particle after animation
        const removeTimeout = setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
            this.activeTimeouts.delete(removeTimeout);
        }, 3000);
        
        this.activeTimeouts.add(removeTimeout);
    }

    /**
     * Stop confetti celebration
     */
    stopConfettiCelebration() {
        this.isAnimating = false;
        
        // Remove all remaining confetti particles
        const particles = document.querySelectorAll('.confetti-particle');
        particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        
        console.log('🛑 Stopped confetti celebration');
    }

    /**
     * Show victory message animation
     */
    showVictoryMessage(winner) {
        const playerName = winner === 1 ? 'Schwarz' : 'Weiß';
        
        // Create victory overlay
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        overlay.innerHTML = `
            <div class="victory-content">
                <h2>🏆 ${playerName} gewinnt!</h2>
                <p>Herzlichen Glückwunsch!</p>
            </div>
        `;
        
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '999',
            animation: 'game-over-overlay 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        });
        
        // Style victory content
        const content = overlay.querySelector('.victory-content');
        Object.assign(content.style, {
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            color: '#333',
            boxShadow: '0 16px 64px rgba(0, 0, 0, 0.3)'
        });
        
        document.body.appendChild(overlay);
        
        // Remove overlay after 3 seconds
        const removeTimeout = setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.activeTimeouts.delete(removeTimeout);
        }, 3000);
        
        this.activeTimeouts.add(removeTimeout);
        
        console.log(`🏆 Showed victory message for ${playerName}`);
    }

    /**
     * Animate threat warning
     */
    animateThreatWarning(positions) {
        if (!Array.isArray(positions)) return;

        positions.forEach(position => {
            let row, col;
            
            if (Array.isArray(position)) {
                [row, col] = position;
            } else {
                row = position.row;
                col = position.col;
            }
            
            const intersection = this.boardRenderer.getIntersectionAt(row, col);
            if (intersection) {
                intersection.classList.add('threat-highlight');
                
                // Remove highlight after animation
                const timeout = setTimeout(() => {
                    intersection.classList.remove('threat-highlight');
                    this.activeTimeouts.delete(timeout);
                }, 2000);
                
                this.activeTimeouts.add(timeout);
            }
        });
        
        console.log(`⚠️ Animated threat warning for ${positions.length} positions`);
    }

    /**
     * Animate board entrance
     */
    animateBoardEntrance() {
        if (!this.boardRenderer.gameBoard) return;
        
        this.boardRenderer.gameBoard.classList.add('board-entrance');
        
        const timeout = setTimeout(() => {
            this.boardRenderer.gameBoard.classList.remove('board-entrance');
            this.activeTimeouts.delete(timeout);
        }, 800);
        
        this.activeTimeouts.add(timeout);
        
        console.log('🎬 Animated board entrance');
    }

    /**
     * Clear all effects and animations
     */
    clearAllEffects() {
        // Stop confetti
        this.stopConfettiCelebration();
        
        // Clear all timeouts
        this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
        this.activeTimeouts.clear();
        
        // Remove all animation classes
        if (this.boardRenderer.gameBoard) {
            const animatedElements = this.boardRenderer.gameBoard.querySelectorAll('.placing, .placing-special, .winning-stone, .threat-highlight, .assistance-highlight');
            animatedElements.forEach(element => {
                element.classList.remove('placing', 'placing-special', 'winning-stone', 'threat-highlight', 'assistance-highlight');
            });
        }
        
        // Remove victory overlays
        const overlays = document.querySelectorAll('.victory-overlay');
        overlays.forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        console.log('🧹 Cleared all animation effects');
    }

    /**
     * Check if position is special (center or strategic)
     * @private
     */
    _isSpecialPosition(row, col) {
        // Center position
        if (row === 7 && col === 7) return true;
        
        // Star points
        const starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
        return starPoints.some(([starRow, starCol]) => starRow === row && starCol === col);
    }

    /**
     * Set animation duration
     */
    setAnimationDuration(duration) {
        this.animationDuration = Math.max(100, Math.min(1000, duration));
        console.log(`🎬 Animation duration set to ${this.animationDuration}ms`);
    }

    /**
     * Enable/disable animations
     */
    setAnimationsEnabled(enabled) {
        this.animationsEnabled = enabled;
        
        if (!enabled) {
            this.clearAllEffects();
        }
        
        console.log(`🎬 Animations ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get animation status
     */
    isAnimationActive() {
        return this.isAnimating || this.activeTimeouts.size > 0;
    }

    /**
     * Clear all effects (animations, particles, sounds, highlights)
     */
    clearAllEffects() {
        // Clear all timeouts
        this.activeTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        this.activeTimeouts.clear();
        
        // Clear particle effects
        if (this.particleEngine) {
            this.particleEngine.clear();
        }
        
        // Clear all winning stone highlights
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            const winningStones = gameBoard.querySelectorAll('.winning-stone');
            winningStones.forEach(stone => {
                stone.classList.remove('winning-stone');
            });
            
            // Clear threat highlights
            const threatHighlights = gameBoard.querySelectorAll('.threat-highlight');
            threatHighlights.forEach(highlight => {
                highlight.classList.remove('threat-highlight');
            });
        }
        
        // Clear victory overlays
        const victoryOverlays = document.querySelectorAll('.victory-overlay');
        victoryOverlays.forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        // Reset animation state
        this.isAnimating = false;
        this.victorySequenceActive = false;
        this.currentPhase = null;
        
        console.log('🧹 All effects cleared');
    }
    
    /**
     * Get current victory sequence status
     */
    getVictorySequenceStatus() {
        return {
            active: this.victorySequenceActive,
            phase: this.currentPhase,
            hasParticleEngine: !!this.particleEngine,
            hasSoundManager: !!this.soundManager
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.clearAllEffects();
        
        if (this.particleEngine) {
            this.particleEngine.destroy();
        }
        
        if (this.soundManager) {
            this.soundManager.destroy();
        }
        
        // Clear references
        this.boardRenderer = null;
        this.particleEngine = null;
        this.soundManager = null;
        this.gameInstance = null;
        
        console.log('🎬 GomokuAnimationManager destroyed');
    }
}