/**
 * L-Game UI Configuration
 * 
 * Comprehensive configuration for L-Game UI modules replacing the 468-line UI
 * custom implementation with the standardized UI Module System.
 * 
 * Features migrated from legacy L-Game UI:
 * - Interactive 4x4 grid board
 * - L-piece and neutral piece visualization
 * - 8 L-piece orientations (4 rotations + 4 mirrored)
 * - Two-phase moves (L-piece + optional neutral piece)
 * - Blockade win condition detection
 * - WASM integration for game logic
 */

export const LGAME_UI_CONFIG = {
    // DOM Element Configuration
    elements: {
        // Core game elements (required)
        required: [
            'game-board',
            'current-player', 
            'game-status'
        ],
        
        // UI control elements (optional but expected)
        optional: [
            // Game board
            'board-container',
            'board-grid',
            
            // Game info
            'current-player',
            'move-count',
            'legal-moves-count',
            'game-status',
            'move-history',
            'wasm-status',
            'game-engine-status',
            'loading-progress',
            
            // Control buttons  
            'reset-game',
            'show-moves', 
            'debug-info',
            'undo-move',
            
            // Debug and info
            'debug-panel',
            'debug-info',
            'loading-progress',
            'error-display',
            
            // Move input
            'move-input',
            'move-submit',
            'move-cancel',
            
            // Help system
            'helpModal',
            'rulesModal',
            'helpBtn',
            'rulesBtn',
            'closeHelpBtn',
            'closeRulesBtn'
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
        
        rules: {
            id: 'rulesModal',
            closeKey: 'F2',
            closeOnEscape: true,
            closeOnOutsideClick: true
        },
        
        debug: {
            id: 'debugModal',
            closeKey: 'F12',
            closeOnEscape: true,
            closeOnOutsideClick: false
        }
    },

    // Keyboard Shortcuts Configuration
    keyboard: {
        // Function keys
        'F1': 'toggleHelp',
        'F2': 'toggleRules',
        'F12': 'toggleDebug',
        
        // Game controls
        'n': 'newGame',
        'N': 'newGame',
        'r': 'resetGame',
        'R': 'resetGame',
        'u': 'undoMove',
        'U': 'undoMove',
        'm': 'showMoves',
        'M': 'showMoves',
        
        // Move controls
        'Enter': 'submitMove',
        'Escape': 'cancelMove',
        'c': 'cancelMove',
        'C': 'cancelMove',
        
        // Board navigation (arrow keys)
        'ArrowUp': 'moveCursorUp',
        'ArrowDown': 'moveCursorDown',
        'ArrowLeft': 'moveCursorLeft',
        'ArrowRight': 'moveCursorRight',
        ' ': 'selectCell' // Spacebar
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
            move: {
                duration: 2000,
                className: 'message-info',
                icon: '🎯'
            },
            blockade: {
                duration: 5000,
                className: 'message-warning',
                icon: '🚫'
            }
        }
    },

    // Animation Configuration
    animations: {
        duration: 400,
        easing: 'ease-in-out',
        
        // L-Game specific animations
        pieceMove: {
            duration: 300,
            easing: 'ease-out'
        },
        
        pieceRotation: {
            duration: 200,
            easing: 'ease-in'
        },
        
        boardHighlight: {
            duration: 150,
            easing: 'ease-in-out'
        },
        
        gameOver: {
            duration: 500,
            easing: 'ease-in-out'
        }
    },

    // Game-specific UI settings
    gameSettings: {
        // Board configuration
        boardSize: 4, // 4x4 grid
        cellSize: 60, // pixels
        
        // Piece configuration
        pieces: {
            lPiece: {
                orientations: 8, // 4 rotations + 4 mirrored
                colors: {
                    player1: '#3B82F6', // Blue
                    player2: '#EF4444'  // Red
                }
            },
            neutralPiece: {
                count: 2,
                color: '#6B7280' // Gray
            }
        },
        
        // Move system
        movePhases: {
            lPieceMove: 'required',
            neutralPieceMove: 'optional'
        },
        
        // Win conditions
        winConditions: ['blockade', 'noValidMoves'],
        
        // Game modes
        gameMode: 'standard', // standard, timed, practice
        
        // AI settings
        aiEnabled: true,
        aiDifficulty: 'medium', // easy, medium, hard
        
        // Debug settings
        debugMode: false,
        showCoordinates: false,
        highlightValidMoves: true
    },

    // Visual configuration
    visual: {
        // Board styling
        board: {
            backgroundColor: '#F3F4F6',
            borderColor: '#D1D5DB',
            borderWidth: 2,
            borderRadius: 8
        },
        
        // Cell styling
        cell: {
            backgroundColor: '#FFFFFF',
            hoverColor: '#E5E7EB',
            selectedColor: '#DBEAFE',
            highlightColor: '#FEF3C7',
            size: 60
        },
        
        // Piece styling
        piece: {
            borderRadius: 4,
            borderWidth: 2,
            shadowEnabled: true,
            glowEffect: true
        }
    },

    // Responsive design breakpoints
    responsive: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440,
        
        // Responsive cell sizes
        cellSizes: {
            mobile: 45,
            tablet: 55,
            desktop: 60
        }
    }
};

/**
 * Create dynamic L-Game configuration based on game mode and settings
 * @param {string} gameMode - The selected game mode
 * @param {Object} options - Additional configuration options
 * @returns {Object} Customized configuration
 */
export function createLGameConfig(gameMode = 'standard', options = {}) {
    // Deep copy the configuration to avoid reference issues
    const config = JSON.parse(JSON.stringify(LGAME_UI_CONFIG));
    
    // Adjust settings based on game mode
    switch (gameMode) {
        case 'standard':
            config.gameSettings.aiEnabled = true;
            config.gameSettings.aiDifficulty = 'medium';
            config.gameSettings.debugMode = false;
            break;
            
        case 'timed':
            config.gameSettings.aiEnabled = true;
            config.gameSettings.aiDifficulty = 'hard';
            config.gameSettings.timeLimit = 30; // seconds per move
            config.messages.types.timeout = {
                duration: 3000,
                className: 'message-warning',
                icon: '⏰'
            };
            break;
            
        case 'practice':
            config.gameSettings.aiEnabled = false;
            config.gameSettings.debugMode = true;
            config.gameSettings.showCoordinates = true;
            config.gameSettings.highlightValidMoves = true;
            break;
            
        case 'debug':
            config.gameSettings.debugMode = true;
            config.gameSettings.showCoordinates = true;
            config.gameSettings.highlightValidMoves = true;
            config.keyboard['d'] = 'toggleDebug';
            config.keyboard['D'] = 'toggleDebug';
            break;
    }
    
    // Apply custom options
    if (options.cellSize) {
        config.gameSettings.cellSize = options.cellSize;
        config.visual.cell.size = options.cellSize;
    }
    
    if (options.aiDifficulty) {
        config.gameSettings.aiDifficulty = options.aiDifficulty;
    }
    
    if (options.debugMode !== undefined) {
        config.gameSettings.debugMode = options.debugMode;
    }
    
    return config;
}

/**
 * L-piece orientation definitions for coordinate calculations
 * Each orientation defines the relative positions of the 4 cells that make up an L-piece
 */
export const L_PIECE_ORIENTATIONS = {
    0: [[0, 0], [0, 1], [0, 2], [1, 0]], // Standard L
    1: [[0, 0], [1, 0], [2, 0], [0, 1]], // Rotated 90°
    2: [[0, 1], [1, 1], [1, 0], [1, -1]], // Rotated 180°
    3: [[0, 0], [0, -1], [1, 0], [2, 0]], // Rotated 270°
    4: [[0, 0], [0, -1], [0, -2], [1, 0]], // Mirrored Standard L
    5: [[0, 0], [-1, 0], [-2, 0], [0, 1]], // Mirrored + 90°
    6: [[0, -1], [-1, -1], [-1, 0], [-1, 1]], // Mirrored + 180°
    7: [[0, 0], [0, 1], [-1, 0], [-2, 0]]  // Mirrored + 270°
};

/**
 * Default configuration for L-Game
 * Used when no specific configuration is provided
 */
export const DEFAULT_LGAME_CONFIG = createLGameConfig('standard');