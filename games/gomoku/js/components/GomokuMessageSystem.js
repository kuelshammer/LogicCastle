/**
 * GomokuMessageSystem - Toast Message Management for Gomoku
 * 
 * Adapted from Connect4 MessageSystem for Gomoku UI feedback.
 * Provides elegant toast notifications with Tailwind CSS styling.
 * 
 * Features:
 * - Glassmorphism toast messages
 * - Auto-dismiss with configurable duration
 * - Multiple message types (info, success, error, warning)
 * - Stack management for multiple messages
 * - Smooth animations with reduced motion support
 */

export class GomokuMessageSystem {
    constructor(options = {}) {
        this.config = {
            duration: options.duration || 3000,
            position: options.position || 'top-right',
            maxMessages: options.maxMessages || 5,
            ...options
        };
        
        this.messages = [];
        this.container = null;
        this.messageIdCounter = 0;
        
        // Initialize container
        this.createContainer();
        
        console.log('💬 GomokuMessageSystem initialized');
    }
    
    /**
     * Create message container
     * @private
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'gomoku-message-container';
        
        // Position based on config
        const positionClasses = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
            'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
        };
        
        this.container.className = `fixed ${positionClasses[this.config.position]} z-50 space-y-3 pointer-events-none`;
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Show a message
     * @param {string} text - Message text
     * @param {string} type - Message type (info, success, error, warning)
     * @param {Object} options - Additional options
     */
    show(text, type = 'info', options = {}) {
        const messageConfig = {
            id: ++this.messageIdCounter,
            text,
            type,
            duration: options.duration || this.config.duration,
            persistent: options.persistent || false,
            ...options
        };
        
        // Remove excess messages
        while (this.messages.length >= this.config.maxMessages) {
            this.removeMessage(this.messages[0].id);
        }
        
        // Create message element
        const messageElement = this.createMessageElement(messageConfig);
        
        // Add to container
        this.container.appendChild(messageElement);
        
        // Store message data
        this.messages.push({
            id: messageConfig.id,
            element: messageElement,
            config: messageConfig
        });
        
        // Animate in
        requestAnimationFrame(() => {
            messageElement.classList.remove('opacity-0', 'translate-x-full');
            messageElement.classList.add('opacity-100', 'translate-x-0');
        });
        
        // Auto-dismiss if not persistent
        if (!messageConfig.persistent) {
            setTimeout(() => {
                this.removeMessage(messageConfig.id);
            }, messageConfig.duration);
        }
        
        return messageConfig.id;
    }
    
    /**
     * Create message element
     * @private
     */
    createMessageElement(config) {
        const element = document.createElement('div');
        element.dataset.messageId = config.id;
        
        // Base classes with glassmorphism
        let classes = 'pointer-events-auto transform transition-all duration-500 ease-out opacity-0 translate-x-full max-w-sm glass glass-hover rounded-xl p-4 shadow-lg';
        
        // Type-specific styling
        const typeStyles = {
            info: 'border-l-4 border-blue-400',
            success: 'border-l-4 border-green-400',
            error: 'border-l-4 border-red-400',
            warning: 'border-l-4 border-yellow-400'
        };
        
        classes += ` ${typeStyles[config.type] || typeStyles.info}`;
        element.className = classes;
        
        // Content
        element.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0 pt-0.5">
                    ${this.getTypeIcon(config.type)}
                </div>
                <div class="flex-1 text-white">
                    <p class="text-sm font-medium leading-relaxed">${config.text}</p>
                </div>
                <button class="flex-shrink-0 text-white/60 hover:text-white/80 transition-colors" onclick="window.gomokuMessageSystem?.removeMessage(${config.id})">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        return element;
    }
    
    /**
     * Get icon for message type
     * @private
     */
    getTypeIcon(type) {
        const icons = {
            info: `<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            success: `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            error: `<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            warning: `<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>`
        };
        
        return icons[type] || icons.info;
    }
    
    /**
     * Remove a message by ID
     */
    removeMessage(messageId) {
        const messageData = this.messages.find(m => m.id === messageId);
        if (!messageData) return;
        
        const element = messageData.element;
        
        // Animate out
        element.classList.remove('opacity-100', 'translate-x-0');
        element.classList.add('opacity-0', 'translate-x-full');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Remove from messages array
            const index = this.messages.findIndex(m => m.id === messageId);
            if (index !== -1) {
                this.messages.splice(index, 1);
            }
        }, 500);
    }
    
    /**
     * Show info message
     */
    info(text, options = {}) {
        return this.show(text, 'info', options);
    }
    
    /**
     * Show success message
     */
    success(text, options = {}) {
        return this.show(text, 'success', options);
    }
    
    /**
     * Show error message
     */
    error(text, options = {}) {
        return this.show(text, 'error', options);
    }
    
    /**
     * Show warning message
     */
    warning(text, options = {}) {
        return this.show(text, 'warning', options);
    }
    
    /**
     * Clear all messages
     */
    clear() {
        [...this.messages].forEach(message => {
            this.removeMessage(message.id);
        });
    }
    
    /**
     * Update configuration
     */
    configure(options = {}) {
        Object.assign(this.config, options);
    }
    
    /**
     * Get current messages count
     */
    getMessageCount() {
        return this.messages.length;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.clear();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.container = null;
        this.messages = [];
        
        console.log('💬 GomokuMessageSystem destroyed');
    }
}

export default GomokuMessageSystem;