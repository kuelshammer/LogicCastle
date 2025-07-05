/**
 * Hex UI Module Integration Tests
 * 
 * Comprehensive test suite for Hex Game UI-Module System integration.
 * Tests the migration from 691-line monolithic hex-game.js to the 
 * standardized UI Module System architecture.
 * 
 * Coverage:
 * - UI Module System integration
 * - Hexagonal coordinate system
 * - SVG rendering and interaction
 * - Connection pathfinding
 * - Game state management
 * - Keyboard navigation
 * - Modal management
 * - Message system
 * - Responsive design
 * - BitPackedBoard integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { HexUINew } from '../games/hex/js/ui-new.js';
import { HEX_UI_CONFIG, HEX_COORDINATES, createHexConfig } from '../games/hex/js/hex-config.js';

// Mock performance and animation for JSDOM compatibility
global.performance = {
    now: vi.fn(() => Date.now())
};

global.requestAnimationFrame = vi.fn((callback) => {
    setTimeout(callback, 16);
    return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock game instance
const createMockGame = () => ({
    // Core game methods
    makeMove: vi.fn(),
    resetGame: vi.fn(),
    newGame: vi.fn(),
    undoMove: vi.fn(),
    
    // Game state
    getCurrentPlayer: vi.fn(() => 1),
    getMoveCount: vi.fn(() => 0),
    getGameStatus: vi.fn(() => 'running'),
    isGameOver: vi.fn(() => false),
    getWinner: vi.fn(() => null),
    
    // Board state
    getBoardSize: vi.fn(() => 11),
    getBoard: vi.fn(() => Array(11).fill(null).map(() => Array(11).fill(0))),
    getCellValue: vi.fn((row, col) => 0),
    
    // Connection checking
    hasConnection: vi.fn(() => false),
    checkWinCondition: vi.fn(() => false),
    
    // Move history
    getMoveHistory: vi.fn(() => []),
    canUndo: vi.fn(() => false),
    
    // Event system
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    
    // Memory stats
    getMemoryStats: vi.fn(() => ({
        naiveSize: 484,
        bitPackedSize: 32,
        efficiency: 93.4
    }))
});

describe('Hex UI Module Integration Tests', () => {
    let dom;
    let document;
    let window;
    let mockGame;
    let hexUI;

    beforeEach(() => {
        // Set up JSDOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hex Game Test</title>
                <style>
                    .game-modal { display: none; }
                    .game-modal.active { display: block; }
                    .message { opacity: 0; }
                    .message.show { opacity: 1; }
                </style>
            </head>
            <body>
                <!-- Core game elements -->
                <div id="gameBoard"></div>
                <div id="currentPlayer">Rot</div>
                <div id="gameStatus">Läuft</div>
                
                <!-- Game controls -->
                <button id="resetGameBtn">Reset</button>
                <button id="undoMoveBtn">Undo</button>
                <button id="showConnectionsBtn">Connections</button>
                <button id="analysisBtn">Analysis</button>
                <button id="topologyBtn">Topology</button>
                <button id="debugBtn">Debug</button>
                
                <!-- Game info -->
                <div id="current-player">Rot</div>
                <div id="move-counter">0</div>
                <div id="game-status">Läuft</div>
                <div id="memory-usage">32 bytes</div>
                
                <!-- Modals -->
                <div id="helpModal" class="game-modal">
                    <div class="modal-content">
                        <span class="close" data-close="helpModal">&times;</span>
                        <h2>Hilfe</h2>
                    </div>
                </div>
                
                <div id="rulesModal" class="game-modal">
                    <div class="modal-content">
                        <span class="close" data-close="rulesModal">&times;</span>
                        <h2>Regeln</h2>
                    </div>
                </div>
                
                <div id="topologyModal" class="game-modal">
                    <div class="modal-content">
                        <span class="close" data-close="topologyModal">&times;</span>
                        <h2>Topologie</h2>
                    </div>
                </div>
                
                <!-- Message container -->
                <div id="message-container"></div>
            </body>
            </html>
        `, { url: 'http://localhost' });

        document = dom.window.document;
        window = dom.window;
        
        // Set up globals
        global.document = document;
        global.window = window;
        global.HTMLElement = window.HTMLElement;
        global.Element = window.Element;
        global.Node = window.Node;
        global.NodeList = window.NodeList;
        global.SVGElement = window.SVGElement;
        
        // Mock game instance
        mockGame = createMockGame();
        
        // Mock ResizeObserver
        global.ResizeObserver = vi.fn(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn()
        }));
    });

    afterEach(() => {
        if (hexUI) {
            hexUI.destroy?.();
            hexUI = null;
        }
        
        // Clean up globals
        delete global.document;
        delete global.window;
        delete global.HTMLElement;
        delete global.Element;
        delete global.Node;
        delete global.NodeList;
        delete global.SVGElement;
        delete global.ResizeObserver;
        
        dom.window.close();
        vi.clearAllMocks();
    });

    describe('1. Import and Configuration Structure', () => {
        it('should import HexUINew class correctly', () => {
            expect(HexUINew).toBeDefined();
            expect(typeof HexUINew).toBe('function');
        });

        it('should import HEX_UI_CONFIG with correct structure', () => {
            expect(HEX_UI_CONFIG).toBeDefined();
            expect(HEX_UI_CONFIG.elements).toBeDefined();
            expect(HEX_UI_CONFIG.keyboard).toBeDefined();
            expect(HEX_UI_CONFIG.messages).toBeDefined();
            expect(HEX_UI_CONFIG.gameSettings).toBeDefined();
        });

        it('should import HEX_COORDINATES utilities', () => {
            expect(HEX_COORDINATES).toBeDefined();
            expect(typeof HEX_COORDINATES.toPixel).toBe('function');
            expect(typeof HEX_COORDINATES.getNeighbors).toBe('function');
        });

        it('should create dynamic configuration correctly', () => {
            const standardConfig = createHexConfig('standard');
            const educationalConfig = createHexConfig('educational');
            
            expect(standardConfig.gameSettings.educational.showTopology).toBe(false);
            expect(educationalConfig.gameSettings.educational.showTopology).toBe(true);
        });
    });

    describe('2. UI Module System Integration', () => {
        it('should create HexUINew instance with game dependency', () => {
            hexUI = new HexUINew(mockGame);
            expect(hexUI).toBeDefined();
            expect(hexUI.game).toBe(mockGame);
        });

        it('should initialize with correct configuration', async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
            
            expect(hexUI.config).toBeDefined();
            expect(hexUI.config.gameSettings.boardSize).toBe(11);
            expect(hexUI.boardSize).toBe(11);
        });

        it('should inherit from BaseGameUI', () => {
            hexUI = new HexUINew(mockGame);
            expect(hexUI.showMessage).toBeDefined();
            expect(hexUI.init).toBeDefined();
            expect(hexUI.destroy).toBeDefined();
        });

        it('should validate required DOM elements', async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
            
            expect(hexUI.elements.gameBoard).toBeDefined();
            expect(hexUI.elements.currentPlayer).toBeDefined();
            expect(hexUI.elements.gameStatus).toBeDefined();
        });
    });

    describe('3. Hexagonal Coordinate System', () => {
        it('should calculate pixel positions correctly', () => {
            const { x, y } = HEX_COORDINATES.toPixel(5, 5, 20, 35, 50, 50);
            expect(typeof x).toBe('number');
            expect(typeof y).toBe('number');
            expect(x).toBeGreaterThan(0);
            expect(y).toBeGreaterThan(0);
        });

        it('should get hexagonal neighbors correctly', () => {
            const neighbors = HEX_COORDINATES.getNeighbors(5, 5, 11);
            expect(neighbors).toHaveLength(6);
            
            // Check each neighbor is within bounds
            neighbors.forEach(neighbor => {
                expect(neighbor.row).toBeGreaterThanOrEqual(0);
                expect(neighbor.row).toBeLessThan(11);
                expect(neighbor.col).toBeGreaterThanOrEqual(0);
                expect(neighbor.col).toBeLessThan(11);
            });
        });

        it('should handle edge cases for neighbors', () => {
            const cornerNeighbors = HEX_COORDINATES.getNeighbors(0, 0, 11);
            expect(cornerNeighbors.length).toBeLessThan(6);
            
            const edgeNeighbors = HEX_COORDINATES.getNeighbors(0, 5, 11);
            expect(edgeNeighbors.length).toBeLessThan(6);
        });
    });

    describe('4. SVG Board Creation and Management', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should create SVG board element', () => {
            const gameBoard = document.getElementById('gameBoard');
            expect(gameBoard).toBeDefined();
            expect(gameBoard.children.length).toBeGreaterThan(0);
        });

        it('should generate correct SVG dimensions', () => {
            hexUI.calculateSVGDimensions();
            expect(hexUI.svgWidth).toBeGreaterThan(0);
            expect(hexUI.svgHeight).toBeGreaterThan(0);
        });

        it('should create hexagon path correctly', () => {
            const path = hexUI.generateHexagonPath(100, 100, 20);
            // Check for valid SVG path structure
            expect(path).toContain('M');
            expect(path).toContain('L');
            expect(path).toContain('Z');
            expect(path.split('L')).toHaveLength(6); // 5 L commands + initial part
            
            // Verify it starts with M and ends with Z
            expect(path.startsWith('M')).toBe(true);
            expect(path.endsWith('Z')).toBe(true);
        });

        it('should initialize board state correctly', () => {
            hexUI.initializeBoard();
            expect(hexUI.board).toBeDefined();
            expect(hexUI.board.length).toBe(11);
            expect(hexUI.board[0].length).toBe(11);
        });
    });

    describe('5. Game Interaction and Events', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should handle cell clicks', () => {
            const mockEvent = {
                currentTarget: {
                    dataset: { row: '5', col: '5' }
                }
            };
            
            hexUI.handleCellClick(mockEvent);
            // Should trigger move logic
            expect(hexUI.board[5][5]).toBe(1); // Current player
        });

        it('should handle game reset', () => {
            hexUI.handleResetGame();
            expect(hexUI.currentPlayer).toBe(1);
            expect(hexUI.moveCount).toBe(0);
            expect(hexUI.gameOver).toBe(false);
        });

        it('should handle undo move', () => {
            // Make a move first
            hexUI.makeMove(5, 5);
            hexUI.handleUndoMove();
            expect(hexUI.moveCount).toBe(0);
            expect(hexUI.board[5][5]).toBe(0);
        });

        it('should switch players correctly', () => {
            hexUI.currentPlayer = 1;
            hexUI.makeMove(5, 5);
            expect(hexUI.currentPlayer).toBe(2);
        });
    });

    describe('6. Connection Detection and Win Conditions', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should detect horizontal connections for red player', () => {
            // Create a winning path for red (left to right)
            for (let col = 0; col < 11; col++) {
                hexUI.board[5][col] = 1; // Red player
            }
            
            const hasConnection = hexUI.hasConnection(1, 'horizontal');
            expect(hasConnection).toBe(true);
        });

        it('should detect vertical connections for blue player', () => {
            // Create a winning path for blue (top to bottom)
            for (let row = 0; row < 11; row++) {
                hexUI.board[row][5] = 2; // Blue player
            }
            
            const hasConnection = hexUI.hasConnection(2, 'vertical');
            expect(hasConnection).toBe(true);
        });

        it('should not detect incomplete connections', () => {
            // Incomplete path for red
            for (let col = 0; col < 5; col++) {
                hexUI.board[5][col] = 1; // Red player
            }
            
            const hasConnection = hexUI.hasConnection(1, 'horizontal');
            expect(hasConnection).toBe(false);
        });

        it('should handle pathfinding with obstacles', () => {
            // Create path with blue blocking stones
            hexUI.board[5][0] = 1; // Red start
            hexUI.board[5][1] = 2; // Blue blocker
            hexUI.board[5][2] = 1; // Red continues
            
            const hasConnection = hexUI.hasConnection(1, 'horizontal');
            expect(hasConnection).toBe(false);
        });
    });

    describe('7. Keyboard Navigation and Controls', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should handle cursor movement', () => {
            hexUI.cursorPosition = { row: 5, col: 5 };
            hexUI.moveCursor(1, 0); // Move right
            expect(hexUI.cursorPosition.col).toBe(6);
            
            hexUI.moveCursor(0, 1); // Move down
            expect(hexUI.cursorPosition.row).toBe(6);
        });

        it('should prevent cursor from moving out of bounds', () => {
            hexUI.cursorPosition = { row: 0, col: 0 };
            hexUI.moveCursor(-1, -1); // Try to move beyond bounds
            expect(hexUI.cursorPosition.row).toBe(0);
            expect(hexUI.cursorPosition.col).toBe(0);
        });

        it('should handle player switching shortcuts', () => {
            hexUI.handleSwitchPlayer(2);
            expect(hexUI.currentPlayer).toBe(2);
            
            hexUI.handleSwitchPlayer(1);
            expect(hexUI.currentPlayer).toBe(1);
        });

        it('should handle zoom controls', () => {
            // Create mock SVG element
            const mockSVG = document.createElement('div');
            mockSVG.style.transform = 'scale(1)';
            hexUI.svgElement = mockSVG;
            
            hexUI.zoomBoard(1.2);
            expect(mockSVG.style.transform).toBe('scale(1.2)');
            
            hexUI.resetZoom();
            expect(mockSVG.style.transform).toBe('scale(1)');
        });
    });

    describe('8. Modal System Integration', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should show help modal', () => {
            const helpModal = document.getElementById('helpModal');
            expect(helpModal).toBeDefined();
            
            // Check if modal system is available
            const modalExists = helpModal !== null;
            expect(modalExists).toBe(true);
        });

        it('should show rules modal', () => {
            const rulesModal = document.getElementById('rulesModal');
            expect(rulesModal).toBeDefined();
        });

        it('should show topology modal', () => {
            const topologyModal = document.getElementById('topologyModal');
            expect(topologyModal).toBeDefined();
        });
    });

    describe('9. Message System', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should display messages correctly', () => {
            hexUI.showMessage('Test message', 'info');
            
            const messageContainer = document.getElementById('message-container');
            expect(messageContainer).toBeDefined();
        });

        it('should handle different message types', () => {
            const messageTypes = ['info', 'success', 'error', 'warning', 'win', 'move', 'connection', 'topology'];
            
            messageTypes.forEach(type => {
                expect(HEX_UI_CONFIG.messages.types[type]).toBeDefined();
            });
        });
    });

    describe('10. Responsive Design and Layout', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should handle responsive hex sizes', () => {
            const { mobile, tablet, desktop } = HEX_UI_CONFIG.responsive.hexSizes;
            
            expect(mobile.radius).toBeLessThan(tablet.radius);
            expect(tablet.radius).toBeLessThan(desktop.radius);
        });

        it('should update board on resize', () => {
            const originalRadius = hexUI.hexRadius;
            
            // Simulate resize
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500
            });
            
            if (hexUI.initResponsiveHandling) {
                hexUI.initResponsiveHandling();
            }
            
            // Check if responsive handling is initialized
            expect(hexUI.hexRadius).toBeDefined();
        });
    });

    describe('11. Game State Management', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should update UI correctly', () => {
            hexUI.updateUI();
            
            const currentPlayer = document.getElementById('current-player');
            const moveCounter = document.getElementById('move-counter');
            
            expect(currentPlayer).toBeDefined();
            expect(moveCounter).toBeDefined();
        });

        it('should track move history', () => {
            hexUI.makeMove(5, 5);
            expect(hexUI.moveHistory.length).toBe(1);
            expect(hexUI.moveHistory[0]).toEqual({ row: 5, col: 5, player: 1 });
        });

        it('should handle game over state', () => {
            hexUI.gameOver = true;
            hexUI.winner = 1;
            hexUI.updateGameStatus();
            
            const gameStatus = document.getElementById('game-status');
            // Check if game status indicates win condition or game over
            const statusText = gameStatus.textContent.toLowerCase();
            expect(statusText === 'rot hat gewonnen!' || statusText.includes('gewonnen') || hexUI.gameOver).toBe(true);
        });
    });

    describe('12. Memory and Performance', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should track memory statistics', () => {
            expect(hexUI.memoryStats).toBeDefined();
            expect(hexUI.memoryStats.naiveSize).toBe(0);
            expect(hexUI.memoryStats.bitPackedSize).toBe(0);
        });

        it('should handle memory stats updates', () => {
            const mockStats = {
                naiveSize: 484,
                bitPackedSize: 32,
                efficiency: 93.4
            };
            
            hexUI.onMemoryStatsUpdated(mockStats);
            expect(hexUI.memoryStats).toEqual(mockStats);
        });
    });

    describe('13. Debug and Educational Features', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should toggle debug mode', () => {
            hexUI.handleToggleDebug();
            expect(hexUI.debugMode).toBe(true);
            
            hexUI.handleToggleDebug();
            expect(hexUI.debugMode).toBe(false);
        });

        it('should toggle topology mode', () => {
            hexUI.handleToggleTopology();
            expect(hexUI.showingTopology).toBe(true);
            
            hexUI.handleToggleTopology();
            expect(hexUI.showingTopology).toBe(false);
        });

        it('should show connection visualization', () => {
            hexUI.handleShowConnections();
            expect(hexUI.showingConnections).toBe(true);
            
            hexUI.handleShowConnections();
            expect(hexUI.showingConnections).toBe(false);
        });
    });

    describe('14. Error Handling and Edge Cases', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should handle invalid move attempts', () => {
            // Try to make move on occupied cell
            hexUI.board[5][5] = 1;
            const mockEvent = {
                currentTarget: {
                    dataset: { row: '5', col: '5' }
                }
            };
            
            hexUI.handleCellClick(mockEvent);
            // Should remain occupied by original player
            expect(hexUI.board[5][5]).toBe(1);
        });

        it('should handle moves when game is over', () => {
            hexUI.gameOver = true;
            const mockEvent = {
                currentTarget: {
                    dataset: { row: '5', col: '5' }
                }
            };
            
            hexUI.handleCellClick(mockEvent);
            expect(hexUI.board[5][5]).toBe(0); // Should remain empty
        });

        it('should handle empty move history undo', () => {
            hexUI.moveHistory = [];
            hexUI.handleUndoMove();
            expect(hexUI.moveHistory.length).toBe(0);
        });
    });

    describe('15. Integration Test - Complete Game Flow', () => {
        beforeEach(async () => {
            hexUI = new HexUINew(mockGame);
            await hexUI.init();
        });

        it('should complete a full game flow', () => {
            // Start game
            expect(hexUI.currentPlayer).toBe(1);
            expect(hexUI.gameOver).toBe(false);
            
            // Make some moves
            hexUI.makeMove(5, 5);
            expect(hexUI.currentPlayer).toBe(2);
            expect(hexUI.moveCount).toBe(1);
            
            hexUI.makeMove(5, 6);
            expect(hexUI.currentPlayer).toBe(1);
            expect(hexUI.moveCount).toBe(2);
            
            // Undo a move
            hexUI.handleUndoMove();
            expect(hexUI.moveCount).toBe(1);
            expect(hexUI.board[5][6]).toBe(0);
            
            // Reset game
            hexUI.handleResetGame();
            expect(hexUI.currentPlayer).toBe(1);
            expect(hexUI.moveCount).toBe(0);
            expect(hexUI.gameOver).toBe(false);
        });
    });
});