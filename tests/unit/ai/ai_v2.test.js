/**
 * Unit Tests for Connect4 AI (ai_v2.js)
 * Tests the AI decision-making logic and strategic scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Player constants
global.Player = {
    Yellow: 1,
    Red: 2
};
global.window = global;

// Mock CoordUtils
vi.mock('../../../assets/js/coord-utils.js', () => ({
    CoordUtils: {
        gridToIndex: vi.fn((row, col, width) => row * width + col)
    }
}));

describe('Connect4 AI Unit Tests', () => {
    let Connect4AI;
    let mockGame;

    beforeEach(() => {
        // Import AI after mocking
        const aiModule = require('../../../games/connect4/js/ai_v2.js');
        Connect4AI = aiModule.Connect4AI;
        
        mockGame = {
            BOARD_SIZE: 6,
            BOARD_WIDTH: 7,
            getBoard: vi.fn(() => Array(42).fill(0)), // Flat array representation
            getCurrentPlayer: vi.fn(() => 1),
            getValidMoves: vi.fn(() => [0, 1, 2, 3, 4, 5, 6]),
            makeMove: vi.fn(),
            checkWin: vi.fn(() => null),
            isValidMove: vi.fn((col) => col >= 0 && col < 7)
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('1. AI Static Methods', () => {
        it('should return valid move for getBestMove', () => {
            const move = Connect4AI.getBestMove(mockGame, 1);
            
            expect(move).toBeGreaterThanOrEqual(0);
            expect(move).toBeLessThanOrEqual(6);
        });

        it('should handle different difficulty levels', () => {
            const easyMove = Connect4AI.getBestMove(mockGame, 1);
            const hardMove = Connect4AI.getBestMove(mockGame, 4);
            
            expect(easyMove).toBeGreaterThanOrEqual(0);
            expect(easyMove).toBeLessThanOrEqual(6);
            expect(hardMove).toBeGreaterThanOrEqual(0);
            expect(hardMove).toBeLessThanOrEqual(6);
        });

        it('should return -1 when no valid moves available', () => {
            mockGame.getValidMoves.mockReturnValue([]);
            
            const move = Connect4AI.getBestMove(mockGame, 3);
            expect(move).toBe(-1);
        });
    });

    describe('2. Board Evaluation', () => {
        it('should evaluate empty board as neutral', () => {
            const emptyBoard = Array(42).fill(0);
            
            const score = Connect4AI.evaluateBoard(emptyBoard);
            expect(score).toBe(0);
        });

        it('should give positive score for AI pieces in center', () => {
            const board = Array(42).fill(0);
            
            // Place AI pieces in center column (index 3)
            board[38] = Player.Red; // Bottom center
            board[31] = Player.Red; // One up from bottom center
            
            const score = Connect4AI.evaluateBoard(board);
            expect(score).toBeGreaterThan(0);
        });

        it('should give negative score for opponent threats', () => {
            const board = Array(42).fill(0);
            
            // Create a strong opponent position
            board[35] = Player.Yellow; // Bottom row
            board[36] = Player.Yellow; 
            board[37] = Player.Yellow; // 3 in a row
            
            const score = Connect4AI.evaluateBoard(board);
            expect(score).toBeLessThan(0);
        });
    });

    describe('3. Window Evaluation', () => {
        it('should score 4 in a row as winning', () => {
            const window = [Player.Red, Player.Red, Player.Red, Player.Red];
            
            const score = Connect4AI.evaluateWindow(window);
            expect(score).toBe(100);
        });

        it('should score 3 in a row with empty as high value', () => {
            const window = [Player.Red, Player.Red, Player.Red, 0];
            
            const score = Connect4AI.evaluateWindow(window);
            expect(score).toBe(10);
        });

        it('should score 2 in a row with empty as moderate value', () => {
            const window = [Player.Red, Player.Red, 0, 0];
            
            const score = Connect4AI.evaluateWindow(window);
            expect(score).toBe(2);
        });

        it('should penalize opponent threats heavily', () => {
            const window = [Player.Yellow, Player.Yellow, Player.Yellow, 0];
            
            const score = Connect4AI.evaluateWindow(window);
            expect(score).toBe(-15); // Heavy penalty for blocking
        });

        it('should handle mixed windows correctly', () => {
            const window = [Player.Red, Player.Yellow, Player.Red, 0];
            
            const score = Connect4AI.evaluateWindow(window);
            expect(score).toBe(0); // Mixed pieces cancel out
        });
    });

    describe('4. Move Validation', () => {
        it('should identify valid moves for empty board', () => {
            const board = Array(42).fill(0);
            
            const validMoves = Connect4AI.getValidMovesForBoard(board);
            expect(validMoves).toEqual([0, 1, 2, 3, 4, 5, 6]);
        });

        it('should exclude full columns', () => {
            const board = Array(42).fill(0);
            
            // Fill column 3 (top position is index 3)
            board[3] = Player.Red;
            
            const validMoves = Connect4AI.getValidMovesForBoard(board);
            expect(validMoves).not.toContain(3);
            expect(validMoves).toHaveLength(6);
        });

        it('should return empty array when board is full', () => {
            const board = Array(42).fill(Player.Red);
            
            const validMoves = Connect4AI.getValidMovesForBoard(board);
            expect(validMoves).toHaveLength(0);
        });
    });

    describe('5. Drop Row Calculation', () => {
        it('should return bottom row for empty column', () => {
            const board = Array(42).fill(0);
            
            const dropRow = Connect4AI.getDropRowForBoard(board, 3);
            expect(dropRow).toBe(5); // Bottom row
        });

        it('should return correct row when column partially filled', () => {
            const board = Array(42).fill(0);
            
            // Fill bottom two cells of column 3
            board[38] = Player.Red; // Row 5, Col 3 (5*7+3=38)
            board[31] = Player.Yellow; // Row 4, Col 3 (4*7+3=31)
            
            const dropRow = Connect4AI.getDropRowForBoard(board, 3);
            expect(dropRow).toBe(3); // Next available row
        });

        it('should return -1 for full column', () => {
            const board = Array(42).fill(0);
            
            // Fill column 2 completely
            for (let row = 0; row < 6; row++) {
                board[row * 7 + 2] = Player.Red;
            }
            
            const dropRow = Connect4AI.getDropRowForBoard(board, 2);
            expect(dropRow).toBe(-1);
        });

        it('should return -1 for invalid column', () => {
            const board = Array(42).fill(0);
            
            expect(Connect4AI.getDropRowForBoard(board, -1)).toBe(-1);
            expect(Connect4AI.getDropRowForBoard(board, 7)).toBe(-1);
        });
    });

    describe('6. Win Detection', () => {
        it('should detect horizontal win', () => {
            const board = Array(42).fill(0);
            
            // Create horizontal win in bottom row
            board[35] = Player.Red; // (5,0)
            board[36] = Player.Red; // (5,1)
            board[37] = Player.Red; // (5,2)
            board[38] = Player.Red; // (5,3)
            
            const winner = Connect4AI.checkWinForBoard(board, 5, 3, Player.Red);
            expect(winner).toBe(Player.Red);
        });

        it('should detect vertical win', () => {
            const board = Array(42).fill(0);
            
            // Create vertical win in column 3
            board[38] = Player.Yellow; // (5,3)
            board[31] = Player.Yellow; // (4,3)
            board[24] = Player.Yellow; // (3,3)
            board[17] = Player.Yellow; // (2,3)
            
            const winner = Connect4AI.checkWinForBoard(board, 2, 3, Player.Yellow);
            expect(winner).toBe(Player.Yellow);
        });

        it('should detect diagonal win (positive slope)', () => {
            const board = Array(42).fill(0);
            
            // Create diagonal win
            board[35] = Player.Red; // (5,0)
            board[37] = Player.Red; // (4,1)
            board[32] = Player.Red; // (3,2)
            board[24] = Player.Red; // (3,3)
            
            // Fix indices for correct diagonal
            board[35] = Player.Red; // (5,0)
            board[29] = Player.Red; // (4,1)
            board[23] = Player.Red; // (3,2)
            board[17] = Player.Red; // (2,3)
            
            const winner = Connect4AI.checkWinForBoard(board, 2, 3, Player.Red);
            expect(winner).toBe(Player.Red);
        });

        it('should return null for no win', () => {
            const board = Array(42).fill(0);
            
            // Place some pieces but no win
            board[35] = Player.Red;
            board[36] = Player.Yellow;
            board[37] = Player.Red;
            
            const winner = Connect4AI.checkWinForBoard(board, 5, 2, Player.Red);
            expect(winner).toBeNull();
        });
    });

    describe('7. Strategic Decision Making', () => {
        it('should prefer center columns in move ordering', () => {
            const moveOrder = Connect4AI.getMoveOrder();
            
            expect(moveOrder[0]).toBe(3); // Center column first
            expect(moveOrder).toContain(2);
            expect(moveOrder).toContain(4);
        });

        it('should handle easy difficulty with randomness', () => {
            const moves = [];
            
            // Run multiple times to check for variation
            for (let i = 0; i < 10; i++) {
                const move = Connect4AI.getEasyMove(mockGame, [0, 1, 2, 3, 4, 5, 6]);
                moves.push(move);
            }
            
            // Easy mode should produce valid moves
            moves.forEach(move => {
                expect(move).toBeGreaterThanOrEqual(0);
                expect(move).toBeLessThanOrEqual(6);
            });
        });
    });

    describe('8. Board Manipulation', () => {
        it('should handle threats correctly', () => {
            const board = Array(42).fill(0);
            
            const createsThreat = Connect4AI.createsThreat(board, 3, Player.Red);
            expect(typeof createsThreat).toBe('boolean');
        });

        it('should calculate threat levels', () => {
            const board = Array(42).fill(0);
            
            const threatLevel = Connect4AI.getThreatLevel(board, Player.Red);
            expect(typeof threatLevel).toBe('number');
            expect(threatLevel).toBeGreaterThanOrEqual(0);
        });
    });

    describe('9. Minimax Algorithm', () => {
        it('should handle minimax with simple board', () => {
            const bestMove = Connect4AI.getBestMoveMinimax(mockGame, 2);
            
            expect(bestMove).toBeGreaterThanOrEqual(0);
            expect(bestMove).toBeLessThanOrEqual(6);
        });

        it('should simulate moves correctly', () => {
            const score = Connect4AI.simulateMove(mockGame, 3, 2, -Infinity, Infinity, false);
            
            expect(typeof score).toBe('number');
        });
    });

    describe('10. Edge Cases and Boundary Conditions', () => {
        it('should handle empty board correctly', () => {
            const emptyBoard = Array(42).fill(0);
            
            const score = Connect4AI.evaluateBoard(emptyBoard);
            expect(score).toBe(0);
            
            const validMoves = Connect4AI.getValidMovesForBoard(emptyBoard);
            expect(validMoves).toHaveLength(7);
        });

        it('should handle nearly full board', () => {
            const board = Array(42).fill(Player.Red);
            // Leave one column open
            for (let row = 0; row < 6; row++) {
                board[row * 7 + 3] = 0; // Column 3 empty
            }
            
            const validMoves = Connect4AI.getValidMovesForBoard(board);
            expect(validMoves).toEqual([3]);
        });

        it('should handle short window arrays correctly', () => {
            const shortWindow = [Player.Red, Player.Red]; // Only 2 elements
            
            const score = Connect4AI.evaluateWindow(shortWindow);
            expect(typeof score).toBe('number');
        });

        it('should handle boundary coordinates in win detection', () => {
            const board = Array(42).fill(0);
            
            // Test corner positions
            const winCorner = Connect4AI.checkWinForBoard(board, 0, 0, Player.Red);
            expect(winCorner).toBeNull();
            
            const winCorner2 = Connect4AI.checkWinForBoard(board, 5, 6, Player.Red);
            expect(winCorner2).toBeNull();
        });

        it('should return fallback move when no optimal move found', () => {
            // Create a game with only one valid move
            mockGame.getValidMoves.mockReturnValue([6]);
            
            const move = Connect4AI.getBestMove(mockGame, 3);
            expect(move).toBe(6);
        });

        it('should handle AI with different player assignments', () => {
            const board = Array(42).fill(0);
            
            // Test evaluating from perspective of different players
            board[35] = Player.Yellow;
            board[36] = Player.Yellow;
            board[37] = Player.Yellow;
            
            const score = Connect4AI.evaluateBoard(board);
            expect(typeof score).toBe('number');
        });
    });
});