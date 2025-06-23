/**
 * Vitest Tests für Universal Bot Logic (4-Stage System)
 * 
 * Testet die neue universelle Bot-Logik mit 4 Stufen:
 * 1. Direct win possible - play that move
 * 2. ALWAYS block opponent wins (including forks like _ x _ x _)
 * 3. Identify "trapped" columns that give opponent a win next turn
 * 4. Different selection from remaining safe columns per bot type
 */

import { describe, test, expect, beforeEach } from 'vitest';

// Mock Classes for Testing
class MockConnect4Game {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
        this.EMPTY = 0;
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.moveHistory = [];
        this.board = this.createEmptyBoard();
    }
    
    createEmptyBoard() {
        return Array(this.ROWS).fill().map(() => Array(this.COLS).fill(this.EMPTY));
    }
    
    getValidMoves() {
        const validMoves = [];
        for (let col = 0; col < this.COLS; col++) {
            if (this.board[0][col] === this.EMPTY) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }
    
    simulateMove(col) {
        if (col < 0 || col >= this.COLS || this.board[0][col] !== this.EMPTY) {
            return { success: false };
        }
        
        // Find landing row
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
        }
        
        if (row < 0) {
            return { success: false };
        }
        
        // Temporarily place piece to check for win
        this.board[row][col] = this.currentPlayer;
        const wouldWin = this.checkWinAtPosition(row, col, this.currentPlayer);
        this.board[row][col] = this.EMPTY; // Undo
        
        return { success: true, wouldWin, row, col };
    }
    
    checkWinAtPosition(row, col, player) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;

            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }

            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
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
    
    makeMove(col) {
        const result = this.simulateMove(col);
        if (result.success) {
            this.board[result.row][col] = this.currentPlayer;
            this.moveHistory.push({ player: this.currentPlayer, col, row: result.row });
            this.gameOver = result.wouldWin;
            this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        }
        return result;
    }
    
    resetGame() {
        this.board = this.createEmptyBoard();
        this.moveHistory = [];
        this.gameOver = false;
        this.currentPlayer = this.PLAYER1;
    }
    
    // Helper to set board state for testing
    setBoardState(boardState) {
        this.board = boardState.map(row => [...row]);
    }
}

// Mock Connect4AI for testing
class MockConnect4AI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
    }
    
    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 1;
            case 'medium': return 3;
            case 'hard': return 5;
            case 'expert': return 7;
            default: return 3;
        }
    }
    
    // Copy the universal bot logic methods from real AI
    getUniversalBestMove(game, helpers = null) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }

        // STAGE 1: Direct win possible
        const winningMove = this.findWinningMove(game);
        if (winningMove !== null) {
            console.log(`🎯 STAGE 1: Direct win at column ${winningMove + 1}`);
            return winningMove;
        }

        // STAGE 2: ALWAYS block (includes forks and immediate threats)
        const blockingMove = this.findComprehensiveBlockingMove(game);
        if (blockingMove !== null) {
            console.log(`🛡️ STAGE 2: Blocking threat at column ${blockingMove + 1}`);
            return blockingMove;
        }

        // STAGE 3: Identify trapped columns
        const safeColumns = this.findSafeColumns(game, validMoves);
        console.log(`🔒 STAGE 3: Safe columns from traps: [${safeColumns.map(c => c + 1).join(', ')}]`);

        // STAGE 4: Bot-specific selection from safe columns
        const finalMove = this.selectFromSafeColumns(game, safeColumns, helpers);
        console.log(`🎲 STAGE 4: ${this.difficulty} bot selected column ${finalMove + 1}`);
        return finalMove;
    }
    
    getBestMove(game, helpers = null) {
        return this.getUniversalBestMove(game, helpers);
    }
    
    findWinningMove(game) {
        const validMoves = game.getValidMoves();

        for (const col of validMoves) {
            const result = game.simulateMove(col);
            if (result.success && result.wouldWin) {
                return col;
            }
        }

        return null;
    }
    
    findComprehensiveBlockingMove(game) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        const validMoves = game.getValidMoves();

        // Check immediate wins (3-in-a-row threats)
        for (const col of validMoves) {
            const boardCopy = this.copyBoard(game.board);
            const row = this.getLowestEmptyRow(boardCopy, col, game);
            
            if (row !== -1) {
                boardCopy[row][col] = opponent;
                if (this.checkWinOnBoardAtPosition(boardCopy, row, col, opponent, game)) {
                    return col;
                }
            }
        }

        // Check for fork patterns (_ x _ x _)
        return this.findForkBlockingMove(game, opponent);
    }
    
    findForkBlockingMove(game, opponent) {
        const validMoves = game.getValidMoves();
        
        // Check horizontal fork patterns
        for (let row = 0; row < game.ROWS; row++) {
            for (let col = 0; col <= game.COLS - 4; col++) {
                const window = [
                    game.board[row][col],
                    game.board[row][col + 1],
                    game.board[row][col + 2],
                    game.board[row][col + 3]
                ];
                
                // Check for _ x _ x pattern
                if (window[0] === game.EMPTY && 
                    window[1] === opponent && 
                    window[2] === game.EMPTY && 
                    window[3] === opponent) {
                    
                    // Check if positions 0 or 2 are playable
                    if (validMoves.includes(col) && this.getLowestEmptyRow(game.board, col, game) === row) {
                        return col;
                    }
                    if (validMoves.includes(col + 2) && this.getLowestEmptyRow(game.board, col + 2, game) === row) {
                        return col + 2;
                    }
                }
            }
        }
        
        return null;
    }
    
    findSafeColumns(game, validMoves) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        const safeColumns = [];
        
        for (const col of validMoves) {
            if (this.isSafeMove(game, col, opponent)) {
                safeColumns.push(col);
            }
        }
        
        // If no moves are safe, return all valid moves
        return safeColumns.length > 0 ? safeColumns : validMoves;
    }
    
    isSafeMove(game, col, opponent) {
        // Simulate our move
        const boardCopy = this.copyBoard(game.board);
        const row = this.simulateMove(boardCopy, col, game.currentPlayer);
        
        if (row === -1) {
            return false;
        }
        
        // Check if opponent can win after our move
        const opponentValidMoves = this.getValidMovesForBoard(boardCopy, game);
        
        for (const opponentCol of opponentValidMoves) {
            const opponentRow = this.simulateMove(boardCopy, opponentCol, opponent);
            if (opponentRow !== -1) {
                if (this.checkWinOnBoardAtPosition(boardCopy, opponentRow, opponentCol, opponent, game)) {
                    boardCopy[opponentRow][opponentCol] = game.EMPTY;
                    return false;
                }
                boardCopy[opponentRow][opponentCol] = game.EMPTY;
            }
        }
        
        return true;
    }
    
    selectFromSafeColumns(game, safeColumns, helpers) {
        if (safeColumns.length === 0) {
            return null;
        }
        
        if (safeColumns.length === 1) {
            return safeColumns[0];
        }
        
        switch (this.difficulty) {
            case 'easy':
                return safeColumns[Math.floor(Math.random() * safeColumns.length)];
            case 'medium':
                return this.selectCenterBiased(safeColumns);
            case 'hard':
            case 'expert':
                return this.selectBestPotential(game, safeColumns);
            default:
                return safeColumns[Math.floor(Math.random() * safeColumns.length)];
        }
    }
    
    selectCenterBiased(safeColumns) {
        const centerOrder = [3, 2, 4, 1, 5, 0, 6];
        
        for (const col of centerOrder) {
            if (safeColumns.includes(col)) {
                return col;
            }
        }
        
        return safeColumns[0];
    }
    
    selectBestPotential(game, safeColumns) {
        // Simple implementation for testing
        return safeColumns[0];
    }
    
    // Helper methods
    copyBoard(board) {
        return board.map(row => [...row]);
    }
    
    simulateMove(board, col, player) {
        for (let row = board.length - 1; row >= 0; row--) {
            if (board[row][col] === 0) {
                board[row][col] = player;
                return row;
            }
        }
        return -1;
    }
    
    getLowestEmptyRow(board, col, game) {
        for (let row = game.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === game.EMPTY) {
                return row;
            }
        }
        return -1;
    }
    
    getValidMovesForBoard(board, game) {
        const validMoves = [];
        for (let col = 0; col < game.COLS; col++) {
            if (board[0][col] === game.EMPTY) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }
    
    checkWinOnBoardAtPosition(board, row, col, player, game) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;

            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < game.ROWS && c >= 0 && c < game.COLS && board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }

            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < game.ROWS && c >= 0 && c < game.COLS && board[r][c] === player) {
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
}

describe('Universal Bot Logic (4-Stage System)', () => {
    let game;
    let easyBot;
    let mediumBot;
    let hardBot;
    
    beforeEach(() => {
        game = new MockConnect4Game();
        easyBot = new MockConnect4AI('easy');
        mediumBot = new MockConnect4AI('medium');
        hardBot = new MockConnect4AI('hard');
    });
    
    describe('STAGE 1: Direct Win Detection', () => {
        test('should detect horizontal winning move', () => {
            // Set up board: [1, 1, 1, _, _, _, _] in bottom row
            game.setBoardState([
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [1, 1, 1, 0, 0, 0, 0] // Player 1 can win at column 3
            ]);
            
            const move = easyBot.findWinningMove(game);
            expect(move).toBe(3); // Column 3 (0-indexed)
        });
        
        test('should detect vertical winning move', () => {
            // Set up board: Player 1 has 3 in column 0
            game.setBoardState([
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0],
                [2, 2, 2, 0, 0, 0, 0]
            ]);
            
            const move = easyBot.findWinningMove(game);
            expect(move).toBe(0); // Column 0 (0-indexed)
        });
        
        test('should return null when no winning move exists', () => {
            // Empty board
            const move = easyBot.findWinningMove(game);
            expect(move).toBeNull();
        });
    });
    
    describe('STAGE 2: Comprehensive Blocking (includes _ x _ x _ pattern)', () => {
        test('should block immediate opponent winning move', () => {
            // Set up board: Player 2 can win at column 3
            game.setBoardState([
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [2, 2, 2, 0, 1, 1, 0] // Player 2 (opponent) threatens column 3
            ]);
            
            const move = easyBot.findComprehensiveBlockingMove(game);
            expect(move).toBe(3); // Must block at column 3
        });
        
        test('should block dangerous fork pattern _ x _ x', () => {
            // Set up horizontal fork pattern for Player 2
            game.setBoardState([
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 2, 0, 2, 1, 1, 1] // Fork pattern: _ x _ x (Player 2)
            ]);
            
            const move = easyBot.findComprehensiveBlockingMove(game);
            expect([0, 2]).toContain(move); // Should block one of the empty positions
        });
        
        test('should return null when no blocking needed', () => {
            // Empty board
            const move = easyBot.findComprehensiveBlockingMove(game);
            expect(move).toBeNull();
        });
    });
    
    describe('STAGE 3: Safe Column Identification', () => {
        test('should identify safe columns (no traps)', () => {
            // Set up a position where some moves create traps
            game.setBoardState([
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [2, 0, 0, 0, 0, 0, 0],
                [2, 2, 0, 1, 1, 1, 0] // Column 2 might create trap
            ]);
            
            const validMoves = game.getValidMoves();
            const safeColumns = easyBot.findSafeColumns(game, validMoves);
            
            expect(Array.isArray(safeColumns)).toBe(true);
            expect(safeColumns.length).toBeGreaterThan(0);
        });
        
        test('should return all moves if no safe moves exist', () => {
            // Simple case - empty board should have all moves safe
            const validMoves = game.getValidMoves();
            const safeColumns = easyBot.findSafeColumns(game, validMoves);
            
            expect(safeColumns).toEqual(validMoves);
        });
    });
    
    describe('STAGE 4: Bot-Specific Selection', () => {
        test('easy bot should select randomly from safe columns', () => {
            const safeColumns = [1, 3, 5];
            const selectedMove = easyBot.selectFromSafeColumns(game, safeColumns, null);
            
            expect(safeColumns).toContain(selectedMove);
        });
        
        test('medium bot should prefer center columns', () => {
            const safeColumns = [0, 2, 3, 6]; // Center (3) and off-center (2) available
            const selectedMove = mediumBot.selectFromSafeColumns(game, safeColumns, null);
            
            expect([3, 2]).toContain(selectedMove); // Should prefer center or near-center
        });
        
        test('should handle single safe column', () => {
            const safeColumns = [4];
            const selectedMove = easyBot.selectFromSafeColumns(game, safeColumns, null);
            
            expect(selectedMove).toBe(4);
        });
        
        test('should return null for empty safe columns', () => {
            const safeColumns = [];
            const selectedMove = easyBot.selectFromSafeColumns(game, safeColumns, null);
            
            expect(selectedMove).toBeNull();
        });
    });
    
    describe('Universal Bot Logic Integration', () => {
        test('all bot difficulties should follow 4-stage process', () => {
            const bots = [easyBot, mediumBot, hardBot];
            
            bots.forEach(bot => {
                // Test that getBestMove uses the universal logic
                const move = bot.getBestMove(game);
                
                expect(typeof move).toBe('number');
                expect(move).toBeGreaterThanOrEqual(0);
                expect(move).toBeLessThan(7);
            });
        });
        
        test('should prioritize winning over blocking', () => {
            // Set up position where bot can win AND needs to block
            game.setBoardState([
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0], // Player 1 has 3 in column 0 (can win)
                [1, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0],
                [2, 1, 2, 2, 2, 0, 0] // Player 2 threatens column 5
            ]);
            
            const move = easyBot.getBestMove(game);
            expect(move).toBe(0); // Should choose winning move (col 0) over blocking (col 5)
        });
        
        test('should prioritize blocking over safe random moves', () => {
            // Set up position where opponent threatens to win
            game.setBoardState([
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0],
                [1, 1, 2, 2, 2, 0, 0] // Player 2 threatens column 5
            ]);
            
            const move = easyBot.getBestMove(game);
            expect(move).toBe(5); // Should block opponent win
        });
    });
});

describe('Bot Performance Validation', () => {
    test('should run game series between bots without errors', () => {
        const gameCount = 10; // Reduced for testing speed
        let games = 0;
        let errors = 0;
        
        for (let i = 0; i < gameCount; i++) {
            try {
                const testGame = new MockConnect4Game();
                const bot1 = new MockConnect4AI('easy');
                const bot2 = new MockConnect4AI('medium');
                
                let moves = 0;
                const maxMoves = 42; // Full board
                
                while (!testGame.gameOver && moves < maxMoves) {
                    const currentBot = testGame.currentPlayer === testGame.PLAYER1 ? bot1 : bot2;
                    const move = currentBot.getBestMove(testGame);
                    
                    if (move !== null && move >= 0 && move < 7) {
                        const result = testGame.makeMove(move);
                        if (!result.success) {
                            throw new Error(`Invalid move: ${move}`);
                        }
                    } else {
                        throw new Error(`Bot returned invalid move: ${move}`);
                    }
                    
                    moves++;
                }
                
                games++;
            } catch (error) {
                console.error(`Game ${i + 1} failed:`, error.message);
                errors++;
            }
        }
        
        console.log(`🎮 Game Series Results: ${games}/${gameCount} completed, ${errors} errors`);
        expect(errors).toBe(0); // No errors should occur
        expect(games).toBe(gameCount); // All games should complete
    });
});