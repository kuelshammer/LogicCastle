/**
 * EventSystem - Reusable event management system
 * 
 * Provides a clean event-driven architecture that can be used across all games.
 * Supports event listener management, state protection, and flexible event emission.
 */
class EventSystem {
    constructor() {
        this.eventListeners = {};
        this.stateProtection = true; // Prevent event handlers from modifying game state
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {function} callback - Event handler function
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {function} callback - Event handler function to remove
     */
    off(event, callback) {
        if (!this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index > -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        if (event) {
            delete this.eventListeners[event];
        } else {
            this.eventListeners = {};
        }
    }

    /**
     * Emit event to all registered listeners
     * @param {string} event - Event name
     * @param {*} data - Data to pass to event handlers
     * @param {Object} context - Context object for state protection
     */
    emit(event, data, context = null) {
        if (!this.eventListeners[event]) return;

        // Create protected context if state protection is enabled
        let protectedContext = context;
        if (this.stateProtection && context) {
            protectedContext = this.createProtectedContext(context);
        }

        // Call all event handlers
        this.eventListeners[event].forEach(callback => {
            try {
                callback.call(protectedContext, data);
            } catch (error) {
                // Event handlers should not break the game flow
                console.warn('Event handler error for event', event, ':', error.message);
            }
        });
    }

    /**
     * Create a protected context that prevents modification of game state
     * @param {Object} context - Original context object
     * @returns {Object} Protected context proxy
     */
    createProtectedContext(context) {
        // Create a proxy that prevents modifications to critical game state
        const criticalProperties = ['board', 'currentPlayer', 'gameOver', 'winner', 'moveHistory'];
        
        return new Proxy(context, {
            set(target, property, value) {
                if (criticalProperties.includes(property)) {
                    console.warn(`Event handler attempted to modify protected property: ${property}`);
                    return false; // Prevent modification
                }
                return Reflect.set(target, property, value);
            },
            
            get(target, property) {
                const value = Reflect.get(target, property);
                
                // Return copies of arrays/objects to prevent external modification
                if (Array.isArray(value)) {
                    return [...value];
                }
                if (typeof value === 'object' && value !== null) {
                    return { ...value };
                }
                
                return value;
            }
        });
    }

    /**
     * Check if event has any listeners
     * @param {string} event - Event name
     * @returns {boolean} True if event has listeners
     */
    hasListeners(event) {
        return this.eventListeners[event] && this.eventListeners[event].length > 0;
    }

    /**
     * Get count of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    getListenerCount(event) {
        return this.eventListeners[event] ? this.eventListeners[event].length : 0;
    }

    /**
     * Get all registered events
     * @returns {Array<string>} Array of event names
     */
    getEvents() {
        return Object.keys(this.eventListeners);
    }

    /**
     * Enable or disable state protection
     * @param {boolean} enabled - Whether to enable state protection
     */
    setStateProtection(enabled) {
        this.stateProtection = enabled;
    }

    /**
     * Clear all event listeners (useful for cleanup)
     */
    destroy() {
        this.eventListeners = {};
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventSystem;
} else if (typeof window !== 'undefined') {
    window.EventSystem = EventSystem;
}