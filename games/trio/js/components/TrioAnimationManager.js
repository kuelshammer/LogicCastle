/**
 * TrioAnimationManager - Trio Animation & Visual Effects
 * 
 * Adapted from Connect4/Gomoku AnimationManager for Trio puzzle game.
 * Implements Connect4 Goldstandard 3-Phase Victory Sequence:
 * Phase 1 (1000ms): Solution highlight with stagger
 * Phase 2 (3000ms): Confetti explosion from solved trio
 * Phase 3 (Auto-New-Board): Board clearing + new puzzle generation
 * 
 * Features:
 * - Solution animations for valid trios
 * - 3-Phase victory sequence with premium effects
 * - Particle engine integration for celebrations
 * - Sound manager integration for audio feedback
 * - Smooth transitions and visual feedback
 */

export class TrioAnimationManager {
    constructor(boardRenderer) {
        this.boardRenderer = boardRenderer;
        
        // Animation configuration
        this.animationDuration = 400;
        this.particleCount = 120;
        this.confettiDuration = 2500;
        
        // Victory sequence timing (Connect4 Pattern adapted for Trio)
        this.victoryTiming = {
            phase1Duration: 1000,  // Solution highlight phase
            phase2Duration: 2500,  // Confetti phase  
            phase3Delay: 1500      // Auto-new-board delay
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
            
            console.log('✨ TrioAnimationManager premium effects initialized');
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
            const { TrioParticleEngine } = await import('./TrioParticleEngine.js');
            
            // Create canvas for particles
            let canvas = document.getElementById('trioParticleCanvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'trioParticleCanvas';
                document.body.appendChild(canvas);
            }
            
            this.particleEngine = new TrioParticleEngine(canvas);
            console.log('🎊 TrioParticleEngine initialized');
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
            const { TrioSoundManager } = await import('./TrioSoundManager.js');
            
            this.soundManager = new TrioSoundManager();
            console.log('🔊 TrioSoundManager initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize sound manager:', error.message);
        }
    }

    /**
     * Animate valid trio solution
     */
    animateTrioSolution(positions, calculation) {
        if (!positions || positions.length !== 3) return;

        // Animate each position in the trio
        positions.forEach((pos, index) => {
            const cell = this.boardRenderer.getCellAt(pos.row, pos.col);
            if (!cell) return;

            // Add solution animation class with stagger
            const staggerDelay = index * 150; // 150ms between each cell
            
            const timeout = setTimeout(() => {
                cell.classList.add('trio-solution');
                
                // Play solution sound for first cell
                if (index === 0 && this.soundManager) {
                    this.soundManager.playTrioSolution();
                }
                
                this.activeTimeouts.delete(timeout);
            }, staggerDelay);
            
            this.activeTimeouts.add(timeout);
        });

        console.log(`🎬 Animated trio solution: ${calculation}`);
    }

    /**
     * Start 3-Phase Victory Sequence (Connect4 Goldstandard Pattern)
     * Phase 1: Solution highlight with stagger animation
     * Phase 2: Confetti explosion from trio cells
     * Phase 3: Auto-new-board after delay
     */
    start3PhaseVictorySequence(positions, calculation, gameInstance) {
        if (this.victorySequenceActive) {
            console.log('🏆 Victory sequence already active, skipping');
            return;
        }
        
        this.victorySequenceActive = true;
        this.gameInstance = gameInstance;
        
        console.log(`🏆 Starting 3-Phase Victory Sequence for trio: ${calculation}`);
        
        // Play victory sound
        if (this.soundManager) {
            this.soundManager.playVictory();
        }
        
        // PHASE 1: Solution highlight (1000ms)
        this.startPhase1(positions, calculation);
        
        // PHASE 2: Confetti explosion (2500ms) - starts after Phase 1
        const phase2Timeout = setTimeout(() => {
            this.startPhase2(positions, calculation);
            this.activeTimeouts.delete(phase2Timeout);
        }, this.victoryTiming.phase1Duration);
        this.activeTimeouts.add(phase2Timeout);
        
        // PHASE 3: Auto-new-board - starts after Phase 2
        const phase3Timeout = setTimeout(() => {
            this.startPhase3();
            this.activeTimeouts.delete(phase3Timeout);
        }, this.victoryTiming.phase1Duration + this.victoryTiming.phase2Duration + this.victoryTiming.phase3Delay);
        this.activeTimeouts.add(phase3Timeout);
    }
    
    /**
     * PHASE 1: Solution highlight with stagger animation
     * @private
     */
    startPhase1(positions, calculation) {
        this.currentPhase = 'phase1';
        console.log('🏆 PHASE 1: Highlighting trio solution');
        
        if (!positions || positions.length !== 3) {
            console.warn('⚠️ Invalid positions for Phase 1');
            return;
        }
        
        // Highlight each cell in the trio with stagger
        positions.forEach((position, index) => {
            const staggerDelay = index * 200; // 200ms stagger between cells
            
            const staggerTimeout = setTimeout(() => {
                const cell = this.boardRenderer.getCellAt(position.row, position.col);
                if (cell) {
                    cell.classList.add('trio-victory-highlight');
                    console.log(`🏆 Highlighted trio cell ${index + 1}/3 at (${position.row}, ${position.col})`);
                }
                this.activeTimeouts.delete(staggerTimeout);
            }, staggerDelay);
            
            this.activeTimeouts.add(staggerTimeout);
        });
    }
    
    /**
     * PHASE 2: Confetti explosion from trio cells
     * @private
     */
    startPhase2(positions, calculation) {
        this.currentPhase = 'phase2';
        console.log('🏆 PHASE 2: Confetti explosion');
        
        if (this.particleEngine && positions && positions.length === 3) {
            this.particleEngine.createTrioVictoryExplosion(positions, calculation);
        } else {
            console.warn('⚠️ ParticleEngine not available or invalid positions for confetti');
        }
    }
    
    /**
     * PHASE 3: Auto-new-board and start new puzzle
     * @private
     */
    startPhase3() {
        this.currentPhase = 'phase3';
        console.log('🏆 PHASE 3: Auto-new-board');
        
        // Clear all effects
        this.clearAllEffects();
        
        // Trigger new board generation through game instance
        if (this.gameInstance && typeof this.gameInstance.generateNewBoard === 'function') {
            this.gameInstance.generateNewBoard();
            console.log('🏆 Auto-reset: New puzzle generated');
        } else {
            console.warn('⚠️ Game instance not available for auto-reset');
        }
        
        // Reset victory sequence state
        this.victorySequenceActive = false;
        this.currentPhase = null;
        this.gameInstance = null;
    }

    /**
     * Animate cell selection
     */
    animateCellSelection(row, col, selected) {
        const cell = this.boardRenderer.getCellAt(row, col);
        if (!cell) return;

        if (selected) {
            cell.classList.add('trio-selected');
            
            // Add selection ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'trio-selection-ripple';
            cell.appendChild(ripple);
            
            // Remove ripple after animation
            const rippleTimeout = setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
                this.activeTimeouts.delete(rippleTimeout);
            }, 600);
            
            this.activeTimeouts.add(rippleTimeout);
        } else {
            cell.classList.remove('trio-selected');
        }

        console.log(`🎬 Animated cell selection at (${row}, ${col}): ${selected}`);
    }

    /**
     * Animate invalid trio attempt
     */
    animateInvalidTrio(positions) {
        if (!positions || positions.length !== 3) return;

        positions.forEach((pos, index) => {
            const cell = this.boardRenderer.getCellAt(pos.row, pos.col);
            if (!cell) return;

            const shakeDelay = index * 50; // Slight stagger for visual appeal
            
            const timeout = setTimeout(() => {
                cell.classList.add('trio-invalid');
                
                // Remove invalid class after animation
                const invalidTimeout = setTimeout(() => {
                    cell.classList.remove('trio-invalid');
                    this.activeTimeouts.delete(invalidTimeout);
                }, 600);
                
                this.activeTimeouts.add(invalidTimeout);
                this.activeTimeouts.delete(timeout);
            }, shakeDelay);
            
            this.activeTimeouts.add(timeout);
        });

        // Play invalid sound
        if (this.soundManager) {
            this.soundManager.playInvalid();
        }

        console.log(`🎬 Animated invalid trio attempt`);
    }

    /**
     * Clear all effects and animations
     */
    clearAllEffects() {
        // Clear all timeouts
        this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
        this.activeTimeouts.clear();
        
        // Clear particle effects
        if (this.particleEngine) {
            this.particleEngine.clear();
        }
        
        // Remove all animation classes from board
        if (this.boardRenderer.gameBoard) {
            const animatedElements = this.boardRenderer.gameBoard.querySelectorAll(
                '.trio-solution, .trio-selected, .trio-invalid, .trio-victory-highlight'
            );
            animatedElements.forEach(element => {
                element.classList.remove(
                    'trio-solution', 'trio-selected', 'trio-invalid', 'trio-victory-highlight'
                );
            });
        }
        
        // Remove selection ripples
        const ripples = document.querySelectorAll('.trio-selection-ripple');
        ripples.forEach(ripple => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        });
        
        // Reset animation state
        this.isAnimating = false;
        this.victorySequenceActive = false;
        this.currentPhase = null;
        
        console.log('🧹 All trio effects cleared');
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
        
        console.log('🎬 TrioAnimationManager destroyed');
    }
}

export default TrioAnimationManager;