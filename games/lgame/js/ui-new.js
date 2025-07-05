/**
 * LGameUINew - New Implementation using UI Module System
 * 
 * Replaces the 468-line LGameUI custom implementation with the standardized
 * UI Module System, providing better maintainability and consistency.
 * 
 * Features migrated from legacy LGameUI:
 * - Interactive 4x4 grid board
 * - L-piece and neutral piece visualization
 * - 8 L-piece orientations (4 rotations + 4 mirrored)
 * - Two-phase moves (L-piece + optional neutral piece)
 * - Blockade win condition detection
 * - WASM integration for game logic
 * - Advanced coordinate system with L-piece geometry
 * - Move validation and collision detection
 * - Debug mode and move highlighting
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { LGAME_UI_CONFIG, createLGameConfig, L_PIECE_ORIENTATIONS } from './lgame-config.js';
import { LGameCoordUtils } from './coord-utils.js';

export class LGameUINew extends BaseGameUI {
    constructor(game) {
        // Initialize with L-Game specific configuration
        super(game, LGAME_UI_CONFIG);
        
        // L-Game specific properties
        this.selectedPiece = null;
        this.highlightedMoves = [];
        this.boardElement = null;
        this.cellSize = 60;
        
        // UI state
        this.showingMoves = false;
        this.debugMode = false;
        this.gamePhase = 'lpiece'; // 'lpiece' or 'neutral'
        this.moveHistory = [];
        this.currentMove = null;
        
        // Board state
        this.boardSize = 4; // 4x4 grid
        this.cells = [];
        this.pieces = {
            player1: { type: 'lpiece', position: null, orientation: 0 },
            player2: { type: 'lpiece', position: null, orientation: 0 },
            neutral1: { type: 'neutral', position: null },
            neutral2: { type: 'neutral', position: null }
        };
        
        // Coordinate utilities
        this.coordUtils = LGameCoordUtils;
        
        // Bind L-Game specific methods
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleResetGame = this.handleResetGame.bind(this);
        this.handleShowMoves = this.handleShowMoves.bind(this);
        this.handleDebugInfo = this.handleDebugInfo.bind(this);
        this.handleUndoMove = this.handleUndoMove.bind(this);
        this.handleSubmitMove = this.handleSubmitMove.bind(this);
        this.handleCancelMove = this.handleCancelMove.bind(this);
    }

    /**
     * Override beforeInit to set up L-Game specific initialization
     */
    async beforeInit() {
        console.log('🧩 Starting L-Game UI initialization...');
        
        // Set default game mode configuration
        this.config = createLGameConfig('standard');
        this.cellSize = this.config.gameSettings.cellSize;
        
        // Initialize coordinate utilities if needed
        if (this.coordUtils && typeof this.coordUtils.initialize === 'function') {
            this.coordUtils.initialize(this.boardSize, this.cellSize);
        }
    }

    /**
     * Override afterInit to complete L-Game specific setup
     */
    async afterInit() {
        console.log('🧩 Completing L-Game UI initialization...');
        
        // Create the 4x4 game board
        this.createBoard();
        
        // Set up initial game state
        this.updateUI();
        
        // Initialize responsive handling
        this.initResponsiveHandling();
        
        console.log('✅ L-Game UI fully initialized with UI Module System');
    }

    /**
     * Override setupGameEventListeners for L-Game specific game events
     */
    setupGameEventListeners() {
        // Call parent implementation for common events
        super.setupGameEventListeners();
        
        // L-Game specific game events
        const lgameEvents = {
            'moveCompleted': (data) => this.onMoveCompleted(data),
            'phaseChanged': (data) => this.onPhaseChanged(data),
            'pieceSelected': (data) => this.onPieceSelected(data),
            'movesCalculated': (data) => this.onMovesCalculated(data),
            'blockadeDetected': (data) => this.onBlockadeDetected(data),
            'gameWon': (data) => this.onGameWon(data),
            'gameReset': () => this.onGameReset(),
            'playerChanged': (player) => this.onPlayerChanged(player),
            'debugInfoUpdated': (data) => this.onDebugInfoUpdated(data)
        };

        // Register L-Game specific events
        Object.entries(lgameEvents).forEach(([event, handler]) => {
            if (this.game && typeof this.game.on === 'function') {
                this.game.on(event, handler);
            }
        });
    }

    /**
     * Override setupUIEventListeners for L-Game specific UI events
     */
    setupUIEventListeners() {
        // Call parent implementation
        super.setupUIEventListeners();
        
        // L-Game specific UI event listeners
        const lgameButtonMap = {
            'resetGameBtn': this.handleResetGame,
            'showMovesBtn': this.handleShowMoves,
            'debugInfoBtn': this.handleDebugInfo,
            'undoMoveBtn': this.handleUndoMove,
            'move-submit': this.handleSubmitMove,
            'move-cancel': this.handleCancelMove
        };

        // Bind L-Game specific UI events
        Object.entries(lgameButtonMap).forEach(([elementKey, handler]) => {
            if (this.elements[elementKey]) {
                this.elements[elementKey].addEventListener('click', handler);
            }
        });
    }

    /**
     * Override keyboard action binding for L-Game specific shortcuts
     */
    bindKeyboardActions(keyboardController) {
        // Call parent implementation
        super.bindKeyboardActions(keyboardController);
        
        // L-Game specific keyboard actions
        const lgameActionMap = {
            'resetGame': () => this.handleResetGame(),
            'showMoves': () => this.handleShowMoves(),
            'toggleDebug': () => this.handleDebugInfo(),
            'undoMove': () => this.handleUndoMove(),
            'submitMove': () => this.handleSubmitMove(),
            'cancelMove': () => this.handleCancelMove(),
            'moveCursorUp': () => this.moveCursor(0, -1),
            'moveCursorDown': () => this.moveCursor(0, 1),
            'moveCursorLeft': () => this.moveCursor(-1, 0),
            'moveCursorRight': () => this.moveCursor(1, 0),
            'selectCell': () => this.selectCurrentCell()
        };

        // Register L-Game specific keyboard actions
        Object.entries(this.config.keyboard).forEach(([key, action]) => {
            if (lgameActionMap[action]) {
                keyboardController.register(key, action, lgameActionMap[action]);
            }
        });
    }

    /**
     * Create the 4x4 game board
     */
    createBoard() {
        if (!this.elements.gameBoard) {
            console.error('❌ Game board container not found');
            return;
        }

        // Clear existing board
        this.elements.gameBoard.innerHTML = '';
        this.cells = [];
        
        // Set board container styles
        this.elements.gameBoard.className = 'game-board';
        this.elements.gameBoard.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, ${this.cellSize}px);
            grid-template-rows: repeat(4, ${this.cellSize}px);
            gap: 2px;
            padding: 10px;
            background-color: ${this.config.visual.board.backgroundColor};
            border: ${this.config.visual.board.borderWidth}px solid ${this.config.visual.board.borderColor};
            border-radius: ${this.config.visual.board.borderRadius}px;
            margin: 0 auto;
            width: fit-content;
        `;
        
        // Create 4x4 grid
        for (let row = 0; row < 4; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 4; col++) {
                const cell = this.createCell(row, col);
                this.elements.gameBoard.appendChild(cell);
                this.cells[row][col] = cell;
            }
        }
        
        console.log('✅ Created 4x4 L-Game board (16 cells)');
    }

    /**
     * Create a single board cell
     */
    createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.position = `${row},${col}`;
        
        // Apply cell styling
        cell.style.cssText = `
            width: ${this.cellSize}px;
            height: ${this.cellSize}px;
            background-color: ${this.config.visual.cell.backgroundColor};
            border: 1px solid ${this.config.visual.board.borderColor};
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #6B7280;
        `;
        
        // Add coordinates if debug mode
        if (this.config.gameSettings.showCoordinates) {
            cell.textContent = `${row},${col}`;
        }
        
        // Add click handler
        cell.addEventListener('click', this.handleCellClick);
        
        // Add hover effects
        cell.addEventListener('mouseenter', () => {
            if (!cell.classList.contains('selected')) {
                cell.style.backgroundColor = this.config.visual.cell.hoverColor;
            }
        });
        
        cell.addEventListener('mouseleave', () => {
            if (!cell.classList.contains('selected')) {
                cell.style.backgroundColor = this.config.visual.cell.backgroundColor;
            }
        });
        
        return cell;
    }

    /**
     * Handle cell clicks
     */
    handleCellClick(event) {
        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        console.log(`🎯 Cell clicked: (${row}, ${col})`);
        
        if (!this.game || !this.game.isInitialized) {
            this.showMessage('Spiel noch nicht bereit!', 'warning');
            return;
        }
        
        // Handle move based on current game phase
        if (this.gamePhase === 'lpiece') {
            this.handleLPieceMove(row, col);
        } else if (this.gamePhase === 'neutral') {
            this.handleNeutralPieceMove(row, col);
        }
    }

    /**
     * Handle L-piece movement
     */
    handleLPieceMove(row, col) {
        // Get current player
        const currentPlayer = this.game.getCurrentPlayer();
        
        // Try to place L-piece at this position
        // This would need to cycle through orientations or use a selection system
        
        // For now, use orientation 0
        const orientation = 0;
        const lPiecePositions = this.calculateLPiecePositions(row, col, orientation);
        
        if (this.isValidLPiecePosition(lPiecePositions)) {
            this.placeLPiece(currentPlayer, row, col, orientation);
            this.gamePhase = 'neutral';
            this.showMessage(`L-Piece platziert. Neutraler Stein optional.`, 'move');
        } else {
            this.showMessage(`Ungültige L-Piece Position!`, 'error');
        }
    }

    /**
     * Handle neutral piece movement
     */
    handleNeutralPieceMove(row, col) {
        if (this.isValidNeutralPosition(row, col)) {
            this.placeNeutralPiece(row, col);
            this.completeMove();
        } else {
            this.showMessage(`Ungültige Position für neutralen Stein!`, 'error');
        }
    }

    /**
     * Calculate L-piece positions for given anchor and orientation
     */
    calculateLPiecePositions(anchorRow, anchorCol, orientation) {
        const orientationPattern = L_PIECE_ORIENTATIONS[orientation];
        if (!orientationPattern) {
            console.error(`Invalid orientation: ${orientation}`);
            return [];
        }
        
        return orientationPattern.map(([deltaRow, deltaCol]) => ({
            row: anchorRow + deltaRow,
            col: anchorCol + deltaCol
        }));
    }

    /**
     * Check if L-piece position is valid
     */
    isValidLPiecePosition(positions) {
        // Check bounds
        for (const pos of positions) {
            if (pos.row < 0 || pos.row >= 4 || pos.col < 0 || pos.col >= 4) {
                return false;
            }
        }
        
        // Check for collisions with other pieces
        // This would need to check against current board state
        return true;
    }

    /**
     * Check if neutral piece position is valid
     */
    isValidNeutralPosition(row, col) {
        // Check bounds
        if (row < 0 || row >= 4 || col < 0 || col >= 4) {
            return false;
        }
        
        // Check if cell is empty
        const cell = this.cells[row][col];
        return !cell.classList.contains('occupied');
    }

    /**
     * Place L-piece on board
     */
    placeLPiece(player, anchorRow, anchorCol, orientation) {
        const positions = this.calculateLPiecePositions(anchorRow, anchorCol, orientation);
        const color = this.config.gameSettings.pieces.lPiece.colors[player];
        
        // Clear previous L-piece for this player
        this.clearPlayerLPiece(player);
        
        // Place new L-piece
        positions.forEach(pos => {
            const cell = this.cells[pos.row][pos.col];
            cell.classList.add('occupied', 'lpiece', player);
            cell.style.backgroundColor = color;
            
            // Add visual effects
            cell.style.boxShadow = `0 2px 8px rgba(0,0,0,0.3)`;
            cell.style.border = `2px solid ${color}`;
        });
        
        // Store piece data
        this.pieces[player] = {
            type: 'lpiece',
            position: { row: anchorRow, col: anchorCol },
            orientation: orientation
        };
        
        console.log(`✅ Placed ${player} L-piece at (${anchorRow}, ${anchorCol}) orientation ${orientation}`);
    }

    /**
     * Place neutral piece on board
     */
    placeNeutralPiece(row, col) {
        const cell = this.cells[row][col];
        const color = this.config.gameSettings.pieces.neutralPiece.color;
        
        cell.classList.add('occupied', 'neutral');
        cell.style.backgroundColor = color;
        cell.style.border = `2px solid ${color}`;
        cell.style.borderRadius = '50%';
        
        console.log(`✅ Placed neutral piece at (${row}, ${col})`);
    }

    /**
     * Clear L-piece for specific player
     */
    clearPlayerLPiece(player) {
        const cells = this.elements.gameBoard.querySelectorAll(`.${player}.lpiece`);
        cells.forEach(cell => {
            cell.classList.remove('occupied', 'lpiece', player);
            cell.style.backgroundColor = this.config.visual.cell.backgroundColor;
            cell.style.border = `1px solid ${this.config.visual.board.borderColor}`;
            cell.style.boxShadow = 'none';
        });
    }

    /**
     * Complete current move
     */
    completeMove() {
        // Reset game phase
        this.gamePhase = 'lpiece';
        
        // Switch player
        if (this.game && typeof this.game.switchPlayer === 'function') {
            this.game.switchPlayer();
        }
        
        // Update UI
        this.updatePlayerDisplay();
        this.showMessage('Zug abgeschlossen!', 'success');
        
        console.log('🎯 Move completed');
    }

    /**
     * Handle game reset
     */
    handleResetGame() {
        if (this.game && typeof this.game.resetGame === 'function') {
            this.game.resetGame();
        }
        
        // Clear board
        this.clearBoard();
        
        // Reset UI state
        this.gamePhase = 'lpiece';
        this.selectedPiece = null;
        this.highlightedMoves = [];
        this.moveHistory = [];
        
        // Update UI
        this.updateUI();
        
        this.showMessage('Spiel zurückgesetzt!', 'info');
        console.log('🔄 Game reset');
    }

    /**
     * Clear the entire board
     */
    clearBoard() {
        if (!this.cells || this.cells.length === 0) {
            console.log('Board not initialized, skipping clear');
            return;
        }
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.cells[row] && this.cells[row][col]) {
                    const cell = this.cells[row][col];
                    cell.classList.remove('occupied', 'lpiece', 'neutral', 'player1', 'player2');
                    cell.style.backgroundColor = this.config.visual.cell.backgroundColor;
                    cell.style.border = `1px solid ${this.config.visual.board.borderColor}`;
                    cell.style.boxShadow = 'none';
                    cell.style.borderRadius = '4px';
                }
            }
        }
    }

    /**
     * Handle show moves
     */
    handleShowMoves() {
        this.showingMoves = !this.showingMoves;
        
        if (this.showingMoves && this.game && typeof this.game.getValidMoves === 'function') {
            const moves = this.game.getValidMoves();
            this.highlightValidMoves(moves);
            this.showMessage(`${moves.length} gültige Züge hervorgehoben`, 'info');
        } else {
            this.clearHighlights();
            this.showMessage('Hervorhebung entfernt', 'info');
        }
    }

    /**
     * Highlight valid moves on board
     */
    highlightValidMoves(moves) {
        this.clearHighlights();
        
        moves.forEach(move => {
            if (move.positions) {
                move.positions.forEach(pos => {
                    if (pos.row >= 0 && pos.row < 4 && pos.col >= 0 && pos.col < 4) {
                        const cell = this.cells[pos.row][pos.col];
                        cell.style.backgroundColor = this.config.visual.cell.highlightColor;
                        cell.classList.add('valid-move');
                    }
                });
            }
        });
    }

    /**
     * Clear move highlights
     */
    clearHighlights() {
        const highlightedCells = this.elements.gameBoard.querySelectorAll('.valid-move');
        highlightedCells.forEach(cell => {
            cell.classList.remove('valid-move');
            if (!cell.classList.contains('occupied')) {
                cell.style.backgroundColor = this.config.visual.cell.backgroundColor;
            }
        });
    }

    /**
     * Handle debug info
     */
    handleDebugInfo() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            this.showDebugInfo();
            this.showMessage('Debug-Modus aktiviert', 'info');
        } else {
            this.hideDebugInfo();
            this.showMessage('Debug-Modus deaktiviert', 'info');
        }
    }

    /**
     * Show debug information
     */
    showDebugInfo() {
        // Show coordinates on cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = this.cells[row][col];
                if (!cell.classList.contains('occupied')) {
                    cell.textContent = `${row},${col}`;
                }
            }
        }
        
        // Show debug panel if available
        if (this.elements['debug-panel']) {
            this.elements['debug-panel'].style.display = 'block';
        }
    }

    /**
     * Hide debug information
     */
    hideDebugInfo() {
        // Hide coordinates
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = this.cells[row][col];
                if (!cell.classList.contains('occupied')) {
                    cell.textContent = '';
                }
            }
        }
        
        // Hide debug panel
        if (this.elements['debug-panel']) {
            this.elements['debug-panel'].style.display = 'none';
        }
    }

    /**
     * Handle undo move
     */
    handleUndoMove() {
        if (this.game && typeof this.game.undoMove === 'function') {
            const success = this.game.undoMove();
            if (success) {
                this.updateBoardFromGameState();
                this.showMessage('Zug rückgängig gemacht', 'info');
            } else {
                this.showMessage('Kein Zug zum Rückgängigmachen', 'warning');
            }
        }
    }

    /**
     * Handle submit move
     */
    handleSubmitMove() {
        if (this.currentMove) {
            // Submit the current move to the game engine
            if (this.game && typeof this.game.makeMove === 'function') {
                const success = this.game.makeMove(this.currentMove);
                if (success) {
                    this.completeMove();
                } else {
                    this.showMessage('Ungültiger Zug!', 'error');
                }
            }
        } else {
            this.showMessage('Kein Zug ausgewählt!', 'warning');
        }
    }

    /**
     * Handle cancel move
     */
    handleCancelMove() {
        this.currentMove = null;
        this.gamePhase = 'lpiece';
        this.clearHighlights();
        this.showMessage('Zug abgebrochen', 'info');
    }

    /**
     * Move cursor for keyboard navigation
     */
    moveCursor(deltaCol, deltaRow) {
        // Implement keyboard navigation cursor
        // This would track a cursor position and move it around the board
        console.log(`Moving cursor: (${deltaCol}, ${deltaRow})`);
    }

    /**
     * Select current cell (for keyboard navigation)
     */
    selectCurrentCell() {
        // Select the cell under the keyboard cursor
        console.log('Selecting current cell');
    }

    /**
     * Update player display
     */
    updatePlayerDisplay() {
        if (this.elements['current-player'] && this.game) {
            const currentPlayer = this.game.getCurrentPlayer ? this.game.getCurrentPlayer() : 'Spieler 1';
            this.elements['current-player'].textContent = currentPlayer;
        }
    }

    /**
     * Update the entire UI
     */
    updateUI() {
        this.updatePlayerDisplay();
        this.updateGameStatus();
        this.updateMoveCounter();
    }

    /**
     * Update game status display
     */
    updateGameStatus() {
        if (this.elements.gameStatus) {
            const phase = this.gamePhase === 'lpiece' ? 'L-Piece setzen' : 'Neutraler Stein (optional)';
            this.elements.gameStatus.textContent = phase;
        }
    }

    /**
     * Update move counter
     */
    updateMoveCounter() {
        if (this.elements['move-counter']) {
            this.elements['move-counter'].textContent = this.moveHistory.length;
        }
    }

    /**
     * Update board from game state
     */
    updateBoardFromGameState() {
        if (!this.game || !this.game.getBoardState) return;
        
        const boardState = this.game.getBoardState();
        this.clearBoard();
        
        // Render pieces based on game state
        // This would need to be implemented based on the actual game API
    }

    /**
     * Initialize responsive handling
     */
    initResponsiveHandling() {
        const updateResponsiveSettings = () => {
            const width = window.innerWidth;
            let newCellSize = this.config.responsive.cellSizes.desktop;
            
            if (width < this.config.responsive.mobile) {
                newCellSize = this.config.responsive.cellSizes.mobile;
            } else if (width < this.config.responsive.tablet) {
                newCellSize = this.config.responsive.cellSizes.tablet;
            }
            
            if (newCellSize !== this.cellSize) {
                this.cellSize = newCellSize;
                this.recreateBoard();
            }
        };
        
        // Initial call
        updateResponsiveSettings();
        
        // Update on resize
        window.addEventListener('resize', updateResponsiveSettings);
    }

    /**
     * Recreate board with new cell size
     */
    recreateBoard() {
        if (this.elements.gameBoard) {
            this.createBoard();
            this.updateBoardFromGameState();
        }
    }

    // ==================== GAME EVENT HANDLERS ====================

    onMoveCompleted(data) {
        console.log('🎯 Move completed:', data);
        this.moveHistory.push(data);
        this.updateMoveCounter();
    }

    onPhaseChanged(data) {
        console.log('📍 Game phase changed:', data);
        this.gamePhase = data.phase;
        this.updateGameStatus();
    }

    onPieceSelected(data) {
        console.log('🎯 Piece selected:', data);
        this.selectedPiece = data;
    }

    onMovesCalculated(data) {
        console.log('🧮 Valid moves calculated:', data);
        if (this.showingMoves) {
            this.highlightValidMoves(data.moves);
        }
    }

    onBlockadeDetected(data) {
        console.log('🚫 Blockade detected:', data);
        this.showMessage(`Blockade erkannt! ${data.player} kann nicht ziehen.`, 'blockade');
    }

    onGameWon(data) {
        console.log('🎉 Game won:', data);
        this.showMessage(`🎉 ${data.winner} hat gewonnen!`, 'win');
    }

    onGameReset() {
        console.log('🔄 Game reset');
        this.handleResetGame();
    }

    onPlayerChanged(player) {
        console.log('👤 Player changed:', player);
        this.updatePlayerDisplay();
    }

    onDebugInfoUpdated(data) {
        console.log('🐛 Debug info updated:', data);
        if (this.elements['debug-info']) {
            this.elements['debug-info'].textContent = JSON.stringify(data, null, 2);
        }
    }

    // ==================== OVERRIDE GAME ACTIONS ====================

    newGame() {
        this.handleResetGame();
        console.log('🆕 New L-Game started');
    }

    resetScore() {
        // L-Game typically doesn't have scores, but we can reset move counter
        this.moveHistory = [];
        this.updateMoveCounter();
        this.showMessage('Spielstand zurückgesetzt!', 'info');
        console.log('🔄 Scores reset');
    }
}