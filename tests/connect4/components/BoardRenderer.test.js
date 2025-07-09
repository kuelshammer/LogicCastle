/**
 * BoardRenderer Component Unit Tests
 * 
 * Tests the isolated BoardRenderer component for:
 * - Board creation & DOM structure
 * - Coordinate label generation  
 * - Visual updates & cell state management
 * - Performance metrics (rendering time)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BoardRenderer } from '../../../games/connect4/js/components/BoardRenderer.js';

describe('BoardRenderer Component Tests', () => {
    let container;
    let gameBoard;
    let topCoords;
    let bottomCoords;
    let boardRenderer;
    let mockGame;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        container.innerHTML = `
            <div id="topCoords" class="board-coords top"></div>
            <div id="gameBoard" class="game-board"></div>
            <div id="bottomCoords" class="board-coords bottom"></div>
        `;
        document.body.appendChild(container);

        gameBoard = container.querySelector('#gameBoard');
        topCoords = container.querySelector('#topCoords');
        bottomCoords = container.querySelector('#bottomCoords');

        // Create mock game
        mockGame = {
            getCell: vi.fn((row, col) => 0), // Default: empty cells
            isGameOver: vi.fn(() => false),
            getCurrentPlayer: vi.fn(() => 1)
        };

        // Initialize BoardRenderer
        boardRenderer = new BoardRenderer(gameBoard, topCoords, bottomCoords);
    });

    afterEach(() => {
        if (boardRenderer) {
            boardRenderer.destroy();
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. Constructor and Initialization', () => {
        it('should create BoardRenderer with correct initial state', () => {
            expect(boardRenderer).toBeDefined();
            expect(boardRenderer.gameBoard).toBe(gameBoard);
            expect(boardRenderer.topCoords).toBe(topCoords);
            expect(boardRenderer.bottomCoords).toBe(bottomCoords);
            expect(boardRenderer.rows).toBe(6);
            expect(boardRenderer.cols).toBe(7);
            expect(boardRenderer.initialized).toBe(false);
        });

        it('should handle missing DOM elements gracefully', () => {
            const renderer = new BoardRenderer(null, null, null);
            expect(renderer.gameBoard).toBeNull();
            expect(renderer.topCoords).toBeNull();
            expect(renderer.bottomCoords).toBeNull();
        });
    });

    describe('2. Board Initialization', () => {
        it('should initialize 6x7 Connect4 board successfully', () => {
            const success = boardRenderer.initializeBoard();
            
            expect(success).toBe(true);
            expect(boardRenderer.initialized).toBe(true);
            expect(boardRenderer.cells).toHaveLength(42); // 6x7 = 42 cells
            expect(boardRenderer.discs).toHaveLength(42);
        });

        it('should create correct board DOM structure', () => {
            boardRenderer.initializeBoard();
            
            // Check board styling
            expect(gameBoard.style.display).toBe('grid');
            expect(gameBoard.style.gridTemplateColumns).toBe('repeat(7, 1fr)');
            expect(gameBoard.style.gridTemplateRows).toBe('repeat(6, 1fr)');
            expect(gameBoard.style.aspectRatio).toBe('7/6');
            
            // Check cell count
            const cells = gameBoard.querySelectorAll('.game-slot');
            expect(cells).toHaveLength(42);
        });

        it('should create cells with correct data attributes', () => {
            boardRenderer.initializeBoard();
            
            const cells = gameBoard.querySelectorAll('.game-slot');
            
            // Check first cell (0,0)
            const firstCell = cells[0];
            expect(firstCell.dataset.row).toBe('0');
            expect(firstCell.dataset.col).toBe('0');
            expect(firstCell.dataset.index).toBe('0');
            
            // Check last cell (5,6)
            const lastCell = cells[41];
            expect(lastCell.dataset.row).toBe('5');
            expect(lastCell.dataset.col).toBe('6');
            expect(lastCell.dataset.index).toBe('41');
        });

        it('should create disc placeholders in each cell', () => {
            boardRenderer.initializeBoard();
            
            const discs = gameBoard.querySelectorAll('.disc');
            expect(discs).toHaveLength(42);
            
            // Check disc styling
            discs.forEach(disc => {
                expect(disc.classList.contains('empty')).toBe(true);
                expect(disc.style.width).toBe('85%');
                expect(disc.style.height).toBe('85%');
                expect(disc.style.borderRadius).toBe('50%');
            });
        });

        it('should fail gracefully with missing gameBoard', () => {
            const renderer = new BoardRenderer(null, topCoords, bottomCoords);
            const success = renderer.initializeBoard();
            
            expect(success).toBe(false);
            expect(renderer.initialized).toBe(false);
        });

        it('should clear existing board content', () => {
            // Add some content first
            gameBoard.innerHTML = '<div>existing content</div>';
            
            boardRenderer.initializeBoard();
            
            // Should only have new cells, no old content
            const cells = gameBoard.querySelectorAll('.game-slot');
            const oldContent = gameBoard.querySelectorAll('div:not(.game-slot):not(.disc)');
            
            expect(cells).toHaveLength(42);
            expect(oldContent).toHaveLength(0);
        });
    });

    describe('3. Coordinate Label Creation', () => {
        beforeEach(() => {
            boardRenderer.initializeBoard();
        });

        it('should create coordinate labels for all columns', () => {
            boardRenderer.createCoordinateLabels();
            
            // Check top coordinates
            const topLabels = topCoords.querySelectorAll('.coord');
            expect(topLabels).toHaveLength(7);
            
            // Check bottom coordinates  
            const bottomLabels = bottomCoords.querySelectorAll('.coord');
            expect(bottomLabels).toHaveLength(7);
        });

        it('should create labels with correct content and styling', () => {
            boardRenderer.createCoordinateLabels();
            
            const topLabels = topCoords.querySelectorAll('.coord');
            
            topLabels.forEach((label, index) => {
                expect(label.textContent).toBe((index + 1).toString());
                expect(label.dataset.col).toBe(index.toString());
                expect(label.style.color).toBe('rgb(102, 102, 102)'); // #666
                expect(label.style.cursor).toBe('pointer');
            });
        });

        it('should apply CSS Grid styles to coordinate containers', () => {
            boardRenderer.createCoordinateLabels();
            
            // Check top coordinates styling
            expect(topCoords.style.display).toBe('grid');
            expect(topCoords.style.gridTemplateColumns).toBe('repeat(7, 1fr)');
            expect(topCoords.style.padding).toBe('20px');
            
            // Check bottom coordinates styling
            expect(bottomCoords.style.display).toBe('grid');
            expect(bottomCoords.style.gridTemplateColumns).toBe('repeat(7, 1fr)');
            expect(bottomCoords.style.padding).toBe('20px');
        });

        it('should handle missing coordinate containers gracefully', () => {
            const renderer = new BoardRenderer(gameBoard, null, null);
            renderer.initializeBoard();
            
            // Should not throw error
            expect(() => renderer.createCoordinateLabels()).not.toThrow();
        });

        it('should create coordinate containers if missing but parent exists', () => {
            // Remove coordinate elements but keep parent
            topCoords.remove();
            bottomCoords.remove();
            
            boardRenderer.createCoordinateLabels();
            
            // Should create new coordinate containers
            const newTopCoords = container.querySelector('#topCoords');
            const newBottomCoords = container.querySelector('#bottomCoords');
            
            expect(newTopCoords).toBeTruthy();
            expect(newBottomCoords).toBeTruthy();
        });
    });

    describe('4. Board State Updates', () => {
        beforeEach(() => {
            boardRenderer.initializeBoard();
        });

        it('should update board based on game state', () => {
            // Mock game state with some moves
            mockGame.getCell.mockImplementation((row, col) => {
                if (row === 5 && col === 0) return 1; // Yellow at bottom-left
                if (row === 5 && col === 1) return 2; // Red at bottom-center
                return 0; // Empty elsewhere
            });
            
            boardRenderer.updateBoard(mockGame);
            
            // Check that correct cells were updated
            const yellowDisc = boardRenderer.getDiscAt(5, 0);
            const redDisc = boardRenderer.getDiscAt(5, 1);
            const emptyDisc = boardRenderer.getDiscAt(0, 0);
            
            expect(yellowDisc.classList.contains('yellow')).toBe(true);
            expect(redDisc.classList.contains('red')).toBe(true);
            expect(emptyDisc.classList.contains('empty')).toBe(true);
        });

        it('should update individual cell visuals correctly', () => {
            boardRenderer.updateBoardVisual(5, 3, 1); // Yellow player
            
            const cell = boardRenderer.getCellAt(5, 3);
            const disc = cell.querySelector('.disc');
            
            expect(disc.classList.contains('yellow')).toBe(true);
            expect(disc.classList.contains('empty')).toBe(false);
            expect(disc.style.background).toBe('rgb(255, 215, 0)'); // #FFD700
        });

        it('should handle red player pieces correctly', () => {
            boardRenderer.updateBoardVisual(4, 2, 2); // Red player
            
            const disc = boardRenderer.getDiscAt(4, 2);
            
            expect(disc.classList.contains('red')).toBe(true);
            expect(disc.style.background).toBe('rgb(244, 67, 54)'); // #F44336
        });

        it('should clear board state correctly', () => {
            // Place some pieces first
            boardRenderer.updateBoardVisual(5, 0, 1);
            boardRenderer.updateBoardVisual(5, 1, 2);
            
            boardRenderer.clearBoard();
            
            // All discs should be empty
            const discs = gameBoard.querySelectorAll('.disc');
            discs.forEach(disc => {
                expect(disc.classList.contains('empty')).toBe(true);
                expect(disc.style.background).toBe('transparent');
            });
        });

        it('should handle invalid positions gracefully', () => {
            expect(() => boardRenderer.updateBoardVisual(-1, 0, 1)).not.toThrow();
            expect(() => boardRenderer.updateBoardVisual(6, 0, 1)).not.toThrow();
            expect(() => boardRenderer.updateBoardVisual(0, -1, 1)).not.toThrow();
            expect(() => boardRenderer.updateBoardVisual(0, 7, 1)).not.toThrow();
        });
    });

    describe('5. Element Access Methods', () => {
        beforeEach(() => {
            boardRenderer.initializeBoard();
        });

        it('should return correct cell elements by position', () => {
            const cell = boardRenderer.getCellAt(3, 4);
            
            expect(cell).toBeTruthy();
            expect(cell.dataset.row).toBe('3');
            expect(cell.dataset.col).toBe('4');
            expect(cell.classList.contains('game-slot')).toBe(true);
        });

        it('should return correct disc elements by position', () => {
            const disc = boardRenderer.getDiscAt(2, 5);
            
            expect(disc).toBeTruthy();
            expect(disc.classList.contains('disc')).toBe(true);
            expect(disc.classList.contains('empty')).toBe(true);
        });

        it('should return null for invalid positions', () => {
            expect(boardRenderer.getCellAt(-1, 0)).toBeNull();
            expect(boardRenderer.getCellAt(6, 0)).toBeNull();
            expect(boardRenderer.getCellAt(0, -1)).toBeNull();
            expect(boardRenderer.getCellAt(0, 7)).toBeNull();
            
            expect(boardRenderer.getDiscAt(-1, 0)).toBeNull();
            expect(boardRenderer.getDiscAt(6, 0)).toBeNull();
        });

        it('should provide correct dimensions', () => {
            const dimensions = boardRenderer.getDimensions();
            
            expect(dimensions.rows).toBe(6);
            expect(dimensions.cols).toBe(7);
        });

        it('should track initialization state correctly', () => {
            expect(boardRenderer.isInitialized()).toBe(true);
            
            boardRenderer.destroy();
            expect(boardRenderer.isInitialized()).toBe(false);
        });
    });

    describe('6. Performance Testing', () => {
        it('should initialize board within performance threshold', () => {
            const startTime = performance.now();
            boardRenderer.initializeBoard();
            const endTime = performance.now();
            
            const initTime = endTime - startTime;
            expect(initTime).toBeLessThan(50); // Should initialize in under 50ms
        });

        it('should update board state efficiently', () => {
            boardRenderer.initializeBoard();
            
            const startTime = performance.now();
            boardRenderer.updateBoard(mockGame);
            const endTime = performance.now();
            
            const updateTime = endTime - startTime;
            expect(updateTime).toBeLessThan(10); // Should update in under 10ms
        });

        it('should handle multiple visual updates efficiently', () => {
            boardRenderer.initializeBoard();
            
            const startTime = performance.now();
            
            // Simulate filling the board
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 7; col++) {
                    const player = (row + col) % 2 + 1;
                    boardRenderer.updateBoardVisual(row, col, player);
                }
            }
            
            const endTime = performance.now();
            const updateTime = endTime - startTime;
            
            expect(updateTime).toBeLessThan(100); // 42 updates in under 100ms
        });
    });

    describe('7. Memory Management', () => {
        it('should clean up resources properly on destroy', () => {
            boardRenderer.initializeBoard();
            
            expect(boardRenderer.cells).toHaveLength(42);
            expect(boardRenderer.discs).toHaveLength(42);
            expect(boardRenderer.initialized).toBe(true);
            
            boardRenderer.destroy();
            
            expect(boardRenderer.cells).toHaveLength(0);
            expect(boardRenderer.discs).toHaveLength(0);
            expect(boardRenderer.initialized).toBe(false);
            expect(gameBoard.innerHTML).toBe('');
        });

        it('should handle multiple destroy calls safely', () => {
            boardRenderer.initializeBoard();
            
            expect(() => {
                boardRenderer.destroy();
                boardRenderer.destroy();
                boardRenderer.destroy();
            }).not.toThrow();
        });
    });

    describe('8. Responsive Design', () => {
        beforeEach(() => {
            boardRenderer.initializeBoard();
        });

        it('should apply responsive styling constraints', () => {
            expect(gameBoard.style.maxWidth).toBe('min(80vw, calc(70vh * 7 / 6))');
            expect(gameBoard.style.maxHeight).toBe('min(70vh, calc(80vw * 6 / 7))');
            expect(gameBoard.style.width).toBe('100%');
            expect(gameBoard.style.height).toBe('auto');
        });

        it('should maintain aspect ratio', () => {
            expect(gameBoard.style.aspectRatio).toBe('7/6');
            
            // Check that cells maintain aspect ratio too
            const cells = gameBoard.querySelectorAll('.game-slot');
            cells.forEach(cell => {
                expect(cell.style.aspectRatio).toBe('1');
            });
        });

        it('should apply consistent padding to coordinates', () => {
            boardRenderer.createCoordinateLabels();
            
            expect(topCoords.style.padding).toBe('20px');
            expect(bottomCoords.style.padding).toBe('20px');
            expect(gameBoard.style.padding).toBe('20px');
        });
    });

    describe('9. Error Handling', () => {
        it('should handle corrupted game state gracefully', () => {
            boardRenderer.initializeBoard();
            
            const corruptedGame = {
                getCell: vi.fn(() => { throw new Error('Corrupted state'); })
            };
            
            expect(() => boardRenderer.updateBoard(corruptedGame)).not.toThrow();
        });

        it('should handle missing disc elements', () => {
            boardRenderer.initializeBoard();
            
            // Remove a disc element
            const cell = boardRenderer.getCellAt(0, 0);
            const disc = cell.querySelector('.disc');
            disc.remove();
            
            expect(() => boardRenderer.updateBoardVisual(0, 0, 1)).not.toThrow();
        });

        it('should validate input parameters', () => {
            boardRenderer.initializeBoard();
            
            // Should handle null/undefined gracefully
            expect(() => boardRenderer.updateBoard(null)).not.toThrow();
            expect(() => boardRenderer.updateBoard(undefined)).not.toThrow();
        });
    });
});