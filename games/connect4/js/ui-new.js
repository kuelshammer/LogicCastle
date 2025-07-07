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
        // Call parent implementation for common events (gameOver, newGame, move, undo)
        super.setupGameEventListeners();
        
        // Connect4-specific game events (excluding those already handled by parent)
        const connect4Events = {
            'moveMade': (move) => this.onMoveMade(move), // Alias for test compatibility
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
        
        // Use UI-Module System with Tailwind classes - container handles sizing
        gameBoard.className = 'game-board connect4-board game-board-cells';
        
        // Apply Connect4-specific styles with responsive constraints
        gameBoard.style.display = 'grid';
        gameBoard.style.gridTemplateColumns = 'repeat(7, 1fr)';
        gameBoard.style.gridTemplateRows = 'repeat(6, 1fr)';
        gameBoard.style.gap = '8px';
        gameBoard.style.aspectRatio = '7/6';
        gameBoard.style.background = '#1976d2';
        gameBoard.style.borderRadius = '16px';
        gameBoard.style.padding = '20px';
        gameBoard.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.2)';
        
        // Responsive sizing constraints to prevent oversized boards
        gameBoard.style.width = '100%';
        gameBoard.style.height = 'auto';
        gameBoard.style.maxWidth = 'min(80vw, calc(70vh * 7 / 6))';
        gameBoard.style.maxHeight = 'min(70vh, calc(80vw * 6 / 7))';
        
        console.log('🎨 Applied CSS Grid styles directly to ensure proper layout');

        // Create 6x7 grid (42 cells total)
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell game-slot'; // Both 'cell' for tests and 'game-slot' for functionality
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.index = row * 7 + col;
                
                // Apply cell styles directly
                cell.style.background = '#2196F3';
                cell.style.borderRadius = '50%';
                cell.style.border = '3px solid #1976D2';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.position = 'relative';
                cell.style.cursor = 'pointer';
                cell.style.aspectRatio = '1';
                
                // Add empty disc placeholder
                const disc = document.createElement('div');
                disc.className = 'disc empty';
                
                // Apply only essential layout styles, let CSS handle colors
                disc.style.width = '85%';
                disc.style.height = '85%';
                disc.style.borderRadius = '50%';
                disc.style.transition = 'all 0.3s ease';
                disc.style.position = 'relative';
                disc.style.aspectRatio = '1';
                
                cell.appendChild(disc);
                
                gameBoard.appendChild(cell);
            }
        }

        // Create coordinate displays
        this.createCoordinateLabels();
        
        // REMOVED: createDropZones() - redundant with coordinate labels + hover zones
        // Drop zones caused misalignment (percentage positioning vs CSS Grid)
        
        console.log('🔴 Connect4 board initialized (6x7 grid, 42 cells)');
    }

    /**
     * Create coordinate labels for columns
     */
    createCoordinateLabels() {
        let topCoords = this.elements.topCoords;
        let bottomCoords = this.elements.bottomCoords;
        
        // FORCE CSS GRID alignment by applying board dimensions to coordinate containers
        const gameBoard = this.elements.gameBoard;
        const boardStyles = {
            width: '100%',
            maxWidth: 'min(80vw, calc(70vh * 7 / 6))',
            maxHeight: 'min(70vh, calc(80vw * 6 / 7))',
            padding: '20px', // CRITICAL FIX: Match gameBoard padding exactly (all sides)
            margin: '0.25rem auto',
            boxSizing: 'border-box'
        };
        
        // Create coordinate containers if they don't exist
        if (!topCoords) {
            topCoords = document.createElement('div');
            topCoords.id = 'topCoords';
            topCoords.className = 'board-coords top';
            
            if (gameBoard && gameBoard.parentElement) {
                gameBoard.parentElement.insertBefore(topCoords, gameBoard);
            } else if (gameBoard) {
                // For tests: append to body if no parent
                document.body.appendChild(topCoords);
            }
            this.elements.topCoords = topCoords; // Update element reference
        }
        
        if (!bottomCoords) {
            bottomCoords = document.createElement('div');
            bottomCoords.id = 'bottomCoords';
            bottomCoords.className = 'board-coords bottom';
            
            if (gameBoard && gameBoard.parentElement) {
                gameBoard.parentElement.appendChild(bottomCoords);
            } else if (gameBoard) {
                // For tests: append to body if no parent
                document.body.appendChild(bottomCoords);
            }
            this.elements.bottomCoords = bottomCoords; // Update element reference
        }
        
        // Force CSS Grid styling directly to override any conflicting styles
        [topCoords, bottomCoords].forEach(container => {
            if (container) {
                // Apply CSS Grid with same dimensions as game board
                container.style.setProperty('display', 'grid', 'important');
                container.style.setProperty('grid-template-columns', 'repeat(7, 1fr)', 'important');
                container.style.setProperty('gap', '8px', 'important');
                
                // Apply same sizing constraints as game board
                Object.assign(container.style, boardStyles);
                
                console.log(`🎯 Forced CSS Grid alignment for ${container.id}:`, {
                    display: container.style.display,
                    gridTemplateColumns: container.style.gridTemplateColumns,
                    maxWidth: container.style.maxWidth
                });
            }
        });
        
        if (topCoords) {
            topCoords.innerHTML = '';
            for (let col = 1; col <= 7; col++) {
                const coord = document.createElement('div');
                coord.className = 'coord text-center font-bold text-sm';
                coord.style.color = '#666';
                coord.style.transition = 'all 0.3s ease';
                coord.style.padding = '0.25rem';
                coord.style.cursor = 'pointer';
                coord.textContent = col;
                coord.addEventListener('click', () => this.dropDiscInColumn(col - 1));
                topCoords.appendChild(coord);
            }
            console.log('🔢 Created', topCoords.children.length, 'top coord labels with FORCED CSS Grid alignment');
        }
        
        if (bottomCoords) {
            bottomCoords.innerHTML = '';
            for (let col = 1; col <= 7; col++) {
                const coord = document.createElement('div');
                coord.className = 'coord text-center font-bold text-sm';
                coord.style.color = '#666';
                coord.style.transition = 'all 0.3s ease';
                coord.style.padding = '0.25rem';
                coord.style.cursor = 'pointer';
                coord.textContent = col;
                coord.addEventListener('click', () => this.dropDiscInColumn(col - 1));
                bottomCoords.appendChild(coord);
            }
            console.log('🔢 Created', bottomCoords.children.length, 'bottom coord labels with FORCED CSS Grid alignment');
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
     * Uses CSS Grid positioning to match board column alignment
     */
    createColumnHoverZones() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;

        // Create a grid-based hover zone container that matches board dimensions
        const hoverContainer = document.createElement('div');
        hoverContainer.className = 'hover-zone-container';
        hoverContainer.style.position = 'absolute';
        hoverContainer.style.top = '-40px';
        hoverContainer.style.left = '0';
        hoverContainer.style.right = '0';
        hoverContainer.style.height = '40px';
        hoverContainer.style.display = 'grid';
        hoverContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
        hoverContainer.style.gap = '8px';
        hoverContainer.style.padding = '20px'; // Match board padding
        hoverContainer.style.boxSizing = 'border-box';
        hoverContainer.style.zIndex = '10';

        for (let col = 0; col < 7; col++) {
            const hoverZone = document.createElement('div');
            hoverZone.className = 'column-hover-zone';
            hoverZone.dataset.col = col;
            hoverZone.style.cursor = 'pointer';
            hoverZone.style.background = 'transparent';
            hoverZone.style.transition = 'background-color 0.2s ease';
            hoverZone.style.borderRadius = '8px';
            
            // Hover events for preview
            hoverZone.addEventListener('mouseenter', () => this.onColumnHover(col));
            hoverZone.addEventListener('mouseleave', () => this.onColumnHoverLeave());
            hoverZone.addEventListener('click', () => this.onColumnClick(col));
            
            hoverContainer.appendChild(hoverZone);
        }
        
        // Position relative to the game board container
        gameBoard.parentElement.style.position = 'relative';
        gameBoard.parentElement.appendChild(hoverContainer);
        
        console.log('🎯 Created CSS Grid-aligned hover zones for perfect column alignment');
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
    async dropDiscInColumn(col) {
        if (col < 0 || col >= 7) {
            console.warn(`Invalid column: ${col}`);
            return Promise.resolve();
        }

        if (this.isProcessingMove) {
            console.log('Move already in progress, ignoring input');
            return Promise.resolve();
        }

        try {
            this.isProcessingMove = true;
            console.log(`🔴 Dropping disc in column ${col + 1}`);
            
            // Hide preview
            this.hideDropPreview();
            
            // Make move through game engine
            const moveResult = await this.game.makeMove(col);
            console.log('✅ Move successful:', moveResult);
            
            return Promise.resolve(moveResult);
            
        } catch (error) {
            console.error('❌ Failed to make move:', error);
            this.showMessage(`Ungültiger Zug: ${error.message}`, 'error');
            return Promise.resolve(); // Don't throw, just resolve to handle gracefully
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
    updateGameStatus(customStatus = null) {
        const gameStatus = this.elements.gameStatus;
        if (!gameStatus) return;
        
        // Allow override for testing
        if (customStatus) {
            gameStatus.textContent = customStatus;
            return;
        }
        
        if (!this.game) return;
        
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
     * Handle move event (BaseGameUI expects this method)
     * Wrapper around onMoveMade for compatibility
     */
    onMove(moveData) {
        // Delegate to the existing onMoveMade method
        this.onMoveMade(moveData);
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
        // Reset the game engine
        if (this.game) {
            this.game.newGame();
        }
        
        // CRITICAL FIX: Reinitialize the visual board after game reset
        this.initializeBoard();
        
        // Clear UI state
        this.clearAssistanceHighlights();
        this.hideDropPreview();
        
        // Update UI to reflect new game state
        this.updateUI();
        
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

    // === MISSING METHODS FOR UNIT TEST COMPATIBILITY ===

    /**
     * Check if current game mode is AI mode
     */
    isAIMode() {
        // Check current DOM value first (for test compatibility)
        const gameModeElement = document.getElementById('gameMode');
        const currentMode = gameModeElement ? gameModeElement.value : this.gameMode;
        
        // Return boolean false for unknown modes (not empty string)
        if (!currentMode || currentMode === 'unknown-mode') {
            return false;
        }
        
        return currentMode && (currentMode.includes('vs-bot') || currentMode.includes('ai-'));
    }

    /**
     * Get AI difficulty from current game mode
     */
    getAIDifficulty() {
        // Check current DOM value first (for test compatibility)
        const gameModeElement = document.getElementById('gameMode');
        let currentMode = gameModeElement ? gameModeElement.value : this.gameMode;
        
        // Fallback to instance property if DOM value is empty
        if (!currentMode || currentMode.trim() === '') {
            currentMode = this.gameMode;
        }
        
        // Extract difficulty before checking if it's AI mode
        if (currentMode) {
            if (currentMode.includes('easy')) return 'easy';
            if (currentMode.includes('medium')) return 'medium';
            if (currentMode.includes('hard')) return 'hard';
        }
        
        // Return default for unknown modes
        return 'easy';
    }

    /**
     * Toggle assistance setting for specific player and type
     */
    toggleAssistance(player, type) {
        if (!this.assistanceSettings[player] || this.assistanceSettings[player][type] === undefined) {
            return false;
        }
        
        this.assistanceSettings[player][type] = !this.assistanceSettings[player][type];
        this.updateAssistanceCheckboxes();
        this.updateAssistanceHighlights();
        
        console.log(`🎛️ Toggled ${player} ${type}: ${this.assistanceSettings[player][type]}`);
        return this.assistanceSettings[player][type];
    }

    /**
     * Get current assistance setting for player and type
     */
    getAssistanceSetting(player, type) {
        return this.assistanceSettings[player] && this.assistanceSettings[player][type];
    }

    /**
     * Highlight specific column
     */
    highlightColumn(col, className = 'highlight') {
        if (col < 0 || col >= 7) return;
        
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // First clear all highlights
        this.clearColumnHighlights(className);
        
        // Add highlight to all cells in this column (using data attributes)
        const cells = gameBoard.querySelectorAll(`[data-col="${col}"]`);
        cells.forEach(cell => {
            cell.classList.add(className);
        });
        
        console.log(`🎯 Highlighted column ${col} with class ${className}`);
    }

    /**
     * Clear all column highlights
     */
    clearColumnHighlights(className = 'highlight') {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // Clear highlights from all elements with the class
        gameBoard.querySelectorAll(`.${className}`).forEach(cell => {
            cell.classList.remove(className);
        });
    }

    /**
     * Update scores display
     */
    updateScoresDisplay() {
        const yellowScoreElement = this.elements.yellowScore || document.getElementById('yellowScore');
        const redScoreElement = this.elements.redScore || document.getElementById('redScore');
        
        if (yellowScoreElement) {
            yellowScoreElement.textContent = this.scores.yellow || 0;
        }
        
        if (redScoreElement) {
            redScoreElement.textContent = this.scores.red || 0;
        }
        
        console.log(`📊 Scores updated: Yellow ${this.scores.yellow}, Red ${this.scores.red}`);
    }

    /**
     * Create drop zone elements for each column
     */
    createDropZones() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // Remove existing drop zones from gameBoard
        gameBoard.querySelectorAll('.drop-zone').forEach(zone => zone.remove());
        
        // Create drop zones directly in gameBoard for test compatibility
        for (let col = 0; col < 7; col++) {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.dataset.col = col;
            dropZone.dataset.dropCol = col; // For test compatibility
            dropZone.style.position = 'absolute';
            dropZone.style.left = `${(col / 7) * 100}%`;
            dropZone.style.width = `${100 / 7}%`;
            dropZone.style.height = '30px';
            dropZone.style.top = '-35px';
            dropZone.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
            dropZone.style.borderRadius = '8px';
            dropZone.style.background = 'rgba(255, 255, 255, 0.1)';
            dropZone.style.cursor = 'pointer';
            dropZone.style.display = 'flex';
            dropZone.style.alignItems = 'center';
            dropZone.style.justifyContent = 'center';
            dropZone.style.fontSize = '12px';
            dropZone.style.color = 'rgba(255, 255, 255, 0.7)';
            dropZone.style.zIndex = '10';
            dropZone.textContent = col + 1; // Show column number
            
            // Add hover effects
            dropZone.addEventListener('mouseenter', () => {
                dropZone.style.background = 'rgba(255, 255, 255, 0.2)';
                dropZone.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                this.onColumnHover(col);
            });
            
            dropZone.addEventListener('mouseleave', () => {
                dropZone.style.background = 'rgba(255, 255, 255, 0.1)';
                dropZone.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                this.onColumnHoverLeave();
            });
            
            // Add click handler
            dropZone.addEventListener('click', () => this.dropDiscInColumn(col));
            
            gameBoard.appendChild(dropZone);
        }
        
        console.log('🎯 Drop zones created for all 7 columns in gameBoard');
    }

    /**
     * Handle game initialization complete
     */
    onGameInitialized() {
        console.log('🎮 Game initialized successfully');
        this.updateUI();
        // REMOVED: createDropZones() - redundant and causes misalignment
    }

    /**
     * Handle move made event
     */
    onMoveMade(moveData) {
        console.log('✅ Move made:', moveData);
        
        if (moveData && typeof moveData === 'object') {
            const { row, col, player } = moveData;
            this.updateBoardVisual(row, col, player);
        }
        
        this.updateUI();
        this.hideDropPreview();
        
        // Check for AI turn if in AI mode
        if (this.isAIMode() && this.game.getCurrentPlayer() === this.aiPlayer) {
            setTimeout(() => this.makeAIMove(), this.aiThinkingDelay);
        }
    }

    /**
     * Update board visual representation after move
     */
    updateBoardVisual(row, col, player) {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        const slot = gameBoard.querySelector(
            `.game-slot[data-row="${row}"][data-col="${col}"]`
        );
        
        if (slot) {
            const disc = slot.querySelector('.disc');
            if (disc) {
                disc.classList.remove('empty', 'preview');
                disc.classList.add(player === 1 ? 'yellow' : 'red');
                
                // Apply player-specific colors directly
                if (player === 1) {
                    disc.style.background = '#FFD700'; // Yellow
                    disc.style.border = '3px solid #FFA000';
                    disc.style.boxShadow = '0 2px 8px rgba(255, 215, 0, 0.6)';
                } else {
                    disc.style.background = '#F44336'; // Red
                    disc.style.border = '3px solid #D32F2F';
                    disc.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.6)';
                }
                
                console.log(`🔴 Disc placed at (${row}, ${col}) for player ${player}`);
            }
        }
    }

    /**
     * Make AI move
     */
    async makeAIMove() {
        if (!this.ai || !this.isAIMode()) return;
        
        try {
            this.isProcessingMove = true;
            this.showMessage('🤖 KI denkt nach...', 'info');
            
            const difficulty = this.getAIDifficulty();
            const difficultyMap = { easy: 1, medium: 3, hard: 4 };
            const aiDifficulty = difficultyMap[difficulty] || 3;
            
            const bestMove = this.ai.getBestMove(this.game, aiDifficulty);
            
            if (bestMove >= 0 && bestMove < 7) {
                await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause
                this.dropDiscInColumn(bestMove);
                this.hideMessage();
            }
            
        } catch (error) {
            console.error('❌ AI move failed:', error);
            this.showMessage('KI-Fehler aufgetreten', 'error');
        } finally {
            this.isProcessingMove = false;
        }
    }
}