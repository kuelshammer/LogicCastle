/**
 * Gomoku UI Configuration
 * 
 * Comprehensive configuration for Gomoku UI modules replacing ~300 lines 
 * of duplicate DOM binding, keyboard, and modal setup code.
 */

export const GOMOKU_UI_CONFIG = {
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
            'blackScore',
            'whiteScore', 
            'moveCounter',
            
            // Control buttons
            'newGameBtn',
            'undoBtn',
            'resetScoreBtn',
            'helpBtn',
            'gameHelpBtn',
            
            // Modals
            'helpModal',
            'gameHelpModal',
            'assistanceModal',
            'closeHelpBtn',
            'closeGameHelpBtn',
            
            // Game mode
            'gameMode',
            
            // Coordinate displays
            'topCoords',
            'bottomCoords', 
            'leftCoords',
            'rightCoords',
            
            // Helper checkboxes for assistance system
            'helpPlayer1Level0',
            'helpPlayer1Level1',
            'helpPlayer1Level2',
            'helpPlayer2Level0',
            'helpPlayer2Level1',
            'helpPlayer2Level2'
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
        
        gameHelp: {
            id: 'gameHelpModal', 
            closeKey: 'F2',
            closeOnEscape: true,
            closeOnOutsideClick: true
        },
        
        assistance: {
            id: 'assistanceModal',
            closeKey: null, // Managed by assistance system
            closeOnEscape: true,
            closeOnOutsideClick: false
        }
    },

    // Keyboard Shortcuts Configuration
    keyboard: {
        // Function keys
        'F1': 'toggleHelp',
        'F2': 'toggleGameHelp', 
        'F3': 'resetScore',
        
        // Game controls
        'n': 'newGame',
        'N': 'newGame',
        'u': 'undoMove',
        'U': 'undoMove',
        'r': 'resetScore',
        'R': 'resetScore',
        
        // Cursor navigation (WASD)
        'w': 'moveCursorUp',
        'W': 'moveCursorUp',
        's': 'moveCursorDown', 
        'S': 'moveCursorDown',
        'a': 'moveCursorLeft',
        'A': 'moveCursorLeft',
        'd': 'moveCursorRight',
        'D': 'moveCursorRight',
        
        // Stone placement
        'x': 'placeCursorStone',
        'X': 'placeCursorStone',
        ' ': 'showCursor', // Spacebar to activate cursor
        
        // Navigation controls
        'Tab': 'toggleCursor',
        'Escape': 'closeModalOrHideCursor',
        
        // Ctrl combinations
        'Ctrl+z': 'undoMove',
        'Ctrl+Z': 'undoMove',
        'Ctrl+r': 'newGame',
        'Ctrl+R': 'newGame'
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
        boardSize: 15,
        animationDuration: 400,
        aiThinkingDelay: 800,
        
        // Cursor system settings
        cursor: {
            startRow: 7,  // Center of 15x15 board
            startCol: 7,
            mode: 'navigate'
        },
        
        // Two-stage stone placement
        placement: {
            enableTwoStage: true,
            previewEnabled: true
        }
    },

    // Helper system configuration
    helpers: {
        enabled: true,
        players: ['player1', 'player2'],
        levels: ['level0', 'level1', 'level2'],
        
        // Default settings
        defaultSettings: {
            player1: { level0: false, level1: false, level2: false },
            player2: { level0: false, level1: false, level2: false }
        }
    },

    // WASM Integration settings
    wasm: {
        enabled: true,
        autoInitialize: true,
        enhancedAI: true
    },

    // Assistance system settings  
    assistance: {
        enabled: true,
        autoInitialize: true,
        validateMoves: true
    },

    // Animation settings
    animations: {
        duration: 400,
        easing: 'ease-in-out',
        stonePlacement: true,
        cursorMovement: true,
        modalTransitions: true
    },

    // Debug settings
    debug: {
        enableLogging: false,
        logCursorMovement: false,
        logKeyboardEvents: false,
        logModalEvents: false
    }
};

/**
 * Game mode specific configurations
 */
export const GOMOKU_GAME_MODES = {
    'two-player': {
        aiEnabled: false,
        helperDefaults: {
            player1: { level0: false, level1: false, level2: false },
            player2: { level0: false, level1: false, level2: false }
        }
    },
    
    'vs-bot-wasm': {
        aiEnabled: true,
        aiType: 'wasm-smart',
        aiPlayer: 'white',
        helperDefaults: {
            player1: { level0: true, level1: false, level2: false }, // Human gets basic help
            player2: { level0: false, level1: false, level2: false }  // AI doesn't need help
        }
    },
    
    'vs-bot-wasm-expert': {
        aiEnabled: true,
        aiType: 'wasm-expert', 
        aiPlayer: 'white',
        helperDefaults: {
            player1: { level0: true, level1: true, level2: false },  // Human gets more help vs expert
            player2: { level0: false, level1: false, level2: false }
        }
    }
};

/**
 * Create a merged configuration for a specific game mode
 * @param {string} gameMode - The game mode identifier
 * @returns {Object} Merged configuration
 */
export function createGomokuConfig(gameMode = 'two-player') {
    const modeConfig = GOMOKU_GAME_MODES[gameMode] || GOMOKU_GAME_MODES['two-player'];
    
    return {
        ...GOMOKU_UI_CONFIG,
        mode: gameMode,
        modeSettings: modeConfig
    };
}