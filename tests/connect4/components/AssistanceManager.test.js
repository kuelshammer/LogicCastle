/**
 * AssistanceManager Component Unit Tests
 * 
 * Component Testing
 * Tests the isolated AssistanceManager component for:
 * - Player assistance settings management
 * - Threat detection and highlighting
 * - Winning move identification
 * - Visual assistance hints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssistanceManager } from '../../../games/connect4/js/components/AssistanceManager.js';

describe('AssistanceManager Component Tests', () => {
    let container;
    let gameBoard;
    let assistanceManager;
    let mockGame;
    let mockBoardRenderer;
    let mockElements;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        container.innerHTML = `
            <div id="gameBoard" class="game-board">
                <!-- 6x7 grid cells will be added by test -->
            </div>
            <div id="assistancePanel" class="assistance-panel">
                <div class="assistance-controls">
                    <label>
                        <input type="checkbox" id="player1-threats" data-player="1" data-assistance="threats">
                        Player 1 Threats
                    </label>
                    <label>
                        <input type="checkbox" id="player1-winning-moves" data-player="1" data-assistance="winning-moves">
                        Player 1 Winning Moves
                    </label>
                    <label>
                        <input type="checkbox" id="player2-threats" data-player="2" data-assistance="threats">
                        Player 2 Threats
                    </label>
                    <label>
                        <input type="checkbox" id="player2-winning-moves" data-player="2" data-assistance="winning-moves">
                        Player 2 Winning Moves
                    </label>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        gameBoard = container.querySelector('#gameBoard');

        // Create 6x7 grid of cells for testing
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'game-slot';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const disc = document.createElement('div');
                disc.className = 'disc empty';
                cell.appendChild(disc);
                
                gameBoard.appendChild(cell);
            }
        }

        // Create mock game
        mockGame = {
            isGameOver: vi.fn(() => false),
            getCurrentPlayer: vi.fn(() => 1),
            getCell: vi.fn((row, col) => 0), // Default: empty
            checkWinningMove: vi.fn(() => null),
            findThreats: vi.fn(() => []),
            canDropInColumn: vi.fn(() => true),
            getLowestEmptyRow: vi.fn(() => 5)
        };

        // Create mock BoardRenderer
        mockBoardRenderer = {
            getCellAt: vi.fn((row, col) => {
                return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            }),
            getDiscAt: vi.fn((row, col) => {
                const cell = gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                return cell?.querySelector('.disc');
            }),
            highlightColumn: vi.fn(),
            clearColumnHighlights: vi.fn()
        };

        // Create mock elements
        mockElements = {
            assistancePanel: container.querySelector('#assistancePanel'),
            player1Threats: container.querySelector('#player1-threats'),
            player1WinningMoves: container.querySelector('#player1-winning-moves'),
            player2Threats: container.querySelector('#player2-threats'),
            player2WinningMoves: container.querySelector('#player2-winning-moves')
        };

        // Initialize AssistanceManager
        assistanceManager = new AssistanceManager(mockGame, mockBoardRenderer, mockElements);
    });

    afterEach(() => {
        if (assistanceManager) {
            assistanceManager.destroy();
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. Constructor and Initialization', () => {
        it('should create AssistanceManager with correct initial state', () => {
            expect(assistanceManager).toBeDefined();
            expect(assistanceManager.game).toBe(mockGame);
            expect(assistanceManager.boardRenderer).toBe(mockBoardRenderer);
            expect(assistanceManager.elements).toBe(mockElements);
        });

        it('should initialize with default assistance settings', () => {
            expect(assistanceManager.assistanceSettings).toEqual({
                player1: { threats: false, 'winning-moves': false },
                player2: { threats: false, 'winning-moves': false }
            });
        });

        it('should initialize with empty event listeners array', () => {
            expect(assistanceManager.eventListeners).toEqual([]);
        });

        it('should handle null parameters gracefully', () => {
            const manager = new AssistanceManager(null, null, null);
            expect(manager.game).toBeNull();
            expect(manager.boardRenderer).toBeNull();
            expect(manager.elements).toBeNull();
        });
    });

    describe('2. Assistance Settings Management', () => {
        it('should toggle assistance settings correctly', () => {
            assistanceManager.toggleAssistance(1, 'threats', true);
            
            expect(assistanceManager.assistanceSettings.player1.threats).toBe(true);
        });

        it('should toggle assistance settings for different players', () => {
            assistanceManager.toggleAssistance(2, 'winning-moves', true);
            
            expect(assistanceManager.assistanceSettings.player2['winning-moves']).toBe(true);
            expect(assistanceManager.assistanceSettings.player1['winning-moves']).toBe(false);
        });

        it('should handle invalid player numbers gracefully', () => {
            expect(() => assistanceManager.toggleAssistance(3, 'threats', true)).not.toThrow();
            expect(() => assistanceManager.toggleAssistance(0, 'threats', true)).not.toThrow();
        });

        it('should handle invalid assistance types gracefully', () => {
            expect(() => assistanceManager.toggleAssistance(1, 'invalid-type', true)).not.toThrow();
        });

        it('should get assistance settings correctly', () => {
            assistanceManager.toggleAssistance(1, 'threats', true);
            
            expect(assistanceManager.getAssistanceSetting(1, 'threats')).toBe(true);
            expect(assistanceManager.getAssistanceSetting(1, 'winning-moves')).toBe(false);
        });
    });

    describe('3. Event Listener Setup', () => {
        it('should setup assistance control event listeners', () => {
            assistanceManager.setupEventListeners();
            
            expect(assistanceManager.eventListeners.length).toBeGreaterThan(0);
        });

        it('should handle checkbox changes for threats', () => {
            assistanceManager.setupEventListeners();
            
            const threatCheckbox = mockElements.player1Threats;
            threatCheckbox.checked = true;
            
            const changeEvent = new Event('change', { bubbles: true });
            threatCheckbox.dispatchEvent(changeEvent);
            
            expect(assistanceManager.assistanceSettings.player1.threats).toBe(true);
        });

        it('should handle checkbox changes for winning moves', () => {
            assistanceManager.setupEventListeners();
            
            const winningMovesCheckbox = mockElements.player2WinningMoves;
            winningMovesCheckbox.checked = true;
            
            const changeEvent = new Event('change', { bubbles: true });
            winningMovesCheckbox.dispatchEvent(changeEvent);
            
            expect(assistanceManager.assistanceSettings.player2['winning-moves']).toBe(true);
        });

        it('should handle missing elements gracefully', () => {
            const managerWithoutElements = new AssistanceManager(mockGame, mockBoardRenderer, {});
            
            expect(() => managerWithoutElements.setupEventListeners()).not.toThrow();
        });
    });

    describe('4. Threat Detection and Highlighting', () => {
        beforeEach(() => {
            assistanceManager.setupEventListeners();
        });

        it('should detect and highlight threats for player 1', () => {
            // Mock threat detection
            mockGame.findThreats.mockReturnValue([
                { row: 5, col: 2, player: 1 },
                { row: 4, col: 3, player: 1 }
            ]);
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockGame.findThreats).toHaveBeenCalledWith(1);
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(2, 'threat-player1');
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(3, 'threat-player1');
        });

        it('should detect and highlight threats for player 2', () => {
            mockGame.findThreats.mockReturnValue([
                { row: 5, col: 1, player: 2 }
            ]);
            
            assistanceManager.toggleAssistance(2, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockGame.findThreats).toHaveBeenCalledWith(2);
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(1, 'threat-player2');
        });

        it('should clear threat highlights when assistance is disabled', () => {
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.toggleAssistance(1, 'threats', false);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockBoardRenderer.clearColumnHighlights).toHaveBeenCalledWith('threat-player1');
        });

        it('should handle empty threat arrays', () => {
            mockGame.findThreats.mockReturnValue([]);
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockBoardRenderer.highlightColumn).not.toHaveBeenCalled();
        });
    });

    describe('5. Winning Move Detection', () => {
        beforeEach(() => {
            assistanceManager.setupEventListeners();
        });

        it('should detect and highlight winning moves for player 1', () => {
            mockGame.checkWinningMove.mockImplementation((player, col) => {
                if (player === 1 && col === 3) return { row: 4, col: 3 };
                return null;
            });
            
            assistanceManager.toggleAssistance(1, 'winning-moves', true);
            assistanceManager.updateAssistanceDisplay();
            
            // Should check all columns for winning moves
            expect(mockGame.checkWinningMove).toHaveBeenCalledTimes(7); // 7 columns
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(3, 'winning-move-player1');
        });

        it('should detect multiple winning moves', () => {
            mockGame.checkWinningMove.mockImplementation((player, col) => {
                if (player === 2 && (col === 1 || col === 5)) {
                    return { row: 3, col };
                }
                return null;
            });
            
            assistanceManager.toggleAssistance(2, 'winning-moves', true);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(1, 'winning-move-player2');
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(5, 'winning-move-player2');
        });

        it('should clear winning move highlights when assistance is disabled', () => {
            assistanceManager.toggleAssistance(1, 'winning-moves', true);
            assistanceManager.toggleAssistance(1, 'winning-moves', false);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockBoardRenderer.clearColumnHighlights).toHaveBeenCalledWith('winning-move-player1');
        });

        it('should handle columns where drops are not possible', () => {
            mockGame.canDropInColumn.mockImplementation(col => col !== 0); // Column 0 full
            
            assistanceManager.toggleAssistance(1, 'winning-moves', true);
            assistanceManager.updateAssistanceDisplay();
            
            // Should skip column 0
            expect(mockGame.checkWinningMove).toHaveBeenCalledTimes(6); // Only 6 columns checked
        });
    });

    describe('6. Combined Assistance Display', () => {
        beforeEach(() => {
            assistanceManager.setupEventListeners();
        });

        it('should show both threats and winning moves simultaneously', () => {
            // Mock threats and winning moves
            mockGame.findThreats.mockReturnValue([{ row: 5, col: 1, player: 1 }]);
            mockGame.checkWinningMove.mockImplementation((player, col) => {
                if (player === 1 && col === 3) return { row: 4, col: 3 };
                return null;
            });
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.toggleAssistance(1, 'winning-moves', true);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(1, 'threat-player1');
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(3, 'winning-move-player1');
        });

        it('should handle assistance for both players', () => {
            mockGame.findThreats.mockImplementation(player => {
                if (player === 1) return [{ row: 5, col: 2, player: 1 }];
                if (player === 2) return [{ row: 4, col: 4, player: 2 }];
                return [];
            });
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.toggleAssistance(2, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(2, 'threat-player1');
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(4, 'threat-player2');
        });

        it('should update display when game state changes', () => {
            assistanceManager.toggleAssistance(1, 'threats', true);
            
            // Initial update
            assistanceManager.updateAssistanceDisplay();
            expect(mockGame.findThreats).toHaveBeenCalledTimes(1);
            
            // Second update after game state change
            assistanceManager.updateAssistanceDisplay();
            expect(mockGame.findThreats).toHaveBeenCalledTimes(2);
        });
    });

    describe('7. Performance and Optimization', () => {
        it('should update assistance display efficiently', () => {
            assistanceManager.setupEventListeners();
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.toggleAssistance(1, 'winning-moves', true);
            
            const startTime = performance.now();
            assistanceManager.updateAssistanceDisplay();
            const endTime = performance.now();
            
            const updateTime = endTime - startTime;
            expect(updateTime).toBeLessThan(20); // Should update in under 20ms
        });

        it('should handle rapid assistance toggle changes', () => {
            assistanceManager.setupEventListeners();
            
            const startTime = performance.now();
            
            // Rapid toggling
            for (let i = 0; i < 50; i++) {
                assistanceManager.toggleAssistance(1, 'threats', i % 2 === 0);
                assistanceManager.toggleAssistance(2, 'winning-moves', i % 2 === 1);
            }
            
            const endTime = performance.now();
            const toggleTime = endTime - startTime;
            
            expect(toggleTime).toBeLessThan(50); // 100 toggles in under 50ms
        });

        it('should not update display when no assistance is enabled', () => {
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockGame.findThreats).not.toHaveBeenCalled();
            expect(mockGame.checkWinningMove).not.toHaveBeenCalled();
        });
    });

    describe('8. Game State Integration', () => {
        beforeEach(() => {
            assistanceManager.setupEventListeners();
        });

        it('should handle game over state correctly', () => {
            mockGame.isGameOver.mockReturnValue(true);
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            // Should not update assistance when game is over
            expect(mockGame.findThreats).not.toHaveBeenCalled();
        });

        it('should handle missing game methods gracefully', () => {
            const incompleteGame = {
                isGameOver: vi.fn(() => false)
                // Missing findThreats and checkWinningMove
            };
            
            const manager = new AssistanceManager(incompleteGame, mockBoardRenderer, mockElements);
            manager.toggleAssistance(1, 'threats', true);
            
            expect(() => manager.updateAssistanceDisplay()).not.toThrow();
        });

        it('should respond to current player changes', () => {
            mockGame.getCurrentPlayer.mockReturnValue(2);
            
            assistanceManager.toggleAssistance(2, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            expect(mockGame.findThreats).toHaveBeenCalledWith(2);
        });
    });

    describe('9. Memory Management and Cleanup', () => {
        beforeEach(() => {
            assistanceManager.setupEventListeners();
        });

        it('should track event listeners for cleanup', () => {
            expect(assistanceManager.eventListeners.length).toBeGreaterThan(0);
        });

        it('should clean up all event listeners on destroy', () => {
            const listenerCount = assistanceManager.eventListeners.length;
            expect(listenerCount).toBeGreaterThan(0);
            
            assistanceManager.destroy();
            
            expect(assistanceManager.eventListeners).toHaveLength(0);
        });

        it('should reset assistance settings on destroy', () => {
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.toggleAssistance(2, 'winning-moves', true);
            
            assistanceManager.destroy();
            
            expect(assistanceManager.assistanceSettings).toEqual({
                player1: { threats: false, 'winning-moves': false },
                player2: { threats: false, 'winning-moves': false }
            });
        });

        it('should clear all highlights on destroy', () => {
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            assistanceManager.destroy();
            
            expect(mockBoardRenderer.clearColumnHighlights).toHaveBeenCalledWith('threat-player1');
            expect(mockBoardRenderer.clearColumnHighlights).toHaveBeenCalledWith('threat-player2');
            expect(mockBoardRenderer.clearColumnHighlights).toHaveBeenCalledWith('winning-move-player1');
            expect(mockBoardRenderer.clearColumnHighlights).toHaveBeenCalledWith('winning-move-player2');
        });

        it('should handle multiple destroy calls safely', () => {
            expect(() => {
                assistanceManager.destroy();
                assistanceManager.destroy();
                assistanceManager.destroy();
            }).not.toThrow();
        });
    });

    describe('10. Error Handling', () => {
        it('should handle BoardRenderer errors gracefully', () => {
            mockBoardRenderer.highlightColumn.mockImplementation(() => {
                throw new Error('Highlight failed');
            });
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            mockGame.findThreats.mockReturnValue([{ row: 5, col: 2, player: 1 }]);
            
            expect(() => assistanceManager.updateAssistanceDisplay()).not.toThrow();
        });

        it('should handle Game method errors gracefully', () => {
            mockGame.findThreats.mockImplementation(() => {
                throw new Error('Threat detection failed');
            });
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            
            expect(() => assistanceManager.updateAssistanceDisplay()).not.toThrow();
        });

        it('should handle malformed assistance data gracefully', () => {
            mockGame.findThreats.mockReturnValue([
                { row: 'invalid', col: null, player: undefined },
                null,
                { row: 5, col: 2 } // Missing player
            ]);
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            
            expect(() => assistanceManager.updateAssistanceDisplay()).not.toThrow();
        });
    });

    describe('11. Accessibility and User Experience', () => {
        beforeEach(() => {
            assistanceManager.setupEventListeners();
        });

        it('should maintain checkbox state consistency', () => {
            const threatCheckbox = mockElements.player1Threats;
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            expect(assistanceManager.getAssistanceSetting(1, 'threats')).toBe(true);
            
            // Checkbox state should be updated
            threatCheckbox.checked = true;
            expect(threatCheckbox.checked).toBe(true);
        });

        it('should provide clear visual distinction between assistance types', () => {
            mockGame.findThreats.mockReturnValue([{ row: 5, col: 2, player: 1 }]);
            mockGame.checkWinningMove.mockImplementation((player, col) => {
                if (col === 3) return { row: 4, col: 3 };
                return null;
            });
            
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.toggleAssistance(1, 'winning-moves', true);
            assistanceManager.updateAssistanceDisplay();
            
            // Different CSS classes for different assistance types
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(2, 'threat-player1');
            expect(mockBoardRenderer.highlightColumn).toHaveBeenCalledWith(3, 'winning-move-player1');
        });

        it('should handle rapid user interactions smoothly', () => {
            const threatCheckbox = mockElements.player1Threats;
            
            // Simulate rapid clicking
            for (let i = 0; i < 10; i++) {
                threatCheckbox.checked = !threatCheckbox.checked;
                threatCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            expect(() => assistanceManager.updateAssistanceDisplay()).not.toThrow();
        });
    });
});