/**
 * GomokuAnimationManager - Gomoku Animation & Visual Effects
 * 
 * Adapted from Connect4 AnimationManager for Gomoku gameplay.
 * Handles all visual animations and celebratory effects.
 * 
 * Features:
 * - Stone placement animations
 * - Winning line animations
 * - Confetti and celebration effects
 * - Smooth transitions and visual feedback
 */

export class GomokuAnimationManager {
    constructor(boardRenderer) {
        this.boardRenderer = boardRenderer;
        
        // Animation configuration
        this.animationDuration = 300;
        this.particleCount = 150;
        this.confettiDuration = 4000;
        
        // Active animations for cleanup
        this.activeAnimations = new Set();
        this.activeTimeouts = new Set();
        
        // Particle engine state
        this.particleEngine = null;
        this.isAnimating = false;
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
     * Show winning animation
     */
    showWinningAnimation(winner) {
        console.log(`🏆 Showing winning animation for player ${winner}`);
        
        // Get winning line if available
        if (this.game && this.game.getWinningLine) {
            const winningLine = this.game.getWinningLine();
            if (winningLine && winningLine.length > 0) {
                this.highlightWinningLine(winningLine);
            }
        }
        
        // Start confetti celebration
        this.startConfettiCelebration(winner);
        
        // Show victory message animation
        this.showVictoryMessage(winner);
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
}