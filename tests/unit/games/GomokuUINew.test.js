/**
 * Unit Tests for GomokuUINew Class
 * Tests the specific UI logic of Gomoku that extends BaseGameUI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the UI modules
vi.mock('../../../assets/js/ui-modules/index.js', () => ({
    BaseGameUI: class MockBaseGameUI {
        constructor(game, config) {
            this.game = game;
            this.config = config;
            this.elements = {};
            this.modules = new Map();
            this.initialized = false;
        }
        
        async init() {
            this.initialized = true;
        }
        
        getModule(name) {
            return this.modules.get(name) || null;
        }
        
        showMessage(message, type) {
            console.log(`${type}: ${message}`);
        }
        
        setupGameEventListeners() {
            // Base implementation
        }
    }
}));

// Mock the configuration
vi.mock('../../../games/gomoku/js/gomoku-config.js', () => ({
    GOMOKU_UI_CONFIG: {
        elements: {
            required: ['gameBoard', 'gameStatus'],
            optional: ['currentPlayer', 'moveHistory']
        },
        modals: {
            help: { id: 'helpModal' }
        },
        keyboard: {
            'F1': 'toggleHelp',
            'r': 'resetGame'
        },
        messages: {
            position: 'top-right'
        }
    }
}));

// Mock coordinate utilities
vi.mock('../../../games/gomoku/js/coord-utils.js', () => ({
    CoordUtils: {
        coordsToElement: vi.fn((element, row, col) => {
            element.dataset.row = row;
            element.dataset.col = col;
        }),
        gomokuGridToPixel: vi.fn((row, col, boardWidth, boardHeight) => {
            // Simple mock calculation
            const stepX = boardWidth / 15;
            const stepY = boardHeight / 15;
            return [col * stepX, row * stepY];
        }),
        pixelToGomokuGrid: vi.fn((pixelX, pixelY, boardWidth, boardHeight) => {
            const stepX = boardWidth / 15;
            const stepY = boardHeight / 15;
            return [Math.round(pixelY / stepY), Math.round(pixelX / stepX)];
        })
    }
}));

describe('GomokuUINew Unit Tests', () => {
    let mockGame;
    let gomokuUI;
    let dom;
    let document;

    beforeEach(() => {
        // Setup JSDOM
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="gameBoard" style="width: 450px; height: 450px; position: relative;"></div>
                <div id="gameStatus">Black Player's Turn</div>
                <div id="currentPlayer">Black</div>
                <div id="moveHistory"></div>
                <div id="helpModal"></div>
            </body>
            </html>
        `);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;

        // Mock game object
        mockGame = {
            BOARD_SIZE: 15,
            makeMove: vi.fn(),
            getCurrentPlayer: vi.fn(() => 1),
            getBoard: vi.fn(() => Array(15).fill().map(() => Array(15).fill(0))),
            isGameOver: vi.fn(() => false),
            getWinner: vi.fn(() => null),
            getMoveHistory: vi.fn(() => []),
            undoMove: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn()
        };

        // Import and create GomokuUINew after mocking
        const { GomokuUINew } = require('../../../games/gomoku/js/ui-new.js');
        gomokuUI = new GomokuUINew(mockGame);
        
        // Setup basic elements
        gomokuUI.elements = {
            gameBoard: document.getElementById('gameBoard'),
            gameStatus: document.getElementById('gameStatus'),
            currentPlayer: document.getElementById('currentPlayer'),
            moveHistory: document.getElementById('moveHistory')
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        if (dom) {
            dom.window.close();
        }
    });

    describe('1. Constructor and Initialization', () => {
        it('should initialize with correct default properties', () => {
            expect(gomokuUI.game).toBe(mockGame);
            expect(gomokuUI.gameMode).toBe('two-player');
            expect(gomokuUI.isProcessingMove).toBe(false);
            expect(gomokuUI.lastMoveHighlight).toBeNull();
            expect(gomokuUI.crosshairElements).toEqual({});
        });

        it('should initialize player colors', () => {
            expect(gomokuUI.playerColors).toEqual({
                1: 'black',
                2: 'white'
            });
        });

        it('should initialize assistance settings', () => {
            const expectedSettings = {
                showLastMove: true,
                showLegalMoves: false,
                showThreats: false
            };
            
            expect(gomokuUI.assistanceSettings).toEqual(expectedSettings);
        });
    });

    describe('2. Board Creation', () => {
        it('should create a 15x15 Gomoku board', () => {
            gomokuUI.createBoard();
            
            const gameBoard = gomokuUI.elements.gameBoard;
            const intersections = gameBoard.querySelectorAll('.intersection');
            
            // Should have 225 intersections (15 × 15)
            expect(intersections.length).toBe(225);
        });

        it('should assign correct row and column data attributes', () => {
            gomokuUI.createBoard();
            
            const gameBoard = gomokuUI.elements.gameBoard;
            const firstIntersection = gameBoard.querySelector('[data-row="0"][data-col="0"]');
            const lastIntersection = gameBoard.querySelector('[data-row="14"][data-col="14"]');
            
            expect(firstIntersection).toBeTruthy();
            expect(lastIntersection).toBeTruthy();
        });

        it('should call CoordUtils for positioning', () => {
            const { CoordUtils } = require('../../../games/gomoku/js/coord-utils.js');
            
            gomokuUI.createBoard();
            
            // Should be called for each intersection (225 times)
            expect(CoordUtils.coordsToElement).toHaveBeenCalledTimes(225);
            expect(CoordUtils.gomokuGridToPixel).toHaveBeenCalledTimes(225);
        });
    });

    describe('3. Stone Positioning', () => {
        beforeEach(() => {
            gomokuUI.createBoard();
        });

        it('should position stone at correct pixel coordinates', () => {
            const row = 7, col = 7; // Center of board
            const stoneElement = document.createElement('div');
            stoneElement.className = 'stone black';
            
            gomokuUI.positionStoneOnBoardResponsive(row, col, stoneElement);
            
            // Check that positioning styles were applied
            expect(stoneElement.style.position).toBe('absolute');
            expect(stoneElement.style.left).toBeTruthy();
            expect(stoneElement.style.top).toBeTruthy();
            expect(stoneElement.style.transform).toBe('translate(-50%, -50%)');
        });

        it('should calculate responsive stone size', () => {
            const row = 0, col = 0;
            const stoneElement = document.createElement('div');
            stoneElement.className = 'stone black';
            
            gomokuUI.positionStoneOnBoardResponsive(row, col, stoneElement);
            
            // Check that size was set
            expect(stoneElement.style.width).toBeTruthy();
            expect(stoneElement.style.height).toBeTruthy();
            
            // Size should be between min and max
            const width = parseInt(stoneElement.style.width);
            expect(width).toBeGreaterThanOrEqual(12);
            expect(width).toBeLessThanOrEqual(40);
        });

        it('should store position data for potential resize', () => {
            const row = 5, col = 8;
            const stoneElement = document.createElement('div');
            
            gomokuUI.positionStoneOnBoardResponsive(row, col, stoneElement);
            
            expect(stoneElement.dataset.stoneRow).toBe(row.toString());
            expect(stoneElement.dataset.stoneCol).toBe(col.toString());
        });
    });

    describe('4. Click Handling', () => {
        beforeEach(() => {
            gomokuUI.createBoard();
        });

        it('should handle intersection click when not processing move', async () => {
            gomokuUI.isProcessingMove = false;
            mockGame.makeMove.mockResolvedValue({ success: true, row: 5, col: 5 });
            
            const intersection = gomokuUI.elements.gameBoard.querySelector('[data-row="5"][data-col="5"]');
            
            await gomokuUI.handleIntersectionClick({ target: intersection });
            
            expect(mockGame.makeMove).toHaveBeenCalledWith(5, 5);
        });

        it('should not process move when already processing', async () => {
            gomokuUI.isProcessingMove = true;
            
            const intersection = gomokuUI.elements.gameBoard.querySelector('[data-row="5"][data-col="5"]');
            
            await gomokuUI.handleIntersectionClick({ target: intersection });
            
            expect(mockGame.makeMove).not.toHaveBeenCalled();
        });

        it('should ignore clicks on non-intersection elements', async () => {
            const nonIntersection = document.createElement('div');
            nonIntersection.className = 'not-intersection';
            
            await gomokuUI.handleIntersectionClick({ target: nonIntersection });
            
            expect(mockGame.makeMove).not.toHaveBeenCalled();
        });
    });

    describe('5. Crosshair System', () => {
        beforeEach(() => {
            gomokuUI.createBoard();
        });

        it('should create crosshair on mouse move', () => {
            const intersection = gomokuUI.elements.gameBoard.querySelector('[data-row="7"][data-col="8"]');
            const mockEvent = {
                target: intersection,
                clientX: 200,
                clientY: 200
            };

            gomokuUI.handleMouseMove(mockEvent);

            // Should create row and column crosshair lines
            const rowLine = gomokuUI.elements.gameBoard.querySelector('.crosshair-row');
            const colLine = gomokuUI.elements.gameBoard.querySelector('.crosshair-col');
            
            expect(rowLine).toBeTruthy();
            expect(colLine).toBeTruthy();
        });

        it('should update crosshair position on different intersection', () => {
            // First position
            const intersection1 = gomokuUI.elements.gameBoard.querySelector('[data-row="5"][data-col="5"]');
            gomokuUI.handleMouseMove({ target: intersection1, clientX: 150, clientY: 150 });
            
            const initialRowTop = gomokuUI.elements.gameBoard.querySelector('.crosshair-row').style.top;
            
            // Second position
            const intersection2 = gomokuUI.elements.gameBoard.querySelector('[data-row="10"][data-col="10"]');
            gomokuUI.handleMouseMove({ target: intersection2, clientX: 300, clientY: 300 });
            
            const newRowTop = gomokuUI.elements.gameBoard.querySelector('.crosshair-row').style.top;
            
            expect(newRowTop).not.toBe(initialRowTop);
        });

        it('should clear crosshair on mouse leave', () => {
            // Create crosshair first
            const intersection = gomokuUI.elements.gameBoard.querySelector('[data-row="7"][data-col="7"]');
            gomokuUI.handleMouseMove({ target: intersection, clientX: 200, clientY: 200 });
            
            // Now clear it
            gomokuUI.clearCrosshair();
            
            const rowLine = gomokuUI.elements.gameBoard.querySelector('.crosshair-row');
            const colLine = gomokuUI.elements.gameBoard.querySelector('.crosshair-col');
            
            expect(rowLine).toBeFalsy();
            expect(colLine).toBeFalsy();
        });
    });

    describe('6. Move History', () => {
        it('should update move history display', () => {
            const mockHistory = [
                { row: 7, col: 7, player: 1 },
                { row: 8, col: 8, player: 2 },
                { row: 6, col: 7, player: 1 }
            ];
            
            mockGame.getMoveHistory.mockReturnValue(mockHistory);
            
            gomokuUI.updateMoveHistory();
            
            // Verify that move history element was updated
            expect(mockGame.getMoveHistory).toHaveBeenCalled();
            
            // The actual implementation would depend on how the history is displayed
            // but we can verify the method runs without error
        });

        it('should handle empty move history', () => {
            mockGame.getMoveHistory.mockReturnValue([]);
            
            expect(() => gomokuUI.updateMoveHistory()).not.toThrow();
        });
    });

    describe('7. Last Move Highlighting', () => {
        beforeEach(() => {
            gomokuUI.createBoard();
        });

        it('should highlight last move when assistance is enabled', () => {
            gomokuUI.assistanceSettings.showLastMove = true;
            
            gomokuUI.highlightLastMove(7, 7);
            
            const highlight = gomokuUI.elements.gameBoard.querySelector('.last-move-highlight');
            expect(highlight).toBeTruthy();
            expect(gomokuUI.lastMoveHighlight).toBe(highlight);
        });

        it('should not highlight when assistance is disabled', () => {
            gomokuUI.assistanceSettings.showLastMove = false;
            
            gomokuUI.highlightLastMove(7, 7);
            
            const highlight = gomokuUI.elements.gameBoard.querySelector('.last-move-highlight');
            expect(highlight).toBeFalsy();
            expect(gomokuUI.lastMoveHighlight).toBeNull();
        });

        it('should clear previous highlight when adding new one', () => {
            gomokuUI.assistanceSettings.showLastMove = true;
            
            // Add first highlight
            gomokuUI.highlightLastMove(5, 5);
            const firstHighlight = gomokuUI.lastMoveHighlight;
            
            // Add second highlight
            gomokuUI.highlightLastMove(8, 8);
            
            // First highlight should be removed from DOM
            expect(firstHighlight.parentNode).toBeFalsy();
            
            // New highlight should exist
            expect(gomokuUI.lastMoveHighlight).toBeTruthy();
            expect(gomokuUI.lastMoveHighlight).not.toBe(firstHighlight);
        });
    });

    describe('8. Player Status Updates', () => {
        it('should update current player display', () => {
            gomokuUI.updateCurrentPlayer(1);
            
            expect(gomokuUI.elements.currentPlayer.textContent).toBe('Black');
            expect(gomokuUI.elements.currentPlayer.className).toContain('black');
        });

        it('should update for white player', () => {
            gomokuUI.updateCurrentPlayer(2);
            
            expect(gomokuUI.elements.currentPlayer.textContent).toBe('White');
            expect(gomokuUI.elements.currentPlayer.className).toContain('white');
        });

        it('should update game status message', () => {
            const status = 'White Player wins!';
            
            gomokuUI.updateGameStatus(status);
            
            expect(gomokuUI.elements.gameStatus.textContent).toBe(status);
        });
    });

    describe('9. Assistance Settings', () => {
        it('should toggle assistance settings', () => {
            const initialValue = gomokuUI.assistanceSettings.showThreats;
            
            gomokuUI.toggleAssistanceSetting('showThreats');
            
            expect(gomokuUI.assistanceSettings.showThreats).toBe(!initialValue);
        });

        it('should get current assistance setting', () => {
            gomokuUI.assistanceSettings.showLegalMoves = true;
            
            expect(gomokuUI.getAssistanceSetting('showLegalMoves')).toBe(true);
        });

        it('should handle unknown assistance setting gracefully', () => {
            expect(() => gomokuUI.toggleAssistanceSetting('unknownSetting')).not.toThrow();
            expect(gomokuUI.getAssistanceSetting('unknownSetting')).toBeUndefined();
        });
    });

    describe('10. Error Handling', () => {
        it('should handle missing game board gracefully', () => {
            gomokuUI.elements.gameBoard = null;
            
            expect(() => gomokuUI.createBoard()).not.toThrow();
        });

        it('should handle game method errors gracefully', async () => {
            mockGame.makeMove.mockRejectedValue(new Error('Invalid move'));
            
            const intersection = gomokuUI.elements.gameBoard.querySelector('[data-row="5"][data-col="5"]');
            
            // Should not throw
            await expect(gomokuUI.handleIntersectionClick({ target: intersection })).resolves.not.toThrow();
        });

        it('should handle resize recalculation safely', () => {
            gomokuUI.createBoard();
            
            // Should not throw even if stones exist
            expect(() => gomokuUI.recalculateStonePositions()).not.toThrow();
        });
    });
});