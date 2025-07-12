/**
 * GomokuUI - Simple Implementation for testing
 * 
 * Simplified version without BaseGameUI dependency for immediate testing.
 */

import { GomokuBoardRenderer } from './components/GomokuBoardRenderer.js';
import { GomokuInteractionHandler } from './components/GomokuInteractionHandler.js';
import { GomokuAssistanceManager } from './components/GomokuAssistanceManager.js';
import { GomokuAnimationManager } from './components/GomokuAnimationManager.js';

export class GomokuUI {
    constructor(game) {
        this.game = game;
        
        // Game state
        this.gameMode = 'two-player';
        this.isProcessingMove = false;
        this.scores = { black: 0, white: 0 };
        this.nextStartingPlayer = 1;
        
        // Components
        this.boardRenderer = null;
        this.interactionHandler = null;
        this.assistanceManager = null;
        this.animationManager = null;
        
        // Elements
        this.elements = this._getElements();
        
        this.initialized = false;
    }

    /**
     * Get DOM elements
     */
    _getElements() {
        return {
            gameBoard: document.getElementById('gameBoard'),
            currentPlayerIndicator: document.getElementById('currentPlayerIndicator'),
            gameStatus: document.getElementById('gameStatus'),
            blackScore: document.getElementById('blackScore'),
            whiteScore: document.getElementById('whiteScore'),
            moveCounter: document.getElementById('moveCounter'),
            newGameBtn: document.getElementById('newGameBtn'),
            undoBtn: document.getElementById('undoBtn'),
            helpBtn: document.getElementById('helpBtn'),
            assistanceBtn: document.getElementById('assistanceBtn'),
            helpModal: document.getElementById('helpModal'),
            assistanceModal: document.getElementById('assistanceModal'),
            closeHelpBtn: document.getElementById('closeHelpBtn'),
            closeAssistanceBtn: document.getElementById('closeAssistanceBtn'),
            gameMode: document.getElementById('gameMode')
        };
    }

    /**
     * Initialize the UI
     */
    async init() {
        console.log('🚀 Initializing Simple Gomoku UI...');
        
        // Initialize board renderer
        this.initializeBoardRenderer();
        
        // Initialize interaction handler
        this.initializeInteractionHandler();
        
        // Initialize assistance manager
        this.initializeAssistanceManager();
        
        // Initialize animation manager
        this.initializeAnimationManager();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Update initial UI
        this.updateUI();
        
        this.initialized = true;
        console.log('✅ Simple Gomoku UI initialized');
    }

    /**
     * Initialize board renderer
     */
    initializeBoardRenderer() {
        if (!this.elements.gameBoard) {
            console.error('❌ Game board element not found');
            return;
        }
        
        this.boardRenderer = new GomokuBoardRenderer(this.elements.gameBoard);
        const success = this.boardRenderer.initializeBoard();
        
        if (!success) {
            console.error('❌ Board renderer initialization failed');
        } else {
            console.log('✅ Board renderer initialized');
        }
    }

    /**
     * Initialize interaction handler
     */
    initializeInteractionHandler() {
        if (!this.boardRenderer) {
            console.error('❌ Board renderer required for interaction handler');
            return;
        }
        
        this.interactionHandler = new GomokuInteractionHandler(
            this.game,
            this.boardRenderer,
            this.elements
        );
        
        this.interactionHandler.setupEventHandlers((row, col) => {
            this.makeMove(row, col);
        });
        
        console.log('✅ Interaction handler initialized');
    }

    /**
     * Initialize assistance manager
     */
    initializeAssistanceManager() {
        if (!this.boardRenderer) return;
        
        this.assistanceManager = new GomokuAssistanceManager(
            this.game,
            this.boardRenderer,
            this.elements
        );
        
        // Note: setupAssistanceSystem would need assistance checkboxes
        console.log('✅ Assistance manager initialized');
    }

    /**
     * Initialize animation manager
     */
    initializeAnimationManager() {
        if (!this.boardRenderer) return;
        
        this.animationManager = new GomokuAnimationManager(this.boardRenderer);
        console.log('✅ Animation manager initialized');
    }

    /**
     * Setup basic event handlers
     */
    setupEventHandlers() {
        // New Game button
        if (this.elements.newGameBtn) {
            this.elements.newGameBtn.addEventListener('click', () => {
                this.newGame();
            });
        }
        
        // Undo button
        if (this.elements.undoBtn) {
            this.elements.undoBtn.addEventListener('click', () => {
                this.undoMove();
            });
        }
        
        // Help button
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', () => {
                this.toggleModal('help');
            });
        }
        
        // Assistance button
        if (this.elements.assistanceBtn) {
            this.elements.assistanceBtn.addEventListener('click', () => {
                this.toggleModal('assistance');
            });
        }
        
        // Modal close buttons
        if (this.elements.closeHelpBtn) {
            this.elements.closeHelpBtn.addEventListener('click', () => {
                this.closeModal('help');
            });
        }
        
        if (this.elements.closeAssistanceBtn) {
            this.elements.closeAssistanceBtn.addEventListener('click', () => {
                this.closeModal('assistance');
            });
        }
        
        console.log('✅ Event handlers set up');
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'n':
                    if (!event.ctrlKey && !event.altKey) {
                        this.newGame();
                        event.preventDefault();
                    }
                    break;
                case 'u':
                    if (!event.ctrlKey && !event.altKey) {
                        this.undoMove();
                        event.preventDefault();
                    }
                    break;
                case 'f1':
                    this.toggleModal('help');
                    event.preventDefault();
                    break;
                case 'f2':
                    this.toggleModal('assistance');
                    event.preventDefault();
                    break;
                case 'escape':
                    this.closeAllModals();
                    event.preventDefault();
                    break;
            }
        });
        
        console.log('✅ Keyboard shortcuts set up');
    }

    /**
     * Make a move
     */
    async makeMove(row, col) {
        if (this.isProcessingMove) return;
        
        console.log(`🎯 Making move at (${row}, ${col})`);
        this.isProcessingMove = true;
        
        try {
            // Validate move
            if (!this.game.isValidMove(row, col)) {
                console.warn(`⚠️ Invalid move at (${row}, ${col})`);
                return;
            }
            
            // Execute move
            const moveResult = this.game.makeMove(row, col);
            
            if (moveResult && moveResult.success) {
                const currentPlayer = this.game.getCurrentPlayer();
                
                // Place stone visually
                this.boardRenderer.placeStone(row, col, currentPlayer);
                
                // Animate stone placement
                if (this.animationManager) {
                    this.animationManager.animateStonePlace(row, col, currentPlayer);
                }
                
                // Update UI
                this.updateUI();
                
                // Check for game over
                if (this.game.isGameOver()) {
                    this.handleGameOver();
                }
            }
        } catch (error) {
            console.error('❌ Error making move:', error);
        } finally {
            this.isProcessingMove = false;
        }
    }

    /**
     * Start new game
     */
    newGame() {
        console.log('🆕 Starting new game...');
        
        // Reset game
        if (this.game.newGame) {
            this.game.newGame();
        }
        
        // Clear board
        if (this.boardRenderer) {
            this.boardRenderer.clearBoard();
        }
        
        // Clear animations
        if (this.animationManager) {
            this.animationManager.clearAllEffects();
        }
        
        // Update UI
        this.updateUI();
        
        this.showMessage('🆕 Neues Spiel gestartet!', 'info');
    }

    /**
     * Undo last move
     */
    undoMove() {
        console.log('↩️ Undoing last move...');
        
        try {
            if (this.game.undoMove) {
                const result = this.game.undoMove();
                if (result && result.success) {
                    // Update board visual
                    if (this.boardRenderer) {
                        this.boardRenderer.updateFromGameState(this.game);
                    }
                    
                    this.updateUI();
                    this.showMessage('↩️ Zug rückgängig gemacht', 'info');
                } else {
                    this.showMessage('⚠️ Rückgängig nicht möglich', 'warning');
                }
            }
        } catch (error) {
            console.error('❌ Error undoing move:', error);
            this.showMessage('❌ Fehler beim Rückgängig machen', 'error');
        }
    }

    /**
     * Handle game over
     */
    handleGameOver() {
        const winner = this.game.getWinner();
        
        if (winner) {
            const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
            
            // Update scores
            if (winner === 1) {
                this.scores.black++;
            } else {
                this.scores.white++;
            }
            
            // Show winning animation
            if (this.animationManager) {
                this.animationManager.showWinningAnimation(winner);
            }
            
            this.showMessage(`🏆 ${winnerName} gewinnt!`, 'success');
            this.nextStartingPlayer = winner;
        } else {
            this.showMessage('⚖️ Unentschieden!', 'info');
        }
        
        this.updateUI();
    }

    /**
     * Update UI state
     */
    updateUI() {
        this.updateCurrentPlayerIndicator();
        this.updateGameStatus();
        this.updateScores();
        this.updateMoveCounter();
    }

    /**
     * Update current player indicator
     */
    updateCurrentPlayerIndicator() {
        if (!this.elements.currentPlayerIndicator || !this.game) return;
        
        const currentPlayer = this.game.getCurrentPlayer();
        const playerName = currentPlayer === 1 ? 'Schwarz' : 'Weiß';
        const stoneClass = currentPlayer === 1 ? 'black' : 'white';
        
        this.elements.currentPlayerIndicator.innerHTML = `
            <span class="player-indicator active">
                <span class="player-stone ${stoneClass}"></span>
                ${playerName} ist am Zug
            </span>
        `;
    }

    /**
     * Update game status
     */
    updateGameStatus() {
        if (!this.elements.gameStatus || !this.game) return;
        
        if (this.game.isGameOver()) {
            const winner = this.game.getWinner();
            if (winner) {
                const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
                this.elements.gameStatus.textContent = `${winnerName} gewinnt!`;
            } else {
                this.elements.gameStatus.textContent = 'Unentschieden';
            }
        } else {
            const moveCount = this.game.getMoveCount ? this.game.getMoveCount() : 0;
            this.elements.gameStatus.textContent = `Zug ${moveCount + 1}`;
        }
    }

    /**
     * Update scores
     */
    updateScores() {
        if (this.elements.blackScore) {
            this.elements.blackScore.textContent = this.scores.black;
        }
        if (this.elements.whiteScore) {
            this.elements.whiteScore.textContent = this.scores.white;
        }
    }

    /**
     * Update move counter
     */
    updateMoveCounter() {
        if (this.elements.moveCounter && this.game.getMoveCount) {
            this.elements.moveCounter.textContent = this.game.getMoveCount();
        }
    }

    /**
     * Show message (simple alert for now)
     */
    showMessage(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        // Could be enhanced with toast notifications
    }

    /**
     * Toggle modal
     */
    toggleModal(modalName) {
        const modal = modalName === 'help' ? this.elements.helpModal : this.elements.assistanceModal;
        if (!modal) return;
        
        if (modal.classList.contains('active')) {
            this.closeModal(modalName);
        } else {
            this.openModal(modalName);
        }
    }

    /**
     * Open modal
     */
    openModal(modalName) {
        const modal = modalName === 'help' ? this.elements.helpModal : this.elements.assistanceModal;
        if (!modal) return;
        
        modal.classList.add('active');
        console.log(`📖 Opened ${modalName} modal`);
    }

    /**
     * Close modal
     */
    closeModal(modalName) {
        const modal = modalName === 'help' ? this.elements.helpModal : this.elements.assistanceModal;
        if (!modal) return;
        
        modal.classList.remove('active');
        console.log(`📖 Closed ${modalName} modal`);
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.remove('active');
        }
        if (this.elements.assistanceModal) {
            this.elements.assistanceModal.classList.remove('active');
        }
    }
}