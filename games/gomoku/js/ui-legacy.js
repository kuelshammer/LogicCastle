/**
 * GomokuUI - User Interface for Gomoku game
 */
import { CoordUtils } from '../../../assets/js/coord-utils.js';

export class GomokuUI {
    constructor(game) {
        this.game = game;
        this.ai = null;
        this.helpers = null;
        this.gameMode = 'two-player';
        this.isProcessingMove = false;

        // UI elements
        this.elements = {};

        // Settings
        this.animationDuration = 400;
        this.aiThinkingDelay = 800;

        // Helper settings for each player
        this.helpSettings = {
            player1: { level0: false, level1: false, level2: false },
            player2: { level0: false, level1: false, level2: false }
        };

        // WASM Integration
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

        // REMOVED: columnState, rowState, mouseState - all unified into cursor system
    }

    /**
     * Initialize the UI
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.createBoard();
        this.createCoordinates();
        this.initializeHelpers();
        this.initializeWasmIntegration();
        this.initializeAssistanceSystem();
        this.updateDisplay();
        this.updateGameMode();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            gameBoard: document.getElementById('gameBoard'),
            currentPlayerIndicator: document.getElementById('currentPlayerIndicator'),
            gameStatus: document.getElementById('gameStatus'),
            blackScore: document.getElementById('blackScore'),
            whiteScore: document.getElementById('whiteScore'),
            moveCounter: document.getElementById('moveCounter'),
            newGameBtn: document.getElementById('newGameBtn'),
            undoBtn: document.getElementById('undoBtn'),
            resetScoreBtn: document.getElementById('resetScoreBtn'),
            helpBtn: document.getElementById('helpBtn'),
            gameHelpBtn: document.getElementById('gameHelpBtn'),
            helpModal: document.getElementById('helpModal'),
            gameHelpModal: document.getElementById('gameHelpModal'),
            assistanceModal: document.getElementById('assistanceModal'),
            closeHelpBtn: document.getElementById('closeHelpBtn'),
            closeGameHelpBtn: document.getElementById('closeGameHelpBtn'),
            gameMode: document.getElementById('gameMode'),
            topCoords: document.getElementById('topCoords'),
            bottomCoords: document.getElementById('bottomCoords'),
            leftCoords: document.getElementById('leftCoords'),
            rightCoords: document.getElementById('rightCoords'),
            // Helper checkboxes
            helpPlayer1Level0: document.getElementById('helpPlayer1Level0'),
            helpPlayer1Level1: document.getElementById('helpPlayer1Level1'),
            helpPlayer1Level2: document.getElementById('helpPlayer1Level2'),
            helpPlayer2Level0: document.getElementById('helpPlayer2Level0'),
            helpPlayer2Level1: document.getElementById('helpPlayer2Level1'),
            helpPlayer2Level2: document.getElementById('helpPlayer2Level2')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Game events
        this.game.on('moveMade', move => this.onMoveMade(move));
        this.game.on('gameWon', data => this.onGameWon(data));
        this.game.on('gameDraw', () => this.onGameDraw());
        this.game.on('gameOver', data => this.onGameOver(data));
        this.game.on('gameReset', () => this.onGameReset());
        this.game.on('playerChanged', _player => this.onPlayerChanged(_player));
        this.game.on('moveUndone', move => this.onMoveUndone(move));

        // UI controls - with null checks
        if (this.elements.newGameBtn) {
            this.elements.newGameBtn.addEventListener('click', () => this.newGame());
        }
        if (this.elements.undoBtn) {
            this.elements.undoBtn.addEventListener('click', () => this.undoMove());
        }
        if (this.elements.resetScoreBtn) {
            this.elements.resetScoreBtn.addEventListener('click', () => this.resetScore());
        }
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', () => this.toggleHelp());
        }
        if (this.elements.gameHelpBtn) {
            this.elements.gameHelpBtn.addEventListener('click', () => this.toggleGameHelp());
        }
        if (this.elements.closeHelpBtn) {
            this.elements.closeHelpBtn.addEventListener('click', () => this.toggleHelp());
        }
        if (this.elements.closeGameHelpBtn) {
            this.elements.closeGameHelpBtn.addEventListener('click', () => this.toggleGameHelp());
        }
        if (this.elements.gameMode) {
            this.elements.gameMode.addEventListener('change', () => this.updateGameMode());
        }

        // Modal overlay clicks - with null checks
        if (this.elements.helpModal) {
            this.elements.helpModal.addEventListener('click', e => {
                if (e.target === this.elements.helpModal) {
                    this.toggleHelp();
                }
            });
        }

        if (this.elements.gameHelpModal) {
            this.elements.gameHelpModal.addEventListener('click', e => {
                if (e.target === this.elements.gameHelpModal) {
                    this.toggleGameHelp();
                }
            });
        }

        // Helper checkboxes
        this.setupHelperCheckboxes();
    }

    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', e => {
            // Don't handle keys when modal is open
            if (this.elements.helpModal && this.elements.helpModal.classList.contains('active')) {
                console.log('🚫 Help modal is active, blocking keyboard');
                if (e.key === 'Escape' || e.key === 'F1') {
                    e.preventDefault();
                    this.toggleHelp();
                }
                return;
            }

            if (this.elements.gameHelpModal && this.elements.gameHelpModal.classList.contains('active')) {
                console.log('🚫 Game help modal is active, blocking keyboard');
                if (e.key === 'Escape' || e.key === 'F2') {
                    e.preventDefault();
                    this.toggleGameHelp();
                }
                return;
            }

            if (this.elements.assistanceModal && this.elements.assistanceModal.classList.contains('active')) {
                console.log('🚫 Assistance modal is active, blocking keyboard');
                if (e.key === 'Escape' || e.key === 'F2') {
                    e.preventDefault();
                    // Close assistance modal
                    this.elements.assistanceModal.classList.remove('active');
                }
                return;
            }

            switch (e.key) {
                case 'F1':
                    e.preventDefault();
                    this.toggleHelp();
                    break;
                case 'F2':
                    e.preventDefault();
                    this.toggleGameHelp();
                    break;
                case 'F3':
                    e.preventDefault();
                    this.resetScore();
                    break;
                case 'n':
                case 'N':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.newGame();
                    }
                    break;
                case 'u':
                case 'U':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.undoMove();
                    }
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.newGame();
                    }
                    break;
                case 'z':
                case 'Z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.undoMove();
                    }
                    break;
                
                // WASD Cursor Navigation (Konfliktfrei)
                case 'w':
                case 'W':
                    e.preventDefault();
                    e.stopPropagation();
                    this.moveCursor('up');
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    e.stopPropagation();
                    this.moveCursor('down');
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    e.stopPropagation();
                    this.moveCursor('left');
                    break;
                case 'd':
                case 'D':
                    e.preventDefault();
                    e.stopPropagation();
                    this.moveCursor('right');
                    break;
                case 'x':
                case 'X':
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.cursor.active) {
                        this.placeCursorStone();
                    } else {
                        this.showCursor();
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    e.stopPropagation();
                    // Leertaste nur für Cursor-Aktivierung (kein Stone-Placement)
                    if (!this.cursor.active) {
                        this.showCursor();
                    }
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.toggleCursor();
                    break;
                case 'Escape':
                    if (this.cursor.active) {
                        e.preventDefault();
                        this.hideCursor();
                    }
                    break;
            }
        });

        // Add keyboard user class for better focus indicators
        document.addEventListener('keydown', () => {
            document.body.classList.add('keyboard-user');
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-user');
        });
    }

    /**
     * Create the game board
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
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} - True if star point
     */
    isStarPoint(row, col) {
        const starPoints = [
            [3, 3],
            [3, 11],
            [7, 7],
            [11, 3],
            [11, 11]
        ];
        return starPoints.some(([r, c]) => r === row && c === col);
    }

    /**
     * Update column highlight display
     */
    updateColumnHighlight() {
        const board = this.elements.gameBoard;
        
        if (this.cursor.active) {
            // Calculate cursor position using standardized coordinate mapping
            const [leftPosition, _] = CoordUtils.gomokuGridToPixel(
                0, this.cursor.col, 390, 20, this.game.BOARD_SIZE
            );
            
            // Update CSS custom property for column position
            board.style.setProperty('--highlight-column-left', `${leftPosition}px`);
            board.classList.add('column-highlighted');
        } else {
            board.classList.remove('column-highlighted');
        }
    }

    /**
     * Set selected column (0-14 for A-O)
     */
    setCursorColumn(columnIndex) {
        if (columnIndex >= 0 && columnIndex < this.game.BOARD_SIZE) {
            this.cursor.col = columnIndex;
            this.updateCrosshairPosition();
            
            // Log column selection for debugging
            const columnLetter = String.fromCharCode(65 + columnIndex);
            console.log(`🎯 Column selected: ${columnLetter} (${columnIndex})`);
        }
    }

    /**
     * Toggle column highlighting on/off
     */
    toggleCursor() {
        this.cursor.active = !this.cursor.active;
        this.updateCrosshairPosition();
        console.log(`🎯 Cursor ${this.cursor.active ? 'activated' : 'deactivated'}`);
    }

    /**
     * Update row highlight display
     */
    updateRowHighlight() {
        const board = this.elements.gameBoard;
        
        if (this.cursor.active) {
            // Calculate cursor position using standardized coordinate mapping
            const [_, topPosition] = CoordUtils.gomokuGridToPixel(
                this.cursor.row, 0, 390, 20, this.game.BOARD_SIZE
            );
            
            // Update CSS custom property for row position
            board.style.setProperty('--highlight-row-top', `${topPosition}px`);
            board.classList.add('row-highlighted');
        } else {
            board.classList.remove('row-highlighted');
        }
    }

    /**
     * Set selected row (0-14 for rows 1-15)
     */
    setCursorRow(rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.game.BOARD_SIZE) {
            this.cursor.row = rowIndex;
            this.updateRowHighlight();
            
            // Log row selection for debugging
            const rowNumber = rowIndex + 1; // Display as 1-15
            console.log(`🎯 Row selected: ${rowNumber} (${rowIndex})`);
        }
    }

    /**
     * UNIFIED: Update crosshair position (both column and row highlights)
     */
    updateCrosshairPosition() {
        this.updateColumnHighlight();
        this.updateRowHighlight();
        
        // Update cursor visual feedback
        this.updateCursorVisual();
        
        // Log current position for debugging
        this.logCrosshairPosition();
    }

    /**
     * UNIFIED: Update cursor visual indicators on intersections
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

    /**
     * UNIFIED: Move cursor with arrow keys (replaces moveColumnSelection and moveRowSelection)
     */
    moveCursor(direction) {
        const currentRow = this.cursor.row;
        const currentCol = this.cursor.col;
        let newRow = currentRow;
        let newCol = currentCol;

        switch (direction) {
            case 'left':
                // Move left with wrap-around: A(0) wraps to O(14)
                newCol = currentCol > 0 ? currentCol - 1 : 14;
                break;
            case 'right':
                // Move right with wrap-around: O(14) wraps to A(0)
                newCol = currentCol < 14 ? currentCol + 1 : 0;
                break;
            case 'up':
                // Move up with wrap-around: Row 1(0) wraps to Row 15(14)
                newRow = currentRow > 0 ? currentRow - 1 : 14;
                break;
            case 'down':
                // Move down with wrap-around: Row 15(14) wraps to Row 1(0)
                newRow = currentRow < 14 ? currentRow + 1 : 0;
                break;
            default:
                return; // Invalid direction
        }

        // Update cursor position
        this.cursor.row = newRow;
        this.cursor.col = newCol;
        
        // Update visual crosshair to follow cursor
        this.updateCrosshairPosition();
        
        // Reset selection state when cursor moves
        this.resetSelectionState();
        
        const newPosition = String.fromCharCode(65 + newCol) + (newRow + 1);
        console.log(`🎯 Cursor moved to ${newPosition} (${newRow}, ${newCol})`);
    }

    /**
     * Visual feedback for crosshair navigation
     */
    provideCrosshairFeedback() {
        const board = this.elements.gameBoard;
        board.style.transform = 'scale(1.02)';
        setTimeout(() => {
            board.style.transform = 'scale(1)';
        }, 150);

        // Log current crosshair position for debugging
        this.logCrosshairPosition();
    }

    /**
     * Get current crosshair position in chess notation
     */
    getCurrentCrosshairPosition() {
        const columnLetter = String.fromCharCode(65 + this.cursor.col); // A-O
        const rowNumber = this.cursor.row + 1; // 1-15
        return `${columnLetter}${rowNumber}`;
    }

    /**
     * Log current crosshair position for testing
     */
    logCrosshairPosition() {
        const position = this.getCurrentCrosshairPosition();
        console.log(`🎯 Crosshair at: ${position} (Row ${this.cursor.row}, Col ${this.cursor.col})`);
    }

    /**
     * Test if specific positions are reachable (Go-Line validation)
     */
    testCrosshairPositions() {
        const testPositions = [
            { name: 'A1', row: 0, col: 0, expectedPos: '20px,20px' },
            { name: 'A3', row: 2, col: 0, expectedPos: '20px,70px' },
            { name: 'H8', row: 7, col: 7, expectedPos: '195px,195px' },
            { name: 'H9', row: 8, col: 7, expectedPos: '195px,220px' },
            { name: 'B14', row: 13, col: 1, expectedPos: '45px,345px' },
            { name: 'O15', row: 14, col: 14, expectedPos: '370px,370px' },
            { name: 'O1', row: 0, col: 14, expectedPos: '370px,20px' },
            { name: 'A15', row: 14, col: 0, expectedPos: '20px,370px' }
        ];

        console.log('🧪 Testing Go-Line crosshair positioning:');
        testPositions.forEach(pos => {
            this.setSelectedRow(pos.row);
            this.setSelectedColumn(pos.col);
            
            const current = this.getCurrentCrosshairPosition();
            const success = current === pos.name;
            
            // Calculate actual pixel positions using standardized coordinate mapping
            const [colPx, rowPx] = CoordUtils.gomokuGridToPixel(
                pos.row, pos.col, 390, 20, this.game.BOARD_SIZE
            );
            const actualPos = `${colPx}px,${rowPx}px`;
            const posCorrect = actualPos === pos.expectedPos;
            
            console.log(`${success ? '✅' : '❌'} ${pos.name}: Chess ${current} | Pixels ${actualPos} ${posCorrect ? '✅' : '❌'}`);
        });

        // Reset to center and log final state
        this.setSelectedRow(7);
        this.setSelectedColumn(7);
        console.log('🎯 Reset to center: H8 (Grid Line 195px,195px)');
        console.log('📐 Line positions: A=20px, H=195px, O=370px | Row 1=20px, Row 8=195px, Row 15=370px');
    }

    /**
     * Validate that highlights are on actual grid lines
     */
    validateLineAlignment() {
        const board = this.elements.gameBoard;
        const columnLeft = parseFloat(board.style.getPropertyValue('--highlight-column-left')) || 195;
        const rowTop = parseFloat(board.style.getPropertyValue('--highlight-row-top')) || 195;
        
        // Grid lines are at: 20, 45, 70, 95, 120, 145, 170, 195, 220, 245, 270, 295, 320, 345, 370
        const validPositions = Array.from({length: 15}, (_, i) => 20 + i * 25);
        
        const columnValid = validPositions.includes(columnLeft);
        const rowValid = validPositions.includes(rowTop);
        
        console.log(`🔍 Alignment Check: Column ${columnLeft}px ${columnValid ? '✅' : '❌'} | Row ${rowTop}px ${rowValid ? '✅' : '❌'}`);
        
        return columnValid && rowValid;
    }

    /**
     * Update game mode
     */
    updateGameMode() {
        this.gameMode = this.elements.gameMode.value;

        // Initialize AI if needed
        if (this.gameMode.includes('bot')) {
            if (this.gameMode.includes('wasm')) {
                // Use Enhanced AI for WASM modes
                const difficulty = this.gameMode.includes('expert') ? 'wasm-expert' : 'wasm-smart';
                
                if (typeof window.EnhancedGobangAI !== 'undefined') {
                    this.ai = new window.EnhancedGobangAI(difficulty, this.wasmIntegration);
                    console.log(`🦀 Enhanced AI initialized: ${difficulty}`);
                    
                    // Configure AI based on difficulty
                    if (difficulty === 'wasm-expert') {
                        this.ai.setConfig({
                            strategicDepth: 5,
                            randomnessFactor: 0.05,
                            threatAwareness: true,
                            patternRecognition: true
                        });
                    }
                } else {
                    console.warn('⚠️ Enhanced AI not available, falling back to standard AI');
                    this.ai = new GobangAI('smart');
                }
            } else {
                // Legacy JavaScript AI is deprecated - use Enhanced AI as fallback
                console.warn('⚠️ JavaScript AI mode deprecated, using Enhanced AI instead');
                this.ai = new window.EnhancedGobangAI('smart', this.wasmIntegration);
            }
        } else {
            this.ai = null;
        }

        this.newGame();
    }

    /**
     * Handle intersection click - integrated with crosshair system
     */
    onIntersectionClick(row, col) {
        if (this.isProcessingMove || this.game.gameOver || this.isAITurn()) {
            return;
        }

        // Check if position is valid (not occupied)
        if (!this.game.isEmpty(row, col)) return;

        // UNIFIED: Move cursor to clicked position
        this.cursor.row = row;
        this.cursor.col = col; 
        this.cursor.active = true;
        
        // Update all visual feedback
        this.updateCrosshairPosition();
        
        console.log(`🖱️ Mouse click: moved cursor to ${this.getCurrentCrosshairPosition()}`);

        // Assistance System: Validate move before placement
        if (this.assistanceSystem) {
            const validation = this.assistanceSystem.validateMove(row, col);
            if (!validation.allowed) {
                if (validation.reason && validation.suggestion) {
                    alert(`${validation.reason}\n\n${validation.suggestion}`);
                }
                return; // Block the move
            }
        }

        // Use the same two-stage logic as spacebar
        this.placeCursorStone();
    }


    /**
     * Handle intersection hover
     */
    onIntersectionHover(row, col) {
        if (this.isProcessingMove || this.game.gameOver || this.isAITurn()) {
            return;
        }

        const intersection = this.getIntersection(row, col);
        if (!intersection.classList.contains('occupied') && 
            !intersection.classList.contains('feedback-selected')) {
            
            // Add hover feedback
            intersection.classList.add('feedback-hover');
            
            // Add temporary stone preview for hover
            this.addStonePreview(intersection);
        }
    }

    /**
     * Handle intersection leave (Phase 3: Enhanced feedback)
     */
    onIntersectionLeave(row, col) {
        const intersection = this.getIntersection(row, col);
        
        // Remove hover feedback
        intersection.classList.remove('feedback-hover');
        
        // Remove preview stones (but keep selected state)
        const previewStone = intersection.querySelector('.stone-preview');
        if (previewStone && !intersection.classList.contains('feedback-selected')) {
            previewStone.remove();
        }
        
        // Legacy cleanup
        const legacyPreview = intersection.querySelector('.stone.preview');
        if (legacyPreview) {
            legacyPreview.remove();
        }
    }

    /**
     * Make a move
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
     * Check if it's AI turn
     */
    isAITurn() {
        if (!this.ai || this.gameMode === 'two-player') {
            return false;
        }

        // In bot modes, black is human, white is AI
        return this.game.currentPlayer === this.game.WHITE;
    }

    /**
     * Process AI move
     */
    async processAIMove() {
        if (!this.ai || !this.isAITurn() || this.game.gameOver) {
            return;
        }

        this.isProcessingMove = true;

        // Show thinking state with AI type indicator
        const aiType = this.gameMode.includes('wasm') ? 'WASM-KI' : 'KI';
        this.updateGameStatus(`${aiType} überlegt...`);
        this.showThinkingIndicator();

        // Add thinking delay for better UX (shorter for WASM due to faster computation)
        const thinkingDelay = this.gameMode.includes('wasm') ? 600 : this.aiThinkingDelay;
        await new Promise(resolve => setTimeout(resolve, thinkingDelay));

        try {
            // Get move from AI (Enhanced AI returns more detailed move info)
            // Note: helpers parameter is deprecated, Enhanced AI uses WASM integration instead
            const move = await this.ai.getBestMove(this.game, null);

            this.hideThinkingIndicator();

            if (move && move.row !== undefined && move.col !== undefined) {
                // Log AI reasoning for Enhanced AI
                if (move.reasoning && this.gameMode.includes('wasm')) {
                    console.log(`🎯 ${aiType} Reasoning: ${move.reasoning}`);
                    if (move.strength !== undefined) {
                        console.log(`💪 Move Strength: ${move.strength}`);
                    }
                }
                
                this.makeMove(move.row, move.col);
            } else {
                console.error('❌ AI returned invalid move:', move);
                this.isProcessingMove = false;
            }
        } catch (error) {
            console.error('❌ AI move processing failed:', error);
            this.hideThinkingIndicator();
            this.isProcessingMove = false;
        }
    }

    /**
     * Show thinking indicator
     */
    showThinkingIndicator() {
        const indicator = this.elements.currentPlayerIndicator;
        const existingIndicator = indicator.querySelector('.thinking-indicator');
        if (!existingIndicator) {
            const aiType = this.gameMode.includes('wasm') ? 'WASM' : 'JS';
            const thinkingText = this.gameMode.includes('expert') ? 'Analysiert' : 'Denkt';
            
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = `thinking-indicator ${this.gameMode.includes('wasm') ? 'wasm-thinking' : 'js-thinking'}`;
            thinkingDiv.innerHTML = `
                <span>${thinkingText}</span>
                <small class="ai-type">(${aiType})</small>
                <div class="thinking-dots">
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                    <div class="thinking-dot"></div>
                </div>
            `;
            indicator.appendChild(thinkingDiv);
        }
    }

    /**
     * Hide thinking indicator
     */
    hideThinkingIndicator() {
        const indicator = this.elements.currentPlayerIndicator;
        const thinkingIndicator = indicator.querySelector('.thinking-indicator');
        if (thinkingIndicator) {
            thinkingIndicator.remove();
        }
    }

    /**
     * Get intersection element
     */
    getIntersection(row, col) {
        return this.elements.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Update display
     */
    updateDisplay() {
        this.updateCurrentPlayer();
        this.updateScores();
        this.updateGameStatus();
        this.updateControls();
        this.updateMoveCounter();
        
        // Update WASM move analysis dashboard
        // TODO: Re-enable when WASM integration is fixed
        // if (this.wasmIntegration) {
        //     this.wasmIntegration.updateAnalysisDashboard();
        // }
    }

    /**
     * Update current player indicator
     */
    updateCurrentPlayer() {
        const indicator = this.elements.currentPlayerIndicator;
        const playerStone = indicator.querySelector('.player-stone');
        const playerName = indicator.querySelector('.player-name');

        playerStone.className = `player-stone ${this.game.getPlayerColorClass(this.game.currentPlayer)}`;
        playerName.textContent = this.game.getPlayerName(this.game.currentPlayer);
    }

    /**
     * Update scores
     */
    updateScores() {
        this.elements.blackScore.textContent = this.game.scores.black;
        this.elements.whiteScore.textContent = this.game.scores.white;
    }

    /**
     * Update move counter
     */
    updateMoveCounter() {
        this.elements.moveCounter.textContent = this.game.moveHistory.length;
    }

    /**
     * Update game status
     */
    updateGameStatus(customMessage = null) {
        if (customMessage) {
            this.elements.gameStatus.textContent = customMessage;
            return;
        }

        let status = '';
        
        if (this.game.gameOver) {
            if (this.game.winner) {
                status = `${this.game.getPlayerName(this.game.winner)} hat gewonnen!`;
                // Show next starter info
                const nextStarter = this.game.getNextStarter();
                status += ` | Nächster Start: ${this.getPlayerNameFromString(nextStarter)}`;
            } else {
                status = 'Unentschieden!';
                const nextStarter = this.game.getNextStarter();
                status += ` | Nächster Start: ${this.getPlayerNameFromString(nextStarter)}`;
            }
        } else {
            status = 'Spiel läuft...';
            // Show starting player for current game
            if (this.game.getStartingPlayer) {
                const startingPlayer = this.game.getStartingPlayer();
                status += ` | Starter: ${this.getPlayerNameFromString(startingPlayer)}`;
            }
        }
        
        this.elements.gameStatus.textContent = status;
    }

    /**
     * Update control buttons
     */
    updateControls() {
        this.elements.undoBtn.disabled =
            this.game.moveHistory.length === 0 || this.isProcessingMove;
    }

    /**
     * Event handlers
     */

    onGameWon(data) {
        // Highlight winning stones
        data.winningStones.forEach(stonePos => {
            const intersection = this.getIntersection(stonePos.row, stonePos.col);
            const stone = intersection.querySelector('.stone');
            if (stone) {
                stone.classList.add('winning');
            }
        });

        this.updateDisplay();
        this.showMessage(`${this.game.getPlayerName(data.winner)} hat gewonnen!`, 'win');
    }

    onGameDraw() {
        this.updateDisplay();
        this.showMessage('Unentschieden! Das Spielfeld ist voll.', 'draw');
    }

    onGameOver(data) {
        // Update scores from game engine
        if (data.scores) {
            this.game.scores = data.scores;
        }
        this.updateDisplay();
    }

    onMoveUndone(move) {
        const intersection = this.getIntersection(move.row, move.col);
        const stone = intersection.querySelector('.stone');
        if (stone) {
            stone.remove();
        }
        intersection.classList.remove('occupied');

        // Remove winning highlights
        document.querySelectorAll('.stone.winning').forEach(stone => {
            stone.classList.remove('winning');
        });

        this.clearLastMoveIndicators();

        // Add last move indicator to the new last move
        const lastMove = this.game.getLastMove();
        if (lastMove) {
            const lastIntersection = this.getIntersection(lastMove.row, lastMove.col);
            const lastStone = lastIntersection.querySelector('.stone');
            if (lastStone) {
                lastStone.classList.add('last-move');
            }
        }

        this.updateDisplay();
    }

    /**
     * Clear last move indicators
     */
    clearLastMoveIndicators() {
        document.querySelectorAll('.stone.last-move').forEach(stone => {
            stone.classList.remove('last-move');
        });
    }

    /**
     * Control methods
     */

    newGame() {
        this.game.resetGame();
    }

    undoMove() {
        if (this.isProcessingMove) {
            return;
        }

        this.game.undoMove();

        // In AI mode, undo one more move to get back to human player's turn
        if (this.ai && this.gameMode.includes('bot') && this.game.moveHistory.length > 0) {
            this.game.undoMove();
        }
    }

    toggleHelp() {
        if (this.elements.helpModal) {
            this.elements.helpModal.classList.toggle('active');
        } else {
            console.warn('⚠️ helpModal element not found');
        }
    }

    toggleGameHelp() {
        if (this.elements.gameHelpModal) {
            this.elements.gameHelpModal.classList.toggle('active');
        } else {
            console.warn('⚠️ gameHelpModal element not found');
        }
    }

    resetScore() {
        this.game.resetScores();
        this.updateScores();
        this.updateDisplay(); // Update to refresh starter indication
    }

    /**
     * Initialize helpers system (WASM-only)
     */
    initializeHelpers() {
        // Legacy JavaScript helpers are deprecated
        // All helper functionality is now provided through WASM Integration
        console.log('🦀 Helpers functionality provided through WASM Integration');
        this.helpers = null; // Disable legacy helpers
    }

    /**
     * Setup helper checkboxes
     */
    setupHelperCheckboxes() {
        // Player 1 (Black) checkboxes - with null checks
        if (this.elements.helpPlayer1Level0) {
            this.elements.helpPlayer1Level0.addEventListener('change', e =>
                this.updateHelperSettings('player1', 'level0', e.target.checked)
            );
        }
        if (this.elements.helpPlayer1Level1) {
            this.elements.helpPlayer1Level1.addEventListener('change', e =>
                this.updateHelperSettings('player1', 'level1', e.target.checked)
            );
        }
        if (this.elements.helpPlayer1Level2) {
            this.elements.helpPlayer1Level2.addEventListener('change', e =>
                this.updateHelperSettings('player1', 'level2', e.target.checked)
            );
        }

        // Player 2 (White) checkboxes - with null checks
        if (this.elements.helpPlayer2Level0) {
            this.elements.helpPlayer2Level0.addEventListener('change', e =>
                this.updateHelperSettings('player2', 'level0', e.target.checked)
            );
        }
        if (this.elements.helpPlayer2Level1) {
            this.elements.helpPlayer2Level1.addEventListener('change', e =>
                this.updateHelperSettings('player2', 'level1', e.target.checked)
            );
        }
        if (this.elements.helpPlayer2Level2) {
            this.elements.helpPlayer2Level2.addEventListener('change', e =>
                this.updateHelperSettings('player2', 'level2', e.target.checked)
            );
        }
    }

    /**
     * Update helper settings for a player (WASM-only)
     */
    updateHelperSettings(player, level, enabled) {
        this.helpSettings[player][level] = enabled;
        this.updateCurrentPlayerHelpers();
    }

    /**
     * Update helpers based on current player (WASM-only)
     */
    updateCurrentPlayerHelpers() {
        // Legacy JavaScript helpers are deprecated
        // Helper functionality is now provided through WASM Integration
        console.log('🦀 Helper settings updated, functionality provided through WASM Integration');
    }

    /**
     * Handle forced move activation (WASM-only)
     */
    onForcedMoveActivated(data) {
        // Legacy JavaScript helper events are deprecated
        // Hint visualization is now handled through WASM Integration
        console.log('🦀 Forced move activation handled through WASM Integration');
    }

    /**
     * Handle forced move deactivation (WASM-only)
     */
    onForcedMoveDeactivated() {
        // Legacy JavaScript helper events are deprecated
        // Hint visualization is now handled through WASM Integration
        console.log('🦀 Forced move deactivation handled through WASM Integration');
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
     * Override player change handler to update helpers
     */
    onPlayerChanged(_player) {
        this.updateDisplay();
        this.updateCurrentPlayerHelpers();

        // Process AI move if needed
        if (this.isAITurn() && !this.game.gameOver) {
            setTimeout(() => this.processAIMove(), 100);
        }
    }

    /**
     * Stone positioning - FULLY RESPONSIVE WITH PADDING CORRECTION
     * Accounts for CSS padding percentage to ensure perfect grid alignment at all zoom levels
     */
    positionStoneRelativeToBoard(row, col, stone) {
        const board = this.elements.gameBoard;
        
        // Get actual computed styles from the DOM for TRUE responsiveness
        const computedStyle = window.getComputedStyle(board);
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const boardWidth = parseFloat(computedStyle.width);
        const boardHeight = parseFloat(computedStyle.height);
        
        // Calculate ACTUAL padding percentages based on current dimensions
        const paddingLeftPercent = (paddingLeft / boardWidth) * 100;
        const paddingTopPercent = (paddingTop / boardHeight) * 100;
        
        // Calculate available grid space (accounting for padding on both sides)
        const gridWidthPercent = 100 - (2 * paddingLeftPercent);
        const gridHeightPercent = 100 - (2 * paddingTopPercent);
        
        // Calculate position within the grid (0-14 maps to 0%-100% of grid space)
        const maxPosition = 14; // Maximum coordinate value (0-14)
        const leftPercent = paddingLeftPercent + ((col / maxPosition) * gridWidthPercent);
        const topPercent = paddingTopPercent + ((row / maxPosition) * gridHeightPercent);
        
        // Apply truly responsive positioning
        stone.style.left = `${leftPercent}%`;
        stone.style.top = `${topPercent}%`;
        stone.style.position = 'absolute'; // Relative to board container
        stone.style.transform = 'translate(-50%, -50%)'; // CRITICAL: Center stone on intersection
        
        console.log('🎯 RUNTIME RESPONSIVE COORDINATE MAPPING:');
        console.log(`- Board dimensions: ${boardWidth.toFixed(0)}x${boardHeight.toFixed(0)}px`);
        console.log(`- Actual padding: ${paddingLeft.toFixed(1)}px (${paddingLeftPercent.toFixed(2)}%)`);
        console.log(`- Row ${row}, Col ${col} → Final position: (${leftPercent.toFixed(2)}%, ${topPercent.toFixed(2)}%)`);
        console.log(`- No coordinate drift at any zoom level!`);
        
        return stone;
    }

    /**
     * Override move made handler - NEW BOARD-RELATIVE APPROACH
     */
    onMoveMade(move) {
        console.log('🔍 onMoveMade called:', move);
        
        // Get intersection for cleanup and state management only
        const intersection = this.getIntersection(move.row, move.col);
        if (!intersection) {
            console.error('❌ CRITICAL: No intersection found for state management!', move);
            return;
        }

        // Remove any preview stones from intersection
        const previewStone = intersection.querySelector('.stone.preview');
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
        console.log('🔍 Stone created:', stone.className, 'player:', move.player);

        // NEW APPROACH: Position stone relative to board (bypasses intersection issues)
        this.positionStoneRelativeToBoard(move.row, move.col, stone);
        
        // Append stone to game board and mark intersection as occupied
        this.elements.gameBoard.appendChild(stone);
        intersection.classList.add('occupied');
        console.log('✅ Stone positioned with board-relative method! Total stones:', document.querySelectorAll('.stone').length);

        // Add move indicator for notation
        const moveIndicator = document.createElement('div');
        moveIndicator.className = 'move-indicator';
        moveIndicator.title = `${move.moveNumber}. ${this.game.positionToNotation(move.row, move.col)}`;
        stone.appendChild(moveIndicator);

        // Remove animation class after animation completes
        setTimeout(() => {
            stone.classList.remove('stone-place');
            this.isProcessingMove = false;

            // Helper updates are now handled through WASM Integration
            this.updateCurrentPlayerHelpers();

            // Update Assistance System visual indicators
            if (this.assistanceSystem) {
                this.assistanceSystem.onGameStateChanged();
            }

            // Process AI move if needed
            if (this.isAITurn() && !this.game.gameOver) {
                setTimeout(() => this.processAIMove(), 100);
            }
        }, this.animationDuration);

        this.updateDisplay();
    }

    /**
     * Override game reset handler
     */
    onGameReset() {
        this.createBoard();
        this.clearHintHighlights();
        this.updateDisplay();
        this.hideThinkingIndicator();
        // Helper updates are now handled through WASM Integration
        this.updateCurrentPlayerHelpers();
    }

    /**
     * Get player name from string (for starter rotation display)
     */
    getPlayerNameFromString(playerString) {
        if (this.gameMode && this.gameMode.includes('bot')) {
            // AI mode: second player (white) is AI, first player (black) is human
            if (playerString === 'black') {
                return 'Spieler';
            } else {
                return 'KI';
            }
        }
        return playerString === 'black' ? 'Spieler 1 (Schwarz)' : 'Spieler 2 (Weiß)';
    }

    /**
     * Show status message
     */
    showMessage(message, type = 'info') {
        // You could implement a toast notification system here
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    /**
     * Initialize WASM Integration
     */
    initializeWasmIntegration() {
        if (typeof window.WasmGobangIntegration !== 'undefined') {
            this.wasmIntegration = new window.WasmGobangIntegration(this);
            console.log('✅ WASM Integration initialized');
        } else {
            console.log('⚠️ WASM Integration not available');
        }
    }

    /**
     * Initialize Assistance System
     */
    initializeAssistanceSystem() {
        if (typeof window.GomokuAssistanceSystem !== 'undefined') {
            this.assistanceSystem = new window.GomokuAssistanceSystem(this);
            console.log('✅ Assistance System initialized');
        } else {
            console.log('⚠️ Assistance System not available');
        }
    }

    /**
     * Enhanced onMoveMade handler with WASM integration
     */
    onMoveMadeEnhanced(move) {
        // Call original handler
        this.onMoveMade(move);
        
        // Notify WASM integration
        if (this.wasmIntegration) {
            this.wasmIntegration.onGameEvent('moveMade', move);
        }
    }

    /**
     * Enhanced onMoveUndone handler with WASM integration
     */
    onMoveUndoneEnhanced(move) {
        // Call original handler
        this.onMoveUndone(move);
        
        // Notify WASM integration
        if (this.wasmIntegration) {
            this.wasmIntegration.onGameEvent('moveUndone', move);
        }
    }

    /**
     * Enhanced onGameReset handler with WASM integration
     */
    onGameResetEnhanced() {
        // Call original handler
        this.onGameReset();
        
        // Notify WASM integration
        if (this.wasmIntegration) {
            this.wasmIntegration.onGameEvent('gameReset', {});
        }
    }

    /**
     * Get WASM integration status
     */
    getWasmStatus() {
        if (this.wasmIntegration) {
            return this.wasmIntegration.getEngineStatus();
        }
        return { isWasmEnabled: false, isInitialized: false };
    }

    // ==================== CURSOR SYSTEM (Phase 2) ====================

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

    // REMOVED: updateCursorDisplay, removeCursorDisplay - unified into updateCursorVisual()

    // ==================== VISUAL FEEDBACK SYSTEM (Phase 3) ====================

    /**
     * Update intersection visual feedback
     */
    updateIntersectionFeedback(row, col, state) {
        // Clear existing feedback first
        this.clearIntersectionFeedback();
        
        const intersection = this.getIntersection(row, col);
        if (intersection) {
            intersection.classList.add(`feedback-${state}`);
            
            // Add stone preview if not occupied
            if (!intersection.classList.contains('occupied')) {
                this.addStonePreview(intersection);
            }
        }
    }

    /**
     * Clear all intersection feedback
     */
    clearIntersectionFeedback() {
        const feedbackElements = document.querySelectorAll('[class*="feedback-"]');
        feedbackElements.forEach(element => {
            element.classList.remove('feedback-selected', 'feedback-hover', 'feedback-preview');
        });
        
        // Remove stone previews
        const previews = document.querySelectorAll('.stone-preview');
        previews.forEach(preview => preview.remove());
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
        preview.className = `stone-preview ${this.game.getPlayerColorClass(this.game.currentPlayer)}`;
        intersection.appendChild(preview);
    }

    // ==================== TWO-STAGE STONE PLACEMENT SYSTEM ==================== 

    /**
     * Reset selection state to phase 0 (navigation)
     */
    resetSelectionState() {
        this.selectionState.phase = 0;
        this.selectionState.previewRow = null;
        this.selectionState.previewCol = null;
        this.selectionState.hasPreview = false;
        this.removeSelectionPreview();
        console.log('🔄 Selection state reset');
    }

    // REMOVED: setSelectionPhase - unified into placeCursorStone() method

    /**
     * Add selection preview at specified position
     */
    addSelectionPreview(row, col) {
        this.removeSelectionPreview();
        const intersection = this.getIntersection(row, col);
        if (intersection && !intersection.classList.contains('occupied')) {
            intersection.classList.add('feedback-selected');
            this.addStonePreview(intersection);
            this.selectionState.hasPreview = true;
        }
    }

    /**
     * Remove selection preview and feedback
     */
    removeSelectionPreview() {
        const selected = document.querySelector('.intersection.feedback-selected');
        if (selected) {
            selected.classList.remove('feedback-selected');
            const preview = selected.querySelector('.stone-preview');
            if (preview) {
                preview.remove();
            }
        }
        this.selectionState.hasPreview = false;
    }

    /**
     * Update visual feedback based on selection state
     */
    updateSelectionVisuals() {
        if (this.selectionState.phase === 0) {
            this.removeSelectionPreview();
        } else if (this.selectionState.phase === 1 && 
                   this.selectionState.selectedRow !== null && 
                   this.selectionState.selectedCol !== null) {
            this.addSelectionPreview(this.selectionState.selectedRow, this.selectionState.selectedCol);
        }
    }
}

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.GomokuUI = GomokuUI;
}
