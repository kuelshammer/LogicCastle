/**
 * Gomoku UI Configuration
 * 
 * Based on Connect4 goldstandard configuration system.
 * Adapted for 15x15 Gomoku board and 5-in-a-row gameplay.
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
            'assistanceBtn',
            
            // Modals
            'helpModal',
            'assistanceModal',
            'closeHelpBtn',
            'closeAssistanceBtn',
            
            // Game mode
            'gameMode',
            
            // Player assistance checkboxes
            'player1-undo',
            'player2-undo',
            'player1-threats',
            'player2-threats',
            'player1-winning-moves',
            'player2-winning-moves',
            'player1-blocked-positions',
            'player2-blocked-positions'
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
        
        // Ctrl combinations
        'Ctrl+z': 'undoMove',
        'Ctrl+Z': 'undoMove',
        'Ctrl+n': 'newGame',
        'Ctrl+N': 'newGame'
    },

    // Performance Configuration
    performance: {
        enableAnimations: true,
        animationDuration: 300,
        
        // Intersection rendering optimization
        useLazyRendering: true,
        renderBatchSize: 25,  // 25 intersections per batch for 15x15 board
        
        // Preview system configuration
        enableHoverPreviews: true,
        previewDelay: 50,     // ms delay before showing preview
        
        // Assistance system performance
        assistanceUpdateDelay: 100,  // ms delay for assistance calculations
        maxHighlightedPositions: 20   // limit highlights for performance
    },

    // Game-specific Configuration
    game: {
        boardSize: 15,        // 15x15 Gomoku board
        winCondition: 5,      // 5 stones in a row to win
        enableForbiddenMoves: false,  // Standard Gomoku rules (no forbidden moves)
        
        // Stone placement rules
        allowOverwrite: false,
        requireIntersectionClick: true,
        
        // AI configuration
        defaultAILevel: 'medium',
        aiThinkingTime: 600,   // ms
        
        // Assistance features
        assistanceFeatures: [
            'threats',         // Show threat positions  
            'winning-moves',   // Show winning opportunities
            'blocked-positions', // Show blocked positions
            'undo'             // Allow undo moves
        ]
    }
};

/**
 * Create game-mode specific configuration
 * @param {string} mode - Game mode ('two-player', 'single-player', 'demo')
 * @returns {Object} Configuration object
 */
export function createGomokuConfig(mode = 'two-player') {
    const baseConfig = { ...GOMOKU_UI_CONFIG };
    
    switch (mode) {
        case 'single-player':
            baseConfig.game.aiEnabled = true;
            baseConfig.game.defaultAILevel = 'medium';
            baseConfig.performance.aiThinkingTime = 800;
            break;
            
        case 'two-player':
        default:
            baseConfig.game.aiEnabled = false;
            baseConfig.game.autoPlay = false;
            break;
    }
    
    return baseConfig;
}