/**
 * InteractionHandler Component Unit Tests
 * 
 * Component Testing
 * Tests the isolated InteractionHandler component for:
 * - Event listener management
 * - Column hover & click detection
 * - Preview system functionality  
 * - Keyboard interaction handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InteractionHandler } from '../../../games/connect4/js/components/InteractionHandler.js';

describe('InteractionHandler Component Tests', () => {
    let container;
    let gameBoard;
    let interactionHandler;
    let mockBoardRenderer;
    let mockCallbacks;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        container.innerHTML = `
            <div id="gameBoard" class="game-board" style="position: relative;">
                <!-- 6x7 grid cells will be added by test -->
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

        // Create mock BoardRenderer
        mockBoardRenderer = {
            getCellAt: vi.fn((row, col) => {
                return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            }),
            getDiscAt: vi.fn((row, col) => {
                const cell = gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                return cell?.querySelector('.disc');
            })
        };

        // Create mock callbacks
        mockCallbacks = {
            onColumnClick: vi.fn(),
            onColumnHover: vi.fn(),
            onColumnHoverLeave: vi.fn()
        };

        // Initialize InteractionHandler
        interactionHandler = new InteractionHandler(mockBoardRenderer, gameBoard);
        interactionHandler.setCallbacks(mockCallbacks);
    });

    afterEach(() => {
        if (interactionHandler) {
            interactionHandler.destroy();
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. Constructor and Initialization', () => {
        it('should create InteractionHandler with correct initial state', () => {
            expect(interactionHandler).toBeDefined();
            expect(interactionHandler.boardRenderer).toBe(mockBoardRenderer);
            expect(interactionHandler.gameBoard).toBe(gameBoard);
            expect(interactionHandler.hoveredColumn).toBeNull();
            expect(interactionHandler.previewDisc).toBeNull();
            expect(interactionHandler.isProcessingMove).toBe(false);
        });

        it('should initialize with empty event listeners array', () => {
            expect(interactionHandler.eventListeners).toEqual([]);
        });

        it('should handle null board renderer and game board', () => {
            const handler = new InteractionHandler(null, null);
            expect(handler.boardRenderer).toBeNull();
            expect(handler.gameBoard).toBeNull();
        });
    });

    describe('2. Column Interaction Setup', () => {
        it('should setup column interactions successfully', () => {
            interactionHandler.setupColumnInteractions();
            
            // Should create hover zones
            const hoverZones = gameBoard.querySelectorAll('.column-hover-zone');
            expect(hoverZones).toHaveLength(7);
        });

        it('should create hover zones with correct positioning', () => {
            interactionHandler.setupColumnInteractions();
            
            const hoverZones = gameBoard.querySelectorAll('.column-hover-zone');
            
            hoverZones.forEach((zone, index) => {
                expect(zone.dataset.col).toBe(index.toString());
                expect(zone.style.position).toBe('absolute');
                expect(zone.style.top).toBe('-60px');
                expect(zone.style.height).toBe('60px');
                expect(zone.style.gridColumnStart).toBe((index + 1).toString());
            });
        });

        it('should remove existing hover zones before creating new ones', () => {
            // Create some existing zones
            const existingZone = document.createElement('div');
            existingZone.className = 'column-hover-zone';
            gameBoard.appendChild(existingZone);
            
            interactionHandler.setupColumnInteractions();
            
            // Should only have 7 new zones, old one removed
            const hoverZones = gameBoard.querySelectorAll('.column-hover-zone');
            expect(hoverZones).toHaveLength(7);
        });

        it('should handle missing game board gracefully', () => {
            const handler = new InteractionHandler(mockBoardRenderer, null);
            expect(() => handler.setupColumnInteractions()).not.toThrow();
        });
    });

    describe('3. Column Click Handling', () => {
        beforeEach(() => {
            interactionHandler.setupColumnInteractions();
        });

        it('should handle valid column clicks', () => {
            interactionHandler.handleColumnClick(3);
            
            expect(mockCallbacks.onColumnClick).toHaveBeenCalledWith(3);
            expect(mockCallbacks.onColumnClick).toHaveBeenCalledTimes(1);
        });

        it('should reject invalid column indices', () => {
            interactionHandler.handleColumnClick(-1);
            interactionHandler.handleColumnClick(7);
            
            expect(mockCallbacks.onColumnClick).not.toHaveBeenCalled();
        });

        it('should ignore clicks when processing move', () => {
            interactionHandler.setProcessingMove(true);
            interactionHandler.handleColumnClick(2);
            
            expect(mockCallbacks.onColumnClick).not.toHaveBeenCalled();
        });

        it('should handle board clicks on cells', () => {
            const cell = gameBoard.querySelector('[data-row="5"][data-col="4"]');
            const clickEvent = new MouseEvent('click', { bubbles: true });
            
            cell.dispatchEvent(clickEvent);
            
            expect(mockCallbacks.onColumnClick).toHaveBeenCalledWith(4);
        });

        it('should handle hover zone clicks', () => {
            const hoverZone = gameBoard.querySelector('[data-col="2"]');
            const clickEvent = new MouseEvent('click', { bubbles: true });
            
            hoverZone.dispatchEvent(clickEvent);
            
            expect(mockCallbacks.onColumnClick).toHaveBeenCalledWith(2);
        });
    });

    describe('4. Column Hover Handling', () => {
        beforeEach(() => {
            interactionHandler.setupColumnInteractions();
        });

        it('should handle column hover correctly', () => {
            interactionHandler.handleColumnHover(5);
            
            expect(interactionHandler.hoveredColumn).toBe(5);
            expect(mockCallbacks.onColumnHover).toHaveBeenCalledWith(5);
        });

        it('should handle column hover leave correctly', () => {
            interactionHandler.handleColumnHover(3);
            interactionHandler.handleColumnHoverLeave();
            
            expect(interactionHandler.hoveredColumn).toBeNull();
            expect(mockCallbacks.onColumnHoverLeave).toHaveBeenCalled();
        });

        it('should ignore hover when processing move', () => {
            interactionHandler.setProcessingMove(true);
            interactionHandler.handleColumnHover(2);
            
            expect(interactionHandler.hoveredColumn).toBeNull();
            expect(mockCallbacks.onColumnHover).not.toHaveBeenCalled();
        });

        it('should trigger hover events on zone mouse enter', () => {
            const hoverZone = gameBoard.querySelector('[data-col="1"]');
            const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
            
            hoverZone.dispatchEvent(mouseEnterEvent);
            
            expect(mockCallbacks.onColumnHover).toHaveBeenCalledWith(1);
        });

        it('should trigger hover leave events on zone mouse leave', () => {
            const hoverZone = gameBoard.querySelector('[data-col="1"]');
            
            // First hover
            hoverZone.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            
            // Then leave
            hoverZone.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            
            expect(mockCallbacks.onColumnHoverLeave).toHaveBeenCalled();
        });
    });

    describe('5. Drop Preview System', () => {
        beforeEach(() => {
            interactionHandler.setupColumnInteractions();
        });

        it('should show drop preview in correct position', () => {
            // Mock finding the lowest empty slot
            mockBoardRenderer.getCellAt.mockImplementation((row, col) => {
                if (col === 3 && row === 5) {
                    return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                }
                return null;
            });
            
            interactionHandler.showDropPreview(3);
            
            const disc = gameBoard.querySelector('[data-row="5"][data-col="3"] .disc');
            expect(disc.classList.contains('preview')).toBe(true);
            expect(disc.style.background).toBe('rgba(255, 255, 255, 0.5)');
            expect(interactionHandler.previewDisc).toBe(disc);
        });

        it('should hide existing preview when showing new one', () => {
            // Show preview in column 2
            mockBoardRenderer.getCellAt.mockImplementation((row, col) => {
                if (col === 2 && row === 5) {
                    return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                }
                return null;
            });
            
            interactionHandler.showDropPreview(2);
            const firstDisc = gameBoard.querySelector('[data-row="5"][data-col="2"] .disc');
            expect(firstDisc.classList.contains('preview')).toBe(true);
            
            // Show preview in column 4
            mockBoardRenderer.getCellAt.mockImplementation((row, col) => {
                if (col === 4 && row === 5) {
                    return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                }
                return null;
            });
            
            interactionHandler.showDropPreview(4);
            
            // First preview should be cleared
            expect(firstDisc.classList.contains('preview')).toBe(false);
            expect(firstDisc.style.background).toBe('transparent');
        });

        it('should hide drop preview correctly', () => {
            // Show preview first
            mockBoardRenderer.getCellAt.mockImplementation((row, col) => {
                if (col === 1 && row === 5) {
                    return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                }
                return null;
            });
            
            interactionHandler.showDropPreview(1);
            const disc = gameBoard.querySelector('[data-row="5"][data-col="1"] .disc');
            
            // Hide preview
            interactionHandler.hideDropPreview();
            
            expect(disc.classList.contains('preview')).toBe(false);
            expect(disc.style.background).toBe('transparent');
            expect(interactionHandler.previewDisc).toBeNull();
        });

        it('should handle full column gracefully', () => {
            // Mock no empty slots available
            mockBoardRenderer.getCellAt.mockReturnValue(null);
            
            interactionHandler.showDropPreview(3);
            
            expect(interactionHandler.previewDisc).toBeNull();
        });

        it('should handle missing disc element gracefully', () => {
            // Mock cell without disc
            const cellWithoutDisc = document.createElement('div');
            cellWithoutDisc.className = 'game-slot';
            mockBoardRenderer.getCellAt.mockReturnValue(cellWithoutDisc);
            
            expect(() => interactionHandler.showDropPreview(3)).not.toThrow();
        });
    });

    describe('6. Keyboard Interactions', () => {
        beforeEach(() => {
            interactionHandler.setupKeyboardInteractions();
        });

        it('should handle number key presses for column selection', () => {
            // Simulate pressing '4' key
            const keyEvent = new KeyboardEvent('keydown', { key: '4' });
            document.dispatchEvent(keyEvent);
            
            expect(mockCallbacks.onColumnClick).toHaveBeenCalledWith(3); // 0-indexed
        });

        it('should handle all valid number keys 1-7', () => {
            for (let i = 1; i <= 7; i++) {
                const keyEvent = new KeyboardEvent('keydown', { key: i.toString() });
                document.dispatchEvent(keyEvent);
                
                expect(mockCallbacks.onColumnClick).toHaveBeenCalledWith(i - 1);
            }
            
            expect(mockCallbacks.onColumnClick).toHaveBeenCalledTimes(7);
        });

        it('should ignore non-number keys', () => {
            const keyEvent = new KeyboardEvent('keydown', { key: 'a' });
            document.dispatchEvent(keyEvent);
            
            expect(mockCallbacks.onColumnClick).not.toHaveBeenCalled();
        });

        it('should ignore numbers outside 1-7 range', () => {
            const keyEvent8 = new KeyboardEvent('keydown', { key: '8' });
            const keyEvent0 = new KeyboardEvent('keydown', { key: '0' });
            
            document.dispatchEvent(keyEvent8);
            document.dispatchEvent(keyEvent0);
            
            expect(mockCallbacks.onColumnClick).not.toHaveBeenCalled();
        });

        it('should prevent default behavior for handled keys', () => {
            const keyEvent = new KeyboardEvent('keydown', { key: '3' });
            const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');
            
            document.dispatchEvent(keyEvent);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('7. Processing Move State', () => {
        it('should update processing state correctly', () => {
            interactionHandler.setProcessingMove(true);
            
            expect(interactionHandler.isProcessingMove).toBe(true);
            expect(gameBoard.style.cursor).toBe('wait');
        });

        it('should reset processing state correctly', () => {
            interactionHandler.setProcessingMove(true);
            interactionHandler.setProcessingMove(false);
            
            expect(interactionHandler.isProcessingMove).toBe(false);
            expect(gameBoard.style.cursor).toBe('pointer');
        });

        it('should hide preview when processing', () => {
            // Set up preview first
            mockBoardRenderer.getCellAt.mockImplementation((row, col) => {
                if (col === 2 && row === 5) {
                    return gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                }
                return null;
            });
            
            interactionHandler.showDropPreview(2);
            
            // Start processing
            interactionHandler.setProcessingMove(true);
            
            expect(interactionHandler.previewDisc).toBeNull();
        });
    });

    describe('8. Column Highlighting', () => {
        beforeEach(() => {
            interactionHandler.setupColumnInteractions();
        });

        it('should highlight column with specified class', () => {
            interactionHandler.highlightColumn(3, 'winning-move');
            
            for (let row = 0; row < 6; row++) {
                const cell = gameBoard.querySelector(`[data-row="${row}"][data-col="3"]`);
                expect(cell.classList.contains('winning-move')).toBe(true);
            }
        });

        it('should clear column highlights', () => {
            // Add highlights first
            interactionHandler.highlightColumn(2, 'threat');
            interactionHandler.highlightColumn(4, 'threat');
            
            // Clear highlights
            interactionHandler.clearColumnHighlights('threat');
            
            const highlightedCells = gameBoard.querySelectorAll('.threat');
            expect(highlightedCells).toHaveLength(0);
        });

        it('should use default highlight class', () => {
            interactionHandler.highlightColumn(1);
            
            const highlightedCells = gameBoard.querySelectorAll('.highlight');
            expect(highlightedCells).toHaveLength(6); // One for each row
        });

        it('should clear highlights with default class', () => {
            interactionHandler.highlightColumn(5);
            interactionHandler.clearColumnHighlights();
            
            const highlightedCells = gameBoard.querySelectorAll('.highlight');
            expect(highlightedCells).toHaveLength(0);
        });
    });

    describe('9. Column Validation', () => {
        it('should validate column indices correctly', () => {
            expect(interactionHandler.isValidColumn(0)).toBe(true);
            expect(interactionHandler.isValidColumn(3)).toBe(true);
            expect(interactionHandler.isValidColumn(6)).toBe(true);
            expect(interactionHandler.isValidColumn(-1)).toBe(false);
            expect(interactionHandler.isValidColumn(7)).toBe(false);
        });

        it('should check for empty slots in column', () => {
            // All slots empty initially
            expect(interactionHandler.isValidColumn(2)).toBe(true);
            
            // Simulate filled top slot
            const topSlot = gameBoard.querySelector('[data-row="0"][data-col="2"] .disc');
            topSlot.classList.remove('empty');
            topSlot.classList.add('yellow');
            
            expect(interactionHandler.isValidColumn(2)).toBe(false);
        });

        it('should handle missing cells gracefully', () => {
            // Remove a cell
            const cell = gameBoard.querySelector('[data-row="0"][data-col="1"]');
            cell.remove();
            
            expect(interactionHandler.isValidColumn(1)).toBe(false);
        });
    });

    describe('10. Callback Management', () => {
        it('should set callbacks correctly', () => {
            const newCallbacks = {
                onColumnClick: vi.fn(),
                onColumnHover: vi.fn(),
                onColumnHoverLeave: vi.fn()
            };
            
            interactionHandler.setCallbacks(newCallbacks);
            
            expect(interactionHandler.onColumnClickCallback).toBe(newCallbacks.onColumnClick);
            expect(interactionHandler.onColumnHoverCallback).toBe(newCallbacks.onColumnHover);
            expect(interactionHandler.onColumnHoverLeaveCallback).toBe(newCallbacks.onColumnHoverLeave);
        });

        it('should handle partial callback objects', () => {
            const partialCallbacks = {
                onColumnClick: vi.fn()
                // Missing hover callbacks
            };
            
            interactionHandler.setCallbacks(partialCallbacks);
            
            expect(interactionHandler.onColumnClickCallback).toBe(partialCallbacks.onColumnClick);
            expect(interactionHandler.onColumnHoverCallback).toBeUndefined();
        });

        it('should work without callbacks set', () => {
            const handler = new InteractionHandler(mockBoardRenderer, gameBoard);
            // No callbacks set
            
            expect(() => handler.handleColumnClick(3)).not.toThrow();
            expect(() => handler.handleColumnHover(3)).not.toThrow();
            expect(() => handler.handleColumnHoverLeave()).not.toThrow();
        });
    });

    describe('11. Memory Management and Cleanup', () => {
        beforeEach(() => {
            interactionHandler.setupColumnInteractions();
            interactionHandler.setupKeyboardInteractions();
        });

        it('should track event listeners for cleanup', () => {
            expect(interactionHandler.eventListeners.length).toBeGreaterThan(0);
        });

        it('should clean up all event listeners on destroy', () => {
            const listenerCount = interactionHandler.eventListeners.length;
            expect(listenerCount).toBeGreaterThan(0);
            
            interactionHandler.destroy();
            
            expect(interactionHandler.eventListeners).toHaveLength(0);
        });

        it('should reset state on destroy', () => {
            interactionHandler.handleColumnHover(3);
            interactionHandler.showDropPreview(3);
            
            interactionHandler.destroy();
            
            expect(interactionHandler.hoveredColumn).toBeNull();
            expect(interactionHandler.previewDisc).toBeNull();
            expect(interactionHandler.onColumnClickCallback).toBeNull();
        });

        it('should handle multiple destroy calls safely', () => {
            expect(() => {
                interactionHandler.destroy();
                interactionHandler.destroy();
                interactionHandler.destroy();
            }).not.toThrow();
        });
    });

    describe('12. Performance Testing', () => {
        it('should setup interactions within performance threshold', () => {
            const startTime = performance.now();
            interactionHandler.setupColumnInteractions();
            const endTime = performance.now();
            
            const setupTime = endTime - startTime;
            expect(setupTime).toBeLessThan(50); // Should setup in under 50ms
        });

        it('should handle rapid click events efficiently', () => {
            interactionHandler.setupColumnInteractions();
            
            const startTime = performance.now();
            
            // Simulate rapid clicking
            for (let i = 0; i < 100; i++) {
                interactionHandler.handleColumnClick(i % 7);
            }
            
            const endTime = performance.now();
            const handlingTime = endTime - startTime;
            
            expect(handlingTime).toBeLessThan(50); // 100 clicks in under 50ms
        });

        it('should update hover state efficiently', () => {
            interactionHandler.setupColumnInteractions();
            
            const startTime = performance.now();
            
            // Simulate rapid hover changes
            for (let i = 0; i < 50; i++) {
                interactionHandler.handleColumnHover(i % 7);
                interactionHandler.handleColumnHoverLeave();
            }
            
            const endTime = performance.now();
            const hoverTime = endTime - startTime;
            
            expect(hoverTime).toBeLessThan(25); // 100 hover operations in under 25ms
        });
    });
});