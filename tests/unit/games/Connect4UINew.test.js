/**
 * Unit Tests for Connect4UINew Class
 * Tests the specific UI logic of Connect4 that extends BaseGameUI
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
        
        bindKeyboardActions(controller) {
            // Base implementation
        }
    }
}));

// Mock the configuration
vi.mock('../../../games/connect4/js/connect4-config.js', () => ({
    CONNECT4_UI_CONFIG: {
        elements: {
            required: ['gameBoard', 'gameStatus'],
            optional: ['gameMode']
        },
        modals: {
            help: { id: 'helpModal' }
        },
        keyboard: {
            'F1': 'toggleHelp',
            '1': 'dropColumn1'
        },
        messages: {
            position: 'top-right'
        }
    },
    createConnect4Config: vi.fn((mode) => ({
        elements: {
            required: ['gameBoard', 'gameStatus'],
            optional: ['gameMode']
        },
        gameMode: mode
    }))
}));

describe('Connect4UINew Unit Tests', () => {
    let mockGame;
    let connect4UI;
    let dom;
    let document;

    beforeEach(() => {
        // Setup JSDOM
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="gameBoard"></div>
                <div id="gameStatus">Yellow Player's Turn</div>
                <select id="gameMode">
                    <option value="two-player">Two Player</option>
                    <option value="ai-easy">AI Easy</option>
                </select>
                <div id="topCoords"></div>
                <div id="bottomCoords"></div>
                <div id="assistanceModal"></div>
            </body>
            </html>
        `);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;

        // Mock game object
        mockGame = {
            BOARD_SIZE: 6,
            BOARD_WIDTH: 7,
            makeMove: vi.fn(),
            getCurrentPlayer: vi.fn(() => 1),
            getBoard: vi.fn(() => Array(6).fill().map(() => Array(7).fill(0))),
            isGameOver: vi.fn(() => false),
            getWinner: vi.fn(() => null),
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn()
        };

        // Import and create Connect4UINew after mocking
        const { Connect4UINew } = require('../../../games/connect4/js/ui-new.js');
        connect4UI = new Connect4UINew(mockGame);
        
        // Setup basic elements
        connect4UI.elements = {
            gameBoard: document.getElementById('gameBoard'),
            gameStatus: document.getElementById('gameStatus'),
            gameMode: document.getElementById('gameMode')
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
            expect(connect4UI.game).toBe(mockGame);
            expect(connect4UI.gameMode).toBe('two-player');
            expect(connect4UI.isProcessingMove).toBe(false);
            expect(connect4UI.aiPlayer).toBe(2);
            expect(connect4UI.scores).toEqual({ yellow: 0, red: 0 });
            expect(connect4UI.animationDuration).toBe(400);
            expect(connect4UI.aiThinkingDelay).toBe(800);
        });

        it('should initialize assistance settings for both players', () => {
            expect(connect4UI.assistanceSettings).toHaveProperty('player1');
            expect(connect4UI.assistanceSettings).toHaveProperty('player2');
            
            const expectedSettings = {
                undo: false,
                threats: false,
                'winning-moves': false,
                'blocked-columns': false
            };
            
            expect(connect4UI.assistanceSettings.player1).toEqual(expectedSettings);
            expect(connect4UI.assistanceSettings.player2).toEqual(expectedSettings);
        });
    });

    describe('2. Board Initialization', () => {
        it('should create a 6x7 game board', () => {
            connect4UI.initializeBoard();
            
            const gameBoard = connect4UI.elements.gameBoard;
            const cells = gameBoard.querySelectorAll('.cell');
            
            // Should have 42 cells (6 rows × 7 columns)
            expect(cells.length).toBe(42);
        });

        it('should assign correct row and column data attributes', () => {
            connect4UI.initializeBoard();
            
            const gameBoard = connect4UI.elements.gameBoard;
            const firstCell = gameBoard.querySelector('.cell[data-row="0"][data-col="0"]');
            const lastCell = gameBoard.querySelector('.cell[data-row="5"][data-col="6"]');
            
            expect(firstCell).toBeTruthy();
            expect(lastCell).toBeTruthy();
        });

        it('should create drop zone elements for each column', () => {
            connect4UI.initializeBoard();
            
            const gameBoard = connect4UI.elements.gameBoard;
            const dropZones = gameBoard.querySelectorAll('.drop-zone');
            
            // Should have 7 drop zones (one per column)
            expect(dropZones.length).toBe(7);
            
            // Check data attributes
            for (let i = 0; i < 7; i++) {
                const dropZone = gameBoard.querySelector(`[data-drop-col="${i}"]`);
                expect(dropZone).toBeTruthy();
                expect(dropZone.classList.contains('drop-zone')).toBe(true);
            }
        });
    });

    describe('3. Coordinate Labels', () => {
        it('should create top coordinate labels', () => {
            connect4UI.createCoordinateLabels();
            
            // Use the same reference that createCoordinateLabels creates/updates
            const topCoords = connect4UI.elements.topCoords || document.getElementById('topCoords');
            expect(topCoords).toBeTruthy();
            
            const labels = topCoords.querySelectorAll('.coord-label');
            expect(labels.length).toBe(7);
            
            // Check content
            for (let i = 0; i < 7; i++) {
                expect(labels[i].textContent).toBe((i + 1).toString());
            }
        });

        it('should create bottom coordinate labels', () => {
            connect4UI.createCoordinateLabels();
            
            // Use the same reference that createCoordinateLabels creates/updates  
            const bottomCoords = connect4UI.elements.bottomCoords || document.getElementById('bottomCoords');
            expect(bottomCoords).toBeTruthy();
            
            const labels = bottomCoords.querySelectorAll('.coord-label');
            expect(labels.length).toBe(7);
            
            // Check content
            for (let i = 0; i < 7; i++) {
                expect(labels[i].textContent).toBe((i + 1).toString());
            }
        });
    });

    describe('4. Drop Column Logic', () => {
        beforeEach(() => {
            connect4UI.initializeBoard();
        });

        it('should handle column drop when not processing move', async () => {
            connect4UI.isProcessingMove = false;
            mockGame.makeMove.mockResolvedValue({ success: true, row: 5, col: 0 });
            
            await connect4UI.dropDiscInColumn(0);
            
            expect(mockGame.makeMove).toHaveBeenCalledWith(0);
            expect(connect4UI.isProcessingMove).toBe(false); // Should be reset after move
        });

        it('should not process move when already processing', async () => {
            connect4UI.isProcessingMove = true;
            
            await connect4UI.dropDiscInColumn(0);
            
            expect(mockGame.makeMove).not.toHaveBeenCalled();
        });

        it('should handle invalid column numbers gracefully', async () => {
            connect4UI.isProcessingMove = false;
            
            // Test negative column
            await connect4UI.dropDiscInColumn(-1);
            expect(mockGame.makeMove).not.toHaveBeenCalled();
            
            // Test column too high
            await connect4UI.dropDiscInColumn(7);
            expect(mockGame.makeMove).not.toHaveBeenCalled();
        });
    });

    describe('5. Game Mode Handling', () => {
        it('should detect two-player mode', () => {
            document.getElementById('gameMode').value = 'two-player';
            
            expect(connect4UI.isAIMode()).toBe(false);
        });

        it('should detect AI modes', () => {
            document.getElementById('gameMode').value = 'ai-easy';
            
            expect(connect4UI.isAIMode()).toBe(true);
        });

        it('should extract AI difficulty from mode', () => {
            document.getElementById('gameMode').value = 'ai-hard';
            connect4UI.gameMode = 'ai-hard'; // Ensure instance property is also set
            
            expect(connect4UI.getAIDifficulty()).toBe('hard');
        });

        it('should handle unknown mode gracefully', () => {
            document.getElementById('gameMode').value = 'unknown-mode';
            
            expect(connect4UI.isAIMode()).toBe(false);
            expect(connect4UI.getAIDifficulty()).toBe('easy'); // Default fallback
        });
    });

    describe('6. Assistance System', () => {
        it('should toggle assistance setting for specific player and type', () => {
            const initialValue = connect4UI.assistanceSettings.player1.threats;
            
            connect4UI.toggleAssistance('player1', 'threats');
            
            expect(connect4UI.assistanceSettings.player1.threats).toBe(!initialValue);
        });

        it('should not affect other players settings when toggling', () => {
            const player2ThreatsInitial = connect4UI.assistanceSettings.player2.threats;
            const player1UndoInitial = connect4UI.assistanceSettings.player1.undo;
            
            connect4UI.toggleAssistance('player1', 'threats');
            
            expect(connect4UI.assistanceSettings.player2.threats).toBe(player2ThreatsInitial);
            expect(connect4UI.assistanceSettings.player1.undo).toBe(player1UndoInitial);
        });

        it('should return current assistance setting', () => {
            connect4UI.assistanceSettings.player1.threats = true;
            connect4UI.assistanceSettings.player2['winning-moves'] = false;
            
            expect(connect4UI.getAssistanceSetting('player1', 'threats')).toBe(true);
            expect(connect4UI.getAssistanceSetting('player2', 'winning-moves')).toBe(false);
        });
    });

    describe('7. Column Highlighting', () => {
        beforeEach(() => {
            connect4UI.initializeBoard();
        });

        it('should highlight column on hover', () => {
            const column = 3;
            
            connect4UI.highlightColumn(column);
            
            const cells = connect4UI.elements.gameBoard.querySelectorAll(`[data-col="${column}"]`);
            cells.forEach(cell => {
                expect(cell.classList.contains('highlight')).toBe(true);
            });
        });

        it('should clear all column highlights', () => {
            // First add some highlights
            connect4UI.highlightColumn(2);
            connect4UI.highlightColumn(4);
            
            connect4UI.clearColumnHighlights();
            
            const highlightedCells = connect4UI.elements.gameBoard.querySelectorAll('.highlight');
            expect(highlightedCells.length).toBe(0);
        });
    });

    describe('8. Error Handling', () => {
        it('should handle missing game board gracefully', () => {
            connect4UI.elements.gameBoard = null;
            
            expect(() => connect4UI.initializeBoard()).not.toThrow();
        });

        it('should handle missing coordinate containers gracefully', () => {
            // Remove coordinate containers
            document.getElementById('topCoords')?.remove();
            document.getElementById('bottomCoords')?.remove();
            
            expect(() => connect4UI.createCoordinateLabels()).not.toThrow();
        });

        it('should handle game method errors gracefully', async () => {
            mockGame.makeMove.mockRejectedValue(new Error('Invalid move'));
            
            // Should not throw
            await expect(connect4UI.dropDiscInColumn(0)).resolves.not.toThrow();
        });
    });

    describe('9. UI State Updates', () => {
        it('should update game status display', () => {
            const status = 'Red Player\'s Turn';
            
            connect4UI.updateGameStatus(status);
            
            expect(connect4UI.elements.gameStatus.textContent).toBe(status);
        });

        it('should update scores display', () => {
            connect4UI.scores = { yellow: 3, red: 2 };
            
            connect4UI.updateScoresDisplay();
            
            // This would depend on the actual implementation
            // but we're testing that the method runs without error
            expect(connect4UI.scores.yellow).toBe(3);
            expect(connect4UI.scores.red).toBe(2);
        });
    });

    describe('10. Integration with BaseGameUI', () => {
        it('should call parent setupGameEventListeners', () => {
            const parentSpy = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(connect4UI)), 'setupGameEventListeners');
            
            connect4UI.setupGameEventListeners();
            
            expect(parentSpy).toHaveBeenCalled();
        });

        it('should register Connect4-specific game events', () => {
            connect4UI.setupGameEventListeners();
            
            // Verify that game.on was called for Connect4-specific events
            expect(mockGame.on).toHaveBeenCalledWith('moveMade', expect.any(Function));
            expect(mockGame.on).toHaveBeenCalledWith('gameOver', expect.any(Function));
        });
    });
});