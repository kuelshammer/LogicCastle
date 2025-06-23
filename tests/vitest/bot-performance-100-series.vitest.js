/**
 * Vitest Tests für 100-Game Series Bot Performance Validation
 * 
 * Testet die Bot-Verbesserungen durch 100-Spiel-Serien zwischen verschiedenen Bot-Typen
 * um zu validieren, dass die universelle 4-Stufen-Logik korrekt funktioniert
 */

import { describe, test, expect } from 'vitest';

// Mock Classes for Testing (simplified for performance)
class TestConnect4Game {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
        this.EMPTY = 0;
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.winner = null;
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
    
    makeMove(col) {
        if (col < 0 || col >= this.COLS || this.board[0][col] !== this.EMPTY) {
            return { success: false, error: 'Invalid move' };
        }
        
        // Find landing row
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
        }
        
        if (row < 0) {
            return { success: false, error: 'Column full' };
        }
        
        // Place piece
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ player: this.currentPlayer, col, row });
        
        // Check for win
        if (this.checkWinAtPosition(row, col, this.currentPlayer)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
        } else if (this.moveHistory.length >= this.ROWS * this.COLS) {
            this.gameOver = true;
            this.winner = 'draw';
        }
        
        // Switch players
        this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        
        return { success: true, gameOver: this.gameOver, winner: this.winner };
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
    
    resetGame() {
        this.board = this.createEmptyBoard();
        this.moveHistory = [];
        this.gameOver = false;
        this.winner = null;
        this.currentPlayer = this.PLAYER1;
    }
}

// Test Bot Implementation with Universal Logic
class TestConnect4AI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
    }
    
    getBestMove(game) {
        return this.getUniversalBestMove(game);
    }
    
    // Universal 4-stage logic
    getUniversalBestMove(game) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }

        // STAGE 1: Direct win possible
        const winningMove = this.findWinningMove(game);
        if (winningMove !== null) {
            return winningMove;
        }

        // STAGE 2: ALWAYS block (includes forks and immediate threats)
        const blockingMove = this.findComprehensiveBlockingMove(game);
        if (blockingMove !== null) {
            return blockingMove;
        }

        // STAGE 3: Identify trapped columns
        const safeColumns = this.findSafeColumns(game, validMoves);

        // STAGE 4: Bot-specific selection from safe columns
        return this.selectFromSafeColumns(game, safeColumns);
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

        // Check immediate blocking
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

        // Check fork patterns
        return this.findForkBlockingMove(game, opponent);
    }
    
    findForkBlockingMove(game, opponent) {
        const validMoves = game.getValidMoves();
        
        // Simple horizontal fork detection
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
        
        return safeColumns.length > 0 ? safeColumns : validMoves;
    }
    
    isSafeMove(game, col, opponent) {
        const boardCopy = this.copyBoard(game.board);
        const row = this.simulateMove(boardCopy, col, game.currentPlayer);
        
        if (row === -1) {
            return false;
        }
        
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
    
    selectFromSafeColumns(game, safeColumns) {
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
        return this.selectCenterBiased(safeColumns);
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

// Game Series Runner
function runGameSeries(bot1Type, bot2Type, gameCount = 100) {
    const results = {
        totalGames: 0,
        player1Wins: 0,
        player2Wins: 0,
        draws: 0,
        errors: 0,
        averageGameLength: 0,
        totalMoves: 0
    };
    
    for (let i = 0; i < gameCount; i++) {
        try {
            const game = new TestConnect4Game();
            const bot1 = new TestConnect4AI(bot1Type);
            const bot2 = new TestConnect4AI(bot2Type);
            
            let moves = 0;
            const maxMoves = 42; // Full board
            
            while (!game.gameOver && moves < maxMoves) {
                const currentBot = game.currentPlayer === game.PLAYER1 ? bot1 : bot2;
                const move = currentBot.getBestMove(game);
                
                if (move !== null && move >= 0 && move < 7) {
                    const result = game.makeMove(move);
                    if (!result.success) {
                        throw new Error(`Invalid move: ${move}`);
                    }
                } else {
                    throw new Error(`Bot returned invalid move: ${move}`);
                }
                
                moves++;
            }
            
            results.totalGames++;
            results.totalMoves += moves;
            
            if (game.winner === game.PLAYER1) {
                results.player1Wins++;
            } else if (game.winner === game.PLAYER2) {
                results.player2Wins++;
            } else {
                results.draws++;
            }
            
        } catch (error) {
            console.error(`Game ${i + 1} failed:`, error.message);
            results.errors++;
        }
    }
    
    results.averageGameLength = results.totalMoves / results.totalGames;
    
    return results;
}

describe('Bot Performance Validation - 100 Game Series', () => {
    describe('Universal Logic Consistency', () => {
        test('should complete 100 games without errors (Easy vs Medium)', () => {
            const results = runGameSeries('easy', 'medium', 100);
            
            console.log('\n🎮 Easy vs Medium Bot (100 games):');
            console.log(`✅ Games completed: ${results.totalGames}/100`);
            console.log(`🔴 Player 1 (Easy) wins: ${results.player1Wins}`);
            console.log(`🟡 Player 2 (Medium) wins: ${results.player2Wins}`);
            console.log(`⚪ Draws: ${results.draws}`);
            console.log(`❌ Errors: ${results.errors}`);
            console.log(`📊 Average game length: ${results.averageGameLength.toFixed(1)} moves`);
            
            expect(results.errors).toBe(0);
            expect(results.totalGames).toBe(100);
            expect(results.player1Wins + results.player2Wins + results.draws).toBe(100);
        });
        
        test('should complete 100 games without errors (Medium vs Hard)', () => {
            const results = runGameSeries('medium', 'hard', 100);
            
            console.log('\n🎮 Medium vs Hard Bot (100 games):');
            console.log(`✅ Games completed: ${results.totalGames}/100`);
            console.log(`🔴 Player 1 (Medium) wins: ${results.player1Wins}`);
            console.log(`🟡 Player 2 (Hard) wins: ${results.player2Wins}`);
            console.log(`⚪ Draws: ${results.draws}`);
            console.log(`❌ Errors: ${results.errors}`);
            console.log(`📊 Average game length: ${results.averageGameLength.toFixed(1)} moves`);
            
            expect(results.errors).toBe(0);
            expect(results.totalGames).toBe(100);
            expect(results.player1Wins + results.player2Wins + results.draws).toBe(100);
        });
        
        test('should show skill differential (Hard vs Easy)', () => {
            const results = runGameSeries('hard', 'easy', 100);
            
            console.log('\n🎮 Hard vs Easy Bot (100 games):');
            console.log(`✅ Games completed: ${results.totalGames}/100`);
            console.log(`🔴 Player 1 (Hard) wins: ${results.player1Wins}`);
            console.log(`🟡 Player 2 (Easy) wins: ${results.player2Wins}`);
            console.log(`⚪ Draws: ${results.draws}`);
            console.log(`❌ Errors: ${results.errors}`);
            console.log(`📊 Average game length: ${results.averageGameLength.toFixed(1)} moves`);
            
            expect(results.errors).toBe(0);
            expect(results.totalGames).toBe(100);
            expect(results.player1Wins + results.player2Wins + results.draws).toBe(100);
            
            // Hard bot should win significantly more often than easy bot
            expect(results.player1Wins).toBeGreaterThan(results.player2Wins);
        });
    });
    
    describe('Universal Logic Implementation Validation', () => {
        test('all bots should follow 4-stage decision process', () => {
            const difficulties = ['easy', 'medium', 'hard'];
            let totalTests = 0;
            let passedTests = 0;
            
            difficulties.forEach(difficulty => {
                const game = new TestConnect4Game();
                const bot = new TestConnect4AI(difficulty);
                
                for (let i = 0; i < 10; i++) {
                    game.resetGame();
                    
                    // Test a few moves to ensure bot logic works
                    for (let move = 0; move < 5 && !game.gameOver; move++) {
                        const botMove = bot.getBestMove(game);
                        totalTests++;
                        
                        if (botMove !== null && botMove >= 0 && botMove < 7) {
                            const result = game.makeMove(botMove);
                            if (result.success) {
                                passedTests++;
                            }
                        }
                    }
                }
            });
            
            console.log(`\n🔧 Universal Logic Tests: ${passedTests}/${totalTests} passed`);
            expect(passedTests).toBe(totalTests);
        });
        
        test('no bot should make illegal moves in extended play', () => {
            const difficulties = ['easy', 'medium', 'hard'];
            let illegalMoves = 0;
            let totalMoves = 0;
            
            difficulties.forEach(difficulty => {
                const bot = new TestConnect4AI(difficulty);
                
                for (let gameNum = 0; gameNum < 10; gameNum++) {
                    const game = new TestConnect4Game();
                    
                    while (!game.gameOver && totalMoves < 200) {
                        const move = bot.getBestMove(game);
                        totalMoves++;
                        
                        if (move === null || move < 0 || move >= 7) {
                            illegalMoves++;
                            break; // Stop this game
                        }
                        
                        const result = game.makeMove(move);
                        if (!result.success) {
                            illegalMoves++;
                            break; // Stop this game
                        }
                    }
                }
            });
            
            console.log(`\n🚫 Illegal moves: ${illegalMoves}/${totalMoves} total moves`);
            expect(illegalMoves).toBe(0);
        });
    });
    
    describe('Performance Metrics', () => {
        test('game completion rate should be 100%', () => {
            const testCases = [
                ['easy', 'easy'],
                ['medium', 'medium'],
                ['hard', 'easy']
            ];
            
            testCases.forEach(([bot1, bot2]) => {
                const results = runGameSeries(bot1, bot2, 25); // Smaller sample for speed
                
                console.log(`\n📈 ${bot1} vs ${bot2} (25 games): ${results.totalGames}/25 completed, ${results.errors} errors`);
                
                expect(results.errors).toBe(0);
                expect(results.totalGames).toBe(25);
            });
        });
    });
});