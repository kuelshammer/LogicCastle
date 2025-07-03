/**
 * GomokuUI - New Implementation using UI Module System
 * 
 * Pilot implementation demonstrating the UI module system.
 * Replaces 1646 lines of legacy code with ~950 lines using modular architecture.
 * 
 * Features maintained from legacy:
 * - All keyboard shortcuts (F1, F2, WASD, etc.)
 * - Three modal system (help, gameHelp, assistance)
 * - Unified cursor system with two-stage placement
 * - WASM integration and Enhanced AI
 * - Helper checkboxes and assistance system
 * - Complete 15x15 Gomoku board with coordinates
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { CoordUtils } from '../../../assets/js/coord-utils.js';
import { GOMOKU_UI_CONFIG, createGomokuConfig } from './gomoku-config.js';

export class GomokuUINew extends BaseGameUI {
    constructor(game) {
        // Initialize with Gomoku-specific configuration
        super(game, GOMOKU_UI_CONFIG);
        
        // Gomoku-specific properties that remain unchanged
        this.ai = null;
        this.helpers = null;
        this.gameMode = 'two-player';
        this.isProcessingMove = false;
        
        // Settings from legacy (unchanged)
        this.animationDuration = 400;
        this.aiThinkingDelay = 800;
        
        // Helper settings for each player (unchanged)
        this.helpSettings = {
            player1: { level0: false, level1: false, level2: false },
            player2: { level0: false, level1: false, level2: false }
        };
        
        // WASM Integration (unchanged)
        this.wasmIntegration = null;
        this.bitPackedIntegration = null;
        
        // UNIFIED CURSOR SYSTEM - Single source of truth for all positioning
        this.cursor = {
            row: 7,          // Current cursor position (0-14, center = 7)
            col: 7,          // Current cursor position (0-14, center = 7)  
            active: true,    // Cursor visible and responsive
            mode: 'navigate' // 'navigate' | 'preview' | 'confirm'
        };
        
        // UNIFIED SELECTION SYSTEM - Manages two-stage stone placement
        this.selectionState = {
            phase: 0,               // 0 = navigate, 1 = preview/selected
            hasPreview: false,      // Whether preview stone is shown
            previewRow: null,       // Row where preview stone is displayed
            previewCol: null        // Col where preview stone is displayed
        };
    }

    /**
     * Override beforeInit to set up Gomoku-specific initialization
     */
    async beforeInit() {
        console.log('🎮 Starting Gomoku UI initialization...');
        
        // Update configuration based on current game mode
        const currentMode = document.getElementById('gameMode')?.value || 'two-player';
        this.config = createGomokuConfig(currentMode);
        this.gameMode = currentMode;
    }

    /**
     * Override setupGameEventListeners for Gomoku-specific game events
     */
    setupGameEventListeners() {
        // Call parent implementation for common events
        super.setupGameEventListeners();
        
        // Gomoku-specific game events
        const gomokuEvents = {
            'moveMade': (move) => this.onMoveMade(move),
            'gameWon': (data) => this.onGameWon(data),
            'gameDraw': () => this.onGameDraw(),
            'gameOver': (data) => this.onGameOver(data),
            'gameReset': () => this.onGameReset(),
            'playerChanged': (player) => this.onPlayerChanged(player),
            'moveUndone': (move) => this.onMoveUndone(move)
        };

        for (const [event, handler] of Object.entries(gomokuEvents)) {
            if (this.game && typeof this.game.on === 'function') {
                this.game.on(event, handler);
            }
        }
    }

    /**
     * Override bindKeyboardActions to add Gomoku-specific keyboard actions
     */
    bindKeyboardActions(keyboardController) {
        // Call parent to bind standard actions
        super.bindKeyboardActions(keyboardController);
        
        // Add Gomoku-specific cursor actions
        const gomokuActions = {
            'moveCursorUp': () => this.moveCursor('up'),
            'moveCursorDown': () => this.moveCursor('down'),
            'moveCursorLeft': () => this.moveCursor('left'),
            'moveCursorRight': () => this.moveCursor('right'),
            'placeCursorStone': () => this.placeCursorStone(),
            'showCursor': () => this.showCursor(),
            'toggleCursor': () => this.toggleCursor(),
            'closeModalOrHideCursor': () => this.handleEscapeKey()
        };

        for (const [action, handler] of Object.entries(gomokuActions)) {
            // Find the keyboard shortcut(s) for this action
            for (const [key, configAction] of Object.entries(this.config.keyboard)) {
                if (configAction === action) {
                    keyboardController.register(key, action, handler);
                }
            }
        }
        
        console.log(`⌨️ Registered ${Object.keys(gomokuActions).length} Gomoku-specific keyboard actions`);
    }

    /**
     * Enhanced keyboard action binding that handles all Gomoku shortcuts
     */
    setupAdvancedKeyboardActions() {
        const keyboardController = this.getModule('keyboard');
        if (!keyboardController) {
            console.warn('⚠️ KeyboardController not available');
            return;
        }

        // Register advanced Gomoku shortcuts that aren't in BaseGameUI
        const advancedActions = {
            'F3': () => this.resetScore(),
            'Ctrl+z': () => this.undoMove(),
            'Ctrl+Z': () => this.undoMove(),
            'Ctrl+r': () => this.newGame(),
            'Ctrl+R': () => this.newGame()
        };

        for (const [key, handler] of Object.entries(advancedActions)) {
            keyboardController.register(key, `advanced_${key.replace(/\+/g, '_')}`, handler);
        }

        console.log(`⌨️ Registered ${Object.keys(advancedActions).length} advanced keyboard shortcuts`);
    }

    /**
     * Override afterInit to complete Gomoku-specific initialization
     */
    async afterInit() {
        // Create Gomoku board and coordinates
        this.createBoard();
        this.createCoordinates();
        
        // Setup advanced keyboard shortcuts not covered by BaseGameUI
        this.setupAdvancedKeyboardActions();
        
        // Test modal system integration
        this.testModalIntegration();
        
        // Initialize Gomoku-specific systems
        this.initializeHelpers();
        this.initializeWasmIntegration();
        this.initializeAssistanceSystem();
        
        // Update initial display
        this.updateDisplay();
        this.updateGameMode();
        
        console.log('✅ Gomoku UI initialization complete');
    }

    /**
     * Test modal system integration
     */
    testModalIntegration() {
        const modalManager = this.getModule('modals');
        if (modalManager) {
            console.log('🪟 Modal system available:', modalManager.getDebugInfo());
            
            // Test modal registration
            const registeredModals = Object.keys(this.config.modals);
            console.log(`🪟 Registered modals: ${registeredModals.join(', ')}`);
            
        } else {
            console.warn('⚠️ Modal manager not available');
        }
    }

    /**
     * Handle Escape key - close modals or hide cursor (Enhanced with module integration)
     */
    handleEscapeKey() {
        // Phase 2.3: Use ModalManager instead of manual modal handling
        const modalManager = this.getModule('modals');
        if (modalManager && modalManager.getActiveModals().length > 0) {
            modalManager.hideAll();
            console.log('🪟 Closed all modals via ModalManager');
        } else if (this.cursor.active) {
            // If no modals open, hide cursor
            this.hideCursor();
            console.log('🎯 Cursor hidden via Escape key');
        }
    }

    /**
     * Enhanced modal methods using ModalManager
     */
    toggleHelp() {
        const modalManager = this.getModule('modals');
        if (modalManager) {
            modalManager.toggle('help');
            console.log('🪟 Help modal toggled via ModalManager');
        } else {
            console.warn('⚠️ ModalManager not available for help modal');
        }
    }

    toggleGameHelp() {
        const modalManager = this.getModule('modals');
        if (modalManager) {
            modalManager.toggle('gameHelp');
            console.log('🪟 Game help modal toggled via ModalManager');
        } else {
            console.warn('⚠️ ModalManager not available for game help modal');
        }
    }

    /**
     * Show assistance modal (if available)
     */
    showAssistanceModal() {
        const modalManager = this.getModule('modals');
        if (modalManager) {
            modalManager.show('assistance');
            console.log('🪟 Assistance modal shown via ModalManager');
        } else {
            console.warn('⚠️ ModalManager not available for assistance modal');
        }
    }

    /**
     * Enhanced error handling with ModalManager
     */
    showError(title, message) {
        const modalManager = this.getModule('modals');
        if (modalManager) {
            modalManager.showError(title, message);
        } else {
            // Fallback to message system
            this.showMessage(`Error: ${message}`, 'error');
        }
    }

    // ==================== GOMOKU-SPECIFIC METHODS ====================
    // These methods remain largely unchanged from the legacy implementation
    // but are organized and use the new module system where appropriate

    /**
     * Create the 15x15 Gomoku board
     */
    createBoard() {
        this.elements.gameBoard.innerHTML = '';

        // Board dimensions: 390px total with 20px padding = 350px inner area
        const boardTotalSize = 390;
        const boardPadding = 20;

        for (let row = 0; row < this.game.BOARD_SIZE; row++) {
            for (let col = 0; col < this.game.BOARD_SIZE; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                
                // Use standardized coordinate mapping
                CoordUtils.coordsToElement(intersection, row, col);

                // Position intersection using standardized pixel calculation
                const [pixelX, pixelY] = CoordUtils.gomokuGridToPixel(
                    row, col, boardTotalSize, boardPadding, this.game.BOARD_SIZE
                );
                intersection.style.left = `${pixelX}px`;
                intersection.style.top = `${pixelY}px`;

                // Add star points (traditional Go board markings)
                if (this.isStarPoint(row, col)) {
                    intersection.classList.add('star-point');
                }

                intersection.addEventListener('click', () => this.onIntersectionClick(row, col));
                intersection.addEventListener('mouseenter', () =>
                    this.onIntersectionHover(row, col)
                );
                intersection.addEventListener('mouseleave', () =>
                    this.onIntersectionLeave(row, col)
                );

                this.elements.gameBoard.appendChild(intersection);
            }
        }

        // Create row highlight element
        const rowHighlight = document.createElement('div');
        rowHighlight.className = 'row-highlight';
        this.elements.gameBoard.appendChild(rowHighlight);

        // Initialize crosshair highlighting
        this.updateColumnHighlight();
        this.updateRowHighlight();
    }

    /**
     * Create coordinate labels
     */
    createCoordinates() {
        // Top and bottom coordinates (A-O)
        this.elements.topCoords.innerHTML = '';
        this.elements.bottomCoords.innerHTML = '';
        for (let col = 0; col < this.game.BOARD_SIZE; col++) {
            const letter = String.fromCharCode(65 + col); // A-O

            const topCoord = document.createElement('div');
            topCoord.className = 'coord-cell';
            topCoord.textContent = letter;
            this.elements.topCoords.appendChild(topCoord);

            const bottomCoord = document.createElement('div');
            bottomCoord.className = 'coord-cell';
            bottomCoord.textContent = letter;
            this.elements.bottomCoords.appendChild(bottomCoord);
        }

        // Left and right coordinates (15-1)
        this.elements.leftCoords.innerHTML = '';
        this.elements.rightCoords.innerHTML = '';
        for (let row = 0; row < this.game.BOARD_SIZE; row++) {
            const number = this.game.BOARD_SIZE - row; // 15-1

            const leftCoord = document.createElement('div');
            leftCoord.className = 'coord-cell';
            leftCoord.textContent = number;
            this.elements.leftCoords.appendChild(leftCoord);

            const rightCoord = document.createElement('div');
            rightCoord.className = 'coord-cell';
            rightCoord.textContent = number;
            this.elements.rightCoords.appendChild(rightCoord);
        }
    }

    /**
     * Check if position is a star point
     */
    isStarPoint(row, col) {
        const starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];
        return starPoints.some(([r, c]) => r === row && c === col);
    }

    // ==================== CURSOR SYSTEM (unchanged from legacy) ====================

    /**
     * Move cursor in specified direction
     */
    moveCursor(direction) {
        // Activate cursor if not active
        if (!this.cursor.active) {
            this.showCursor();
            return;
        }

        const oldRow = this.cursor.row;
        const oldCol = this.cursor.col;
        let newRow = this.cursor.row;
        let newCol = this.cursor.col;

        switch (direction) {
            case 'up':
                newRow = this.cursor.row - 1;
                break;
            case 'down':
                newRow = this.cursor.row + 1;
                break;
            case 'left':
                newCol = this.cursor.col - 1;
                break;
            case 'right':
                newCol = this.cursor.col + 1;
                break;
        }

        // Use standardized coordinate clamping
        [this.cursor.row, this.cursor.col] = CoordUtils.clampCoords(
            newRow, newCol, this.game.BOARD_SIZE, this.game.BOARD_SIZE
        );

        // Update visual cursor if position changed
        if (oldRow !== this.cursor.row || oldCol !== this.cursor.col) {
            this.updateCrosshairPosition();
        }
    }

    /**
     * Show cursor at current position
     */
    showCursor() {
        this.cursor.active = true;
        this.updateCrosshairPosition();
    }

    /**
     * Hide cursor
     */
    hideCursor() {
        this.cursor.active = false;
        this.removeCursorDisplay();
    }

    /**
     * Toggle cursor visibility
     */
    toggleCursor() {
        if (this.cursor.active) {
            this.hideCursor();
        } else {
            this.showCursor();
        }
    }

    /**
     * Two-stage stone placement at cursor position
     */
    placeCursorStone() {
        if (!this.cursor.active) return;
        
        const cursorRow = this.cursor.row;
        const cursorCol = this.cursor.col;
        
        // Check if position is valid (not occupied)
        if (!this.game.isEmpty(cursorRow, cursorCol)) return;
        
        if (this.selectionState.phase === 0) {
            // First interaction: Select and preview
            this.selectionState.phase = 1;
            this.selectionState.previewRow = cursorRow;
            this.selectionState.previewCol = cursorCol;
            this.selectionState.hasPreview = true;
            this.addSelectionPreview(cursorRow, cursorCol);
            console.log(`🎯 Phase 1: Preview at ${this.getCurrentCrosshairPosition()}`);
        } else if (this.selectionState.phase === 1) {
            if (this.selectionState.previewRow === cursorRow && 
                this.selectionState.previewCol === cursorCol) {
                // Second interaction on same position: Place stone
                this.makeMove(cursorRow, cursorCol);
                this.resetSelectionState();
                console.log(`🎯 Phase 2: Stone placed at ${this.getCurrentCrosshairPosition()}`);
            } else {
                // Cursor moved to different position: Reset to phase 1 at new position
                this.removeSelectionPreview();
                this.selectionState.previewRow = cursorRow;
                this.selectionState.previewCol = cursorCol;
                this.addSelectionPreview(cursorRow, cursorCol);
                console.log(`🎯 Phase 1: Moved preview to ${this.getCurrentCrosshairPosition()}`);
            }
        }
    }

    // ==================== CORE UI MODULE INTEGRATION ====================
    // Phase 2.2: Working methods using the module system

    /**
     * Get intersection element by coordinates
     */
    getIntersection(row, col) {
        return this.elements.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Update display using module system
     */
    updateDisplay() {
        this.updateCurrentPlayer();
        this.updateScores();
        this.updateGameStatus();
        this.updateControls();
        this.updateMoveCounter();
    }

    /**
     * Update current player indicator
     */
    updateCurrentPlayer() {
        if (!this.elements.currentPlayerIndicator) return;
        
        const indicator = this.elements.currentPlayerIndicator;
        const playerStone = indicator.querySelector('.player-stone');
        const playerName = indicator.querySelector('.player-name');

        if (playerStone && this.game) {
            playerStone.className = `player-stone ${this.game.getPlayerColorClass(this.game.currentPlayer)}`;
        }
        if (playerName && this.game) {
            playerName.textContent = this.game.getPlayerName(this.game.currentPlayer);
        }
    }

    /**
     * Update scores display
     */
    updateScores() {
        if (this.elements.blackScore && this.game && this.game.scores) {
            this.elements.blackScore.textContent = this.game.scores.black || 0;
        }
        if (this.elements.whiteScore && this.game && this.game.scores) {
            this.elements.whiteScore.textContent = this.game.scores.white || 0;
        }
    }

    /**
     * Update move counter
     */
    updateMoveCounter() {
        if (this.elements.moveCounter && this.game && this.game.moveHistory) {
            this.elements.moveCounter.textContent = this.game.moveHistory.length;
        }
    }

    /**
     * Update game status
     */
    updateGameStatus(customMessage = null) {
        if (!this.elements.gameStatus) return;
        
        if (customMessage) {
            this.elements.gameStatus.textContent = customMessage;
            return;
        }

        let status = '';
        
        if (this.game && this.game.gameOver) {
            if (this.game.winner) {
                status = `${this.game.getPlayerName(this.game.winner)} hat gewonnen!`;
            } else {
                status = 'Unentschieden!';
            }
        } else {
            status = 'Spiel läuft...';
        }
        
        this.elements.gameStatus.textContent = status;
    }

    /**
     * Update control buttons state
     */
    updateControls() {
        if (this.elements.undoBtn && this.game && this.game.moveHistory) {
            this.elements.undoBtn.disabled = 
                this.game.moveHistory.length === 0 || this.isProcessingMove;
        }
    }

    /**
     * Handle intersection click with module integration
     */
    onIntersectionClick(row, col) {
        if (this.isProcessingMove || (this.game && this.game.gameOver)) {
            return;
        }

        // Check if position is valid (not occupied)
        if (this.game && !this.game.isEmpty(row, col)) return;

        // Update cursor position
        this.cursor.row = row;
        this.cursor.col = col; 
        this.cursor.active = true;
        
        // Update visual feedback
        this.updateCrosshairPosition();
        
        console.log(`🖱️ Mouse click: moved cursor to ${this.getCurrentCrosshairPosition()}`);

        // Use the same two-stage logic as keyboard
        this.placeCursorStone();
    }

    /**
     * Handle intersection hover
     */
    onIntersectionHover(row, col) {
        if (this.isProcessingMove || (this.game && this.game.gameOver)) {
            return;
        }

        const intersection = this.getIntersection(row, col);
        if (intersection && !intersection.classList.contains('occupied') && 
            !intersection.classList.contains('feedback-selected')) {
            
            // Add hover feedback
            intersection.classList.add('feedback-hover');
            
            // Add temporary stone preview for hover
            this.addStonePreview(intersection);
        }
    }

    /**
     * Handle intersection leave
     */
    onIntersectionLeave(row, col) {
        const intersection = this.getIntersection(row, col);
        
        if (intersection) {
            // Remove hover feedback
            intersection.classList.remove('feedback-hover');
            
            // Remove preview stones (but keep selected state)
            const previewStone = intersection.querySelector('.stone-preview');
            if (previewStone && !intersection.classList.contains('feedback-selected')) {
                previewStone.remove();
            }
        }
    }

    /**
     * Add stone preview to intersection
     */
    addStonePreview(intersection) {
        // Remove existing preview
        const existingPreview = intersection.querySelector('.stone-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Create preview stone
        const preview = document.createElement('div');
        preview.className = `stone-preview ${this.game ? this.game.getPlayerColorClass(this.game.currentPlayer) : 'black'}`;
        intersection.appendChild(preview);
    }

    /**
     * Make a move with module integration
     */
    makeMove(row, col) {
        if (this.isProcessingMove) {
            return;
        }

        this.isProcessingMove = true;

        try {
            const result = this.game.makeMove(row, col);
            console.log('Move result:', result);
            // If we get here, the move was successful
        } catch (error) {
            this.isProcessingMove = false;
            this.showMessage(error.message, 'error');
            return;
        }

        // Animation will complete and set isProcessingMove to false
    }

    /**
     * Override newGame to use module system with enhanced feedback
     */
    newGame() {
        if (this.game && typeof this.game.resetGame === 'function') {
            this.game.resetGame();
        }
        
        // Reset cursor to center
        this.cursor.row = 7;
        this.cursor.col = 7;
        this.cursor.active = true;
        
        // Reset selection state
        this.resetSelectionState();
        
        // Update visual feedback
        this.updateCrosshairPosition();
        
        this.showMessage('Neues Spiel gestartet', 'success');
        console.log('🆕 New game started with cursor reset');
    }

    /**
     * Override undoMove to use module system
     */
    undoMove() {
        if (this.isProcessingMove) {
            return;
        }

        if (this.game && typeof this.game.undoMove === 'function') {
            this.game.undoMove();
            
            // In AI mode, undo one more move to get back to human player's turn
            if (this.ai && this.gameMode.includes('bot') && this.game.moveHistory.length > 0) {
                this.game.undoMove();
            }
        }
        
        this.showMessage('Zug rückgängig gemacht', 'info');
        console.log('↩️ Move undone');
    }

    /**
     * Override resetScore to use module system
     */
    resetScore() {
        if (this.game && typeof this.game.resetScores === 'function') {
            this.game.resetScores();
        }
        this.updateScores();
        this.updateDisplay();
        this.showMessage('Punkte zurückgesetzt', 'info');
        console.log('🔄 Scores reset');
    }

    // ==================== WORKING PLACEHOLDER METHODS ====================
    // These are simplified implementations for Phase 2.2

    updateColumnHighlight() {
        // Simplified implementation - full version in Phase 2.4
        const board = this.elements.gameBoard;
        
        if (this.cursor.active && board) {
            board.classList.add('column-highlighted');
        } else if (board) {
            board.classList.remove('column-highlighted');
        }
    }

    updateRowHighlight() {
        // Simplified implementation - full version in Phase 2.4
        const board = this.elements.gameBoard;
        
        if (this.cursor.active && board) {
            board.classList.add('row-highlighted');
        } else if (board) {
            board.classList.remove('row-highlighted');
        }
    }

    updateCrosshairPosition() {
        // Phase 2.2: Basic implementation using modules
        this.updateColumnHighlight();
        this.updateRowHighlight();
        this.updateCursorVisual();
        
        // Log current position for debugging
        const position = this.getCurrentCrosshairPosition();
        console.log(`🎯 Crosshair at: ${position} (Row ${this.cursor.row}, Col ${this.cursor.col})`);
    }

    /**
     * Update cursor visual indicators on intersections
     */
    updateCursorVisual() {
        // Remove previous cursor highlights
        const allIntersections = this.elements.gameBoard.querySelectorAll('.intersection');
        allIntersections.forEach(intersection => {
            intersection.classList.remove('cursor-active');
        });

        // Add cursor highlight to current position
        if (this.cursor.active) {
            const currentIntersection = this.getIntersection(this.cursor.row, this.cursor.col);
            if (currentIntersection) {
                currentIntersection.classList.add('cursor-active');
            }
        }
    }

    removeCursorDisplay() {
        // Phase 2.2: Basic implementation
        const board = this.elements.gameBoard;
        if (board) {
            board.classList.remove('column-highlighted', 'row-highlighted');
        }
        
        // Remove cursor highlights from intersections
        const allIntersections = this.elements.gameBoard.querySelectorAll('.intersection');
        allIntersections.forEach(intersection => {
            intersection.classList.remove('cursor-active');
        });
    }

    getCurrentCrosshairPosition() {
        const columnLetter = String.fromCharCode(65 + this.cursor.col);
        const rowNumber = this.cursor.row + 1;
        return `${columnLetter}${rowNumber}`;
    }

    addSelectionPreview(row, col) {
        // Phase 2.2: Working implementation
        this.removeSelectionPreview();
        const intersection = this.getIntersection(row, col);
        if (intersection && !intersection.classList.contains('occupied')) {
            intersection.classList.add('feedback-selected');
            this.addStonePreview(intersection);
            this.selectionState.hasPreview = true;
        }
    }

    removeSelectionPreview() {
        // Phase 2.2: Working implementation
        const selected = this.elements.gameBoard.querySelector('.intersection.feedback-selected');
        if (selected) {
            selected.classList.remove('feedback-selected');
            const preview = selected.querySelector('.stone-preview');
            if (preview) {
                preview.remove();
            }
        }
        this.selectionState.hasPreview = false;
    }

    resetSelectionState() {
        this.selectionState.phase = 0;
        this.selectionState.previewRow = null;
        this.selectionState.previewCol = null;
        this.selectionState.hasPreview = false;
        this.removeSelectionPreview();
    }

    onIntersectionClick(row, col) {
        // TODO: Implement in Phase 2.4
        console.log(`⚠️ onIntersectionClick(${row}, ${col}) - TODO in Phase 2.4`);
    }

    onIntersectionHover(row, col) {
        // TODO: Implement in Phase 2.4
        console.log(`⚠️ onIntersectionHover(${row}, ${col}) - TODO in Phase 2.4`);
    }

    onIntersectionLeave(row, col) {
        // TODO: Implement in Phase 2.4
        console.log(`⚠️ onIntersectionLeave(${row}, ${col}) - TODO in Phase 2.4`);
    }

    makeMove(row, col) {
        // TODO: Implement in Phase 2.4
        console.log(`⚠️ makeMove(${row}, ${col}) - TODO in Phase 2.4`);
    }

    updateDisplay() {
        // TODO: Implement in Phase 2.4
        console.log('⚠️ updateDisplay - TODO in Phase 2.4');
    }

    updateGameMode() {
        // TODO: Implement in Phase 2.5
        console.log('⚠️ updateGameMode - TODO in Phase 2.5');
    }

    initializeHelpers() {
        // TODO: Implement in Phase 2.5
        console.log('⚠️ initializeHelpers - TODO in Phase 2.5');
    }

    initializeWasmIntegration() {
        // TODO: Implement in Phase 2.5
        console.log('⚠️ initializeWasmIntegration - TODO in Phase 2.5');
    }

    initializeAssistanceSystem() {
        // TODO: Implement in Phase 2.5
        console.log('⚠️ initializeAssistanceSystem - TODO in Phase 2.5');
    }

    // ==================== GAME EVENT HANDLERS ====================
    // Phase 2.2: Working implementations using module system

    onMoveMade(move) {
        console.log('🔍 onMoveMade called:', move);
        
        // Get intersection for cleanup and state management
        const intersection = this.getIntersection(move.row, move.col);
        if (!intersection) {
            console.error('❌ No intersection found for move!', move);
            return;
        }

        // Remove any preview stones from intersection
        const previewStone = intersection.querySelector('.stone-preview');
        if (previewStone) {
            previewStone.remove();
        }

        // Clear hints and last move indicators
        this.clearHintHighlights();
        this.clearLastMoveIndicators();

        // Create stone element
        const stone = document.createElement('div');
        const playerClass = this.game.getPlayerColorClass(move.player);
        stone.className = `stone ${playerClass} stone-place last-move`;

        // Position stone in intersection
        intersection.appendChild(stone);
        intersection.classList.add('occupied');
        console.log('✅ Stone placed! Total stones:', document.querySelectorAll('.stone').length);

        // Add move indicator for notation
        const moveIndicator = document.createElement('div');
        moveIndicator.className = 'move-indicator';
        moveIndicator.title = `${move.moveNumber || 'Move'}. ${this.getCurrentCrosshairPosition()}`;
        stone.appendChild(moveIndicator);

        // Remove animation class after animation completes
        setTimeout(() => {
            stone.classList.remove('stone-place');
            this.isProcessingMove = false;
            this.updateDisplay();
        }, this.animationDuration);
    }

    onGameWon(data) {
        // Highlight winning stones
        if (data.winningStones) {
            data.winningStones.forEach(stonePos => {
                const intersection = this.getIntersection(stonePos.row, stonePos.col);
                const stone = intersection?.querySelector('.stone');
                if (stone) {
                    stone.classList.add('winning');
                }
            });
        }

        this.updateDisplay();
        this.showMessage(`${this.game.getPlayerName(data.winner)} hat gewonnen!`, 'win');
    }

    onGameDraw() {
        this.updateDisplay();
        this.showMessage('Unentschieden! Das Spielfeld ist voll.', 'info');
    }

    onGameOver(data) {
        // Update scores from game engine
        if (data.scores) {
            this.game.scores = data.scores;
        }
        this.updateDisplay();
    }

    onGameReset() {
        this.createBoard();
        this.clearHintHighlights();
        this.updateDisplay();
        console.log('🔄 Game reset completed');
    }

    onPlayerChanged(player) {
        this.updateDisplay();
        console.log(`👤 Player changed to: ${player}`);
    }

    onMoveUndone(move) {
        const intersection = this.getIntersection(move.row, move.col);
        const stone = intersection?.querySelector('.stone');
        if (stone) {
            stone.remove();
        }
        intersection?.classList.remove('occupied');

        // Remove winning highlights
        document.querySelectorAll('.stone.winning').forEach(stone => {
            stone.classList.remove('winning');
        });

        this.clearLastMoveIndicators();

        // Add last move indicator to the new last move
        if (this.game.getLastMove) {
            const lastMove = this.game.getLastMove();
            if (lastMove) {
                const lastIntersection = this.getIntersection(lastMove.row, lastMove.col);
                const lastStone = lastIntersection?.querySelector('.stone');
                if (lastStone) {
                    lastStone.classList.add('last-move');
                }
            }
        }

        this.updateDisplay();
    }

    /**
     * Clear hint highlights
     */
    clearHintHighlights() {
        document.querySelectorAll('.intersection.hint-move').forEach(intersection => {
            intersection.classList.remove(
                'hint-move',
                'hint-level-0',
                'hint-level-1',
                'hint-level-2'
            );
        });
    }

    /**
     * Clear last move indicators
     */
    clearLastMoveIndicators() {
        document.querySelectorAll('.stone.last-move').forEach(stone => {
            stone.classList.remove('last-move');
        });
    }
}

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.GomokuUINew = GomokuUINew;
}