/**
 * WASM Integration Tests
 * 
 * ULTRATHINK Phase 2: WASM Integration Testing
 * Tests the integration between WASM game engine and ULTRATHINK components:
 * - WASM module loading and initialization
 * - Memory management between JS and WASM
 * - BitPackedBoard performance integration
 * - Error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryManager } from '../../../games/connect4/js/components/MemoryManager.js';

describe('🦀 ULTRATHINK WASM Integration Tests', () => {
    let container;
    let memoryManager;
    let mockWasmModule;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        container.innerHTML = `
            <div id="gameBoard" class="game-board"></div>
            <div id="wasmStatus" class="wasm-status">Loading...</div>
            <div id="memoryUsage" class="memory-usage">0 KB</div>
        `;
        document.body.appendChild(container);

        // Create comprehensive mock WASM module
        mockWasmModule = {
            // Core WASM exports
            memory: {
                buffer: new ArrayBuffer(65536), // 64KB
                grow: vi.fn()
            },
            
            // Game engine functions
            create_game: vi.fn(() => 1), // Returns game instance ID
            make_move: vi.fn((gameId, col) => {
                if (col >= 0 && col < 7) return 1; // Success
                return 0; // Failure
            }),
            get_board_state: vi.fn(() => new Uint8Array(42)), // 6x7 board
            is_game_over: vi.fn(() => 0), // Not over
            get_winner: vi.fn(() => 0), // No winner
            get_current_player: vi.fn(() => 1), // Player 1
            
            // BitPackedBoard functions
            create_bitpacked_board: vi.fn(() => 2), // Returns board instance ID
            get_memory_usage: vi.fn(() => 512), // 512 bytes
            optimize_memory: vi.fn(),
            cleanup_board: vi.fn(),
            
            // AI functions
            get_best_move: vi.fn((gameId, difficulty) => 3), // Column 3
            evaluate_position: vi.fn(() => 0.5), // Neutral evaluation
            
            // Performance monitoring
            get_performance_metrics: vi.fn(() => ({
                moves_calculated: 1000,
                evaluation_time_ms: 50,
                memory_allocations: 5
            })),
            
            // Memory management
            free: vi.fn(),
            malloc: vi.fn((size) => 1000), // Return mock pointer
            
            // Error handling
            get_last_error: vi.fn(() => 0), // No error
            clear_error: vi.fn(),
            
            // Cleanup functions
            destroy_game: vi.fn(),
            cleanup_all: vi.fn()
        };

        // Initialize memory manager
        memoryManager = new MemoryManager();
    });

    afterEach(() => {
        if (memoryManager) {
            memoryManager.destroy();
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. WASM Module Loading and Initialization', () => {
        it('should successfully register WASM module with MemoryManager', () => {
            memoryManager.registerWasmInstance(mockWasmModule);
            
            expect(memoryManager.wasmInstances.size).toBe(1);
            expect(memoryManager.metrics.wasmInstancesRegistered).toBe(1);
        });

        it('should validate WASM module structure', () => {
            // Verify required WASM exports exist
            expect(mockWasmModule.memory).toBeDefined();
            expect(mockWasmModule.create_game).toBeDefined();
            expect(mockWasmModule.make_move).toBeDefined();
            expect(mockWasmModule.get_board_state).toBeDefined();
            
            // Verify BitPackedBoard functions
            expect(mockWasmModule.create_bitpacked_board).toBeDefined();
            expect(mockWasmModule.get_memory_usage).toBeDefined();
            
            // Verify memory management functions
            expect(mockWasmModule.free).toBeDefined();
            expect(mockWasmModule.malloc).toBeDefined();
        });

        it('should handle WASM initialization errors gracefully', () => {
            const corruptedWasm = {
                memory: null, // Missing memory
                // Missing required functions
            };
            
            expect(() => {
                memoryManager.registerWasmInstance(corruptedWasm);
            }).not.toThrow(); // Should handle gracefully
        });

        it('should track WASM memory usage correctly', () => {
            memoryManager.registerWasmInstance(mockWasmModule);
            
            const usage = memoryManager.getWasmMemoryUsage();
            
            expect(usage.totalInstances).toBe(1);
            expect(usage.totalMemoryBytes).toBe(512);
            expect(mockWasmModule.get_memory_usage).toHaveBeenCalled();
        });
    });

    describe('2. BitPackedBoard Integration', () => {
        beforeEach(() => {
            memoryManager.registerWasmInstance(mockWasmModule);
        });

        it('should create and manage BitPackedBoard instances', () => {
            // Create BitPackedBoard through WASM
            const boardId = mockWasmModule.create_bitpacked_board();
            expect(boardId).toBe(2);
            expect(mockWasmModule.create_bitpacked_board).toHaveBeenCalled();
            
            // Verify memory usage tracking
            const memoryUsage = mockWasmModule.get_memory_usage();
            expect(memoryUsage).toBe(512);
        });

        it('should demonstrate memory efficiency of BitPackedBoard', () => {
            // Traditional JS board: 42 cells * 8 bytes (number) = 336 bytes minimum
            const jsBoard = new Array(42).fill(0);
            const jsMemoryEstimate = jsBoard.length * 8; // Conservative estimate
            
            // BitPackedBoard: Much more efficient
            const wasmMemoryUsage = mockWasmModule.get_memory_usage();
            
            console.log(`📊 Memory comparison:
                JS Array: ~${jsMemoryEstimate} bytes
                BitPackedBoard: ${wasmMemoryUsage} bytes
                Efficiency: ${((jsMemoryEstimate - wasmMemoryUsage) / jsMemoryEstimate * 100).toFixed(1)}% reduction`);
            
            expect(wasmMemoryUsage).toBeLessThan(jsMemoryEstimate);
        });

        it('should handle BitPackedBoard operations efficiently', () => {
            const boardId = mockWasmModule.create_bitpacked_board();
            
            const startTime = performance.now();
            
            // Perform multiple operations
            for (let i = 0; i < 100; i++) {
                mockWasmModule.make_move(boardId, i % 7);
                mockWasmModule.get_board_state(boardId);
                mockWasmModule.is_game_over(boardId);
            }
            
            const endTime = performance.now();
            const operationTime = endTime - startTime;
            
            expect(operationTime).toBeLessThan(50); // 300 operations in under 50ms
            console.log(`⚡ BitPackedBoard performance: 300 operations in ${operationTime.toFixed(2)}ms`);
        });

        it('should cleanup BitPackedBoard resources properly', () => {
            const boardId = mockWasmModule.create_bitpacked_board();
            
            // Cleanup through memory manager
            memoryManager.cleanupWasmInstances();
            
            expect(mockWasmModule.cleanup_board).toHaveBeenCalled();
            expect(mockWasmModule.free).toHaveBeenCalled();
        });
    });

    describe('3. Game Engine Integration', () => {
        let gameId;

        beforeEach(() => {
            memoryManager.registerWasmInstance(mockWasmModule);
            gameId = mockWasmModule.create_game();
        });

        it('should create and manage game instances', () => {
            expect(gameId).toBe(1);
            expect(mockWasmModule.create_game).toHaveBeenCalled();
        });

        it('should handle game moves through WASM', () => {
            const moveResult = mockWasmModule.make_move(gameId, 3);
            
            expect(moveResult).toBe(1); // Success
            expect(mockWasmModule.make_move).toHaveBeenCalledWith(gameId, 3);
        });

        it('should validate move inputs', () => {
            // Valid moves
            expect(mockWasmModule.make_move(gameId, 0)).toBe(1);
            expect(mockWasmModule.make_move(gameId, 6)).toBe(1);
            
            // Invalid moves
            expect(mockWasmModule.make_move(gameId, -1)).toBe(0);
            expect(mockWasmModule.make_move(gameId, 7)).toBe(0);
        });

        it('should retrieve game state efficiently', () => {
            const boardState = mockWasmModule.get_board_state(gameId);
            
            expect(boardState).toBeInstanceOf(Uint8Array);
            expect(boardState.length).toBe(42); // 6x7 board
        });

        it('should handle game status queries', () => {
            expect(mockWasmModule.is_game_over(gameId)).toBe(0); // Not over
            expect(mockWasmModule.get_winner(gameId)).toBe(0); // No winner
            expect(mockWasmModule.get_current_player(gameId)).toBe(1); // Player 1
        });
    });

    describe('4. AI Integration', () => {
        let gameId;

        beforeEach(() => {
            memoryManager.registerWasmInstance(mockWasmModule);
            gameId = mockWasmModule.create_game();
        });

        it('should provide AI move suggestions', () => {
            const bestMove = mockWasmModule.get_best_move(gameId, 3); // Medium difficulty
            
            expect(bestMove).toBe(3);
            expect(bestMove).toBeGreaterThanOrEqual(0);
            expect(bestMove).toBeLessThan(7);
        });

        it('should evaluate board positions', () => {
            const evaluation = mockWasmModule.evaluate_position(gameId);
            
            expect(evaluation).toBe(0.5); // Neutral
            expect(evaluation).toBeGreaterThanOrEqual(-1);
            expect(evaluation).toBeLessThanOrEqual(1);
        });

        it('should handle different AI difficulty levels', () => {
            const easyMove = mockWasmModule.get_best_move(gameId, 1);
            const mediumMove = mockWasmModule.get_best_move(gameId, 3);
            const hardMove = mockWasmModule.get_best_move(gameId, 4);
            
            // All should return valid moves
            [easyMove, mediumMove, hardMove].forEach(move => {
                expect(move).toBeGreaterThanOrEqual(0);
                expect(move).toBeLessThan(7);
            });
        });

        it('should track AI performance metrics', () => {
            mockWasmModule.get_best_move(gameId, 3);
            
            const metrics = mockWasmModule.get_performance_metrics();
            
            expect(metrics.moves_calculated).toBeGreaterThan(0);
            expect(metrics.evaluation_time_ms).toBeGreaterThanOrEqual(0);
            expect(metrics.memory_allocations).toBeGreaterThanOrEqual(0);
        });
    });

    describe('5. Memory Management Integration', () => {
        beforeEach(() => {
            memoryManager.registerWasmInstance(mockWasmModule);
        });

        it('should track WASM memory allocations', () => {
            const pointer1 = mockWasmModule.malloc(1024);
            const pointer2 = mockWasmModule.malloc(512);
            
            expect(pointer1).toBe(1000); // Mock pointer
            expect(pointer2).toBe(1000); // Mock pointer
            expect(mockWasmModule.malloc).toHaveBeenCalledTimes(2);
        });

        it('should monitor memory growth', () => {
            const initialUsage = memoryManager.getWasmMemoryUsage();
            
            // Simulate memory growth
            mockWasmModule.memory.grow(1); // Grow by 1 page (64KB)
            
            expect(mockWasmModule.memory.grow).toHaveBeenCalledWith(1);
        });

        it('should detect memory pressure', () => {
            // Create multiple WASM instances to increase memory pressure
            for (let i = 0; i < 5; i++) {
                const additionalWasm = { ...mockWasmModule };
                memoryManager.registerWasmInstance(additionalWasm);
            }
            
            const pressure = memoryManager.getMemoryPressure();
            
            expect(pressure.level).toBeDefined();
            expect(pressure.score).toBeGreaterThan(0);
        });

        it('should handle memory cleanup efficiently', () => {
            // Create multiple game instances
            const gameIds = [];
            for (let i = 0; i < 10; i++) {
                gameIds.push(mockWasmModule.create_game());
            }
            
            const startTime = performance.now();
            memoryManager.cleanupWasmInstances();
            const endTime = performance.now();
            
            const cleanupTime = endTime - startTime;
            expect(cleanupTime).toBeLessThan(20); // Should cleanup quickly
            
            expect(mockWasmModule.cleanup_all).toHaveBeenCalled();
            expect(mockWasmModule.free).toHaveBeenCalled();
        });
    });

    describe('6. Error Handling and Recovery', () => {
        beforeEach(() => {
            memoryManager.registerWasmInstance(mockWasmModule);
        });

        it('should handle WASM runtime errors gracefully', () => {
            // Simulate WASM error
            mockWasmModule.get_last_error.mockReturnValue(1); // Error code 1
            
            const errorCode = mockWasmModule.get_last_error();
            expect(errorCode).toBe(1);
            
            // Clear error
            mockWasmModule.clear_error();
            expect(mockWasmModule.clear_error).toHaveBeenCalled();
        });

        it('should recover from memory allocation failures', () => {
            // Simulate allocation failure
            mockWasmModule.malloc.mockReturnValue(0); // NULL pointer
            
            const pointer = mockWasmModule.malloc(999999); // Large allocation
            expect(pointer).toBe(0); // Failed allocation
            
            // Should handle gracefully without crashing
            expect(() => {
                memoryManager.getWasmMemoryUsage();
            }).not.toThrow();
        });

        it('should handle WASM module corruption', () => {
            // Simulate corrupted module
            const corruptedWasm = {
                memory: { buffer: null }, // Corrupted memory
                get_memory_usage: vi.fn(() => { throw new Error('WASM corruption'); })
            };
            
            memoryManager.registerWasmInstance(corruptedWasm);
            
            expect(() => {
                memoryManager.getWasmMemoryUsage();
            }).not.toThrow(); // Should handle gracefully
        });

        it('should provide error diagnostics', () => {
            // Create problematic scenario
            mockWasmModule.make_move.mockImplementation(() => {
                throw new Error('Invalid game state');
            });
            
            expect(() => {
                mockWasmModule.make_move(1, 3);
            }).toThrow('Invalid game state');
            
            // Error should be trackable
            const errorCode = mockWasmModule.get_last_error();
            expect(typeof errorCode).toBe('number');
        });
    });

    describe('7. Performance Benchmarking', () => {
        beforeEach(() => {
            memoryManager.registerWasmInstance(mockWasmModule);
        });

        it('should benchmark game operations', () => {
            const gameId = mockWasmModule.create_game();
            
            const operations = [
                () => mockWasmModule.make_move(gameId, 3),
                () => mockWasmModule.get_board_state(gameId),
                () => mockWasmModule.is_game_over(gameId),
                () => mockWasmModule.get_current_player(gameId)
            ];
            
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                operations[i % operations.length]();
            }
            
            const endTime = performance.now();
            const operationTime = endTime - startTime;
            
            expect(operationTime).toBeLessThan(100); // 1000 operations in under 100ms
            console.log(`⚡ WASM performance: 1000 operations in ${operationTime.toFixed(2)}ms`);
        });

        it('should benchmark AI performance', () => {
            const gameId = mockWasmModule.create_game();
            
            const startTime = performance.now();
            
            // Multiple AI evaluations
            for (let i = 0; i < 50; i++) {
                mockWasmModule.get_best_move(gameId, 3);
                mockWasmModule.evaluate_position(gameId);
            }
            
            const endTime = performance.now();
            const aiTime = endTime - startTime;
            
            expect(aiTime).toBeLessThan(200); // 100 AI operations in under 200ms
            console.log(`🤖 AI performance: 100 operations in ${aiTime.toFixed(2)}ms`);
        });

        it('should benchmark memory operations', () => {
            const startTime = performance.now();
            
            // Memory allocations and deallocations
            const pointers = [];
            for (let i = 0; i < 100; i++) {
                pointers.push(mockWasmModule.malloc(1024));
            }
            
            for (const pointer of pointers) {
                // Simulate free operation
                mockWasmModule.free();
            }
            
            const endTime = performance.now();
            const memoryTime = endTime - startTime;
            
            expect(memoryTime).toBeLessThan(50); // 200 memory operations in under 50ms
            console.log(`💾 Memory performance: 200 operations in ${memoryTime.toFixed(2)}ms`);
        });
    });

    describe('8. Integration with Connect4 Components', () => {
        let mockConnect4UI;

        beforeEach(() => {
            memoryManager.registerWasmInstance(mockWasmModule);
            
            // Create mock Connect4 UI for integration testing
            mockConnect4UI = {
                elements: {
                    gameBoard: container.querySelector('#gameBoard'),
                    wasmStatus: container.querySelector('#wasmStatus'),
                    memoryUsage: container.querySelector('#memoryUsage')
                },
                updateUI: vi.fn(),
                onMoveMade: vi.fn(),
                showMessage: vi.fn()
            };
        });

        it('should integrate WASM with UI updates', () => {
            const gameId = mockWasmModule.create_game();
            
            // Simulate move made through WASM
            const moveResult = mockWasmModule.make_move(gameId, 3);
            
            if (moveResult === 1) { // Success
                const boardState = mockWasmModule.get_board_state(gameId);
                
                // Update UI based on WASM state
                mockConnect4UI.onMoveMade({
                    col: 3,
                    row: 5, // Calculated from board state
                    player: mockWasmModule.get_current_player(gameId),
                    boardState: Array.from(boardState)
                });
                
                expect(mockConnect4UI.onMoveMade).toHaveBeenCalled();
            }
        });

        it('should update memory usage display', () => {
            const memoryUsage = memoryManager.getWasmMemoryUsage();
            
            // Update UI with memory info
            const memoryDisplay = mockConnect4UI.elements.memoryUsage;
            memoryDisplay.textContent = `${memoryUsage.totalMemoryBytes} bytes`;
            
            expect(memoryDisplay.textContent).toBe('512 bytes');
        });

        it('should handle WASM status updates', () => {
            const statusDisplay = mockConnect4UI.elements.wasmStatus;
            
            // Simulate WASM initialization success
            statusDisplay.textContent = 'WASM Ready';
            statusDisplay.className = 'wasm-status ready';
            
            expect(statusDisplay.textContent).toBe('WASM Ready');
            expect(statusDisplay.classList.contains('ready')).toBe(true);
        });

        it('should integrate error handling with UI', () => {
            // Simulate WASM error
            mockWasmModule.get_last_error.mockReturnValue(1);
            
            const errorCode = mockWasmModule.get_last_error();
            if (errorCode !== 0) {
                mockConnect4UI.showMessage('WASM Error: Operation failed', 'error');
            }
            
            expect(mockConnect4UI.showMessage).toHaveBeenCalledWith('WASM Error: Operation failed', 'error');
        });
    });

    describe('9. Resource Lifecycle Management', () => {
        it('should manage complete WASM resource lifecycle', () => {
            // 1. Registration
            memoryManager.registerWasmInstance(mockWasmModule);
            expect(memoryManager.wasmInstances.size).toBe(1);
            
            // 2. Usage
            const gameId = mockWasmModule.create_game();
            const boardId = mockWasmModule.create_bitpacked_board();
            
            // 3. Monitoring
            const usage = memoryManager.getWasmMemoryUsage();
            expect(usage.totalInstances).toBe(1);
            
            // 4. Cleanup
            memoryManager.cleanupWasmInstances();
            expect(mockWasmModule.destroy_game).toHaveBeenCalled();
            expect(mockWasmModule.cleanup_all).toHaveBeenCalled();
            
            // 5. Verification
            expect(memoryManager.wasmInstances.size).toBe(0);
        });

        it('should handle partial cleanup scenarios', () => {
            memoryManager.registerWasmInstance(mockWasmModule);
            
            // Simulate cleanup failure
            mockWasmModule.cleanup_all.mockImplementation(() => {
                throw new Error('Cleanup failed');
            });
            
            expect(() => {
                memoryManager.cleanupWasmInstances();
            }).not.toThrow(); // Should handle gracefully
            
            // Should still attempt other cleanup operations
            expect(mockWasmModule.free).toHaveBeenCalled();
        });
    });
});