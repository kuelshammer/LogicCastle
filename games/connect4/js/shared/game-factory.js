/**
 * Game Factory with Dependency Injection
 *
 * Creates fully configured Connect4 game instances with all dependencies
 * properly injected. Supports different configurations for testing and production.
 */

import { globalContainer, configureConnect4Services } from './service-container.js';
import { validateInterface, SERVICE_INTERFACES } from './interfaces.js';

/**
 * Game Configuration Options
 */
export const GAME_CONFIGURATIONS = {
    PRODUCTION: 'production',
    TESTING: 'testing',
    DEVELOPMENT: 'development'
};

/**
 * Game Factory for creating configured Connect4 instances
 */
export class GameFactory {
    constructor(container = null) {
        this.container = container || globalContainer;
        this.isConfigured = false;
    }

    /**
     * Configure services for specific environment
     * @param {string} environment - Environment type
     */
    configure(environment = GAME_CONFIGURATIONS.PRODUCTION) {
        if (this.isConfigured) return this;

        switch (environment) {
            case GAME_CONFIGURATIONS.PRODUCTION:
                this.configureProduction();
                break;
            case GAME_CONFIGURATIONS.TESTING:
                this.configureTesting();
                break;
            case GAME_CONFIGURATIONS.DEVELOPMENT:
                this.configureDevelopment();
                break;
            default:
                throw new Error(`Unknown environment: ${environment}`);
        }

        this.isConfigured = true;
        return this;
    }

    /**
     * Configure for production environment
     */
    configureProduction() {
        configureConnect4Services(this.container);

        // Use the mock implementations from configureConnect4Services for now
        // TODO: Replace with real implementations when they're available
    }

    /**
     * Configure for testing environment
     */
    configureTesting() {
        // Mock implementations for fast testing
        this.container.register(
            'IGameEngine',
            class MockGameEngine {
                constructor() {
                    this.board = Array(6)
                        .fill()
                        .map(() => Array(7).fill(0));
                    this.currentPlayer = 1;
                    this.gameOver = false;
                    this.winner = null;
                    this.listeners = new Map();
                }

                makeMove(col) {
                    if (this.gameOver || col < 0 || col >= 7) {
                        return { success: false };
                    }

                    const row = this.findLowestRow(col);
                    if (row === -1) {
                        return { success: false };
                    }

                    this.board[row][col] = this.currentPlayer;
                    this.emit('moveMade', { row, col, player: this.currentPlayer });

                    if (this.checkWin(row, col)) {
                        this.gameOver = true;
                        this.winner = this.currentPlayer;
                        this.emit('gameWon', { winner: this.winner });
                    }

                    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                    return { success: true, row, col };
                }

                findLowestRow(col) {
                    for (let row = 5; row >= 0; row--) {
                        if (this.board[row][col] === 0) return row;
                    }
                    return -1;
                }

                checkWin(_row, _col) {
                    // Simplified win check for testing
                    return false;
                }

                getValidMoves() {
                    return [0, 1, 2, 3, 4, 5, 6].filter(col => this.board[0][col] === 0);
                }

                getBoard() {
                    return this.board.map(row => [...row]);
                }

                simulateMove(col, player = null) {
                    const currentPlayer = player || this.currentPlayer;
                    const row = this.findLowestRow(col);
                    return row !== -1 ? { row, col, player: currentPlayer } : null;
                }

                isGameOver() {
                    return this.gameOver;
                }
                getCurrentPlayer() {
                    return this.currentPlayer;
                }
                getWinner() {
                    return this.winner;
                }

                on(event, callback) {
                    if (!this.listeners.has(event)) {
                        this.listeners.set(event, []);
                    }
                    this.listeners.get(event).push(callback);
                }

                emit(event, data) {
                    if (this.listeners.has(event)) {
                        this.listeners.get(event).forEach(callback => callback(data));
                    }
                }

                off(event, callback) {
                    if (this.listeners.has(event)) {
                        const callbacks = this.listeners.get(event);
                        const index = callbacks.indexOf(callback);
                        if (index > -1) callbacks.splice(index, 1);
                    }
                }
            }
        );

        this.container.register(
            'IHelperSystem',
            class MockHelperSystem {
                detectWinningMoves() {
                    return [];
                }
                detectBlockingMoves() {
                    return [];
                }
                analyzeMoveConsequences() {
                    return { isWinning: false, blocksOpponent: false };
                }
                getForkOpportunities() {
                    return [];
                }
                getHint() {
                    return null;
                }
                updateHintLevel() {
                    return true;
                }
            }
        );

        this.container.registerFactory('IAIFactory', () => {
            return difficulty => ({
                getBestMove: () => 3, // Always center
                getDifficulty: () => difficulty,
                getName: () => `Mock${difficulty}Bot`
            });
        });
    }

    /**
     * Configure for development environment
     */
    configureDevelopment() {
        this.configureProduction();

        // Add development-specific services
        this.container.register(
            'ILogger',
            class DevLogger {
                log(level, message, data = {}) {
                    console.log(`[${level.toUpperCase()}] ${message}`, data);
                }

                debug(message, data) {
                    this.log('debug', message, data);
                }
                info(message, data) {
                    this.log('info', message, data);
                }
                warn(message, data) {
                    this.log('warn', message, data);
                }
                error(message, data) {
                    this.log('error', message, data);
                }
            }
        );

        this.container.register(
            'IPerformanceMonitor',
            class DevPerformanceMonitor {
                startTimer(name) {
                    this.timers = this.timers || new Map();
                    this.timers.set(name, performance.now());
                }

                endTimer(name) {
                    if (this.timers && this.timers.has(name)) {
                        const duration = performance.now() - this.timers.get(name);
                        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
                        this.timers.delete(name);
                        return duration;
                    }
                    return 0;
                }
            }
        );
    }

    /**
     * Create a new game instance with injected dependencies
     * @param {Object} options - Game creation options
     * @returns {Promise<Object>} Configured game instance
     */
    async createGame(options = {}) {
        if (!this.isConfigured) {
            this.configure();
        }

        const game = await this.container.resolve('IGameEngine');
        const helpers = await this.container.resolve('IHelperSystem');
        const aiFactory = await this.container.resolve('IAIFactory');

        // Validate interfaces in development mode
        if (options.validateInterfaces) {
            validateInterface(game, SERVICE_INTERFACES.IGameEngine, 'GameEngine');
            validateInterface(helpers, SERVICE_INTERFACES.IHelperSystem, 'HelperSystem');
        }

        return {
            game,
            helpers,
            aiFactory,
            container: this.container
        };
    }

    /**
     * Create a bot instance through the factory
     * @param {string} difficulty - Bot difficulty level
     * @returns {Promise<Object>} Bot instance
     */
    async createBot(difficulty) {
        if (!this.isConfigured) {
            this.configure();
        }

        const aiFactory = await this.container.resolve('IAIFactory');
        return await aiFactory(difficulty);
    }

    /**
     * Create game with UI controller
     * @param {HTMLElement} gameBoard - Game board DOM element
     * @param {Object} options - Creation options
     * @returns {Promise<Object>} Complete game setup
     */
    async createGameWithUI(gameBoard, options = {}) {
        const gameSetup = await this.createGame(options);

        // Create UI controller if not in testing mode
        if (gameBoard && !options.testing) {
            const UIModule = await import('../ui.js');
            const ui = new UIModule.Connect4UI(gameSetup.game, gameSetup.helpers, gameBoard);

            return {
                ...gameSetup,
                ui
            };
        }

        return gameSetup;
    }

    /**
     * Reset the factory configuration
     */
    reset() {
        this.container.clear();
        this.isConfigured = false;
        return this;
    }
}

/**
 * Default factory instance
 */
export const defaultGameFactory = new GameFactory();

/**
 * Convenience functions for common use cases
 */
export const createGame = options => defaultGameFactory.createGame(options);
export const createTestGame = () => {
    const testFactory = new GameFactory();
    return testFactory.configure(GAME_CONFIGURATIONS.TESTING).createGame();
};
export const createDevGame = gameBoard => {
    const devFactory = new GameFactory();
    return devFactory.configure(GAME_CONFIGURATIONS.DEVELOPMENT).createGameWithUI(gameBoard);
};
