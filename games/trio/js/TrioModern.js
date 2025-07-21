/**
 * TrioModern - Connect4 Goldstandard Implementation for Trio
 * 
 * PHASE 3: Premium Features Integration
 * 
 * Complete 11-Component Architecture Implementation:
 * - TrioBoardRenderer: Hybrid CSS (Tailwind + Inline) + 7×7 Grid
 * - TrioInteractionHandler: Cell Selection + Trio Validation  
 * - TrioAnimationManager: 3-Phase Victory + Premium Effects
 * - TrioParticleEngine: Canvas Confetti + Object Pooling
 * - TrioSoundManager: Web Audio API + Synthetic Sounds
 * - TrioKeyboardController: 7×7 Navigation + Accessibility
 * - TrioModalManager: Help + Statistics + Settings
 * - TrioMessageSystem: Toast Messages + Glassmorphism
 * - TrioAssistanceManager: Hints + Tutorial + Adaptive Help
 * - TrioMemoryManager: Game State + Persistence
 * - TrioGameState: Central State + Backend Integration
 * 
 * Features:
 * - Connect4 Goldstandard 3-Phase Victory Sequence
 * - Enhanced Glassmorphism Effects
 * - Premium Animation System
 * - Responsive Design System
 * - Accessibility Support
 */

import { TrioBoardRenderer } from './components/TrioBoardRenderer.js';
import { TrioInteractionHandler } from './components/TrioInteractionHandler.js';
import { TrioAnimationManager } from './components/TrioAnimationManager.js';
import { TrioParticleEngine } from './components/TrioParticleEngine.js';
import { TrioSoundManager } from './components/TrioSoundManager.js';
import { TrioKeyboardController } from './components/TrioKeyboardController.js';
import { TrioModalManager } from './components/TrioModalManager.js';
import { TrioMessageSystem } from './components/TrioMessageSystem.js';
import { TrioAssistanceManager } from './components/TrioAssistanceManager.js';
import { TrioGameBitPacked } from './TrioGameBitPacked.js';

export class TrioModern {
    constructor() {
        // Core game state
        this.gameState = null;
        this.initialized = false;
        
        // Component system (11 components)
        this.components = {
            boardRenderer: null,
            interactionHandler: null,
            animationManager: null,
            particleEngine: null,
            soundManager: null,
            keyboardController: null,
            modalManager: null,
            messageSystem: null,
            assistanceManager: null,
            memoryManager: null
        };
        
        // Game configuration
        this.config = {
            enableAnimations: true,
            enableSounds: true,
            enableKeyboard: true,
            enableAssistance: true,
            difficulty: 'vollspektrum',
            autoHints: false
        };
        
        // Game statistics
        this.stats = {
            solutionsFound: 0,
            totalMoves: 0,
            currentStreak: 0,
            bestStreak: 0,
            hintsUsed: 0,
            totalPlayTime: 0
        };
        
        // UI state
        this.currentTarget = 0;
        this.gameActive = false;
        this.selectedCells = new Set();
        
        console.log('🎮 TrioModern initialized with 11-component architecture');
    }

    /**
     * Initialize the modern Trio system
     */
    async init() {
        try {
            console.log('🚀 Starting TrioModern initialization...');
            
            // Initialize game state first
            await this.initializeGameState();
            
            // Initialize all components in correct order
            await this.initializeComponents();
            
            // Setup component connections
            this.connectComponents();
            
            // Setup UI event handlers
            this.setupUIEventHandlers();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Start initial game
            await this.startNewGame();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ TrioModern fully initialized with premium features');
            
            // Show welcome message
            this.components.messageSystem?.show(
                'Trio Modernisiert! Alle Premium Features aktiviert 🎉',
                'success',
                { duration: 4000 }
            );
            
            return true;
            
        } catch (error) {
            console.error('❌ TrioModern initialization failed:', error);
            this.showCriticalError('Fehler beim Laden des modernisierten Trio-Systems', error);
            return false;
        }
    }

    /**
     * Initialize game state backend
     * @private
     */
    async initializeGameState() {
        console.log('🎯 Initializing Trio game state...');
        
        this.gameState = new TrioGameBitPacked();
        await this.gameState.init();
        
        console.log('✅ Game state initialized');
    }

    /**
     * Initialize all components in dependency order
     * @private
     */
    async initializeComponents() {
        console.log('🔧 Initializing 11 components...');
        
        // Get DOM elements
        const gameBoard = document.getElementById('numberGrid');
        const particleCanvas = this.createParticleCanvas();
        
        if (!gameBoard) {
            throw new Error('Game board element not found');
        }

        // Initialize components in dependency order
        
        // 1. Core rendering system
        this.components.boardRenderer = new TrioBoardRenderer(gameBoard);
        console.log('✅ 1/11 BoardRenderer initialized');

        // 2. Interaction system (depends on boardRenderer)
        this.components.interactionHandler = new TrioInteractionHandler(
            this.components.boardRenderer, 
            this.gameState
        );
        console.log('✅ 2/11 InteractionHandler initialized');

        // 3. Message system (independent)
        this.components.messageSystem = new TrioMessageSystem({
            position: 'top-right',
            duration: 3000,
            maxMessages: 4
        });
        console.log('✅ 3/11 MessageSystem initialized');

        // 4. Modal system (independent)
        this.components.modalManager = new TrioModalManager();
        console.log('✅ 4/11 ModalManager initialized');

        // 5. Sound system (independent)
        this.components.soundManager = new TrioSoundManager({
            volume: 0.4,
            enabled: this.config.enableSounds
        });
        console.log('✅ 5/11 SoundManager initialized');

        // 6. Particle engine (independent)
        this.components.particleEngine = new TrioParticleEngine(particleCanvas);
        console.log('✅ 6/11 ParticleEngine initialized');

        // 7. Animation manager (depends on boardRenderer)
        this.components.animationManager = new TrioAnimationManager(this.components.boardRenderer);
        console.log('✅ 7/11 AnimationManager initialized');

        // 8. Keyboard controller (depends on interactionHandler)
        this.components.keyboardController = new TrioKeyboardController(
            this.components.interactionHandler
        );
        console.log('✅ 8/11 KeyboardController initialized');

        // 9. Assistance system (depends on gameState, boardRenderer)
        this.components.assistanceManager = new TrioAssistanceManager(
            this.gameState, 
            this.components.boardRenderer
        );
        console.log('✅ 9/11 AssistanceManager initialized');

        // 10. Memory manager (simplified - using localStorage)
        this.components.memoryManager = {
            save: (key, data) => {
                try {
                    localStorage.setItem(`trio_${key}`, JSON.stringify(data));
                } catch (error) {
                    console.warn('Failed to save to localStorage:', error);
                }
            },
            load: (key, defaultValue = null) => {
                try {
                    const data = localStorage.getItem(`trio_${key}`);
                    return data ? JSON.parse(data) : defaultValue;
                } catch (error) {
                    console.warn('Failed to load from localStorage:', error);
                    return defaultValue;
                }
            },
            clear: () => {
                try {
                    Object.keys(localStorage)
                        .filter(key => key.startsWith('trio_'))
                        .forEach(key => localStorage.removeItem(key));
                } catch (error) {
                    console.warn('Failed to clear localStorage:', error);
                }
            }
        };
        console.log('✅ 10/11 MemoryManager initialized');

        // 11. Game State Manager (already initialized)
        console.log('✅ 11/11 GameState initialized');

        console.log('🎉 All 11 components initialized successfully!');
    }

    /**
     * Connect components together
     * @private
     */
    connectComponents() {
        console.log('🔌 Connecting components...');

        // Connect interaction handler with animation and sound
        this.components.interactionHandler.setAnimationManager(this.components.animationManager);
        this.components.interactionHandler.setMessageSystem(this.components.messageSystem);

        // Connect animation manager with particle engine and sound
        this.components.animationManager.particleEngine = this.components.particleEngine;
        this.components.animationManager.soundManager = this.components.soundManager;

        // Connect assistance manager with message system
        this.components.assistanceManager.setMessageSystem(this.components.messageSystem);

        // Make global references available
        window.trioMessages = this.components.messageSystem;
        window.trioModalManager = this.components.modalManager;
        window.trioGame = this;

        console.log('✅ Component connections established');
    }

    /**
     * Create particle canvas for effects
     * @private
     */
    createParticleCanvas() {
        let canvas = document.getElementById('trioParticleCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'trioParticleCanvas';
            canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 1000;
            `;
            document.body.appendChild(canvas);
        }
        return canvas;
    }

    /**
     * Setup UI event handlers
     * @private
     */
    setupUIEventHandlers() {
        console.log('🎛️ Setting up UI event handlers...');

        // Game control buttons
        const buttons = {
            newGameBtn: () => this.startNewGame(),
            clearSelectionBtn: () => this.clearSelection(),
            submitSolutionBtn: () => this.submitSolution(),
            showSolutionBtn: () => this.showSolution()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
                console.log(`✅ Event handler attached to ${id}`);
            }
        });

        // Difficulty selector
        const gameMode = document.getElementById('gameMode');
        if (gameMode) {
            gameMode.addEventListener('change', (e) => {
                this.changeDifficulty(e.target.value);
            });
        }

        // Window resize handler
        window.addEventListener('resize', () => {
            this.components.keyboardController?.handleResize();
            this.components.boardRenderer?.handleResize();
        });

        console.log('✅ UI event handlers configured');
    }

    /**
     * Setup keyboard shortcuts
     * @private
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;

            switch (event.code) {
                case 'KeyN':
                    event.preventDefault();
                    this.startNewGame();
                    break;
                case 'KeyC':
                    event.preventDefault();
                    this.clearSelection();
                    break;
                case 'KeyS':
                    event.preventDefault();
                    this.showSolution();
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.submitSolution();
                    break;
                case 'F1':
                    event.preventDefault();
                    this.components.modalManager?.toggle('help');
                    break;
            }
        });

        console.log('✅ Keyboard shortcuts configured');
    }

    /**
     * Start new game
     */
    async startNewGame() {
        try {
            console.log('🎲 Starting new Trio game...');

            // Clear current state
            this.clearSelection();
            this.components.animationManager?.clearAllEffects();

            // Generate new board
            await this.gameState.generateNewBoard(this.config.difficulty);

            // Update board display
            const board = this.gameState.getBoard();
            this.components.boardRenderer.renderBoard(board);

            // Update target display
            this.currentTarget = this.gameState.getTargetNumber();
            this.updateTargetDisplay();

            // Update game stats
            this.updateGameStats();

            // Set game active
            this.gameActive = true;

            // Play new board sound
            this.components.soundManager?.playNewBoard();

            // Show new board message
            this.components.messageSystem?.showNewBoard(this.currentTarget);

            console.log('✅ New game started successfully');

        } catch (error) {
            console.error('❌ Failed to start new game:', error);
            this.components.messageSystem?.show('Fehler beim Starten des neuen Spiels', 'error');
        }
    }

    /**
     * Submit current trio solution
     */
    async submitSolution() {
        if (!this.gameActive) {
            this.components.messageSystem?.show('Spiel nicht aktiv', 'warning');
            return;
        }

        const selectedPositions = this.components.interactionHandler.getSelectionState().positions;
        
        if (selectedPositions.length !== 3) {
            this.components.messageSystem?.show('Bitte wählen Sie genau 3 Zellen aus', 'warning');
            return;
        }

        try {
            // Validate trio through game state
            const isValid = await this.gameState.validateTrio(selectedPositions);

            if (isValid) {
                // Valid solution found!
                const numbers = selectedPositions.map(pos => {
                    const cell = this.components.boardRenderer.getCellAt(pos.row, pos.col);
                    return parseInt(cell?.textContent || '0');
                });
                
                const calculation = this.formatCalculation(numbers);
                
                // Update statistics
                this.stats.solutionsFound++;
                this.stats.totalMoves++;
                this.stats.currentStreak++;
                if (this.stats.currentStreak > this.stats.bestStreak) {
                    this.stats.bestStreak = this.stats.currentStreak;
                }

                // Trigger 3-Phase Victory Sequence
                this.components.animationManager.start3PhaseVictorySequence(
                    selectedPositions,
                    calculation,
                    this
                );

                console.log(`🏆 Valid trio found: ${calculation}`);

            } else {
                // Invalid solution
                this.stats.totalMoves++;
                this.stats.currentStreak = 0;

                // Show invalid feedback
                this.components.animationManager?.animateInvalidTrio(selectedPositions);
                this.components.messageSystem?.showInvalidTrio(selectedPositions);

                console.log('❌ Invalid trio attempt');
            }

            // Update displays
            this.updateGameStats();
            this.saveGameProgress();

        } catch (error) {
            console.error('❌ Error validating trio:', error);
            this.components.messageSystem?.show('Fehler bei der Validierung', 'error');
        }
    }

    /**
     * Format calculation string
     * @private
     */
    formatCalculation(numbers) {
        const [a, b, c] = numbers;
        const addResult = a * b + c;
        const subResult = a * b - c;
        
        if (addResult === this.currentTarget) {
            return `${a} × ${b} + ${c} = ${addResult}`;
        } else if (subResult === this.currentTarget) {
            return `${a} × ${b} - ${c} = ${subResult}`;
        } else {
            return `${a} × ${b} ± ${c} = ${addResult}/${subResult}`;
        }
    }

    /**
     * Clear current selection
     */
    clearSelection() {
        this.components.interactionHandler?.clearSelection();
        this.selectedCells.clear();
        this.updateSelectedDisplay();
    }

    /**
     * Show solution hint
     */
    showSolution() {
        this.components.assistanceManager?.requestHint();
    }

    /**
     * Change difficulty level
     */
    changeDifficulty(difficulty) {
        this.config.difficulty = difficulty;
        this.components.messageSystem?.showDifficultyChange(difficulty);
        
        // Start new game with new difficulty
        setTimeout(() => this.startNewGame(), 1000);
    }

    /**
     * Update target display
     * @private
     */
    updateTargetDisplay() {
        const targetElement = document.getElementById('targetNumber');
        if (targetElement) {
            targetElement.textContent = this.currentTarget;
        }
    }

    /**
     * Update selected display
     * @private
     */
    updateSelectedDisplay() {
        const selectionState = this.components.interactionHandler?.getSelectionState();
        if (!selectionState) return;

        const selectedDisplay = document.getElementById('selectedDisplay');
        const calculatedResult = document.getElementById('calculatedResult');
        
        if (selectionState.selectedCount === 0) {
            if (selectedDisplay) {
                selectedDisplay.innerHTML = '<span class="text-gray-400">Keine Auswahl</span>';
            }
            if (calculatedResult) {
                calculatedResult.textContent = '?';
            }
            return;
        }

        // Update selection slots
        for (let i = 1; i <= 3; i++) {
            const slot = document.getElementById(`selected${i}`);
            if (slot) {
                const pos = selectionState.positions[i - 1];
                if (pos) {
                    const cell = this.components.boardRenderer.getCellAt(pos.row, pos.col);
                    slot.textContent = cell?.textContent || '?';
                } else {
                    slot.textContent = '?';
                }
            }
        }

        // Calculate result if 3 selected
        if (selectionState.selectedCount === 3 && calculatedResult) {
            const numbers = selectionState.positions.map(pos => {
                const cell = this.components.boardRenderer.getCellAt(pos.row, pos.col);
                return parseInt(cell?.textContent || '0');
            });

            const [a, b, c] = numbers;
            const addResult = a * b + c;
            const subResult = a * b - c;

            if (addResult === this.currentTarget) {
                calculatedResult.innerHTML = `<span class="text-green-400 font-bold">${addResult}</span>`;
            } else if (subResult === this.currentTarget) {
                calculatedResult.innerHTML = `<span class="text-green-400 font-bold">${subResult}</span>`;
            } else {
                calculatedResult.innerHTML = `<span class="text-red-400">${addResult}/${subResult}</span>`;
            }
        }
    }

    /**
     * Update game statistics display
     * @private
     */
    updateGameStats() {
        const elements = {
            realizedCount: document.getElementById('realizedCount'),
            moveCounter: document.getElementById('moveCounter'),
            gameStatus: document.getElementById('gameStatus')
        };

        if (elements.realizedCount) {
            elements.realizedCount.textContent = this.stats.solutionsFound;
        }

        if (elements.moveCounter) {
            elements.moveCounter.textContent = this.stats.totalMoves;
        }

        if (elements.gameStatus) {
            if (this.stats.solutionsFound > 0) {
                elements.gameStatus.textContent = `${this.stats.solutionsFound} Lösung${this.stats.solutionsFound === 1 ? '' : 'en'} gefunden`;
                elements.gameStatus.className = 'text-green-400 font-semibold';
            } else if (this.stats.totalMoves > 0) {
                elements.gameStatus.textContent = `${this.stats.totalMoves} Versuch${this.stats.totalMoves === 1 ? '' : 'e'}`;
                elements.gameStatus.className = 'text-yellow-400 font-semibold';
            } else {
                elements.gameStatus.textContent = 'Bereit zum Spielen';
                elements.gameStatus.className = 'text-white font-semibold';
            }
        }

        // Update component with latest statistics
        this.components.assistanceManager?.stats = { ...this.stats };
    }

    /**
     * Save game progress
     * @private
     */
    saveGameProgress() {
        this.components.memoryManager?.save('stats', this.stats);
        this.components.memoryManager?.save('config', this.config);
    }

    /**
     * Load game progress
     * @private
     */
    loadGameProgress() {
        const savedStats = this.components.memoryManager?.load('stats', {});
        const savedConfig = this.components.memoryManager?.load('config', {});

        Object.assign(this.stats, savedStats);
        Object.assign(this.config, savedConfig);
    }

    /**
     * Hide loading screen
     * @private
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Show critical error
     * @private
     */
    showCriticalError(message, error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(239, 68, 68, 0.95);
            color: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;

        errorDiv.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Kritischer Fehler</h3>
            <p style="margin: 0; opacity: 0.9;">${message}</p>
            <button onclick="location.reload()" style="
                margin-top: 1.5rem;
                padding: 0.75rem 1.5rem;
                background: white;
                color: #ef4444;
                border: none;
                border-radius: 0.5rem;
                font-weight: bold;
                cursor: pointer;
            ">Seite neu laden</button>
        `;

        document.body.appendChild(errorDiv);
        
        console.error('Critical error details:', error);
    }

    /**
     * Get component status for debugging
     */
    getComponentStatus() {
        return Object.entries(this.components).map(([name, component]) => ({
            name,
            initialized: !!component,
            status: component ? 'OK' : 'Missing'
        }));
    }

    /**
     * Auto-generate new board (called by victory sequence)
     */
    generateNewBoard() {
        this.startNewGame();
    }

    /**
     * Cleanup resources on page unload
     */
    destroy() {
        console.log('🧹 Destroying TrioModern...');

        // Cleanup all components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });

        // Clear global references
        window.trioMessages = null;
        window.trioModalManager = null;
        window.trioGame = null;

        // Save final progress
        this.saveGameProgress();

        console.log('✅ TrioModern cleanup complete');
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.trioGame = new TrioModern();
        window.trioGame.init();
    });
} else {
    window.trioGame = new TrioModern();
    window.trioGame.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.trioGame) {
        window.trioGame.destroy();
    }
});

export default TrioModern;