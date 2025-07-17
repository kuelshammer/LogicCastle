/**
 * EventDispatcher - Centralized event management for game UIs
 * 
 * Provides a consistent event system for decoupling UI components
 * and managing communication between game logic and UI elements.
 * 
 * Features:
 * - Type-safe event handling
 * - Event listener lifecycle management
 * - Event debugging and logging
 * - Automatic cleanup on destroy
 */

export class EventDispatcher {
    constructor(config = {}) {
        this.config = {
            enableLogging: config.enableLogging || false,
            maxListeners: config.maxListeners || 50,
            validateEventTypes: config.validateEventTypes !== false
        };
        
        this.listeners = new Map();
        this.eventTypes = new Set();
        this.isDestroyed = false;
    }

    /**
     * Register available event types for validation
     * @param {string[]} types - Array of valid event type names
     */
    registerEventTypes(types) {
        types.forEach(type => this.eventTypes.add(type));
        
        if (this.config.enableLogging) {
            console.log(`📡 Registered event types: ${types.join(', ')}`);
        }
    }

    /**
     * Add an event listener
     * @param {string} eventType - The event type to listen for
     * @param {Function} callback - The callback function
     * @param {Object} options - Listener options
     * @returns {Function} Cleanup function to remove the listener
     */
    on(eventType, callback, options = {}) {
        if (this.isDestroyed) {
            console.warn('⚠️ Attempted to add listener to destroyed EventDispatcher');
            return () => {};
        }

        // Validate event type if validation is enabled
        if (this.config.validateEventTypes && this.eventTypes.size > 0) {
            if (!this.eventTypes.has(eventType)) {
                console.warn(`⚠️ Unknown event type: ${eventType}. Known types: ${Array.from(this.eventTypes).join(', ')}`);
            }
        }

        // Validate callback
        if (typeof callback !== 'function') {
            throw new Error(`Event callback must be a function, got ${typeof callback}`);
        }

        // Initialize listener array for this event type
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }

        const listeners = this.listeners.get(eventType);
        
        // Check listener limit
        if (listeners.length >= this.config.maxListeners) {
            console.warn(`⚠️ Maximum listeners (${this.config.maxListeners}) reached for event type: ${eventType}`);
        }

        // Create listener object
        const listener = {
            callback,
            options: {
                once: options.once || false,
                priority: options.priority || 0,
                context: options.context || null
            },
            id: this.generateListenerId()
        };

        // Insert listener based on priority (higher priority first)
        const insertIndex = listeners.findIndex(l => l.options.priority < listener.options.priority);
        if (insertIndex === -1) {
            listeners.push(listener);
        } else {
            listeners.splice(insertIndex, 0, listener);
        }

        if (this.config.enableLogging) {
            console.debug(`📡 Added listener for '${eventType}' (priority: ${listener.options.priority})`);
        }

        // Return cleanup function
        return () => this.removeListener(eventType, listener.id);
    }

    /**
     * Add a one-time event listener
     * @param {string} eventType - The event type to listen for
     * @param {Function} callback - The callback function
     * @param {Object} options - Listener options
     * @returns {Function} Cleanup function
     */
    once(eventType, callback, options = {}) {
        return this.on(eventType, callback, { ...options, once: true });
    }

    /**
     * Remove an event listener
     * @param {string} eventType - The event type
     * @param {string} listenerId - The listener ID to remove
     */
    removeListener(eventType, listenerId) {
        if (!this.listeners.has(eventType)) {
            return false;
        }

        const listeners = this.listeners.get(eventType);
        const index = listeners.findIndex(l => l.id === listenerId);
        
        if (index > -1) {
            listeners.splice(index, 1);
            
            // Clean up empty event type
            if (listeners.length === 0) {
                this.listeners.delete(eventType);
            }
            
            if (this.config.enableLogging) {
                console.debug(`📡 Removed listener for '${eventType}'`);
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Remove all listeners for an event type
     * @param {string} eventType - The event type to clear
     */
    removeAllListeners(eventType) {
        if (eventType) {
            const removed = this.listeners.has(eventType) ? this.listeners.get(eventType).length : 0;
            this.listeners.delete(eventType);
            
            if (this.config.enableLogging && removed > 0) {
                console.debug(`📡 Removed ${removed} listeners for '${eventType}'`);
            }
            
            return removed;
        } else {
            // Remove all listeners for all event types
            const totalRemoved = Array.from(this.listeners.values())
                .reduce((sum, listeners) => sum + listeners.length, 0);
            
            this.listeners.clear();
            
            if (this.config.enableLogging && totalRemoved > 0) {
                console.debug(`📡 Removed all ${totalRemoved} listeners`);
            }
            
            return totalRemoved;
        }
    }

    /**
     * Emit an event to all registered listeners
     * @param {string} eventType - The event type to emit
     * @param {*} data - The event data
     * @returns {boolean} True if the event had listeners
     */
    emit(eventType, data = null) {
        if (this.isDestroyed) {
            console.warn('⚠️ Attempted to emit event on destroyed EventDispatcher');
            return false;
        }

        if (!this.listeners.has(eventType)) {
            if (this.config.enableLogging) {
                console.debug(`📡 No listeners for event '${eventType}'`);
            }
            return false;
        }

        const listeners = [...this.listeners.get(eventType)]; // Copy to avoid modification during iteration
        let callbackCount = 0;

        if (this.config.enableLogging) {
            console.debug(`📡 Emitting '${eventType}' to ${listeners.length} listeners`, data);
        }

        for (const listener of listeners) {
            try {
                // Call callback with proper context
                if (listener.options.context) {
                    listener.callback.call(listener.options.context, data);
                } else {
                    listener.callback(data);
                }
                
                callbackCount++;

                // Remove one-time listeners
                if (listener.options.once) {
                    this.removeListener(eventType, listener.id);
                }
                
            } catch (error) {
                console.error(`❌ Error in event listener for '${eventType}':`, error);
                // Continue with other listeners even if one fails
            }
        }

        if (this.config.enableLogging) {
            console.debug(`📡 Called ${callbackCount} listeners for '${eventType}'`);
        }

        return callbackCount > 0;
    }

    /**
     * Check if there are listeners for an event type
     * @param {string} eventType - The event type to check
     * @returns {boolean} True if there are listeners
     */
    hasListeners(eventType) {
        return this.listeners.has(eventType) && this.listeners.get(eventType).length > 0;
    }

    /**
     * Get the number of listeners for an event type
     * @param {string} eventType - The event type to check
     * @returns {number} Number of listeners
     */
    getListenerCount(eventType) {
        return this.listeners.has(eventType) ? this.listeners.get(eventType).length : 0;
    }

    /**
     * Get all event types that have listeners
     * @returns {string[]} Array of event types
     */
    getEventTypes() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Generate a unique listener ID
     * @returns {string} Unique listener ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create a namespaced event dispatcher for a specific component
     * @param {string} namespace - The namespace prefix
     * @returns {Object} Namespaced event methods
     */
    createNamespace(namespace) {
        return {
            on: (eventType, callback, options) => 
                this.on(`${namespace}:${eventType}`, callback, options),
            
            once: (eventType, callback, options) => 
                this.once(`${namespace}:${eventType}`, callback, options),
            
            emit: (eventType, data) => 
                this.emit(`${namespace}:${eventType}`, data),
            
            removeAllListeners: (eventType) => 
                this.removeAllListeners(eventType ? `${namespace}:${eventType}` : undefined)
        };
    }

    /**
     * Get debugging information about the event dispatcher
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const eventInfo = {};
        
        for (const [eventType, listeners] of this.listeners) {
            eventInfo[eventType] = {
                listenerCount: listeners.length,
                listeners: listeners.map(l => ({
                    id: l.id,
                    priority: l.options.priority,
                    once: l.options.once,
                    hasContext: !!l.options.context
                }))
            };
        }

        return {
            totalEventTypes: this.listeners.size,
            totalListeners: Array.from(this.listeners.values())
                .reduce((sum, listeners) => sum + listeners.length, 0),
            registeredEventTypes: Array.from(this.eventTypes),
            eventInfo,
            config: { ...this.config },
            isDestroyed: this.isDestroyed
        };
    }

    /**
     * Cleanup all event listeners and destroy the dispatcher
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }

        const totalListeners = this.removeAllListeners();
        this.eventTypes.clear();
        this.isDestroyed = true;

        if (this.config.enableLogging) {
            console.log(`🗑️ EventDispatcher destroyed, removed ${totalListeners} listeners`);
        }
    }
}