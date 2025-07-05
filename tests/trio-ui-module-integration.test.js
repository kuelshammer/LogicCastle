/**
 * Trio UI Module Integration Test
 * 
 * Tests the UI Module System integration for Trio WITHOUT browser dependencies.
 * This test validates that TrioUINew properly extends BaseGameUI and uses modules.
 */

import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Trio UI Module Integration - Lite', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Setup DOM environment that matches Trio minimal structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trio UI Module Integration Test</title>
      </head>
      <body>
        <div class="game-container">
          <div id="numberGrid" class="number-grid"></div>
          <div id="targetDisplay" class="target-display">
            <div id="targetNumber">42</div>
          </div>
          <div id="gameStatus">Ready</div>
          <button id="startGameBtn">Spiel starten</button>
          <button id="submitSolutionBtn">Lösung einreichen</button>
          <button id="clearSelectionBtn">Auswahl löschen</button>
          <div id="helpModal" class="modal"></div>
          <select id="gameMode">
            <option value="kinderfreundlich">Kinderfreundlich</option>
            <option value="vollspektrum">Vollspektrum</option>
          </select>
        </div>
      </body>
      </html>
    `, { 
      url: 'http://localhost:8000/games/trio/',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    // Setup global DOM environment
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;
    global.performance = dom.window.performance;
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
        <div id="numberGrid" class="number-grid"></div>
        <div id="targetDisplay" class="target-display">
          <div id="targetNumber">42</div>
        </div>
        <div id="gameStatus">Ready</div>
        <button id="startGameBtn">Spiel starten</button>
        <button id="submitSolutionBtn">Lösung einreichen</button>
        <button id="clearSelectionBtn">Auswahl löschen</button>
        <div id="helpModal" class="modal"></div>
        <select id="gameMode">
          <option value="kinderfreundlich">Kinderfreundlich</option>
          <option value="vollspektrum">Vollspektrum</option>
        </select>
      </div>
    `;
  });

  describe('Step 1: Import Structure', () => {
    test('should import Trio configuration successfully', async () => {
      const { TRIO_UI_CONFIG, createTrioConfig } = await import('../games/trio/js/trio-config.js');
      
      expect(TRIO_UI_CONFIG).toBeDefined();
      expect(createTrioConfig).toBeDefined();
      expect(typeof createTrioConfig).toBe('function');
      
      // Test configuration structure
      expect(TRIO_UI_CONFIG.elements).toBeDefined();
      expect(TRIO_UI_CONFIG.elements.required).toContain('numberGrid');
      expect(TRIO_UI_CONFIG.elements.required).toContain('targetDisplay');
      expect(TRIO_UI_CONFIG.elements.required).toContain('gameStatus');
      
      // Test modals configuration
      expect(TRIO_UI_CONFIG.modals.help).toBeDefined();
      expect(TRIO_UI_CONFIG.modals.help.id).toBe('helpModal');
      
      // Test keyboard configuration
      expect(TRIO_UI_CONFIG.keyboard['F1']).toBe('toggleHelp');
      expect(TRIO_UI_CONFIG.keyboard['Enter']).toBe('submitSolution');
    });

    test('should import UI Module System successfully', async () => {
      const { BaseGameUI, ElementBinder } = await import('../assets/js/ui-modules/index.js');
      
      expect(BaseGameUI).toBeDefined();
      expect(ElementBinder).toBeDefined();
      expect(typeof BaseGameUI).toBe('function');
      expect(typeof ElementBinder).toBe('function');
    });

    test('should import TrioUINew class successfully', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      expect(TrioUINew).toBeDefined();
      expect(typeof TrioUINew).toBe('function');
      expect(TrioUINew.name).toBe('TrioUINew');
    });
  });

  describe('Step 2: Class Structure Validation', () => {
    test('should validate TrioUINew extends BaseGameUI', async () => {
      const { BaseGameUI } = await import('../assets/js/ui-modules/index.js');
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      // Create mock game object
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn(),
        getCurrentTarget: vi.fn(() => 42) // Add missing method
      };
      
      const trioUI = new TrioUINew(mockGame);
      
      expect(trioUI).toBeInstanceOf(BaseGameUI);
      expect(trioUI).toBeInstanceOf(TrioUINew);
      
      // Check Trio-specific properties
      expect(trioUI.selectedPositions).toEqual([]);
      expect(trioUI.currentPlayerId).toBe('player1');
      expect(trioUI.gameMode).toBe('kinderfreundlich');
      expect(trioUI.totalChips).toBe(20);
      expect(trioUI.remainingChips).toBe(20);
    });

    test('should create dynamic configuration based on game mode', async () => {
      const { createTrioConfig } = await import('../games/trio/js/trio-config.js');
      
      const kinderConfig = createTrioConfig('kinderfreundlich');
      const vollspektrumConfig = createTrioConfig('vollspektrum');
      
      expect(kinderConfig.gameSettings.numberRange.max).toBe(50);
      expect(vollspektrumConfig.gameSettings.numberRange.max).toBe(90);
      
      expect(kinderConfig.gameSettings.aiDifficulty).toBe('easy');
      expect(vollspektrumConfig.gameSettings.aiDifficulty).toBe('medium');
    });
  });

  describe('Step 3: DOM Integration', () => {
    test('should bind required DOM elements successfully', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      // Create mock game
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn(),
        getCurrentTarget: vi.fn(() => 42)
      };
      
      const trioUI = new TrioUINew(mockGame);
      
      // Mock the BaseGameUI init to avoid async complexity
      trioUI.initializeCoreModules = vi.fn();
      trioUI.bindElements = vi.fn().mockResolvedValue();
      trioUI.setupModules = vi.fn().mockResolvedValue();
      trioUI.setupEvents = vi.fn().mockResolvedValue();
      trioUI.setupKeyboard = vi.fn().mockResolvedValue();
      
      // Test beforeInit
      await trioUI.beforeInit();
      expect(trioUI.config).toBeDefined();
      expect(trioUI.gameMode).toBe('kinderfreundlich');
      
      // Verify player was added
      expect(mockGame.addPlayer).toHaveBeenCalledWith('player1', 'Spieler 1');
    });

    test('should create number grid correctly', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn(),
        getCurrentTarget: vi.fn(() => 42)
      };
      
      const trioUI = new TrioUINew(mockGame);
      trioUI.elements = {
        numberGrid: document.getElementById('numberGrid')
      };
      
      // Test grid creation
      trioUI.createNumberGrid();
      
      const numberCells = document.querySelectorAll('.number-cell');
      expect(numberCells.length).toBe(49); // 7x7 grid
      
      // Check first cell structure
      const firstCell = numberCells[0];
      expect(firstCell.dataset.row).toBe('0');
      expect(firstCell.dataset.col).toBe('0');
      expect(firstCell.dataset.position).toBe('0,0');
      
      const numberSpan = firstCell.querySelector('.number-value');
      expect(numberSpan).toBeDefined();
      expect(numberSpan.textContent).toBe('0');
    });
  });

  describe('Step 4: Selection Logic', () => {
    test('should handle cell selection correctly', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn(),
        getCurrentTarget: vi.fn(() => 42)
      };
      
      const trioUI = new TrioUINew(mockGame);
      trioUI.elements = {
        numberGrid: document.getElementById('numberGrid'),
        selected1: document.createElement('span'),
        selected2: document.createElement('span'),
        selected3: document.createElement('span'),
        submitSolutionBtn: document.getElementById('submitSolutionBtn')
      };
      
      // Create grid and set game as active
      trioUI.createNumberGrid();
      trioUI.isGameActive = true;
      
      // Test selecting a cell
      trioUI.selectCell('3,4');
      
      expect(trioUI.selectedPositions).toContain('3,4');
      expect(trioUI.selectedPositions.length).toBe(1);
      
      // Test selecting maximum cells (3)
      trioUI.selectCell('1,2');
      trioUI.selectCell('5,6');
      
      expect(trioUI.selectedPositions.length).toBe(3);
      expect(trioUI.elements.submitSolutionBtn.disabled).toBe(false);
      
      // Test selecting 4th cell should not be allowed
      trioUI.selectCell('0,0');
      expect(trioUI.selectedPositions.length).toBe(3);
    });

    test('should clear selection correctly', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn(),
        getCurrentTarget: vi.fn(() => 42)
      };
      
      const trioUI = new TrioUINew(mockGame);
      trioUI.elements = {
        numberGrid: document.getElementById('numberGrid'),
        selected1: document.createElement('span'),
        selected2: document.createElement('span'),
        selected3: document.createElement('span'),
        submitSolutionBtn: document.getElementById('submitSolutionBtn')
      };
      
      // Setup initial state
      trioUI.createNumberGrid();
      trioUI.isGameActive = true;
      trioUI.selectedPositions = ['0,0', '1,1'];
      trioUI.selectedNumbers = [5, 10];
      
      // Clear selection
      trioUI.clearSelection();
      
      expect(trioUI.selectedPositions).toEqual([]);
      expect(trioUI.selectedNumbers).toEqual([]);
      expect(trioUI.elements.submitSolutionBtn.disabled).toBe(true);
    });
  });

  describe('Step 5: Configuration System', () => {
    test('should handle different game modes correctly', async () => {
      const { createTrioConfig } = await import('../games/trio/js/trio-config.js');
      
      const modes = ['kinderfreundlich', 'vollspektrum', 'strategisch', 'analytisch'];
      
      modes.forEach(mode => {
        const config = createTrioConfig(mode);
        
        expect(config.gameSettings.numberRange).toBeDefined();
        expect(config.gameSettings.numberRange.min).toBe(1);
        expect(config.gameSettings.aiDifficulty).toBeDefined();
        
        if (mode === 'kinderfreundlich') {
          expect(config.gameSettings.numberRange.max).toBe(50);
          expect(config.gameSettings.aiDifficulty).toBe('easy');
        } else {
          expect(config.gameSettings.numberRange.max).toBe(90);
        }
      });
    });

    test('should validate message system configuration', async () => {
      const { TRIO_UI_CONFIG } = await import('../games/trio/js/trio-config.js');
      
      expect(TRIO_UI_CONFIG.messages).toBeDefined();
      expect(TRIO_UI_CONFIG.messages.position).toBe('top-right');
      expect(TRIO_UI_CONFIG.messages.duration).toBe(3000);
      
      // Check message types
      expect(TRIO_UI_CONFIG.messages.types.chip).toBeDefined();
      expect(TRIO_UI_CONFIG.messages.types.chip.duration).toBe(4000);
      expect(TRIO_UI_CONFIG.messages.types.chip.icon).toBe('🏆');
    });
  });

  describe('Step 6: Error Handling', () => {
    test('should handle missing DOM elements gracefully', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      // Remove number grid
      document.getElementById('numberGrid')?.remove();
      
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn(),
        getCurrentTarget: vi.fn(() => 42)
      };
      
      const trioUI = new TrioUINew(mockGame);
      trioUI.elements = {};
      
      // Should not throw when numberGrid is missing
      expect(() => {
        trioUI.createNumberGrid();
      }).not.toThrow();
    });

    test('should handle game state transitions correctly', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => false), // Game not ready
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn()
      };
      
      const trioUI = new TrioUINew(mockGame);
      trioUI.showMessage = vi.fn(); // Mock message system
      
      // Test starting game when not ready
      trioUI.handleStartGame();
      
      expect(trioUI.showMessage).toHaveBeenCalledWith('Spiel noch nicht bereit!', 'error');
      expect(trioUI.isGameActive).toBe(false);
    });
  });

  describe('Performance Validation', () => {
    test('should create grid efficiently', async () => {
      const { TrioUINew } = await import('../games/trio/js/ui-new.js');
      
      const mockGame = {
        addPlayer: vi.fn(),
        isReady: vi.fn(() => true),
        on: vi.fn(),
        emit: vi.fn(),
        resetGame: vi.fn(),
        getCurrentTarget: vi.fn(() => 42)
      };
      
      const trioUI = new TrioUINew(mockGame);
      trioUI.elements = {
        numberGrid: document.getElementById('numberGrid')
      };
      
      const startTime = Date.now(); // Use Date.now() to avoid JSDOM performance issues
      trioUI.createNumberGrid();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
      expect(document.querySelectorAll('.number-cell').length).toBe(49);
    });
  });
});