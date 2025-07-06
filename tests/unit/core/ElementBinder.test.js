/**
 * ElementBinder Unit Tests
 * 
 * Tests for the ElementBinder utility that handles DOM element binding
 * and management for the UI-Module System.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ElementBinder } from '@ui-modules/core/ElementBinder.js';
import { TestUtils } from '../../setup.js';

describe('ElementBinder Core Tests', () => {
  let dom;
  let elementBinder;

  beforeEach(() => {
    // Set up DOM environment with various elements
    dom = TestUtils.createTestDOM(`
      <div id="container">
        <div id="gameBoard" class="board">Game Board</div>
        <div id="gameStatus" data-testid="status">Ready</div>
        <button id="btn1" class="game-btn">Button 1</button>
        <button id="btn2" class="game-btn">Button 2</button>
        <input id="input1" type="text" value="test">
        <select id="select1">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
        
        <!-- Modal elements -->
        <div id="helpModal" class="modal">
          <span id="closeHelp" class="close">&times;</span>
        </div>
        
        <!-- Control elements -->
        <button id="newGameBtn" class="control-btn">New Game</button>
        <button id="undoBtn" class="control-btn">Undo</button>
        <button id="helpBtn" class="control-btn">Help</button>
        
        <!-- Nested elements -->
        <div class="nested-container">
          <div id="nested1">Nested 1</div>
          <div id="nested2">Nested 2</div>
        </div>
        
        <!-- Elements with special characters -->
        <div id="element-with-dashes">Dashed Element</div>
        <div id="element_with_underscores">Underscore Element</div>
        
        <!-- Hidden elements -->
        <div id="hiddenElement" style="display: none;">Hidden</div>
      </div>
    `);

    // elementBinder will be created in each test with specific config
  });

  afterEach(() => {
    TestUtils.cleanupDOM(dom);
    vi.clearAllMocks();
  });

  describe('1. Basic Element Binding', () => {
    it('should bind single element and retrieve it', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: []
      });
      
      await elementBinder.bindElements();
      const element = elementBinder.getElement('gameBoard');
      
      expect(element).toBeTruthy();
      expect(element.id).toBe('gameBoard');
      expect(element.textContent).toBe('Game Board');
    });

    it('should return null for non-existent element', async () => {
      elementBinder = new ElementBinder({
        required: [],
        optional: ['nonExistentElement'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      const element = elementBinder.getElement('nonExistentElement');
      
      expect(element).toBe(null);
    });

    it('should handle empty configuration', async () => {
      elementBinder = new ElementBinder({
        required: [],
        optional: []
      });
      
      await elementBinder.bindElements();
      expect(elementBinder.getAllElements()).toEqual({});
    });

    it('should bind element with special characters in ID', async () => {
      elementBinder = new ElementBinder({
        required: ['element-with-dashes', 'element_with_underscores'],
        optional: []
      });
      
      await elementBinder.bindElements();
      const dashedElement = elementBinder.getElement('element-with-dashes');
      const underscoreElement = elementBinder.getElement('element_with_underscores');
      
      expect(dashedElement).toBeTruthy();
      expect(underscoreElement).toBeTruthy();
      expect(dashedElement.id).toBe('element-with-dashes');
      expect(underscoreElement.id).toBe('element_with_underscores');
    });

    it('should bind hidden elements', async () => {
      elementBinder = new ElementBinder({
        required: ['hiddenElement'],
        optional: []
      });
      
      await elementBinder.bindElements();
      const hiddenElement = elementBinder.getElement('hiddenElement');
      
      expect(hiddenElement).toBeTruthy();
      expect(hiddenElement.style.display).toBe('none');
    });
  });

  describe('2. Multiple Element Binding', () => {
    it('should bind multiple elements with configuration', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1']
      });
      
      await elementBinder.bindElements();
      const elements = elementBinder.getAllElements();
      
      expect(elements.gameBoard).toBeTruthy();
      expect(elements.gameStatus).toBeTruthy();
      expect(elements.btn1).toBeTruthy();
    });

    it('should handle mix of existing and non-existing elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      const elements = elementBinder.getAllElements();
      
      expect(elements.gameBoard).toBeTruthy();
      expect(elements.nonExistent).toBe(null);
      expect(elements.gameStatus).toBeTruthy();
    });

    it('should return empty object for empty configuration', async () => {
      elementBinder = new ElementBinder({
        required: [],
        optional: []
      });
      
      await elementBinder.bindElements();
      const elements = elementBinder.getAllElements();
      
      expect(elements).toEqual({});
    });

    it('should get only successfully bound elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      const boundElements = elementBinder.getBoundElements();
      
      expect(boundElements.gameBoard).toBeTruthy();
      expect(boundElements.nonExistent).toBeUndefined();
    });

    it('should check if element exists', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.hasElement('gameBoard')).toBe(true);
      expect(elementBinder.hasElement('nonExistent')).toBe(false);
    });
  });

  describe('3. Configuration and Validation', () => {
    it('should properly validate required elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1', 'btn2', 'nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.getElement('gameBoard')).toBeTruthy();
      expect(elementBinder.getElement('gameStatus')).toBeTruthy();
      expect(elementBinder.getElement('btn1')).toBeTruthy();
      expect(elementBinder.getElement('btn2')).toBeTruthy();
      expect(elementBinder.getElement('nonExistent')).toBe(null);
      
      expect(elementBinder.getMissingElements()).toEqual([]);
      expect(elementBinder.allRequiredElementsBound()).toBe(true);
    });

    it('should handle configuration without optional elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus']
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.getElement('gameBoard')).toBeTruthy();
      expect(elementBinder.getElement('gameStatus')).toBeTruthy();
      expect(elementBinder.allRequiredElementsBound()).toBe(true);
    });

    it('should handle configuration without required elements', async () => {
      elementBinder = new ElementBinder({
        optional: ['btn1', 'btn2']
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.getElement('btn1')).toBeTruthy();
      expect(elementBinder.getElement('btn2')).toBeTruthy();
      expect(elementBinder.allRequiredElementsBound()).toBe(true);
    });

    it('should handle empty configuration', async () => {
      elementBinder = new ElementBinder({});
      
      await elementBinder.bindElements();
      
      expect(elementBinder.getAllElements()).toEqual({});
      expect(elementBinder.allRequiredElementsBound()).toBe(true);
    });

    it('should detect missing required elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'nonExistentRequired'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.getMissingElements()).toEqual(['nonExistentRequired']);
      expect(elementBinder.allRequiredElementsBound()).toBe(false);
    });
  });

  describe('4. Dynamic Element Management', () => {
    it('should add elements dynamically', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard']
      });
      
      await elementBinder.bindElements();
      
      elementBinder.addElement('btn1', false);
      
      expect(elementBinder.getElement('btn1')).toBeTruthy();
      expect(elementBinder.hasElement('btn1')).toBe(true);
    });

    it('should remove elements dynamically', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['btn1']
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.hasElement('btn1')).toBe(true);
      
      elementBinder.removeElement('btn1');
      
      expect(elementBinder.getElement('btn1')).toBe(null);
    });

    it('should rebind elements after DOM changes', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard']
      });
      
      await elementBinder.bindElements();
      
      // Simulate DOM change
      const newElement = document.createElement('div');
      newElement.id = 'dynamicElement';
      document.body.appendChild(newElement);
      
      elementBinder.addElement('dynamicElement', false);
      
      expect(elementBinder.getElement('dynamicElement')).toBeTruthy();
      expect(elementBinder.getElement('dynamicElement').id).toBe('dynamicElement');
    });

    it('should rebind existing elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard']
      });
      
      await elementBinder.bindElements();
      
      // Remove element from DOM
      const gameBoard = document.getElementById('gameBoard');
      gameBoard.remove();
      
      // Add it back
      const newGameBoard = document.createElement('div');
      newGameBoard.id = 'gameBoard';
      newGameBoard.textContent = 'New Game Board';
      document.body.appendChild(newGameBoard);
      
      elementBinder.rebindElement('gameBoard', true);
      
      expect(elementBinder.getElement('gameBoard')).toBeTruthy();
      expect(elementBinder.getElement('gameBoard').textContent).toBe('New Game Board');
    });
  });

  describe('5. Element Validation and UI Structure', () => {
    it('should validate game UI structure', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['newGameBtn']
      });
      
      await elementBinder.bindElements();
      
      const validation = elementBinder.validateGameUIStructure();
      
      expect(validation.hasGameBoard).toBe(true);
      expect(validation.hasGameStatus).toBe(true);
      expect(validation.hasControls).toBe(true); // newGameBtn is in controlElements list
      expect(validation.warnings).toBeInstanceOf(Array);
    });

    it('should check element existence after binding', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.hasElement('gameBoard')).toBe(true);
      expect(elementBinder.hasElement('nonExistent')).toBe(false);
    });

    it('should calculate success rate', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1', 'nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      const successRate = elementBinder.calculateSuccessRate();
      
      expect(successRate).toBeGreaterThan(0);
      expect(successRate).toBeLessThanOrEqual(100);
    });

    it('should generate binding report', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['btn1', 'nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      const report = elementBinder.generateReport();
      
      expect(report).toHaveProperty('config');
      expect(report).toHaveProperty('boundElements');
      expect(report).toHaveProperty('missingElements');
      expect(report).toHaveProperty('totalElements');
      expect(report).toHaveProperty('successRate');
      expect(report).toHaveProperty('validationPassed');
    });

    it('should provide safe element accessors', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['btn1']
      });
      
      await elementBinder.bindElements();
      
      const accessors = elementBinder.createSafeAccessors();
      
      expect(accessors.gameBoard).toBeInstanceOf(Function);
      expect(accessors.gameBoardExists).toBeInstanceOf(Function);
      expect(accessors.gameBoardSafe).toBeInstanceOf(Function);
      
      expect(accessors.gameBoard()).toBeTruthy();
      expect(accessors.gameBoardExists()).toBe(true);
      
      let callbackExecuted = false;
      accessors.gameBoardSafe((element) => {
        callbackExecuted = true;
        expect(element).toBeTruthy();
      });
      expect(callbackExecuted).toBe(true);
    });
  });

  describe('6. Element Collections and Access', () => {
    it('should get all bound elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1', 'btn2']
      });
      
      await elementBinder.bindElements();
      const allElements = elementBinder.getAllElements();
      
      expect(allElements).toHaveProperty('gameBoard');
      expect(allElements).toHaveProperty('gameStatus');
      expect(allElements).toHaveProperty('btn1');
      expect(allElements).toHaveProperty('btn2');
    });

    it('should get only successfully bound elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['btn1', 'nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      const boundElements = elementBinder.getBoundElements();
      
      expect(boundElements).toHaveProperty('gameBoard');
      expect(boundElements).toHaveProperty('btn1');
      expect(boundElements).not.toHaveProperty('nonExistent');
    });

    it('should distinguish between required and optional elements', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['btn1']
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.allRequiredElementsBound()).toBe(true);
      expect(elementBinder.getMissingElements()).toEqual([]);
    });

    it('should handle missing required elements appropriately', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'nonExistentRequired'],
        optional: ['btn1'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.allRequiredElementsBound()).toBe(false);
      expect(elementBinder.getMissingElements()).toEqual(['nonExistentRequired']);
    });
  });

  describe('7. Configuration Management', () => {
    it('should handle different configuration options', () => {
      const config = {
        required: ['gameBoard'],
        optional: ['btn1'],
        validateOnBind: true,
        throwOnMissing: false
      };
      
      elementBinder = new ElementBinder(config);
      
      expect(elementBinder.config.required).toEqual(['gameBoard']);
      expect(elementBinder.config.optional).toEqual(['btn1']);
      expect(elementBinder.config.validateOnBind).toBe(true);
      expect(elementBinder.config.throwOnMissing).toBe(false);
    });

    it('should use default configuration when none provided', () => {
      elementBinder = new ElementBinder();
      
      expect(elementBinder.config.required).toEqual([]);
      expect(elementBinder.config.optional).toEqual([]);
      expect(elementBinder.config.validateOnBind).toBe(true);
      expect(elementBinder.config.throwOnMissing).toBe(true);
    });

    it('should merge partial configuration with defaults', () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        validateOnBind: false
      });
      
      expect(elementBinder.config.required).toEqual(['gameBoard']);
      expect(elementBinder.config.optional).toEqual([]);
      expect(elementBinder.config.validateOnBind).toBe(false);
      expect(elementBinder.config.throwOnMissing).toBe(true);
    });

    it('should handle configuration validation', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        validateOnBind: true,
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.allRequiredElementsBound()).toBe(true);
    });
  });

  describe('8. Error Handling and Validation', () => {
    it('should handle missing required elements gracefully when throwOnMissing is false', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'nonExistentRequired'],
        throwOnMissing: false
      });
      
      await expect(elementBinder.bindElements()).resolves.not.toThrow();
      
      expect(elementBinder.getMissingElements()).toContain('nonExistentRequired');
      expect(elementBinder.allRequiredElementsBound()).toBe(false);
    });

    it('should throw error for missing required elements when throwOnMissing is true', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'nonExistentRequired'],
        throwOnMissing: true
      });
      
      await expect(elementBinder.bindElements()).rejects.toThrow('Missing required DOM elements');
    });

    it('should validate bindings when validateOnBind is true', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        validateOnBind: true,
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(elementBinder.allRequiredElementsBound()).toBe(true);
    });

    it('should skip validation when validateOnBind is false', async () => {
      elementBinder = new ElementBinder({
        required: ['nonExistentRequired'],
        validateOnBind: false,
        throwOnMissing: false
      });
      
      await expect(elementBinder.bindElements()).resolves.not.toThrow();
    });
  });

  describe('9. Advanced Features', () => {
    it('should report binding results', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['btn1', 'nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(consoleSpy).toHaveBeenCalledWith('📊 Element Binding Results:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Bound:'));
      
      consoleSpy.mockRestore();
    });

    it('should handle null/undefined element operations safely', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard'],
        optional: ['nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(() => {
        elementBinder.getElement('nonExistent');
        elementBinder.hasElement('nonExistent');
        elementBinder.removeElement('nonExistent');
      }).not.toThrow();
    });

    it('should provide comprehensive binding statistics', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1', 'nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      const report = elementBinder.generateReport();
      
      expect(report.totalElements).toBe(4);
      expect(report.boundElements).toContain('gameBoard');
      expect(report.boundElements).toContain('gameStatus');
      expect(report.boundElements).toContain('btn1');
      expect(report.successRate).toBeGreaterThan(0);
    });
  });

  describe('10. Performance and Efficiency', () => {
    it('should bind multiple elements efficiently', async () => {
      const start = performance.now();
      
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1', 'btn2', 'input1', 'select1']
      });
      
      await elementBinder.bindElements();
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should be reasonably fast
      expect(elementBinder.calculateSuccessRate()).toBeGreaterThan(80);
    });

    it('should handle large element configurations efficiently', async () => {
      const largeConfig = {
        required: ['gameBoard'],
        optional: []
      };
      
      // Add many optional elements
      for (let i = 0; i < 50; i++) {
        largeConfig.optional.push(`element${i}`);
      }
      
      elementBinder = new ElementBinder(largeConfig);
      
      const start = performance.now();
      await elementBinder.bindElements();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(200); // Should still be reasonably fast
    });

    it('should provide efficient element access', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1', 'btn2']
      });
      
      await elementBinder.bindElements();
      
      const start = performance.now();
      
      // Multiple accesses should be fast
      for (let i = 0; i < 100; i++) {
        elementBinder.getElement('gameBoard');
        elementBinder.hasElement('gameStatus');
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50); // Should be very fast
    });
  });

  describe('11. Debug and Development Support', () => {
    it('should provide detailed binding information', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['btn1', 'nonExistent'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      const report = elementBinder.generateReport();
      
      expect(report).toHaveProperty('config');
      expect(report).toHaveProperty('boundElements');
      expect(report).toHaveProperty('missingElements');
      expect(report).toHaveProperty('totalElements');
      expect(report).toHaveProperty('successRate');
      expect(report).toHaveProperty('validationPassed');
      
      expect(report.totalElements).toBe(4);
      expect(report.boundElements).toContain('gameBoard');
      expect(report.boundElements).toContain('gameStatus');
      expect(report.boundElements).toContain('btn1');
      expect(report.missingElements).toEqual([]);
    });

    it('should validate UI structure for common patterns', async () => {
      elementBinder = new ElementBinder({
        required: ['gameBoard', 'gameStatus'],
        optional: ['newGameBtn', 'helpModal']
      });
      
      await elementBinder.bindElements();
      
      const validation = elementBinder.validateGameUIStructure();
      
      expect(validation).toHaveProperty('hasGameBoard');
      expect(validation).toHaveProperty('hasGameStatus');
      expect(validation).toHaveProperty('hasControls');
      expect(validation).toHaveProperty('hasModals');
      expect(validation).toHaveProperty('warnings');
      
      expect(validation.hasGameBoard).toBe(true);
      expect(validation.hasGameStatus).toBe(true);
      expect(validation.warnings).toBeInstanceOf(Array);
    });

    it('should provide development-friendly error messages', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      elementBinder = new ElementBinder({
        required: ['nonExistentRequired'],
        throwOnMissing: false
      });
      
      await elementBinder.bindElements();
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Required element missing: nonExistentRequired');
      
      consoleSpy.mockRestore();
    });
  });
});