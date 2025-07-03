/**
 * KeyboardController - Centralized keyboard shortcut management
 * 
 * Eliminates duplicate keyboard handling code found in every game UI.
 * Provides consistent keyboard shortcuts across all games with conflict resolution.
 * 
 * Features:
 * - Configurable key bindings
 * - Key combination support (Ctrl+Z, etc.)
 * - Context-aware activation/deactivation
 * - Conflict detection and resolution
 * - Debug mode for testing
 */

export class KeyboardController {
    constructor(config = {}) {
        this.config = this.mergeDefaultConfig(config);
        this.shortcuts = new Map();
        this.isEnabled = false;
        this.context = 'default';
        this.keySequence = [];
        this.sequenceTimeout = null;
        
        this.boundHandler = this.handleKeyDown.bind(this);
        this.init();
    }

    /**
     * Merge user config with defaults
     */
    mergeDefaultConfig(userConfig) {
        const defaultConfig = {
            // Standard game shortcuts
            'F1': 'toggleHelp',
            'Escape': 'closeModal',
            
            // Global shortcuts
            globalShortcuts: true,
            sequenceTimeout: 1000, // ms for key sequences
            preventDefaults: true,
            enableLogging: false,
            
            // Context-specific shortcuts
            contexts: {
                default: userConfig,
                modal: {
                    'Escape': 'closeModal',
                    'F1': 'toggleHelp'
                },
                game: userConfig
            }
        };

        return { ...defaultConfig, ...userConfig };
    }

    /**
     * Initialize the keyboard controller
     */
    init() {
        this.registerDefaultShortcuts();
        this.enable();
        
        console.log(`⌨️ KeyboardController initialized with ${this.shortcuts.size} shortcuts`);
    }

    /**
     * Register default shortcuts from config
     */
    registerDefaultShortcuts() {
        for (const [key, action] of Object.entries(this.config)) {
            if (typeof action === 'string') {
                this.register(key, action);
            }
        }
    }

    /**
     * Register a keyboard shortcut
     * @param {string} keyCombo - Key combination (e.g., 'F1', 'Ctrl+Z', 'Shift+F1')
     * @param {string|Function} action - Action name or callback function
     * @param {Object} options - Additional options
     */
    register(keyCombo, action, options = {}) {
        const normalizedKey = this.normalizeKeyCombo(keyCombo);
        
        if (this.shortcuts.has(normalizedKey)) {
            console.warn(`⚠️ Keyboard shortcut conflict: ${keyCombo} already registered`);
        }

        const shortcut = {
            keyCombo: normalizedKey,
            action,
            options: {
                context: options.context || 'default',
                preventDefault: options.preventDefault !== false,
                stopPropagation: options.stopPropagation || false,
                enabled: options.enabled !== false,
                description: options.description || ''
            }
        };

        this.shortcuts.set(normalizedKey, shortcut);
        
        if (this.config.enableLogging) {
            console.debug(`⌨️ Registered shortcut: ${keyCombo} → ${action}`);
        }
    }

    /**
     * Unregister a keyboard shortcut
     * @param {string} keyCombo - Key combination to remove
     */
    unregister(keyCombo) {
        const normalizedKey = this.normalizeKeyCombo(keyCombo);
        const removed = this.shortcuts.delete(normalizedKey);
        
        if (removed && this.config.enableLogging) {
            console.debug(`⌨️ Unregistered shortcut: ${keyCombo}`);
        }
        
        return removed;
    }

    /**
     * Enable keyboard handling
     */
    enable() {
        if (this.isEnabled) {
            return;
        }

        document.addEventListener('keydown', this.boundHandler);
        this.isEnabled = true;
        
        if (this.config.enableLogging) {
            console.debug('⌨️ Keyboard controller enabled');
        }
    }

    /**
     * Disable keyboard handling
     */
    disable() {
        if (!this.isEnabled) {
            return;
        }

        document.removeEventListener('keydown', this.boundHandler);
        this.isEnabled = false;
        
        if (this.config.enableLogging) {
            console.debug('⌨️ Keyboard controller disabled');
        }
    }

    /**
     * Set the current context
     * @param {string} context - The context name
     */
    setContext(context) {
        this.context = context;
        
        if (this.config.enableLogging) {
            console.debug(`⌨️ Context changed to: ${context}`);
        }
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        if (!this.isEnabled) {
            return;
        }

        // Check if we should ignore this event
        if (this.shouldIgnoreEvent(event)) {
            return;
        }

        const keyCombo = this.eventToKeyCombo(event);
        const shortcut = this.shortcuts.get(keyCombo);

        if (shortcut && this.isShortcutActive(shortcut)) {
            if (this.config.enableLogging) {
                console.debug(`⌨️ Executing shortcut: ${keyCombo} → ${shortcut.action}`);
            }

            // Prevent default behavior if configured
            if (shortcut.options.preventDefault) {
                event.preventDefault();
            }

            if (shortcut.options.stopPropagation) {
                event.stopPropagation();
            }

            // Execute the action
            this.executeAction(shortcut.action, event);
        }
    }

    /**
     * Check if we should ignore this keyboard event
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {boolean} True if the event should be ignored
     */
    shouldIgnoreEvent(event) {
        // Ignore events from input elements unless specifically allowed
        const target = event.target;
        const tagName = target.tagName.toLowerCase();
        const inputElements = ['input', 'textarea', 'select'];
        
        if (inputElements.includes(tagName)) {
            // Allow certain keys even in input elements
            const allowedInInputs = ['F1', 'F2', 'Escape'];
            return !allowedInInputs.includes(event.key);
        }

        // Ignore if target has contenteditable
        if (target.contentEditable === 'true') {
            return true;
        }

        return false;
    }

    /**
     * Convert keyboard event to normalized key combination
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {string} Normalized key combination
     */
    eventToKeyCombo(event) {
        const parts = [];
        
        // Add modifiers in consistent order
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        if (event.metaKey) parts.push('Meta');
        
        // Add the main key
        parts.push(event.key);
        
        return parts.join('+');
    }

    /**
     * Normalize key combination string
     * @param {string} keyCombo - Key combination string
     * @returns {string} Normalized key combination
     */
    normalizeKeyCombo(keyCombo) {
        const parts = keyCombo.split('+').map(part => part.trim());
        const modifiers = [];
        let mainKey = '';

        // Separate modifiers from main key
        for (const part of parts) {
            const normalized = this.normalizeKeyName(part);
            
            if (['Ctrl', 'Alt', 'Shift', 'Meta'].includes(normalized)) {
                if (!modifiers.includes(normalized)) {
                    modifiers.push(normalized);
                }
            } else {
                mainKey = normalized;
            }
        }

        // Sort modifiers consistently
        modifiers.sort();
        
        return [...modifiers, mainKey].join('+');
    }

    /**
     * Normalize individual key names
     * @param {string} key - Key name
     * @returns {string} Normalized key name
     */
    normalizeKeyName(key) {
        const keyMap = {
            'control': 'Ctrl',
            'ctrl': 'Ctrl',
            'alt': 'Alt',
            'shift': 'Shift',
            'meta': 'Meta',
            'cmd': 'Meta',
            'command': 'Meta',
            'esc': 'Escape',
            'escape': 'Escape',
            'space': ' ',
            'spacebar': ' ',
            'enter': 'Enter',
            'return': 'Enter',
            'tab': 'Tab',
            'backspace': 'Backspace',
            'delete': 'Delete',
            'del': 'Delete'
        };

        const lower = key.toLowerCase();
        return keyMap[lower] || key;
    }

    /**
     * Check if a shortcut is active in the current context
     * @param {Object} shortcut - The shortcut object
     * @returns {boolean} True if the shortcut is active
     */
    isShortcutActive(shortcut) {
        if (!shortcut.options.enabled) {
            return false;
        }

        // Check context
        const shortcutContext = shortcut.options.context;
        return shortcutContext === 'default' || shortcutContext === this.context;
    }

    /**
     * Execute a shortcut action
     * @param {string|Function} action - The action to execute
     * @param {KeyboardEvent} event - The keyboard event
     */
    executeAction(action, event) {
        if (typeof action === 'function') {
            // Direct function callback
            action(event);
        } else if (typeof action === 'string') {
            // Action name - emit event for external handlers
            this.emitActionEvent(action, event);
        }
    }

    /**
     * Emit an action event for external handlers
     * @param {string} actionName - The action name
     * @param {KeyboardEvent} originalEvent - The original keyboard event
     */
    emitActionEvent(actionName, originalEvent) {
        const actionEvent = new CustomEvent('keyboard:action', {
            detail: {
                action: actionName,
                originalEvent,
                controller: this
            }
        });

        document.dispatchEvent(actionEvent);
    }

    /**
     * Register multiple shortcuts at once
     * @param {Object} shortcuts - Object mapping key combos to actions
     * @param {Object} defaultOptions - Default options for all shortcuts
     */
    registerMultiple(shortcuts, defaultOptions = {}) {
        let registeredCount = 0;
        
        for (const [keyCombo, action] of Object.entries(shortcuts)) {
            this.register(keyCombo, action, defaultOptions);
            registeredCount++;
        }
        
        console.log(`⌨️ Registered ${registeredCount} shortcuts`);
        return registeredCount;
    }

    /**
     * Enable or disable a specific shortcut
     * @param {string} keyCombo - The key combination
     * @param {boolean} enabled - Whether to enable or disable
     */
    setShortcutEnabled(keyCombo, enabled) {
        const normalizedKey = this.normalizeKeyCombo(keyCombo);
        const shortcut = this.shortcuts.get(normalizedKey);
        
        if (shortcut) {
            shortcut.options.enabled = enabled;
            
            if (this.config.enableLogging) {
                console.debug(`⌨️ Shortcut ${keyCombo} ${enabled ? 'enabled' : 'disabled'}`);
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Get all registered shortcuts
     * @param {string} context - Optional context filter
     * @returns {Array} Array of shortcut information
     */
    getShortcuts(context = null) {
        const shortcuts = [];
        
        for (const [keyCombo, shortcut] of this.shortcuts) {
            if (!context || shortcut.options.context === context) {
                shortcuts.push({
                    keyCombo,
                    action: shortcut.action,
                    context: shortcut.options.context,
                    enabled: shortcut.options.enabled,
                    description: shortcut.options.description
                });
            }
        }
        
        return shortcuts;
    }

    /**
     * Check for shortcut conflicts
     * @returns {Array} Array of conflicts
     */
    checkConflicts() {
        const conflicts = [];
        const contextGroups = {};
        
        // Group shortcuts by context
        for (const [keyCombo, shortcut] of this.shortcuts) {
            const context = shortcut.options.context;
            
            if (!contextGroups[context]) {
                contextGroups[context] = new Map();
            }
            
            if (contextGroups[context].has(keyCombo)) {
                conflicts.push({
                    keyCombo,
                    context,
                    actions: [contextGroups[context].get(keyCombo), shortcut.action]
                });
            } else {
                contextGroups[context].set(keyCombo, shortcut.action);
            }
        }
        
        return conflicts;
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            context: this.context,
            shortcutCount: this.shortcuts.size,
            shortcuts: this.getShortcuts(),
            conflicts: this.checkConflicts(),
            config: { ...this.config }
        };
    }

    /**
     * Create a help text for all shortcuts
     * @param {string} context - Optional context filter
     * @returns {string} Formatted help text
     */
    generateHelpText(context = null) {
        const shortcuts = this.getShortcuts(context);
        
        if (shortcuts.length === 0) {
            return 'No keyboard shortcuts available.';
        }

        let helpText = 'Keyboard Shortcuts:\n\n';
        
        shortcuts.forEach(shortcut => {
            const description = shortcut.description || shortcut.action;
            helpText += `${shortcut.keyCombo}: ${description}\n`;
        });
        
        return helpText;
    }

    /**
     * Cleanup and destroy the keyboard controller
     */
    destroy() {
        this.disable();
        this.shortcuts.clear();
        
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }
        
        console.log('🗑️ KeyboardController destroyed');
    }
}