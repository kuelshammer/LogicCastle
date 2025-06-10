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
        this.undoBtn = null;
        this.hintsToggle = null;
        this.helpBtn = null;
        this.helpModal = null;
        this.closeHelpBtn = null;
        this.gameMode = 'two-player';
        this.hintsEnabled = false;
        
        this.isAnimating = false;
        this.aiThinking = false;
        this.selectedColumn = null;
        
        // Bind methods
        this.handleColumnClick = this.handleColumnClick.bind(this);
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleNewGame = this.handleNewGame.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handleHintsToggle = this.handleHintsToggle.bind(this);
        this.handleModeChange = this.handleModeChange.bind(this);
        this.handleHelp = this.handleHelp.bind(this);
    }
    
    /**
     * Initialize the UI
     */
    init() {
        this.createBoard();
        this.bindElements();
        this.attachEventListeners();
        this.updateUI();
        
        // Setup game event listeners
        this.game.on('moveMade', (move) => this.onMoveMade(move));
        this.game.on('gameWon', (data) => this.onGameWon(data));
        this.game.on('gameDraw', () => this.onGameDraw());
        this.game.on('playerChanged', (player) => this.onPlayerChanged(player));
        this.game.on('gameReset', () => this.onGameReset());
        this.game.on('moveUndone', (move) => this.onMoveUndone(move));
    }
    
    /**
     * Create the game board DOM structure
     */
    createBoard() {
        this.boardElement = document.getElementById('gameBoard');
        this.boardElement.innerHTML = '';
        
        // Create cells
        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col < this.game.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add click handler for column selection
                cell.addEventListener('click', () => this.handleCellClick(col));
                
                this.boardElement.appendChild(cell);
            }
        }
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
        this.undoBtn = document.getElementById('undoBtn');
        this.hintsToggle = document.getElementById('hintsToggle');
        this.helpBtn = document.getElementById('helpBtn');
        this.helpModal = document.getElementById('helpModal');
        this.closeHelpBtn = document.getElementById('closeHelpBtn');
        this.gameModeSelect = document.getElementById('gameMode');
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
        this.undoBtn.addEventListener('click', this.handleUndo);
        if (this.hintsToggle) {
            this.hintsToggle.addEventListener('click', this.handleHintsToggle);
        }
        this.helpBtn.addEventListener('click', this.handleHelp);
        this.closeHelpBtn.addEventListener('click', this.handleHelp);
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.handleHelp();
            }
        });
        this.gameModeSelect.addEventListener('change', this.handleModeChange);
        
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
            case 'Escape':
                // Clear column selection
                this.clearColumnSelection();
                break;
            case 'F1':
                e.preventDefault();
                this.handleHelp();
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
        if (!this.game.gameOver && this.isAIMode() && this.game.currentPlayer === this.game.PLAYER2) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }
    
    /**
     * Make an AI move
     */
    async makeAIMove() {
        if (this.game.gameOver || !this.isAIMode()) {
            return;
        }
        
        this.aiThinking = true;
        this.updateGameStatus('KI denkt nach...');
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
        
        // Get AI move (placeholder - will be implemented in ai.js)
        const aiMove = this.getAIMove();
        
        if (aiMove !== null) {
            this.game.makeMove(aiMove);
        }
        
        this.aiThinking = false;
        this.updateGameStatus();
    }
    
    /**
     * Get AI move (placeholder)
     */
    getAIMove() {
        const validMoves = this.game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        // Simple random move for now
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    /**
     * Check if current mode is AI vs player
     */
    isAIMode() {
        return this.gameMode.startsWith('vs-bot');
    }
    
    /**
     * Select a column for potential move
     */
    selectColumn(col) {
        if (this.game.isColumnFull(col) || this.game.gameOver) {
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
     * Handle new game button
     */
    handleNewGame() {
        if (this.isAnimating) return;
        
        this.game.resetGame();
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
     * Handle hints toggle
     */
    handleHintsToggle() {
        this.hintsEnabled = !this.hintsEnabled;
        this.hintsToggle.textContent = this.hintsEnabled ? 'Hilfen Aus' : 'Hilfen An';
        this.hintsToggle.classList.toggle('active', this.hintsEnabled);
        
        if (this.hintsEnabled) {
            this.showHints();
        } else {
            this.hideHints();
        }
    }
    
    /**
     * Handle game mode change
     */
    handleModeChange() {
        this.gameMode = this.gameModeSelect.value;
        
        // Show/hide hints toggle based on mode
        if (this.gameMode === 'two-player-hints') {
            this.hintsToggle.style.display = 'inline-block';
        } else {
            this.hintsToggle.style.display = 'none';
            this.hintsEnabled = false;
            this.hideHints();
        }
        
        // Reset game for mode change
        this.game.resetGame();
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
        this.updateGameStatus(`${this.game.getPlayerName(data.winner)} gewinnt!`);
        this.showGameOverMessage(`🎉 ${this.game.getPlayerName(data.winner)} gewinnt!`);
        this.updateUI();
    }
    
    onGameDraw() {
        this.updateGameStatus('Unentschieden!');
        this.showGameOverMessage('🤝 Unentschieden!');
        this.updateUI();
    }
    
    onPlayerChanged(player) {
        this.updateCurrentPlayerIndicator(player);
        this.updateGameStatus();
    }
    
    onGameReset() {
        this.clearBoard();
        this.clearWinHighlights();
        this.hideGameOverMessage();
        this.clearColumnSelection();
        this.updateUI();
    }
    
    onMoveUndone(move) {
        this.removePieceFromBoard(move.row, move.col);
        this.clearWinHighlights();
        this.hideGameOverMessage();
        this.updateUI();
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
    }
    
    updateBoard() {
        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col < this.game.COLS; col++) {
                const cell = this.getCellElement(row, col);
                const player = this.game.board[row][col];
                
                // Remove existing player and selection classes
                cell.classList.remove('red', 'yellow', 'column-selected');
                
                // Add selection highlight for individual cells
                if (this.selectedColumn === col && !this.game.isColumnFull(col) && !this.game.gameOver) {
                    cell.classList.add('column-selected');
                }
                
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
        // Remove existing column highlight
        const existingHighlight = this.boardElement.querySelector('.column-highlight');
        if (existingHighlight) {
            existingHighlight.remove();
        }
        
        // Add new column highlight if column is selected
        if (this.selectedColumn !== null && 
            !this.game.isColumnFull(this.selectedColumn) && 
            !this.game.gameOver) {
            
            const highlight = document.createElement('div');
            highlight.className = 'column-highlight';
            
            // Get all cells in the selected column to determine bounds
            const topCell = this.getCellElement(0, this.selectedColumn);
            const bottomCell = this.getCellElement(this.game.ROWS - 1, this.selectedColumn);
            
            if (topCell && bottomCell) {
                const topRect = topCell.getBoundingClientRect();
                const bottomRect = bottomCell.getBoundingClientRect();
                const boardRect = this.boardElement.getBoundingClientRect();
                
                // Calculate exact column position and width
                const leftPosition = topRect.left - boardRect.left - 8;
                const width = topRect.width + 16;
                
                highlight.style.left = `${leftPosition}px`;
                highlight.style.width = `${width}px`;
                
                this.boardElement.appendChild(highlight);
            }
        }
    }
    
    updateColumnIndicators() {
        this.columnIndicators.forEach((indicator, col) => {
            const isFull = this.game.isColumnFull(col);
            const isDisabled = this.game.gameOver || this.aiThinking;
            const isSelected = this.selectedColumn === col;
            
            indicator.classList.toggle('disabled', isFull || isDisabled);
            indicator.classList.toggle('selected', isSelected && !isFull && !isDisabled);
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
            playerName.textContent = this.game.getPlayerName(this.game.currentPlayer);
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
                this.gameStatus.textContent = `${this.game.getPlayerName(this.game.winner)} hat gewonnen!`;
            } else {
                this.gameStatus.textContent = 'Unentschieden!';
            }
        } else if (this.aiThinking) {
            this.gameStatus.textContent = 'KI denkt nach...';
        } else {
            this.gameStatus.textContent = `${this.game.getPlayerName(this.game.currentPlayer)} ist am Zug`;
        }
    }
    
    updateScores() {
        if (this.scoreElements.red) {
            this.scoreElements.red.textContent = this.game.scores.player1;
        }
        if (this.scoreElements.yellow) {
            this.scoreElements.yellow.textContent = this.game.scores.player2;
        }
    }
    
    updateControls() {
        this.undoBtn.disabled = this.game.moveHistory.length === 0 || this.game.gameOver || this.aiThinking;
    }
    
    /**
     * Helper methods
     */
    getCellElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    clearBoard() {
        this.boardElement.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('red', 'yellow', 'winning', 'stone-drop', 'column-selected');
        });
        
        // Remove column highlight
        const existingHighlight = this.boardElement.querySelector('.column-highlight');
        if (existingHighlight) {
            existingHighlight.remove();
        }
    }
    
    removePieceFromBoard(row, col) {
        const cell = this.getCellElement(row, col);
        cell.classList.remove('red', 'yellow');
    }
    
    showMessage(message, type = 'info') {
        // Simple message display - could be enhanced with toast notifications
        console.log(`${type.toUpperCase()}: ${message}`);
    }
    
    showGameOverMessage(message) {
        // Could be enhanced with modal dialog
        this.showMessage(message, 'info');
    }
    
    hideGameOverMessage() {
        // Hide any game over dialogs
    }
    
    showHints() {
        // Placeholder for hints system
        console.log('Hints enabled');
    }
    
    hideHints() {
        // Placeholder for hints system
        console.log('Hints disabled');
    }
}