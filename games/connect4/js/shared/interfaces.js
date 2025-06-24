/**
 * Service Interfaces for Connect4 Dependency Injection
 * 
 * Defines standard interfaces for all major components to ensure
 * consistent contracts and enable easy mocking for tests.
 */

/**
 * Game Engine Interface
 */
export const IGameEngine = {
    // Core game state
    makeMove: 'function',
    getValidMoves: 'function', 
    getBoard: 'function',
    simulateMove: 'function',
    
    // Game status
    isGameOver: 'function',
    getCurrentPlayer: 'function',
    getWinner: 'function',
    
    // Events
    on: 'function',
    emit: 'function',
    off: 'function'
};

/**
 * AI Strategy Interface  
 */
export const IBotStrategy = {
    getBestMove: 'function',
    getDifficulty: 'function',
    getName: 'function'
};

/**
 * Helper System Interface
 */
export const IHelperSystem = {
    // Threat analysis
    detectWinningMoves: 'function',
    detectBlockingMoves: 'function',
    
    // Strategic analysis
    analyzeMoveConsequences: 'function',
    getForkOpportunities: 'function',
    
    // UI helpers
    getHint: 'function',
    updateHintLevel: 'function'
};

/**
 * Event System Interface
 */
export const IEventSystem = {
    on: 'function',
    emit: 'function', 
    off: 'function',
    once: 'function',
    removeAllListeners: 'function'
};

/**
 * UI Controller Interface
 */
export const IUIController = {
    // Rendering
    render: 'function',
    updateBoard: 'function',
    showMessage: 'function',
    
    // User interactions
    handleColumnClick: 'function',
    handleButtonClick: 'function',
    
    // Game state updates
    onMoveMade: 'function',
    onGameOver: 'function'
};

/**
 * Score Manager Interface
 */
export const IScoreManager = {
    updateScore: 'function',
    getScore: 'function',
    resetScore: 'function',
    saveScore: 'function',
    loadScore: 'function'
};

/**
 * Player Manager Interface 
 */
export const IPlayerManager = {
    setPlayer: 'function',
    getPlayer: 'function',
    switchPlayer: 'function',
    resetPlayers: 'function'
};

/**
 * Validate that an object implements an interface
 * @param {Object} obj - Object to validate
 * @param {Object} interfaceDefinition - Interface definition
 * @param {string} name - Object name for error messages
 * @throws {Error} If object doesn't implement interface
 */
export function validateInterface(obj, interfaceDefinition, name = 'Object') {
    const missing = [];
    
    for (const [property, expectedType] of Object.entries(interfaceDefinition)) {
        if (!(property in obj)) {
            missing.push(`Missing property: ${property}`);
            continue;
        }
        
        const actualType = typeof obj[property];
        if (actualType !== expectedType) {
            missing.push(`Wrong type for ${property}: expected ${expectedType}, got ${actualType}`);
        }
    }
    
    if (missing.length > 0) {
        throw new Error(`${name} doesn't implement interface:\n${missing.join('\n')}`);
    }
}

/**
 * Create a proxy that validates interface compliance
 * @param {Object} obj - Object to wrap
 * @param {Object} interfaceDefinition - Interface to validate
 * @param {string} name - Object name
 * @returns {Proxy} Validated proxy object
 */
export function createInterfaceProxy(obj, interfaceDefinition, name) {
    validateInterface(obj, interfaceDefinition, name);
    
    return new Proxy(obj, {
        get(target, prop) {
            if (prop in interfaceDefinition && typeof target[prop] !== interfaceDefinition[prop]) {
                throw new Error(`Interface violation: ${name}.${prop} should be ${interfaceDefinition[prop]}`);
            }
            return target[prop];
        }
    });
}

/**
 * Service interface registry for type checking
 * @deprecated Use STANDARDIZED_INTERFACES from standardized-interfaces.js for new development
 */
export const SERVICE_INTERFACES = {
    'IGameEngine': IGameEngine,
    'IBotStrategy': IBotStrategy, 
    'IHelperSystem': IHelperSystem,
    'IEventSystem': IEventSystem,
    'IUIController': IUIController,
    'IScoreManager': IScoreManager,
    'IPlayerManager': IPlayerManager
};

// Re-export standardized interfaces for compatibility
export { 
    STANDARDIZED_INTERFACES,
    defaultValidator as standardizedValidator,
    defaultFactory as interfaceFactory
} from './standardized-interfaces.js';

/**
 * Register interface validation for a service
 * @param {ServiceContainer} container - DI container
 * @param {string} interfaceName - Interface name
 * @param {Function} constructor - Service constructor
 * @param {Object} options - Registration options
 */
export function registerWithValidation(container, interfaceName, constructor, options = {}) {
    const interfaceDefinition = SERVICE_INTERFACES[interfaceName];
    if (!interfaceDefinition) {
        throw new Error(`Unknown interface: ${interfaceName}`);
    }
    
    // Wrap constructor to validate instances
    const validatedConstructor = function(...args) {
        const instance = new constructor(...args);
        return createInterfaceProxy(instance, interfaceDefinition, interfaceName);
    };
    
    // Copy static properties
    Object.setPrototypeOf(validatedConstructor, constructor);
    Object.defineProperty(validatedConstructor, 'name', { value: constructor.name });
    
    return container.register(interfaceName, validatedConstructor, options);
}