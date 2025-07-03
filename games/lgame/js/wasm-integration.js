/**
 * L-Game WASM Integration Module
 * 
 * Handles loading and initialization of the Rust/WASM game engine for L-Game.
 * Provides a clean interface for loading WASM modules with error handling and fallbacks.
 * 
 * Based on ULTRATHINK principles: pragmatic integration over complex abstractions
 */

import { LGameJS } from './game.js';

export class LGameWasmIntegration {
    constructor() {
        this.wasmModule = null;
        this.gameInstance = null;
        this.initialized = false;
        this.initializationPromise = null;
    }
    
    /**
     * Initialize WASM module and create game instance
     * @returns {Promise<LGameJS>} Initialized game instance
     */
    async initialize() {
        // Return existing initialization if already in progress
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }
    
    /**
     * Internal initialization method
     * @returns {Promise<LGameJS>} Initialized game instance
     * @private
     */
    async _performInitialization() {
        try {
            console.log('🦀 Loading L-Game WASM module...');
            
            // Load WASM module
            const wasmModule = await this._loadWasmModule();
            
            console.log('✅ WASM module loaded successfully');
            
            // Create and initialize game instance
            this.gameInstance = new LGameJS();
            await this.gameInstance.initialize(wasmModule);
            
            this.wasmModule = wasmModule;
            this.initialized = true;
            
            console.log('🎯 L-Game WASM integration completed');
            return this.gameInstance;
            
        } catch (error) {
            console.error('❌ L-Game WASM initialization failed:', error);
            this.initializationPromise = null;
            throw new Error(`L-Game WASM initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Load WASM module with proper path resolution
     * @returns {Promise<Object>} WASM module
     * @private
     */
    async _loadWasmModule() {
        try {
            // Determine WASM module path relative to current location
            const wasmPath = this._resolveWasmPath();
            
            console.log(`🔗 Loading WASM from: ${wasmPath}`);
            
            // Dynamic import of WASM module
            const { default: init, LGame } = await import(wasmPath);
            
            // Initialize WASM
            await init();
            
            // Verify LGame class is available
            if (!LGame) {
                throw new Error('LGame class not found in WASM module');
            }
            
            // Test WASM functionality
            const testGame = LGame.new();
            const testBoard = testGame.getBoard();
            
            if (!testBoard || testBoard.length !== 16) {
                throw new Error('WASM module test failed: invalid board size');
            }
            
            console.log('✅ WASM module test passed');
            
            return { LGame };
            
        } catch (error) {
            console.error('❌ WASM module loading failed:', error);
            
            // Provide detailed error information
            if (error.message.includes('Failed to fetch')) {
                throw new Error('WASM module not found. Ensure the game engine is built with `npm run wasm:build`');
            }
            
            throw error;
        }
    }
    
    /**
     * Resolve WASM module path based on current location
     * @returns {string} WASM module path
     * @private
     */
    _resolveWasmPath() {
        // Check if we're in development or production environment
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/games/lgame/')) {
            // We're in the L-Game directory, go back to root
            return '../../../game_engine/pkg/game_engine.js';
        } else {
            // We're likely at root level
            return './game_engine/pkg/game_engine.js';
        }
    }
    
    /**
     * Get the initialized game instance
     * @returns {LGameJS|null} Game instance or null if not initialized
     */
    getGameInstance() {
        return this.gameInstance;
    }
    
    /**
     * Check if WASM integration is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this.initialized && this.gameInstance && this.gameInstance.initialized;
    }
    
    /**
     * Get WASM module information
     * @returns {Object} Module information
     */
    getModuleInfo() {
        return {
            initialized: this.initialized,
            wasmModuleLoaded: !!this.wasmModule,
            gameInstanceCreated: !!this.gameInstance,
            gameInstanceInitialized: this.gameInstance ? this.gameInstance.initialized : false
        };
    }
    
    /**
     * Reset the entire WASM integration (useful for testing)
     * @returns {Promise<void>}
     */
    async reset() {
        console.log('🔄 Resetting L-Game WASM integration...');
        
        // Reset game instance
        if (this.gameInstance) {
            try {
                await this.gameInstance.resetGame();
            } catch (error) {
                console.warn('⚠️ Error resetting game instance:', error);
            }
        }
        
        // Reset integration state
        this.gameInstance = null;
        this.initialized = false;
        this.initializationPromise = null;
        
        console.log('✅ WASM integration reset completed');
    }
    
    /**
     * Get debug information about WASM integration
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            integration: this.getModuleInfo(),
            wasmPath: this._resolveWasmPath(),
            currentLocation: window.location.pathname,
            gameDebugInfo: this.gameInstance ? this.gameInstance.getDebugInfo() : null,
            browserSupport: {
                webAssembly: typeof WebAssembly !== 'undefined',
                dynamicImport: typeof import === 'function',
                es6Modules: typeof Symbol !== 'undefined'
            }
        };
    }
}

/**
 * Convenience function to create and initialize L-Game
 * @returns {Promise<LGameJS>} Initialized game instance
 */
export async function createLGame() {
    const integration = new LGameWasmIntegration();
    return await integration.initialize();
}

/**
 * Global error handler for WASM-related errors
 * @param {Error} error - WASM error
 */
export function handleWasmError(error) {
    console.error('🚨 L-Game WASM Error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('WASM module not found')) {
        console.error('💡 Solution: Run `npm run wasm:build` to build the WASM module');
    } else if (error.message.includes('Failed to fetch')) {
        console.error('💡 Solution: Ensure you are serving the files via HTTP server (npm run serve)');
    } else if (error.message.includes('WebAssembly')) {
        console.error('💡 Browser does not support WebAssembly. Use a modern browser.');
    }
    
    throw error;
}

// Export for ES6 module compatibility  
export default LGameWasmIntegration;