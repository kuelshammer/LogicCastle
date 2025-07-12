/**
 * LGameAnimationManager - L-Game Advanced Animation Controller
 * 
 * Adapted from Connect4 AnimationManager for L-Game specific needs.
 * Handles all premium L-Game animations including:
 * - L-piece placement and rotation animations
 * - Neutral piece placement
 * - Victory celebrations
 * - Micro-interactions and feedback
 * 
 * Responsibilities:
 * - L-piece smooth placement and removal animations
 * - Rotation preview and transitions
 * - Neutral piece interactions
 * - Performance optimization for 4x4 grid
 * - Accessibility support
 */

export class LGameAnimationManager {
    constructor(gameBoard, boardRenderer) {
        this.gameBoard = gameBoard;
        this.boardRenderer = boardRenderer;
        
        // Animation state
        this.animationQueue = [];
        this.isAnimating = false;
        this.previewElements = [];
        this.celebrationActive = false;
        
        // Performance settings
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.animationSpeed = this.reducedMotion ? 0.5 : 1.0;
        
        // Premium effects engines
        this.particleEngine = null;
        this.soundManager = null;
        
        // Initialize premium effects
        this.initializePremiumEffects();
        
        // Animation timing configuration for L-Game
        this.timing = {
            lPiecePlacement: 300,
            lPieceRotation: 200,
            neutralPiece: 150,
            victoryReveal: 600,
            victoryStagger: 100,
            confettiDuration: 2500,
            microInteraction: 150
        };
        
        console.log('🎬 L-Game AnimationManager initialized with', this.reducedMotion ? 'reduced motion' : 'full animations');
        console.log('🎊 Premium effects and sound integration ready for L-Game');
    }
    
    /**
     * Initialize premium effects systems
     * @private
     */
    async initializePremiumEffects() {
        try {
            // Initialize particle engine for L-Game
            await this.initializeParticleEngine();
            
            // Initialize sound manager
            await this.initializeSoundManager();
            
            console.log('✨ L-Game premium effects systems initialized');
        } catch (error) {
            console.warn('⚠️ L-Game premium effects initialization failed:', error.message);
        }
    }
    
    /**
     * Initialize particle engine for L-Game confetti effects
     * @private
     */
    async initializeParticleEngine() {
        try {
            const { ParticleEngine } = await import('./ParticleEngine.js');
            
            // Create or use existing canvas for L-Game
            let canvas = document.getElementById('lgameParticleCanvas');
            if (!canvas) {
                console.log('🎊 Creating L-Game particle canvas...');
                canvas = document.createElement('canvas');
                canvas.id = 'lgame-particles';
                canvas.style.position = 'fixed';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.pointerEvents = 'none';
                canvas.style.zIndex = '9999';
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                document.body.appendChild(canvas);
            }
            
            // Initialize particle engine for L-Game
            this.particleEngine = new ParticleEngine(canvas, {
                maxParticles: this.reducedMotion ? 15 : 100 // Fewer particles for 4x4 game
            });
            
            console.log('🎊 L-Game ParticleEngine initialized successfully');
        } catch (error) {
            console.error('❌ L-Game ParticleEngine initialization failed:', error);
            this.particleEngine = null;
        }
    }
    
    /**
     * Initialize sound manager for L-Game
     * @private
     */
    async initializeSoundManager() {
        try {
            const { soundManager } = await import('./SoundManager.js');
            this.soundManager = soundManager;
            console.log('🔊 L-Game SoundManager initialized');
        } catch (error) {
            console.warn('⚠️ L-Game SoundManager initialization failed:', error.message);
            this.soundManager = null;
        }
    }

    /**
     * Animate L-piece placement with smooth transitions
     * @param {Array} positions - Array of [row, col] positions for L-piece
     * @param {number} player - Player number (1 or 2)
     * @param {number} orientation - L-piece orientation (0-7)
     */
    async animateLPiecePlacement(positions, player, orientation) {
        return new Promise((resolve) => {
            console.log(`🎬 Animating L-piece placement: Player ${player}, positions:`, positions);
            
            // Play placement sound
            if (this.soundManager) {
                this.soundManager.playLPiecePlace();
            }
            
            // Clear any existing pieces for this player
            this.clearPlayerLPiece(player);
            
            let animationsCompleted = 0;
            const totalAnimations = positions.length;
            
            // Animate each segment of the L-piece with stagger
            positions.forEach((pos, index) => {
                const [row, col] = pos;
                const cell = this.boardRenderer.getCellAt(row, col);
                
                if (cell) {
                    setTimeout(() => {
                        // Create L-piece segment
                        const piece = document.createElement('div');
                        piece.className = `l-piece player-${player} ${index === 0 ? 'anchor' : 'segment'} orientation-${orientation}`;
                        piece.dataset.player = player;
                        piece.dataset.segmentIndex = index;
                        
                        // Set initial state for animation
                        piece.style.cssText = `
                            position: absolute;
                            top: 10%;
                            left: 10%;
                            right: 10%;
                            bottom: 10%;
                            background: ${player === 1 ? 'linear-gradient(145deg, #3b82f6, #1d4ed8)' : 'linear-gradient(145deg, #ef4444, #dc2626)'};
                            border: 2px solid ${player === 1 ? '#1e40af' : '#b91c1c'};
                            border-radius: 6px;
                            transform: scale(0) rotate(${orientation * 45}deg);
                            opacity: 0;
                            transition: all ${this.timing.lPiecePlacement * this.animationSpeed}ms cubic-bezier(0.34, 1.56, 0.64, 1);
                            z-index: 10;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        `;
                        
                        // Add special styling for anchor piece
                        if (index === 0) {
                            piece.style.borderWidth = '3px';
                            piece.style.boxShadow = `0 2px 12px ${player === 1 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`;
                        }
                        
                        cell.appendChild(piece);
                        
                        // Trigger animation
                        requestAnimationFrame(() => {
                            piece.style.transform = 'scale(1) rotate(0deg)';
                            piece.style.opacity = '1';
                        });
                        
                        // Handle animation completion
                        const handleTransitionEnd = () => {
                            piece.removeEventListener('transitionend', handleTransitionEnd);
                            animationsCompleted++;
                            
                            if (animationsCompleted >= totalAnimations) {
                                resolve();
                            }
                        };
                        
                        piece.addEventListener('transitionend', handleTransitionEnd);
                        
                        // Fallback timeout
                        setTimeout(() => {
                            piece.removeEventListener('transitionend', handleTransitionEnd);
                            animationsCompleted++;
                            if (animationsCompleted >= totalAnimations) {
                                resolve();
                            }
                        }, this.timing.lPiecePlacement * this.animationSpeed + 100);
                        
                    }, index * 50); // Stagger each segment by 50ms
                }
            });
            
            // Fallback if no cells found
            if (totalAnimations === 0) {
                resolve();
            }
        });
    }
    
    /**
     * Animate L-piece removal with smooth fade-out
     * @param {number} player - Player number (1 or 2)
     */
    async animateLPieceRemoval(player) {
        return new Promise((resolve) => {
            const pieces = this.gameBoard.querySelectorAll(`.l-piece[data-player="${player}"]`);
            
            if (pieces.length === 0) {
                resolve();
                return;
            }
            
            console.log(`🎬 Animating L-piece removal: Player ${player}`);
            
            let animationsCompleted = 0;
            const totalAnimations = pieces.length;
            
            pieces.forEach((piece, index) => {
                setTimeout(() => {
                    piece.style.transition = `all ${this.timing.lPiecePlacement * this.animationSpeed}ms ease-out`;
                    piece.style.transform = 'scale(0.8) rotate(45deg)';
                    piece.style.opacity = '0';
                    
                    const handleTransitionEnd = () => {
                        piece.removeEventListener('transitionend', handleTransitionEnd);
                        if (piece.parentNode) {
                            piece.parentNode.removeChild(piece);
                        }
                        animationsCompleted++;
                        
                        if (animationsCompleted >= totalAnimations) {
                            resolve();
                        }
                    };
                    
                    piece.addEventListener('transitionend', handleTransitionEnd);
                    
                    // Fallback timeout
                    setTimeout(() => {
                        piece.removeEventListener('transitionend', handleTransitionEnd);
                        if (piece.parentNode) {
                            piece.parentNode.removeChild(piece);
                        }
                        animationsCompleted++;
                        if (animationsCompleted >= totalAnimations) {
                            resolve();
                        }
                    }, this.timing.lPiecePlacement * this.animationSpeed + 100);
                    
                }, index * 30); // Stagger removal
            });
        });
    }
    
    /**
     * Animate neutral piece placement
     * @param {number} row - Row position (0-3)
     * @param {number} col - Column position (0-3)
     */
    async animateNeutralPiecePlacement(row, col) {
        return new Promise((resolve) => {
            const cell = this.boardRenderer.getCellAt(row, col);
            if (!cell) {
                resolve();
                return;
            }
            
            console.log(`🎬 Animating neutral piece placement: ${row}, ${col}`);
            
            // Play placement sound
            if (this.soundManager) {
                this.soundManager.playNeutralPiecePlace();
            }
            
            // Create neutral piece
            const piece = document.createElement('div');
            piece.className = 'neutral-piece';
            piece.style.cssText = `
                position: absolute;
                top: 25%;
                left: 25%;
                right: 25%;
                bottom: 25%;
                background: radial-gradient(circle at 30% 30%, #ffffff, #e5e7eb);
                border: 2px solid #9ca3af;
                border-radius: 50%;
                transform: scale(0);
                opacity: 0;
                transition: all ${this.timing.neutralPiece * this.animationSpeed}ms cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 8;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            `;
            
            cell.appendChild(piece);
            
            // Trigger animation
            requestAnimationFrame(() => {
                piece.style.transform = 'scale(1)';
                piece.style.opacity = '1';
            });
            
            // Handle animation completion
            const handleTransitionEnd = () => {
                piece.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            };
            
            piece.addEventListener('transitionend', handleTransitionEnd);
            
            // Fallback timeout
            setTimeout(() => {
                piece.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            }, this.timing.neutralPiece * this.animationSpeed + 100);
        });
    }
    
    /**
     * Animate L-piece rotation preview
     * @param {Array} positions - Array of [row, col] positions for L-piece
     * @param {number} player - Player number (1 or 2)
     * @param {number} newOrientation - New orientation (0-7)
     */
    showLPieceRotationPreview(positions, player, newOrientation) {
        this.clearLPiecePreview();
        
        positions.forEach((pos, index) => {
            const [row, col] = pos;
            const cell = this.boardRenderer.getCellAt(row, col);
            
            if (cell) {
                const preview = document.createElement('div');
                preview.className = `l-piece-preview player-${player} ${index === 0 ? 'anchor' : 'segment'}`;
                preview.style.cssText = `
                    position: absolute;
                    top: 15%;
                    left: 15%;
                    right: 15%;
                    bottom: 15%;
                    background: ${player === 1 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)'};
                    border: 2px dashed ${player === 1 ? '#3b82f6' : '#ef4444'};
                    border-radius: 4px;
                    transform: rotate(${newOrientation * 45}deg);
                    z-index: 12;
                    pointer-events: none;
                    animation: pulse-preview 1s infinite alternate;
                `;
                
                cell.appendChild(preview);
                this.previewElements.push(preview);
            }
        });
        
        console.log(`👻 L-piece rotation preview: Player ${player}, orientation ${newOrientation}`);
    }
    
    /**
     * Clear L-piece preview elements
     */
    clearLPiecePreview() {
        this.previewElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.previewElements = [];
    }
    
    /**
     * Clear all L-pieces for a specific player
     * @private
     */
    clearPlayerLPiece(player) {
        const pieces = this.gameBoard.querySelectorAll(`.l-piece[data-player="${player}"]`);
        pieces.forEach(piece => {
            if (piece.parentNode) {
                piece.parentNode.removeChild(piece);
            }
        });
    }
    
    /**
     * Animate victory sequence for L-Game
     * @param {number} winningPlayer - Winning player (1 or 2)
     * @param {Array} blockingPositions - Positions that caused the win
     */
    async animateVictory(winningPlayer, blockingPositions = []) {
        if (this.reducedMotion) {
            // Simple highlight for reduced motion
            const winnerPieces = this.gameBoard.querySelectorAll(`.l-piece[data-player="${winningPlayer}"]`);
            winnerPieces.forEach(piece => {
                piece.classList.add('victory-glow');
            });
            return;
        }
        
        console.log(`🏆 Animating L-Game victory for player ${winningPlayer}`);
        
        // Highlight winning player's L-piece
        const winnerPieces = this.gameBoard.querySelectorAll(`.l-piece[data-player="${winningPlayer}"]`);
        for (let i = 0; i < winnerPieces.length; i++) {
            setTimeout(() => {
                winnerPieces[i].classList.add('victory-piece');
                
                setTimeout(() => {
                    winnerPieces[i].classList.add('victory-glow');
                }, this.timing.victoryReveal);
            }, i * this.timing.victoryStagger);
        }
        
        // Highlight blocking positions if any
        blockingPositions.forEach((pos, index) => {
            const [row, col] = pos;
            const cell = this.boardRenderer.getCellAt(row, col);
            if (cell) {
                setTimeout(() => {
                    cell.classList.add('blocking-highlight');
                }, (winnerPieces.length * this.timing.victoryStagger) + (index * 50));
            }
        });
        
        // Trigger celebration after highlights
        setTimeout(() => {
            this.triggerLGameCelebration(winningPlayer);
        }, this.timing.victoryReveal + (winnerPieces.length * this.timing.victoryStagger));
    }
    
    /**
     * Trigger L-Game specific celebration effects
     * @param {number} winningPlayer - Winning player (1 or 2)
     */
    triggerLGameCelebration(winningPlayer) {
        if (this.reducedMotion || this.celebrationActive) return;
        
        this.celebrationActive = true;
        console.log(`🎉 Triggering L-Game celebration for player ${winningPlayer}`);
        
        try {
            // Play victory sound
            if (this.soundManager) {
                this.soundManager.playVictory();
            }
            
            // Trigger confetti particles
            if (this.particleEngine) {
                const gameBoard = this.gameBoard;
                const rect = gameBoard.getBoundingClientRect();
                
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Player-specific colors for L-Game
                const confettiColors = winningPlayer === 1 ? 
                    ['#3b82f6', '#1d4ed8', '#60a5fa', '#1e40af', '#93c5fd'] :
                    ['#ef4444', '#dc2626', '#f87171', '#b91c1c', '#fca5a5'];
                    
                // Create celebration burst
                this.particleEngine.createCelebrationBurst({
                    x: centerX,
                    y: centerY,
                    pattern: 'explosion',
                    particleCount: 50, // Moderate for 4x4 game
                    colors: confettiColors
                });
                
            } else {
                // Fallback: Simple DOM celebration for L-Game
                const celebrationDiv = document.createElement('div');
                celebrationDiv.innerHTML = winningPlayer === 1 ? '🔵🎉✨' : '🔴🎉✨';
                celebrationDiv.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 2.5rem;
                    z-index: 9999;
                    animation: l-game-celebration 2s ease-out forwards;
                    pointer-events: none;
                `;
                
                // Add keyframes for L-Game celebration
                if (!document.getElementById('l-game-celebration-keyframes')) {
                    const style = document.createElement('style');
                    style.id = 'l-game-celebration-keyframes';
                    style.textContent = `
                        @keyframes l-game-celebration {
                            0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5) rotate(0deg); }
                            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
                            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5) rotate(360deg); }
                        }
                        @keyframes pulse-preview {
                            0% { opacity: 0.6; }
                            100% { opacity: 1.0; }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                this.gameBoard.style.position = 'relative';
                this.gameBoard.appendChild(celebrationDiv);
                
                setTimeout(() => {
                    if (celebrationDiv.parentNode) {
                        celebrationDiv.parentNode.removeChild(celebrationDiv);
                    }
                }, 2000);
            }
            
        } catch (error) {
            console.warn('⚠️ L-Game celebration error:', error.message);
        } finally {
            // Reset celebration state
            setTimeout(() => {
                this.celebrationActive = false;
            }, this.timing.confettiDuration);
        }
    }
    
    /**
     * Animate cell hover feedback for L-Game
     * @param {number} row - Row position (0-3)
     * @param {number} col - Column position (0-3)
     */
    animateCellHover(row, col) {
        if (this.reducedMotion) return;
        
        const cell = this.boardRenderer.getCellAt(row, col);
        if (!cell) return;
        
        // Create hover ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'cell-hover-ripple';
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.3);
            transform: translate(-50%, -50%) scale(0);
            animation: cell-ripple-expand 0.5s ease-out;
            pointer-events: none;
            z-index: 5;
        `;
        
        cell.style.position = 'relative';
        cell.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 500);
    }
    
    /**
     * Queue animation for smooth sequencing
     * @param {Function} animationFunction - Animation function to execute
     */
    queueAnimation(animationFunction) {
        this.animationQueue.push(animationFunction);
        this.processAnimationQueue();
    }
    
    /**
     * Process animation queue
     * @private
     */
    async processAnimationQueue() {
        if (this.isAnimating || this.animationQueue.length === 0) {
            return;
        }
        
        this.isAnimating = true;
        
        while (this.animationQueue.length > 0) {
            const animation = this.animationQueue.shift();
            try {
                await animation();
            } catch (error) {
                console.error('❌ L-Game animation error:', error);
            }
        }
        
        this.isAnimating = false;
    }
    
    /**
     * Clear all visual effects (for new game)
     */
    clearAllEffects() {
        console.log('🧹 Clearing all L-Game visual effects for new game...');
        
        // Clear celebration state
        this.celebrationActive = false;
        
        // Clear particle effects
        if (this.particleEngine) {
            this.particleEngine.clearCanvas();
        }
        
        // Clear any pending animations
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Clear previews
        this.clearLPiecePreview();
        
        // Remove all game pieces
        const allPieces = this.gameBoard.querySelectorAll('.l-piece, .neutral-piece');
        allPieces.forEach(piece => {
            if (piece.parentNode) {
                piece.parentNode.removeChild(piece);
            }
        });
        
        // Clear all highlights
        const highlightedCells = this.gameBoard.querySelectorAll('.victory-glow, .blocking-highlight');
        highlightedCells.forEach(cell => {
            cell.classList.remove('victory-glow', 'blocking-highlight');
        });
        
        console.log('✅ All L-Game visual effects cleared');
    }
    
    /**
     * Get current animation state
     */
    getAnimationState() {
        return {
            isAnimating: this.isAnimating,
            queueLength: this.animationQueue.length,
            celebrationActive: this.celebrationActive,
            previewElementsCount: this.previewElements.length,
            reducedMotion: this.reducedMotion
        };
    }
    
    /**
     * Cleanup all animations and remove event listeners
     */
    destroy() {
        // Clear animation queue
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Clear previews
        this.clearLPiecePreview();
        
        // Clear all effects
        this.clearAllEffects();
        
        // Cleanup premium effects
        if (this.particleEngine) {
            this.particleEngine.destroy();
            this.particleEngine = null;
        }
        
        if (this.soundManager) {
            this.soundManager.destroy();
            this.soundManager = null;
        }
        
        this.celebrationActive = false;
        
        console.log('🎬 L-Game AnimationManager destroyed with premium effects cleanup');
    }
}

// Add dynamic CSS for L-Game animations
const style = document.createElement('style');
style.textContent = `
@keyframes cell-ripple-expand {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.8;
    }
    100% {
        transform: translate(-50%, -50%) scale(3);
        opacity: 0;
    }
}

.l-piece.victory-piece {
    animation: victory-pulse 0.8s infinite alternate;
}

.l-piece.victory-glow {
    box-shadow: 0 0 20px currentColor, 0 0 40px currentColor !important;
    transform: scale(1.1) !important;
}

.blocking-highlight {
    background: rgba(255, 255, 0, 0.3) !important;
    animation: blocking-flash 1s infinite alternate;
}

@keyframes victory-pulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
}

@keyframes blocking-flash {
    0% { background: rgba(255, 255, 0, 0.3) !important; }
    100% { background: rgba(255, 255, 0, 0.6) !important; }
}
`;
document.head.appendChild(style);