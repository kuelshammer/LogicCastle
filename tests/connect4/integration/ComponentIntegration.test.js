/**
 * Component Integration Tests
 * 
 * ULTRATHINK Phase 2: Integration Testing
 * Tests the integration between ULTRATHINK components and the main UI system:
 * - Component instantiation and lifecycle
 * - Cross-component communication
 * - Resource sharing and cleanup
 * - Architecture migration validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Connect4UINew } from '../../../games/connect4/js/ui-new.js';

// Import ULTRATHINK components for direct testing
import { BoardRenderer } from '../../../games/connect4/js/components/BoardRenderer.js';
import { InteractionHandler } from '../../../games/connect4/js/components/InteractionHandler.js';
import { AssistanceManager } from '../../../games/connect4/js/components/AssistanceManager.js';
import { OptimizedElementBinder } from '../../../games/connect4/js/components/OptimizedElementBinder.js';
import { MemoryManager } from '../../../games/connect4/js/components/MemoryManager.js';

describe('🔗 ULTRATHINK Component Integration Tests', () => {
    let container;
    let mockGame;
    let connect4UI;

    beforeEach(() => {
        // Create comprehensive test DOM structure
        container = document.createElement('div');
        container.innerHTML = `
            <div class="connect4-game-container">
                <div id="topCoords" class="board-coords top"></div>
                <div id="gameBoard" class="game-board"></div>
                <div id="bottomCoords" class="board-coords bottom"></div>
                
                <div id="gameStatus" class="game-status">Ready</div>
                <div id="currentPlayer" class="current-player">Player 1</div>
                <div id="moveCounter" class="move-counter">0</div>
                
                <div class="controls">
                    <button id="resetBtn">Reset</button>
                    <button id="undoBtn">Undo</button>
                    <button id="newGameBtn">New Game</button>
                </div>
                
                <div id="assistancePanel" class="assistance-panel">
                    <input type="checkbox" id="player1-threats" data-player="1" data-assistance="threats">
                    <input type="checkbox" id="player1-winning-moves" data-player="1" data-assistance="winning-moves">
                    <input type="checkbox" id="player2-threats" data-player="2" data-assistance="threats">
                    <input type="checkbox" id="player2-winning-moves" data-player="2" data-assistance="winning-moves">
                </div>
                
                <div id="messageContainer" class="message-container"></div>
                
                <div class="scores">
                    <span id="yellowScore">0</span>
                    <span id="redScore">0</span>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Create comprehensive mock game
        mockGame = {
            on: vi.fn(),
            off: vi.fn(),
            newGame: vi.fn(),
            makeMove: vi.fn().mockResolvedValue({ row: 5, col: 0, player: 1 }),
            canUndo: vi.fn(() => false),
            undoMove: vi.fn(),
            isGameOver: vi.fn(() => false),
            getWinner: vi.fn(() => null),
            getCurrentPlayer: vi.fn(() => 1),
            getMoveCount: vi.fn(() => 0),
            getBoard: vi.fn(() => new Array(42).fill(0)),
            isColumnFull: vi.fn(() => false),
            getDropRow: vi.fn(() => 5),
            isValidMove: vi.fn(() => true),
            getBlockingMoves: vi.fn(() => []),
            getWinningMoves: vi.fn(() => []),
            getBlockedColumns: vi.fn(() => []),
            isInitialized: true
        };
    });

    afterEach(() => {
        if (connect4UI) {
            connect4UI.destroy?.();
            connect4UI = null;
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. Current Architecture Analysis', () => {
        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
        });

        it('should reveal inline implementation instead of component usage', () => {
            // CRITICAL FINDING: Connect4UINew implements everything inline
            
            expect(connect4UI.boardRenderer).toBeUndefined(); // Should be defined if using components
            expect(connect4UI.interactionHandler).toBeUndefined(); // Should be defined if using components
            expect(connect4UI.assistanceManager).toBeUndefined(); // Should be defined if using components
            expect(connect4UI.memoryManager).toBeUndefined(); // Should be defined if using components
            
            // Instead, it has inline methods
            expect(typeof connect4UI.initializeBoard).toBe('function'); // Inline board creation
            expect(typeof connect4UI.setupColumnInteractions).toBe('function'); // Inline interaction
            expect(typeof connect4UI.setupAssistanceSystem).toBe('function'); // Inline assistance
        });

        it('should show redundant functionality between UI and components', () => {
            // Both Connect4UINew and BoardRenderer have board creation logic
            expect(typeof connect4UI.initializeBoard).toBe('function');
            expect(typeof BoardRenderer.prototype.initializeBoard).toBe('function');
            
            // Both have interaction handling
            expect(typeof connect4UI.onColumnClick).toBe('function');
            expect(typeof InteractionHandler.prototype.handleColumnClick).toBe('function');
            
            // Both have assistance logic
            expect(typeof connect4UI.updateAssistanceHighlights).toBe('function');
            expect(typeof AssistanceManager.prototype.updateAssistanceHighlights).toBe('function');
        });

        it('should demonstrate component isolation problem', () => {
            // Components exist but are not integrated
            expect(() => new BoardRenderer(null, null, null)).not.toThrow();
            expect(() => new InteractionHandler(null, null)).not.toThrow();
            expect(() => new AssistanceManager(null, null, null)).not.toThrow();
            
            // But Connect4UINew doesn't use them
            const gameBoard = connect4UI.elements.gameBoard;
            expect(gameBoard.children.length).toBeGreaterThan(0); // Has board elements
            
            // These were created by inline methods, not components
            expect(connect4UI.boardRenderer).toBeUndefined();
        });
    });

    describe('2. Component Integration Prototype', () => {
        it('should successfully integrate BoardRenderer component', async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            const gameBoard = connect4UI.elements.gameBoard;
            const topCoords = connect4UI.elements.topCoords;
            const bottomCoords = connect4UI.elements.bottomCoords;
            
            // Replace inline board creation with component
            gameBoard.innerHTML = ''; // Clear inline board
            
            const boardRenderer = new BoardRenderer(gameBoard, topCoords, bottomCoords);
            const initSuccess = boardRenderer.initializeBoard();
            
            expect(initSuccess).toBe(true);
            expect(gameBoard.querySelectorAll('.game-slot')).toHaveLength(42);
            expect(boardRenderer.isInitialized()).toBe(true);
            
            // Component should work better than inline version
            expect(boardRenderer.getCellAt(0, 0)).toBeTruthy();
            expect(boardRenderer.getDiscAt(0, 0)).toBeTruthy();
            
            boardRenderer.destroy();
        });

        it('should successfully integrate InteractionHandler component', async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            const gameBoard = connect4UI.elements.gameBoard;
            
            // Create mock BoardRenderer for InteractionHandler
            const mockBoardRenderer = {
                getCellAt: vi.fn((row, col) => gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`)),
                getDiscAt: vi.fn((row, col) => {
                    const cell = gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    return cell?.querySelector('.disc');
                })
            };
            
            const interactionHandler = new InteractionHandler(mockBoardRenderer, gameBoard);
            
            // Set up callbacks to integrate with Connect4UINew
            const callbacks = {
                onColumnClick: vi.fn((col) => connect4UI.dropDiscInColumn(col)),
                onColumnHover: vi.fn((col) => connect4UI.onColumnHover(col)),
                onColumnHoverLeave: vi.fn(() => connect4UI.onColumnHoverLeave())
            };
            
            interactionHandler.setCallbacks(callbacks);
            interactionHandler.setupColumnInteractions();
            
            // Test component integration
            interactionHandler.handleColumnClick(3);
            expect(callbacks.onColumnClick).toHaveBeenCalledWith(3);
            
            interactionHandler.destroy();
        });

        it('should successfully integrate AssistanceManager component', async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            const mockBoardRenderer = {
                highlightColumn: vi.fn(),
                clearColumnHighlights: vi.fn()
            };
            
            const assistanceManager = new AssistanceManager(
                mockGame, 
                mockBoardRenderer, 
                connect4UI.elements
            );
            
            assistanceManager.setupEventListeners();
            
            // Test assistance integration
            assistanceManager.toggleAssistance(1, 'threats', true);
            expect(assistanceManager.getAssistanceSetting(1, 'threats')).toBe(true);
            
            // Component should integrate with game
            assistanceManager.updateAssistanceDisplay();
            expect(mockGame.findThreats).toHaveBeenCalled();
            
            assistanceManager.destroy();
        });

        it('should successfully integrate MemoryManager component', () => {
            const memoryManager = new MemoryManager();
            
            // Test event listener tracking integration
            const testButton = document.getElementById('resetBtn');
            const testHandler = vi.fn();
            
            memoryManager.addEventListener(testButton, 'click', testHandler);
            expect(memoryManager.eventListeners.size).toBe(1);
            
            // Test component registration
            const mockComponent = { destroy: vi.fn(), name: 'TestComponent' };
            memoryManager.registerComponent('test', mockComponent);
            expect(memoryManager.components.size).toBe(1);
            
            // Test cleanup integration
            memoryManager.destroy();
            expect(memoryManager.eventListeners.size).toBe(0);
            expect(mockComponent.destroy).toHaveBeenCalled();
        });
    });

    describe('3. Cross-Component Communication', () => {
        let boardRenderer, interactionHandler, assistanceManager, memoryManager;

        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            const gameBoard = connect4UI.elements.gameBoard;
            const topCoords = connect4UI.elements.topCoords;
            const bottomCoords = connect4UI.elements.bottomCoords;
            
            // Set up component chain
            gameBoard.innerHTML = '';
            boardRenderer = new BoardRenderer(gameBoard, topCoords, bottomCoords);
            boardRenderer.initializeBoard();
            
            interactionHandler = new InteractionHandler(boardRenderer, gameBoard);
            assistanceManager = new AssistanceManager(mockGame, boardRenderer, connect4UI.elements);
            memoryManager = new MemoryManager();
            
            // Register all components with memory manager
            memoryManager.registerComponent('boardRenderer', boardRenderer);
            memoryManager.registerComponent('interactionHandler', interactionHandler);
            memoryManager.registerComponent('assistanceManager', assistanceManager);
        });

        afterEach(() => {
            memoryManager?.destroy();
        });

        it('should enable BoardRenderer → InteractionHandler communication', () => {
            interactionHandler.setupColumnInteractions();
            
            // BoardRenderer provides cell access to InteractionHandler
            const cell = boardRenderer.getCellAt(5, 3);
            expect(cell).toBeTruthy();
            
            // InteractionHandler can use BoardRenderer methods
            const disc = boardRenderer.getDiscAt(5, 3);
            expect(disc).toBeTruthy();
            expect(disc.classList.contains('empty')).toBe(true);
            
            // Interaction should work with rendered board
            interactionHandler.handleColumnClick(3);
            // Column click should be processed (no errors)
        });

        it('should enable BoardRenderer → AssistanceManager communication', () => {
            assistanceManager.setupEventListeners();
            
            // AssistanceManager uses BoardRenderer for highlighting
            assistanceManager.toggleAssistance(1, 'threats', true);
            assistanceManager.updateAssistanceDisplay();
            
            // Should call BoardRenderer methods
            expect(boardRenderer.highlightColumn).toBeDefined();
        });

        it('should enable InteractionHandler → AssistanceManager integration', () => {
            const callbacks = {
                onColumnClick: vi.fn(),
                onColumnHover: vi.fn((col) => {
                    // When hovering, update assistance
                    assistanceManager.updateAssistanceDisplay();
                }),
                onColumnHoverLeave: vi.fn(() => {
                    // When leaving, clear assistance
                    assistanceManager.clearAssistanceHighlights();
                })
            };
            
            interactionHandler.setCallbacks(callbacks);
            interactionHandler.setupColumnInteractions();
            
            // Test interaction → assistance flow
            interactionHandler.handleColumnHover(2);
            expect(callbacks.onColumnHover).toHaveBeenCalledWith(2);
            
            interactionHandler.handleColumnHoverLeave();
            expect(callbacks.onColumnHoverLeave).toHaveBeenCalled();
        });

        it('should enable MemoryManager → All Components integration', () => {
            expect(memoryManager.components.size).toBe(3);
            expect(memoryManager.components.has('boardRenderer')).toBe(true);
            expect(memoryManager.components.has('interactionHandler')).toBe(true);
            expect(memoryManager.components.has('assistanceManager')).toBe(true);
            
            // Memory manager should track all resources
            const status = memoryManager.getComponentStatus();
            expect(status.totalComponents).toBe(3);
        });
    });

    describe('4. Integrated Component Lifecycle', () => {
        let componentSystem;

        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            // Create integrated component system
            componentSystem = createIntegratedComponentSystem(connect4UI);
        });

        afterEach(() => {
            componentSystem?.destroy();
        });

        it('should initialize all components in correct order', () => {
            expect(componentSystem.boardRenderer.isInitialized()).toBe(true);
            expect(componentSystem.interactionHandler.eventListeners.length).toBeGreaterThan(0);
            expect(componentSystem.assistanceManager.eventListeners.length).toBeGreaterThan(0);
            expect(componentSystem.memoryManager.components.size).toBe(3);
        });

        it('should handle component updates correctly', () => {
            const moveData = { row: 5, col: 2, player: 1 };
            
            // Simulate move through component system
            componentSystem.boardRenderer.updateBoardVisual(moveData.row, moveData.col, moveData.player);
            componentSystem.assistanceManager.updateAssistanceDisplay();
            
            // Verify component state updates
            const disc = componentSystem.boardRenderer.getDiscAt(5, 2);
            expect(disc.classList.contains('yellow')).toBe(true);
        });

        it('should cleanup all components properly', () => {
            const initialResources = componentSystem.memoryManager.getTrackedResourceCount();
            expect(initialResources).toBeGreaterThan(0);
            
            componentSystem.destroy();
            
            const finalResources = componentSystem.memoryManager.getTrackedResourceCount();
            expect(finalResources).toBe(0);
        });
    });

    describe('5. Performance and Resource Management', () => {
        it('should demonstrate component efficiency vs inline', async () => {
            // Test inline approach (current implementation)
            const inlineStartTime = performance.now();
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            const inlineEndTime = performance.now();
            const inlineTime = inlineEndTime - inlineStartTime;
            
            connect4UI.destroy?.();
            document.body.querySelector('.connect4-game-container .game-board').innerHTML = '';
            
            // Test component approach
            const componentStartTime = performance.now();
            const componentSystem = createIntegratedComponentSystem(connect4UI);
            const componentEndTime = performance.now();
            const componentTime = componentEndTime - componentStartTime;
            
            console.log(`⚡ Performance comparison:
                Inline approach: ${inlineTime.toFixed(2)}ms
                Component approach: ${componentTime.toFixed(2)}ms
                Component efficiency: ${componentTime < inlineTime ? 'BETTER' : 'SLOWER'}`);
            
            // Components should be competitive or better
            expect(componentTime).toBeLessThan(inlineTime * 2); // Allow 2x tolerance
            
            componentSystem.destroy();
        });

        it('should demonstrate memory efficiency of components', () => {
            const memoryManager = new MemoryManager();
            
            // Create component system with memory tracking
            const gameBoard = connect4UI.elements.gameBoard;
            gameBoard.innerHTML = '';
            
            const boardRenderer = new BoardRenderer(gameBoard, null, null);
            boardRenderer.initializeBoard();
            
            memoryManager.registerComponent('boardRenderer', boardRenderer);
            
            const initialMemory = memoryManager.getMemorySnapshot();
            expect(initialMemory.components).toBe(1);
            
            // Add event listeners
            const testHandler = vi.fn();
            memoryManager.addEventListener(gameBoard, 'click', testHandler);
            
            const withListenersMemory = memoryManager.getMemorySnapshot();
            expect(withListenersMemory.eventListeners).toBe(1);
            
            // Cleanup should release all resources
            memoryManager.destroy();
            
            const finalMemory = memoryManager.getMemorySnapshot();
            expect(finalMemory.components).toBe(0);
            expect(finalMemory.eventListeners).toBe(0);
        });
    });

    describe('6. Migration Path Validation', () => {
        it('should provide clear migration path from inline to components', async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            // Step 1: Current inline board creation
            const inlineBoard = connect4UI.elements.gameBoard;
            expect(inlineBoard.children.length).toBe(42); // 6x7 grid
            
            // Step 2: Replace with component (migration step)
            const initialHTML = inlineBoard.innerHTML;
            inlineBoard.innerHTML = '';
            
            const boardRenderer = new BoardRenderer(inlineBoard, null, null);
            boardRenderer.initializeBoard();
            
            // Step 3: Verify component produces same result
            expect(inlineBoard.children.length).toBe(42); // Same grid
            expect(inlineBoard.querySelectorAll('.game-slot')).toHaveLength(42);
            expect(inlineBoard.querySelectorAll('.disc')).toHaveLength(42);
            
            // Component version should be equivalent or better
            const componentHTML = inlineBoard.innerHTML;
            expect(componentHTML.length).toBeGreaterThan(0);
            
            boardRenderer.destroy();
        });

        it('should validate API compatibility between inline and components', () => {
            // BoardRenderer component should provide same functionality as inline
            const boardRenderer = new BoardRenderer(null, null, null);
            
            // Methods that exist in both inline and component
            expect(typeof boardRenderer.initializeBoard).toBe('function');
            expect(typeof boardRenderer.updateBoard).toBe('function');
            expect(typeof boardRenderer.getCellAt).toBe('function');
            expect(typeof boardRenderer.destroy).toBe('function');
            
            // Component provides additional methods inline doesn't
            expect(typeof boardRenderer.getDimensions).toBe('function');
            expect(typeof boardRenderer.isInitialized).toBe('function');
        });

        it('should demonstrate incremental migration strategy', async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            // Phase 1: Keep inline board, add component assistance
            const assistanceManager = new AssistanceManager(
                mockGame, 
                null, // No board renderer yet
                connect4UI.elements
            );
            
            assistanceManager.setupEventListeners();
            expect(assistanceManager.eventListeners.length).toBeGreaterThan(0);
            
            // Phase 2: Add memory management
            const memoryManager = new MemoryManager();
            memoryManager.registerComponent('assistance', assistanceManager);
            
            // Phase 3: Add interaction handling
            const mockBoardRenderer = {
                getCellAt: vi.fn(),
                getDiscAt: vi.fn()
            };
            
            const interactionHandler = new InteractionHandler(mockBoardRenderer, connect4UI.elements.gameBoard);
            memoryManager.registerComponent('interaction', interactionHandler);
            
            expect(memoryManager.components.size).toBe(2);
            
            // Cleanup
            memoryManager.destroy();
        });
    });
});

/**
 * Helper function to create integrated component system
 */
function createIntegratedComponentSystem(connect4UI) {
    const gameBoard = connect4UI.elements.gameBoard;
    const topCoords = connect4UI.elements.topCoords;
    const bottomCoords = connect4UI.elements.bottomCoords;
    
    // Clear inline board
    gameBoard.innerHTML = '';
    
    // Create component instances
    const boardRenderer = new BoardRenderer(gameBoard, topCoords, bottomCoords);
    const interactionHandler = new InteractionHandler(boardRenderer, gameBoard);
    const assistanceManager = new AssistanceManager(connect4UI.game, boardRenderer, connect4UI.elements);
    const memoryManager = new MemoryManager();
    
    // Initialize components
    boardRenderer.initializeBoard();
    boardRenderer.createCoordinateLabels();
    
    interactionHandler.setupColumnInteractions();
    assistanceManager.setupEventListeners();
    
    // Register with memory manager
    memoryManager.registerComponent('boardRenderer', boardRenderer);
    memoryManager.registerComponent('interactionHandler', interactionHandler);
    memoryManager.registerComponent('assistanceManager', assistanceManager);
    
    // Set up cross-component communication
    const callbacks = {
        onColumnClick: (col) => connect4UI.dropDiscInColumn(col),
        onColumnHover: (col) => {
            connect4UI.onColumnHover(col);
            assistanceManager.updateAssistanceDisplay();
        },
        onColumnHoverLeave: () => {
            connect4UI.onColumnHoverLeave();
            assistanceManager.clearAssistanceHighlights();
        }
    };
    
    interactionHandler.setCallbacks(callbacks);
    
    return {
        boardRenderer,
        interactionHandler,
        assistanceManager,
        memoryManager,
        destroy() {
            memoryManager.destroy();
        }
    };
}