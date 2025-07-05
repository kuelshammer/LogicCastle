/**
 * Trio UI Configuration
 * 
 * Comprehensive configuration for Trio UI modules replacing the 890-line TrioUI 
 * custom implementation with the standardized UI Module System.
 */

export const TRIO_UI_CONFIG = {
    // DOM Element Configuration
    elements: {
        // Core game elements (required)
        required: [
            'numberGrid',
            'targetDisplay',
            'gameStatus'
        ],
        
        // UI control elements (optional but expected)
        optional: [
            // Target display
            'targetNumber',
            'targetAnalysis',
            'realizedCount',
            'theoreticalCount',
            
            // Game controls
            'startGameBtn',
            'newRoundBtn',
            'showSolutionBtn',
            'newGameBtn',
            
            // Solution panel
            'selectedDisplay',
            'selected1',
            'selected2',
            'selected3',
            'operatorSign',
            'calculatedResult',
            'submitSolutionBtn',
            'clearSelectionBtn',
            
            // Game info
            'chipsRemaining',
            'scoresList',
            'solutionHistory',
            'historyList',
            
            // Modals
            'helpModal',
            'closeHelpBtn',
            'helpBtn',
            
            // Game mode
            'gameMode',
            
            // Player setup (for multiplayer)
            'playerSetup',
            'playerNameInput',
            'addPlayerBtn',
            'playersList',
            'startWithPlayersBtn'
        ]
    },

    // Modal Configuration 
    modals: {
        help: {
            id: 'helpModal',
            closeKey: 'F1',
            closeOnEscape: true,
            closeOnOutsideClick: true
        }
    },

    // Keyboard Shortcuts Configuration
    keyboard: {
        // Function keys
        'F1': 'toggleHelp',
        
        // Game controls
        'n': 'newGame',
        'N': 'newGame',
        'Enter': 'submitSolution',
        'Escape': 'clearSelection',
        'c': 'clearSelection',
        'C': 'clearSelection',
        's': 'showSolution',
        'S': 'showSolution',
        ' ': 'startGame' // Spacebar
    },

    // Message System Configuration
    messages: {
        position: 'top-right',
        duration: 3000,
        maxMessages: 5,
        types: {
            info: { 
                duration: 3000,
                className: 'message-info',
                icon: 'ℹ️'
            },
            success: { 
                duration: 4000,
                className: 'message-success',
                icon: '✅'
            },
            error: { 
                duration: 5000,
                className: 'message-error',
                icon: '❌'
            },
            warning: { 
                duration: 4000,
                className: 'message-warning',
                icon: '⚠️'
            },
            win: {
                duration: 6000,
                className: 'message-win',
                icon: '🎉'
            },
            chip: {
                duration: 4000,
                className: 'message-success',
                icon: '🏆'
            }
        }
    },

    // Animation Configuration
    animations: {
        duration: 400,
        easing: 'ease-in-out',
        
        // Trio-specific animations
        numberSelection: {
            duration: 200,
            easing: 'ease-out'
        },
        
        solutionSubmit: {
            duration: 300,
            easing: 'ease-in'
        },
        
        chipCollection: {
            duration: 500,
            easing: 'ease-in-out'
        }
    },

    // Game-specific UI settings
    gameSettings: {
        // Grid configuration
        gridSize: 7, // 7x7 number grid
        numberRange: {
            kinderfreundlich: { min: 1, max: 50 },
            vollspektrum: { min: 1, max: 90 },
            strategisch: { min: 1, max: 90 },
            analytisch: { min: 1, max: 90 }
        },
        
        // Selection behavior
        maxSelections: 3,
        allowReselection: true,
        
        // Solution validation
        validOperators: ['×+', '×-'], // a×b+c or a×b-c
        
        // Chip system
        totalChips: 20,
        
        // Player system
        maxPlayers: 6,
        defaultPlayerName: 'Spieler',
        
        // AI settings
        aiEnabled: true,
        aiDifficulty: 'medium' // easy, medium, hard
    },

    // Responsive design breakpoints
    responsive: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440
    }
};

/**
 * Create dynamic Trio configuration based on game mode
 * @param {string} gameMode - The selected game mode
 * @returns {Object} Customized configuration
 */
export function createTrioConfig(gameMode = 'kinderfreundlich') {
    // Deep copy the configuration to avoid reference issues
    const config = JSON.parse(JSON.stringify(TRIO_UI_CONFIG));
    
    // Adjust settings based on game mode
    switch (gameMode) {
        case 'kinderfreundlich':
            config.gameSettings.numberRange = { min: 1, max: 50 };
            config.gameSettings.aiDifficulty = 'easy';
            break;
        case 'vollspektrum':
            config.gameSettings.numberRange = { min: 1, max: 90 };
            config.gameSettings.aiDifficulty = 'medium';
            break;
        case 'strategisch':
            config.gameSettings.numberRange = { min: 1, max: 90 };
            config.gameSettings.aiDifficulty = 'medium';
            // More realized combinations, fewer theoretical
            break;
        case 'analytisch':
            config.gameSettings.numberRange = { min: 1, max: 90 };
            config.gameSettings.aiDifficulty = 'hard';
            // More theoretical combinations, fewer realized
            break;
    }
    
    return config;
}

/**
 * Default configuration for Trio puzzle game
 * Used when no specific configuration is provided
 */
export const DEFAULT_TRIO_CONFIG = createTrioConfig('kinderfreundlich');