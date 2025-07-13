/**
 * LGameUI - L-Game Production UI Controller with BitPacked Engine
 * 
 * Implements the complete 3-layer architecture with BitPacked WASM integration.
 * Following Connect4 goldstandard pattern for L-Game.
 * 
 * Architecture:
 * - LAYER 1: WASM/Rust (3x BitPackedBoard<4,4,1> via LGameEngineBitPacked)
 * - LAYER 2: Game Logic/JavaScript (ui-production.js)
 * - LAYER 3: UI/Frontend (components + interactions)
 * 
 * Features:
 * - L-piece placement with 8 orientations
 * - Neutral piece movement
 * - BitPacked game state management
 * - Blockade victory detection
 * - Performance tracking
 * - Keyboard shortcuts
 * - Modal system
 */

// Import BitPacked engine and L-Game specific components
import { LGameEngineBitPacked } from './LGameEngineBitPacked.js';
import { LGameBoardRenderer } from './components/LGameBoardRenderer.js';
import { LGameInteractionHandler } from './components/LGameInteractionHandler.js';
import { LGameAnimationManager } from './components/LGameAnimationManager.js';

export class LGameUI {
    constructor(gameEngine = null) {
        // Initialize BitPacked engine if none provided
        this.gameEngine = gameEngine || new LGameEngineBitPacked();
        this.isInitialized = false;
        
        // Component instances
        this.boardRenderer = null;
        this.interactionHandler = null;
        this.animationManager = null;
        
        // Game state
        this.currentPlayer = 1; // 1=Yellow, 2=Red
        this.gameOver = false;
        this.moveCount = 0;
        this.gameHistory = [];
        
        // L-Game specific interaction state
        this.selectedLPiece = null;
        this.interactionMode = 'L_PIECE'; // 'L_PIECE' or 'NEUTRAL_PIECE'
        this.currentOrientation = 0; // 0-7 for L-piece orientations
        
        // Move phases
        this.movePhase = 'l-piece'; // 'l-piece' → 'neutral' → 'complete'
        this.pendingNeutralMove = null;
        
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
        
        // Performance tracking
        this.performanceStats = {
            totalMoves: 0,
            averageMoveTime: 0,
            memoryUsage: 0
        };
        
        console.log('🧩 L-Game UI initialized with BitPacked engine');
    }

    /**
     * Initialize the complete UI system with BitPacked engine
     */
    async init() {
        try {
            console.log('🚀 Initializing L-Game Production UI with BitPacked engine...');
            
            // Initialize BitPacked game engine first
            await this.initializeBitPackedEngine();
            
            // Initialize core UI components
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
            
            // Setup game engine event listeners
            this.setupGameEngineEvents();
            
            // Initialize game state
            this.initializeGameState();
            
            this.isInitialized = true;
            console.log('✅ L-Game Production UI with BitPacked engine fully initialized');
            
            return true;
            
        } catch (error) {
            console.error('❌ L-Game UI initialization failed:', error);
            this.showMessage('UI-System konnte nicht geladen werden.', 'error');
            return false;
        }
    }

    /**
     * Initialize BitPacked game engine
     * @private
     */
    async initializeBitPackedEngine() {
        if (!this.gameEngine.initialized) {
            console.log('🧩 Initializing BitPacked L-Game engine...');
            await this.gameEngine.init();
            
            // Update performance stats
            this.performanceStats = this.gameEngine.getPerformanceStats();
            console.log('✅ BitPacked engine initialized:', this.performanceStats);
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
     * Setup game engine event listeners
     * @private
     */
    setupGameEngineEvents() {
        // Listen to BitPacked engine events
        this.gameEngine.on('move', (data) => {
            this.onEngineMove(data);
        });

        this.gameEngine.on('lPieceMove', (data) => {
            this.onEngineLPieceMove(data);
        });

        this.gameEngine.on('neutralMove', (data) => {
            this.onEngineNeutralMove(data);
        });

        this.gameEngine.on('gameOver', (data) => {
            this.onEngineGameOver(data);
        });

        this.gameEngine.on('newGame', (data) => {
            this.onEngineNewGame(data);
        });

        console.log('✅ Game engine events setup complete');
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
     * Place L-piece on the board using BitPacked engine
     * @private
     */
    async placeLPiece(anchorRow, anchorCol, player, orientation) {
        try {
            // Make move directly with BitPacked engine
            const result = this.gameEngine.makeMove(anchorRow, anchorCol, orientation);
            
            // Animate L-piece placement
            if (this.animationManager) {
                const positions = this.calculateLPiecePositions(anchorRow, anchorCol, orientation);
                await this.animationManager.animateLPiecePlacement(positions, player, orientation);
            }
            
            // Update board visualization
            await this.updateBoardFromEngine();
            
            // Update UI state
            this.moveCount = result.moveNumber;
            this.currentPlayer = result.currentPlayer;
            this.gameOver = result.isGameOver;
            
            // Update display
            this.updateGameDisplay();
            
            // Check for victory
            if (result.isGameOver) {
                await this.handleGameEnd(result.winner);
            } else {
                // Proceed to neutral piece phase (optional)
                this.movePhase = 'neutral';
                this.updateGameStatus('Neutraler Stein bewegen (optional)');
            }
            
            console.log(`✅ L-piece placed: Player ${this.gameEngine.getPlayerName(player)} at (${anchorRow},${anchorCol}) orientation ${orientation}`);
            
        } catch (error) {
            console.error('❌ L-piece placement failed:', error);
            this.showMessage(`Ungültiger L-Stück Zug: ${error.message}`, 'warning');
        }
    }

    /**
     * Place neutral piece on the board using BitPacked engine
     * @private
     */
    async placeNeutralPiece(row, col) {
        try {
            // Check if there's a neutral piece to move
            const neutralPieces = this.gameEngine.getNeutralPieces();
            if (neutralPieces.length === 0) {
                this.showMessage('Keine neutralen Steine zum Bewegen verfügbar.', 'warning');
                return;
            }
            
            // For now, move the first neutral piece found to the target position
            const fromPos = neutralPieces[0];
            
            // Make neutral piece move
            const result = this.gameEngine.moveNeutralPiece(fromPos.row, fromPos.col, row, col);
            
            // Animate neutral piece movement
            if (this.animationManager) {
                await this.animationManager.animateNeutralPieceMovement(fromPos.row, fromPos.col, row, col);
            }
            
            // Update board visualization
            await this.updateBoardFromEngine();
            
            // Complete the turn
            this.movePhase = 'complete';
            this.updateGameStatus('Zug abgeschlossen - nächster Spieler');
            
            console.log(`✅ Neutral piece moved from (${fromPos.row},${fromPos.col}) to (${row},${col})`);
            
        } catch (error) {
            console.error('❌ Neutral piece placement failed:', error);
            this.showMessage(`Neutraler Stein konnte nicht bewegt werden: ${error.message}`, 'warning');
        }
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
     * Start new game with BitPacked engine
     */
    async startNewGame() {
        try {
            // Reset game engine
            this.gameEngine.newGame();
            
            // Reset UI state
            this.gameOver = false;
            this.moveCount = 0;
            this.currentPlayer = 1;
            this.selectedLPiece = 1;
            this.interactionMode = 'L_PIECE';
            this.currentOrientation = 0;
            this.movePhase = 'l-piece';
            this.pendingNeutralMove = null;
            this.gameHistory = [];
            
            // Clear visual effects
            if (this.animationManager) {
                this.animationManager.clearAllEffects();
            }
            
            // Reset board
            if (this.boardRenderer) {
                await this.boardRenderer.clearBoard();
                await this.boardRenderer.createBoard();
            }
            
            // Update board from engine state
            await this.updateBoardFromEngine();
            
            // Update display
            this.updateGameDisplay();
            this.updateGameStatus('Neues L-Game gestartet - L-Stück setzen');
            
            console.log('✅ New L-Game started with BitPacked engine');
            
        } catch (error) {
            console.error('❌ Failed to start new game:', error);
            this.showMessage('Neues Spiel konnte nicht gestartet werden.', 'error');
        }
    }

    /**
     * Update board visualization from BitPacked engine state
     * @private
     */
    async updateBoardFromEngine() {
        if (!this.gameEngine || !this.boardRenderer) return;
        
        const boardState = this.gameEngine.getBoard();
        if (!boardState) return;
        
        // Clear current board
        await this.boardRenderer.clearBoard();
        
        // Render board state
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cellValue = boardState[row][col];
                if (cellValue !== 0) {
                    let pieceType, player;
                    
                    if (cellValue === 1) {
                        pieceType = 'l-piece';
                        player = 1; // Yellow
                    } else if (cellValue === 2) {
                        pieceType = 'l-piece';
                        player = 2; // Red
                    } else if (cellValue === 3) {
                        pieceType = 'neutral';
                        player = null;
                    }
                    
                    // Render piece at position
                    await this.boardRenderer.renderPiece(row, col, pieceType, player);
                }
            }
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
        
        // Destroy game engine
        if (this.gameEngine) {
            this.gameEngine.destroy();
        }
        
        // Clear state
        this.isInitialized = false;
        
        console.log('🧹 L-Game UI destroyed');
    }

    // ==================== ENGINE EVENT HANDLERS ====================

    /**
     * Handle move event from BitPacked engine
     * @private
     */
    onEngineMove(data) {
        console.log('🎯 Engine move event:', data);
        this.updateBoardFromEngine();
        this.updateGameDisplay();
    }

    /**
     * Handle L-piece move event from BitPacked engine
     * @private
     */
    onEngineLPieceMove(data) {
        console.log('🧩 Engine L-piece move:', data);
        this.currentPlayer = data.currentPlayer;
        this.moveCount = data.moveNumber;
        
        if (data.canMoveNeutral) {
            this.movePhase = 'neutral';
            this.updateGameStatus('Neutraler Stein bewegen (optional)');
        } else {
            this.movePhase = 'complete';
        }
        
        this.updateGameDisplay();
    }

    /**
     * Handle neutral move event from BitPacked engine
     * @private
     */
    onEngineNeutralMove(data) {
        console.log('🔘 Engine neutral move:', data);
        this.movePhase = 'complete';
        this.updateGameStatus('Zug abgeschlossen');
        this.updateBoardFromEngine();
    }

    /**
     * Handle game over event from BitPacked engine
     * @private
     */
    onEngineGameOver(data) {
        console.log('🏁 Engine game over:', data);
        this.gameOver = true;
        this.handleGameEnd(data.winner);
    }

    /**
     * Handle new game event from BitPacked engine
     * @private
     */
    onEngineNewGame(data) {
        console.log('🆕 Engine new game:', data);
        this.updateBoardFromEngine();
        this.updateGameDisplay();
    }
}