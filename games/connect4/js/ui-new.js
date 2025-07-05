/**
 * Connect4UI - New Implementation using UI Module System
 * 
 * Based on Gomoku goldstandard implementation.
 * Replaces traditional Connect4UI with modular architecture.
 * 
 * Features migrated from legacy:
 * - All keyboard shortcuts (F1, F2, F3, 1-7, etc.)
 * - Modal system (help, assistance)
 * - WASM integration and AI support
 * - Player assistance system with checkboxes
 * - Complete 6x7 Connect4 board with drop zones
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { CONNECT4_UI_CONFIG, createConnect4Config } from './connect4-config.js';

export class Connect4UINew extends BaseGameUI {
    constructor(game) {
        // Initialize with Connect4-specific configuration
        super(game, CONNECT4_UI_CONFIG);
        
        // Connect4-specific properties
        this.ai = null;
        this.gameMode = 'two-player';
        this.isProcessingMove = false;
        this.aiPlayer = 2; // Red player (WASM Player.Red)
        this.scores = { yellow: 0, red: 0 };
        
        // Settings from legacy
        this.animationDuration = 400;
        this.aiThinkingDelay = 800;
        
        // Player assistance settings
        this.assistanceSettings = {
            player1: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-columns': false 
            },
            player2: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-columns': false 
            }
        };
        
        // WASM Integration
        this.wasmIntegration = null;
        
        // Column hover state for preview system
        this.hoveredColumn = null;
        this.previewDisc = null;
    }

    /**
     * Override beforeInit to set up Connect4-specific initialization
     */
    async beforeInit() {
        console.log('🔴 Starting Connect4 UI initialization...');
        
        // Update configuration based on current game mode
        const currentMode = document.getElementById('gameMode')?.value || 'two-player';
        this.config = createConnect4Config(currentMode);
        this.gameMode = currentMode;
    }

    /**
     * Override afterInit to complete Connect4-specific setup
     */
    afterInit() {
        console.log('🔴 Completing Connect4 UI initialization...');
        
        // Initialize board and game-specific systems
        this.initializeBoard();
        this.setupColumnInteractions();
        this.setupAssistanceSystem();
        
        // Update initial UI state
        this.updateUI();
        
        console.log('✅ Connect4 UI fully initialized');
    }

    /**
     * Override setupGameEventListeners for Connect4-specific game events
     */
    setupGameEventListeners() {
        // Call parent implementation for common events
        super.setupGameEventListeners();
        
        // Connect4-specific game events
        const connect4Events = {
            'move': (move) => this.onMoveMade(move),
            'gameOver': (data) => this.onGameOver(data),
            'newGame': () => this.onGameReset(),
            'undo': (data) => this.onMoveUndone(data),
            'initialized': () => this.onGameInitialized(),
            'error': (error) => this.onGameError(error)
        };

        for (const [event, handler] of Object.entries(connect4Events)) {
            if (this.game && typeof this.game.on === 'function') {
                this.game.on(event, handler);
            }
        }
    }

    /**
     * Override bindKeyboardActions for Connect4-specific keyboard actions
     */
    bindKeyboardActions(keyboardController) {
        // Call parent implementation for common actions
        super.bindKeyboardActions(keyboardController);
        
        // Connect4-specific keyboard actions
        const connect4ActionMap = {
            'toggleAssistance': () => this.toggleModal('assistance'),
            'dropColumn1': () => this.dropDiscInColumn(0),
            'dropColumn2': () => this.dropDiscInColumn(1),
            'dropColumn3': () => this.dropDiscInColumn(2),
            'dropColumn4': () => this.dropDiscInColumn(3),
            'dropColumn5': () => this.dropDiscInColumn(4),
            'dropColumn6': () => this.dropDiscInColumn(5),
            'dropColumn7': () => this.dropDiscInColumn(6)
        };

        for (const [key, action] of Object.entries(this.config.keyboard)) {
            if (connect4ActionMap[action]) {
                keyboardController.register(key, action, connect4ActionMap[action]);
            }
        }
    }

    /**
     * Initialize the Connect4 board (6x7 grid)
     */
    initializeBoard() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) {
            console.error('❌ Game board element not found');
            return;
        }

        // Clear existing board
        gameBoard.innerHTML = '';
        gameBoard.className = 'game-board connect4-board';

        // Create 6x7 grid (42 slots total)
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const slot = document.createElement('div');
                slot.className = 'game-slot';
                slot.dataset.row = row;
                slot.dataset.col = col;
                slot.dataset.index = row * 7 + col;
                
                // Add empty disc placeholder
                const disc = document.createElement('div');
                disc.className = 'disc empty';
                slot.appendChild(disc);
                
                gameBoard.appendChild(slot);
            }
        }

        // Create coordinate displays
        this.createCoordinateLabels();
        
        console.log('🔴 Connect4 board initialized (6x7 grid)');
    }

    /**
     * Create coordinate labels for columns
     */
    createCoordinateLabels() {
        const topCoords = this.elements.topCoords;
        const bottomCoords = this.elements.bottomCoords;
        
        if (topCoords) {
            topCoords.innerHTML = '';
            for (let col = 1; col <= 7; col++) {
                const coord = document.createElement('div');
                coord.className = 'coord-label';
                coord.textContent = col;
                topCoords.appendChild(coord);
            }
        }
        
        if (bottomCoords) {
            bottomCoords.innerHTML = '';
            for (let col = 1; col <= 7; col++) {
                const coord = document.createElement('div');
                coord.className = 'coord-label';
                coord.textContent = col;
                bottomCoords.appendChild(coord);
            }
        }
    }

    /**
     * Setup column interactions (click, hover)
     */
    setupColumnInteractions() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        // Add column hover zones
        this.createColumnHoverZones();
        
        // Handle board clicks for column selection
        gameBoard.addEventListener('click', (event) => {
            const slot = event.target.closest('.game-slot');
            if (slot) {
                const col = parseInt(slot.dataset.col);
                this.onColumnClick(col);
            }
        });
    }

    /**
     * Create hover zones above each column for better UX
     */
    createColumnHoverZones() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        for (let col = 0; col < 7; col++) {
            const hoverZone = document.createElement('div');
            hoverZone.className = 'column-hover-zone';
            hoverZone.dataset.col = col;
            hoverZone.style.left = `${(col / 7) * 100}%`;
            hoverZone.style.width = `${100 / 7}%`;
            
            // Hover events for preview
            hoverZone.addEventListener('mouseenter', () => this.onColumnHover(col));
            hoverZone.addEventListener('mouseleave', () => this.onColumnHoverLeave());
            hoverZone.addEventListener('click', () => this.onColumnClick(col));
            
            gameBoard.parentElement.appendChild(hoverZone);
        }
    }

    /**
     * Handle column hover for preview
     */
    onColumnHover(col) {
        if (this.isProcessingMove || this.game.isGameOver()) return;
        
        this.hoveredColumn = col;
        this.showDropPreview(col);
        this.updateAssistanceHighlights();
    }

    /**
     * Handle column hover leave
     */
    onColumnHoverLeave() {
        this.hoveredColumn = null;
        this.hideDropPreview();
        this.clearAssistanceHighlights();
    }

    /**
     * Handle column click to drop disc
     */
    onColumnClick(col) {
        if (this.isProcessingMove || this.game.isGameOver()) {
            return;
        }

        this.dropDiscInColumn(col);
    }

    /**
     * Drop disc in specified column
     */
    dropDiscInColumn(col) {
        if (col < 0 || col >= 7) {
            console.warn(`Invalid column: ${col}`);
            return;
        }

        if (this.isProcessingMove) {
            console.log('Move already in progress, ignoring input');
            return;
        }

        try {
            this.isProcessingMove = true;
            console.log(`🔴 Dropping disc in column ${col + 1}`);
            
            // Hide preview
            this.hideDropPreview();
            
            // Make move through game engine
            const moveResult = this.game.makeMove(col);
            console.log('✅ Move successful:', moveResult);
            
        } catch (error) {
            console.error('❌ Failed to make move:', error);
            this.showMessage(`Ungültiger Zug: ${error.message}`, 'error');
        } finally {
            this.isProcessingMove = false;
        }
    }

    /**
     * Show drop preview for column
     */
    showDropPreview(col) {
        if (!this.game || this.game.isColumnFull(col)) return;
        
        const dropRow = this.game.getDropRow(col);
        if (dropRow === -1) return;
        
        const gameBoard = this.elements.gameBoard;
        const slot = gameBoard.querySelector(
            `.game-slot[data-row="${dropRow}"][data-col="${col}"]`
        );
        
        if (slot) {
            const disc = slot.querySelector('.disc');
            if (disc && disc.classList.contains('empty')) {
                const currentPlayer = this.game.getCurrentPlayer();
                const playerClass = currentPlayer === 1 ? 'yellow' : 'red';
                
                disc.classList.add('preview', playerClass);
                this.previewDisc = disc;
            }
        }
    }

    /**
     * Hide drop preview
     */
    hideDropPreview() {
        if (this.previewDisc) {
            this.previewDisc.classList.remove('preview', 'yellow', 'red');
            this.previewDisc = null;
        }
    }

    /**
     * Setup player assistance system
     */
    setupAssistanceSystem() {
        // Bind assistance checkboxes
        const features = ['undo', 'threats', 'winning-moves', 'blocked-columns'];
        const players = ['player1', 'player2'];
        
        for (const player of players) {
            for (const feature of features) {
                const checkboxId = `${player}-${feature}`;
                const checkbox = this.elements[checkboxId];
                
                if (checkbox) {
                    checkbox.addEventListener('change', () => {
                        this.assistanceSettings[player][feature] = checkbox.checked;
                        this.updateAssistanceHighlights();
                        console.log(`🎛️ ${player} ${feature}: ${checkbox.checked}`);
                    });
                }
            }
        }
    }

    /**
     * Update assistance highlights based on current settings
     */
    updateAssistanceHighlights() {
        this.clearAssistanceHighlights();
        
        if (!this.game || !this.game.isInitialized) return;
        
        const currentPlayer = this.game.getCurrentPlayer();
        const playerKey = currentPlayer === 1 ? 'player1' : 'player2';
        const settings = this.assistanceSettings[playerKey];
        
        // Show assistance highlights if enabled
        if (settings.threats) {
            this.highlightThreats();
        }
        
        if (settings['winning-moves']) {
            this.highlightWinningMoves();
        }
        
        if (settings['blocked-columns']) {
            this.highlightBlockedColumns();
        }
    }

    /**
     * Highlight threat columns
     */
    highlightThreats() {
        try {
            const blockingMoves = this.game.getBlockingMoves();
            this.highlightColumns(blockingMoves, 'threat');
        } catch (error) {
            console.warn('Failed to highlight threats:', error);
        }
    }

    /**
     * Highlight winning move columns
     */
    highlightWinningMoves() {
        try {
            const winningMoves = this.game.getWinningMoves();
            this.highlightColumns(winningMoves, 'winning');
        } catch (error) {
            console.warn('Failed to highlight winning moves:', error);
        }
    }

    /**
     * Highlight blocked/dangerous columns
     */
    highlightBlockedColumns() {
        try {
            const blockedCols = this.game.getBlockedColumns();
            this.highlightColumns(blockedCols, 'blocked');
        } catch (error) {
            console.warn('Failed to highlight blocked columns:', error);
        }
    }

    /**
     * Highlight specific columns with given class
     */
    highlightColumns(columns, highlightClass) {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        for (const col of columns) {
            const columnSlots = gameBoard.querySelectorAll(`.game-slot[data-col="${col}"]`);
            columnSlots.forEach(slot => {
                slot.classList.add(`highlight-${highlightClass}`);
            });
        }
    }

    /**
     * Clear all assistance highlights
     */
    clearAssistanceHighlights() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        const highlights = gameBoard.querySelectorAll('.game-slot');
        highlights.forEach(slot => {
            slot.classList.remove('highlight-threat', 'highlight-winning', 'highlight-blocked');
        });
    }

    /**
     * Update the board display with current game state
     */
    updateBoard() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard || !this.game) return;
        
        const board = this.game.getBoard();
        const slots = gameBoard.querySelectorAll('.game-slot');
        
        slots.forEach((slot, index) => {
            const disc = slot.querySelector('.disc');
            if (disc) {
                const cellValue = board[index];
                
                // Clear previous classes
                disc.classList.remove('empty', 'yellow', 'red', 'preview');
                
                if (cellValue === 0) {
                    disc.classList.add('empty');
                } else if (cellValue === 1) {
                    disc.classList.add('yellow');
                } else if (cellValue === 2) {
                    disc.classList.add('red');
                }
            }
        });
        
        // Update assistance highlights
        this.updateAssistanceHighlights();
    }

    /**
     * Update the entire UI (status, scores, buttons, etc.)
     */
    updateUI() {
        if (!this.game) return;
        
        this.updateBoard();
        this.updateGameStatus();
        this.updatePlayerIndicator();
        this.updateControls();
        this.updateScores();
    }

    /**
     * Update game status display
     */
    updateGameStatus() {
        const gameStatus = this.elements.gameStatus;
        if (!gameStatus || !this.game) return;
        
        if (this.game.isGameOver()) {
            const winner = this.game.getWinner();
            if (winner) {
                const playerName = winner === 1 ? 'Gelb' : 'Rot';
                gameStatus.textContent = `${playerName} hat gewonnen!`;
                gameStatus.className = 'game-status winner';
            } else {
                gameStatus.textContent = 'Unentschieden!';
                gameStatus.className = 'game-status draw';
            }
        } else {
            const currentPlayer = this.game.getCurrentPlayer();
            const playerName = currentPlayer === 1 ? 'Gelb' : 'Rot';
            
            if (this.isAiThinking && currentPlayer === this.aiPlayer) {
                gameStatus.textContent = 'KI denkt nach...';
                gameStatus.className = 'game-status ai-thinking';
            } else {
                gameStatus.textContent = `${playerName} ist am Zug`;
                gameStatus.className = 'game-status active';
            }
        }
    }

    /**
     * Update current player indicator
     */
    updatePlayerIndicator() {
        const indicator = this.elements.currentPlayerIndicator;
        if (!indicator || !this.game) return;
        
        const currentPlayer = this.game.getCurrentPlayer();
        const disc = indicator.querySelector('.player-disc');
        const name = indicator.querySelector('.player-name');
        
        if (disc) {
            disc.classList.remove('yellow', 'red');
            disc.classList.add(currentPlayer === 1 ? 'yellow' : 'red');
        }
        
        if (name) {
            name.textContent = currentPlayer === 1 ? 'Spieler 1' : 'Spieler 2';
        }
    }

    /**
     * Update control button states
     */
    updateControls() {
        const undoBtn = this.elements.undoBtn;
        if (undoBtn && this.game) {
            const canUndo = this.game.canUndo() && !this.game.isGameOver();
            undoBtn.disabled = !canUndo;
        }
        
        // Update move counter
        const moveCounter = this.elements.moveCounter;
        if (moveCounter && this.game) {
            moveCounter.textContent = this.game.getMoveCount();
        }
    }

    /**
     * Update score display
     */
    updateScores() {
        const yellowScore = this.elements.yellowScore;
        const redScore = this.elements.redScore;
        
        if (yellowScore) {
            yellowScore.textContent = this.scores.yellow;
        }
        
        if (redScore) {
            redScore.textContent = this.scores.red;
        }
    }

    // ==================== GAME EVENT HANDLERS ====================

    /**
     * Handle move made event
     */
    onMoveMade(moveData) {
        console.log('🔴 Move made:', moveData);
        this.updateUI();
        
        // Check for AI turn
        if (this.gameMode !== 'two-player' && !this.game.isGameOver()) {
            const currentPlayer = this.game.getCurrentPlayer();
            if (currentPlayer === this.aiPlayer) {
                setTimeout(() => this.makeAiMove(), this.aiThinkingDelay);
            }
        }
    }

    /**
     * Handle game over event
     */
    onGameOver(gameData) {
        console.log('🏁 Game over:', gameData);
        this.updateUI();
        
        // Update scores
        if (gameData.winner === 1) {
            this.scores.yellow++;
        } else if (gameData.winner === 2) {
            this.scores.red++;
        }
        
        this.updateScores();
        
        // Show game over message
        const winnerName = gameData.winner === 1 ? 'Gelb' : (gameData.winner === 2 ? 'Rot' : null);
        if (winnerName) {
            this.showMessage(`🏆 ${winnerName} hat gewonnen!`, 'win');
        } else {
            this.showMessage('🤝 Unentschieden!', 'info');
        }
    }

    /**
     * Handle game reset event
     */
    onGameReset() {
        console.log('🆕 Game reset');
        this.clearAssistanceHighlights();
        this.hideDropPreview();
        this.updateUI();
    }

    /**
     * Handle move undo event
     */
    onMoveUndone(undoData) {
        console.log('↩️ Move undone:', undoData);
        this.updateUI();
    }

    /**
     * Handle game initialization
     */
    onGameInitialized() {
        console.log('✅ Game engine initialized');
        this.updateUI();
    }

    /**
     * Handle game error
     */
    onGameError(error) {
        console.error('❌ Game error:', error);
        this.showMessage(`Spielfehler: ${error.message}`, 'error');
    }

    // ==================== AI INTEGRATION ====================

    /**
     * Make AI move (placeholder - integrate with Connect4AI)
     */
    async makeAiMove() {
        if (!this.ai || this.game.isGameOver()) return;
        
        try {
            this.isAiThinking = true;
            this.updateGameStatus();
            
            // Get AI move (integrate with existing Connect4AI)
            const aiMove = await this.ai.getBestMove(this.game.getBoard());
            
            if (aiMove !== null && aiMove >= 0 && aiMove < 7) {
                this.dropDiscInColumn(aiMove);
            }
        } catch (error) {
            console.error('❌ AI move failed:', error);
        } finally {
            this.isAiThinking = false;
            this.updateGameStatus();
        }
    }

    // ==================== GAME ACTION OVERRIDES ====================

    /**
     * Override newGame for Connect4-specific logic
     */
    newGame() {
        if (this.game) {
            this.game.newGame();
        }
        this.clearAssistanceHighlights();
        this.hideDropPreview();
        this.showMessage('Neues Spiel gestartet!', 'info');
    }

    /**
     * Override undoMove for Connect4-specific logic
     */
    undoMove() {
        try {
            if (this.game && this.game.canUndo()) {
                this.game.undoMove();
                this.showMessage('Zug rückgängig gemacht', 'info');
            }
        } catch (error) {
            console.error('Failed to undo move:', error);
            this.showMessage('Zug kann nicht rückgängig gemacht werden', 'error');
        }
    }

    /**
     * Override resetScore for Connect4-specific logic  
     */
    resetScore() {
        this.scores = { yellow: 0, red: 0 };
        this.updateScores();
        this.showMessage('Punkte zurückgesetzt', 'info');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Show toast message
     */
    showMessage(message, type = 'info') {
        const messageSystem = this.getModule('messages');
        if (messageSystem) {
            messageSystem.show(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Set AI instance
     */
    setAI(aiInstance) {
        this.ai = aiInstance;
        console.log('🤖 AI instance set');
    }

    /**
     * Set game mode
     */
    setGameMode(mode) {
        this.gameMode = mode;
        
        // Update configuration for new mode
        this.config = createConnect4Config(mode);
        
        // Apply mode-specific assistance defaults
        if (this.config.modeSettings.assistanceDefaults) {
            this.assistanceSettings = { ...this.config.modeSettings.assistanceDefaults };
            this.updateAssistanceCheckboxes();
        }
        
        console.log(`🎮 Game mode changed to: ${mode}`);
    }

    /**
     * Update assistance checkboxes based on current settings
     */
    updateAssistanceCheckboxes() {
        const features = ['undo', 'threats', 'winning-moves', 'blocked-columns'];
        const players = ['player1', 'player2'];
        
        for (const player of players) {
            for (const feature of features) {
                const checkboxId = `${player}-${feature}`;
                const checkbox = this.elements[checkboxId];
                
                if (checkbox) {
                    checkbox.checked = this.assistanceSettings[player][feature];
                }
            }
        }
    }
}