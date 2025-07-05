/**
 * MessageSystem - Centralized toast/notification system
 * 
 * Eliminates different message implementations found across games.
 * Provides consistent user feedback with animations and auto-dismiss.
 * 
 * Features:
 * - Multiple message types (info, success, error, warning)
 * - Auto-dismiss with configurable duration
 * - Animation support
 * - Queue management for multiple messages
 * - Position configuration
 */

export class MessageSystem {
    constructor(config = {}) {
        this.config = this.mergeDefaultConfig(config);
        this.messageQueue = [];
        this.activeMessages = new Set();
        this.container = null;
        this.messageIdCounter = 0;
        
        this.init();
    }

    /**
     * Merge user config with defaults
     */
    mergeDefaultConfig(userConfig) {
        const defaultConfig = {
            position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
            duration: 3000, // ms, 0 for no auto-dismiss
            maxMessages: 5,
            animation: true,
            animationDuration: 300, // ms
            spacing: 10, // px between messages
            
            types: {
                info: { 
                    className: 'message-info',
                    icon: 'ℹ️',
                    duration: 3000
                },
                success: { 
                    className: 'message-success',
                    icon: '✅',
                    duration: 3000
                },
                error: { 
                    className: 'message-error',
                    icon: '❌',
                    duration: 5000
                },
                warning: { 
                    className: 'message-warning',
                    icon: '⚠️',
                    duration: 4000
                },
                win: {
                    className: 'message-win',
                    icon: '🎉',
                    duration: 5000
                }
            }
        };

        const merged = this.deepMerge(defaultConfig, userConfig);
        console.log('MessageSystem config merged:', merged);
        return merged;
    }

    /**
     * Deep merge utility
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Initialize the message system
     */
    init() {
        this.createContainer();
        this.injectStyles();
        
        console.log(`📢 MessageSystem initialized at ${this.config.position}`);
    }

    /**
     * Create the message container
     */
    createContainer() {
        // Check if container already exists
        let existingContainer = document.getElementById('message-container');
        if (existingContainer) {
            this.container = existingContainer;
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'message-container';
        this.container.className = `message-container message-${this.config.position}`;
        
        document.body.appendChild(this.container);
    }

    /**
     * Inject required CSS styles
     */
    injectStyles() {
        // Check if styles already exist
        if (document.getElementById('message-system-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'message-system-styles';
        styles.textContent = `
            .message-container {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            }

            .message-container.message-top-right {
                top: 20px;
                right: 20px;
            }

            .message-container.message-top-left {
                top: 20px;
                left: 20px;
            }

            .message-container.message-bottom-right {
                bottom: 20px;
                right: 20px;
            }

            .message-container.message-bottom-left {
                bottom: 20px;
                left: 20px;
            }

            .message-container.message-top-center {
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
            }

            .message-container.message-bottom-center {
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
            }

            .message-toast {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                color: #1f2937;
                padding: 16px 20px;
                border-radius: 16px;
                margin-bottom: ${this.config.spacing}px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                pointer-events: auto;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                font-weight: 500;
                max-width: 100%;
                word-wrap: break-word;
                transition: all ${this.config.animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .message-toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }

            .message-toast.message-entering {
                opacity: 0;
                transform: translateX(120%) scale(0.9);
            }

            .message-toast.message-entered {
                opacity: 1;
                transform: translateX(0) scale(1);
            }

            .message-toast.message-exiting {
                opacity: 0;
                transform: translateX(120%) scale(0.9);
                margin-bottom: 0;
                padding-top: 0;
                padding-bottom: 0;
                max-height: 0;
            }

            .message-toast:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15);
            }

            .message-toast.message-info {
                background: rgba(59, 130, 246, 0.95);
                color: white;
                border: 1px solid rgba(59, 130, 246, 0.3);
            }

            .message-toast.message-info::before {
                background: linear-gradient(90deg, #93c5fd, #3b82f6, #1d4ed8);
            }

            .message-toast.message-success {
                background: rgba(34, 197, 94, 0.95);
                color: white;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }

            .message-toast.message-success::before {
                background: linear-gradient(90deg, #86efac, #22c55e, #15803d);
            }

            .message-toast.message-error {
                background: rgba(239, 68, 68, 0.95);
                color: white;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }

            .message-toast.message-error::before {
                background: linear-gradient(90deg, #fca5a5, #ef4444, #dc2626);
            }

            .message-toast.message-warning {
                background: rgba(245, 158, 11, 0.95);
                color: white;
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .message-toast.message-warning::before {
                background: linear-gradient(90deg, #fcd34d, #f59e0b, #d97706);
            }

            .message-toast.message-win {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(59, 130, 246, 0.95));
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                animation: winPulse 2s ease-in-out infinite;
            }

            .message-toast.message-win::before {
                background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
                background-size: 200% 100%;
                animation: gradientShift 3s ease-in-out infinite;
            }

            @keyframes winPulse {
                0%, 100% { 
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                50% { 
                    box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4), 0 8px 16px rgba(59, 130, 246, 0.3);
                }
            }

            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            .message-icon {
                flex-shrink: 0;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                transition: all 0.3s ease;
            }

            .message-content {
                flex: 1;
                font-weight: 500;
                letter-spacing: 0.01em;
            }

            .message-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 6px;
                margin-left: 8px;
                opacity: 0.8;
                font-size: 16px;
                line-height: 1;
                flex-shrink: 0;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .message-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            .message-close:active {
                transform: scale(0.95);
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .message-toast {
                    background: rgba(31, 41, 55, 0.95);
                    color: white;
                    border: 1px solid rgba(75, 85, 99, 0.3);
                }
                
                .message-icon {
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .message-close {
                    background: rgba(255, 255, 255, 0.15);
                }
                
                .message-close:hover {
                    background: rgba(255, 255, 255, 0.25);
                }
            }

            /* Mobile responsiveness */
            @media (max-width: 640px) {
                .message-container {
                    left: 10px !important;
                    right: 10px !important;
                    top: 10px !important;
                    max-width: none;
                    transform: none !important;
                }
                
                .message-toast {
                    padding: 14px 16px;
                    border-radius: 12px;
                    font-size: 13px;
                    margin-bottom: 8px;
                }
                
                .message-icon {
                    width: 28px;
                    height: 28px;
                    font-size: 16px;
                }
                
                .message-close {
                    width: 24px;
                    height: 24px;
                    font-size: 14px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Show a message
     * @param {string} content - Message content
     * @param {string} type - Message type (info, success, error, warning, win)
     * @param {Object} options - Additional options
     * @returns {string} Message ID for manual dismissal
     */
    show(content, type = 'info', options = {}) {
        const messageId = this.generateMessageId();
        const typeConfig = (this.config.types && this.config.types[type]) || 
                          (this.config.types && this.config.types.info) || 
                          { duration: 3000, className: 'message-info', icon: 'ℹ️' };
        
        const message = {
            id: messageId,
            content,
            type,
            typeConfig,
            options: {
                duration: options.duration !== undefined ? options.duration : typeConfig.duration,
                dismissible: options.dismissible !== false,
                persistent: options.persistent || false,
                ...options
            },
            timestamp: Date.now()
        };

        // Add to queue
        this.messageQueue.push(message);
        
        // Process queue
        this.processQueue();
        
        return messageId;
    }

    /**
     * Convenience methods for different message types
     */
    info(content, options = {}) {
        return this.show(content, 'info', options);
    }

    success(content, options = {}) {
        return this.show(content, 'success', options);
    }

    error(content, options = {}) {
        return this.show(content, 'error', options);
    }

    warning(content, options = {}) {
        return this.show(content, 'warning', options);
    }

    win(content, options = {}) {
        return this.show(content, 'win', options);
    }

    /**
     * Process the message queue
     */
    processQueue() {
        // Remove excess messages if we have too many active
        while (this.activeMessages.size >= this.config.maxMessages && this.activeMessages.size > 0) {
            const oldestMessage = Array.from(this.activeMessages)[0];
            this.hide(oldestMessage);
        }

        // Show queued messages
        while (this.messageQueue.length > 0 && this.activeMessages.size < this.config.maxMessages) {
            const message = this.messageQueue.shift();
            this.displayMessage(message);
        }
    }

    /**
     * Display a message in the UI
     * @param {Object} message - Message object
     */
    displayMessage(message) {
        const element = this.createMessageElement(message);
        
        // Add to container
        this.container.appendChild(element);
        this.activeMessages.add(message.id);

        // Trigger animation
        if (this.config.animation) {
            this.animateIn(element);
        }

        // Set up auto-dismiss
        if (message.options.duration > 0 && !message.options.persistent) {
            setTimeout(() => {
                this.hide(message.id);
            }, message.options.duration);
        }

        // Store element reference
        message.element = element;
    }

    /**
     * Create a message DOM element
     * @param {Object} message - Message object
     * @returns {HTMLElement} Message element
     */
    createMessageElement(message) {
        const element = document.createElement('div');
        element.className = `message-toast ${message.typeConfig.className}`;
        element.dataset.messageId = message.id;

        // Create icon
        const icon = document.createElement('span');
        icon.className = 'message-icon';
        icon.textContent = message.typeConfig.icon || '';

        // Create content
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message.content;

        // Create close button (if dismissible)
        let closeButton = null;
        if (message.options.dismissible) {
            closeButton = document.createElement('button');
            closeButton.className = 'message-close';
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => this.hide(message.id));
        }

        // Assemble element
        element.appendChild(icon);
        element.appendChild(content);
        if (closeButton) {
            element.appendChild(closeButton);
        }

        return element;
    }

    /**
     * Animate message in
     * @param {HTMLElement} element - Message element
     */
    animateIn(element) {
        element.classList.add('message-entering');
        
        // Force reflow
        element.offsetHeight;
        
        // Trigger animation
        requestAnimationFrame(() => {
            element.classList.remove('message-entering');
            element.classList.add('message-entered');
        });
    }

    /**
     * Animate message out
     * @param {HTMLElement} element - Message element
     * @returns {Promise} Promise that resolves when animation completes
     */
    animateOut(element) {
        return new Promise(resolve => {
            if (!this.config.animation) {
                resolve();
                return;
            }

            element.classList.remove('message-entered');
            element.classList.add('message-exiting');

            setTimeout(() => {
                resolve();
            }, this.config.animationDuration);
        });
    }

    /**
     * Hide a specific message
     * @param {string} messageId - Message ID to hide
     * @returns {boolean} True if message was found and hidden
     */
    async hide(messageId) {
        const element = this.container.querySelector(`[data-message-id="${messageId}"]`);
        
        if (!element) {
            return false;
        }

        // Remove from active set
        this.activeMessages.delete(messageId);

        // Animate out and remove
        await this.animateOut(element);
        
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }

        // Process queue in case there are waiting messages
        this.processQueue();

        return true;
    }

    /**
     * Hide all messages
     * @returns {number} Number of messages hidden
     */
    async hideAll() {
        const messageIds = Array.from(this.activeMessages);
        let hiddenCount = 0;

        for (const messageId of messageIds) {
            if (await this.hide(messageId)) {
                hiddenCount++;
            }
        }

        return hiddenCount;
    }

    /**
     * Clear all messages immediately (no animation)
     */
    clear() {
        this.container.innerHTML = '';
        this.activeMessages.clear();
        this.messageQueue.length = 0;
    }

    /**
     * Get active message count
     * @returns {number} Number of active messages
     */
    getActiveCount() {
        return this.activeMessages.size;
    }

    /**
     * Get queued message count
     * @returns {number} Number of queued messages
     */
    getQueuedCount() {
        return this.messageQueue.length;
    }

    /**
     * Check if a specific message is active
     * @param {string} messageId - Message ID to check
     * @returns {boolean} True if message is active
     */
    isActive(messageId) {
        return this.activeMessages.has(messageId);
    }

    /**
     * Generate unique message ID
     * @returns {string} Unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${++this.messageIdCounter}`;
    }

    /**
     * Update message position
     * @param {string} position - New position
     */
    setPosition(position) {
        this.container.className = `message-container message-${position}`;
        this.config.position = position;
    }

    /**
     * Update configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = this.deepMerge(this.config, newConfig);
        
        // Re-inject styles if animation settings changed
        if (newConfig.animationDuration || newConfig.spacing) {
            const existingStyles = document.getElementById('message-system-styles');
            if (existingStyles) {
                existingStyles.remove();
            }
            this.injectStyles();
        }
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            activeMessages: this.activeMessages.size,
            queuedMessages: this.messageQueue.length,
            position: this.config.position,
            maxMessages: this.config.maxMessages,
            config: { ...this.config }
        };
    }

    /**
     * Cleanup and destroy the message system
     */
    destroy() {
        this.clear();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        const styles = document.getElementById('message-system-styles');
        if (styles) {
            styles.remove();
        }

        console.log('🗑️ MessageSystem destroyed');
    }
}