/**
 * BaseGameUI - Abstract base class for game UI implementations
 * 
 * Provides common UI patterns and lifecycle management for all LogicCastle games.
 * Uses Template Method Pattern to allow customization while enforcing consistency.
 * 
 * Features:
 * - Standardized initialization lifecycle
 * - Modular component system
 * - Event-driven architecture
 * - Configuration-based setup
 */

import { ElementBinder } from './ElementBinder.js';
import { EventDispatcher } from './EventDispatcher.js';

export class BaseGameUI {
    constructor(game, config = {}) {
        this.game = game;
        this.config = this.mergeDefaultConfig(config);
        this.elements = {};
        this.modules = new Map();
        this.initialized = false;
        
        // Core modules
        this.elementBinder = null;
        this.eventDispatcher = null;
    }

    /**
     * Merge user config with defaults
     */
    mergeDefaultConfig(userConfig) {
        const defaultConfig = {
            elements: {
                required: ['gameBoard', 'gameStatus'],
                optional: []
            },
            
            modals: {
                help: { id: 'helpModal', closeKey: 'F1' }
            },
            
            keyboard: {
                'F1': 'toggleHelp',
                'Escape': 'closeModal'
            },
            
            messages: {
                position: 'top-right',
                duration: 3000,
                types: ['info', 'success', 'error']
            },
            
            animations: {
                duration: 400,
                easing: 'ease-in-out'
            }
        };
        
        return this.deepMerge(defaultConfig, userConfig);
    }

    /**
     * Deep merge utility for configuration objects
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
     * Initialize the UI - Template Method Pattern
     * Subclasses can override specific steps but must call super.init()
     */
    async init() {
        if (this.initialized) {
            console.warn('⚠️ BaseGameUI already initialized');
            return;
        }

        const startTime = performance.now();
        console.group(`🎮 Initializing ${this.constructor.name}...`);
        
        try {
            // Template Method Pattern - fixed order of operations
            console.log('📋 Step 1: beforeInit()');
            console.time('beforeInit');
            await this.beforeInit();
            console.timeEnd('beforeInit');
            console.log('✅ beforeInit() completed');
            
            console.log('📋 Step 2: initializeCoreModules()');
            console.time('initializeCoreModules');
            this.initializeCoreModules();
            console.timeEnd('initializeCoreModules');
            console.log('✅ initializeCoreModules() completed');
            
            console.log('📋 Step 3: bindElements()');
            console.time('bindElements');
            await this.bindElements();
            console.timeEnd('bindElements');
            console.log('✅ bindElements() completed');
            
            console.log('📋 Step 4: setupModules()');
            console.time('setupModules');
            await this.setupModules();
            console.timeEnd('setupModules');
            console.log('✅ setupModules() completed');
            
            console.log('📋 Step 5: setupEvents()');
            console.time('setupEvents');
            await this.setupEvents();
            console.timeEnd('setupEvents');
            console.log('✅ setupEvents() completed');
            
            console.log('📋 Step 6: setupKeyboard()');
            console.time('setupKeyboard');
            await this.setupKeyboard();
            console.timeEnd('setupKeyboard');
            console.log('✅ setupKeyboard() completed');
            
            console.log('📋 Step 7: afterInit()');
            console.time('afterInit');
            await this.afterInit();
            console.timeEnd('afterInit');
            console.log('✅ afterInit() completed');
            
            this.initialized = true;
            const totalTime = performance.now() - startTime;
            console.log(`✅ ${this.constructor.name} initialized successfully in ${totalTime.toFixed(2)}ms`);
            
        } catch (error) {
            const totalTime = performance.now() - startTime;
            console.error(`❌ ${this.constructor.name} initialization failed after ${totalTime.toFixed(2)}ms:`, error);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                cause: error.cause
            });
            this.handleInitializationError(error);
            throw error;
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Initialize core modules that all games need
     */
    initializeCoreModules() {
        this.elementBinder = new ElementBinder(this.config.elements);
        this.eventDispatcher = new EventDispatcher();
    }

    /**
     * Bind DOM elements using ElementBinder
     */
    async bindElements() {
        try {
            this.elements = await this.elementBinder.bindElements();
            console.log(`📎 Bound ${Object.keys(this.elements).length} DOM elements`);
        } catch (error) {
            console.error('❌ Element binding failed:', error);
            throw new Error(`Failed to bind required DOM elements: ${error.message}`);
        }
    }

    /**
     * Setup configured UI modules
     */
    async setupModules() {
        // Modal Manager
        if (this.config.modals && Object.keys(this.config.modals).length > 0) {
            const { ModalManager } = await import('../components/ModalManager.js');
            const modalManager = new ModalManager(this.config.modals);
            this.modules.set('modals', modalManager);
            console.log(`🪟 Modal Manager loaded with ${Object.keys(this.config.modals).length} modals`);
        }

        // Message System
        if (this.config.messages) {
            const { MessageSystem } = await import('../components/MessageSystem.js');
            const messageSystem = new MessageSystem(this.config.messages);
            this.modules.set('messages', messageSystem);
            console.log('📢 Message System loaded');
        }

        // Game Controls - TODO: Implement GameControls component
        // if (this.config.controls) {
        //     const { GameControls } = await import('../components/GameControls.js');
        //     const gameControls = new GameControls(this.config.controls, this.elements);
        //     this.modules.set('controls', gameControls);
        //     console.log('🎮 Game Controls loaded');
        // }
    }

    /**
     * Setup event listeners
     */
    async setupEvents() {
        // Game event listeners
        this.setupGameEventListeners();
        
        // UI event listeners
        this.setupUIEventListeners();
        
        console.log('📡 Event listeners configured');
    }

    /**
     * Setup keyboard shortcuts
     */
    async setupKeyboard() {
        if (this.config.keyboard && Object.keys(this.config.keyboard).length > 0) {
            const { KeyboardController } = await import('../components/KeyboardController.js');
            const keyboardController = new KeyboardController(this.config.keyboard);
            
            // Bind keyboard actions to UI methods
            this.bindKeyboardActions(keyboardController);
            
            this.modules.set('keyboard', keyboardController);
            console.log(`⌨️ Keyboard shortcuts configured: ${Object.keys(this.config.keyboard).join(', ')}`);
        }
    }

    /**
     * Bind keyboard shortcuts to actual UI methods
     */
    bindKeyboardActions(keyboardController) {
        const actionMap = {
            'toggleHelp': () => this.toggleModal('help'),
            'toggleGameHelp': () => this.toggleModal('gameHelp'),
            'closeModal': () => this.closeAllModals(),
            'newGame': () => this.newGame(),
            'undoMove': () => this.undoMove(),
            'resetScore': () => this.resetScore()
        };

        for (const [key, action] of Object.entries(this.config.keyboard)) {
            if (actionMap[action]) {
                keyboardController.register(key, action, actionMap[action]);
            } else {
                console.warn(`⚠️ Unknown keyboard action: ${action}`);
            }
        }
    }

    /**
     * Setup game-specific event listeners
     * Override in subclasses for game-specific events
     */
    setupGameEventListeners() {
        // Default game events that most games have
        const commonEvents = ['gameOver', 'newGame', 'move', 'undo'];
        
        commonEvents.forEach(event => {
            if (this.game && typeof this.game.on === 'function') {
                this.game.on(event, (data) => this.handleGameEvent(event, data));
            }
        });
    }

    /**
     * Setup UI event listeners
     */
    setupUIEventListeners() {
        // Standard button clicks
        const buttonMap = {
            'newGameBtn': () => this.newGame(),
            'undoBtn': () => this.undoMove(),
            'resetScoreBtn': () => this.resetScore(),
            'helpBtn': () => this.toggleModal('help')
        };

        for (const [elementKey, handler] of Object.entries(buttonMap)) {
            if (this.elements[elementKey]) {
                this.elements[elementKey].addEventListener('click', handler);
            }
        }
    }

    /**
     * Handle game events
     */
    handleGameEvent(eventType, data) {
        switch (eventType) {
            case 'gameOver':
                this.onGameOver(data);
                break;
            case 'newGame':
                this.onNewGame(data);
                break;
            case 'move':
                this.onMove(data);
                break;
            case 'undo':
                this.onUndo(data);
                break;
            default:
                console.log(`🎯 Game event: ${eventType}`, data);
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get a UI module by name
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Show a message using the message system
     */
    showMessage(message, type = 'info') {
        const messageSystem = this.getModule('messages');
        if (messageSystem) {
            messageSystem.show(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Toggle a modal
     */
    toggleModal(modalType) {
        const modalManager = this.getModule('modals');
        if (modalManager) {
            modalManager.toggle(modalType);
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modalManager = this.getModule('modals');
        if (modalManager) {
            modalManager.hideAll();
        }
    }

    // ==================== TEMPLATE METHODS ====================
    // Override these in subclasses for custom behavior

    /**
     * Called before initialization starts
     */
    async beforeInit() {
        // Override in subclasses
    }

    /**
     * Called after initialization completes
     */
    async afterInit() {
        // Override in subclasses
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        // Default error handling - override in subclasses
        this.showMessage(`Initialization failed: ${error.message}`, 'error');
    }

    // ==================== GAME ACTION METHODS ====================
    // Default implementations - override in subclasses

    newGame() {
        if (this.game && typeof this.game.resetGame === 'function') {
            this.game.resetGame();
        }
        console.log('🆕 New game started');
    }

    undoMove() {
        if (this.game && typeof this.game.undoMove === 'function') {
            this.game.undoMove();
        }
        console.log('↩️ Move undone');
    }

    resetScore() {
        if (this.game && typeof this.game.resetScores === 'function') {
            this.game.resetScores();
        }
        console.log('🔄 Scores reset');
    }

    // ==================== EVENT HANDLERS ====================
    // Override in subclasses for game-specific behavior

    onGameOver(data) {
        if (data.winner) {
            this.showMessage(`${data.winner} has won!`, 'success');
        } else {
            this.showMessage('Game ended in a draw', 'info');
        }
    }

    onNewGame(data) {
        this.showMessage('New game started', 'info');
    }

    onMove(data) {
        // Override in subclasses for move-specific UI updates
    }

    onUndo(data) {
        this.showMessage('Move undone', 'info');
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup resources when UI is destroyed
     */
    destroy() {
        // Cleanup modules
        for (const [name, module] of this.modules) {
            if (module.destroy && typeof module.destroy === 'function') {
                module.destroy();
            }
        }
        
        this.modules.clear();
        this.initialized = false;
        
        console.log(`🗑️ ${this.constructor.name} destroyed`);
    }
}