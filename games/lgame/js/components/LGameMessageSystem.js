/**
 * LGameMessageSystem - L-Game Toast Notifications & Messages
 * 
 * Adapted from Connect4/Gomoku MessageSystem for L-Game specific notifications.
 * Handles user feedback, game events, and system messages with glassmorphism design.
 * 
 * Responsibilities:
 * - Toast notifications
 * - Game event messages
 * - Error handling feedback
 * - Success confirmations
 * - Auto-dismiss system
 */

export class LGameMessageSystem {
    constructor() {
        // Message state
        this.messages = new Map();
        this.messageCounter = 0;
        this.defaultDuration = 3000; // 3 seconds
        this.maxMessages = 5;
        
        // Container element
        this.container = null;
        this.initialized = false;
        
        // Message types configuration
        this.messageTypes = {
            'info': {
                icon: 'ℹ️',
                className: 'message-info',
                color: 'bg-blue-500/90'
            },
            'success': {
                icon: '✅',
                className: 'message-success', 
                color: 'bg-emerald-500/90'
            },
            'warning': {
                icon: '⚠️',
                className: 'message-warning',
                color: 'bg-amber-500/90'
            },
            'error': {
                icon: '❌',
                className: 'message-error',
                color: 'bg-red-500/90'
            },
            'game': {
                icon: '🧩',
                className: 'message-game',
                color: 'bg-violet-500/90'
            },
            'victory': {
                icon: '🏆',
                className: 'message-victory',
                color: 'bg-gradient-to-r from-yellow-400 to-orange-500'
            }
        };
    }

    /**
     * Initialize message system
     */
    async init() {
        this.createMessageContainer();
        this.bindEvents();
        this.initialized = true;
        console.log('💬 L-Game MessageSystem initialized');
        return true;
    }

    /**
     * Create message container
     * @private
     */
    createMessageContainer() {
        // Remove existing container if present
        const existing = document.getElementById('lgame-message-container');
        if (existing) existing.remove();

        // Create new container
        this.container = document.createElement('div');
        this.container.id = 'lgame-message-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2 pointer-events-none';
        this.container.style.maxWidth = '400px';
        
        document.body.appendChild(this.container);
    }

    /**
     * Bind global events for automatic messages
     * @private
     */
    bindEvents() {
        // Listen for custom L-Game events
        document.addEventListener('lgame:move', (event) => {
            const { player, move } = event.detail;
            this.showMessage(
                `${player} bewegte L-Stück nach (${move.row + 1}, ${move.col + 1})`,
                'game',
                2000
            );
        });

        document.addEventListener('lgame:victory', (event) => {
            const { winner } = event.detail;
            this.showMessage(
                `🎉 ${winner} hat gewonnen!`,
                'victory',
                5000
            );
        });

        document.addEventListener('lgame:blockade', (event) => {
            const { player } = event.detail;
            this.showMessage(
                `⚠️ ${player} ist blockiert und kann nicht mehr ziehen!`,
                'warning',
                4000
            );
        });

        document.addEventListener('lgame:error', (event) => {
            const { message } = event.detail;
            this.showMessage(message, 'error', 4000);
        });

        // Listen for WASM integration events
        document.addEventListener('wasm:loaded', () => {
            this.showMessage('🦀 WASM Engine geladen', 'success', 2000);
        });

        document.addEventListener('wasm:fallback', () => {
            this.showMessage('🔄 Fallback zu JavaScript Engine', 'warning', 3000);
        });
    }

    /**
     * Show a message
     * @param {string} text - Message text
     * @param {string} type - Message type (info, success, warning, error, game, victory)
     * @param {number} duration - Display duration in milliseconds (0 = no auto-dismiss)
     * @param {Object} options - Additional options
     */
    showMessage(text, type = 'info', duration = null, options = {}) {
        if (!this.initialized) {
            console.warn('💬 MessageSystem not initialized');
            return null;
        }

        // Use default duration if not specified
        if (duration === null) {
            duration = this.defaultDuration;
        }

        // Create message object
        const messageId = this.generateMessageId();
        const message = {
            id: messageId,
            text,
            type,
            duration,
            timestamp: Date.now(),
            options: { ...options }
        };

        // Create and display message element
        const messageElement = this.createMessageElement(message);
        this.addMessageToContainer(messageElement, message);

        // Auto-dismiss if duration is set
        if (duration > 0) {
            setTimeout(() => {
                this.dismissMessage(messageId);
            }, duration);
        }

        // Limit number of messages
        this.enforceMessageLimit();

        console.log(`💬 Message shown: ${text} (${type})`);
        return messageId;
    }

    /**
     * Create message DOM element
     * @private
     */
    createMessageElement(message) {
        const { text, type, options } = message;
        const typeConfig = this.messageTypes[type] || this.messageTypes['info'];

        const messageEl = document.createElement('div');
        messageEl.id = `message-${message.id}`;
        messageEl.className = `
            lgame-message pointer-events-auto transform translate-x-full 
            transition-all duration-300 ease-out opacity-0
        `;

        // Apply glassmorphism styling
        messageEl.style.cssText = `
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 100%;
            min-width: 300px;
        `;

        // Create message content
        const content = document.createElement('div');
        content.className = 'flex items-start space-x-3';

        // Icon
        const icon = document.createElement('div');
        icon.className = 'flex-shrink-0 text-lg';
        icon.textContent = typeConfig.icon;

        // Text content
        const textContent = document.createElement('div');
        textContent.className = 'flex-1 min-w-0';
        
        const textEl = document.createElement('p');
        textEl.className = 'text-white font-medium text-sm leading-5';
        textEl.textContent = text;
        textContent.appendChild(textEl);

        // Timestamp (if enabled in options)
        if (options.showTimestamp) {
            const timeEl = document.createElement('p');
            timeEl.className = 'text-gray-300 text-xs mt-1';
            timeEl.textContent = new Date(message.timestamp).toLocaleTimeString();
            textContent.appendChild(timeEl);
        }

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = `
            flex-shrink-0 text-white/70 hover:text-white 
            transition-colors duration-200 ml-3
        `;
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => this.dismissMessage(message.id);

        // Assemble content
        content.appendChild(icon);
        content.appendChild(textContent);
        content.appendChild(closeBtn);
        messageEl.appendChild(content);

        // Add type-specific styling
        if (type === 'victory') {
            messageEl.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(249, 115, 22, 0.9))';
            
            // Add victory sparkle effect
            const sparkle = document.createElement('div');
            sparkle.className = 'absolute inset-0 pointer-events-none';
            sparkle.style.background = `
                radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
                radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
            `;
            messageEl.appendChild(sparkle);
        } else if (type === 'error') {
            messageEl.style.background = 'rgba(239, 68, 68, 0.9)';
            messageEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        } else if (type === 'success') {
            messageEl.style.background = 'rgba(34, 197, 94, 0.9)';
            messageEl.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        } else if (type === 'warning') {
            messageEl.style.background = 'rgba(245, 158, 11, 0.9)';
            messageEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        } else if (type === 'game') {
            messageEl.style.background = 'rgba(139, 92, 246, 0.9)';
            messageEl.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        }

        return messageEl;
    }

    /**
     * Add message to container with animation
     * @private
     */
    addMessageToContainer(messageElement, message) {
        this.container.appendChild(messageElement);
        this.messages.set(message.id, { element: messageElement, data: message });

        // Trigger entrance animation
        requestAnimationFrame(() => {
            messageElement.classList.remove('translate-x-full', 'opacity-0');
            messageElement.classList.add('translate-x-0', 'opacity-100');
        });
    }

    /**
     * Dismiss a specific message
     * @param {string} messageId - ID of message to dismiss
     */
    dismissMessage(messageId) {
        const messageData = this.messages.get(messageId);
        if (!messageData) return;

        const { element } = messageData;

        // Exit animation
        element.classList.add('translate-x-full', 'opacity-0');
        element.classList.remove('translate-x-0', 'opacity-100');

        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.messages.delete(messageId);
        }, 300);
    }

    /**
     * Dismiss all messages
     */
    dismissAll() {
        const messageIds = Array.from(this.messages.keys());
        messageIds.forEach(id => this.dismissMessage(id));
    }

    /**
     * Enforce maximum message limit
     * @private
     */
    enforceMessageLimit() {
        if (this.messages.size > this.maxMessages) {
            // Get oldest messages
            const sortedMessages = Array.from(this.messages.entries())
                .sort((a, b) => a[1].data.timestamp - b[1].data.timestamp);
            
            // Remove oldest messages
            const toRemove = sortedMessages.slice(0, this.messages.size - this.maxMessages);
            toRemove.forEach(([id]) => this.dismissMessage(id));
        }
    }

    /**
     * Generate unique message ID
     * @private
     */
    generateMessageId() {
        return `msg-${++this.messageCounter}-${Date.now()}`;
    }

    /**
     * Show success message (convenience method)
     */
    showSuccess(text, duration = 3000) {
        return this.showMessage(text, 'success', duration);
    }

    /**
     * Show error message (convenience method)
     */
    showError(text, duration = 4000) {
        return this.showMessage(text, 'error', duration);
    }

    /**
     * Show warning message (convenience method)
     */
    showWarning(text, duration = 3500) {
        return this.showMessage(text, 'warning', duration);
    }

    /**
     * Show info message (convenience method)
     */
    showInfo(text, duration = 2500) {
        return this.showMessage(text, 'info', duration);
    }

    /**
     * Show game message (convenience method)
     */
    showGameMessage(text, duration = 2000) {
        return this.showMessage(text, 'game', duration);
    }

    /**
     * Show victory message (convenience method)
     */
    showVictory(text, duration = 5000) {
        return this.showMessage(text, 'victory', duration);
    }

    /**
     * Get message system statistics
     */
    getStats() {
        return {
            totalMessages: this.messageCounter,
            activeMessages: this.messages.size,
            maxMessages: this.maxMessages,
            initialized: this.initialized
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config) {
        if (config.defaultDuration !== undefined) {
            this.defaultDuration = config.defaultDuration;
        }
        if (config.maxMessages !== undefined) {
            this.maxMessages = config.maxMessages;
        }
    }

    /**
     * Cleanup message system
     */
    destroy() {
        this.dismissAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.messages.clear();
        this.initialized = false;
    }
}