/**
 * Gomoku Import Chain Lite Test
 * 
 * Tests the import pipeline WITHOUT WASM dependencies.
 * This test will catch breaking changes in the module import structure early
 * and can run in CI/CD environments without WASM support.
 * 
 * Tests:
 * 1. UI Module System Import
 * 2. Module Structure Validation  
 * 3. Class Constructor Testing
 * 4. DOM Integration
 * 5. Error Handling
 */

import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Gomoku Import Chain - Lite (No WASM)', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Setup DOM environment that matches Gomoku minimal structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gomoku Import Chain Lite Test</title>
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
  });

  describe('Step 1: Module Import Structure', () => {
    test('should import CoordUtils successfully', async () => {
      const coordUtils = await import('../assets/js/coord-utils.js');
      
      expect(coordUtils.CoordUtils).toBeDefined();
      expect(coordUtils.CoordUtils.gridToIndex).toBeInstanceOf(Function);
      expect(coordUtils.CoordUtils.indexToGrid).toBeInstanceOf(Function);
      expect(coordUtils.CoordUtils.validateCoords).toBeInstanceOf(Function);
    });

    test('should import UI-Module System successfully', async () => {
      const uiModules = await import('../assets/js/ui-modules/index.js');
      
      expect(uiModules.BaseGameUI).toBeDefined();
      expect(uiModules.ElementBinder).toBeDefined();
      expect(uiModules.KeyboardController).toBeDefined();
      expect(uiModules.ModalManager).toBeDefined();
      expect(uiModules.MessageSystem).toBeDefined();
      expect(uiModules.VERSION).toBeDefined();
      expect(uiModules.BUILD_DATE).toBeDefined();
    });

    test('should import Gomoku Config successfully', async () => {
      const configModule = await import('../games/gomoku/js/gomoku-config.js');
      
      expect(configModule.GOMOKU_UI_CONFIG).toBeDefined();
      expect(configModule.createGomokuConfig).toBeInstanceOf(Function);
      
      // Test config structure
      const config = configModule.GOMOKU_UI_CONFIG;
      expect(config.elements).toBeDefined();
      expect(config.keyboard).toBeDefined();
      expect(config.modals).toBeDefined();
    });
  });

  describe('Step 2: Class Structure Validation', () => {
    test('should import and validate BaseGameUI class', async () => {
      const { BaseGameUI } = await import('../assets/js/ui-modules/index.js');
      
      // Test class can be instantiated
      const mockGame = { 
        BOARD_SIZE: 15, 
        on: vi.fn(), 
        emit: vi.fn(),
        getCurrentPlayer: vi.fn(() => 1),
        makeMove: vi.fn()
      };
      
      const ui = new BaseGameUI(mockGame, {
        elements: {
          gameBoard: '#gameBoard',
          gameStatus: '#gameStatus',
          currentPlayerIndicator: '#currentPlayerIndicator'
        }
      });
      
      expect(ui).toBeDefined();
      expect(ui.game).toBe(mockGame);
      expect(ui.config).toBeDefined();
      expect(ui.elements).toBeDefined();
      expect(ui.modules).toBeDefined();
      expect(ui.init).toBeInstanceOf(Function);
    });

    test('should import and validate GomokuUINew class structure', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      // Test class structure without full initialization
      const mockGame = { 
        BOARD_SIZE: 15, 
        on: vi.fn(), 
        emit: vi.fn(),
        getCurrentPlayer: vi.fn(() => 1),
        isEmpty: vi.fn(() => true)
      };
      
      const ui = new GomokuUINew(mockGame);
      
      expect(ui).toBeDefined();
      expect(ui.game).toBe(mockGame);
      expect(ui.createBoard).toBeInstanceOf(Function);
      expect(ui.onIntersectionClick).toBeInstanceOf(Function);
      expect(ui.positionStoneOnBoard).toBeInstanceOf(Function);
      expect(ui.cursor).toBeDefined();
      expect(ui.selectionState).toBeDefined();
    });
  });

  describe('Step 3: DOM Integration', () => {
    test('should create game board successfully', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { 
        BOARD_SIZE: 15,
        on: vi.fn(),
        emit: vi.fn(),
        getCurrentPlayer: vi.fn(() => 1),
        isEmpty: vi.fn(() => true)
      };
      
      const ui = new GomokuUINew(mockGame);
      
      // Set up required elements
      ui.elements = {
        gameBoard: document.getElementById('gameBoard'),
        gameStatus: document.getElementById('gameStatus'),
        currentPlayerIndicator: document.getElementById('currentPlayerIndicator')
      };
      
      // Test board creation
      expect(() => ui.createBoard()).not.toThrow();
      
      // Verify board was created
      const intersections = document.querySelectorAll('.intersection');
      expect(intersections.length).toBe(225); // 15x15 board
      
      // Test intersection structure
      const firstIntersection = intersections[0];
      expect(firstIntersection.dataset.row).toBe('0');
      expect(firstIntersection.dataset.col).toBe('0');
      
      const centerIntersection = document.querySelector('[data-row="7"][data-col="7"]');
      expect(centerIntersection).toBeDefined();
      
      const lastIntersection = intersections[224];
      expect(lastIntersection.dataset.row).toBe('14');
      expect(lastIntersection.dataset.col).toBe('14');
    });

    test('should handle click events on intersections', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { 
        BOARD_SIZE: 15,
        on: vi.fn(),
        emit: vi.fn(),
        getCurrentPlayer: vi.fn(() => 1),
        isEmpty: vi.fn(() => true),
        gameOver: false
      };
      
      const ui = new GomokuUINew(mockGame);
      
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
        // Don't call original to avoid WASM dependencies
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

  describe('Step 4: Stone Placement Calculations', () => {
    test('should validate stone positioning calculations', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { 
        BOARD_SIZE: 15,
        on: vi.fn(),
        emit: vi.fn()
      };
      
      const ui = new GomokuUINew(mockGame);
      
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

    test('should calculate correct positions for corner and edge cases', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { BOARD_SIZE: 15, on: vi.fn(), emit: vi.fn() };
      const ui = new GomokuUINew(mockGame);
      
      ui.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      
      ui.elements.gameBoard.getBoundingClientRect = () => ({
        width: 400, height: 400, left: 0, top: 0
      });
      
      // Test corner positions
      const topLeftStone = document.createElement('div');
      ui.positionStoneOnBoard(0, 0, topLeftStone);
      
      const bottomRightStone = document.createElement('div');
      ui.positionStoneOnBoard(14, 14, bottomRightStone);
      
      // Top-left should be at padding position
      const padding = 400 * 0.0513; // ~20.52
      expect(parseFloat(topLeftStone.style.left)).toBeCloseTo(padding, 1);
      expect(parseFloat(topLeftStone.style.top)).toBeCloseTo(padding, 1);
      
      // Bottom-right should be at board size - padding
      const expectedBottomRight = 400 - padding;
      expect(parseFloat(bottomRightStone.style.left)).toBeCloseTo(expectedBottomRight, 1);
      expect(parseFloat(bottomRightStone.style.top)).toBeCloseTo(expectedBottomRight, 1);
    });
  });

  describe('Step 5: Error Handling', () => {
    test('should handle missing DOM elements gracefully', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { BOARD_SIZE: 15, on: vi.fn(), emit: vi.fn() };
      const ui = new GomokuUINew(mockGame);
      
      // Test with missing gameBoard element
      ui.elements = {};
      
      expect(() => ui.createBoard()).toThrow();
    });

    test('should provide clear error messages on import failures', async () => {
      // Test non-existent module import
      await expect(import('../non-existent-module.js')).rejects.toThrow();
    });

    test('should handle invalid stone positioning gracefully', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { BOARD_SIZE: 15, on: vi.fn(), emit: vi.fn() };
      const ui = new GomokuUINew(mockGame);
      
      ui.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      
      ui.elements.gameBoard.getBoundingClientRect = () => ({
        width: 400, height: 400, left: 0, top: 0
      });
      
      const stone = document.createElement('div');
      
      // Test with invalid coordinates (should not throw)
      expect(() => ui.positionStoneOnBoard(-1, -1, stone)).not.toThrow();
      expect(() => ui.positionStoneOnBoard(15, 15, stone)).not.toThrow();
    });
  });

  describe('Step 6: Performance Validation', () => {
    test('should complete board creation under performance threshold', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { BOARD_SIZE: 15, on: vi.fn(), emit: vi.fn() };
      const ui = new GomokuUINew(mockGame);
      
      ui.elements = {
        gameBoard: document.getElementById('gameBoard'),
        gameStatus: document.getElementById('gameStatus'),
        currentPlayerIndicator: document.getElementById('currentPlayerIndicator')
      };
      
      const start = Date.now();
      ui.createBoard();
      const end = Date.now();
      
      const duration = end - start;
      
      // Board creation should be fast (under 50ms)
      expect(duration).toBeLessThan(50);
      expect(document.querySelectorAll('.intersection').length).toBe(225);
    });

    test('should handle multiple stone positioning calculations efficiently', async () => {
      const { GomokuUINew } = await import('../games/gomoku/js/ui-new.js');
      
      const mockGame = { BOARD_SIZE: 15, on: vi.fn(), emit: vi.fn() };
      const ui = new GomokuUINew(mockGame);
      
      ui.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      
      ui.elements.gameBoard.getBoundingClientRect = () => ({
        width: 400, height: 400, left: 0, top: 0
      });
      
      const start = Date.now();
      
      // Position 100 stones
      for (let i = 0; i < 100; i++) {
        const stone = document.createElement('div');
        const row = i % 15;
        const col = Math.floor(i / 15) % 15;
        ui.positionStoneOnBoard(row, col, stone);
      }
      
      const end = Date.now();
      const duration = end - start;
      
      // 100 stone calculations should be very fast (under 10ms)
      expect(duration).toBeLessThan(10);
    });
  });
});

describe('Import Chain Monitoring', () => {
  test('should detect breaking changes in module exports', async () => {
    // This test verifies that expected exports still exist
    // If this fails, it indicates a breaking change in the module structure
    
    const modules = [
      {
        path: '../assets/js/ui-modules/index.js',
        expectedExports: ['BaseGameUI', 'ElementBinder', 'KeyboardController', 'ModalManager', 'VERSION']
      },
      {
        path: '../assets/js/coord-utils.js',
        expectedExports: ['CoordUtils']
      },
      {
        path: '../games/gomoku/js/gomoku-config.js',
        expectedExports: ['GOMOKU_UI_CONFIG', 'createGomokuConfig']
      }
    ];
    
    for (const moduleInfo of modules) {
      const module = await import(moduleInfo.path);
      
      for (const expectedExport of moduleInfo.expectedExports) {
        expect(module[expectedExport]).toBeDefined();
      }
    }
  });
  
  test('should maintain config structure compatibility', async () => {
    const { GOMOKU_UI_CONFIG } = await import('../games/gomoku/js/gomoku-config.js');
    
    // Verify config has expected structure
    expect(GOMOKU_UI_CONFIG.elements).toBeDefined();
    expect(GOMOKU_UI_CONFIG.keyboard).toBeDefined();
    expect(GOMOKU_UI_CONFIG.modals).toBeDefined();
    
    // Verify specific required elements are listed
    expect(GOMOKU_UI_CONFIG.elements.required).toContain('gameBoard');
    expect(GOMOKU_UI_CONFIG.elements.required).toContain('gameStatus');
    expect(GOMOKU_UI_CONFIG.elements.required).toContain('currentPlayerIndicator');
  });
});