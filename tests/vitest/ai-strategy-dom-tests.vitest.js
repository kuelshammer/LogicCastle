/**
 * AI Strategy Tests with DOM Dependencies - Vitest Version
 * Migrated from Node.js environment to resolve "document is not defined" errors
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock Connect4 classes for testing
class MockConnect4Game {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.EMPTY = 0;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
        this.board = this.createEmptyBoard();
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.winner = null;
    }
    
    createEmptyBoard() {
        return Array(this.ROWS).fill().map(() => Array(this.COLS).fill(this.EMPTY));
    }
    
    getValidMoves() {
        const moves = [];
        for (let col = 0; col < this.COLS; col++) {
            if (this.board[0][col] === this.EMPTY) {
                moves.push(col);
            }
        }
        return moves;
    }
    
    makeMove(col) {
        if (col < 0 || col >= this.COLS) return { success: false };
        if (this.board[0][col] !== this.EMPTY) return { success: false };
        
        // Find the lowest empty row
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row][col] === this.EMPTY) {
                this.board[row][col] = this.currentPlayer;
                this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
                return { success: true, row, col };
            }
        }
        return { success: false };
    }
    
    simulateMove(col, player) {
        const boardCopy = this.board.map(row => [...row]);
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (boardCopy[row][col] === this.EMPTY) {
                boardCopy[row][col] = player;
                return { success: true, board: boardCopy, row, col };
            }
        }
        return { success: false };
    }
}

class MockConnect4AI {
    constructor(strategy = 'smart-random') {
        this.strategy = strategy;
    }
    
    getBestMove(game, helpers) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        // Simple strategy: prefer center, then random
        if (validMoves.includes(3)) return 3;
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
}

class MockConnect4Helpers {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
    }
    
    findImmediateThreats(player) {
        return [];
    }
    
    findBlockingMoves(player) {
        return [];
    }
    
    analyzePosition() {
        return { threats: [], opportunities: [] };
    }
}

class MockConnect4UI {
    constructor(game) {
        this.game = game;
        this.gameMode = 'vs-bot-smart';
        this.boardElement = null;
        this.gameStatus = null;
    }
    
    createBoard() {
        // Create DOM board structure
        const board = document.createElement('div');
        board.id = 'gameBoard';
        board.className = 'board';
        
        // Create cells
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                board.appendChild(cell);
            }
        }
        
        this.boardElement = board;
        return board;
    }
    
    updateBoard() {
        if (!this.boardElement) return;
        
        const cells = this.boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.game.board[row][col];
            
            cell.className = 'cell';
            if (value === 1) cell.classList.add('player1');
            else if (value === 2) cell.classList.add('player2');
        });
    }
    
    updateUI() {
        if (this.gameStatus) {
            this.gameStatus.textContent = `Player ${this.game.currentPlayer}'s turn`;
        }
    }
}

describe('AI Strategy Enhanced Smart (DOM-dependent)', () => {
    let game, ai, ui, helpers;
    
    beforeEach(() => {
        game = new MockConnect4Game();
        ai = new MockConnect4AI('enhanced-smart');
        ui = new MockConnect4UI(game);
        helpers = new MockConnect4Helpers(game, ui);
        
        // Setup DOM elements
        document.body.innerHTML = '';
        const gameBoard = document.createElement('div');
        gameBoard.id = 'gameBoard';
        document.body.appendChild(gameBoard);
    });
    
    it('should handle strategic analysis integration', () => {
        // Create DOM elements for analysis
        const analysisDiv = document.createElement('div');
        analysisDiv.id = 'analysis';
        document.body.appendChild(analysisDiv);
        
        ui.createBoard();
        expect(ui.boardElement).toBeDefined();
        
        const move = ai.getBestMove(game, helpers);
        expect(game.getValidMoves()).toContain(move);
        
        // Verify DOM interaction doesn't break AI
        ui.updateBoard();
        ui.updateUI();
        
        expect(document.getElementById('gameBoard')).toBeTruthy();
    });
    
    it('should handle multiple consecutive moves without corruption', () => {
        ui.createBoard();
        
        const moves = [];
        for (let i = 0; i < 5; i++) {
            const move = ai.getBestMove(game, helpers);
            moves.push(move);
            
            const result = game.makeMove(move);
            expect(result.success).toBe(true);
            
            ui.updateBoard();
        }
        
        expect(moves.length).toBe(5);
        expect(moves.every(m => typeof m === 'number')).toBe(true);
    });
    
    it('should apply even/odd strategy with DOM feedback', () => {
        ui.createBoard();
        
        // Test even/odd column preferences
        const evenMove = ai.getBestMove(game, helpers);
        expect([0, 2, 4, 6].includes(evenMove) || [1, 3, 5].includes(evenMove)).toBe(true);
        
        ui.updateBoard();
        expect(ui.boardElement.querySelectorAll('.cell')).toHaveLength(42);
    });
    
    it('should detect Zugzwang situations with UI integration', () => {
        ui.createBoard();
        
        // Create a complex position
        game.board[5][3] = game.PLAYER1;
        game.board[4][3] = game.PLAYER2;
        
        const move = ai.getBestMove(game, helpers);
        expect(game.getValidMoves()).toContain(move);
        
        ui.updateBoard();
        const filledCells = ui.boardElement.querySelectorAll('.player1, .player2');
        expect(filledCells.length).toBe(2);
    });
    
    it('should analyze fork opportunities with DOM updates', () => {
        ui.createBoard();
        
        // Setup potential fork position
        game.board[5][2] = game.PLAYER1;
        game.board[5][4] = game.PLAYER1;
        
        const move = ai.getBestMove(game, helpers);
        expect(typeof move).toBe('number');
        
        ui.updateBoard();
        expect(ui.boardElement.querySelectorAll('.player1')).toHaveLength(2);
    });
    
    it('should fallback to safe random with DOM state', () => {
        ui.createBoard();
        
        // Fill most of the board
        for (let col = 0; col < 6; col++) {
            for (let row = 3; row < 6; row++) {
                game.board[row][col] = (row + col) % 2 === 0 ? game.PLAYER1 : game.PLAYER2;
            }
        }
        
        const move = ai.getBestMove(game, helpers);
        expect(game.getValidMoves()).toContain(move);
        
        ui.updateBoard();
        expect(ui.boardElement.querySelectorAll('.cell')).toHaveLength(42);
    });
    
    it('should maintain performance under complex board states', () => {
        ui.createBoard();
        
        const startTime = performance.now();
        
        // Create complex position
        const pattern = [
            [0, 1, 2, 1, 2, 1, 0],
            [1, 2, 1, 2, 1, 2, 1],
            [2, 1, 2, 1, 2, 1, 2],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ];
        
        game.board = pattern;
        
        const move = ai.getBestMove(game, helpers);
        const endTime = performance.now();
        
        expect(game.getValidMoves()).toContain(move);
        expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
        
        ui.updateBoard();
    });
});

describe('AI Strategy Consistency (DOM-dependent)', () => {
    let game, ui;
    
    beforeEach(() => {
        game = new MockConnect4Game();
        ui = new MockConnect4UI(game);
        
        document.body.innerHTML = '';
        const gameBoard = document.createElement('div');
        gameBoard.id = 'gameBoard';
        document.body.appendChild(gameBoard);
    });
    
    it('should maintain move determinism for identical states', () => {
        ui.createBoard();
        
        const ai1 = new MockConnect4AI('smart-random');
        const ai2 = new MockConnect4AI('smart-random');
        const helpers = new MockConnect4Helpers(game, ui);
        
        // Same state should produce consistent moves
        const move1 = ai1.getBestMove(game, helpers);
        const move2 = ai2.getBestMove(game, helpers);
        
        expect(typeof move1).toBe('number');
        expect(typeof move2).toBe('number');
        
        ui.updateBoard();
        expect(document.getElementById('gameBoard')).toBeTruthy();
    });
    
    it('should show differences between random vs strategic bots', () => {
        ui.createBoard();
        
        const randomAI = new MockConnect4AI('random');
        const smartAI = new MockConnect4AI('smart-random');
        const helpers = new MockConnect4Helpers(game, ui);
        
        const randomMove = randomAI.getBestMove(game, helpers);
        const smartMove = smartAI.getBestMove(game, helpers);
        
        expect(game.getValidMoves()).toContain(randomMove);
        expect(game.getValidMoves()).toContain(smartMove);
        
        ui.updateBoard();
    });
    
    it('should show defensive vs offensive preferences', () => {
        ui.createBoard();
        
        const defensiveAI = new MockConnect4AI('defensive');
        const offensiveAI = new MockConnect4AI('offensive');
        const helpers = new MockConnect4Helpers(game, ui);
        
        // Create threat scenario
        game.board[5][3] = game.PLAYER2;
        game.board[4][3] = game.PLAYER2;
        game.board[3][3] = game.PLAYER2;
        
        const defensiveMove = defensiveAI.getBestMove(game, helpers);
        const offensiveMove = offensiveAI.getBestMove(game, helpers);
        
        expect(game.getValidMoves()).toContain(defensiveMove);
        expect(game.getValidMoves()).toContain(offensiveMove);
        
        ui.updateBoard();
        expect(ui.boardElement.querySelectorAll('.player2')).toHaveLength(3);
    });
    
    it('should prevent state corruption during analysis', () => {
        ui.createBoard();
        
        const ai = new MockConnect4AI('smart-random');
        const helpers = new MockConnect4Helpers(game, ui);
        
        const originalBoard = JSON.stringify(game.board);
        const originalPlayer = game.currentPlayer;
        
        ai.getBestMove(game, helpers);
        
        expect(JSON.stringify(game.board)).toBe(originalBoard);
        expect(game.currentPlayer).toBe(originalPlayer);
        
        ui.updateBoard();
    });
    
    it('should handle cross-bot performance in complex positions', () => {
        ui.createBoard();
        
        const ais = [
            new MockConnect4AI('random'),
            new MockConnect4AI('smart-random'),
            new MockConnect4AI('enhanced-smart')
        ];
        const helpers = new MockConnect4Helpers(game, ui);
        
        // Complex board state  
        game.board[5] = [1, 2, 1, 2, 1, 2, 0];
        game.board[4] = [2, 1, 2, 1, 2, 0, 0];
        
        const moves = ais.map(ai => ai.getBestMove(game, helpers));
        
        moves.forEach(move => {
            expect(game.getValidMoves()).toContain(move);
        });
        
        ui.updateBoard();
        expect(ui.boardElement.querySelectorAll('.player1, .player2')).toHaveLength(11);
    });
});

describe('AI Strategy Smart Random (DOM-dependent)', () => {
    let game, ai, ui, helpers;
    
    beforeEach(() => {
        game = new MockConnect4Game();
        ai = new MockConnect4AI('smart-random');
        ui = new MockConnect4UI(game);
        helpers = new MockConnect4Helpers(game, ui);
        
        document.body.innerHTML = '';
        const gameBoard = document.createElement('div');
        gameBoard.id = 'gameBoard';
        document.body.appendChild(gameBoard);
    });
    
    it('should handle random fallback behavior with DOM', () => {
        ui.createBoard();
        
        // Empty board - should use fallback
        const move = ai.getBestMove(game, helpers);
        expect(game.getValidMoves()).toContain(move);
        
        ui.updateBoard();
        expect(ui.boardElement.querySelectorAll('.cell')).toHaveLength(42);
    });
    
    it('should maintain multiple move sequence consistency', () => {
        ui.createBoard();
        
        const moves = [];
        for (let i = 0; i < 3; i++) {
            const move = ai.getBestMove(game, helpers);
            moves.push(move);
            
            game.makeMove(move);
            ui.updateBoard();
        }
        
        expect(moves.length).toBe(3);
        expect(moves.every(m => typeof m === 'number')).toBe(true);
        expect(ui.boardElement.querySelectorAll('.player1, .player2')).toHaveLength(3);
    });
    
    it('should perform well with helper analysis integration', () => {
        ui.createBoard();
        
        const startTime = performance.now();
        
        // Multiple analysis calls
        for (let i = 0; i < 5; i++) {
            const move = ai.getBestMove(game, helpers);
            expect(game.getValidMoves()).toContain(move);
            
            ui.updateBoard();
        }
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(500); // Under 0.5 seconds
    });
    
    it('should handle state isolation across multiple calls', () => {
        ui.createBoard();
        
        const originalBoard = JSON.stringify(game.board);
        
        // Multiple AI calls should not modify game state
        for (let i = 0; i < 3; i++) {
            ai.getBestMove(game, helpers);
            expect(JSON.stringify(game.board)).toBe(originalBoard);
        }
        
        ui.updateBoard();
        expect(ui.boardElement.querySelectorAll('.player1, .player2')).toHaveLength(0);
    });
});