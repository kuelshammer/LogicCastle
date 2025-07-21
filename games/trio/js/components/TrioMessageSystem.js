/**
 * TrioMessageSystem - Toast Message Management for Trio
 * 
 * Adapted from Connect4/Gomoku MessageSystem for Trio puzzle feedback.
 * Provides elegant toast notifications with glassmorphism styling.
 * 
 * Features:
 * - Glassmorphism toast messages with trio-themed colors
 * - Auto-dismiss with configurable duration
 * - Multiple message types (success, error, info, warning)
 * - Stack management for multiple messages
 * - Smooth animations with reduced motion support
 * - Trio-specific message content (solutions, hints, errors)
 */

export class TrioMessageSystem {
    constructor(options = {}) {
        this.config = {
            duration: options.duration || 3000,
            position: options.position || 'top-right',
            maxMessages: options.maxMessages || 4,
            ...options
        };
        
        this.messages = [];
        this.container = null;
        this.messageIdCounter = 0;
        
        // Trio-specific color themes
        this.trioThemes = {
            success: {
                background: 'rgba(16, 185, 129, 0.2)', // emerald-500
                border: '1px solid rgba(16, 185, 129, 0.4)',
                icon: '✅',
                iconColor: '#10B981'
            },
            error: {
                background: 'rgba(239, 68, 68, 0.2)', // red-500
                border: '1px solid rgba(239, 68, 68, 0.4)',
                icon: '❌',
                iconColor: '#EF4444'
            },
            info: {
                background: 'rgba(59, 130, 246, 0.2)', // blue-500
                border: '1px solid rgba(59, 130, 246, 0.4)',
                icon: 'ℹ️',
                iconColor: '#3B82F6'
            },
            warning: {
                background: 'rgba(245, 158, 11, 0.2)', // amber-500
                border: '1px solid rgba(245, 158, 11, 0.4)',
                icon: '⚠️',
                iconColor: '#F59E0B'
            },
            trio: {
                background: 'rgba(139, 69, 19, 0.2)', // trio brown theme
                border: '1px solid rgba(139, 69, 19, 0.4)',
                icon: '🎯',
                iconColor: '#8B4513'
            }
        };
        
        // Initialize container
        this.createContainer();
        
        console.log('💬 TrioMessageSystem initialized');
    }
    
    /**
     * Create message container
     * @private
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'trio-message-container';
        
        // Position based on config
        const positionClasses = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
            'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
        };
        
        this.container.style.cssText = `
            position: fixed;
            ${this.config.position.includes('top') ? 'top: 1rem;' : 'bottom: 1rem;'}
            ${this.config.position.includes('right') ? 'right: 1rem;' : 
              this.config.position.includes('left') ? 'left: 1rem;' : 
              'left: 50%; transform: translateX(-50%);'}
            z-index: 1000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-width: 400px;
        `;
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Show a message
     */
    show(text, type = 'info', options = {}) {
        const messageConfig = {
            id: ++this.messageIdCounter,
            text,
            type,
            duration: options.duration || this.config.duration,
            persistent: options.persistent || false,
            calculation: options.calculation || null, // Trio-specific
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
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateX(0)';
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
        
        const theme = this.trioThemes[config.type] || this.trioThemes.info;
        
        // Base styling with glassmorphism
        element.style.cssText = `
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(16px) saturate(180%);
            background: ${theme.background};
            border: ${theme.border};
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            position: relative;
            overflow: hidden;
        `;
        
        // Content HTML
        let contentHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <div style="flex-shrink: 0; font-size: 1.25rem; padding-top: 0.125rem;">
                    ${theme.icon}
                </div>
                <div style="flex: 1; color: white;">
                    <p style="margin: 0; font-size: 0.875rem; font-weight: 500; line-height: 1.5;">
                        ${config.text}
                    </p>
        `;
        
        // Add calculation display for trio-specific messages
        if (config.calculation) {
            contentHTML += `
                <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(255, 255, 255, 0.1); border-radius: 6px; font-family: monospace; font-size: 0.875rem; color: #FCD34D;">
                    ${config.calculation}
                </div>
            `;
        }
        
        contentHTML += `
                </div>
                <button style="flex-shrink: 0; color: rgba(255, 255, 255, 0.6); background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem; transition: color 0.2s;" 
                        onmouseover="this.style.color='rgba(255,255,255,0.9)'" 
                        onmouseout="this.style.color='rgba(255,255,255,0.6)'"
                        onclick="window.trioMessages?.removeMessage(${config.id})">
                    ×
                </button>
            </div>
        `;
        
        element.innerHTML = contentHTML;
        
        // Add shimmer effect for special messages
        if (config.type === 'trio' || config.calculation) {
            this.addShimmerEffect(element);
        }
        
        return element;
    }
    
    /**
     * Add shimmer effect to message
     * @private
     */
    addShimmerEffect(element) {
        const shimmer = document.createElement('div');
        shimmer.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            animation: trio-shimmer 2s infinite;
        `;
        
        element.appendChild(shimmer);
        
        // Add keyframe animation
        if (!document.getElementById('trio-shimmer-style')) {
            const style = document.createElement('style');
            style.id = 'trio-shimmer-style';
            style.textContent = `
                @keyframes trio-shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Remove a message by ID
     */
    removeMessage(messageId) {
        const messageData = this.messages.find(m => m.id === messageId);
        if (!messageData) return;
        
        const element = messageData.element;
        
        // Animate out
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';
        
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
     * Show trio solution message
     */
    showTrioSolution(calculation, positions) {
        return this.show(
            'Trio-Lösung gefunden!',
            'success',
            { 
                calculation: calculation,
                duration: 4000
            }
        );
    }
    
    /**
     * Show invalid trio message
     */
    showInvalidTrio(attempted) {
        return this.show(
            'Ungültige Trio-Kombination',
            'error',
            { duration: 2500 }
        );
    }
    
    /**
     * Show trio hint message
     */
    showTrioHint(hintText, calculation = null) {
        return this.show(
            hintText,
            'trio',
            { 
                calculation: calculation,
                duration: 5000
            }
        );
    }
    
    /**
     * Show new board message
     */
    showNewBoard(targetNumber) {
        return this.show(
            `Neues Puzzle! Zielzahl: ${targetNumber}`,
            'info',
            { duration: 3000 }
        );
    }
    
    /**
     * Show difficulty change message
     */
    showDifficultyChange(newDifficulty) {
        const difficultyNames = {
            'kinderfreundlich': 'Kinderfreundlich',
            'vollspektrum': 'Vollspektrum',
            'strategisch': 'Strategisch',
            'analytisch': 'Analytisch'
        };
        
        return this.show(
            `Schwierigkeit: ${difficultyNames[newDifficulty] || newDifficulty}`,
            'info',
            { duration: 2500 }
        );
    }
    
    /**
     * Show statistics message
     */
    showStatistics(stats) {
        return this.show(
            `${stats.solutionsFound} Lösungen in ${stats.totalMoves} Zügen`,
            'trio',
            { duration: 4000 }
        );
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
     * Set custom theme colors
     */
    setTrioTheme(customThemes = {}) {
        Object.assign(this.trioThemes, customThemes);
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.clear();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Remove shimmer styles
        const shimmerStyle = document.getElementById('trio-shimmer-style');
        if (shimmerStyle) {
            shimmerStyle.remove();
        }
        
        this.container = null;
        this.messages = [];
        
        console.log('💬 TrioMessageSystem destroyed');
    }
}

export default TrioMessageSystem;