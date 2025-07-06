/**
 * KeyboardController Unit Tests
 * 
 * Tests for the KeyboardController component that handles keyboard shortcuts
 * and key bindings in the UI-Module System.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyboardController } from '@ui-modules/components/KeyboardController.js';
import { TestUtils } from '../../setup.js';

describe('KeyboardController Core Tests', () => {
  let dom;
  let keyboardController;
  let keyboardConfig;
  let mockCallbacks;

  beforeEach(() => {
    // Set up DOM environment
    dom = TestUtils.createTestDOM(`
      <div id="gameBoard" tabindex="0">Game Board</div>
      <input id="textInput" type="text" />
      <textarea id="textArea"></textarea>
      <button id="testButton">Test Button</button>
    `);

    // Mock callback functions
    mockCallbacks = {
      newGame: vi.fn(),
      showHelp: vi.fn(),
      togglePause: vi.fn(),
      undoMove: vi.fn(),
      resetGame: vi.fn(),
      customAction: vi.fn()
    };

    keyboardConfig = {
      'r': 'newGame',
      'F1': 'showHelp',
      'Space': 'togglePause',
      'ctrl+z': 'undoMove',
      'ctrl+r': 'resetGame',
      'Escape': 'customAction',
      'ArrowUp': 'customAction',
      'ArrowDown': 'customAction',
      'ArrowLeft': 'customAction',
      'ArrowRight': 'customAction'
    };
  });

  afterEach(() => {
    if (keyboardController) {
      keyboardController.destroy?.();
      keyboardController = null;
    }
    TestUtils.cleanupDOM(dom);
    vi.clearAllMocks();
  });

  describe('1. Initialization and Setup', () => {
    it('should create KeyboardController instance with configuration', () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      
      expect(keyboardController).toBeInstanceOf(KeyboardController);
      expect(keyboardController.shortcuts).toBeDefined();
      expect(keyboardController.callbacks).toBeDefined();
      expect(keyboardController.isInitialized).toBe(false);
    });

    it('should initialize successfully', async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
      
      expect(keyboardController.isInitialized).toBe(true);
      expect(keyboardController.getRegisteredShortcuts()).toContain('r');
      expect(keyboardController.getRegisteredShortcuts()).toContain('F1');
      expect(keyboardController.getRegisteredShortcuts()).toContain('ctrl+z');
    });

    it('should handle initialization with empty configuration', async () => {
      keyboardController = new KeyboardController({}, {});
      await keyboardController.init();
      
      expect(keyboardController.isInitialized).toBe(true);
      expect(keyboardController.getRegisteredShortcuts()).toEqual([]);
    });

    it('should handle missing callbacks gracefully', async () => {
      keyboardController = new KeyboardController(keyboardConfig, {});
      
      await expect(keyboardController.init()).resolves.not.toThrow();
      expect(keyboardController.isInitialized).toBe(true);
    });
  });

  describe('2. Keyboard Event Handling', () => {
    beforeEach(async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should handle simple key presses', () => {
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).toHaveBeenCalledTimes(1);
      
      TestUtils.simulateKeyEvent(document, 'F1', 'keydown');
      expect(mockCallbacks.showHelp).toHaveBeenCalledTimes(1);
    });

    it('should handle key combinations with modifiers', () => {
      TestUtils.simulateKeyEvent(document, 'z', 'keydown', { ctrlKey: true });
      expect(mockCallbacks.undoMove).toHaveBeenCalledTimes(1);
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown', { ctrlKey: true });
      expect(mockCallbacks.resetGame).toHaveBeenCalledTimes(1);
    });

    it('should handle special keys', () => {
      TestUtils.simulateKeyEvent(document, 'Escape', 'keydown');
      expect(mockCallbacks.customAction).toHaveBeenCalledTimes(1);
      
      TestUtils.simulateKeyEvent(document, ' ', 'keydown'); // Space
      expect(mockCallbacks.togglePause).toHaveBeenCalledTimes(1);
    });

    it('should handle arrow keys', () => {
      TestUtils.simulateKeyEvent(document, 'ArrowUp', 'keydown');
      TestUtils.simulateKeyEvent(document, 'ArrowDown', 'keydown');
      TestUtils.simulateKeyEvent(document, 'ArrowLeft', 'keydown');
      TestUtils.simulateKeyEvent(document, 'ArrowRight', 'keydown');
      
      expect(mockCallbacks.customAction).toHaveBeenCalledTimes(4);
    });

    it('should ignore unregistered keys', () => {
      TestUtils.simulateKeyEvent(document, 'q', 'keydown');
      TestUtils.simulateKeyEvent(document, 'F2', 'keydown');
      
      // No callbacks should be called
      Object.values(mockCallbacks).forEach(callback => {
        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('3. Input Field Handling', () => {
    beforeEach(async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should ignore shortcuts when typing in text inputs', () => {
      const textInput = document.getElementById('textInput');
      textInput.focus();
      
      TestUtils.simulateKeyEvent(textInput, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
    });

    it('should ignore shortcuts when typing in textareas', () => {
      const textArea = document.getElementById('textArea');
      textArea.focus();
      
      TestUtils.simulateKeyEvent(textArea, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
    });

    it('should allow certain shortcuts in input fields when configured', () => {
      keyboardController.setAllowInInputs(['Escape', 'F1']);
      
      const textInput = document.getElementById('textInput');
      textInput.focus();
      
      TestUtils.simulateKeyEvent(textInput, 'Escape', 'keydown');
      expect(mockCallbacks.customAction).toHaveBeenCalledTimes(1);
      
      TestUtils.simulateKeyEvent(textInput, 'F1', 'keydown');
      expect(mockCallbacks.showHelp).toHaveBeenCalledTimes(1);
      
      TestUtils.simulateKeyEvent(textInput, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
    });

    it('should handle contenteditable elements', () => {
      const editableDiv = document.createElement('div');
      editableDiv.contentEditable = 'true';
      document.body.appendChild(editableDiv);
      editableDiv.focus();
      
      TestUtils.simulateKeyEvent(editableDiv, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
    });
  });

  describe('4. Dynamic Shortcut Management', () => {
    beforeEach(async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should register new shortcuts dynamically', () => {
      const newCallback = vi.fn();
      keyboardController.registerShortcut('F2', 'newAction', newCallback);
      
      expect(keyboardController.getRegisteredShortcuts()).toContain('F2');
      
      TestUtils.simulateKeyEvent(document, 'F2', 'keydown');
      expect(newCallback).toHaveBeenCalledTimes(1);
    });

    it('should unregister shortcuts', () => {
      expect(keyboardController.getRegisteredShortcuts()).toContain('r');
      
      keyboardController.unregisterShortcut('r');
      
      expect(keyboardController.getRegisteredShortcuts()).not.toContain('r');
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
    });

    it('should update existing shortcuts', () => {
      const newCallback = vi.fn();
      keyboardController.updateShortcut('r', 'updatedAction', newCallback);
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(newCallback).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
    });

    it('should handle shortcut conflicts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const conflictCallback = vi.fn();
      keyboardController.registerShortcut('r', 'conflictAction', conflictCallback);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already registered'));
      
      // Original callback should still work
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).toHaveBeenCalledTimes(1);
      expect(conflictCallback).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('5. Key Sequence and Combinations', () => {
    beforeEach(async () => {
      const sequenceConfig = {
        'ctrl+shift+r': 'complexAction',
        'alt+F4': 'closeAction',
        'meta+s': 'saveAction'
      };
      
      mockCallbacks.complexAction = vi.fn();
      mockCallbacks.closeAction = vi.fn();
      mockCallbacks.saveAction = vi.fn();
      
      keyboardController = new KeyboardController(sequenceConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should handle complex key combinations', () => {
      TestUtils.simulateKeyEvent(document, 'r', 'keydown', { 
        ctrlKey: true, 
        shiftKey: true 
      });
      expect(mockCallbacks.complexAction).toHaveBeenCalledTimes(1);
    });

    it('should handle Alt key combinations', () => {
      TestUtils.simulateKeyEvent(document, 'F4', 'keydown', { altKey: true });
      expect(mockCallbacks.closeAction).toHaveBeenCalledTimes(1);
    });

    it('should handle Meta key combinations', () => {
      TestUtils.simulateKeyEvent(document, 's', 'keydown', { metaKey: true });
      expect(mockCallbacks.saveAction).toHaveBeenCalledTimes(1);
    });

    it('should distinguish between different modifier combinations', () => {
      // ctrl+r should not trigger ctrl+shift+r
      TestUtils.simulateKeyEvent(document, 'r', 'keydown', { ctrlKey: true });
      expect(mockCallbacks.complexAction).not.toHaveBeenCalled();
      
      // shift+r should not trigger ctrl+shift+r
      TestUtils.simulateKeyEvent(document, 'r', 'keydown', { shiftKey: true });
      expect(mockCallbacks.complexAction).not.toHaveBeenCalled();
    });
  });

  describe('6. Event Prevention and Propagation', () => {
    beforeEach(async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should prevent default behavior for registered shortcuts', () => {
      const event = TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(event.defaultPrevented).toBe(true);
    });

    it('should stop event propagation for registered shortcuts', () => {
      const parentHandler = vi.fn();
      document.addEventListener('keydown', parentHandler);
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      
      // Parent handler should not be called due to stopPropagation
      expect(parentHandler).not.toHaveBeenCalled();
      
      document.removeEventListener('keydown', parentHandler);
    });

    it('should allow event propagation for unregistered keys', () => {
      const parentHandler = vi.fn();
      document.addEventListener('keydown', parentHandler);
      
      TestUtils.simulateKeyEvent(document, 'q', 'keydown');
      
      expect(parentHandler).toHaveBeenCalledTimes(1);
      
      document.removeEventListener('keydown', parentHandler);
    });

    it('should handle preventDefault configuration', () => {
      keyboardController.setPreventDefault(false);
      
      const event = TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(event.defaultPrevented).toBe(false);
      expect(mockCallbacks.newGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. State Management', () => {
    beforeEach(async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should enable and disable keyboard controller', () => {
      keyboardController.disable();
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
      
      keyboardController.enable();
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).toHaveBeenCalledTimes(1);
    });

    it('should track enabled state', () => {
      expect(keyboardController.isEnabled()).toBe(true);
      
      keyboardController.disable();
      expect(keyboardController.isEnabled()).toBe(false);
      
      keyboardController.enable();
      expect(keyboardController.isEnabled()).toBe(true);
    });

    it('should pause and resume keyboard handling', () => {
      keyboardController.pause();
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
      
      keyboardController.resume();
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).toHaveBeenCalledTimes(1);
    });

    it('should clear all shortcuts', () => {
      expect(keyboardController.getRegisteredShortcuts().length).toBeGreaterThan(0);
      
      keyboardController.clearAllShortcuts();
      
      expect(keyboardController.getRegisteredShortcuts()).toEqual([]);
      
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      expect(mockCallbacks.newGame).not.toHaveBeenCalled();
    });
  });

  describe('8. Error Handling', () => {
    it('should handle initialization with invalid callbacks', async () => {
      const invalidConfig = {
        'r': 'nonExistentCallback'
      };
      
      keyboardController = new KeyboardController(invalidConfig, mockCallbacks);
      
      await expect(keyboardController.init()).resolves.not.toThrow();
      
      // Should not crash when invalid callback is triggered
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
    });

    it('should handle malformed key combinations', async () => {
      const badConfig = {
        '': 'emptyKey',
        'invalid++key': 'badCombo',
        'ctrl+': 'incompleteCombo'
      };
      
      keyboardController = new KeyboardController(badConfig, mockCallbacks);
      
      await expect(keyboardController.init()).resolves.not.toThrow();
    });

    it('should handle callback execution errors gracefully', async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
      
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      keyboardController.registerShortcut('e', 'errorAction', errorCallback);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        TestUtils.simulateKeyEvent(document, 'e', 'keydown');
      }).not.toThrow();
      
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle destroy when not initialized', () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      
      expect(() => {
        keyboardController.destroy();
      }).not.toThrow();
    });
  });

  describe('9. Performance and Efficiency', () => {
    beforeEach(async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should handle rapid key events efficiently', () => {
      const start = performance.now();
      
      // Simulate rapid key presses
      for (let i = 0; i < 100; i++) {
        TestUtils.simulateKeyEvent(document, 'r', 'keydown');
        TestUtils.simulateKeyEvent(document, 'F1', 'keydown');
        TestUtils.simulateKeyEvent(document, 'Escape', 'keydown');
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should be fast
      expect(mockCallbacks.newGame).toHaveBeenCalledTimes(100);
      expect(mockCallbacks.showHelp).toHaveBeenCalledTimes(100);
      expect(mockCallbacks.customAction).toHaveBeenCalledTimes(100);
    });

    it('should efficiently manage large numbers of shortcuts', () => {
      // Register many shortcuts
      for (let i = 0; i < 50; i++) {
        keyboardController.registerShortcut(`F${i}`, `action${i}`, vi.fn());
      }
      
      const start = performance.now();
      
      TestUtils.simulateKeyEvent(document, 'F25', 'keydown');
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('10. Debug and Development Support', () => {
    beforeEach(async () => {
      keyboardController = new KeyboardController(keyboardConfig, mockCallbacks);
      await keyboardController.init();
    });

    it('should provide debug information', () => {
      const debugInfo = keyboardController.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('registeredShortcuts');
      expect(debugInfo).toHaveProperty('isEnabled');
      expect(debugInfo).toHaveProperty('isInitialized');
      expect(debugInfo).toHaveProperty('keyPressCount');
      expect(debugInfo.registeredShortcuts).toBeInstanceOf(Array);
    });

    it('should validate shortcut configuration', () => {
      const validation = keyboardController.validateConfiguration();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation.errors).toBeInstanceOf(Array);
      expect(validation.warnings).toBeInstanceOf(Array);
    });

    it('should provide shortcut statistics', () => {
      // Trigger some shortcuts
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      TestUtils.simulateKeyEvent(document, 'F1', 'keydown');
      TestUtils.simulateKeyEvent(document, 'r', 'keydown');
      
      const stats = keyboardController.getStatistics();
      
      expect(stats).toHaveProperty('totalShortcuts');
      expect(stats).toHaveProperty('totalKeyPresses');
      expect(stats).toHaveProperty('mostUsedShortcut');
      expect(stats.totalKeyPresses).toBeGreaterThan(0);
    });

    it('should export and import configuration', () => {
      const exportedConfig = keyboardController.exportConfiguration();
      
      expect(exportedConfig).toHaveProperty('shortcuts');
      expect(exportedConfig).toHaveProperty('settings');
      
      const newController = new KeyboardController({}, {});
      newController.importConfiguration(exportedConfig);
      
      expect(newController.getRegisteredShortcuts()).toEqual(
        keyboardController.getRegisteredShortcuts()
      );
    });
  });
});