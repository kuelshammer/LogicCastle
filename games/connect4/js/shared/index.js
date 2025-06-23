/**
 * Connect4 Shared Utilities - Main exports
 * 
 * Central export point for all shared utilities
 */

// Export all constants
export * from './constants.js';

// Export all board utilities
export * from './board-utils.js';

// Export all event utilities
export * from './event-utils.js';

// Export all performance utilities
export * from './performance-utils.js';

// Re-export commonly used items for convenience
export {
    GAME_CONFIG,
    PLAYERS,
    ALL_DIRECTIONS,
    GAME_EVENTS,
    HINT_EVENTS
} from './constants.js';

export {
    createEmptyBoard,
    copyBoard,
    simulateMove,
    getValidMoves,
    checkWinAtPosition,
    getOpponent
} from './board-utils.js';

export {
    EventEmitter,
    GameEventDispatcher
} from './event-utils.js';

export {
    PerformanceTimer,
    createTimeout,
    profileFunction
} from './performance-utils.js';

// Global access for backward compatibility
if (typeof window !== 'undefined') {
    // Import everything into global namespace
    import('./constants.js').then(constants => {
        Object.assign(window, constants);
    });
    
    import('./board-utils.js').then(boardUtils => {
        Object.assign(window, boardUtils);
    });
    
    import('./event-utils.js').then(eventUtils => {
        Object.assign(window, eventUtils);
    });
    
    import('./performance-utils.js').then(perfUtils => {
        Object.assign(window, perfUtils);
    });
}