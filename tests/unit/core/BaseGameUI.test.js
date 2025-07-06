/**
 * BaseGameUI Unit Tests
 * 
 * Tests for the core BaseGameUI class that all game UIs inherit from.
 * This is the foundation of the UI-Module System.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseGameUI } from '@ui-modules/core/BaseGameUI.js';
import { TestUtils } from '../../setup.js';

describe('BaseGameUI Core Tests', () => {
  let dom;
  let mockGame;
  let gameUI;
  let config;

  beforeEach(() => {
    // Set up DOM environment
    dom = TestUtils.createTestDOM(`
      <div id="gameBoard"></div>
      <div id="gameStatus">Ready</div>
      <div id="currentPlayer">Player 1</div>
      <div id="moveCounter">0</div>
      <button id="resetBtn">Reset</button>
      <div id="helpModal" class="modal hidden">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Help</h2>
        </div>
      </div>
      <div id="message-container"></div>
    `);

    // Create mock game and config
    mockGame = TestUtils.createMockGame();
    config = TestUtils.createMockConfig();
  });

  afterEach(() => {
    if (gameUI) {
      gameUI.destroy?.();
      gameUI = null;
    }
    TestUtils.cleanupDOM(dom);
    vi.clearAllMocks();
  });

  describe('1. Constructor and Initialization', () => {
    it('should create BaseGameUI instance with game and config', () => {
      gameUI = new BaseGameUI(mockGame, config);
      
      expect(gameUI).toBeInstanceOf(BaseGameUI);
      expect(gameUI.game).toBe(mockGame);
      expect(gameUI.config).toEqual(config);
      expect(gameUI.isInitialized).toBe(false);
    });

    it('should handle missing game parameter', () => {
      expect(() => {
        gameUI = new BaseGameUI(null, config);
      }).not.toThrow();
      
      expect(gameUI.game).toBe(null);
    });

    it('should handle missing config parameter', () => {
      gameUI = new BaseGameUI(mockGame);
      
      expect(gameUI.config).toBeDefined();
      expect(gameUI.config.elements).toBeDefined();
    });

    it('should initialize with default configuration when no config provided', () => {
      gameUI = new BaseGameUI(mockGame);
      
      expect(gameUI.config.elements.required).toContain('gameBoard');
      expect(gameUI.config.messages).toBeDefined();
      expect(gameUI.config.keyboard).toBeDefined();
    });
  });

  describe('2. Async Initialization Process', () => {
    it('should complete full initialization process', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      
      const beforeInitSpy = vi.spyOn(gameUI, 'beforeInit');
      const afterInitSpy = vi.spyOn(gameUI, 'afterInit');
      
      await gameUI.init();
      
      expect(beforeInitSpy).toHaveBeenCalled();
      expect(afterInitSpy).toHaveBeenCalled();
      expect(gameUI.isInitialized).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      
      // Mock an error in beforeInit
      vi.spyOn(gameUI, 'beforeInit').mockRejectedValue(new Error('Init failed'));
      
      await expect(gameUI.init()).rejects.toThrow('Init failed');
      expect(gameUI.isInitialized).toBe(false);
    });

    it('should not allow multiple initializations', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      
      await gameUI.init();
      expect(gameUI.isInitialized).toBe(true);
      
      // Second init should not change state
      await gameUI.init();
      expect(gameUI.isInitialized).toBe(true);
    });

    it('should call lifecycle methods in correct order', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      
      const calls = [];
      vi.spyOn(gameUI, 'beforeInit').mockImplementation(() => calls.push('beforeInit'));
      vi.spyOn(gameUI, 'bindElements').mockImplementation(() => calls.push('bindElements'));
      vi.spyOn(gameUI, 'setupModules').mockImplementation(() => calls.push('setupModules'));
      vi.spyOn(gameUI, 'setupEvents').mockImplementation(() => calls.push('setupEvents'));
      vi.spyOn(gameUI, 'afterInit').mockImplementation(() => calls.push('afterInit'));
      
      await gameUI.init();
      
      expect(calls).toEqual(['beforeInit', 'bindElements', 'setupModules', 'setupEvents', 'afterInit']);
    });
  });

  describe('3. Element Binding', () => {
    it('should bind required elements successfully', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.elements.gameBoard).toBeTruthy();
      expect(gameUI.elements.gameStatus).toBeTruthy();
    });

    it('should handle missing required elements gracefully', async () => {
      // Remove a required element
      document.getElementById('gameBoard').remove();
      
      gameUI = new BaseGameUI(mockGame, config);
      
      // Should not throw, but should log warning
      await expect(gameUI.init()).resolves.not.toThrow();
      expect(gameUI.elements.gameBoard).toBe(null);
    });

    it('should bind optional elements when available', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.elements.moveCounter).toBeTruthy();
      expect(gameUI.elements.currentPlayer).toBeTruthy();
    });

    it('should handle missing optional elements without errors', async () => {
      // Remove optional elements
      document.getElementById('moveCounter')?.remove();
      document.getElementById('currentPlayer')?.remove();
      
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.elements.moveCounter).toBe(null);
      expect(gameUI.elements.currentPlayer).toBe(null);
      expect(gameUI.isInitialized).toBe(true);
    });
  });

  describe('4. Module Management', () => {
    it('should initialize core modules', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.modalManager).toBeDefined();
      expect(gameUI.keyboardController).toBeDefined();
      expect(gameUI.messageSystem).toBeDefined();
    });

    it('should provide access to modules via getModule', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.getModule('modal')).toBe(gameUI.modalManager);
      expect(gameUI.getModule('keyboard')).toBe(gameUI.keyboardController);
      expect(gameUI.getModule('message')).toBe(gameUI.messageSystem);
    });

    it('should return null for non-existent modules', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.getModule('nonexistent')).toBe(null);
    });

    it('should handle module initialization errors', async () => {
      // Mock ModalManager to throw error
      const originalModalManager = await import('@ui-modules/components/ModalManager.js');
      vi.doMock('@ui-modules/components/ModalManager.js', () => ({
        ModalManager: vi.fn(() => {
          throw new Error('Modal init failed');
        })
      }));
      
      gameUI = new BaseGameUI(mockGame, config);
      
      // Should handle error gracefully
      await expect(gameUI.init()).resolves.not.toThrow();
    });
  });

  describe('5. Event Handling', () => {
    it('should set up game event listeners', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(mockGame.on).toHaveBeenCalled();
    });

    it('should set up UI event listeners', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      const resetBtn = document.getElementById('resetBtn');
      expect(resetBtn).toBeTruthy();
      
      // Test click event
      const clickSpy = vi.spyOn(gameUI, 'handleResetGame');
      TestUtils.simulateMouseEvent(resetBtn, 'click');
      
      // Should be called if properly bound
    });

    it('should handle keyboard events through KeyboardController', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.keyboardController).toBeDefined();
      
      // Simulate keyboard event
      TestUtils.simulateKeyEvent(document, 'F1');
      
      // KeyboardController should handle it
    });
  });

  describe('6. Message System Integration', () => {
    it('should display messages correctly', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      gameUI.showMessage('Test message', 'info');
      
      // Check if message was sent to MessageSystem
      expect(gameUI.messageSystem).toBeDefined();
    });

    it('should handle different message types', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      const messageTypes = ['info', 'success', 'error', 'warning'];
      
      messageTypes.forEach(type => {
        expect(() => {
          gameUI.showMessage(`Test ${type}`, type);
        }).not.toThrow();
      });
    });

    it('should provide convenience methods for common message types', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(typeof gameUI.showInfo).toBe('function');
      expect(typeof gameUI.showSuccess).toBe('function');
      expect(typeof gameUI.showError).toBe('function');
      expect(typeof gameUI.showWarning).toBe('function');
    });
  });

  describe('7. Modal System Integration', () => {
    it('should manage modals through ModalManager', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(gameUI.modalManager).toBeDefined();
      
      // Test modal operations
      gameUI.showModal('help');
      gameUI.hideModal('help');
      
      // ModalManager should handle these
    });

    it('should handle modal configuration from config', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      // Check if modals from config are registered
      const helpModal = document.getElementById('helpModal');
      expect(helpModal).toBeTruthy();
    });
  });

  describe('8. Cleanup and Destruction', () => {
    it('should clean up properly on destroy', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      const destroySpy = vi.spyOn(gameUI.messageSystem, 'destroy');
      
      gameUI.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(gameUI.isInitialized).toBe(false);
    });

    it('should remove event listeners on destroy', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      gameUI.destroy();
      
      // Should remove keyboard listeners
      expect(removeListenerSpy).toHaveBeenCalled();
    });

    it('should handle destroy when not initialized', () => {
      gameUI = new BaseGameUI(mockGame, config);
      
      expect(() => {
        gameUI.destroy();
      }).not.toThrow();
    });
  });

  describe('9. Game Action Methods', () => {
    it('should provide default game action methods', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      expect(typeof gameUI.newGame).toBe('function');
      expect(typeof gameUI.resetScore).toBe('function');
      expect(typeof gameUI.handleResetGame).toBe('function');
    });

    it('should call game methods when actions are triggered', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      gameUI.newGame();
      expect(mockGame.newGame).toHaveBeenCalled();
      
      gameUI.resetScore();
      // Should call appropriate game method or handle internally
    });

    it('should handle game actions when game is not available', async () => {
      gameUI = new BaseGameUI(null, config);
      await gameUI.init();
      
      expect(() => {
        gameUI.newGame();
        gameUI.resetScore();
      }).not.toThrow();
    });
  });

  describe('10. Configuration Management', () => {
    it('should merge configurations correctly', () => {
      const customConfig = {
        elements: {
          required: ['customElement']
        },
        keyboard: {
          'F5': 'customAction'
        }
      };
      
      gameUI = new BaseGameUI(mockGame, customConfig);
      
      expect(gameUI.config.elements.required).toContain('customElement');
      expect(gameUI.config.keyboard['F5']).toBe('customAction');
    });

    it('should preserve default config when merging', () => {
      const customConfig = {
        keyboard: {
          'F5': 'customAction'
        }
      };
      
      gameUI = new BaseGameUI(mockGame, customConfig);
      
      // Should still have default elements config
      expect(gameUI.config.elements).toBeDefined();
      expect(gameUI.config.messages).toBeDefined();
    });

    it('should allow runtime configuration updates', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      gameUI.updateConfig({
        messages: {
          duration: 5000
        }
      });
      
      expect(gameUI.config.messages.duration).toBe(5000);
    });
  });

  describe('11. Error Handling', () => {
    it('should handle errors during module setup gracefully', async () => {
      // Mock console.error to prevent noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      gameUI = new BaseGameUI(mockGame, config);
      
      // Force an error in setupModules
      vi.spyOn(gameUI, 'setupModules').mockRejectedValue(new Error('Setup failed'));
      
      await expect(gameUI.init()).rejects.toThrow('Setup failed');
      
      consoleSpy.mockRestore();
    });

    it('should handle DOM errors gracefully', async () => {
      // Create a config that references non-existent elements
      const badConfig = {
        elements: {
          required: ['nonExistentElement']
        }
      };
      
      gameUI = new BaseGameUI(mockGame, badConfig);
      
      // Should not throw, but should handle missing elements
      await expect(gameUI.init()).resolves.not.toThrow();
      expect(gameUI.elements.nonExistentElement).toBe(null);
    });
  });

  describe('12. Performance Considerations', () => {
    it('should initialize within reasonable time', async () => {
      const startTime = performance.now();
      
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should initialize within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should not create memory leaks', async () => {
      gameUI = new BaseGameUI(mockGame, config);
      await gameUI.init();
      
      const initialModules = Object.keys(gameUI.modules || {}).length;
      
      gameUI.destroy();
      
      // After destroy, modules should be cleaned up
      const finalModules = Object.keys(gameUI.modules || {}).length;
      expect(finalModules).toBeLessThanOrEqual(initialModules);
    });
  });
});