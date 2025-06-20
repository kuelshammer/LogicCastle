/**
 * GobangGame - Core game logic for Gobang (5-in-a-row)
 */
class GobangGame {
    constructor() {
        this.BOARD_SIZE = 15;
        this.EMPTY = 0;
        this.BLACK = 1; // First player
        this.WHITE = 2; // Second player
        this.WIN_COUNT = 5; // Need 5 in a row to win

        this.board = [];
        this.currentPlayer = this.BLACK;
        this.gameOver = false;
        this.winner = null;
        this.winningStones = [];
        this.moveHistory = [];
        this.scores = { black: 0, white: 0 };

        this.initializeBoard();

        // Event system
        this.eventListeners = {};
    }

    /**
     * Initialize empty game board
     */
    initializeBoard() {
        this.board = [];
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                this.board[row][col] = this.EMPTY;
            }
        }
    }

    /**
     * Reset game to initial state
     */
    resetGame() {
        this.initializeBoard();
        this.currentPlayer = this.BLACK;
        this.gameOver = false;
        this.winner = null;
        this.winningStones = [];
        this.moveHistory = [];
        this.emit('gameReset');
        this.emit('playerChanged', this.currentPlayer);
    }

    /**
     * Reset only the scores
     */
    resetScores() {
        this.scores = { black: 0, white: 0 };
        this.emit('scoresReset');
    }

    /**
     * Make a move at the specified position
     * @param {number} row - Row index (0-14)
     * @param {number} col - Column index (0-14)
     * @returns {Object} - Move result with success status and position
     */
    makeMove(row, col) {
        if (this.gameOver) {
            return { success: false, reason: 'Game is over' };
        }

        if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) {
            return { success: false, reason: 'Invalid position' };
        }

        if (this.board[row][col] !== this.EMPTY) {
            return { success: false, reason: 'Position is occupied' };
        }

        // Place the stone
        this.board[row][col] = this.currentPlayer;

        // Record the move
        const move = { row, col, player: this.currentPlayer, moveNumber: this.moveHistory.length + 1 };
        this.moveHistory.push(move);

        // Emit move event
        this.emit('moveMade', move);

        // Check for win
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.scores[this.currentPlayer === this.BLACK ? 'black' : 'white']++;
            this.emit('gameWon', { winner: this.winner, winningStones: this.winningStones });
            return { success: true, row, col, gameWon: true, winner: this.winner };
        }

        // Check for draw (board full - though this is extremely rare in Gobang)
        if (this.isDraw()) {
            this.gameOver = true;
            this.emit('gameDraw');
            return { success: true, row, col, gameDraw: true };
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === this.BLACK ? this.WHITE : this.BLACK;
        this.emit('playerChanged', this.currentPlayer);

        return { success: true, row, col };
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
        this.winningStones = [];
        this.currentPlayer = lastMove.player;

        this.emit('moveUndone', lastMove);
        this.emit('playerChanged', this.currentPlayer);

        return { success: true, move: lastMove };
    }

    /**
     * Check if the current move results in a win
     * @param {number} row - Row of the last placed stone
     * @param {number} col - Column of the last placed stone
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
            const stones = this.getConnectedStones(row, col, deltaRow, deltaCol, player);
            if (stones.length >= this.WIN_COUNT) {
                this.winningStones = stones;
                return true;
            }
        }

        return false;
    }

    /**
     * Get connected stones in a specific direction
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} deltaRow - Row direction
     * @param {number} deltaCol - Column direction
     * @param {number} player - Player number
     * @returns {Array} - Array of connected stone positions
     */
    getConnectedStones(row, col, deltaRow, deltaCol, player) {
        const stones = [{ row, col }];

        // Check positive direction
        let r = row + deltaRow;
        let c = col + deltaCol;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && this.board[r][c] === player) {
            stones.push({ row: r, col: c });
            r += deltaRow;
            c += deltaCol;
        }

        // Check negative direction
        r = row - deltaRow;
        c = col - deltaCol;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && this.board[r][c] === player) {
            stones.unshift({ row: r, col: c });
            r -= deltaRow;
            c -= deltaCol;
        }

        return stones;
    }

    /**
     * Check if the game is a draw (board full)
     * @returns {boolean} - True if draw condition is met
     */
    isDraw() {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
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
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
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
            winningStones: [...this.winningStones],
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
        this.winningStones = [...state.winningStones];
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
            let count = 1; // Count the placed stone

            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }

            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === player) {
                count++;
                r -= deltaRow;
                c -= deltaCol;
            }

            if (count >= this.WIN_COUNT) {
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
        if (player === this.BLACK) {
            return 'Spieler 1 (Schwarz)';
        }
        if (player === this.WHITE) {
            return 'Spieler 2 (Weiß)';
        }
        return 'Unbekannt';
    }

    /**
     * Get player color class
     * @param {number} player - Player number
     * @returns {string} - CSS class name
     */
    getPlayerColorClass(player) {
        if (player === this.BLACK) {
            return 'black';
        }
        if (player === this.WHITE) {
            return 'white';
        }
        return '';
    }

    /**
     * Convert position to board notation (A1-O15)
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {string} - Board notation
     */
    positionToNotation(row, col) {
        const colLetter = String.fromCharCode(65 + col); // A-O
        const rowNumber = this.BOARD_SIZE - row; // 15-1
        return `${colLetter}${rowNumber}`;
    }

    /**
     * Convert board notation to position
     * @param {string} notation - Board notation (A1-O15)
     * @returns {Object} - Position object {row, col}
     */
    notationToPosition(notation) {
        const col = notation.charCodeAt(0) - 65; // A-O to 0-14
        const row = this.BOARD_SIZE - parseInt(notation.slice(1)); // 15-1 to 0-14
        return { row, col };
    }

    /**
     * Get last move
     * @returns {Object|null} - Last move object or null
     */
    getLastMove() {
        return this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
    }

    /**
     * Count consecutive stones in a direction
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} deltaRow - Row direction
     * @param {number} deltaCol - Column direction
     * @param {number} player - Player to count for
     * @returns {number} - Number of consecutive stones
     */
    countConsecutive(row, col, deltaRow, deltaCol, player) {
        let count = 0;
        let r = row;
        let c = col;

        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && this.board[r][c] === player) {
            count++;
            r += deltaRow;
            c += deltaCol;
        }

        return count;
    }

    /**
     * Evaluate position strength for AI
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

        // Center bias - positions closer to center are generally better
        const centerRow = Math.floor(this.BOARD_SIZE / 2);
        const centerCol = Math.floor(this.BOARD_SIZE / 2);
        const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        score += (this.BOARD_SIZE - distanceFromCenter) * 2;

        // Check for immediate win
        if (this.simulateMove(row, col).wouldWin) {
            score += 10000;
        }

        // Check for blocking opponent win
        const opponent = player === this.BLACK ? this.WHITE : this.BLACK;
        const originalPlayer = this.currentPlayer;
        this.currentPlayer = opponent;
        if (this.simulateMove(row, col).wouldWin) {
            score += 5000; // High priority to block
        }
        this.currentPlayer = originalPlayer;

        return score;
    }
}
