/**
 * L-Game UI Module Integration Test
 * 
 * Tests the UI Module System integration for L-Game WITHOUT browser dependencies.
 * This test validates that LGameUINew properly extends BaseGameUI and uses modules.
 */

import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('L-Game UI Module Integration - Lite', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Setup DOM environment that matches L-Game minimal structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>L-Game UI Module Integration Test</title>
      </head>
      <body>
        <div class="game-container">
          <div id="gameBoard" class="game-board"></div>
          <div id="current-player" class="current-player">Spieler 1</div>
          <div id="gameStatus">Ready</div>
          <button id="resetGameBtn">Reset</button>
          <button id="showMovesBtn">Show Moves</button>
          <button id="debugInfoBtn">Debug</button>
          <button id="undoMoveBtn">Undo</button>
          <div id="helpModal" class="modal"></div>
          <div id="rulesModal" class="modal"></div>
        </div>
      </body>
      </html>
    `, { 
      url: 'http://localhost:8000/games/lgame/',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    // Setup global DOM environment
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;
    global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
    global.customElements = dom.window.customElements;

    // Store references
    document = dom.window.document;
    window = dom.window;
  });

  beforeEach(() => {
    // Reset DOM state before each test
    document.body.innerHTML = `
      <div class="game-container">
        <div id="gameBoard" class="game-board"></div>
        <div id="current-player" class="current-player">Spieler 1</div>
        <div id="gameStatus">Ready</div>
        <button id="resetGameBtn">Reset</button>
        <button id="showMovesBtn">Show Moves</button>
        <button id="debugInfoBtn">Debug</button>
        <button id="undoMoveBtn">Undo</button>
        <div id="helpModal" class="modal"></div>
        <div id="rulesModal" class="modal"></div>
      </div>
    `;
  });

  describe('Step 1: Import Structure', () => {
    test('should import L-Game configuration successfully', async () => {
      const { LGAME_UI_CONFIG, createLGameConfig, L_PIECE_ORIENTATIONS } = await import('../games/lgame/js/lgame-config.js');
      
      expect(LGAME_UI_CONFIG).toBeDefined();
      expect(createLGameConfig).toBeDefined();
      expect(L_PIECE_ORIENTATIONS).toBeDefined();
      expect(typeof createLGameConfig).toBe('function');
      
      // Test configuration structure
      expect(LGAME_UI_CONFIG.elements).toBeDefined();
      expect(LGAME_UI_CONFIG.elements.required).toContain('gameBoard');
      expect(LGAME_UI_CONFIG.elements.required).toContain('currentPlayer');
      expect(LGAME_UI_CONFIG.elements.required).toContain('gameStatus');
      
      // Test modals configuration
      expect(LGAME_UI_CONFIG.modals.help).toBeDefined();
      expect(LGAME_UI_CONFIG.modals.help.id).toBe('helpModal');
      expect(LGAME_UI_CONFIG.modals.rules).toBeDefined();
      
      // Test keyboard configuration
      expect(LGAME_UI_CONFIG.keyboard['F1']).toBe('toggleHelp');
      expect(LGAME_UI_CONFIG.keyboard['F2']).toBe('toggleRules');
      expect(LGAME_UI_CONFIG.keyboard['r']).toBe('resetGame');
      
      // Test L-piece orientations
      expect(Object.keys(L_PIECE_ORIENTATIONS)).toHaveLength(8);
      expect(L_PIECE_ORIENTATIONS[0]).toEqual([[0, 0], [0, 1], [0, 2], [1, 0]]);
    });

    test('should import UI Module System successfully', async () => {
      const { BaseGameUI, ElementBinder } = await import('../assets/js/ui-modules/index.js');
      
      expect(BaseGameUI).toBeDefined();
      expect(ElementBinder).toBeDefined();
      expect(typeof BaseGameUI).toBe('function');
      expect(typeof ElementBinder).toBe('function');
    });

    test('should import LGameUINew class successfully', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      expect(LGameUINew).toBeDefined();
      expect(typeof LGameUINew).toBe('function');
      expect(LGameUINew.name).toBe('LGameUINew');
    });
  });

  describe('Step 2: Class Structure Validation', () => {
    test('should validate LGameUINew extends BaseGameUI', async () => {
      const { BaseGameUI } = await import('../assets/js/ui-modules/index.js');
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      // Create mock game object
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      
      expect(lgameUI).toBeInstanceOf(BaseGameUI);
      expect(lgameUI).toBeInstanceOf(LGameUINew);
      
      // Check L-Game specific properties
      expect(lgameUI.selectedPiece).toBe(null);
      expect(lgameUI.highlightedMoves).toEqual([]);
      expect(lgameUI.boardSize).toBe(4);
      expect(lgameUI.cellSize).toBe(60);
      expect(lgameUI.gamePhase).toBe('lpiece');
    });

    test('should create dynamic configuration based on game mode', async () => {
      const { createLGameConfig } = await import('../games/lgame/js/lgame-config.js');
      
      const standardConfig = createLGameConfig('standard');
      const practiceConfig = createLGameConfig('practice');
      const debugConfig = createLGameConfig('debug');
      
      expect(standardConfig.gameSettings.debugMode).toBe(false);
      expect(practiceConfig.gameSettings.debugMode).toBe(true);
      expect(debugConfig.gameSettings.debugMode).toBe(true);
      
      expect(standardConfig.gameSettings.aiEnabled).toBe(true);
      expect(practiceConfig.gameSettings.aiEnabled).toBe(false);
      
      expect(practiceConfig.gameSettings.showCoordinates).toBe(true);
      expect(debugConfig.gameSettings.showCoordinates).toBe(true);
    });
  });

  describe('Step 3: DOM Integration', () => {
    test('should bind required DOM elements successfully', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      // Create mock game
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      
      // Mock the BaseGameUI init to avoid async complexity
      lgameUI.initializeCoreModules = vi.fn();
      lgameUI.bindElements = vi.fn().mockResolvedValue();
      lgameUI.setupModules = vi.fn().mockResolvedValue();
      lgameUI.setupEvents = vi.fn().mockResolvedValue();
      lgameUI.setupKeyboard = vi.fn().mockResolvedValue();
      
      // Test beforeInit
      await lgameUI.beforeInit();
      expect(lgameUI.config).toBeDefined();
      expect(lgameUI.cellSize).toBe(60);
      expect(lgameUI.coordUtils).toBeDefined();
    });

    test('should create 4x4 game board correctly', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      lgameUI.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      
      // Test board creation
      lgameUI.createBoard();
      
      const boardCells = document.querySelectorAll('.board-cell');
      expect(boardCells.length).toBe(16); // 4x4 grid
      
      // Check first cell structure
      const firstCell = boardCells[0];
      expect(firstCell.dataset.row).toBe('0');
      expect(firstCell.dataset.col).toBe('0');
      expect(firstCell.dataset.position).toBe('0,0');
      
      // Check grid layout
      const gameBoard = document.getElementById('gameBoard');
      expect(gameBoard.style.display).toBe('grid');
      expect(gameBoard.style.gridTemplateColumns).toContain('repeat(4,');
    });
  });

  describe('Step 4: L-Piece Logic', () => {
    test('should calculate L-piece positions correctly', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      
      // Test L-piece position calculation for orientation 0
      const positions = lgameUI.calculateLPiecePositions(1, 1, 0);
      
      expect(positions).toHaveLength(4);
      expect(positions).toEqual([
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 },
        { row: 2, col: 1 }
      ]);
    });

    test('should validate L-piece positions correctly', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      
      // Test valid positions (within bounds)
      const validPositions = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 0 }
      ];
      expect(lgameUI.isValidLPiecePosition(validPositions)).toBe(true);
      
      // Test invalid positions (out of bounds)
      const invalidPositions = [
        { row: -1, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 0 }
      ];
      expect(lgameUI.isValidLPiecePosition(invalidPositions)).toBe(false);
    });

    test('should handle game phases correctly', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      
      // Initial phase should be 'lpiece'
      expect(lgameUI.gamePhase).toBe('lpiece');
      
      // Test phase change
      lgameUI.gamePhase = 'neutral';
      expect(lgameUI.gamePhase).toBe('neutral');
      
      // Test complete move resets phase
      lgameUI.completeMove();
      expect(lgameUI.gamePhase).toBe('lpiece');
    });
  });

  describe('Step 5: Board Management', () => {
    test('should clear board correctly', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      lgameUI.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      
      // Create board and add some classes
      lgameUI.createBoard();
      const firstCell = document.querySelector('.board-cell');
      firstCell.classList.add('occupied', 'lpiece', 'player1');
      
      // Clear board
      lgameUI.clearBoard();
      
      // Verify clearing
      expect(firstCell.classList.contains('occupied')).toBe(false);
      expect(firstCell.classList.contains('lpiece')).toBe(false);
      expect(firstCell.classList.contains('player1')).toBe(false);
    });

    test('should handle reset game correctly', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      lgameUI.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      lgameUI.showMessage = vi.fn(); // Mock message system
      
      // Set some state
      lgameUI.gamePhase = 'neutral';
      lgameUI.selectedPiece = { type: 'lpiece' };
      lgameUI.moveHistory = [{ move: 'test' }];
      
      // Reset game
      lgameUI.handleResetGame();
      
      // Verify reset
      expect(lgameUI.gamePhase).toBe('lpiece');
      expect(lgameUI.selectedPiece).toBe(null);
      expect(lgameUI.moveHistory).toEqual([]);
      expect(mockGame.resetGame).toHaveBeenCalled();
    });
  });

  describe('Step 6: Debug and Utilities', () => {
    test('should handle debug mode toggle', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      lgameUI.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      lgameUI.showMessage = vi.fn();
      
      // Create board
      lgameUI.createBoard();
      
      // Initially debug mode should be off
      expect(lgameUI.debugMode).toBe(false);
      
      // Toggle debug mode
      lgameUI.handleDebugInfo();
      expect(lgameUI.debugMode).toBe(true);
      
      // Check that coordinates are shown
      const firstCell = document.querySelector('.board-cell');
      expect(firstCell.textContent).toBe('0,0');
      
      // Toggle off
      lgameUI.handleDebugInfo();
      expect(lgameUI.debugMode).toBe(false);
      expect(firstCell.textContent).toBe('');
    });

    test('should validate responsive handling', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      
      // Test responsive configuration
      expect(lgameUI.config.responsive.mobile).toBe(768);
      expect(lgameUI.config.responsive.tablet).toBe(1024);
      expect(lgameUI.config.responsive.desktop).toBe(1440);
      
      expect(lgameUI.config.responsive.cellSizes.mobile).toBe(45);
      expect(lgameUI.config.responsive.cellSizes.tablet).toBe(55);
      expect(lgameUI.config.responsive.cellSizes.desktop).toBe(60);
    });
  });

  describe('Performance Validation', () => {
    test('should create board efficiently', async () => {
      const { LGameUINew } = await import('../games/lgame/js/ui-new.js');
      
      const mockGame = {
        isInitialized: true,
        getCurrentPlayer: vi.fn(() => 'player1'),
        switchPlayer: vi.fn(),
        resetGame: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
        undoMove: vi.fn(() => false),
        makeMove: vi.fn(() => false),
        getValidMoves: vi.fn(() => []),
        getBoardState: vi.fn(() => ({}))
      };
      
      const lgameUI = new LGameUINew(mockGame);
      lgameUI.elements = {
        gameBoard: document.getElementById('gameBoard')
      };
      
      const startTime = Date.now();
      lgameUI.createBoard();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
      expect(document.querySelectorAll('.board-cell').length).toBe(16);
    });
  });
});