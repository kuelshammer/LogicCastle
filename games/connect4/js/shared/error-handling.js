/**
 * Error Handling and Resilience System
 *
 * Provides graceful degradation, retry logic, and comprehensive error tracking
 * for the Connect4 game system.
 */

/**
 * Custom error types for better error handling
 */
export class GameError extends Error {
    constructor(message, code = 'GAME_ERROR', context = {}) {
        super(message);
        this.name = 'GameError';
        this.code = code;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

export class AIError extends GameError {
    constructor(message, context = {}) {
        super(message, 'AI_ERROR', context);
        this.name = 'AIError';
    }
}

export class ValidationError extends GameError {
    constructor(message, context = {}) {
        super(message, 'VALIDATION_ERROR', context);
        this.name = 'ValidationError';
    }
}

export class ConfigurationError extends GameError {
    constructor(message, context = {}) {
        super(message, 'CONFIG_ERROR', context);
        this.name = 'ConfigurationError';
    }
}

/**
 * Error Logger with multiple outputs
 */
export class ErrorLogger {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.listeners = [];
    }

    log(error, severity = 'ERROR') {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            severity,
            error: {
                name: error.name,
                message: error.message,
                code: error.code || 'UNKNOWN',
                context: error.context || {},
                stack: error.stack
            }
        };

        // Add to memory log
        this.errors.push(errorEntry);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Console logging in development
        if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
            console.error(`[${severity}] ${error.name}: ${error.message}`, error.context);
        }

        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(errorEntry);
            } catch (listenerError) {
                console.error('Error in error listener:', listenerError);
            }
        });
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    getErrors(severity = null) {
        if (severity) {
            return this.errors.filter(e => e.severity === severity);
        }
        return [...this.errors];
    }

    clear() {
        this.errors = [];
    }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryHandler {
    static async retry(operation, options = {}) {
        const {
            maxAttempts = 3,
            baseDelay = 100,
            maxDelay = 1000,
            backoffFactor = 2,
            onRetry = null
        } = options;

        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt === maxAttempts) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);

                if (onRetry) {
                    onRetry(attempt, delay, error);
                }

                await this.delay(delay);
            }
        }

        throw new GameError(`Operation failed after ${maxAttempts} attempts`, 'RETRY_EXHAUSTED', {
            lastError: lastError.message,
            attempts: maxAttempts
        });
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Graceful degradation for AI operations
 */
export class AIFallbackHandler {
    constructor() {
        this.fallbackStrategies = new Map();
        this.setupDefaultFallbacks();
    }

    setupDefaultFallbacks() {
        // Fallback for AI bot failures
        this.fallbackStrategies.set('AI_FAILURE', (game, _difficulty) => {
            errorLogger.log(new AIError('AI bot failed, using random fallback'), 'WARN');

            // Simple random move as fallback
            const validColumns = [];
            for (let col = 0; col < 7; col++) {
                if (game.isValidMove(col)) {
                    validColumns.push(col);
                }
            }

            if (validColumns.length === 0) {
                throw new GameError('No valid moves available', 'GAME_STATE_ERROR');
            }

            return validColumns[Math.floor(Math.random() * validColumns.length)];
        });

        // Fallback for evaluation failures
        this.fallbackStrategies.set('EVALUATION_FAILURE', (_board, _player) => {
            errorLogger.log(new AIError('Board evaluation failed, using simple fallback'), 'WARN');
            return 0; // Neutral evaluation
        });
    }

    executeWithFallback(operation, fallbackType, ...args) {
        try {
            return operation(...args);
        } catch (error) {
            if (this.fallbackStrategies.has(fallbackType)) {
                const fallback = this.fallbackStrategies.get(fallbackType);
                return fallback(...args);
            }
            throw error;
        }
    }

    registerFallback(type, handler) {
        this.fallbackStrategies.set(type, handler);
    }
}

/**
 * Input validation with clear error messages
 */
export class InputValidator {
    static validateColumn(col) {
        if (typeof col !== 'number') {
            throw new ValidationError('Column must be a number', {
                provided: col,
                type: typeof col
            });
        }

        if (!Number.isInteger(col)) {
            throw new ValidationError('Column must be an integer', { provided: col });
        }

        if (col < 0 || col > 6) {
            throw new ValidationError('Column must be between 0 and 6', {
                provided: col,
                min: 0,
                max: 6
            });
        }

        return true;
    }

    static validatePlayer(player) {
        if (typeof player !== 'number') {
            throw new ValidationError('Player must be a number', {
                provided: player,
                type: typeof player
            });
        }

        if (player !== 1 && player !== 2) {
            throw new ValidationError('Player must be 1 or 2', { provided: player });
        }

        return true;
    }

    static validateBoard(board) {
        if (!Array.isArray(board)) {
            throw new ValidationError('Board must be an array', { provided: typeof board });
        }

        if (board.length !== 6) {
            throw new ValidationError('Board must have 6 rows', { provided: board.length });
        }

        for (let i = 0; i < board.length; i++) {
            if (!Array.isArray(board[i])) {
                throw new ValidationError(`Board row ${i} must be an array`, {
                    row: i,
                    provided: typeof board[i]
                });
            }

            if (board[i].length !== 7) {
                throw new ValidationError(`Board row ${i} must have 7 columns`, {
                    row: i,
                    provided: board[i].length
                });
            }

            for (let j = 0; j < board[i].length; j++) {
                const cell = board[i][j];
                if (typeof cell !== 'number' || (cell !== 0 && cell !== 1 && cell !== 2)) {
                    throw new ValidationError(`Invalid cell value at row ${i}, col ${j}`, {
                        row: i,
                        col: j,
                        provided: cell
                    });
                }
            }
        }

        return true;
    }

    static validateDifficulty(difficulty) {
        const validDifficulties = ['einfach', 'mittel', 'stark', 'expert'];

        if (typeof difficulty !== 'string') {
            throw new ValidationError('Difficulty must be a string', {
                provided: difficulty,
                type: typeof difficulty
            });
        }

        if (!validDifficulties.includes(difficulty.toLowerCase())) {
            throw new ValidationError('Invalid difficulty level', {
                provided: difficulty,
                valid: validDifficulties
            });
        }

        return true;
    }
}

/**
 * Circuit breaker for protecting against cascading failures
 */
export class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.threshold = threshold;
        this.timeout = timeout;
        this.failures = 0;
        this.lastFailure = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }

    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailure > this.timeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new GameError('Circuit breaker is OPEN', 'CIRCUIT_BREAKER_OPEN', {
                    failures: this.failures,
                    lastFailure: this.lastFailure
                });
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failures++;
        this.lastFailure = Date.now();

        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
        }
    }

    getState() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailure
        };
    }
}

// Global instances
export const errorLogger = new ErrorLogger();
export const fallbackHandler = new AIFallbackHandler();
export const circuitBreaker = new CircuitBreaker();

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', event => {
        errorLogger.log(
            new GameError(event.message, 'UNCAUGHT_ERROR', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            })
        );
    });

    window.addEventListener('unhandledrejection', event => {
        errorLogger.log(
            new GameError('Unhandled promise rejection', 'UNHANDLED_PROMISE', {
                reason: event.reason
            })
        );
    });
}
