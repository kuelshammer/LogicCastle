/**
 * Connect4Game - Core game logic for Connect 4
 */
class Connect4Game {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.EMPTY = 0;
        this.PLAYER1 = 1; // Internal constant for red pieces
        this.PLAYER2 = 2; // Internal constant for yellow pieces

        this.board = [];
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.moveHistory = [];

        // New flexible player configuration
        this.playerConfig = {
            redPlayer: '🔴',      // Player name for red pieces
            yellowPlayer: '🟡',   // Player name for yellow pieces
            lastWinner: null,     // Who won the last game
            startingPlayer: this.PLAYER1 // Who starts the current game
        };

        // Color-based scoring instead of player-number-based
        this.scores = { red: 0, yellow: 0, draws: 0 };

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
     * Reset game to initial state (next game - loser starts)
     */
    resetGame() {
        this.initializeBoard();

        // Determine starting player: loser of previous game starts, or configured starting player
        if (this.playerConfig.lastWinner !== null) {
            // Loser starts next game
            this.currentPlayer = this.playerConfig.lastWinner === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
            this.playerConfig.startingPlayer = this.currentPlayer;
        } else {
            // First game or no previous winner (draw) - use configured starting player
            this.currentPlayer = this.playerConfig.startingPlayer;
        }

        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.moveHistory = [];
        this.emit('gameReset');
        this.emit('playerChanged', this.currentPlayer);
        this.emit('boardStateChanged', {
            board: this.getBoard(),
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver
        });
    }

    /**
     * Full reset - scores back to 0:0, Red starts first
     */
    fullReset() {
        this.initializeBoard();

        // Reset all game state
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.moveHistory = [];

        // Reset scores and player configuration
        this.scores = { red: 0, yellow: 0, draws: 0 };
        this.playerConfig.lastWinner = null;
        this.playerConfig.startingPlayer = this.PLAYER1; // Red starts first
        this.currentPlayer = this.PLAYER1;

        this.emit('fullReset');
        this.emit('playerChanged', this.currentPlayer);
        this.emit('boardStateChanged', {
            board: this.getBoard(),
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver
        });
    }

    /**
     * Make a move in the specified column
     * @param {number} col - Column index (0-6)
     * @returns {Object} - Move result with success status and position
     */
    makeMove(col) {
        if (this.gameOver) {
            return { success: false, reason: 'Game is over' };
        }

        if (col < 0 || col >= this.COLS) {
            return { success: false, reason: 'Invalid column' };
        }

        if (this.board[0][col] !== this.EMPTY) {
            return { success: false, reason: 'Column is full' };
        }

        // Find the lowest empty row in the column
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
        }

        // Place the piece
        this.board[row][col] = this.currentPlayer;

        // Record the move
        const move = { row, col, player: this.currentPlayer };
        this.moveHistory.push(move);

        // Emit move event
        this.emit('moveMade', move);

        // Check for win
        const wonGame = this.checkWin(row, col);
        if (wonGame) {
            this.gameOver = true;
            this.winner = this.currentPlayer;

            // Update color-based scoring and track winner for next game
            const winnerColor = this.currentPlayer === this.PLAYER1 ? 'red' : 'yellow';
            this.scores[winnerColor]++;
            this.playerConfig.lastWinner = this.currentPlayer;

            this.emit('gameWon', { winner: this.winner, winningCells: this.winningCells });
            return { success: true, row, col, gameWon: true, winner: this.winner, player: move.player };
        }

        // Check for draw
        if (this.isDraw()) {
            this.gameOver = true;
            this.scores.draws++;
            // For draws, don't change lastWinner - keep current starting player for next game
            this.emit('gameDraw');
            return { success: true, row, col, gameDraw: true, player: move.player };
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        this.emit('playerChanged', this.currentPlayer);

        // Emit board state changed for helpers system
        this.emit('boardStateChanged', {
            board: this.getBoard(),
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver
        });

        return { success: true, row, col, player: move.player };
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
            if (cells.length >= 4) {
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
        for (let col = 0; col < this.COLS; col++) {
            if (this.board[0][col] === this.EMPTY) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if a column is full
     * @param {number} col - Column index
     * @returns {boolean} - True if column is full
     */
    isColumnFull(col) {
        return this.board[0][col] !== this.EMPTY;
    }

    /**
     * Get valid moves (columns that are not full)
     * @returns {Array} - Array of valid column indices
     */
    getValidMoves() {
        const validMoves = [];
        for (let col = 0; col < this.COLS; col++) {
            if (!this.isColumnFull(col)) {
                validMoves.push(col);
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
            // Create a snapshot of current game state before calling event handlers
            const stateSnapshot = {
                currentPlayer: this.currentPlayer,
                gameOver: this.gameOver,
                winner: this.winner,
                boardChecksum: JSON.stringify(this.board)
            };
            
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.warn('Event handler error:', error);
                }
            });
            
            // Restore state if it was corrupted by event handlers
            if (this.currentPlayer !== stateSnapshot.currentPlayer) {
                this.currentPlayer = stateSnapshot.currentPlayer;
            }
            if (this.gameOver !== stateSnapshot.gameOver) {
                this.gameOver = stateSnapshot.gameOver;
            }
            if (this.winner !== stateSnapshot.winner) {
                this.winner = stateSnapshot.winner;
            }
            if (JSON.stringify(this.board) !== stateSnapshot.boardChecksum) {
                // Board was modified - this is more complex to restore, so just warn
                console.warn('Event handler attempted to modify game board');
            }
        }
    }

    /**
     * Player utility methods
     */
    
    /**
     * Get player display name
     * @param {number} player - Player number (PLAYER1 or PLAYER2)
     * @returns {string} - Player display name
     */
    getPlayerName(player) {
        if (player === this.PLAYER1) {
            return '🔴';
        } else if (player === this.PLAYER2) {
            return '🟡';
        }
        return 'Unknown Player';
    }
    
    /**
     * Get player color CSS class
     * @param {number} player - Player number (PLAYER1 or PLAYER2)  
     * @returns {string} - CSS color class
     */
    getPlayerColorClass(player) {
        if (player === this.PLAYER1) {
            return 'red';
        } else if (player === this.PLAYER2) {
            return 'yellow';
        }
        return '';
    }

    /**
     * Utility methods for AI and analysis
     */

    /**
     * Simulate a move without modifying the actual game state
     * @param {number} col - Column to simulate move in
     * @returns {Object} - Simulation result
     */
    simulateMove(col) {
        if (this.isColumnFull(col)) {
            return { success: false, reason: 'Column is full' };
        }

        // Find the row where the piece would land
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
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

            if (count >= 4) {
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
        if (player === this.PLAYER1) {
            return this.playerConfig.redPlayer;
        }
        if (player === this.PLAYER2) {
            return this.playerConfig.yellowPlayer;
        }
        return 'Unbekannt';
    }

    /**
     * Get player color class
     * @param {number} player - Player number
     * @returns {string} - CSS class name
     */
    getPlayerColorClass(player) {
        if (player === this.PLAYER1) {
            return 'red';
        }
        if (player === this.PLAYER2) {
            return 'yellow';
        }
        return '';
    }

    /**
     * Undo the last move (for strategic analysis)
     */
    undoLastMove() {
        if (this.moveHistory.length === 0) {
            return false; // No moves to undo
        }

        const lastMove = this.moveHistory.pop();
        
        // Remove the piece from the board
        this.board[lastMove.row][lastMove.col] = this.EMPTY;
        
        // Switch back to previous player
        this.currentPlayer = lastMove.player;
        
        // Reset game state if it was over
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        
        return true;
    }
}
