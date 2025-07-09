/**
 * WASM API Contract Tests
 * 
 * These tests validate that the WASM backend API matches frontend expectations
 * to prevent future API mismatches like the memory_usage() issue.
 * 
 * Phase 1: API Contract Tests + Critical UI Fixes
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Connect4GameBitPacked } from '../../games/connect4/js/game.js';

describe('WASM API Contract Tests', () => {
    let game;
    let wasmBoard;
    
    beforeAll(async () => {
        // Initialize game to get WASM board access
        game = new Connect4GameBitPacked();
        await game.init();
        wasmBoard = game.board;
    });

    describe('1. Critical API Methods - Previously Missing', () => {
        it('should have memory_usage() method', () => {
            expect(wasmBoard.memory_usage).toBeDefined();
            expect(typeof wasmBoard.memory_usage).toBe('function');
            
            const memoryUsage = wasmBoard.memory_usage();
            expect(typeof memoryUsage).toBe('number');
            expect(memoryUsage).toBeGreaterThan(0);
        });

        it('should have get_board() method returning flat array', () => {
            expect(wasmBoard.get_board).toBeDefined();
            expect(typeof wasmBoard.get_board).toBe('function');
            
            const board = wasmBoard.get_board();
            expect(Array.isArray(board)).toBe(true);
            expect(board.length).toBe(42); // 6 rows × 7 cols
            
            // All cells should be valid values (0, 1, or 2)
            board.forEach(cell => {
                expect([0, 1, 2]).toContain(cell);
            });
        });

        it('should have undo functionality - can_undo() and undo_move()', () => {
            expect(wasmBoard.can_undo).toBeDefined();
            expect(typeof wasmBoard.can_undo).toBe('function');
            
            expect(wasmBoard.undo_move).toBeDefined();
            expect(typeof wasmBoard.undo_move).toBe('function');
            
            // Test undo functionality
            const initialCanUndo = wasmBoard.can_undo();
            expect(typeof initialCanUndo).toBe('boolean');
        });
    });

    describe('2. Core Game API Methods', () => {
        it('should have all basic game methods', () => {
            const requiredMethods = [
                'make_move',
                'is_valid_move', 
                'get_current_player',
                'get_move_count',
                'is_game_over',
                'get_winner',
                'get_cell',
                'reset'
            ];

            requiredMethods.forEach(method => {
                expect(wasmBoard[method]).toBeDefined();
                expect(typeof wasmBoard[method]).toBe('function');
            });
        });

        it('should have correct method signatures for make_move', () => {
            // Test make_move signature
            expect(() => wasmBoard.make_move(3)).not.toThrow();
            
            // Test invalid parameters
            expect(() => wasmBoard.make_move(-1)).toThrow();
            expect(() => wasmBoard.make_move(7)).toThrow();
        });

        it('should have get_current_player returning valid player values', () => {
            const currentPlayer = wasmBoard.get_current_player();
            expect([1, 2]).toContain(currentPlayer);
        });
    });

    describe('3. AI Integration Methods', () => {
        it('should have get_ai_move() method', () => {
            expect(wasmBoard.get_ai_move).toBeDefined();
            expect(typeof wasmBoard.get_ai_move).toBe('function');
            
            const aiMove = wasmBoard.get_ai_move();
            expect(typeof aiMove).toBe('number');
            expect(aiMove).toBeGreaterThanOrEqual(0);
            expect(aiMove).toBeLessThan(7);
        });

        it('should have evaluate_position_for_player() method', () => {
            expect(wasmBoard.evaluate_position_for_player).toBeDefined();
            expect(typeof wasmBoard.evaluate_position_for_player).toBe('function');
            
            const evaluation = wasmBoard.evaluate_position_for_player(1);
            expect(typeof evaluation).toBe('number');
        });
    });

    describe('4. Assistance System Methods', () => {
        it('should have threat analysis methods', () => {
            const assistanceMethods = [
                'get_threatening_moves',
                'get_winning_moves', 
                'get_blocking_moves'
            ];

            assistanceMethods.forEach(method => {
                expect(wasmBoard[method]).toBeDefined();
                expect(typeof wasmBoard[method]).toBe('function');
                
                const result = wasmBoard[method](1);
                expect(Array.isArray(result)).toBe(true);
            });
        });
    });

    describe('5. Method Aliases and Naming Consistency', () => {
        it('should have camelCase aliases for snake_case methods', () => {
            const aliasTests = [
                ['get_current_player', 'getCurrentPlayer'],
                ['get_move_count', 'getMoveCount'],
                ['is_game_over', 'isGameOver'],
                ['get_winner', 'getWinner'],
                ['is_valid_move', 'isValidMove'],
                ['get_cell', 'getCell'],
                ['make_move', 'makeMove'],
                ['get_board', 'getBoard'],
                ['can_undo', 'canUndo'],
                ['undo_move', 'undoMove'],
                ['get_ai_move', 'getAIMove']
            ];

            aliasTests.forEach(([snakeCase, camelCase]) => {
                if (wasmBoard[snakeCase]) {
                    expect(wasmBoard[camelCase]).toBeDefined();
                    expect(typeof wasmBoard[camelCase]).toBe('function');
                }
            });
        });
    });

    describe('6. Return Type Consistency', () => {
        it('should return consistent types for all methods', () => {
            // Boolean return types
            expect(typeof wasmBoard.is_game_over()).toBe('boolean');
            expect(typeof wasmBoard.can_undo()).toBe('boolean');
            expect(typeof wasmBoard.is_valid_move(3)).toBe('boolean');

            // Number return types
            expect(typeof wasmBoard.get_current_player()).toBe('number');
            expect(typeof wasmBoard.get_move_count()).toBe('number');
            expect(typeof wasmBoard.memory_usage()).toBe('number');
            expect(typeof wasmBoard.get_cell(0, 0)).toBe('number');

            // Array return types
            expect(Array.isArray(wasmBoard.get_board())).toBe(true);
            expect(Array.isArray(wasmBoard.get_threatening_moves(1))).toBe(true);
            expect(Array.isArray(wasmBoard.get_winning_moves(1))).toBe(true);
            expect(Array.isArray(wasmBoard.get_blocking_moves(1))).toBe(true);
        });

        it('should handle winner return type correctly', () => {
            const winner = wasmBoard.get_winner();
            // Winner should be null, 1, or 2
            expect([null, 1, 2]).toContain(winner);
        });
    });

    describe('7. Error Handling and Edge Cases', () => {
        it('should handle invalid column indices gracefully', () => {
            expect(() => wasmBoard.make_move(-1)).toThrow();
            expect(() => wasmBoard.make_move(7)).toThrow();
            expect(() => wasmBoard.is_valid_move(-1)).not.toThrow();
            expect(() => wasmBoard.is_valid_move(7)).not.toThrow();
        });

        it('should handle invalid cell coordinates gracefully', () => {
            expect(() => wasmBoard.get_cell(-1, 0)).not.toThrow();
            expect(() => wasmBoard.get_cell(6, 0)).not.toThrow();
            expect(() => wasmBoard.get_cell(0, -1)).not.toThrow();
            expect(() => wasmBoard.get_cell(0, 7)).not.toThrow();
        });

        it('should handle undo when no moves available', () => {
            // Reset game to ensure no moves
            wasmBoard.reset();
            
            expect(wasmBoard.can_undo()).toBe(false);
            expect(() => wasmBoard.undo_move()).not.toThrow();
        });
    });

    describe('8. Performance and Memory Validation', () => {
        it('should provide reasonable memory usage values', () => {
            const memoryUsage = wasmBoard.memory_usage();
            
            // Memory usage should be reasonable (not negative, not astronomically high)
            expect(memoryUsage).toBeGreaterThan(0);
            expect(memoryUsage).toBeLessThan(10000); // Less than 10KB is reasonable
        });

        it('should handle multiple operations without memory leaks', () => {
            const initialMemory = wasmBoard.memory_usage();
            
            // Perform multiple operations
            for (let i = 0; i < 10; i++) {
                wasmBoard.make_move(3);
                wasmBoard.get_board();
                wasmBoard.get_threatening_moves(1);
                if (wasmBoard.can_undo()) {
                    wasmBoard.undo_move();
                }
            }
            
            const finalMemory = wasmBoard.memory_usage();
            
            // Memory should not grow significantly
            expect(finalMemory).toBeLessThanOrEqual(initialMemory * 1.5);
        });
    });

    describe('9. Frontend Integration Validation', () => {
        it('should work with Connect4GameBitPacked wrapper', () => {
            // Test that all expected methods work through the wrapper
            expect(game.makeMove).toBeDefined();
            expect(game.isValidMove).toBeDefined();
            expect(game.getCurrentPlayer).toBeDefined();
            expect(game.getGameState).toBeDefined();
            expect(game.canUndo).toBeDefined();
            expect(game.undoMove).toBeDefined();
            expect(game.getAIMove).toBeDefined();
        });

        it('should provide consistent data through wrapper methods', () => {
            // Test that wrapper methods return consistent data
            const gameState = game.getGameState();
            expect(gameState).toBeDefined();
            expect(gameState.board).toBeDefined();
            expect(gameState.currentPlayer).toBeDefined();
            expect(gameState.memoryUsage).toBeDefined();
            
            // Cross-validate with direct WASM calls
            expect(gameState.currentPlayer).toBe(wasmBoard.get_current_player());
            expect(gameState.memoryUsage).toBe(wasmBoard.memory_usage());
        });
    });

    describe('10. Regression Tests for Previous Issues', () => {
        it('should not have memory_usage() undefined error', () => {
            // This was the original error that started this API contract work
            expect(() => wasmBoard.memory_usage()).not.toThrow();
            expect(wasmBoard.memory_usage).toBeDefined();
        });

        it('should not have evaluate_position vs evaluate_position_for_player conflicts', () => {
            // Test that the renamed method works
            expect(wasmBoard.evaluate_position_for_player).toBeDefined();
            expect(() => wasmBoard.evaluate_position_for_player(1)).not.toThrow();
        });

        it('should handle get_board() returning flat array correctly', () => {
            const board = wasmBoard.get_board();
            expect(Array.isArray(board)).toBe(true);
            expect(board.length).toBe(42);
            
            // Should work with Connect4GameBitPacked wrapper
            const board2D = game.getBoard();
            expect(Array.isArray(board2D)).toBe(true);
            expect(board2D.length).toBe(6);
            expect(board2D[0].length).toBe(7);
        });
    });
});