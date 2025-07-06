/**
 * ModalManager Unit Tests
 * 
 * Tests for the ModalManager component that handles modal dialogs
 * in the UI-Module System.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModalManager } from '@ui-modules/components/ModalManager.js';
import { TestUtils } from '../../setup.js';

describe('ModalManager Core Tests', () => {
  let dom;
  let modalManager;
  let modalConfig;

  beforeEach(() => {
    // Set up DOM environment with modal elements
    dom = TestUtils.createTestDOM(`
      <div id="container">
        <!-- Help Modal -->
        <div id="helpModal" class="modal hidden">
          <div class="modal-content">
            <span class="close" data-modal="helpModal">&times;</span>
            <h2>Help</h2>
            <p>Game instructions...</p>
          </div>
        </div>
        
        <!-- Settings Modal -->
        <div id="settingsModal" class="modal hidden">
          <div class="modal-content">
            <span class="close" data-modal="settingsModal">&times;</span>
            <h2>Settings</h2>
            <div class="settings-content">Settings go here...</div>
          </div>
        </div>
        
        <!-- Error Modal -->
        <div id="errorModal" class="modal hidden">
          <div class="modal-content">
            <span class="close" data-modal="errorModal">&times;</span>
            <h2>Error</h2>
            <div id="errorMessage">Error message</div>
          </div>
        </div>
        
        <!-- Modal without close button -->
        <div id="basicModal" class="modal hidden">
          <div class="modal-content">
            <h2>Basic Modal</h2>
          </div>
        </div>
        
        <!-- Modal backdrop -->
        <div id="modalBackdrop" class="modal-backdrop hidden"></div>
      </div>
    `);

    modalConfig = {
      help: {
        id: 'helpModal',
        closeKey: 'F1',
        closeOnBackdrop: true
      },
      settings: {
        id: 'settingsModal', 
        closeKey: 'Escape',
        closeOnBackdrop: true
      },
      error: {
        id: 'errorModal',
        closeKey: 'Escape',
        closeOnBackdrop: false
      },
      basic: {
        id: 'basicModal',
        closeOnBackdrop: true
      }
    };
  });

  afterEach(() => {
    if (modalManager) {
      modalManager.destroy?.();
      modalManager = null;
    }
    TestUtils.cleanupDOM(dom);
    vi.clearAllMocks();
  });

  describe('1. Initialization and Setup', () => {
    it('should create ModalManager instance with configuration', () => {
      modalManager = new ModalManager(modalConfig);
      
      expect(modalManager).toBeInstanceOf(ModalManager);
      expect(modalManager.modals).toBeDefined();
      expect(modalManager.isInitialized).toBe(false);
    });

    it('should initialize successfully with valid modals', async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
      
      expect(modalManager.isInitialized).toBe(true);
      expect(modalManager.getRegisteredModals()).toContain('help');
      expect(modalManager.getRegisteredModals()).toContain('settings');
      expect(modalManager.getRegisteredModals()).toContain('error');
    });

    it('should handle initialization with missing modal elements', async () => {
      const configWithMissing = {
        help: { id: 'helpModal' },
        missing: { id: 'nonExistentModal' }
      };
      
      modalManager = new ModalManager(configWithMissing);
      
      // Should not throw, but should handle missing modals gracefully
      await expect(modalManager.init()).resolves.not.toThrow();
      expect(modalManager.getRegisteredModals()).toContain('help');
      expect(modalManager.getRegisteredModals()).not.toContain('missing');
    });

    it('should handle empty configuration', async () => {
      modalManager = new ModalManager({});
      await modalManager.init();
      
      expect(modalManager.isInitialized).toBe(true);
      expect(modalManager.getRegisteredModals()).toEqual([]);
    });
  });

  describe('2. Modal Operations', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should show modal correctly', () => {
      modalManager.showModal('help');
      
      const helpModal = document.getElementById('helpModal');
      expect(helpModal.classList.contains('hidden')).toBe(false);
      expect(modalManager.isModalVisible('help')).toBe(true);
    });

    it('should hide modal correctly', () => {
      modalManager.showModal('help');
      expect(modalManager.isModalVisible('help')).toBe(true);
      
      modalManager.hideModal('help');
      expect(modalManager.isModalVisible('help')).toBe(false);
      
      const helpModal = document.getElementById('helpModal');
      expect(helpModal.classList.contains('hidden')).toBe(true);
    });

    it('should toggle modal visibility', () => {
      expect(modalManager.isModalVisible('help')).toBe(false);
      
      modalManager.toggleModal('help');
      expect(modalManager.isModalVisible('help')).toBe(true);
      
      modalManager.toggleModal('help');
      expect(modalManager.isModalVisible('help')).toBe(false);
    });

    it('should handle non-existent modal operations gracefully', () => {
      expect(() => {
        modalManager.showModal('nonExistent');
        modalManager.hideModal('nonExistent');
        modalManager.toggleModal('nonExistent');
      }).not.toThrow();
      
      expect(modalManager.isModalVisible('nonExistent')).toBe(false);
    });

    it('should close all modals', () => {
      modalManager.showModal('help');
      modalManager.showModal('settings');
      
      expect(modalManager.isModalVisible('help')).toBe(true);
      expect(modalManager.isModalVisible('settings')).toBe(true);
      
      modalManager.closeAllModals();
      
      expect(modalManager.isModalVisible('help')).toBe(false);
      expect(modalManager.isModalVisible('settings')).toBe(false);
    });
  });

  describe('3. Event Handling', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should close modal when close button is clicked', () => {
      modalManager.showModal('help');
      expect(modalManager.isModalVisible('help')).toBe(true);
      
      const closeButton = document.querySelector('#helpModal .close');
      TestUtils.simulateMouseEvent(closeButton, 'click');
      
      expect(modalManager.isModalVisible('help')).toBe(false);
    });

    it('should close modal on backdrop click when enabled', () => {
      modalManager.showModal('help');
      expect(modalManager.isModalVisible('help')).toBe(true);
      
      const helpModal = document.getElementById('helpModal');
      TestUtils.simulateMouseEvent(helpModal, 'click');
      
      expect(modalManager.isModalVisible('help')).toBe(false);
    });

    it('should not close modal on backdrop click when disabled', () => {
      modalManager.showModal('error');
      expect(modalManager.isModalVisible('error')).toBe(true);
      
      const errorModal = document.getElementById('errorModal');
      TestUtils.simulateMouseEvent(errorModal, 'click');
      
      expect(modalManager.isModalVisible('error')).toBe(true);
    });

    it('should not close modal when clicking modal content', () => {
      modalManager.showModal('help');
      expect(modalManager.isModalVisible('help')).toBe(true);
      
      const modalContent = document.querySelector('#helpModal .modal-content');
      TestUtils.simulateMouseEvent(modalContent, 'click');
      
      expect(modalManager.isModalVisible('help')).toBe(true);
    });

    it('should handle keyboard shortcuts', () => {
      modalManager.showModal('help');
      expect(modalManager.isModalVisible('help')).toBe(true);
      
      TestUtils.simulateKeyEvent(document, 'F1', 'keydown');
      expect(modalManager.isModalVisible('help')).toBe(false);
    });

    it('should handle Escape key for multiple modals', () => {
      modalManager.showModal('settings');
      modalManager.showModal('error');
      
      expect(modalManager.isModalVisible('settings')).toBe(true);
      expect(modalManager.isModalVisible('error')).toBe(true);
      
      TestUtils.simulateKeyEvent(document, 'Escape', 'keydown');
      
      expect(modalManager.isModalVisible('settings')).toBe(false);
      expect(modalManager.isModalVisible('error')).toBe(false);
    });
  });

  describe('4. Dynamic Modal Management', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should register new modal dynamically', () => {
      // Create new modal element
      const newModal = document.createElement('div');
      newModal.id = 'dynamicModal';
      newModal.className = 'modal hidden';
      newModal.innerHTML = '<div class="modal-content"><h2>Dynamic Modal</h2></div>';
      document.body.appendChild(newModal);
      
      modalManager.registerModal('dynamic', {
        id: 'dynamicModal',
        closeOnBackdrop: true
      });
      
      expect(modalManager.getRegisteredModals()).toContain('dynamic');
      
      modalManager.showModal('dynamic');
      expect(modalManager.isModalVisible('dynamic')).toBe(true);
    });

    it('should unregister modal', () => {
      expect(modalManager.getRegisteredModals()).toContain('help');
      
      modalManager.unregisterModal('help');
      
      expect(modalManager.getRegisteredModals()).not.toContain('help');
      expect(modalManager.isModalVisible('help')).toBe(false);
    });

    it('should update modal configuration', () => {
      modalManager.updateModalConfig('help', {
        closeOnBackdrop: false,
        closeKey: 'F2'
      });
      
      // Test that configuration was updated
      modalManager.showModal('help');
      const helpModal = document.getElementById('helpModal');
      TestUtils.simulateMouseEvent(helpModal, 'click');
      
      // Should not close due to updated config
      expect(modalManager.isModalVisible('help')).toBe(true);
    });
  });

  describe('5. Modal Content Management', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should set modal content', () => {
      const newContent = '<h2>Updated Content</h2><p>New text</p>';
      modalManager.setModalContent('help', newContent);
      
      const helpModal = document.getElementById('helpModal');
      const modalContent = helpModal.querySelector('.modal-content');
      expect(modalContent.innerHTML).toContain('Updated Content');
    });

    it('should get modal content', () => {
      const content = modalManager.getModalContent('help');
      expect(content).toContain('Help');
      expect(content).toContain('Game instructions');
    });

    it('should set modal title', () => {
      modalManager.setModalTitle('help', 'New Help Title');
      
      const helpModal = document.getElementById('helpModal');
      const titleElement = helpModal.querySelector('h2');
      expect(titleElement.textContent).toBe('New Help Title');
    });

    it('should handle content updates for non-existent modals gracefully', () => {
      expect(() => {
        modalManager.setModalContent('nonExistent', 'content');
        modalManager.setModalTitle('nonExistent', 'title');
        modalManager.getModalContent('nonExistent');
      }).not.toThrow();
    });
  });

  describe('6. Modal State and Information', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should track currently visible modals', () => {
      expect(modalManager.getVisibleModals()).toEqual([]);
      
      modalManager.showModal('help');
      expect(modalManager.getVisibleModals()).toEqual(['help']);
      
      modalManager.showModal('settings');
      expect(modalManager.getVisibleModals()).toContain('help');
      expect(modalManager.getVisibleModals()).toContain('settings');
      
      modalManager.hideModal('help');
      expect(modalManager.getVisibleModals()).toEqual(['settings']);
    });

    it('should check if any modal is visible', () => {
      expect(modalManager.hasVisibleModal()).toBe(false);
      
      modalManager.showModal('help');
      expect(modalManager.hasVisibleModal()).toBe(true);
      
      modalManager.hideModal('help');
      expect(modalManager.hasVisibleModal()).toBe(false);
    });

    it('should get modal configuration', () => {
      const helpConfig = modalManager.getModalConfig('help');
      expect(helpConfig.id).toBe('helpModal');
      expect(helpConfig.closeKey).toBe('F1');
      expect(helpConfig.closeOnBackdrop).toBe(true);
    });

    it('should validate modal existence', () => {
      expect(modalManager.hasModal('help')).toBe(true);
      expect(modalManager.hasModal('nonExistent')).toBe(false);
    });
  });

  describe('7. Error Handling and Edge Cases', () => {
    it('should handle initialization without DOM elements', async () => {
      // Remove all modal elements
      document.querySelectorAll('.modal').forEach(modal => modal.remove());
      
      modalManager = new ModalManager(modalConfig);
      
      await expect(modalManager.init()).resolves.not.toThrow();
      expect(modalManager.getRegisteredModals()).toEqual([]);
    });

    it('should handle malformed modal configuration', async () => {
      const badConfig = {
        invalid: null,
        noId: { closeKey: 'F1' },
        empty: {}
      };
      
      modalManager = new ModalManager(badConfig);
      
      await expect(modalManager.init()).resolves.not.toThrow();
    });

    it('should handle multiple initialization attempts', async () => {
      modalManager = new ModalManager(modalConfig);
      
      await modalManager.init();
      expect(modalManager.isInitialized).toBe(true);
      
      await modalManager.init();
      expect(modalManager.isInitialized).toBe(true);
    });

    it('should handle event listeners after destroy', async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
      
      modalManager.destroy();
      
      // Should not throw errors
      expect(() => {
        TestUtils.simulateKeyEvent(document, 'F1', 'keydown');
        TestUtils.simulateKeyEvent(document, 'Escape', 'keydown');
      }).not.toThrow();
    });
  });

  describe('8. Performance and Efficiency', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should handle rapid modal operations efficiently', () => {
      const start = performance.now();
      
      // Rapid show/hide operations
      for (let i = 0; i < 100; i++) {
        modalManager.showModal('help');
        modalManager.hideModal('help');
        modalManager.toggleModal('settings');
        modalManager.toggleModal('settings');
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should be fast
    });

    it('should manage multiple modals efficiently', () => {
      const start = performance.now();
      
      // Show all modals
      modalManager.getRegisteredModals().forEach(modalName => {
        modalManager.showModal(modalName);
      });
      
      // Hide all modals
      modalManager.closeAllModals();
      
      const end = performance.now();
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('9. Integration and Compatibility', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should work with CSS transitions and animations', () => {
      // Add CSS transition class
      const helpModal = document.getElementById('helpModal');
      helpModal.style.transition = 'opacity 0.3s ease';
      
      modalManager.showModal('help');
      expect(modalManager.isModalVisible('help')).toBe(true);
      
      modalManager.hideModal('help');
      expect(modalManager.isModalVisible('help')).toBe(false);
    });

    it('should maintain focus management', () => {
      modalManager.showModal('help');
      
      const helpModal = document.getElementById('helpModal');
      const closeButton = helpModal.querySelector('.close');
      
      // Focus should be manageable
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });

    it('should support custom modal structures', () => {
      // Test with modal that has different structure
      modalManager.showModal('basic');
      expect(modalManager.isModalVisible('basic')).toBe(true);
      
      modalManager.hideModal('basic');
      expect(modalManager.isModalVisible('basic')).toBe(false);
    });
  });

  describe('10. Debug and Development Support', () => {
    beforeEach(async () => {
      modalManager = new ModalManager(modalConfig);
      await modalManager.init();
    });

    it('should provide debug information', () => {
      const debugInfo = modalManager.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('registeredModals');
      expect(debugInfo).toHaveProperty('visibleModals');
      expect(debugInfo).toHaveProperty('isInitialized');
      expect(debugInfo.registeredModals).toBeInstanceOf(Array);
      expect(debugInfo.visibleModals).toBeInstanceOf(Array);
    });

    it('should validate modal configuration', () => {
      const validation = modalManager.validateConfiguration();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation.errors).toBeInstanceOf(Array);
      expect(validation.warnings).toBeInstanceOf(Array);
    });

    it('should provide modal statistics', () => {
      modalManager.showModal('help');
      modalManager.showModal('settings');
      
      const stats = modalManager.getStatistics();
      
      expect(stats).toHaveProperty('totalModals');
      expect(stats).toHaveProperty('visibleModals');
      expect(stats).toHaveProperty('hiddenModals');
      expect(stats.totalModals).toBeGreaterThan(0);
      expect(stats.visibleModals).toBe(2);
    });
  });
});