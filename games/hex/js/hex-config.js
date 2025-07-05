/**
 * Hex Game UI Configuration
 * 
 * Comprehensive configuration for Hex Game UI modules replacing the 691-line
 * monolithic implementation with the standardized UI Module System.
 * 
 * Features migrated from legacy Hex Game:
 * - 11x11 hexagonal grid board
 * - SVG-based hexagonal rendering with precise coordinate mapping
 * - Connection-based win conditions (Red: left-right, Blue: top-bottom)
 * - BitPackedBoard integration for 93.4% memory efficiency
 * - Union-Find pathfinding algorithm
 * - Educational topology demonstrations
 */

export const HEX_UI_CONFIG = {
    // DOM Element Configuration
    elements: {
        // Core game elements (required)
        required: [
            'gameBoard',
            'currentPlayer',
            'gameStatus'
        ],
        
        // UI control elements (optional but expected)
        optional: [
            // Game board
            'hex-board',
            'hex-svg',
            'board-container',
            
            // Game info
            'current-player',
            'move-counter',
            'game-status',
            'player-indicator',
            
            // Control buttons
            'newGameBtn',
            'resetGameBtn',
            'undoMoveBtn',
            'showConnectionsBtn',
            'analysisBtn',
            
            // Game analysis
            'memory-stats',
            'bitpacked-info',
            'path-analysis',
            'connection-status',
            
            // Player info
            'red-goal',
            'blue-goal',
            'winner-display',
            
            // Debug and education
            'debug-panel',
            'topology-info',
            'coordinate-display',
            'loading-progress',
            
            // Help system
            'helpModal',
            'rulesModal',
            'topologyModal',
            'helpBtn',
            'rulesBtn',
            'topologyBtn',
            'closeHelpBtn',
            'closeRulesBtn',
            'closeTopologyBtn'
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
        
        topology: {
            id: 'topologyModal',
            closeKey: 'F3',
            closeOnEscape: true,
            closeOnOutsideClick: false // Educational content should be deliberate to close
        },
        
        analysis: {
            id: 'analysisModal',
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
        'F3': 'toggleTopology',
        'F12': 'toggleAnalysis',
        
        // Game controls
        'n': 'newGame',
        'N': 'newGame',
        'r': 'resetGame',
        'R': 'resetGame',
        'u': 'undoMove',
        'U': 'undoMove',
        'c': 'showConnections',
        'C': 'showConnections',
        'a': 'toggleAnalysis',
        'A': 'toggleAnalysis',
        
        // Board navigation
        'ArrowUp': 'moveCursorUp',
        'ArrowDown': 'moveCursorDown',
        'ArrowLeft': 'moveCursorLeft',
        'ArrowRight': 'moveCursorRight',
        'Enter': 'selectCell',
        ' ': 'selectCell', // Spacebar
        
        // Player shortcuts
        '1': 'switchToRed',
        '2': 'switchToBlue',
        
        // View controls
        '+': 'zoomIn',
        '-': 'zoomOut',
        '0': 'resetZoom',
        
        // Debug/educational
        'd': 'toggleDebug',
        'D': 'toggleDebug',
        't': 'toggleTopology',
        'T': 'toggleTopology'
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
                icon: '⬡'
            },
            connection: {
                duration: 4000,
                className: 'message-success',
                icon: '🔗'
            },
            topology: {
                duration: 5000,
                className: 'message-info',
                icon: '🧮'
            }
        }
    },

    // Animation Configuration
    animations: {
        duration: 400,
        easing: 'ease-in-out',
        
        // Hex-specific animations
        stonePlace: {
            duration: 300,
            easing: 'ease-out'
        },
        
        pathHighlight: {
            duration: 500,
            easing: 'ease-in-out'
        },
        
        connectionReveal: {
            duration: 800,
            easing: 'ease-in-out'
        },
        
        boardRotation: {
            duration: 600,
            easing: 'ease-in-out'
        },
        
        winningPath: {
            duration: 1000,
            easing: 'ease-in-out'
        }
    },

    // Game-specific UI settings
    gameSettings: {
        // Board configuration
        boardSize: 11, // 11x11 hexagonal grid
        
        // Hexagon rendering
        hexagon: {
            radius: 20,        // Hex radius in pixels
            spacing: 35,       // Distance between hex centers
            strokeWidth: 2,    // Border thickness
            offsetX: 50,       // Board offset from left
            offsetY: 50        // Board offset from top
        },
        
        // Player configuration
        players: {
            red: {
                color: '#DC2626',     // Red-600
                lightColor: '#FCA5A5', // Red-300
                goal: 'horizontal',    // left-right connection
                sides: ['left', 'right']
            },
            blue: {
                color: '#2563EB',     // Blue-600
                lightColor: '#93C5FD', // Blue-300
                goal: 'vertical',      // top-bottom connection
                sides: ['top', 'bottom']
            }
        },
        
        // Game mechanics
        gameMode: 'standard', // standard, tournament, educational
        winCondition: 'connection', // connection, territory (future)
        
        // BitPackedBoard settings
        bitPacked: {
            enabled: true,
            showStats: true,
            displayEfficiency: true
        },
        
        // Educational features
        educational: {
            showTopology: false,
            highlightPaths: true,
            showCoordinates: false,
            explainMoves: false
        },
        
        // Debug settings
        debug: {
            enabled: false,
            showNeighbors: false,
            showPathfinding: false,
            logMoves: false
        }
    },

    // Visual configuration
    visual: {
        // SVG board styling
        board: {
            backgroundColor: '#F9FAFB', // Gray-50
            borderColor: '#E5E7EB',     // Gray-200
            gridColor: '#D1D5DB'        // Gray-300
        },
        
        // Hexagon cell styling
        hexagon: {
            fillEmpty: '#FFFFFF',       // White
            strokeEmpty: '#9CA3AF',     // Gray-400
            strokeSelected: '#374151',  // Gray-700
            strokeWidth: 2,
            
            // Hover effects
            hoverFill: '#F3F4F6',      // Gray-100
            hoverStroke: '#6B7280',    // Gray-500
            
            // Selection effects
            selectedFill: '#FEF3C7',   // Yellow-100
            selectedStroke: '#F59E0B'  // Yellow-500
        },
        
        // Stone styling
        stone: {
            radius: 15,
            strokeWidth: 2,
            shadowEnabled: true,
            
            // Player colors
            red: {
                fill: '#DC2626',        // Red-600
                stroke: '#991B1B'       // Red-800
            },
            blue: {
                fill: '#2563EB',        // Blue-600
                stroke: '#1E40AF'       // Blue-800
            }
        },
        
        // Path visualization
        path: {
            strokeWidth: 4,
            opacity: 0.7,
            animationDuration: 1000,
            
            // Connection paths
            connection: {
                red: '#DC2626',
                blue: '#2563EB',
                winning: '#16A34A'      // Green-600
            }
        },
        
        // Goal areas
        goals: {
            red: {
                left: '#FEE2E2',       // Red-100
                right: '#FEE2E2'
            },
            blue: {
                top: '#DBEAFE',        // Blue-100
                bottom: '#DBEAFE'
            }
        }
    },

    // Responsive design breakpoints
    responsive: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440,
        
        // Responsive hex sizes
        hexSizes: {
            mobile: { radius: 15, spacing: 26 },
            tablet: { radius: 18, spacing: 32 },
            desktop: { radius: 20, spacing: 35 }
        }
    }
};

/**
 * Hexagonal coordinate system utilities
 * Converts between different coordinate representations
 */
export const HEX_COORDINATES = {
    /**
     * Convert row/col to hexagonal coordinates
     */
    toHex(row, col) {
        const q = col - Math.floor(row / 2);
        const r = row;
        return { q, r };
    },

    /**
     * Convert hexagonal coordinates to row/col
     */
    fromHex(q, r) {
        const row = r;
        const col = q + Math.floor(r / 2);
        return { row, col };
    },

    /**
     * Calculate pixel position for hexagon
     */
    toPixel(row, col, hexRadius, hexSpacing, offsetX, offsetY) {
        const x = offsetX + col * hexSpacing + (row % 2) * (hexSpacing / 2);
        const y = offsetY + row * hexSpacing * 0.866; // sin(60°) ≈ 0.866
        return { x, y };
    },

    /**
     * Get neighbors for hexagonal grid
     */
    getNeighbors(row, col, boardSize = 11) {
        const neighbors = [];
        const isEvenRow = row % 2 === 0;
        
        // Hexagonal neighbor offsets
        const offsets = isEvenRow 
            ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
            : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
        
        for (const [dRow, dCol] of offsets) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (newRow >= 0 && newRow < boardSize && 
                newCol >= 0 && newCol < boardSize) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        
        return neighbors;
    }
};

/**
 * Create dynamic Hex configuration based on game mode and settings
 * @param {string} gameMode - The selected game mode
 * @param {Object} options - Additional configuration options
 * @returns {Object} Customized configuration
 */
export function createHexConfig(gameMode = 'standard', options = {}) {
    // Deep copy the configuration to avoid reference issues
    const config = JSON.parse(JSON.stringify(HEX_UI_CONFIG));
    
    // Adjust settings based on game mode
    switch (gameMode) {
        case 'standard':
            config.gameSettings.educational.showTopology = false;
            config.gameSettings.debug.enabled = false;
            break;
            
        case 'tournament':
            config.gameSettings.educational.showTopology = false;
            config.gameSettings.debug.enabled = false;
            config.gameSettings.bitPacked.showStats = false;
            config.animations.duration = 200; // Faster for competitive play
            break;
            
        case 'educational':
            config.gameSettings.educational.showTopology = true;
            config.gameSettings.educational.highlightPaths = true;
            config.gameSettings.educational.showCoordinates = true;
            config.gameSettings.educational.explainMoves = true;
            config.gameSettings.bitPacked.showStats = true;
            config.keyboard['t'] = 'toggleTopology';
            config.keyboard['T'] = 'toggleTopology';
            break;
            
        case 'debug':
            config.gameSettings.debug.enabled = true;
            config.gameSettings.debug.showNeighbors = true;
            config.gameSettings.debug.showPathfinding = true;
            config.gameSettings.debug.logMoves = true;
            config.gameSettings.educational.showCoordinates = true;
            break;
    }
    
    // Apply custom options
    if (options.hexRadius) {
        config.gameSettings.hexagon.radius = options.hexRadius;
    }
    
    if (options.boardSize) {
        config.gameSettings.boardSize = options.boardSize;
    }
    
    if (options.educational !== undefined) {
        Object.assign(config.gameSettings.educational, options.educational);
    }
    
    return config;
}

/**
 * Default configuration for Hex Game
 * Used when no specific configuration is provided
 */
export const DEFAULT_HEX_CONFIG = createHexConfig('standard');