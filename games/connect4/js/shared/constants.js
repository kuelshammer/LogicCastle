/**
 * Connect4 Game Constants
 * 
 * Shared constants used across all Connect4 modules
 */

// Game Board Configuration
export const GAME_CONFIG = {
    ROWS: 6,
    COLS: 7,
    WIN_LENGTH: 4
};

// Player Constants
export const PLAYERS = {
    NONE: 0,
    PLAYER1: 1,  // Red player
    PLAYER2: 2   // Yellow player
};

// Direction Vectors for Line Analysis
export const DIRECTIONS = {
    HORIZONTAL: [0, 1],
    VERTICAL: [1, 0],
    DIAGONAL_DOWN: [1, 1],   // \\ direction
    DIAGONAL_UP: [1, -1]     // / direction
};

// All directions as array for iteration
export const ALL_DIRECTIONS = [
    DIRECTIONS.HORIZONTAL,
    DIRECTIONS.VERTICAL,
    DIRECTIONS.DIAGONAL_DOWN,
    DIRECTIONS.DIAGONAL_UP
];

// Direction Names for Human-Readable Output
export const DIRECTION_NAMES = {
    '0,1': 'horizontal',
    '1,0': 'vertical',
    '1,1': 'diagonal-down',
    '1,-1': 'diagonal-up'
};

// Game State Constants
export const GAME_STATES = {
    IN_PROGRESS: 'in_progress',
    PLAYER1_WINS: 'player1_wins',
    PLAYER2_WINS: 'player2_wins',
    DRAW: 'draw'
};

// AI Difficulty Levels
export const AI_DIFFICULTIES = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    EXPERT: 'expert'
};

// Strategy Names for Modular AI
export const AI_STRATEGIES = {
    RANDOM: 'random',
    SMART_RANDOM: 'smart-random',
    ENHANCED_SMART: 'enhanced-smart',
    MONTE_CARLO: 'monte-carlo',
    MINIMAX: 'minimax',
    DEFENSIVE: 'defensive',
    MIXED_OFFENSIVE: 'mixed-offensive',
    MIXED_DEFENSIVE: 'mixed-defensive'
};

// Hint System Constants
export const HINT_TYPES = {
    WINNING_OPPORTUNITY: 'winning_opportunity',
    FORCED_BLOCK: 'forced_block',
    TRAP_AVOIDANCE: 'trap_avoidance',
    STRATEGIC_OPPORTUNITY: 'strategic_opportunity',
    CENTER_PLAY: 'center_play',
    DETAILED_ANALYSIS: 'detailed_analysis'
};

export const HINT_PRIORITIES = {
    CRITICAL: 'critical',
    WARNING: 'warning',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info',
    MINIMAL: 'minimal'
};

// Help Levels for Hint System
export const HELP_LEVELS = {
    NONE: 0,
    CRITICAL: 1,      // Only wins/blocks
    WARNINGS: 2,      // Add dangerous moves
    STRATEGIC: 3,     // Add strategic suggestions
    FULL: 4          // Full analysis with explanations
};

// Event Names for Game Events
export const GAME_EVENTS = {
    MOVE_MADE: 'moveMade',
    GAME_WON: 'gameWon',
    GAME_DRAW: 'gameDraw',
    GAME_RESET: 'gameReset',
    BOARD_STATE_CHANGED: 'boardStateChanged',
    PLAYER_CHANGED: 'playerChanged'
};

// Hint System Events
export const HINT_EVENTS = {
    HINTS_TOGGLED: 'hintsToggled',
    HINTS_UPDATED: 'hintsUpdated',
    FORCED_MOVE_ACTIVATED: 'forcedMoveActivated',
    FORCED_MOVE_DEACTIVATED: 'forcedMoveDeactivated'
};

// Performance Constants
export const PERFORMANCE_CONFIG = {
    DEFAULT_TIMEOUT: 5000,        // 5 seconds default timeout
    CI_TIMEOUT_MULTIPLIER: 3,     // 3x timeout in CI environments
    MAX_SIMULATIONS: 1000,        // Maximum simulations for MCTS
    MAX_DEPTH: 7                  // Maximum depth for minimax
};

// Evaluation Weights (for AI scoring)
export const EVALUATION_WEIGHTS = {
    WIN: 1000000,                 // Immediate win
    BLOCK: 500000,                // Block opponent win
    THREE_IN_ROW: 50,             // Three pieces in a row
    TWO_IN_ROW: 10,               // Two pieces in a row
    CENTER_BONUS: 3,              // Bonus for center column
    HEIGHT_PENALTY: 1             // Penalty for height
};

// Global Access for Backward Compatibility
if (typeof window !== 'undefined') {
    window.Connect4Constants = {
        GAME_CONFIG,
        PLAYERS,
        DIRECTIONS,
        ALL_DIRECTIONS,
        DIRECTION_NAMES,
        GAME_STATES,
        AI_DIFFICULTIES,
        AI_STRATEGIES,
        HINT_TYPES,
        HINT_PRIORITIES,
        HELP_LEVELS,
        GAME_EVENTS,
        HINT_EVENTS,
        PERFORMANCE_CONFIG,
        EVALUATION_WEIGHTS
    };
}