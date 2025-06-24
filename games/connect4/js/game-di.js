/**
 * Connect4 Game with Dependency Injection
 *
 * Demonstrates how to integrate the DI system with existing game code.
 * This serves as a bridge between legacy code and the new modular architecture.
 */

import { defaultGameFactory, GAME_CONFIGURATIONS } from './shared/game-factory.js';
import { globalContainer as _globalContainer } from './shared/service-container.js';

/**
 * Enhanced Connect4 Game with Dependency Injection
 */
export class Connect4GameDI {
    constructor(gameBoard = null, config = {}) {
        this.gameBoard = gameBoard;
        this.config = {
            environment: GAME_CONFIGURATIONS.PRODUCTION,
            validateInterfaces: false,
            enableLogging: false,
            ...config
        };

        this.isInitialized = false;
        this.game = null;
        this.helpers = null;
        this.ui = null;
        this.aiFactory = null;
        this.container = null;
        this.currentBot = null;
    }

    /**
     * Initialize the game with dependency injection
     */
    async initialize() {
        if (this.isInitialized) return this;

        try {
            // Configure factory for the specified environment
            const factory = defaultGameFactory.configure(this.config.environment);

            // Create game with all dependencies
            const gameSetup = await factory.createGameWithUI(this.gameBoard, {
                validateInterfaces: this.config.validateInterfaces,
                testing: this.config.environment === GAME_CONFIGURATIONS.TESTING
            });

            // Extract dependencies
            this.game = gameSetup.game;
            this.helpers = gameSetup.helpers;
            this.ui = gameSetup.ui;
            this.aiFactory = gameSetup.aiFactory;
            this.container = gameSetup.container;

            // Set up event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            this.log('info', 'Game initialized successfully', {
                environment: this.config.environment,
                hasUI: !!this.ui
            });
        } catch (error) {
            this.log('error', 'Failed to initialize game', { error: error.message });
            throw error;
        }

        return this;
    }

    /**
     * Set up game event listeners
     */
    setupEventListeners() {
        if (!this.game) return;

        this.game.on('moveMade', data => {
            this.log('debug', 'Move made', data);
            this.onMoveMade(data);
        });

        this.game.on('gameWon', data => {
            this.log('info', 'Game won', data);
            this.onGameWon(data);
        });

        this.game.on('gameDraw', () => {
            this.log('info', 'Game draw');
            this.onGameDraw();
        });
    }

    /**
     * Handle move made event
     */
    onMoveMade(data) {
        if (this.ui) {
            this.ui.onMoveMade(data);
        }

        // Trigger bot move if appropriate
        if (this.shouldTriggerBot()) {
            this.triggerBotMove();
        }
    }

    /**
     * Handle game won event
     */
    onGameWon(data) {
        if (this.ui) {
            this.ui.onGameWon(data);
        }
        this.currentBot = null;
    }

    /**
     * Handle game draw event
     */
    onGameDraw() {
        if (this.ui) {
            this.ui.onGameDraw();
        }
        this.currentBot = null;
    }

    /**
     * Check if bot move should be triggered
     */
    shouldTriggerBot() {
        return this.currentBot && !this.game.isGameOver() && this.game.getCurrentPlayer() === 2; // Assuming bot is Player 2
    }

    /**
     * Trigger bot to make a move
     */
    async triggerBotMove() {
        if (!this.currentBot || this.game.isGameOver()) return;

        try {
            this.log('debug', 'Bot thinking...');

            const startTime = performance.now();
            const move = await this.currentBot.getBestMove(this.game, this.helpers);
            const thinkTime = performance.now() - startTime;

            this.log('debug', 'Bot move decision', {
                move,
                thinkTime: `${thinkTime.toFixed(2)}ms`,
                difficulty: this.currentBot.getDifficulty?.() || 'unknown'
            });

            if (typeof move === 'number' && move >= 0 && move < 7) {
                // Delay bot move for better UX
                setTimeout(
                    () => {
                        this.makeMove(move);
                    },
                    Math.min(500, Math.max(100, thinkTime * 2))
                );
            }
        } catch (error) {
            this.log('error', 'Bot move failed', { error: error.message });
        }
    }

    /**
     * Make a move in the game
     */
    makeMove(col) {
        if (!this.game || this.game.isGameOver()) {
            return { success: false, reason: 'Game not available or over' };
        }

        return this.game.makeMove(col);
    }

    /**
     * Start a new game
     */
    async newGame(mode = 'two-player', difficulty = 'medium') {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Reset game state
        if (this.game.reset) {
            this.game.reset();
        } else {
            // Fallback: recreate game instance
            const factory = defaultGameFactory.configure(this.config.environment);
            const gameSetup = await factory.createGame();
            this.game = gameSetup.game;
        }

        // Set up bot if needed
        if (mode.startsWith('vs-bot')) {
            try {
                this.currentBot = await this.aiFactory(difficulty);
                this.log('info', 'Bot created', { difficulty, name: this.currentBot.getName?.() });
            } catch (error) {
                this.log('error', 'Failed to create bot', { difficulty, error: error.message });
                this.currentBot = null;
            }
        } else {
            this.currentBot = null;
        }

        // Update UI if available
        if (this.ui && this.ui.newGame) {
            this.ui.newGame(mode, difficulty);
        }

        this.log('info', 'New game started', { mode, difficulty });
        return this;
    }

    /**
     * Get current game state
     */
    getGameState() {
        if (!this.game) return null;

        return {
            board: this.game.getBoard(),
            currentPlayer: this.game.getCurrentPlayer(),
            gameOver: this.game.isGameOver(),
            winner: this.game.getWinner(),
            validMoves: this.game.getValidMoves(),
            botActive: !!this.currentBot
        };
    }

    /**
     * Get game statistics
     */
    getStatistics() {
        return {
            initialized: this.isInitialized,
            environment: this.config.environment,
            hasBot: !!this.currentBot,
            hasUI: !!this.ui,
            containerServices: this.container ? Array.from(this.container.services.keys()) : []
        };
    }

    /**
     * Logging helper
     */
    log(level, message, data = {}) {
        if (!this.config.enableLogging) return;

        const logger = this.container?.resolve?.('ILogger');
        if (logger) {
            logger[level]?.(message, data);
        } else if (this.config.environment === GAME_CONFIGURATIONS.DEVELOPMENT) {
            console.log(`[${level.toUpperCase()}] Connect4GameDI: ${message}`, data);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.game && this.game.removeAllListeners) {
            this.game.removeAllListeners();
        }

        this.game = null;
        this.helpers = null;
        this.ui = null;
        this.aiFactory = null;
        this.currentBot = null;
        this.isInitialized = false;

        this.log('info', 'Game destroyed');
    }
}

/**
 * Factory function for creating DI-enabled games
 */
export function createConnect4Game(gameBoard = null, config = {}) {
    return new Connect4GameDI(gameBoard, config);
}

/**
 * Initialize Connect4 with dependency injection for the page
 */
export async function initializeConnect4DI(gameBoardSelector = '#gameBoard', config = {}) {
    const gameBoard = document.querySelector(gameBoardSelector);
    if (!gameBoard) {
        throw new Error(`Game board element not found: ${gameBoardSelector}`);
    }

    const game = createConnect4Game(gameBoard, {
        environment: GAME_CONFIGURATIONS.DEVELOPMENT,
        enableLogging: true,
        validateInterfaces: true,
        ...config
    });

    await game.initialize();
    return game;
}

// Global instance for backward compatibility
let globalGameInstance = null;

/**
 * Get or create global game instance
 */
export function getGlobalGameInstance() {
    return globalGameInstance;
}

/**
 * Set global game instance
 */
export function setGlobalGameInstance(instance) {
    globalGameInstance = instance;
}

// Auto-initialize if DOM is ready and gameBoard exists
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const gameBoard = document.querySelector('#gameBoard');
            if (gameBoard && !globalGameInstance) {
                initializeConnect4DI()
                    .then(instance => {
                        setGlobalGameInstance(instance);
                    })
                    .catch(error => {
                        console.error('Failed to auto-initialize Connect4DI:', error);
                    });
            }
        });
    }
}
