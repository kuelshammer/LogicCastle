/**
 * LogicCastle UI Modules - Barrel Export
 * 
 * Central export point for all UI modules to simplify imports
 * and provide a consistent API for games to use.
 */

// Core modules
export { BaseGameUI } from './core/BaseGameUI.js';
export { ElementBinder } from './core/ElementBinder.js';
export { EventDispatcher } from './core/EventDispatcher.js';

// Component modules
export { ModalManager } from './components/ModalManager.js';
export { KeyboardController } from './components/KeyboardController.js';
export { MessageSystem } from './components/MessageSystem.js';

// Version and metadata
export const VERSION = '1.0.0';
export const BUILD_DATE = '2025-07-03';

/**
 * Create a pre-configured UI setup for common game patterns
 * @param {Object} game - Game instance
 * @param {Object} config - UI configuration
 * @returns {BaseGameUI} Configured UI instance
 */
export function createGameUI(game, config = {}) {
    return new BaseGameUI(game, config);
}

/**
 * Create a minimal UI setup with just essential modules
 * @param {Object} game - Game instance
 * @param {Object} config - UI configuration
 * @returns {BaseGameUI} Minimal UI instance
 */
export function createMinimalUI(game, config = {}) {
    const minimalConfig = {
        elements: {
            required: ['gameBoard'],
            optional: []
        },
        modals: {},
        keyboard: {
            'F1': 'toggleHelp',
            'Escape': 'closeModal'
        },
        messages: {
            position: 'top-right',
            duration: 2000
        },
        ...config
    };
    
    return new BaseGameUI(game, minimalConfig);
}

/**
 * Pre-defined configurations for different game types
 */
export const GAME_CONFIGS = {
    // Board games like Gomoku, Connect4
    BOARD_GAME: {
        elements: {
            required: ['gameBoard', 'gameStatus', 'currentPlayerIndicator'],
            optional: ['moveCounter', 'undoBtn', 'newGameBtn', 'resetScoreBtn']
        },
        modals: {
            help: { id: 'helpModal', closeKey: 'F1' },
            gameHelp: { id: 'gameHelpModal', closeKey: 'F2' }
        },
        keyboard: {
            'F1': 'toggleHelp',
            'F2': 'toggleGameHelp',
            'n': 'newGame',
            'u': 'undoMove',
            'r': 'resetScore',
            'Escape': 'closeModal'
        },
        messages: {
            position: 'top-right',
            duration: 3000
        }
    },

    // Puzzle games like Trio
    PUZZLE_GAME: {
        elements: {
            required: ['gameBoard', 'gameStatus'],
            optional: ['scoresList', 'solutionHistory', 'submitBtn', 'clearBtn']
        },
        modals: {
            help: { id: 'helpModal', closeKey: 'F1' }
        },
        keyboard: {
            'F1': 'toggleHelp',
            'n': 'newGame',
            'c': 'clearSelection',
            'Escape': 'closeModal'
        },
        messages: {
            position: 'top-center',
            duration: 2000
        }
    },

    // Strategy games like L-Game
    STRATEGY_GAME: {
        elements: {
            required: ['gameBoard', 'gameStatus'],
            optional: ['movesList', 'debugInfo', 'aiStatus']
        },
        modals: {
            help: { id: 'helpModal', closeKey: 'F1' }
        },
        keyboard: {
            'F1': 'toggleHelp',
            'r': 'resetGame',
            'm': 'showMoves',
            'd': 'debugInfo',
            'Escape': 'closeModal'
        },
        messages: {
            position: 'bottom-right',
            duration: 4000
        }
    }
};

/**
 * Utility functions for common UI tasks
 */
export const UIUtils = {
    /**
     * Create a game UI with a pre-defined configuration
     * @param {Object} game - Game instance
     * @param {string} gameType - Game type key from GAME_CONFIGS
     * @param {Object} overrides - Configuration overrides
     */
    createConfiguredUI(game, gameType, overrides = {}) {
        const baseConfig = GAME_CONFIGS[gameType];
        if (!baseConfig) {
            throw new Error(`Unknown game type: ${gameType}. Available types: ${Object.keys(GAME_CONFIGS).join(', ')}`);
        }

        const mergedConfig = this.deepMerge(baseConfig, overrides);
        return new BaseGameUI(game, mergedConfig);
    },

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
    },

    /**
     * Validate UI configuration
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];

        // Check required structure
        if (!config.elements) {
            errors.push('Missing elements configuration');
        } else {
            if (!config.elements.required || !Array.isArray(config.elements.required)) {
                warnings.push('No required elements specified');
            }
        }

        // Check keyboard shortcuts for conflicts
        if (config.keyboard) {
            const keys = Object.keys(config.keyboard);
            const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
            if (duplicates.length > 0) {
                errors.push(`Duplicate keyboard shortcuts: ${duplicates.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
};

/**
 * Debug utilities for development
 */
export const DebugUtils = {
    /**
     * Log all registered modules in a UI instance
     * @param {BaseGameUI} ui - UI instance to debug
     */
    logModules(ui) {
        console.group('🔍 UI Modules Debug');
        
        console.log('UI Class:', ui.constructor.name);
        console.log('Initialized:', ui.initialized);
        console.log('Game:', ui.game ? ui.game.constructor.name : 'None');
        
        console.log('\n📋 Modules:');
        for (const [name, module] of ui.modules) {
            console.log(`- ${name}:`, module.constructor.name);
        }
        
        console.log('\n📎 Elements:');
        const boundElements = Object.entries(ui.elements)
            .filter(([_, element]) => element !== null)
            .map(([name, _]) => name);
        console.log('Bound:', boundElements);
        
        const missingElements = Object.entries(ui.elements)
            .filter(([_, element]) => element === null)
            .map(([name, _]) => name);
        if (missingElements.length > 0) {
            console.log('Missing:', missingElements);
        }
        
        console.groupEnd();
    },

    /**
     * Test all keyboard shortcuts
     * @param {BaseGameUI} ui - UI instance to test
     */
    testKeyboardShortcuts(ui) {
        const keyboard = ui.getModule('keyboard');
        if (!keyboard) {
            console.log('⌨️ No keyboard module found');
            return;
        }

        console.group('⌨️ Keyboard Shortcuts Test');
        const shortcuts = keyboard.getShortcuts();
        
        shortcuts.forEach(shortcut => {
            console.log(`${shortcut.keyCombo}: ${shortcut.action} (${shortcut.enabled ? 'enabled' : 'disabled'})`);
        });
        
        const conflicts = keyboard.checkConflicts();
        if (conflicts.length > 0) {
            console.warn('⚠️ Conflicts found:', conflicts);
        }
        
        console.groupEnd();
    },

    /**
     * Performance monitoring for UI modules
     */
    performanceMonitor: {
        measurements: new Map(),
        
        start(label) {
            this.measurements.set(label, performance.now());
        },
        
        end(label) {
            const startTime = this.measurements.get(label);
            if (startTime) {
                const duration = performance.now() - startTime;
                console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
                this.measurements.delete(label);
                return duration;
            }
            return null;
        }
    }
};