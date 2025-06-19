/**
 * Connect4UI - User Interface controller for Connect 4 game
 */
class Connect4UI {
    constructor(game) {
        this.game = game;
        this.boardElement = null;
        this.columnIndicators = null;
        this.currentPlayerIndicator = null;
        this.gameStatus = null;
        this.scoreElements = {};
        this.newGameBtn = null;
        this.resetScoreBtn = null;
        this.undoBtn = null;
        this.hintsToggle = null;
        this.helpBtn = null;
        this.helpModal = null;
        this.closeHelpBtn = null;
        this.gameModeSelect = null;
        this.gameMode = 'two-player';
        this.ai = null;
        
        // Individual help settings per color and level
        this.playerHelpEnabled = {
            red: {
                level0: false,  // Winning opportunities
                level1: false,  // Block threats
                level2: false   // Avoid traps
            },
            yellow: {
                level0: false,  // Winning opportunities  
                level1: false,  // Block threats
                level2: false   // Avoid traps
            }
        };
        // New help table checkboxes
        this.helpPlayer1Level0 = null;
        this.helpPlayer1Level1 = null;
        this.helpPlayer1Level2 = null;
        this.helpPlayer2Level0 = null;
        this.helpPlayer2Level1 = null;
        this.helpPlayer2Level2 = null;
        
        this.isAnimating = false;
        this.aiThinking = false;
        this.selectedColumn = null;
        this.aiMoveTimeout = null; // Track active AI move timeout to prevent race conditions
        
        // Initialize helpers system (will set UI reference after construction)
        this.helpers = new Connect4Helpers(this.game, this);
        
        // Bind methods
        this.handleColumnClick = this.handleColumnClick.bind(this);
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleNewGame = this.handleNewGame.bind(this);
        this.handleResetScore = this.handleResetScore.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handlePlayer1Level0Toggle = this.handlePlayer1Level0Toggle.bind(this);
        this.handlePlayer1Level1Toggle = this.handlePlayer1Level1Toggle.bind(this);
        this.handlePlayer1Level2Toggle = this.handlePlayer1Level2Toggle.bind(this);
        this.handlePlayer2Level0Toggle = this.handlePlayer2Level0Toggle.bind(this);
        this.handlePlayer2Level1Toggle = this.handlePlayer2Level1Toggle.bind(this);
        this.handlePlayer2Level2Toggle = this.handlePlayer2Level2Toggle.bind(this);
        this.handleHelp = this.handleHelp.bind(this);
        this.handleGameHelp = this.handleGameHelp.bind(this);
        this.handleGameModeChange = this.handleGameModeChange.bind(this);
    }
    
    /**
     * Initialize the UI
     */
    init() {
        this.createBoard();
        this.bindElements();
        this.attachEventListeners();
        this.updateGameModeUI(); // Initialize UI for current mode
        this.updateUI();
        
        // Setup game event listeners
        this.game.on('moveMade', (move) => this.onMoveMade(move));
        this.game.on('gameWon', (data) => this.onGameWon(data));
        this.game.on('gameDraw', () => this.onGameDraw());
        this.game.on('playerChanged', (player) => this.onPlayerChanged(player));
        this.game.on('gameReset', () => this.onGameReset());
        this.game.on('fullReset', () => this.onFullReset());
        this.game.on('moveUndone', (move) => this.onMoveUndone(move));
        
        // Setup helpers event listeners
        this.helpers.on('forcedMoveActivated', (data) => this.onForcedMoveActivated(data));
        this.helpers.on('forcedMoveDeactivated', () => this.onForcedMoveDeactivated());
    }
    
    /**
     * Create the game board DOM structure
     */
    createBoard() {
        this.boardElement = document.getElementById('gameBoard');
        console.log('🎮 Creating board, found element:', this.boardElement);
        this.boardElement.innerHTML = '';
        
        // Create cells
        let cellCount = 0;
        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col < this.game.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Debug: Add visible content to cells
                cell.style.cssText = 'width: 60px !important; height: 60px !important; background: white !important; border: 3px solid #1565C0 !important; border-radius: 50% !important; display: block !important;';
                
                // Add click handler for column selection
                cell.addEventListener('click', () => this.handleCellClick(col));
                
                this.boardElement.appendChild(cell);
                cellCount++;
            }
        }
        
        console.log(`✅ Created ${cellCount} cells (${this.game.ROWS}x${this.game.COLS})`);
        console.log('Board children count:', this.boardElement.children.length);
        console.log('First cell:', this.boardElement.children[0]);
    }
    
    /**
     * Bind DOM elements
     */
    bindElements() {
        this.columnIndicators = document.querySelectorAll('.column-indicator');
        this.currentPlayerIndicator = document.getElementById('currentPlayerIndicator');
        this.gameStatus = document.getElementById('gameStatus');
        this.scoreElements = {
            red: document.getElementById('redScore'),
            yellow: document.getElementById('yellowScore')
        };
        this.newGameBtn = document.getElementById('newGameBtn');
        this.resetScoreBtn = document.getElementById('resetScoreBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.helpModal = document.getElementById('helpModal');
        this.closeHelpBtn = document.getElementById('closeHelpBtn');
        this.gameHelpBtn = document.getElementById('gameHelpBtn');
        this.gameHelpModal = document.getElementById('gameHelpModal');
        this.closeGameHelpBtn = document.getElementById('closeGameHelpBtn');
        this.helpPlayer1Level0 = document.getElementById('helpPlayer1Level0');
        this.helpPlayer1Level1 = document.getElementById('helpPlayer1Level1');
        this.helpPlayer1Level2 = document.getElementById('helpPlayer1Level2');
        this.helpPlayer2Level0 = document.getElementById('helpPlayer2Level0');
        this.helpPlayer2Level1 = document.getElementById('helpPlayer2Level1');
        this.helpPlayer2Level2 = document.getElementById('helpPlayer2Level2');
        this.gameModeSelect = document.getElementById('gameModeSelect');
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Column indicators for moves
        this.columnIndicators.forEach((indicator, col) => {
            indicator.addEventListener('click', () => this.handleColumnClick(col));
            indicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleColumnClick(col);
                }
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyPress);
        
        // UI controls
        this.newGameBtn.addEventListener('click', this.handleNewGame);
        this.resetScoreBtn.addEventListener('click', this.handleResetScore);
        this.undoBtn.addEventListener('click', this.handleUndo);
        this.helpBtn.addEventListener('click', this.handleHelp);
        this.closeHelpBtn.addEventListener('click', this.handleHelp);
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.handleHelp();
            }
        });
        this.gameHelpBtn.addEventListener('click', this.handleGameHelp);
        this.closeGameHelpBtn.addEventListener('click', this.handleGameHelp);
        this.gameHelpModal.addEventListener('click', (e) => {
            if (e.target === this.gameHelpModal) {
                this.handleGameHelp();
            }
        });
        
        // Help checkbox event listeners
        this.helpPlayer1Level0.addEventListener('change', this.handlePlayer1Level0Toggle);
        this.helpPlayer1Level1.addEventListener('change', this.handlePlayer1Level1Toggle);
        this.helpPlayer1Level2.addEventListener('change', this.handlePlayer1Level2Toggle);
        this.helpPlayer2Level0.addEventListener('change', this.handlePlayer2Level0Toggle);
        this.helpPlayer2Level1.addEventListener('change', this.handlePlayer2Level1Toggle);
        this.helpPlayer2Level2.addEventListener('change', this.handlePlayer2Level2Toggle);
        
        // Game mode selector
        this.gameModeSelect.addEventListener('change', this.handleGameModeChange);
        
        // Keyboard accessibility for checkboxes
        this.helpPlayer1Level0.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.helpPlayer1Level0.checked = !this.helpPlayer1Level0.checked;
                this.handlePlayer1Level0Toggle();
            }
        });
        
        this.helpPlayer1Level1.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.helpPlayer1Level1.checked = !this.helpPlayer1Level1.checked;
                this.handlePlayer1Level1Toggle();
            }
        });
        
        this.helpPlayer2Level0.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.helpPlayer2Level0.checked = !this.helpPlayer2Level0.checked;
                this.handlePlayer2Level0Toggle();
            }
        });
        
        this.helpPlayer2Level1.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.helpPlayer2Level1.checked = !this.helpPlayer2Level1.checked;
                this.handlePlayer2Level1Toggle();
            }
        });
        
        this.helpPlayer1Level2.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.helpPlayer1Level2.checked = !this.helpPlayer1Level2.checked;
                this.handlePlayer1Level2Toggle();
            }
        });
        
        this.helpPlayer2Level2.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.helpPlayer2Level2.checked = !this.helpPlayer2Level2.checked;
                this.handlePlayer2Level2Toggle();
            }
        });
        
        // Board hover effects
        this.columnIndicators.forEach((indicator, col) => {
            indicator.addEventListener('mouseenter', () => this.showPreview(col));
            indicator.addEventListener('mouseleave', () => this.hidePreview());
        });
    }
    
    /**
     * Handle column click/selection (from column indicators)
     */
    handleColumnClick(col) {
        if (this.isAnimating || this.aiThinking || this.game.gameOver) {
            return;
        }
        
        if (this.selectedColumn === col) {
            // Second click on same column - make the move
            this.makePlayerMove(col);
        } else {
            // First click or different column - select it
            this.selectColumn(col);
        }
    }
    
    /**
     * Handle cell click in game board (for column selection)
     */
    handleCellClick(col) {
        if (this.isAnimating || this.aiThinking || this.game.gameOver) {
            return;
        }
        
        if (this.game.isColumnFull(col)) {
            return;
        }
        
        if (this.selectedColumn === col) {
            // Second click on same column - make the move
            this.makePlayerMove(col);
        } else {
            // First click or different column - select it
            this.selectColumn(col);
        }
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        if (this.isAnimating || this.aiThinking || this.game.gameOver) {
            return;
        }
        
        // Number keys 1-7 for column selection
        const key = parseInt(e.key);
        if (key >= 1 && key <= 7) {
            e.preventDefault();
            this.selectColumn(key - 1);
        }
        
        // Space bar to drop stone in selected column
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (this.selectedColumn !== null) {
                this.makePlayerMove(this.selectedColumn);
            }
        }
        
        // Other shortcuts
        switch (e.key) {
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.handleNewGame();
                }
                break;
            case 'z':
            case 'Z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.handleUndo();
                }
                break;
            case 'n':
            case 'N':
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.handleNewGame();
                }
                break;
            case 'u':
            case 'U':
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.handleUndo();
                }
                break;
            case 'Escape':
                // Clear column selection
                this.clearColumnSelection();
                break;
            case 'F1':
                e.preventDefault();
                this.handleHelp();
                break;
            case 'F2':
                e.preventDefault();
                this.handleGameHelp();
                break;
            case 'F3':
                e.preventDefault();
                this.handleResetScore();
                break;
        }
    }
    
    /**
     * Make a player move
     */
    makePlayerMove(col) {
        const result = this.game.makeMove(col);
        
        if (!result.success) {
            this.showMessage(result.reason, 'error');
            return;
        }
        
        // Clear column selection after successful move
        this.clearColumnSelection();
        
        // After player move, check if we need to make AI move  
        // Use setTimeout to ensure game state is fully updated
        if (!this.game.gameOver && this.isAIMode() && this.game.currentPlayer === this.game.PLAYER2) {
            setTimeout(() => {
                // Double-check conditions after state update
                if (!this.game.gameOver && this.isAIMode() && this.game.currentPlayer === this.game.PLAYER2) {
                    this.scheduleAIMove('after player move');
                }
            }, 10); // Small delay to ensure game state is updated
        }
    }
    
    /**
     * Schedule an AI move with race condition protection
     */
    scheduleAIMove(reason = 'unknown') {
        // Don't schedule if AI is already thinking or a move is already scheduled
        if (this.aiThinking) {
            return;
        }
        
        // Cancel any existing AI move timeout to prevent race conditions
        if (this.aiMoveTimeout) {
            clearTimeout(this.aiMoveTimeout);
            this.aiMoveTimeout = null;
        }
        
        // Schedule new AI move
        this.aiMoveTimeout = setTimeout(() => {
            this.aiMoveTimeout = null; // Clear timeout reference
            this.makeAIMove();
        }, 500);
    }
    
    /**
     * Make an AI move
     */
    async makeAIMove() {
        // Guard against parallel calls
        if (this.game.gameOver || !this.isAIMode() || this.aiThinking) {
            return;
        }
        
        this.aiThinking = true;
        this.updateGameStatus('🤖 Smart Bot denkt nach...');
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
        
        // Get AI move with current game state
        const aiMove = this.getAIMove();
        
        if (aiMove !== null) {
            const result = this.game.makeMove(aiMove);
        }
        
        this.aiThinking = false;
        this.updateGameStatus();
    }
    
    /**
     * Get AI move based on current game mode
     */
    getAIMove() {
        const validMoves = this.game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        // Initialize AI if not done yet
        if (!this.ai) {
            this.ai = new Connect4AI('smart-random');
        }
        
        // Use AI to get best move, pass helpers for smart-random mode
        return this.ai.getBestMove(this.game, this.helpers);
    }
    
    /**
     * Check if current mode is AI vs player
     */
    isAIMode() {
        return this.gameMode.startsWith('vs-bot');
    }
    
    /**
     * Handle game mode change
     */
    handleGameModeChange() {
        this.gameMode = this.gameModeSelect.value;
        
        // Reset AI when mode changes
        this.ai = null;
        
        // Update UI for the new mode
        this.updateGameModeUI();
        
        // Start new game with new mode
        this.game.resetGame();
        
        console.log('Game mode changed to:', this.gameMode);
    }
    
    /**
     * Update UI elements based on current game mode
     */
    updateGameModeUI() {
        // Update help controls visibility and settings based on mode
        if (this.gameMode === 'vs-bot-smart') {
            // For bot mode, hide Yellow (Player 2) help controls since bot manages its own help
            const yellowRow = this.helpPlayer2Level0.closest('tr');
            if (yellowRow) yellowRow.style.display = 'none';
            
            // Bot automatically has Level 0 + 1 + 2 help enabled
            this.playerHelpEnabled.yellow.level0 = true;
            this.playerHelpEnabled.yellow.level1 = true;
            this.playerHelpEnabled.yellow.level2 = true;
        } else {
            // For two-player mode, show all help controls
            const redRow = this.helpPlayer1Level0.closest('tr');
            const yellowRow = this.helpPlayer2Level0.closest('tr');
            if (redRow) redRow.style.display = '';
            if (yellowRow) yellowRow.style.display = '';
        }
        
        this.updateHelpers();
        this.updateUI();
    }
    
    /**
     * Select a column for potential move
     */
    selectColumn(col) {
        if (this.game.isColumnFull(col) || this.game.gameOver) {
            return;
        }
        
        // Check if column is blocked by forced move mode
        if (this.helpers.forcedMoveMode && !this.helpers.requiredMoves.includes(col)) {
            this.showMessage('Du musst einen der markierten Züge spielen!', 'warning');
            return;
        }
        
        this.selectedColumn = col;
        this.updateColumnIndicators();
        this.updateColumnHighlight();
    }
    
    /**
     * Clear column selection
     */
    clearColumnSelection() {
        this.selectedColumn = null;
        this.updateColumnIndicators();
        this.updateColumnHighlight();
    }
    
    /**
     * Show column preview on hover
     */
    showPreview(col) {
        if (this.game.gameOver || this.game.isColumnFull(col)) {
            return;
        }
        
        const indicator = this.columnIndicators[col];
        indicator.style.backgroundColor = this.game.currentPlayer === this.game.PLAYER1 
            ? 'rgba(255, 71, 87, 0.3)' 
            : 'rgba(255, 165, 2, 0.3)';
    }
    
    /**
     * Hide column preview
     */
    hidePreview() {
        this.columnIndicators.forEach(indicator => {
            indicator.style.backgroundColor = '';
        });
    }
    
    /**
     * Handle new game button (next game - loser starts)
     */
    handleNewGame() {
        if (this.isAnimating) return;
        
        this.game.resetGame();
        this.updateButtonTexts();
    }
    
    /**
     * Handle reset score button (full reset - scores 0:0, Red starts)
     */
    handleResetScore() {
        if (this.isAnimating) return;
        
        this.game.fullReset();
        this.updateButtonTexts();
    }
    
    /**
     * Handle undo button
     */
    handleUndo() {
        if (this.isAnimating || this.aiThinking) return;
        
        const result = this.game.undoMove();
        if (!result.success) {
            this.showMessage(result.reason, 'error');
        }
    }
    
    /**
     * Handle Red Player Level 0 help toggle
     */
    handlePlayer1Level0Toggle() {
        this.playerHelpEnabled.red.level0 = this.helpPlayer1Level0.checked;
        this.updateHelpers();
        console.log('Red Level 0 help:', this.playerHelpEnabled.red.level0 ? 'enabled' : 'disabled');
    }
    
    /**
     * Handle Red Player Level 1 help toggle
     */
    handlePlayer1Level1Toggle() {
        this.playerHelpEnabled.red.level1 = this.helpPlayer1Level1.checked;
        this.updateHelpers();
        console.log('Red Level 1 help:', this.playerHelpEnabled.red.level1 ? 'enabled' : 'disabled');
    }
    
    /**
     * Handle Yellow Player Level 0 help toggle
     */
    handlePlayer2Level0Toggle() {
        this.playerHelpEnabled.yellow.level0 = this.helpPlayer2Level0.checked;
        this.updateHelpers();
        console.log('Yellow Level 0 help:', this.playerHelpEnabled.yellow.level0 ? 'enabled' : 'disabled');
    }
    
    /**
     * Handle Yellow Player Level 1 help toggle
     */
    handlePlayer2Level1Toggle() {
        this.playerHelpEnabled.yellow.level1 = this.helpPlayer2Level1.checked;
        this.updateHelpers();
        console.log('Yellow Level 1 help:', this.playerHelpEnabled.yellow.level1 ? 'enabled' : 'disabled');
    }
    
    /**
     * Handle Red Player Level 2 help toggle
     */
    handlePlayer1Level2Toggle() {
        this.playerHelpEnabled.red.level2 = this.helpPlayer1Level2.checked;
        this.updateHelpers();
        console.log('Red Level 2 help:', this.playerHelpEnabled.red.level2 ? 'enabled' : 'disabled');
    }
    
    /**
     * Handle Yellow Player Level 2 help toggle
     */
    handlePlayer2Level2Toggle() {
        this.playerHelpEnabled.yellow.level2 = this.helpPlayer2Level2.checked;
        this.updateHelpers();
        console.log('Yellow Level 2 help:', this.playerHelpEnabled.yellow.level2 ? 'enabled' : 'disabled');
    }
    
    /**
     * Update helpers system based on current player and their help settings
     */
    updateHelpers() {
        const currentPlayerHelp = this.getCurrentPlayerHelpSettings();
        
        // Determine the highest help level enabled for this player
        let helpLevel = -1;
        if (currentPlayerHelp.level2) helpLevel = 2;
        if (currentPlayerHelp.level1) helpLevel = Math.max(helpLevel, 1);
        if (currentPlayerHelp.level0) helpLevel = Math.max(helpLevel, 0);
        
        if (helpLevel >= 0) {
            this.helpers.setEnabled(true, helpLevel);
            console.log(`🎯 Help enabled for current player at level ${helpLevel}`);
        } else {
            this.helpers.setEnabled(false, 0);
            console.log('🎯 Help disabled for current player');
        }
        
        this.updateUI();
    }
    
    /**
     * Get help settings for current player
     */
    getCurrentPlayerHelpSettings() {
        return this.game.currentPlayer === this.game.PLAYER1 
            ? this.playerHelpEnabled.red 
            : this.playerHelpEnabled.yellow;
    }
    
    /**
     * Check if current player has ANY help enabled (legacy method for helpers.js)
     */
    getCurrentPlayerHelpEnabled() {
        const settings = this.getCurrentPlayerHelpSettings();
        return settings.level0 || settings.level1 || settings.level2;
    }
    
    /**
     * Get display name for player based on current game mode
     */
    getPlayerDisplayName(player) {
        if (this.gameMode === 'vs-bot-smart') {
            return player === this.game.PLAYER1 ? this.game.getPlayerName(player) : this.game.getPlayerName(player) + '🤖';
        } else {
            return this.game.getPlayerName(player);
        }
    }
    
    /**
     * Handle help button/modal
     */
    handleHelp() {
        this.helpModal.classList.toggle('active');
    }
    
    /**
     * Game event handlers
     */
    onMoveMade(move) {
        this.animateStone(move);
        this.updateUI();
    }
    
    onGameWon(data) {
        this.highlightWinningCells(data.winningCells);
        const displayName = this.getPlayerDisplayName(data.winner);
        this.updateGameStatus(`${displayName} gewinnt!`);
        this.showGameOverMessage(`🎉 ${displayName} gewinnt!`);
        this.updateUI();
        this.updateButtonTexts();
    }
    
    onGameDraw() {
        this.updateGameStatus('Unentschieden!');
        this.showGameOverMessage('🤝 Unentschieden!');
        this.updateUI();
        this.updateButtonTexts();
    }
    
    onPlayerChanged(player) {
        this.updateCurrentPlayerIndicator(player);
        this.updateGameStatus();
        this.updateHelpers(); // Update help system when player changes
        
        // NOTE: AI moves are triggered in makePlayerMove() and onGameReset()/onFullReset()
        // Do NOT trigger AI here to avoid double-triggering
    }
    
    onGameReset() {
        this.clearBoard();
        this.clearWinHighlights();
        this.hideGameOverMessage();
        this.clearColumnSelection();
        this.updateUI();
        this.updateButtonTexts();
        
        // Check if AI should make the first move after reset
        if (!this.game.gameOver && this.isAIMode() && this.game.currentPlayer === this.game.PLAYER2) {
            this.scheduleAIMove('after game reset');
        }
    }
    
    onFullReset() {
        this.clearBoard();
        this.clearWinHighlights();
        this.hideGameOverMessage();
        this.clearColumnSelection();
        this.updateUI();
        this.updateButtonTexts();
        
        // Check if AI should make the first move after full reset
        if (!this.game.gameOver && this.isAIMode() && this.game.currentPlayer === this.game.PLAYER2) {
            this.scheduleAIMove('after full reset');
        }
    }
    
    onMoveUndone(move) {
        this.removePieceFromBoard(move.row, move.col);
        this.clearWinHighlights();
        this.hideGameOverMessage();
        this.updateUI();
    }
    
    /**
     * Helpers event handlers
     */
    onForcedMoveActivated(data) {
        console.log('🚨 Forced move activated:', data);
        this.updateColumnIndicators();
        this.showMessage(`⚠️ Du MUSST Spalte ${data.requiredMoves.map(col => col + 1).join(' oder ')} spielen!`, 'warning');
    }
    
    onForcedMoveDeactivated() {
        console.log('✅ Forced move deactivated');
        this.updateColumnIndicators();
    }
    
    /**
     * Animation and visual effects
     */
    animateStone(move) {
        const cell = this.getCellElement(move.row, move.col);
        const colorClass = this.game.getPlayerColorClass(move.player);
        
        this.isAnimating = true;
        
        cell.classList.add(colorClass);
        cell.classList.add('stone-drop');
        
        setTimeout(() => {
            cell.classList.remove('stone-drop');
            this.isAnimating = false;
        }, 600);
    }
    
    highlightWinningCells(winningCells) {
        winningCells.forEach(({ row, col }) => {
            const cell = this.getCellElement(row, col);
            cell.classList.add('winning');
        });
    }
    
    clearWinHighlights() {
        this.boardElement.querySelectorAll('.cell.winning').forEach(cell => {
            cell.classList.remove('winning');
        });
    }
    
    /**
     * UI update methods
     */
    updateUI() {
        this.updateBoard();
        this.updateColumnIndicators();
        this.updateCurrentPlayerIndicator();
        this.updateGameStatus();
        this.updateScores();
        this.updateControls();
        this.updateButtonTexts();
    }
    
    updateBoard() {
        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col < this.game.COLS; col++) {
                const cell = this.getCellElement(row, col);
                const player = this.game.board[row][col];
                
                // Remove existing player classes
                cell.classList.remove('red', 'yellow');
                
                // Add appropriate class if cell is occupied
                if (player !== this.game.EMPTY) {
                    cell.classList.add(this.game.getPlayerColorClass(player));
                }
            }
        }
        
        // Update column highlight overlay
        this.updateColumnHighlight();
    }
    
    /**
     * Update the column highlight overlay
     */
    updateColumnHighlight() {
        // Remove existing column highlights from all cells
        this.boardElement.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('column-highlighted');
        });
        
        // Add new column highlight if column is selected
        if (this.selectedColumn !== null && 
            !this.game.isColumnFull(this.selectedColumn) && 
            !this.game.gameOver) {
            
            // Highlight only empty cells in the selected column
            for (let row = 0; row < this.game.ROWS; row++) {
                if (this.game.board[row][this.selectedColumn] === this.game.EMPTY) {
                    const cell = this.getCellElement(row, this.selectedColumn);
                    if (cell) {
                        cell.classList.add('column-highlighted');
                    }
                }
            }
        }
    }
    
    updateColumnIndicators() {
        this.columnIndicators.forEach((indicator, col) => {
            const isFull = this.game.isColumnFull(col);
            const isDisabled = this.game.gameOver || this.aiThinking;
            const isSelected = this.selectedColumn === col;
            
            // Check if this column is blocked by forced move mode
            const isBlocked = this.helpers.forcedMoveMode && 
                            !this.helpers.requiredMoves.includes(col);
            
            indicator.classList.toggle('disabled', isFull || isDisabled || isBlocked);
            indicator.classList.toggle('selected', isSelected && !isFull && !isDisabled && !isBlocked);
            indicator.classList.toggle('blocked', isBlocked);
        });
    }
    
    updateCurrentPlayerIndicator() {
        if (!this.currentPlayerIndicator) return;
        
        const playerStone = this.currentPlayerIndicator.querySelector('.player-stone');
        const playerName = this.currentPlayerIndicator.querySelector('.player-name');
        
        if (playerStone) {
            playerStone.classList.remove('red', 'yellow');
            playerStone.classList.add(this.game.getPlayerColorClass(this.game.currentPlayer));
        }
        
        if (playerName) {
            const displayName = this.getPlayerDisplayName(this.game.currentPlayer);
            playerName.textContent = displayName;
        }
    }
    
    updateGameStatus(customMessage = null) {
        if (!this.gameStatus) return;
        
        if (customMessage) {
            this.gameStatus.textContent = customMessage;
            return;
        }
        
        if (this.game.gameOver) {
            if (this.game.winner) {
                const displayName = this.getPlayerDisplayName(this.game.winner);
                this.gameStatus.textContent = `${displayName} hat gewonnen!`;
            } else {
                this.gameStatus.textContent = 'Unentschieden!';
            }
        } else if (this.aiThinking) {
            this.gameStatus.textContent = '🤖 Smart Bot denkt nach...';
        } else {
            const displayName = this.getPlayerDisplayName(this.game.currentPlayer);
            this.gameStatus.textContent = `${displayName} ist am Zug`;
        }
    }
    
    updateScores() {
        if (this.scoreElements.red) {
            this.scoreElements.red.textContent = this.game.scores.red;
        }
        if (this.scoreElements.yellow) {
            this.scoreElements.yellow.textContent = this.game.scores.yellow;
        }
    }
    
    updateControls() {
        this.undoBtn.disabled = this.game.moveHistory.length === 0 || this.game.gameOver || this.aiThinking;
    }
    
    /**
     * Update button texts based on game state
     */
    updateButtonTexts() {
        if (this.game.gameOver) {
            // After game ended - offer next game
            this.newGameBtn.textContent = 'Nächstes Spiel (N)';
        } else {
            // During active game - offer new game
            this.newGameBtn.textContent = 'Neues Spiel (N)';
        }
        
        // Reset button is always the same
        this.resetScoreBtn.textContent = 'Score zurücksetzen (F3)';
    }
    
    /**
     * Helper methods
     */
    getCellElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    clearBoard() {
        this.boardElement.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('red', 'yellow', 'winning', 'stone-drop', 'column-selected', 'column-highlighted');
        });
    }
    
    removePieceFromBoard(row, col) {
        const cell = this.getCellElement(row, col);
        cell.classList.remove('red', 'yellow');
    }
    
    showMessage(message, type = 'info') {
        // Display message in game status temporarily
        const originalStatus = this.gameStatus?.textContent;
        
        if (this.gameStatus) {
            this.gameStatus.textContent = message;
            this.gameStatus.className = `game-status ${type}`;
            
            // Reset after 3 seconds
            setTimeout(() => {
                if (this.gameStatus) {
                    this.gameStatus.className = 'game-status';
                    this.updateGameStatus();
                }
            }, 3000);
        }
        
        console.log(`${type.toUpperCase()}: ${message}`);
    }
    
    showGameOverMessage(message) {
        // Could be enhanced with modal dialog
        this.showMessage(message, 'info');
    }
    
    hideGameOverMessage() {
        // Hide any game over dialogs
    }
    
    /**
     * Handle help modal toggle
     */
    handleHelp() {
        this.helpModal.classList.toggle('active');
    }
    
    /**
     * Handle game help modal toggle
     */
    handleGameHelp() {
        this.gameHelpModal.classList.toggle('active');
    }
    
}