/**
 * GomokuUI - User Interface for Gomoku game
 */
/* global GomokuHelpers */
class _GomokuUI {
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

        // Cursor System (Phase 2)
        this.cursor = {
            row: 7,          // Start in center
            col: 7,
            active: false,   // Initially hidden
            mode: 'navigate' // 'navigate' | 'confirm'
        };

        // Two-Stage Mouse System (Phase 3)
        this.mouseState = {
            lastClickPosition: null, // { row, col } of last click
            clickCount: 0,           // Number of clicks on same position
            requireConfirmation: false // Direct stone placement (one-click mode)
        };

        // Column Highlight System (Connect4-style)
        this.columnState = {
            selectedColumn: 7,      // Default: Column H (A=0, B=1, ..., H=7, ..., O=14)
            highlightActive: true   // Show column highlight by default
        };

        // Row Highlight System (Crosshair component)
        this.rowState = {
            selectedRow: 7,         // Default: Row 8 (1=0, 2=1, ..., 8=7, ..., 15=14)
            highlightActive: true   // Show row highlight by default
        };

        // Two-Stage Stone Placement System
        this.selectionState = {
            phase: 0,               // 0 = navigate, 1 = selected/preview
            selectedRow: null,      // Row of selected intersection
            selectedCol: null,      // Col of selected intersection  
            hasPreview: false       // Whether preview stone is shown
        };
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

        // UI controls
        this.elements.newGameBtn.addEventListener('click', () => this.newGame());
        this.elements.undoBtn.addEventListener('click', () => this.undoMove());
        this.elements.resetScoreBtn.addEventListener('click', () => this.resetScore());
        this.elements.helpBtn.addEventListener('click', () => this.toggleHelp());
        this.elements.gameHelpBtn.addEventListener('click', () => this.toggleGameHelp());
        this.elements.closeHelpBtn.addEventListener('click', () => this.toggleHelp());
        this.elements.closeGameHelpBtn.addEventListener('click', () => this.toggleGameHelp());
        this.elements.gameMode.addEventListener('change', () => this.updateGameMode());

        // Modal overlay clicks
        this.elements.helpModal.addEventListener('click', e => {
            if (e.target === this.elements.helpModal) {
                this.toggleHelp();
            }
        });

        this.elements.gameHelpModal.addEventListener('click', e => {
            if (e.target === this.elements.gameHelpModal) {
                this.toggleGameHelp();
            }
        });

        // Helper checkboxes
        this.setupHelperCheckboxes();
    }

    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', e => {
            // Don't handle keys when modal is open
            if (this.elements.helpModal.classList.contains('active')) {
                if (e.key === 'Escape' || e.key === 'F1') {
                    e.preventDefault();
                    this.toggleHelp();
                }
                return;
            }

            if (this.elements.gameHelpModal.classList.contains('active')) {
                if (e.key === 'Escape' || e.key === 'F2') {
                    e.preventDefault();
                    this.toggleGameHelp();
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
                
                // Cursor Navigation (Phase 2)
                case 'ArrowUp':
                    e.preventDefault();
                    this.moveRowSelection('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveRowSelection('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.moveColumnSelection('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.moveColumnSelection('right');
                    break;
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    if (this.cursor.active) {
                        this.placeCursorStone();
                    } else {
                        // Activate cursor when spacebar is pressed
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

        // Board inner dimensions - mathematically exact
        const boardSize = 350; // 390px - 2*20px padding
        const stepSize = boardSize / 14; // Exact: 350px / 14 intervals = 25px per step

        for (let row = 0; row < this.game.BOARD_SIZE; row++) {
            for (let col = 0; col < this.game.BOARD_SIZE; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;

                // Position intersection at exact grid line crossing
                const left = col * stepSize;
                const top = row * stepSize;
                intersection.style.left = `${left}px`;
                intersection.style.top = `${top}px`;

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
        
        if (this.columnState.highlightActive) {
            // Calculate position: column * stepSize + padding (centers on Grid LINE)
            // Column A=0: 0*25+20=20px, Column H=7: 7*25+20=195px, Column O=14: 14*25+20=370px
            const leftPosition = this.columnState.selectedColumn * 25 + 20;
            
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
    setSelectedColumn(columnIndex) {
        if (columnIndex >= 0 && columnIndex < this.game.BOARD_SIZE) {
            this.columnState.selectedColumn = columnIndex;
            this.updateColumnHighlight();
            
            // Log column selection for debugging
            const columnLetter = String.fromCharCode(65 + columnIndex);
            console.log(`🎯 Column selected: ${columnLetter} (${columnIndex})`);
        }
    }

    /**
     * Toggle column highlighting on/off
     */
    toggleColumnHighlight() {
        this.columnState.highlightActive = !this.columnState.highlightActive;
        this.updateColumnHighlight();
    }

    /**
     * Update row highlight display
     */
    updateRowHighlight() {
        const board = this.elements.gameBoard;
        
        if (this.rowState.highlightActive) {
            // Calculate position: row * stepSize + padding (centers on Grid LINE)
            // Row 1=0: 0*25+20=20px, Row 8=7: 7*25+20=195px, Row 15=14: 14*25+20=370px
            const topPosition = this.rowState.selectedRow * 25 + 20;
            
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
    setSelectedRow(rowIndex) {
        if (rowIndex >= 0 && rowIndex < this.game.BOARD_SIZE) {
            this.rowState.selectedRow = rowIndex;
            this.updateRowHighlight();
            
            // Log row selection for debugging
            const rowNumber = rowIndex + 1; // Display as 1-15
            console.log(`🎯 Row selected: ${rowNumber} (${rowIndex})`);
        }
    }

    /**
     * Move column selection with arrow keys (Connect4-style)
     */
    moveColumnSelection(direction) {
        const currentCol = this.columnState.selectedColumn;
        let newCol;

        if (direction === 'left') {
            // Move left with wrap-around: A(0) wraps to O(14)
            newCol = currentCol > 0 ? currentCol - 1 : 14;
        } else if (direction === 'right') {
            // Move right with wrap-around: O(14) wraps to A(0)
            newCol = currentCol < 14 ? currentCol + 1 : 0;
        } else {
            return; // Invalid direction
        }

        this.setSelectedColumn(newCol);
        this.provideCrosshairFeedback();
        
        // Reset selection state when crosshair moves
        this.resetSelectionState();
    }

    /**
     * Move row selection with arrow keys (Crosshair component)
     */
    moveRowSelection(direction) {
        const currentRow = this.rowState.selectedRow;
        let newRow;

        if (direction === 'up') {
            // Move up with wrap-around: 1(0) wraps to 15(14)
            newRow = currentRow > 0 ? currentRow - 1 : 14;
        } else if (direction === 'down') {
            // Move down with wrap-around: 15(14) wraps to 1(0)
            newRow = currentRow < 14 ? currentRow + 1 : 0;
        } else {
            return; // Invalid direction
        }

        this.setSelectedRow(newRow);
        this.provideCrosshairFeedback();
        
        // Reset selection state when crosshair moves
        this.resetSelectionState();
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
        const columnLetter = String.fromCharCode(65 + this.columnState.selectedColumn); // A-O
        const rowNumber = this.rowState.selectedRow + 1; // 1-15
        return `${columnLetter}${rowNumber}`;
    }

    /**
     * Log current crosshair position for testing
     */
    logCrosshairPosition() {
        const position = this.getCurrentCrosshairPosition();
        console.log(`🎯 Crosshair at: ${position} (Row ${this.rowState.selectedRow}, Col ${this.columnState.selectedColumn})`);
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
            
            // Calculate actual pixel positions
            const colPx = pos.col * 25 + 20;
            const rowPx = pos.row * 25 + 20;
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

        // Move crosshair to clicked position
        this.cursor.row = row;
        this.cursor.col = col; 
        this.cursor.active = true;
        this.updateCursorDisplay();
        
        // Sync crosshair lines with cursor position
        this.columnState.selectedColumn = col;
        this.rowState.selectedRow = row;
        this.setSelectedColumn(col);
        this.setSelectedRow(row);

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
        this.elements.helpModal.classList.toggle('active');
    }

    toggleGameHelp() {
        this.elements.gameHelpModal.classList.toggle('active');
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
        // Player 1 (Black) checkboxes
        this.elements.helpPlayer1Level0.addEventListener('change', e =>
            this.updateHelperSettings('player1', 'level0', e.target.checked)
        );
        this.elements.helpPlayer1Level1.addEventListener('change', e =>
            this.updateHelperSettings('player1', 'level1', e.target.checked)
        );
        this.elements.helpPlayer1Level2.addEventListener('change', e =>
            this.updateHelperSettings('player1', 'level2', e.target.checked)
        );

        // Player 2 (White) checkboxes
        this.elements.helpPlayer2Level0.addEventListener('change', e =>
            this.updateHelperSettings('player2', 'level0', e.target.checked)
        );
        this.elements.helpPlayer2Level1.addEventListener('change', e =>
            this.updateHelperSettings('player2', 'level1', e.target.checked)
        );
        this.elements.helpPlayer2Level2.addEventListener('change', e =>
            this.updateHelperSettings('player2', 'level2', e.target.checked)
        );
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
     * Override move made handler to update helpers
     */
    onMoveMade(move) {
        const intersection = this.getIntersection(move.row, move.col);

        // Remove any preview stones
        const previewStone = intersection.querySelector('.stone.preview');
        if (previewStone) {
            previewStone.remove();
        }

        // Hint highlighting is now handled through WASM Integration
        this.clearHintHighlights();

        // Create and add the actual stone
        const stone = document.createElement('div');
        stone.className = `stone ${this.game.getPlayerColorClass(move.player)} stone-place`;

        // Add last move indicator
        this.clearLastMoveIndicators();
        stone.classList.add('last-move');

        intersection.appendChild(stone);
        intersection.classList.add('occupied');

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

        switch (direction) {
            case 'up':
                this.cursor.row = Math.max(0, this.cursor.row - 1);
                break;
            case 'down':
                this.cursor.row = Math.min(this.game.BOARD_SIZE - 1, this.cursor.row + 1);
                break;
            case 'left':
                this.cursor.col = Math.max(0, this.cursor.col - 1);
                break;
            case 'right':
                this.cursor.col = Math.min(this.game.BOARD_SIZE - 1, this.cursor.col + 1);
                break;
        }

        // Update visual cursor if position changed
        if (oldRow !== this.cursor.row || oldCol !== this.cursor.col) {
            this.updateCursorDisplay();
        }
    }

    /**
     * Show cursor at current position
     */
    showCursor() {
        this.cursor.active = true;
        this.updateCursorDisplay();
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
            // First spacebar press: Select and preview
            this.setSelectionPhase(1, cursorRow, cursorCol);
            this.addSelectionPreview(cursorRow, cursorCol);
        } else if (this.selectionState.phase === 1) {
            if (this.selectionState.selectedRow === cursorRow && 
                this.selectionState.selectedCol === cursorCol) {
                // Second spacebar press on same position: Place stone
                this.makeMove(cursorRow, cursorCol);
                this.resetSelectionState();
            } else {
                // Cursor moved to different position: Reset to phase 1 at new position
                this.setSelectionPhase(1, cursorRow, cursorCol);
                this.addSelectionPreview(cursorRow, cursorCol);
            }
        }
    }

    /**
     * Update visual cursor display
     */
    updateCursorDisplay() {
        if (!this.cursor.active) return;

        // Remove existing cursor
        this.removeCursorDisplay();

        // Get intersection at cursor position
        const intersection = this.getIntersection(this.cursor.row, this.cursor.col);
        if (intersection) {
            intersection.classList.add('cursor-active');
        }
    }

    /**
     * Remove cursor visual display
     */
    removeCursorDisplay() {
        const existingCursor = document.querySelector('.intersection.cursor-active');
        if (existingCursor) {
            existingCursor.classList.remove('cursor-active');
        }
    }

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
        this.selectionState.selectedRow = null;
        this.selectionState.selectedCol = null;
        this.selectionState.hasPreview = false;
        this.removeSelectionPreview();
        this.updateSelectionVisuals();
    }

    /**
     * Set selection phase and update state
     */
    setSelectionPhase(phase, row = null, col = null) {
        this.selectionState.phase = phase;
        if (phase >= 1 && row !== null && col !== null) {
            this.selectionState.selectedRow = row;
            this.selectionState.selectedCol = col;
        }
        this.updateSelectionVisuals();
    }

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
    window.GomokuUI = _GomokuUI;
}
