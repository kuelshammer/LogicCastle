/**
 * TrioUI - User Interface for Trio game
 */
class TrioUI {
    constructor(game) {
        this.game = game;
        this.ai = null;
        this.gameMode = 'three-player';
        this.isProcessingMove = false;
        
        // UI elements
        this.elements = {};
        
        // Settings
        this.animationDuration = 400;
        this.aiThinkingDelay = 500;
    }
    
    /**
     * Initialize the UI
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.createBoard();
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
            player1Score: document.getElementById('player1Score'),
            player2Score: document.getElementById('player2Score'),
            player3Score: document.getElementById('player3Score'),
            newGameBtn: document.getElementById('newGameBtn'),
            undoBtn: document.getElementById('undoBtn'),
            helpBtn: document.getElementById('helpBtn'),
            helpModal: document.getElementById('helpModal'),
            closeHelpBtn: document.getElementById('closeHelpBtn'),
            gameMode: document.getElementById('gameMode')
        };
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Game events
        this.game.on('moveMade', (move) => this.onMoveMade(move));
        this.game.on('gameWon', (data) => this.onGameWon(data));
        this.game.on('gameDraw', () => this.onGameDraw());
        this.game.on('gameReset', () => this.onGameReset());
        this.game.on('playerChanged', (player) => this.onPlayerChanged(player));
        this.game.on('moveUndone', (move) => this.onMoveUndone(move));
        
        // UI controls
        this.elements.newGameBtn.addEventListener('click', () => this.newGame());
        this.elements.undoBtn.addEventListener('click', () => this.undoMove());
        this.elements.helpBtn.addEventListener('click', () => this.toggleHelp());
        this.elements.closeHelpBtn.addEventListener('click', () => this.toggleHelp());
        this.elements.gameMode.addEventListener('change', () => this.updateGameMode());
        
        // Modal overlay click
        this.elements.helpModal.addEventListener('click', (e) => {
            if (e.target === this.elements.helpModal) {
                this.toggleHelp();
            }
        });
    }
    
    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // Don't handle keys when modal is open
            if (this.elements.helpModal.classList.contains('active')) {
                if (e.key === 'Escape' || e.key === 'F1') {
                    e.preventDefault();
                    this.toggleHelp();
                }
                return;
            }
            
            switch (e.key) {
                case 'F1':
                    e.preventDefault();
                    this.toggleHelp();
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
        
        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col < this.game.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.onCellClick(row, col));
                cell.addEventListener('mouseenter', () => this.onCellHover(row, col));
                cell.addEventListener('mouseleave', () => this.onCellLeave(row, col));
                
                this.elements.gameBoard.appendChild(cell);
            }
        }
    }
    
    /**
     * Update game mode
     */
    updateGameMode() {
        this.gameMode = this.elements.gameMode.value;
        
        // Initialize AI if needed
        if (this.gameMode.includes('bot')) {
            const difficulty = this.gameMode.split('-').pop();
            this.ai = new TrioAI(difficulty);
        } else {
            this.ai = null;
        }
        
        this.newGame();
    }
    
    /**
     * Handle cell click
     */
    onCellClick(row, col) {
        if (this.isProcessingMove || this.game.gameOver) {
            return;
        }
        
        // Check if it's a human player's turn
        if (this.isAITurn()) {
            return;
        }
        
        this.makeMove(row, col);
    }
    
    /**
     * Handle cell hover
     */
    onCellHover(row, col) {
        if (this.isProcessingMove || this.game.gameOver || this.isAITurn()) {
            return;
        }
        
        const cell = this.getCell(row, col);
        if (!cell.classList.contains('occupied')) {
            cell.classList.add('preview');
            cell.classList.add(this.game.getPlayerColorClass(this.game.currentPlayer));
        }
    }
    
    /**
     * Handle cell leave
     */
    onCellLeave(row, col) {
        const cell = this.getCell(row, col);
        cell.classList.remove('preview');
        cell.classList.remove('player1', 'player2', 'player3');
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
        if (!this.ai || this.gameMode === 'three-player') {
            return false;
        }
        
        // In bot modes, player 1 is human, players 2 and 3 are AI
        return this.game.currentPlayer !== this.game.PLAYER1;
    }
    
    /**
     * Process AI move
     */
    async processAIMove() {
        if (!this.ai || !this.isAITurn() || this.game.gameOver) {
            return;
        }
        
        this.isProcessingMove = true;
        
        // Show thinking state
        this.updateGameStatus('KI überlegt...');
        
        // Add thinking delay for better UX
        await new Promise(resolve => setTimeout(resolve, this.aiThinkingDelay));
        
        const move = this.ai.getBestMove(this.game);
        
        if (move) {
            this.makeMove(move.row, move.col);
        } else {
            this.isProcessingMove = false;
        }
    }
    
    /**
     * Get cell element
     */
    getCell(row, col) {
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
        this.elements.player1Score.textContent = this.game.scores.player1;
        this.elements.player2Score.textContent = this.game.scores.player2;
        this.elements.player3Score.textContent = this.game.scores.player3;
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
        this.elements.undoBtn.disabled = this.game.moveHistory.length === 0 || this.isProcessingMove;
    }
    
    /**
     * Event handlers
     */
    
    onMoveMade(move) {
        const cell = this.getCell(move.row, move.col);
        
        // Remove preview classes
        cell.classList.remove('preview');
        
        // Add player class and animation
        cell.classList.add(this.game.getPlayerColorClass(move.player));
        cell.classList.add('occupied');
        cell.classList.add('stone-place');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            cell.classList.remove('stone-place');
            this.isProcessingMove = false;
            
            // Process AI move if needed
            if (this.isAITurn() && !this.game.gameOver) {
                setTimeout(() => this.processAIMove(), 100);
            }
        }, this.animationDuration);
        
        this.updateDisplay();
    }
    
    onGameWon(data) {
        // Highlight winning cells
        data.winningCells.forEach(cellPos => {
            const cell = this.getCell(cellPos.row, cellPos.col);
            cell.classList.add('winning');
        });
        
        this.updateDisplay();
        this.showMessage(`${this.game.getPlayerName(data.winner)} hat gewonnen!`, 'win');
    }
    
    onGameDraw() {
        this.updateDisplay();
        this.showMessage('Unentschieden! Das Spielfeld ist voll.', 'draw');
    }
    
    onGameReset() {
        this.createBoard();
        this.updateDisplay();
    }
    
    onPlayerChanged(player) {
        this.updateDisplay();
        
        // Process AI move if needed
        if (this.isAITurn() && !this.game.gameOver) {
            setTimeout(() => this.processAIMove(), 100);
        }
    }
    
    onMoveUndone(move) {
        const cell = this.getCell(move.row, move.col);
        cell.className = 'cell';
        
        // Remove winning highlights
        document.querySelectorAll('.cell.winning').forEach(cell => {
            cell.classList.remove('winning');
        });
        
        this.updateDisplay();
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
    
    /**
     * Show status message
     */
    showMessage(message, type = 'info') {
        // You could implement a toast notification system here
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}