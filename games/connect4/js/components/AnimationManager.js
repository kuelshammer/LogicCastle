/**
 * AnimationManager - Connect4 Advanced Animation Controller
 * 
 * Handles all premium animations including:
 * - Realistic piece drop physics
 * - Victory celebrations
 * - Micro-interactions
 * - Performance optimization
 * 
 * Responsibilities:
 * - Coordinate complex animation sequences
 * - Manage animation timing and queueing
 * - Handle performance-conscious animation scaling
 * - Provide fallbacks for reduced-motion users
 */

export class AnimationManager {
    constructor(gameBoard, boardRenderer) {
        this.gameBoard = gameBoard;
        this.boardRenderer = boardRenderer;
        
        // Animation state
        this.animationQueue = [];
        this.isAnimating = false;
        this.previewColumn = null;
        this.celebrationActive = false;
        
        // Performance settings
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.animationSpeed = this.reducedMotion ? 0.5 : 1.0;
        
        // Premium effects engines
        this.particleEngine = null;
        this.soundManager = null;
        
        // Initialize premium effects
        this.initializePremiumEffects();
        
        // Animation timing configuration
        this.timing = {
            dropBase: 400,
            dropVariation: 50,
            victoryReveal: 800,
            victoryStagger: 150,
            confettiDuration: 3000,
            microInteraction: 200
        };
        
        console.log('🎬 AnimationManager initialized with', this.reducedMotion ? 'reduced motion' : 'full animations');
        console.log('🎊 Premium effects and sound integration ready');
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
            
            console.log('✨ Premium effects systems initialized');
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
            const { ParticleEngine } = await import('./ParticleEngine.js');
            
            // Use existing canvas from HTML or create new one
            let canvas = document.getElementById('particleCanvas');
            if (!canvas) {
                console.log('🎊 Creating dynamic particle canvas...');
                canvas = document.createElement('canvas');
                canvas.id = 'connect4-particles';
                canvas.style.position = 'fixed';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.pointerEvents = 'none';
                canvas.style.zIndex = '9999';
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                document.body.appendChild(canvas);
            } else {
                console.log('🎊 Using existing particle canvas from HTML');
                // Ensure canvas is properly sized and positioned
                const boardWrapper = canvas.parentElement;
                if (boardWrapper) {
                    const rect = boardWrapper.getBoundingClientRect();
                    console.log('🎯 Board wrapper rect:', rect);
                    
                    // Force full-screen canvas for better visibility
                    canvas.width = Math.max(rect.width, window.innerWidth);
                    canvas.height = Math.max(rect.height, window.innerHeight);
                    
                    // Ensure canvas covers the entire board area
                    canvas.style.position = 'fixed';
                    canvas.style.top = '0';
                    canvas.style.left = '0';
                    canvas.style.width = '100vw';
                    canvas.style.height = '100vh';
                    canvas.style.zIndex = '99999';
                    
                    console.log(`🎨 Canvas sized to: ${canvas.width}x${canvas.height}`);
                } else {
                    console.warn('⚠️ Board wrapper not found, using default size');
                    canvas.width = 800;
                    canvas.height = 600;
                }
            }
            
            // Initialize particle engine
            this.particleEngine = new ParticleEngine(canvas, {
                maxParticles: this.reducedMotion ? 20 : 150
            });
            
            console.log('🎊 ParticleEngine initialized successfully');
        } catch (error) {
            console.error('❌ ParticleEngine initialization failed:', error);
            this.particleEngine = null;
        }
    }
    
    /**
     * Initialize sound manager
     * @private
     */
    async initializeSoundManager() {
        try {
            const { soundManager } = await import('./SoundManager.js');
            this.soundManager = soundManager;
            console.log('🔊 SoundManager initialized');
        } catch (error) {
            console.warn('⚠️ SoundManager initialization failed:', error.message);
            this.soundManager = null; // Continue without audio
        }
    }

    /**
     * Animate piece drop with realistic physics
     * @param {number} column - Column index (0-6)
     * @param {number} row - Row index (0-5) 
     * @param {string} playerColor - 'yellow' or 'red'
     * @param {boolean} special - Special move (winning move, blocking move)
     */
    async animatePieceDrop(column, row, playerColor, special = false) {
        return new Promise((resolve) => {
            const cell = this.boardRenderer.getCellAt(row, column);
            if (!cell) {
                console.warn(`⚠️ Cell not found at row ${row}, column ${column}`);
                resolve();
                return;
            }
            
            const piece = cell.querySelector('.game-piece, .disc');
            if (!piece) {
                console.warn(`⚠️ Game piece not found in cell`);
                resolve();
                return;
            }
            
            // Calculate animation duration based on drop height
            const dropHeight = row;
            const baseDuration = this.timing.dropBase * this.animationSpeed;
            const heightVariation = dropHeight * this.timing.dropVariation * this.animationSpeed;
            const totalDuration = baseDuration + heightVariation;
            
            // Remove any existing animation classes
            piece.classList.remove(
                'dropping', 'dropping-special',
                ...Array.from(Array(6), (_, i) => `dropping-row-${i}`)
            );
            
            // Add appropriate animation class
            if (special && !this.reducedMotion) {
                piece.classList.add('dropping-special');
            } else {
                piece.classList.add('dropping', `dropping-row-${row}`);
            }
            
            // Set piece color and visibility
            piece.classList.remove('empty');
            piece.classList.add(playerColor, 'placed');
            
            // Apply color-specific styles
            this.applyPieceStyles(piece, playerColor);
            
            // Handle animation completion
            const handleAnimationEnd = (event) => {
                if (event.target === piece) {
                    piece.removeEventListener('animationend', handleAnimationEnd);
                    piece.classList.remove(
                        'dropping', 'dropping-special',
                        ...Array.from(Array(6), (_, i) => `dropping-row-${i}`)
                    );
                    
                    // Add subtle ripple effect for premium feel
                    if (!this.reducedMotion) {
                        this.createDropRipple(cell);
                    }
                    
                    resolve();
                }
            };
            
            piece.addEventListener('animationend', handleAnimationEnd);
            
            // Fallback timeout in case animation doesn't fire
            setTimeout(() => {
                piece.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            }, totalDuration + 100);
            
            console.log(`🎬 Animating piece drop: column ${column + 1}, row ${row + 1}, ${playerColor}, ${totalDuration}ms`);
        });
    }
    
    /**
     * Apply modern Tailwind-compatible piece styles
     * @private
     */
    applyPieceStyles(piece, playerColor) {
        // Remove existing color classes first
        piece.classList.remove('empty', 'yellow', 'red', 'preview');
        
        if (playerColor === 'yellow') {
            // Add Tailwind classes for yellow player
            piece.classList.add('yellow');
            piece.style.cssText += `
                background: linear-gradient(145deg, #FFD700, #FFA000) !important;
                border: 3px solid #F57F17 !important;
                box-shadow: 0 6px 16px rgba(255, 215, 0, 0.5),
                           inset 0 2px 4px rgba(255, 255, 255, 0.3) !important;
                backdrop-filter: blur(4px) !important;
            `;
        } else if (playerColor === 'red') {
            // Add Tailwind classes for red player
            piece.classList.add('red');
            piece.style.cssText += `
                background: linear-gradient(145deg, #F44336, #D32F2F) !important;
                border: 3px solid #C62828 !important;
                box-shadow: 0 6px 16px rgba(244, 67, 54, 0.5),
                           inset 0 2px 4px rgba(255, 255, 255, 0.3) !important;
                backdrop-filter: blur(4px) !important;
            `;
        }
        
        // Add modern transition for smooth effects
        piece.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    /**
     * Create modern glassmorphism ripple effect on piece impact
     * @private
     */
    createDropRipple(cell) {
        const ripple = document.createElement('div');
        ripple.className = 'drop-ripple absolute top-1/2 left-1/2 w-3 h-3 pointer-events-none z-10';
        ripple.style.cssText = `
            background: radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2));
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: drop-ripple-expand 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        `;
        
        cell.classList.add('relative');
        cell.appendChild(ripple);
        
        // Remove ripple after animation with fade-out
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.style.transition = 'opacity 0.2s ease-out';
                ripple.style.opacity = '0';
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 200);
            }
        }, 400);
    }
    
    /**
     * Show enhanced column preview with ghost piece and ripple effects
     * @param {number} column - Column index (0-6)
     * @param {string} playerColor - 'yellow' or 'red'
     */
    showColumnPreview(column, playerColor) {
        this.clearColumnPreview();
        this.previewColumn = column;
        
        // Find lowest empty slot in column
        const targetRow = this.findLowestEmptyRow(column);
        if (targetRow === -1) return; // Column full
        
        const cell = this.boardRenderer.getCellAt(targetRow, column);
        if (!cell) return;
        
        // Create enhanced ghost piece with improved animations
        let ghostPiece = cell.querySelector('.ghost-piece');
        if (!ghostPiece) {
            ghostPiece = document.createElement('div');
            ghostPiece.className = 'ghost-piece';
            cell.appendChild(ghostPiece);
        }
        
        // Apply modern Tailwind preview styling
        cell.classList.add('show-preview', `preview-${playerColor}`, 'transform', 'transition-all', 'duration-300');
        
        // Add Tailwind hover effects
        cell.style.transform = 'scale(1.05)';
        cell.style.filter = 'brightness(1.1)';
        
        // Set hover data attribute for CSS styling
        this.gameBoard.setAttribute('data-hover-col', column);
        this.gameBoard.classList.add('group');
        
        // Add ripple effect for enhanced feedback
        if (!this.reducedMotion) {
            this.createHoverRipple(cell, playerColor);
        }
        
        // Highlight entire column with staggered animation
        this.animateColumnHighlight(column);
        
        console.log(`👻 Enhanced column preview: column ${column + 1}, ${playerColor}`);
    }
    
    /**
     * Clear column preview with smooth fade-out
     */
    clearColumnPreview() {
        if (this.previewColumn !== null) {
            const targetRow = this.findLowestEmptyRow(this.previewColumn);
            if (targetRow !== -1) {
                const cell = this.boardRenderer.getCellAt(targetRow, this.previewColumn);
                if (cell) {
                    // Modern Tailwind fade-out animation
                    const ghostPiece = cell.querySelector('.ghost-piece');
                    if (ghostPiece && !this.reducedMotion) {
                        ghostPiece.classList.add('transition-all', 'duration-300', 'ease-out');
                        ghostPiece.style.opacity = '0';
                        ghostPiece.style.transform = 'translate(-50%, -50%) scale(0.8)';
                        
                        setTimeout(() => {
                            cell.classList.remove('show-preview', 'preview-yellow', 'preview-red', 'transform', 'transition-all', 'duration-300');
                            cell.style.transform = '';
                            cell.style.filter = '';
                        }, 300);
                    } else {
                        cell.classList.remove('show-preview', 'preview-yellow', 'preview-red', 'transform', 'transition-all', 'duration-300');
                        cell.style.transform = '';
                        cell.style.filter = '';
                    }
                }
            }
            
            // Clear column highlight
            this.clearColumnHighlight(this.previewColumn);
        }
        
        this.gameBoard.removeAttribute('data-hover-col');
        this.gameBoard.classList.remove('group');
        this.previewColumn = null;
    }
    
    /**
     * Find lowest empty row in column
     * @private
     */
    findLowestEmptyRow(column) {
        for (let row = 5; row >= 0; row--) {
            const cell = this.boardRenderer.getCellAt(row, column);
            if (cell) {
                const piece = cell.querySelector('.game-piece, .disc');
                if (piece && (piece.classList.contains('empty') || piece.className === 'disc empty')) {
                    return row;
                }
            }
        }
        return -1; // Column full
    }
    
    /**
     * Animate victory line with progressive highlighting
     * @param {Array} winningPositions - Array of {row, col} winning positions
     * @param {string} playerColor - 'yellow' or 'red'
     */
    async animateVictoryLine(winningPositions, playerColor) {
        if (this.reducedMotion) {
            // Simple highlight for reduced motion
            winningPositions.forEach(({row, col}) => {
                const cell = this.boardRenderer.getCellAt(row, col);
                if (cell) {
                    const piece = cell.querySelector('.game-piece, .disc');
                    if (piece) {
                        piece.classList.add('victory-glow');
                    }
                }
            });
            return;
        }
        
        console.log(`🏆 Animating victory line for ${playerColor}:`, winningPositions);
        
        // Progressive piece highlighting with stagger
        for (let i = 0; i < winningPositions.length; i++) {
            const {row, col} = winningPositions[i];
            const cell = this.boardRenderer.getCellAt(row, col);
            
            if (cell) {
                const piece = cell.querySelector('.game-piece, .disc');
                if (piece) {
                    // Add victory animation class
                    piece.classList.add('victory-piece');
                    
                    // Apply enhanced glow effect
                    setTimeout(() => {
                        piece.classList.add('victory-glow');
                    }, this.timing.victoryReveal + (i * this.timing.victoryStagger));
                }
            }
            
            // Stagger the reveals
            if (i < winningPositions.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.timing.victoryStagger));
            }
        }
        
        // Trigger celebration effects after line is complete
        setTimeout(() => {
            this.triggerCelebration(playerColor);
        }, this.timing.victoryReveal);
    }
    
    /**
     * Trigger celebration effects (confetti, etc.)
     * @param {string} playerColor - 'yellow' or 'red'
     */
    triggerCelebration(playerColor) {
        if (this.reducedMotion || this.celebrationActive) return;
        
        this.celebrationActive = true;
        console.log(`🎉 Triggering celebration for ${playerColor}`);
        
        // Create celebration overlay
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        document.body.appendChild(overlay);
        
        // Generate confetti pieces
        const colors = ['yellow', 'red', 'blue', 'green', 'purple'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                this.createConfettiPiece(overlay, colors);
            }, i * 50);
        }
        
        // Clean up celebration after duration
        setTimeout(() => {
            document.body.removeChild(overlay);
            this.celebrationActive = false;
        }, this.timing.confettiDuration);
    }
    
    /**
     * Create individual confetti piece
     * @private
     */
    createConfettiPiece(overlay, colors) {
        const confetti = document.createElement('div');
        confetti.className = `confetti-piece ${colors[Math.floor(Math.random() * colors.length)]}`;
        
        // Random starting position
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        
        overlay.appendChild(confetti);
        
        // Remove confetti piece after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 4000);
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
                console.error('❌ Animation error:', error);
            }
        }
        
        this.isAnimating = false;
    }
    
    /**
     * Create hover ripple effect for enhanced feedback
     * @private
     */
    createHoverRipple(cell, playerColor) {
        const ripple = document.createElement('div');
        ripple.className = `hover-ripple ${playerColor}-ripple`;
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${playerColor === 'yellow' ? 'rgba(255, 235, 59, 0.4)' : 'rgba(244, 67, 54, 0.4)'};
            transform: translate(-50%, -50%) scale(0);
            animation: hover-ripple-expand 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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
        }, 600);
    }
    
    /**
     * Animate column highlight with staggered effect
     * @private
     */
    animateColumnHighlight(column) {
        if (this.reducedMotion) return;
        
        // Add staggered highlighting from top to bottom
        for (let row = 0; row < 6; row++) {
            setTimeout(() => {
                const cell = this.boardRenderer.getCellAt(row, column);
                if (cell) {
                    const piece = cell.querySelector('.game-piece, .disc');
                    if (piece && piece.classList.contains('empty')) {
                        cell.classList.add('column-highlight-wave');
                        
                        // Remove highlight after animation
                        setTimeout(() => {
                            cell.classList.remove('column-highlight-wave');
                        }, 400);
                    }
                }
            }, row * 50); // 50ms stagger
        }
    }
    
    /**
     * Clear column highlight effects
     * @private
     */
    clearColumnHighlight(column) {
        for (let row = 0; row < 6; row++) {
            const cell = this.boardRenderer.getCellAt(row, column);
            if (cell) {
                cell.classList.remove('column-highlight-wave');
            }
        }
    }
    
    /**
     * Create button ripple effect on click
     * @param {HTMLElement} button - Button element
     * @param {Event} event - Click event for position
     */
    createButtonRipple(button, event) {
        if (this.reducedMotion) return;
        
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 10px;
            height: 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: btn-ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 1;
        `;
        
        button.style.position = 'relative';
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    /**
     * Animate coordinate click feedback
     * @param {HTMLElement} coord - Coordinate element
     */
    animateCoordinateClick(coord) {
        if (this.reducedMotion) return;
        
        coord.classList.add('clicked');
        
        setTimeout(() => {
            coord.classList.remove('clicked');
        }, 500);
    }
    
    /**
     * Get current animation performance settings
     */
    getPerformanceSettings() {
        return {
            reducedMotion: this.reducedMotion,
            animationSpeed: this.animationSpeed,
            hardwareAcceleration: !this.reducedMotion
        };
    }
    
    /**
     * Trigger premium celebration with particles and sound
     * @param {string} playerColor - 'yellow' or 'red'
     * @param {Array} winningPositions - Array of {row, col} winning positions
     */
    async triggerPremiumCelebration(playerColor, winningPositions) {
        if (this.reducedMotion || this.celebrationActive) return;
        
        this.celebrationActive = true;
        console.log(`🎉 Premium celebration for ${playerColor}`);
        
        try {
            // Play victory sound
            if (this.soundManager) {
                this.soundManager.playVictory();
            }
            
            // Trigger confetti particles
            if (this.particleEngine) {
                console.log('🎊 ParticleEngine available, creating celebration burst...');
                const gameBoard = document.querySelector('.game-board');
                if (gameBoard) {
                    const rect = gameBoard.getBoundingClientRect();
                    
                    // Convert to canvas-relative coordinates (not window coordinates!)
                    const canvas = document.getElementById('particleCanvas');
                    const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
                    
                    const centerX = (rect.left - canvasRect.left) + rect.width / 2;
                    const centerY = (rect.top - canvasRect.top) + rect.height / 2;
                    
                    console.log(`🎯 Game board rect:`, rect);
                    console.log(`🎯 Canvas rect:`, canvasRect);
                    console.log(`🎯 Canvas-relative center: ${centerX}, ${centerY}`);
                    
                    // Player-specific confetti colors with more variation
                    const confettiColors = playerColor === 'yellow' ? 
                        ['#FFD700', '#FFA000', '#FFEB3B', '#FF8F00', '#FFF176', '#FFCC02'] :
                        ['#F44336', '#D32F2F', '#FF5722', '#C62828', '#EF5350', '#FF1744'];
                        
                    // Multiple burst patterns for epic celebration
                    this.particleEngine.createCelebrationBurst({
                        x: centerX,
                        y: centerY,
                        pattern: 'explosion',
                        particleCount: 80,
                        colors: confettiColors
                    });
                    
                    // Delayed secondary burst with same player colors
                    setTimeout(() => {
                        if (this.particleEngine) {
                            this.particleEngine.createCelebrationBurst({
                                x: centerX,
                                y: centerY - 50,
                                pattern: 'fountain',
                                particleCount: 60,
                                colors: confettiColors
                            });
                        }
                    }, 500);
                } else {
                    console.warn('⚠️ Game board container not found for celebration');
                }
            } else {
                console.warn('⚠️ ParticleEngine not available for celebration');
                
                // Fallback: Simple DOM celebration
                const gameBoard = document.querySelector('.game-board-container');
                if (gameBoard) {
                    const celebrationDiv = document.createElement('div');
                    celebrationDiv.innerHTML = '🎊🎉✨';
                    celebrationDiv.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 3rem;
                        z-index: 9999;
                        animation: celebration 2s ease-out forwards;
                        pointer-events: none;
                    `;
                    
                    // Add keyframes if not exists
                    if (!document.getElementById('celebration-keyframes')) {
                        const style = document.createElement('style');
                        style.id = 'celebration-keyframes';
                        style.textContent = `
                            @keyframes celebration {
                                0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
                                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    
                    gameBoard.style.position = 'relative';
                    gameBoard.appendChild(celebrationDiv);
                    
                    setTimeout(() => {
                        if (celebrationDiv.parentNode) {
                            celebrationDiv.parentNode.removeChild(celebrationDiv);
                        }
                    }, 2000);
                    
                    console.log('🎉 Fallback DOM celebration triggered');
                }
                
                // ADDITIONAL SIMPLE CANVAS CONFETTI FOR DEBUGGING
                const canvas = document.getElementById('particleCanvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    
                    // Draw 20 simple colored circles
                    for (let i = 0; i < 20; i++) {
                        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
                        ctx.beginPath();
                        ctx.arc(
                            Math.random() * canvas.width,
                            Math.random() * canvas.height,
                            Math.random() * 20 + 10,
                            0, 2 * Math.PI
                        );
                        ctx.fill();
                    }
                    
                    console.log('🎨 Simple canvas confetti drawn - 20 colored circles');
                }
            }
            
            // Enhanced victory line animation
            await this.animateVictoryLine(winningPositions, playerColor);
            
        } catch (error) {
            console.warn('⚠️ Premium celebration error:', error.message);
        } finally {
            // Reset celebration state after duration
            setTimeout(() => {
                this.celebrationActive = false;
            }, this.timing.confettiDuration);
        }
    }
    
    /**
     * Animate piece drop with sound effects
     * @param {number} column - Column index (0-6)
     * @param {number} row - Row index (0-5)
     * @param {string} playerColor - 'yellow' or 'red'
     * @param {boolean} special - Special move (winning move, blocking move)
     */
    async animatePieceDropWithSound(column, row, playerColor, special = false) {
        try {
            // Play piece placement sound
            if (this.soundManager) {
                this.soundManager.playPiecePlace();
            }
            
            // Animate the drop with enhanced effects
            await this.animatePieceDrop(column, row, playerColor, special);
            
            // Additional sound effects for special moves
            if (special && this.soundManager) {
                setTimeout(() => {
                    this.soundManager.playConfetti();
                }, 200);
            }
            
        } catch (error) {
            console.warn('⚠️ Enhanced piece drop error:', error.message);
            // Fallback to basic animation
            await this.animatePieceDrop(column, row, playerColor, special);
        }
    }
    
    /**
     * Enhanced column preview with sound feedback
     * @param {number} column - Column index (0-6)
     * @param {string} playerColor - 'yellow' or 'red'
     */
    showEnhancedColumnPreview(column, playerColor) {
        // Play subtle hover sound
        if (this.soundManager && !this.reducedMotion) {
            this.soundManager.playHover();
        }
        
        // Show visual preview
        this.showColumnPreview(column, playerColor);
    }
    
    /**
     * Enhanced button click with ripple and sound
     * @param {HTMLElement} button - Button element
     * @param {Event} event - Click event
     */
    handleEnhancedButtonClick(button, event) {
        // Play button click sound
        if (this.soundManager) {
            this.soundManager.playButtonClick();
        }
        
        // Create ripple effect
        this.createButtonRipple(button, event);
    }
    
    /**
     * Clear all visual effects (for new game)
     */
    clearAllEffects() {
        console.log('🧹 Clearing all visual effects for new game...');
        
        // Clear celebration state
        this.celebrationActive = false;
        
        // Clear particle effects
        if (this.particleEngine) {
            this.particleEngine.clearCanvas();
        }
        
        // Clear any pending animations
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Clear column previews
        this.clearColumnPreview();
        
        console.log('✅ All visual effects cleared');
    }
    
    /**
     * Get premium effects status
     */
    getPremiumEffectsStatus() {
        return {
            particleEngine: {
                available: !!this.particleEngine,
                stats: this.particleEngine ? this.particleEngine.getPerformanceStats() : null
            },
            soundManager: {
                available: !!this.soundManager,
                status: this.soundManager ? this.soundManager.getStatus() : null
            },
            performance: this.getPerformanceSettings(),
            celebrationActive: this.celebrationActive
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
        this.clearColumnPreview();
        
        // Cleanup premium effects
        if (this.particleEngine) {
            this.particleEngine.destroy();
            this.particleEngine = null;
        }
        
        if (this.soundManager) {
            this.soundManager.destroy();
            this.soundManager = null;
        }
        
        // Remove any celebration overlays
        const overlays = document.querySelectorAll('.celebration-overlay');
        overlays.forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
        this.celebrationActive = false;
        
        console.log('🎬 AnimationManager destroyed with premium effects cleanup');
    }
}

// Add modern Tailwind CSS animations for premium effects
const style = document.createElement('style');
style.textContent = `
/* Modern Tailwind-compatible drop animations */
@keyframes drop-ripple-expand {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.8;
    }
    100% {
        transform: translate(-50%, -50%) scale(4);
        opacity: 0;
    }
}

@keyframes hover-ripple-expand {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.6;
    }
    100% {
        transform: translate(-50%, -50%) scale(6);
        opacity: 0;
    }
}

@keyframes btn-ripple {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.8;
    }
    100% {
        transform: translate(-50%, -50%) scale(10);
        opacity: 0;
    }
}

/* Tailwind-enhanced piece animations */
.disc.dropping {
    animation: piece-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.disc.dropping-special {
    animation: piece-drop-special 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.disc.victory-glow {
    animation: victory-glow 1s ease-in-out infinite;
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.8) !important;
}

@keyframes piece-drop {
    0% { 
        transform: translateY(-100px) scale(0.8); 
        opacity: 0;
        filter: blur(2px);
    }
    50% { 
        transform: translateY(10px) scale(1.1); 
        opacity: 0.8;
        filter: blur(0px);
    }
    100% { 
        transform: translateY(0) scale(1); 
        opacity: 1;
        filter: blur(0px);
    }
}

@keyframes piece-drop-special {
    0% { 
        transform: translateY(-120px) scale(0.6) rotate(-180deg); 
        opacity: 0;
        filter: blur(3px) brightness(1.5);
    }
    30% { 
        transform: translateY(20px) scale(1.2) rotate(-90deg); 
        opacity: 0.9;
        filter: blur(1px) brightness(1.2);
    }
    70% { 
        transform: translateY(-5px) scale(0.9) rotate(0deg); 
        opacity: 1;
        filter: blur(0px) brightness(1.1);
    }
    100% { 
        transform: translateY(0) scale(1) rotate(0deg); 
        opacity: 1;
        filter: blur(0px) brightness(1);
    }
}

@keyframes victory-glow {
    0%, 100% { 
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
                    0 0 40px rgba(255, 215, 0, 0.4),
                    inset 0 0 15px rgba(255, 255, 255, 0.3);
        transform: scale(1);
    }
    50% { 
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.9),
                    0 0 80px rgba(255, 215, 0, 0.6),
                    inset 0 0 25px rgba(255, 255, 255, 0.5);
        transform: scale(1.05);
    }
}

/* Tailwind glassmorphism preview effects */
.ghost-piece {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 85%;
    height: 85%;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
    backdrop-filter: blur(8px);
    border: 2px dashed rgba(255, 255, 255, 0.6);
    animation: ghost-pulse 1.5s ease-in-out infinite;
    z-index: 5;
}

@keyframes ghost-pulse {
    0%, 100% {
        opacity: 0.6;
        transform: translate(-50%, -50%) scale(0.9);
    }
    50% {
        opacity: 0.9;
        transform: translate(-50%, -50%) scale(1.1);
    }
}

/* Column highlight wave with Tailwind colors */
.column-highlight-wave {
    animation: column-wave 0.4s ease-out;
}

@keyframes column-wave {
    0% {
        background: transparent;
        transform: scale(1);
    }
    50% {
        background: rgba(59, 130, 246, 0.3);
        transform: scale(1.05);
    }
    100% {
        background: transparent;
        transform: scale(1);
    }
}

/* Modern coordinate click feedback */
.coord.clicked {
    animation: coord-click 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes coord-click {
    0% {
        transform: scale(1);
        background: transparent;
    }
    50% {
        transform: scale(1.2);
        background: rgba(59, 130, 246, 0.3);
        color: white;
    }
    100% {
        transform: scale(1);
        background: transparent;
    }
}

/* Celebration overlay system */
.celebration-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
}

.confetti-piece {
    position: absolute;
    width: 10px;
    height: 10px;
    animation: confetti-fall linear forwards;
}

.confetti-piece.yellow {
    background: linear-gradient(45deg, #FFD700, #FFA000);
}

.confetti-piece.red {
    background: linear-gradient(45deg, #F44336, #D32F2F);
}

.confetti-piece.blue {
    background: linear-gradient(45deg, #2196F3, #1976D2);
}

.confetti-piece.green {
    background: linear-gradient(45deg, #4CAF50, #388E3C);
}

.confetti-piece.purple {
    background: linear-gradient(45deg, #9C27B0, #7B1FA2);
}

@keyframes confetti-fall {
    0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
    }
}

/* Player-specific preview colors */
.preview-yellow .ghost-piece {
    background: radial-gradient(circle, rgba(255, 215, 0, 0.6), rgba(255, 160, 0, 0.3));
    border-color: rgba(255, 215, 0, 0.8);
}

.preview-red .ghost-piece {
    background: radial-gradient(circle, rgba(244, 67, 54, 0.6), rgba(211, 47, 47, 0.3));
    border-color: rgba(244, 67, 54, 0.8);
}

/* Reduced motion fallbacks */
@media (prefers-reduced-motion: reduce) {
    .disc.dropping,
    .disc.dropping-special {
        animation: none;
        transition: opacity 0.3s ease;
    }
    
    .ghost-piece {
        animation: none;
        opacity: 0.7;
    }
    
    .column-highlight-wave {
        animation: none;
        background: rgba(59, 130, 246, 0.2);
    }
    
    .victory-glow {
        animation: none;
        box-shadow: 0 0 25px rgba(255, 215, 0, 0.8) !important;
    }
}
`;
document.head.appendChild(style);