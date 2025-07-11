/**
 * Connect4 UI Configuration
 * 
 * Based on Gomoku goldstandard configuration system.
 * Replaces manual DOM binding, keyboard, and modal setup code with centralized config.
 */

export const CONNECT4_UI_CONFIG = {
    // DOM Element Configuration
    elements: {
        // Core game elements (required)
        required: [
            'gameBoard',
            'currentPlayerIndicator', 
            'gameStatus'
        ],
        
        // UI control elements (optional but expected)
        optional: [
            // Game info
            'yellowScore',
            'redScore', 
            'moveCounter',
            
            // Control buttons
            'newGameBtn',
            'undoBtn',
            'resetScoreBtn',
            'helpBtn',
            'assistanceBtn',
            
            // Modals
            'helpModal',
            'assistanceModal',
            'closeHelpBtn',
            'closeAssistanceBtn',
            
            // Game mode
            'gameMode',
            
            // Coordinate displays
            'topCoords',
            'bottomCoords',
            
            // Player assistance checkboxes
            'player1-undo',
            'player2-undo',
            'player1-threats',
            'player2-threats',
            'player1-winning-moves',
            'player2-winning-moves',
            'player1-blocked-columns',
            'player2-blocked-columns'
        ]
    },

    // Modal Configuration 
    modals: {
        help: {
            id: 'helpModal',
            closeKey: 'F1',
            closeOnEscape: true,
            closeOnOutsideClick: true
        },
        
        assistance: {
            id: 'assistanceModal',
            closeKey: 'F2',
            closeOnEscape: true,
            closeOnOutsideClick: false
        }
    },

    // Keyboard Shortcuts Configuration
    keyboard: {
        // Function keys
        'F1': 'toggleModal_help',
        'F2': 'toggleModal_assistance', 
        'F3': 'resetScore',
        
        // Game controls
        'n': 'newGame',
        'N': 'newGame',
        'u': 'undoMove',
        'U': 'undoMove',
        'r': 'resetScore',
        'R': 'resetScore',
        
        // Column selection (1-7) - DISABLED until actions are implemented
        // '1': 'dropColumn1',
        // '2': 'dropColumn2',
        // '3': 'dropColumn3',
        // '4': 'dropColumn4',
        // '5': 'dropColumn5',
        // '6': 'dropColumn6',
        // '7': 'dropColumn7',
        
        // Ctrl combinations
        'Ctrl+z': 'undoMove',
        'Ctrl+Z': 'undoMove',
        'Ctrl+r': 'newGame',
        'Ctrl+R': 'newGame',
        
        // Modal control
        'Escape': 'closeModal'
    },

    // Message System Configuration
    messages: {
        position: 'top-right',
        duration: 3000,
        maxMessages: 5,
        
        types: {
            info: { duration: 3000 },
            success: { duration: 3000 },
            error: { duration: 5000 },
            warning: { duration: 4000 },
            win: { duration: 5000 }
        }
    },

    // Game-specific settings
    game: {
        rows: 6,
        cols: 7,
        winCondition: 4,
        animationDuration: 400,
        aiThinkingDelay: 800,
        
        // Drop zone system for column selection
        dropZones: {
            enabled: true,
            hoverPreview: true
        }
    },

    // Player assistance system configuration
    assistance: {
        enabled: true,
        players: ['player1', 'player2'],
        features: ['undo', 'threats', 'winning-moves', 'blocked-columns'],
        
        // Default settings
        defaultSettings: {
            player1: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-columns': false 
            },
            player2: { 
                undo: false, 
                threats: false, 
                'winning-moves': false, 
                'blocked-columns': false 
            }
        }
    },

    // WASM Integration settings
    wasm: {
        enabled: true,
        autoInitialize: true,
        enhancedAI: true
    },

    // Animation settings
    animations: {
        duration: 400,
        easing: 'ease-in-out',
        discDrop: true,
        modalTransitions: true
    },

    // Debug settings
    debug: {
        enableLogging: false,
        logColumnClicks: false,
        logKeyboardEvents: false,
        logModalEvents: false
    }
};

/**
 * Game mode specific configurations
 */
export const CONNECT4_GAME_MODES = {
    'two-player': {
        aiEnabled: false,
        assistanceDefaults: {
            player1: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false },
            player2: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false }
        }
    },
    
    'vs-bot-easy': {
        aiEnabled: true,
        aiType: 'easy',
        aiPlayer: 'red',
        assistanceDefaults: {
            player1: { undo: true, threats: true, 'winning-moves': false, 'blocked-columns': false }, // Human gets basic help
            player2: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false }  // AI doesn't need help
        }
    },
    
    'vs-bot-medium': {
        aiEnabled: true,
        aiType: 'medium',
        aiPlayer: 'red',
        assistanceDefaults: {
            player1: { undo: true, threats: true, 'winning-moves': true, 'blocked-columns': false },  // Human gets more help
            player2: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false }
        }
    },
    
    'vs-bot-hard': {
        aiEnabled: true,
        aiType: 'hard', 
        aiPlayer: 'red',
        assistanceDefaults: {
            player1: { undo: true, threats: true, 'winning-moves': true, 'blocked-columns': true },  // Human gets full help vs hard AI
            player2: { undo: false, threats: false, 'winning-moves': false, 'blocked-columns': false }
        }
    }
};

/**
 * Create a merged configuration for a specific game mode
 * @param {string} gameMode - The game mode identifier
 * @returns {Object} Merged configuration
 */
export function createConnect4Config(gameMode = 'two-player') {
    const modeConfig = CONNECT4_GAME_MODES[gameMode] || CONNECT4_GAME_MODES['two-player'];
    
    return {
        ...CONNECT4_UI_CONFIG,
        mode: gameMode,
        modeSettings: modeConfig
    };
}