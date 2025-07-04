/**
 * Gomoku Import Chain Integration Test
 * 
 * Tests the complete import and initialization pipeline for Gomoku:
 * 1. WASM Module Import
 * 2. Game Classes Import  
 * 3. UI Module System Import
 * 4. Full Initialization Chain
 * 5. Mouse Event Pipeline
 * 6. Stone Placement Chain
 * 
 * This test will catch breaking changes in the import pipeline early.
 */

import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Gomoku Complete Import Chain', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Setup DOM environment that matches Gomoku minimal structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gomoku Import Chain Test</title>
      </head>
      <body>
        <div class="minimal-game-container">
          <div class="game-board-container">
            <div id="gameStatus" style="display: none;">Ready</div>
            <div id="currentPlayerIndicator" style="display: none;">
              <span class="player-indicator">
                <span class="player-stone black"></span>
                Black to move
              </span>
            </div>
            <div class="game-board" id="gameBoard"></div>
          </div>
        </div>
      </body>
      </html>
    `, {
      url: 'http://localhost:8000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.performance = window.performance;
  });

  beforeEach(() => {
    // Clear any previous test state
    document.getElementById('gameBoard').innerHTML = '';
    delete window.game;
    delete window.ui;
    delete window.WasmGame;
    delete window.WasmPlayer;
  });

  describe('Step 1: WASM Module Import', () => {
    test('should import WASM module successfully', async () => {
      const wasmModule = await import('../game_engine/pkg/game_engine.js');
      
      expect(wasmModule).toBeDefined();
      expect(wasmModule.default).toBeInstanceOf(Function); // WASM init function
      expect(wasmModule.Game).toBeDefined();
      expect(wasmModule.Player).toBeDefined();
      expect(wasmModule.GomokuBoard).toBeDefined();

      // Initialize WASM
      await wasmModule.default();
      
      // Test WASM classes work
      const game = new wasmModule.Game(15, 15, 5, false);
      expect(game).toBeDefined();
      expect(game.get_board().length).toBe(225);
    });
  });

  describe('Step 2: Game Classes Import', () => {
    test('should import GomokuGame class successfully', async () => {
      // First import WASM (dependency)
      const wasmModule = await import('../game_engine/pkg/game_engine.js');
      await wasmModule.default();
      
      // Then import game class
      const gameModule = await import('../games/gomoku/js/game_v2.js');
      
      expect(gameModule.GomokuGame).toBeDefined();
      
      // Test game creation
      const game = new gameModule.GomokuGame();
      expect(game).toBeDefined();
      expect(game.BOARD_SIZE).toBe(15);
      expect(game.init).toBeInstanceOf(Function);
      expect(game.makeMove).toBeInstanceOf(Function);
    });
  });

  describe('Step 3: UI Module System Import', () => {
    test('should import UI-Module System successfully', async () => {
      const uiModules = await import('../assets/js/ui-modules/index.js');
      
      expect(uiModules.BaseGameUI).toBeDefined();
      expect(uiModules.ElementBinder).toBeDefined();
      expect(uiModules.KeyboardController).toBeDefined();
      expect(uiModules.ModalManager).toBeDefined();
      expect(uiModules.VERSION).toBeDefined();
    });

    test('should import GomokuUINew successfully', async () => {
      // Import dependencies first
      await import('../assets/js/ui-modules/index.js');
      
      const uiModule = await import('../games/gomoku/js/ui-new.js');
      
      expect(uiModule.GomokuUINew).toBeDefined();
      
      // Test UI class structure
      const mockGame = { BOARD_SIZE: 15, on: () => {}, emit: () => {} };
      const ui = new uiModule.GomokuUINew(mockGame);
      
      expect(ui).toBeDefined();
      expect(ui.game).toBe(mockGame);
      expect(ui.init).toBeInstanceOf(Function);
      expect(ui.createBoard).toBeInstanceOf(Function);
    });
  });

  describe('Step 4: Full Initialization Chain', () => {
    test('should complete full WASM + Game + UI initialization', async () => {
      // 1. Import WASM
      const wasmModule = await import('../game_engine/pkg/game_engine.js');
      await wasmModule.default();
      
      // 2. Import and initialize Game
      const gameModule = await import('../games/gomoku/js/game_v2.js');
      const game = new gameModule.GomokuGame();
      await game.init();
      
      expect(game.isInitialized).toBe(true);
      expect(game.wasmGame).toBeDefined();
      
      // 3. Import and initialize UI
      const uiModule = await import('../games/gomoku/js/ui-new.js');
      const ui = new uiModule.GomokuUINew(game);
      
      // Mock missing elements for test environment
      ui.elements = {
        gameBoard: document.getElementById('gameBoard'),
        gameStatus: document.getElementById('gameStatus'),
        currentPlayerIndicator: document.getElementById('currentPlayerIndicator')
      };
      
      // Test board creation (core UI functionality)
      expect(() => ui.createBoard()).not.toThrow();
      
      // Verify board was created
      const intersections = document.querySelectorAll('.intersection');
      expect(intersections.length).toBe(225); // 15x15 board
      
      // Test intersection structure
      const firstIntersection = intersections[0];
      expect(firstIntersection.dataset.row).toBe('0');
      expect(firstIntersection.dataset.col).toBe('0');
      
      const lastIntersection = intersections[224];
      expect(lastIntersection.dataset.row).toBe('14');
      expect(lastIntersection.dataset.col).toBe('14');
    });
  });

  describe('Step 5: Mouse Event Pipeline', () => {
    test('should handle click events on intersections', async () => {
      // Setup complete chain
      const wasmModule = await import('../game_engine/pkg/game_engine.js');
      await wasmModule.default();
      
      const gameModule = await import('../games/gomoku/js/game_v2.js');
      const game = new gameModule.GomokuGame();
      await game.init();
      
      const uiModule = await import('../games/gomoku/js/ui-new.js');
      const ui = new uiModule.GomokuUINew(game);
      
      // Mock required elements
      ui.elements = {
        gameBoard: document.getElementById('gameBoard'),
        gameStatus: document.getElementById('gameStatus'),
        currentPlayerIndicator: document.getElementById('currentPlayerIndicator')
      };
      
      // Create board
      ui.createBoard();
      
      // Test click event handling
      let clickHandled = false;
      let clickRow = null;
      let clickCol = null;
      
      // Mock the click handler to capture calls
      const originalHandler = ui.onIntersectionClick;
      ui.onIntersectionClick = (row, col) => {
        clickHandled = true;
        clickRow = row;
        clickCol = col;
        return originalHandler.call(ui, row, col);
      };
      
      // Find center intersection and simulate click
      const centerIntersection = document.querySelector('[data-row="7"][data-col="7"]');
      expect(centerIntersection).toBeDefined();
      
      // Simulate click event
      centerIntersection.click();
      
      expect(clickHandled).toBe(true);
      expect(clickRow).toBe(7);
      expect(clickCol).toBe(7);
    });
  });

  describe('Step 6: Stone Placement Validation', () => {
    test('should validate stone positioning calculations', async () => {
      // Setup UI system
      const wasmModule = await import('../game_engine/pkg/game_engine.js');
      await wasmModule.default();
      
      const gameModule = await import('../games/gomoku/js/game_v2.js');
      const game = new gameModule.GomokuGame();
      await game.init();
      
      const uiModule = await import('../games/gomoku/js/ui-new.js');
      const ui = new uiModule.GomokuUINew(game);
      
      ui.elements = {
        gameBoard: document.getElementById('gameBoard'),
        gameStatus: document.getElementById('gameStatus'),
        currentPlayerIndicator: document.getElementById('currentPlayerIndicator')
      };
      
      // Mock getBoundingClientRect for deterministic testing
      const mockRect = {
        width: 400,
        height: 400,
        left: 0,
        top: 0
      };
      ui.elements.gameBoard.getBoundingClientRect = () => mockRect;
      
      // Test positionStoneOnBoard calculation
      const stone = document.createElement('div');
      stone.className = 'stone black';
      
      // Test center position (7,7)
      ui.positionStoneOnBoard(7, 7, stone);
      
      // Expected calculation:
      // boardWidth = 400, padding = 400 * 0.0513 = 20.52
      // gridWidth = 400 - (2 * 20.52) = 358.96
      // step = 358.96 / 14 = 25.64
      // pixelX = 20.52 + (7 * 25.64) = 200
      // pixelY = 20.52 + (7 * 25.64) = 200
      
      expect(stone.style.position).toBe('absolute');
      expect(stone.style.transform).toBe('translate(-50%, -50%)');
      
      // Parse pixel values (allowing for floating point precision)
      const leftValue = parseFloat(stone.style.left);
      const topValue = parseFloat(stone.style.top);
      
      expect(leftValue).toBeCloseTo(200, 1); // Center of 400px board
      expect(topValue).toBeCloseTo(200, 1);
    });
  });

  describe('Step 7: Event Chain Integration', () => {
    test('should validate complete game event chain', async () => {
      // Setup complete system
      const wasmModule = await import('../game_engine/pkg/game_engine.js');
      await wasmModule.default();
      
      const gameModule = await import('../games/gomoku/js/game_v2.js');
      const game = new gameModule.GomokuGame();
      await game.init();
      
      const uiModule = await import('../games/gomoku/js/ui-new.js');
      const ui = new uiModule.GomokuUINew(game);
      
      ui.elements = {
        gameBoard: document.getElementById('gameBoard'),
        gameStatus: document.getElementById('gameStatus'),
        currentPlayerIndicator: document.getElementById('currentPlayerIndicator')
      };
      
      // Track events through the chain
      const events = [];
      
      // Mock event emissions
      const originalEmit = game.emit;
      game.emit = (event, data) => {
        events.push({ event, data });
        return originalEmit.call(game, event, data);
      };
      
      // Test that makeMove triggers events
      const validMove = game.makeMove(7, 7);
      
      // Should have emitted events during move
      expect(events.length).toBeGreaterThan(0);
      
      // Check for critical events
      const moveEvents = events.filter(e => e.event === 'moveMade' || e.event === 'move');
      expect(moveEvents.length).toBeGreaterThan(0);
      
      if (moveEvents.length > 0) {
        const moveEvent = moveEvents[0];
        expect(moveEvent.data).toBeDefined();
        expect(moveEvent.data.row).toBe(7);
        expect(moveEvent.data.col).toBe(7);
      }
    });
  });

  describe('Error Handling and Debugging', () => {
    test('should provide clear error messages on import failures', async () => {
      // Test non-existent module import
      await expect(import('../non-existent-module.js')).rejects.toThrow();
    });

    test('should handle missing DOM elements gracefully', async () => {
      const uiModule = await import('../games/gomoku/js/ui-new.js');
      const mockGame = { BOARD_SIZE: 15, on: () => {}, emit: () => {} };
      const ui = new uiModule.GomokuUINew(mockGame);
      
      // Test with missing gameBoard element
      ui.elements = {};
      
      expect(() => ui.createBoard()).toThrow();
    });
  });
});

describe('Performance and Regression Tests', () => {
  test('should complete full import chain under performance threshold', async () => {
    const start = performance.now();
    
    // Full chain import
    const wasmModule = await import('../game_engine/pkg/game_engine.js');
    await wasmModule.default();
    
    const gameModule = await import('../games/gomoku/js/game_v2.js');
    const game = new gameModule.GomokuGame();
    await game.init();
    
    const uiModule = await import('../games/gomoku/js/ui-new.js');
    const ui = new uiModule.GomokuUINew(game);
    
    const end = performance.now();
    const duration = end - start;
    
    // Should complete full chain in under 2000ms (generous threshold)
    expect(duration).toBeLessThan(2000);
  });
  
  test('should maintain import chain stability across test runs', async () => {
    // Run import chain multiple times to test for stability
    for (let i = 0; i < 3; i++) {
      const wasmModule = await import('../game_engine/pkg/game_engine.js');
      await wasmModule.default();
      
      expect(wasmModule.Game).toBeDefined();
      expect(wasmModule.Player).toBeDefined();
    }
  });
});