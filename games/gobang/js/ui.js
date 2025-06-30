/**
 * GobangUI - User Interface for Gobang game
 */
/* global GobangHelpers */
class _GobangUI {
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

        for (let row = 0; row < this.game.BOARD_SIZE; row++) {
            for (let col = 0; col < this.game.BOARD_SIZE; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;

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
     * Handle intersection click
     */
    onIntersectionClick(row, col) {
        if (this.isProcessingMove || this.game.gameOver) {
            return;
        }

        // Check if it's a human player's turn
        if (this.isAITurn()) {
            return;
        }

        // Helper move validation is now handled through WASM Integration
        // Legacy JavaScript helpers are disabled

        this.makeMove(row, col);
    }

    /**
     * Handle intersection hover
     */
    onIntersectionHover(row, col) {
        if (this.isProcessingMove || this.game.gameOver || this.isAITurn()) {
            return;
        }

        const intersection = this.getIntersection(row, col);
        if (!intersection.classList.contains('occupied')) {
            // Show preview stone
            const previewStone = document.createElement('div');
            previewStone.className = `stone ${this.game.getPlayerColorClass(this.game.currentPlayer)} preview`;
            intersection.appendChild(previewStone);
        }
    }

    /**
     * Handle intersection leave
     */
    onIntersectionLeave(row, col) {
        const intersection = this.getIntersection(row, col);
        const previewStone = intersection.querySelector('.stone.preview');
        if (previewStone) {
            previewStone.remove();
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

        const result = this.game.makeMove(row, col);

        if (!result.success) {
            this.isProcessingMove = false;
            this.showMessage(result.reason, 'error');
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

        if (this.game.gameOver) {
            if (this.game.winner) {
                this.elements.gameStatus.textContent = `${this.game.getPlayerName(this.game.winner)} hat gewonnen!`;
            } else {
                this.elements.gameStatus.textContent = 'Unentschieden!';
            }
        } else {
            this.elements.gameStatus.textContent = 'Spiel läuft...';
        }
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
}

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.GobangUI = _GobangUI;
}
