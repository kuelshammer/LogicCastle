/**
 * TrioGame - Core game logic for Trio (3-in-a-row with 3 players)
 */
class TrioGame {
    constructor() {
        this.ROWS = 6;
        this.COLS = 6;
        this.EMPTY = 0;
        this.PLAYER1 = 1; // Red
        this.PLAYER2 = 2; // Blue
        this.PLAYER3 = 3; // Green
        
        this.board = [];
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.moveHistory = [];
        this.scores = { player1: 0, player2: 0, player3: 0, draws: 0 };
        
        this.initializeBoard();
        
        // Event system
        this.eventListeners = {};
    }
    
    /**
     * Initialize empty game board
     */
    initializeBoard() {
        this.board = [];
        for (let row = 0; row < this.ROWS; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                this.board[row][col] = this.EMPTY;
            }
        }
    }
    
    /**
     * Reset game to initial state
     */
    resetGame() {
        this.initializeBoard();
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.moveHistory = [];
        this.emit('gameReset');
        this.emit('playerChanged', this.currentPlayer);
    }
    
    /**
     * Make a move at the specified position
     * @param {number} row - Row index (0-5)
     * @param {number} col - Column index (0-5)
     * @returns {Object} - Move result with success status and position
     */
    makeMove(row, col) {
        if (this.gameOver) {
            return { success: false, reason: 'Game is over' };
        }
        
        if (row < 0 || row >= this.ROWS || col < 0 || col >= this.COLS) {
            return { success: false, reason: 'Invalid position' };
        }
        
        if (this.board[row][col] !== this.EMPTY) {
            return { success: false, reason: 'Position is occupied' };
        }
        
        // Place the piece
        this.board[row][col] = this.currentPlayer;
        
        // Record the move
        const move = { row, col, player: this.currentPlayer };
        this.moveHistory.push(move);
        
        // Emit move event
        this.emit('moveMade', move);
        
        // Check for win
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.scores[`player${this.currentPlayer}`]++;
            this.emit('gameWon', { winner: this.winner, winningCells: this.winningCells });
            return { success: true, row, col, gameWon: true, winner: this.winner };
        }
        
        // Check for draw
        if (this.isDraw()) {
            this.gameOver = true;
            this.scores.draws++;
            this.emit('gameDraw');
            return { success: true, row, col, gameDraw: true };
        }
        
        // Switch to next player
        this.currentPlayer = this.getNextPlayer(this.currentPlayer);
        this.emit('playerChanged', this.currentPlayer);
        
        return { success: true, row, col };
    }
    
    /**
     * Get the next player in sequence
     * @param {number} currentPlayer - Current player number
     * @returns {number} - Next player number
     */
    getNextPlayer(currentPlayer) {
        switch (currentPlayer) {
            case this.PLAYER1: return this.PLAYER2;
            case this.PLAYER2: return this.PLAYER3;
            case this.PLAYER3: return this.PLAYER1;
            default: return this.PLAYER1;
        }
    }
    
    /**
     * Undo the last move
     * @returns {Object} - Undo result
     */
    undoMove() {
        if (this.moveHistory.length === 0) {
            return { success: false, reason: 'No moves to undo' };
        }
        
        const lastMove = this.moveHistory.pop();
        this.board[lastMove.row][lastMove.col] = this.EMPTY;
        
        // Reset game state
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.currentPlayer = lastMove.player;
        
        this.emit('moveUndone', lastMove);
        this.emit('playerChanged', this.currentPlayer);
        
        return { success: true, move: lastMove };
    }
    
    /**
     * Check if the current move results in a win
     * @param {number} row - Row of the last placed piece
     * @param {number} col - Column of the last placed piece
     * @returns {boolean} - True if win condition is met
     */
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            const cells = this.getConnectedCells(row, col, deltaRow, deltaCol, player);
            if (cells.length >= 3) {
                this.winningCells = cells;
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get connected cells in a specific direction
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} deltaRow - Row direction
     * @param {number} deltaCol - Column direction
     * @param {number} player - Player number
     * @returns {Array} - Array of connected cell positions
     */
    getConnectedCells(row, col, deltaRow, deltaCol, player) {
        const cells = [{ row, col }];
        
        // Check positive direction
        let r = row + deltaRow;
        let c = col + deltaCol;
        while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
            cells.push({ row: r, col: c });
            r += deltaRow;
            c += deltaCol;
        }
        
        // Check negative direction
        r = row - deltaRow;
        c = col - deltaCol;
        while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
            cells.unshift({ row: r, col: c });
            r -= deltaRow;
            c -= deltaCol;
        }
        
        return cells;
    }
    
    /**
     * Check if the game is a draw (board full)
     * @returns {boolean} - True if draw condition is met
     */
    isDraw() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col] === this.EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Check if a position is occupied
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} - True if position is occupied
     */
    isPositionOccupied(row, col) {
        return this.board[row][col] !== this.EMPTY;
    }
    
    /**
     * Get valid moves (empty positions)
     * @returns {Array} - Array of valid position objects
     */
    getValidMoves() {
        const validMoves = [];
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (!this.isPositionOccupied(row, col)) {
                    validMoves.push({ row, col });
                }
            }
        }
        return validMoves;
    }
    
    /**
     * Get a copy of the current board
     * @returns {Array} - 2D array representing the board
     */
    getBoard() {
        return this.board.map(row => [...row]);
    }
    
    /**
     * Get game state information
     * @returns {Object} - Current game state
     */
    getGameState() {
        return {
            board: this.getBoard(),
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            winningCells: [...this.winningCells],
            moveHistory: [...this.moveHistory],
            scores: { ...this.scores },
            validMoves: this.getValidMoves()
        };
    }
    
    /**
     * Load game state from object
     * @param {Object} state - Game state to load
     */
    loadGameState(state) {
        this.board = state.board.map(row => [...row]);
        this.currentPlayer = state.currentPlayer;
        this.gameOver = state.gameOver;
        this.winner = state.winner;
        this.winningCells = [...state.winningCells];
        this.moveHistory = [...state.moveHistory];
        this.scores = { ...state.scores };
        
        this.emit('gameLoaded', state);
    }
    
    /**
     * Event system methods
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
    
    /**
     * Utility methods for AI and analysis
     */
    
    /**
     * Simulate a move without modifying the actual game state
     * @param {number} row - Row to simulate move in
     * @param {number} col - Column to simulate move in
     * @returns {Object} - Simulation result
     */
    simulateMove(row, col) {
        if (this.isPositionOccupied(row, col)) {
            return { success: false, reason: 'Position is occupied' };
        }
        
        // Create a copy of the board with the simulated move
        const simulatedBoard = this.getBoard();
        simulatedBoard[row][col] = this.currentPlayer;
        
        // Check if this move would win
        const wouldWin = this.checkWinOnBoard(simulatedBoard, row, col, this.currentPlayer);
        
        return {
            success: true,
            row,
            col,
            player: this.currentPlayer,
            wouldWin,
            board: simulatedBoard
        };
    }
    
    /**
     * Check win condition on a specific board
     * @param {Array} board - 2D board array
     * @param {number} row - Row to check from
     * @param {number} col - Column to check from
     * @param {number} player - Player to check for
     * @returns {boolean} - True if win condition is met
     */
    checkWinOnBoard(board, row, col, player) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            let count = 1; // Count the placed piece
            
            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }
            
            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === player) {
                count++;
                r -= deltaRow;
                c -= deltaCol;
            }
            
            if (count >= 3) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get player name
     * @param {number} player - Player number
     * @returns {string} - Player name
     */
    getPlayerName(player) {
        switch (player) {
            case this.PLAYER1: return 'Spieler 1 (Rot)';
            case this.PLAYER2: return 'Spieler 2 (Blau)';
            case this.PLAYER3: return 'Spieler 3 (Grün)';
            default: return 'Unbekannt';
        }
    }
    
    /**
     * Get player color class
     * @param {number} player - Player number
     * @returns {string} - CSS class name
     */
    getPlayerColorClass(player) {
        switch (player) {
            case this.PLAYER1: return 'player1';
            case this.PLAYER2: return 'player2';
            case this.PLAYER3: return 'player3';
            default: return '';
        }
    }
    
    /**
     * Evaluate position for AI
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player to evaluate for
     * @returns {number} - Position score
     */
    evaluatePosition(row, col, player) {
        if (this.isPositionOccupied(row, col)) {
            return -1000; // Invalid move
        }
        
        let score = 0;
        
        // Center positions are generally better
        const centerDistance = Math.abs(row - 2.5) + Math.abs(col - 2.5);
        score += (7 - centerDistance) * 2;
        
        // Check for immediate win
        if (this.simulateMove(row, col).wouldWin) {
            score += 1000;
        }
        
        // Check for blocking opponent wins
        const opponents = [this.PLAYER1, this.PLAYER2, this.PLAYER3].filter(p => p !== player);
        for (const opponent of opponents) {
            const originalPlayer = this.currentPlayer;
            this.currentPlayer = opponent;
            if (this.simulateMove(row, col).wouldWin) {
                score += 500; // High priority to block
            }
            this.currentPlayer = originalPlayer;
        }
        
        return score;
    }
}