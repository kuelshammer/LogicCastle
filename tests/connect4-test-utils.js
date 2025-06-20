/**
 * Connect4TestUtils - Utility class for setting up test positions in Connect 4
 * 
 * Allows creating specific board states for testing AI behavior, edge cases,
 * and game logic without having to replay entire games.
 */
class Connect4TestUtils {
    /**
     * Create a test position from a pattern string
     * @param {Connect4Game} game - The game instance to modify
     * @param {string} pattern - Column pattern like "empty,red,empty,yellow-red,empty,yellow,empty"
     * @param {number} currentPlayer - Which player should be next (1 for red, 2 for yellow)
     * 
     * Pattern format:
     * - "empty" = empty column
     * - "red" = red piece at bottom
     * - "yellow" = yellow piece at bottom  
     * - "red-yellow" = red at bottom, yellow on top
     * - "yellow-red-yellow" = bottom to top: yellow, red, yellow
     */
    static createTestPosition(game, pattern, currentPlayer = 1) {
        // Reset game state
        this.resetGameState(game);
        
        // Parse and apply the pattern
        const columns = pattern.split(',');
        if (columns.length !== 7) {
            throw new Error(`Pattern must specify exactly 7 columns, got ${columns.length}`);
        }
        
        columns.forEach((colPattern, colIndex) => {
            this.setupColumn(game, colIndex, colPattern.trim());
        });
        
        // Set current player
        game.currentPlayer = currentPlayer;
        
        // Validate the resulting position
        this.validatePosition(game);
        
        // Update move history to maintain consistency
        this.updateMoveHistory(game);
        
        return game;
    }
    
    /**
     * Reset game to clean state
     */
    static resetGameState(game) {
        game.board = Array(6).fill().map(() => Array(7).fill(game.EMPTY));
        game.gameOver = false;
        game.winner = null;
        game.winningCells = [];
        game.moveHistory = [];
        game.currentPlayer = game.PLAYER1;
    }
    
    /**
     * Setup a single column based on pattern
     * @param {Connect4Game} game - Game instance
     * @param {number} colIndex - Column index (0-6)
     * @param {string} colPattern - Pattern for this column
     */
    static setupColumn(game, colIndex, colPattern) {
        if (colPattern === 'empty') {
            return; // Column already empty from reset
        }
        
        // Split pieces from bottom to top
        const pieces = colPattern.split('-');
        let row = game.ROWS - 1; // Start from bottom row
        
        pieces.forEach((piece, index) => {
            if (row < 0) {
                throw new Error(`Column ${colIndex + 1} has too many pieces: ${pieces.length} (max 6)`);
            }
            
            let player;
            switch (piece.toLowerCase()) {
                case 'red':
                case 'r':
                    player = game.PLAYER1;
                    break;
                case 'yellow':
                case 'y':
                    player = game.PLAYER2;
                    break;
                default:
                    throw new Error(`Invalid piece type: "${piece}". Use "red", "yellow", "r", or "y"`);
            }
            
            game.board[row][colIndex] = player;
            row--;
        });
    }
    
    /**
     * Validate that the position is physically possible
     * @param {Connect4Game} game - Game instance to validate
     */
    static validatePosition(game) {
        for (let col = 0; col < game.COLS; col++) {
            // Check each row from top to bottom (excluding bottom row)
            for (let row = 0; row < game.ROWS - 1; row++) {
                // If this cell has a piece but the cell below is empty, that's invalid (floating piece)
                if (game.board[row][col] !== game.EMPTY && 
                    game.board[row + 1][col] === game.EMPTY) {
                    throw new Error(
                        `Invalid position: floating piece at row ${row + 1}, column ${col + 1}. ` +
                        `Pieces must be stacked from bottom up.`
                    );
                }
            }
        }
    }
    
    /**
     * Update move history to reflect the current board state
     * This helps maintain consistency for undo functionality
     */
    static updateMoveHistory(game) {
        // Clear existing history
        game.moveHistory = [];
        
        // We can't perfectly reconstruct the history, but we can create a plausible one
        // by counting pieces and alternating players
        let totalMoves = 0;
        for (let row = 0; row < game.ROWS; row++) {
            for (let col = 0; col < game.COLS; col++) {
                if (game.board[row][col] !== game.EMPTY) {
                    totalMoves++;
                }
            }
        }
        
        // Create dummy move history (for undo button state, etc.)
        for (let i = 0; i < totalMoves; i++) {
            game.moveHistory.push({
                player: (i % 2) + 1,
                col: 0, // Dummy column
                row: 0, // Dummy row
                moveNumber: i + 1
            });
        }
    }
    
    /**
     * Create a position from a visual ASCII representation
     * @param {Connect4Game} game - Game instance
     * @param {string} asciiBoard - ASCII representation of the board
     * @param {number} currentPlayer - Current player
     * 
     * Example:
     * ". . . . . . ."
     * ". . . . . . ."
     * ". . . . . . ."
     * ". . . R . . ."
     * ". . Y R . . ."
     * ". R Y Y . Y ."
     */
    static createFromAscii(game, asciiBoard, currentPlayer = 1) {
        this.resetGameState(game);
        
        const lines = asciiBoard.trim().split('\n').map(line => line.trim());
        if (lines.length !== 6) {
            throw new Error(`ASCII board must have exactly 6 rows, got ${lines.length}`);
        }
        
        lines.forEach((line, row) => {
            const cells = line.split(/\s+/);
            if (cells.length !== 7) {
                throw new Error(`Row ${row + 1} must have exactly 7 columns, got ${cells.length}`);
            }
            
            cells.forEach((cell, col) => {
                switch (cell.toUpperCase()) {
                    case '.':
                        game.board[row][col] = game.EMPTY;
                        break;
                    case 'R':
                        game.board[row][col] = game.PLAYER1;
                        break;
                    case 'Y':
                        game.board[row][col] = game.PLAYER2;
                        break;
                    default:
                        throw new Error(`Invalid cell value: "${cell}". Use ".", "R", or "Y"`);
                }
            });
        });
        
        game.currentPlayer = currentPlayer;
        this.validatePosition(game);
        this.updateMoveHistory(game);
        
        return game;
    }
    
    /**
     * Convert current board state to ASCII representation for debugging
     * @param {Connect4Game} game - Game instance
     * @returns {string} ASCII representation
     */
    static toAscii(game) {
        let ascii = '';
        for (let row = 0; row < game.ROWS; row++) {
            const line = [];
            for (let col = 0; col < game.COLS; col++) {
                switch (game.board[row][col]) {
                    case game.EMPTY:
                        line.push('.');
                        break;
                    case game.PLAYER1:
                        line.push('R');
                        break;
                    case game.PLAYER2:
                        line.push('Y');
                        break;
                }
            }
            ascii += line.join(' ') + '\n';
        }
        return ascii.trim();
    }
    
    /**
     * Quick setup for common test scenarios
     */
    static scenarios = {
        /**
         * Red can win in column 4
         */
        redWinning: "empty,empty,empty,red-red-red,empty,empty,empty",
        
        /**
         * Yellow must block red's threat in column 1
         */
        yellowMustBlock: "red-red-red,empty,empty,empty,empty,empty,empty",
        
        /**
         * Trap scenario - some moves create opponent threats
         */
        trapScenario: "empty,red,yellow,red-yellow,yellow-red,red,empty",
        
        /**
         * Complex position with multiple threats
         */
        complexThreats: "red,yellow-red,red-yellow,yellow-red-yellow,red-yellow-red,yellow,red",
        
        /**
         * Almost full board
         */
        almostFull: "red-yellow-red-yellow-red,yellow-red-yellow-red-yellow,red-yellow-red-yellow-red,yellow-red-yellow-red-yellow,red-yellow-red-yellow-red,yellow-red-yellow-red-yellow,red-yellow-red-yellow"
    };
    
    /**
     * Load a predefined scenario
     * @param {Connect4Game} game - Game instance
     * @param {string} scenarioName - Name of the scenario
     * @param {number} currentPlayer - Current player
     */
    static loadScenario(game, scenarioName, currentPlayer = 1) {
        if (!(scenarioName in this.scenarios)) {
            throw new Error(`Unknown scenario: "${scenarioName}". Available: ${Object.keys(this.scenarios).join(', ')}`);
        }
        
        return this.createTestPosition(game, this.scenarios[scenarioName], currentPlayer);
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Connect4TestUtils;
}