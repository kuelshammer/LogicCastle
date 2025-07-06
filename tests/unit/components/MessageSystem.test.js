/**
 * MessageSystem Unit Tests
 * 
 * Tests for the MessageSystem component that handles user notifications
 * and messages in the UI-Module System.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageSystem } from '@ui-modules/components/MessageSystem.js';
import { TestUtils } from '../../setup.js';

describe('MessageSystem Core Tests', () => {
  let dom;
  let messageSystem;
  let messageConfig;

  beforeEach(() => {
    // Set up DOM environment with message container
    dom = TestUtils.createTestDOM(`
      <div id="container">
        <div id="message-container" class="message-container"></div>
        <div id="custom-message-area" class="custom-messages"></div>
        <div id="gameBoard">Game Board</div>
      </div>
    `);

    messageConfig = {
      container: '#message-container',
      position: 'top-right',
      duration: 3000,
      maxMessages: 5,
      animations: true,
      types: {
        info: {
          className: 'message-info',
          icon: 'ℹ️',
          duration: 3000
        },
        success: {
          className: 'message-success',
          icon: '✅',
          duration: 2000
        },
        warning: {
          className: 'message-warning',
          icon: '⚠️',
          duration: 4000
        },
        error: {
          className: 'message-error',
          icon: '❌',
          duration: 5000
        }
      }
    };
  });

  afterEach(() => {
    if (messageSystem) {
      messageSystem.destroy?.();
      messageSystem = null;
    }
    TestUtils.cleanupDOM(dom);
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('1. Initialization and Setup', () => {
    it('should create MessageSystem instance with configuration', () => {
      messageSystem = new MessageSystem(messageConfig);
      
      expect(messageSystem).toBeInstanceOf(MessageSystem);
      expect(messageSystem.config).toBeDefined();
      expect(messageSystem.isInitialized).toBe(false);
    });

    it('should initialize successfully with valid container', async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
      
      expect(messageSystem.isInitialized).toBe(true);
      expect(messageSystem.container).toBeTruthy();
    });

    it('should handle initialization with missing container', async () => {
      const configWithMissingContainer = {
        ...messageConfig,
        container: '#nonExistentContainer'
      };
      
      messageSystem = new MessageSystem(configWithMissingContainer);
      
      await expect(messageSystem.init()).resolves.not.toThrow();
      expect(messageSystem.isInitialized).toBe(true);
      // Should create default container
      expect(messageSystem.container).toBeTruthy();
    });

    it('should use default configuration when none provided', async () => {
      messageSystem = new MessageSystem();
      await messageSystem.init();
      
      expect(messageSystem.isInitialized).toBe(true);
      expect(messageSystem.config).toBeDefined();
      expect(messageSystem.config.duration).toBeDefined();
      expect(messageSystem.config.types).toBeDefined();
    });

    it('should handle custom container selector', async () => {
      const customConfig = {
        ...messageConfig,
        container: '#custom-message-area'
      };
      
      messageSystem = new MessageSystem(customConfig);
      await messageSystem.init();
      
      const customContainer = document.getElementById('custom-message-area');
      expect(messageSystem.container).toBe(customContainer);
    });
  });

  describe('2. Basic Message Operations', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should show info messages', () => {
      messageSystem.showMessage('Test info message', 'info');
      
      const messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Test info message');
      expect(messages[0].textContent).toContain('ℹ️');
    });

    it('should show success messages', () => {
      messageSystem.showMessage('Success message', 'success');
      
      const messages = messageSystem.container.querySelectorAll('.message-success');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Success message');
      expect(messages[0].textContent).toContain('✅');
    });

    it('should show warning messages', () => {
      messageSystem.showMessage('Warning message', 'warning');
      
      const messages = messageSystem.container.querySelectorAll('.message-warning');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Warning message');
      expect(messages[0].textContent).toContain('⚠️');
    });

    it('should show error messages', () => {
      messageSystem.showMessage('Error message', 'error');
      
      const messages = messageSystem.container.querySelectorAll('.message-error');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Error message');
      expect(messages[0].textContent).toContain('❌');
    });

    it('should handle default message type', () => {
      messageSystem.showMessage('Default message');
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Default message');
    });

    it('should handle unknown message types gracefully', () => {
      messageSystem.showMessage('Unknown type message', 'unknown');
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Unknown type message');
    });
  });

  describe('3. Convenience Methods', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should provide info convenience method', () => {
      messageSystem.info('Info message');
      
      const messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Info message');
    });

    it('should provide success convenience method', () => {
      messageSystem.success('Success message');
      
      const messages = messageSystem.container.querySelectorAll('.message-success');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Success message');
    });

    it('should provide warning convenience method', () => {
      messageSystem.warning('Warning message');
      
      const messages = messageSystem.container.querySelectorAll('.message-warning');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Warning message');
    });

    it('should provide error convenience method', () => {
      messageSystem.error('Error message');
      
      const messages = messageSystem.container.querySelectorAll('.message-error');
      expect(messages).toHaveLength(1);
      expect(messages[0].textContent).toContain('Error message');
    });
  });

  describe('4. Message Auto-Removal', () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-remove messages after duration', () => {
      messageSystem.showMessage('Auto-remove message', 'info');
      
      let messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(1);
      
      // Fast-forward time
      vi.advanceTimersByTime(3000);
      
      messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(0);
    });

    it('should use type-specific durations', () => {
      messageSystem.showMessage('Success message', 'success'); // 2000ms
      messageSystem.showMessage('Error message', 'error'); // 5000ms
      
      let messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(2);
      
      // After 2000ms, success should be gone
      vi.advanceTimersByTime(2000);
      messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(1);
      expect(messages[0]).toHaveClass('message-error');
      
      // After 5000ms, error should be gone
      vi.advanceTimersByTime(3000);
      messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(0);
    });

    it('should handle persistent messages', () => {
      messageSystem.showMessage('Persistent message', 'info', { persistent: true });
      
      let messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(1);
      
      // Should not be removed after normal duration
      vi.advanceTimersByTime(5000);
      messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(1);
    });

    it('should override duration with options', () => {
      messageSystem.showMessage('Custom duration', 'info', { duration: 1000 });
      
      let messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(1);
      
      vi.advanceTimersByTime(1000);
      messages = messageSystem.container.querySelectorAll('.message-info');
      expect(messages).toHaveLength(0);
    });
  });

  describe('5. Message Management', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should enforce maximum message limit', () => {
      // Add more messages than the limit (5)
      for (let i = 0; i < 7; i++) {
        messageSystem.showMessage(`Message ${i}`, 'info');
      }
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(5); // Should be limited to maxMessages
    });

    it('should remove oldest messages when limit exceeded', () => {
      for (let i = 0; i < 6; i++) {
        messageSystem.showMessage(`Message ${i}`, 'info');
      }
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(5);
      
      // First message should be removed, latest should be visible
      expect(messages[4].textContent).toContain('Message 5');
    });

    it('should clear all messages', () => {
      messageSystem.showMessage('Message 1', 'info');
      messageSystem.showMessage('Message 2', 'warning');
      messageSystem.showMessage('Message 3', 'error');
      
      let messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(3);
      
      messageSystem.clearAllMessages();
      
      messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(0);
    });

    it('should clear messages by type', () => {
      messageSystem.showMessage('Info message', 'info');
      messageSystem.showMessage('Warning message', 'warning');
      messageSystem.showMessage('Error message', 'error');
      
      messageSystem.clearMessagesByType('warning');
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(2);
      
      const warningMessages = messageSystem.container.querySelectorAll('.message-warning');
      expect(warningMessages).toHaveLength(0);
    });

    it('should get message count', () => {
      expect(messageSystem.getMessageCount()).toBe(0);
      
      messageSystem.showMessage('Message 1', 'info');
      messageSystem.showMessage('Message 2', 'warning');
      
      expect(messageSystem.getMessageCount()).toBe(2);
    });

    it('should get message count by type', () => {
      messageSystem.showMessage('Info 1', 'info');
      messageSystem.showMessage('Info 2', 'info');
      messageSystem.showMessage('Warning 1', 'warning');
      
      expect(messageSystem.getMessageCount('info')).toBe(2);
      expect(messageSystem.getMessageCount('warning')).toBe(1);
      expect(messageSystem.getMessageCount('error')).toBe(0);
    });
  });

  describe('6. Manual Message Removal', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should allow manual message dismissal', () => {
      const messageId = messageSystem.showMessage('Dismissible message', 'info');
      
      let messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(1);
      
      messageSystem.removeMessage(messageId);
      
      messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(0);
    });

    it('should handle click-to-dismiss', () => {
      messageSystem.showMessage('Click to dismiss', 'info', { clickToDismiss: true });
      
      const message = messageSystem.container.querySelector('.message');
      expect(message).toBeTruthy();
      
      TestUtils.simulateMouseEvent(message, 'click');
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(0);
    });

    it('should show close button when configured', () => {
      messageSystem.showMessage('Message with close', 'info', { showCloseButton: true });
      
      const closeButton = messageSystem.container.querySelector('.message-close');
      expect(closeButton).toBeTruthy();
      
      TestUtils.simulateMouseEvent(closeButton, 'click');
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(0);
    });

    it('should not allow dismissal when disabled', () => {
      messageSystem.showMessage('Non-dismissible', 'info', { 
        clickToDismiss: false,
        showCloseButton: false
      });
      
      const message = messageSystem.container.querySelector('.message');
      TestUtils.simulateMouseEvent(message, 'click');
      
      const messages = messageSystem.container.querySelectorAll('.message');
      expect(messages).toHaveLength(1);
    });
  });

  describe('7. Message Positioning and Layout', () => {
    it('should position container correctly', async () => {
      const topRightConfig = { ...messageConfig, position: 'top-right' };
      messageSystem = new MessageSystem(topRightConfig);
      await messageSystem.init();
      
      expect(messageSystem.container.style.position).toBe('fixed');
      expect(messageSystem.container.style.top).toBe('20px');
      expect(messageSystem.container.style.right).toBe('20px');
    });

    it('should handle different position configurations', async () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
      
      for (const position of positions) {
        const config = { ...messageConfig, position };
        messageSystem = new MessageSystem(config);
        await messageSystem.init();
        
        expect(messageSystem.container.style.position).toBe('fixed');
        messageSystem.destroy();
      }
    });

    it('should handle custom positioning', async () => {
      const customConfig = {
        ...messageConfig,
        position: 'custom',
        customPosition: {
          top: '50px',
          left: '100px'
        }
      };
      
      messageSystem = new MessageSystem(customConfig);
      await messageSystem.init();
      
      expect(messageSystem.container.style.top).toBe('50px');
      expect(messageSystem.container.style.left).toBe('100px');
    });
  });

  describe('8. Animation and Styling', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should add animation classes when enabled', () => {
      messageSystem.showMessage('Animated message', 'info');
      
      const message = messageSystem.container.querySelector('.message');
      expect(message.classList.contains('message-enter')).toBe(true);
    });

    it('should handle disabled animations', async () => {
      const noAnimConfig = { ...messageConfig, animations: false };
      messageSystem.destroy();
      messageSystem = new MessageSystem(noAnimConfig);
      await messageSystem.init();
      
      messageSystem.showMessage('No animation', 'info');
      
      const message = messageSystem.container.querySelector('.message');
      expect(message.classList.contains('message-enter')).toBe(false);
    });

    it('should apply custom CSS classes', () => {
      messageSystem.showMessage('Custom class message', 'info', { 
        className: 'custom-message-class' 
      });
      
      const message = messageSystem.container.querySelector('.message');
      expect(message.classList.contains('custom-message-class')).toBe(true);
    });

    it('should handle HTML content', () => {
      messageSystem.showMessage('<strong>Bold</strong> message', 'info', { 
        allowHTML: true 
      });
      
      const message = messageSystem.container.querySelector('.message');
      const strongElement = message.querySelector('strong');
      expect(strongElement).toBeTruthy();
      expect(strongElement.textContent).toBe('Bold');
    });

    it('should escape HTML by default', () => {
      messageSystem.showMessage('<script>alert("xss")</script>', 'info');
      
      const message = messageSystem.container.querySelector('.message');
      expect(message.textContent).toContain('<script>');
      expect(message.querySelector('script')).toBe(null);
    });
  });

  describe('9. Progress and Loading Messages', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should show progress messages', () => {
      const messageId = messageSystem.showProgress('Loading...', 0);
      
      const message = messageSystem.container.querySelector('.message');
      expect(message).toBeTruthy();
      expect(message.textContent).toContain('Loading...');
      expect(message.querySelector('.progress-bar')).toBeTruthy();
      
      return messageId;
    });

    it('should update progress', () => {
      const messageId = messageSystem.showProgress('Loading...', 0);
      
      messageSystem.updateProgress(messageId, 50);
      
      const progressBar = messageSystem.container.querySelector('.progress-bar');
      expect(progressBar.style.width).toBe('50%');
    });

    it('should complete progress', () => {
      const messageId = messageSystem.showProgress('Loading...', 0);
      
      messageSystem.completeProgress(messageId, 'Completed!');
      
      const message = messageSystem.container.querySelector('.message');
      expect(message.textContent).toContain('Completed!');
      expect(message.querySelector('.progress-bar')).toBe(null);
    });

    it('should show loading spinner', () => {
      messageSystem.showLoading('Processing...');
      
      const message = messageSystem.container.querySelector('.message');
      expect(message.textContent).toContain('Processing...');
      expect(message.querySelector('.loading-spinner')).toBeTruthy();
    });
  });

  describe('10. Error Handling and Edge Cases', () => {
    it('should handle container creation failure gracefully', async () => {
      // Mock document.createElement to fail
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => {
        throw new Error('createElement failed');
      });
      
      messageSystem = new MessageSystem(messageConfig);
      
      await expect(messageSystem.init()).resolves.not.toThrow();
      
      document.createElement = originalCreateElement;
    });

    it('should handle invalid message content', async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
      
      expect(() => {
        messageSystem.showMessage(null, 'info');
        messageSystem.showMessage(undefined, 'info');
        messageSystem.showMessage('', 'info');
      }).not.toThrow();
    });

    it('should handle remove non-existent message', async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
      
      expect(() => {
        messageSystem.removeMessage('non-existent-id');
        messageSystem.updateProgress('non-existent-id', 50);
        messageSystem.completeProgress('non-existent-id', 'done');
      }).not.toThrow();
    });

    it('should handle destroy when not initialized', () => {
      messageSystem = new MessageSystem(messageConfig);
      
      expect(() => {
        messageSystem.destroy();
      }).not.toThrow();
    });

    it('should clean up timers on destroy', async () => {
      vi.useFakeTimers();
      
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
      
      messageSystem.showMessage('Test message', 'info');
      messageSystem.destroy();
      
      // Advancing timers should not cause errors
      expect(() => {
        vi.advanceTimersByTime(5000);
      }).not.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe('11. Performance and Efficiency', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should handle many messages efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        messageSystem.showMessage(`Message ${i}`, 'info');
      }
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100);
      // Should still respect max message limit
      expect(messageSystem.getMessageCount()).toBeLessThanOrEqual(5);
    });

    it('should efficiently manage DOM operations', () => {
      const start = performance.now();
      
      // Rapid show/clear operations
      for (let i = 0; i < 50; i++) {
        messageSystem.showMessage(`Message ${i}`, 'info');
        if (i % 10 === 0) {
          messageSystem.clearAllMessages();
        }
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('12. Debug and Development Support', () => {
    beforeEach(async () => {
      messageSystem = new MessageSystem(messageConfig);
      await messageSystem.init();
    });

    it('should provide debug information', () => {
      messageSystem.showMessage('Test message', 'info');
      
      const debugInfo = messageSystem.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('messageCount');
      expect(debugInfo).toHaveProperty('messageTypes');
      expect(debugInfo).toHaveProperty('isInitialized');
      expect(debugInfo).toHaveProperty('config');
      expect(debugInfo.messageCount).toBe(1);
    });

    it('should provide message statistics', () => {
      messageSystem.showMessage('Info message', 'info');
      messageSystem.showMessage('Error message', 'error');
      messageSystem.showMessage('Warning message', 'warning');
      
      const stats = messageSystem.getStatistics();
      
      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('messagesByType');
      expect(stats).toHaveProperty('averageDisplayTime');
      expect(stats.totalMessages).toBe(3);
      expect(stats.messagesByType.info).toBe(1);
      expect(stats.messagesByType.error).toBe(1);
      expect(stats.messagesByType.warning).toBe(1);
    });

    it('should validate configuration', () => {
      const validation = messageSystem.validateConfiguration();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation.errors).toBeInstanceOf(Array);
      expect(validation.warnings).toBeInstanceOf(Array);
    });
  });
});