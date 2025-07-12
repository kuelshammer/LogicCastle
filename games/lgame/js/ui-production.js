/**
 * LGameUI - L-Game Production UI Controller
 * 
 * Adapted from Connect4 goldstandard UI system for L-Game.
 * Implements the complete 3-layer architecture with component-based design.
 * 
 * Architecture:
 * - LAYER 1: WASM/Rust (LGameEngine via game.js)
 * - LAYER 2: Game Logic/JavaScript (ui-production.js)
 * - LAYER 3: UI/Frontend (components + interactions)
 * 
 * Features:
 * - L-piece placement and rotation
 * - Neutral piece placement
 * - Game state management
 * - Victory detection and celebration
 * - Player assistance system
 * - Keyboard shortcuts
 * - Modal system
 */

// Import L-Game specific components
import { LGameBoardRenderer } from './components/LGameBoardRenderer.js';
import { LGameInteractionHandler } from './components/LGameInteractionHandler.js';
import { LGameAnimationManager } from './components/LGameAnimationManager.js';

export class LGameUI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isInitialized = false;
        
        // Component instances
        this.boardRenderer = null;
        this.interactionHandler = null;
        this.animationManager = null;
        
        // Game state
        this.currentPlayer = 1;
        this.gameOver = false;
        this.moveCount = 0;
        this.gameHistory = [];
        
        // Interaction state
        this.selectedLPiece = null;
        this.interactionMode = 'L_PIECE'; // 'L_PIECE' or 'NEUTRAL_PIECE'
        this.currentOrientation = 0;
        
        // Player assistance settings
        this.assistanceSettings = {
            player1: {
                hints: false,
                validMoves: false,
                undo: true
            },
            player2: {
                hints: false,
                validMoves: false,
                undo: true
            }
        };
        
        // Score tracking
        this.scores = { player1: 0, player2: 0 };
        
        console.log('🎮 L-Game UI initialized with production components');
    }

    /**
     * Initialize the complete UI system
     */
    async init() {
        try {
            console.log('🚀 Initializing L-Game Production UI...');
            
            // Initialize core components
            await this.initializeComponents();
            
            // Setup board rendering
            await this.setupBoard();
            
            // Setup interactions
            this.setupInteractions();
            
            // Setup UI controls
            this.setupUIControls();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Setup modal system
            this.setupModalSystem();
            
            // Initialize game state
            this.initializeGameState();
            
            this.isInitialized = true;
            console.log('✅ L-Game Production UI fully initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ L-Game UI initialization failed:', error);
            this.showMessage('UI-System konnte nicht geladen werden.', 'error');
            return false;
        }
    }

    /**
     * Initialize core components
     * @private
     */
    async initializeComponents() {
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) {
            throw new Error('Game board element not found');
        }
        
        // Initialize board renderer
        this.boardRenderer = new LGameBoardRenderer(gameBoard);
        await this.boardRenderer.init();
        
        // Initialize interaction handler
        this.interactionHandler = new LGameInteractionHandler(this.boardRenderer, gameBoard);
        
        // Initialize animation manager
        this.animationManager = new LGameAnimationManager(gameBoard, this.boardRenderer);
        
        console.log('✅ L-Game core components initialized');
    }

    /**
     * Setup 4x4 L-Game board
     * @private
     */
    async setupBoard() {
        await this.boardRenderer.createBoard();
        console.log('✅ L-Game board setup complete');
    }

    /**
     * Setup user interactions
     * @private
     */
    setupInteractions() {
        // Setup cell interactions
        this.interactionHandler.setupCellInteractions();
        this.interactionHandler.setupKeyboardInteractions();
        
        // Set interaction callbacks
        this.interactionHandler.setCallbacks({
            onCellClick: (row, col, mode, selectedPiece, orientation) => {
                this.handleCellClick(row, col, mode, selectedPiece, orientation);
            },
            onCellHover: (row, col) => {
                this.handleCellHover(row, col);
            },
            onCellHoverLeave: () => {
                this.handleCellHoverLeave();
            },
            onLPieceSelect: (player) => {
                this.handleLPieceSelect(player);
            }
        });
        
        console.log('✅ L-Game interactions setup complete');
    }

    /**
     * Setup UI controls (buttons, selectors)
     * @private
     */
    setupUIControls() {
        // New Game button
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.startNewGame());
        }
        
        // Undo button
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoLastMove());
        }
        
        // Help button
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelpModal());
        }
        
        // Assistance button
        const assistanceBtn = document.getElementById('assistanceBtn');
        if (assistanceBtn) {
            assistanceBtn.addEventListener('click', () => this.showAssistanceModal());
        }
        
        // L-piece selection buttons (if available)
        const player1Button = document.getElementById('selectPlayer1LPiece');
        if (player1Button) {
            player1Button.addEventListener('click', () => this.selectLPiece(1));
        }
        
        const player2Button = document.getElementById('selectPlayer2LPiece');
        if (player2Button) {
            player2Button.addEventListener('click', () => this.selectLPiece(2));
        }
        
        console.log('✅ L-Game UI controls setup complete');
    }

    /**
     * Setup keyboard shortcuts
     * @private
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Prevent shortcuts when typing in inputs
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (event.key.toLowerCase()) {
                case 'n':
                    this.startNewGame();
                    event.preventDefault();
                    break;
                case 'u':
                    this.undoLastMove();
                    event.preventDefault();
                    break;
                case 'r':
                    this.rotateCurrentLPiece();
                    event.preventDefault();
                    break;
                case '1':
                    this.selectLPiece(1);
                    event.preventDefault();
                    break;
                case '2':
                    this.selectLPiece(2);
                    event.preventDefault();
                    break;
                case 'l':
                    this.setInteractionMode('L_PIECE');
                    event.preventDefault();
                    break;
                case 'space':
                    this.setInteractionMode('NEUTRAL_PIECE');
                    event.preventDefault();
                    break;
                case 'f1':
                    this.showHelpModal();
                    event.preventDefault();
                    break;
                case 'f2':
                    this.showAssistanceModal();
                    event.preventDefault();
                    break;
            }
        });
        
        console.log('✅ L-Game keyboard shortcuts setup complete');
    }

    /**
     * Handle cell click for L-Game moves
     * @private
     */
    async handleCellClick(row, col, mode, selectedPiece, orientation) {
        if (this.gameOver) {
            console.log('Game is over, ignoring click');
            return;
        }
        
        try {
            if (mode === 'L_PIECE' && selectedPiece) {
                await this.placeLPiece(row, col, selectedPiece, orientation);
            } else if (mode === 'NEUTRAL_PIECE') {
                await this.placeNeutralPiece(row, col);
            } else {
                this.showMessage('Bitte wählen Sie zuerst ein L-Stück aus.', 'warning');
            }
        } catch (error) {
            console.error('❌ Cell click error:', error);
            this.showMessage('Zug konnte nicht ausgeführt werden.', 'error');
        }
    }

    /**
     * Handle cell hover
     * @private
     */
    handleCellHover(row, col) {
        this.animationManager.animateCellHover(row, col);
    }

    /**
     * Handle cell hover leave
     * @private
     */
    handleCellHoverLeave() {
        // Clear any hover effects
    }

    /**
     * Handle L-piece selection
     * @private
     */
    handleLPieceSelect(player) {
        this.selectLPiece(player);
    }

    /**
     * Place L-piece on the board
     * @private
     */
    async placeLPiece(anchorRow, anchorCol, player, orientation) {
        // Calculate L-piece positions
        const positions = this.calculateLPiecePositions(anchorRow, anchorCol, orientation);
        
        // Validate move with game engine
        const isValid = await this.gameEngine.isValidLPieceMove(player, positions);
        if (!isValid) {
            this.showMessage('Ungültiger L-Stück Zug!', 'warning');
            return;
        }
        
        // Make move in game engine
        const result = await this.gameEngine.placeLPiece(player, positions, orientation);
        if (!result.success) {
            this.showMessage('Zug konnte nicht ausgeführt werden.', 'error');
            return;
        }
        
        // Animate L-piece placement
        await this.animationManager.animateLPiecePlacement(positions, player, orientation);
        
        // Update game state
        this.moveCount++;
        this.updateGameDisplay();
        
        // Check for victory
        if (result.gameWon) {
            await this.handleGameEnd(player);
        } else {
            // Continue to next phase (neutral piece placement if required)
            this.proceedToNextPhase();
        }
        
        console.log(`✅ L-piece placed: Player ${player} at ${anchorRow},${anchorCol}`);
    }

    /**
     * Place neutral piece on the board
     * @private
     */
    async placeNeutralPiece(row, col) {
        // Validate move with game engine
        const isValid = await this.gameEngine.isValidNeutralPieceMove(row, col);
        if (!isValid) {
            this.showMessage('Ungültiger Neutral-Stück Zug!', 'warning');
            return;
        }
        
        // Make move in game engine
        const result = await this.gameEngine.placeNeutralPiece(row, col);
        if (!result.success) {
            this.showMessage('Neutral-Stück konnte nicht platziert werden.', 'error');
            return;
        }
        
        // Animate neutral piece placement
        await this.animationManager.animateNeutralPiecePlacement(row, col);
        
        // Update game state
        this.moveCount++;
        this.updateGameDisplay();
        
        // Switch to next player
        this.switchPlayer();
        
        console.log(`✅ Neutral piece placed at ${row},${col}`);
    }

    /**
     * Calculate L-piece positions based on anchor and orientation
     * @private
     */
    calculateLPiecePositions(anchorRow, anchorCol, orientation) {
        // L-piece orientations (relative to anchor point)
        const orientations = [
            [[0, 0], [1, 0], [2, 0], [0, 1]], // L (normal)
            [[0, 0], [0, 1], [0, 2], [1, 0]], // L (rotated 90°)
            [[0, 0], [0, 1], [1, 1], [2, 1]], // L (rotated 180°)
            [[0, 0], [1, 0], [1, -1], [1, -2]], // L (rotated 270°)
            [[0, 0], [1, 0], [2, 0], [0, -1]], // L (flipped)
            [[0, 0], [0, 1], [0, 2], [-1, 0]], // L (flipped + 90°)
            [[0, 0], [0, -1], [1, -1], [2, -1]], // L (flipped + 180°)
            [[0, 0], [-1, 0], [-1, 1], [-1, 2]]  // L (flipped + 270°)
        ];
        
        const relativePositions = orientations[orientation % 8];
        return relativePositions.map(([dRow, dCol]) => [
            anchorRow + dRow,
            anchorCol + dCol
        ]);
    }

    /**
     * Select L-piece for placement
     */
    selectLPiece(player) {
        this.selectedLPiece = player;
        this.interactionHandler.selectLPiece(player);
        this.setInteractionMode('L_PIECE');
        this.updateCurrentPlayerDisplay();
        
        console.log(`Selected L-piece for player ${player}`);
    }

    /**
     * Rotate current L-piece orientation
     */
    rotateCurrentLPiece() {
        this.currentOrientation = (this.currentOrientation + 1) % 8;
        this.interactionHandler.rotateCurrentLPiece();
        
        console.log(`Rotated L-piece to orientation ${this.currentOrientation}`);
    }

    /**
     * Set interaction mode
     */
    setInteractionMode(mode) {
        this.interactionMode = mode;
        this.interactionHandler.setInteractionMode(mode);
        
        console.log(`Interaction mode set to: ${mode}`);
    }

    /**
     * Switch to next player
     * @private
     */
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.selectedLPiece = this.currentPlayer; // Auto-select current player's L-piece
        this.updateCurrentPlayerDisplay();
    }

    /**
     * Proceed to next game phase
     * @private
     */
    proceedToNextPhase() {
        // In L-Game, after L-piece placement, player may need to place neutral pieces
        // This depends on the specific L-Game variant being implemented
        this.setInteractionMode('NEUTRAL_PIECE');
    }

    /**
     * Handle game end
     * @private
     */
    async handleGameEnd(winningPlayer) {
        this.gameOver = true;
        this.scores[`player${winningPlayer}`]++;
        
        // Animate victory
        await this.animationManager.animateVictory(winningPlayer);
        
        // Update display
        this.updateScoreDisplay();
        this.updateGameStatus(`Spieler ${winningPlayer} gewinnt!`);
        
        // Show victory message
        this.showMessage(`🎉 Spieler ${winningPlayer} hat gewonnen!`, 'success');
        
        console.log(`🏆 Game ended: Player ${winningPlayer} wins!`);
    }

    /**
     * Start new game
     */
    async startNewGame() {
        try {
            // Reset game engine
            await this.gameEngine.newGame();
            
            // Reset UI state
            this.gameOver = false;
            this.moveCount = 0;
            this.currentPlayer = 1;
            this.selectedLPiece = 1;
            this.interactionMode = 'L_PIECE';
            this.currentOrientation = 0;
            this.gameHistory = [];
            
            // Clear visual effects
            this.animationManager.clearAllEffects();
            
            // Reset board
            await this.boardRenderer.clearBoard();
            await this.boardRenderer.createBoard();
            
            // Update display
            this.updateGameDisplay();
            this.updateGameStatus('Neues Spiel gestartet');
            
            console.log('✅ New L-Game started');
            
        } catch (error) {
            console.error('❌ Failed to start new game:', error);
            this.showMessage('Neues Spiel konnte nicht gestartet werden.', 'error');
        }
    }

    /**
     * Undo last move
     */
    async undoLastMove() {
        if (this.moveCount === 0) {
            this.showMessage('Keine Züge zum Rückgängigmachen.', 'info');
            return;
        }
        
        try {
            const result = await this.gameEngine.undoMove();
            if (result.success) {
                this.moveCount--;
                this.updateGameDisplay();
                this.showMessage('Zug rückgängig gemacht.', 'info');
            } else {
                this.showMessage('Zug konnte nicht rückgängig gemacht werden.', 'warning');
            }
        } catch (error) {
            console.error('❌ Undo failed:', error);
            this.showMessage('Fehler beim Rückgängigmachen.', 'error');
        }
    }

    /**
     * Initialize game state
     * @private
     */
    initializeGameState() {
        this.updateGameDisplay();
        this.updateGameStatus('Bereit zum Spielen');
        this.selectLPiece(1); // Start with player 1
    }

    /**
     * Update game display
     * @private
     */
    updateGameDisplay() {
        this.updateMoveCounter();
        this.updateCurrentPlayerDisplay();
        this.updateScoreDisplay();
    }

    /**
     * Update move counter
     * @private
     */
    updateMoveCounter() {
        const moveCounter = document.getElementById('moveCounter');
        if (moveCounter) {
            moveCounter.textContent = this.moveCount;
        }
    }

    /**
     * Update current player display
     * @private
     */
    updateCurrentPlayerDisplay() {
        const currentPlayerDisplay = document.getElementById('currentPlayerDisplay');
        const currentPlayerIndicator = document.getElementById('currentPlayerIndicator');
        
        if (currentPlayerDisplay) {
            currentPlayerDisplay.innerHTML = `
                <span class="player-piece player-${this.currentPlayer}"></span>
                <span>Spieler ${this.currentPlayer}</span>
            `;
        }
        
        if (currentPlayerIndicator) {
            currentPlayerIndicator.innerHTML = `
                <span class="player-indicator active">
                    <span class="player-piece player-${this.currentPlayer}"></span>
                    Spieler ${this.currentPlayer} ist am Zug
                </span>
            `;
        }
    }

    /**
     * Update score display
     * @private
     */
    updateScoreDisplay() {
        const player1Score = document.getElementById('player1Score');
        const player2Score = document.getElementById('player2Score');
        
        if (player1Score) {
            player1Score.textContent = this.scores.player1;
        }
        
        if (player2Score) {
            player2Score.textContent = this.scores.player2;
        }
    }

    /**
     * Update game status
     * @private
     */
    updateGameStatus(message) {
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) {
            gameStatus.textContent = message;
        }
    }

    /**
     * Show message to user
     * @private
     */
    showMessage(message, type = 'info') {
        console.log(`💬 ${type.toUpperCase()}: ${message}`);
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    /**
     * Setup modal system
     * @private
     */
    setupModalSystem() {
        // Help modal handlers
        const helpModal = document.getElementById('helpModal');
        const closeHelpBtn = document.getElementById('closeHelpBtn');
        const closeHelpFooterBtn = document.getElementById('closeHelpFooterBtn');
        
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => this.hideModal('helpModal'));
        }
        
        if (closeHelpFooterBtn) {
            closeHelpFooterBtn.addEventListener('click', () => this.hideModal('helpModal'));
        }
        
        // Assistance modal handlers
        const assistanceModal = document.getElementById('assistanceModal');
        const closeAssistanceBtn = document.getElementById('closeAssistanceBtn');
        const closeAssistanceFooterBtn = document.getElementById('closeAssistanceFooterBtn');
        
        if (closeAssistanceBtn) {
            closeAssistanceBtn.addEventListener('click', () => this.hideModal('assistanceModal'));
        }
        
        if (closeAssistanceFooterBtn) {
            closeAssistanceFooterBtn.addEventListener('click', () => this.hideModal('assistanceModal'));
        }
        
        // Click outside to close
        [helpModal, assistanceModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideModal(modal.id);
                    }
                });
            }
        });
        
        console.log('✅ L-Game modal system setup complete');
    }

    /**
     * Show help modal
     */
    showHelpModal() {
        this.showModal('helpModal');
    }

    /**
     * Show assistance modal
     */
    showAssistanceModal() {
        this.showModal('assistanceModal');
    }

    /**
     * Show modal
     * @private
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide modal
     * @private
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    /**
     * Get current game state
     */
    getGameState() {
        return {
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            moveCount: this.moveCount,
            scores: { ...this.scores },
            selectedLPiece: this.selectedLPiece,
            interactionMode: this.interactionMode,
            currentOrientation: this.currentOrientation
        };
    }

    /**
     * Cleanup and destroy UI
     */
    destroy() {
        // Destroy components
        if (this.animationManager) {
            this.animationManager.destroy();
        }
        
        if (this.interactionHandler) {
            this.interactionHandler.destroy();
        }
        
        if (this.boardRenderer) {
            this.boardRenderer.destroy();
        }
        
        // Clear state
        this.isInitialized = false;
        
        console.log('🧹 L-Game UI destroyed');
    }
}