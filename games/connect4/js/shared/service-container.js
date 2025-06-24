/**
 * Service Container - Dependency Injection System
 *
 * Provides clean dependency management for modular Connect4 architecture.
 * Enables loose coupling between components and easy test mocking.
 */

class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
  }

  /**
     * Register a service implementation for an interface
     * @param {string} serviceName - Service interface name (e.g., 'IBotFactory')
     * @param {Function|Object} implementation - Constructor or instance
     * @param {Object} options - Registration options
     */
  register(serviceName, implementation, options = {}) {
    // Validate parameters
    if (!serviceName) {
      throw new Error('Service name cannot be null or undefined');
    }
    if (implementation === null || implementation === undefined) {
      throw new Error('Implementation cannot be null or undefined');
    }

    const config = {
      singleton: options.singleton || false,
      factory: options.factory || false,
      dependencies: options.dependencies || [],
      ...options
    };

    this.services.set(serviceName, {
      implementation,
      config
    });

    return this;
  }

  /**
     * Register a singleton service (created once)
     * @param {string} serviceName - Service interface name
     * @param {Function} constructor - Service constructor
     * @param {Array} dependencies - Constructor dependencies
     */
  registerSingleton(serviceName, constructor, dependencies = []) {
    return this.register(serviceName, constructor, {
      singleton: true,
      dependencies
    });
  }

  /**
     * Register a factory for creating instances
     * @param {string} serviceName - Service interface name
     * @param {Function} factory - Factory function
     */
  registerFactory(serviceName, factory) {
    this.factories.set(serviceName, factory);
    return this;
  }

  /**
     * Resolve a service by interface name
     * @param {string} serviceName - Service interface to resolve
     * @returns {Object} Service instance
     */
  resolve(serviceName) {
    // Check for direct singleton instances first
    if (this.singletons.has(serviceName)) {
      return this.singletons.get(serviceName);
    }

    // Check for factory functions
    if (this.factories.has(serviceName)) {
      const factory = this.factories.get(serviceName);
      return factory(this);
    }

    // Resolve from registered services
    const serviceInfo = this.services.get(serviceName);
    if (!serviceInfo) {
      if (this.parent) {
        return this.parent.resolve(serviceName);
      }
      throw new Error(`Service '${serviceName}' not registered`);
    }

    const { implementation, config } = serviceInfo;

    // Handle singleton services
    if (config.singleton) {
      if (!this.singletons.has(serviceName)) {
        const instance = this.createInstance(implementation, config.dependencies);
        this.singletons.set(serviceName, instance);
      }
      return this.singletons.get(serviceName);
    }

    // Create new instance
    return this.createInstance(implementation, config.dependencies);
  }

  /**
     * Create an instance with dependency injection
     * @param {Function} constructor - Constructor function
     * @param {Array} dependencies - Dependency interface names
     * @returns {Object} Created instance
     */
  createInstance(constructor, dependencies = []) {
    if (typeof constructor !== 'function') {
      return constructor; // Already an instance
    }

    // Resolve dependencies recursively
    const resolvedDeps = dependencies.map(dep => this.resolve(dep));

    // Create instance with resolved dependencies
    return new constructor(...resolvedDeps);
  }

  /**
     * Check if a service is registered
     * @param {string} serviceName - Service interface name
     * @returns {boolean} True if registered
     */
  has(serviceName) {
    return this.services.has(serviceName) ||
               this.factories.has(serviceName) ||
               this.singletons.has(serviceName);
  }

  /**
     * Clear all registrations (useful for testing)
     */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  /**
     * Get service registration info for debugging
     * @param {string} serviceName - Service interface name
     * @returns {Object} Registration details
     */
  getInfo(serviceName) {
    return {
      registered: this.services.has(serviceName),
      singleton: this.singletons.has(serviceName),
      factory: this.factories.has(serviceName),
      config: this.services.get(serviceName)?.config
    };
  }

  /**
     * Create a child container with copied registrations
     * @returns {ServiceContainer} New container instance
     */
  createChild() {
    const child = new ServiceContainer();

    // Copy service registrations (but not singleton instances)
    for (const [serviceName, serviceInfo] of this.services) {
      child.services.set(serviceName, { ...serviceInfo });
    }

    // Copy factory registrations
    for (const [serviceName, factory] of this.factories) {
      child.factories.set(serviceName, factory);
    }

    return child;
  }
}

/**
 * Global service container instance
 * Use this for application-wide dependency injection
 */
const globalContainer = new ServiceContainer();

/**
 * Configure default Connect4 services
 * @param {ServiceContainer} container - Target container
 * @param {string} environment - Environment configuration ('production', 'development', 'testing')
 */
function configureConnect4Services(container = globalContainer, environment = 'production') {
  // Performance Services
  container.registerSingleton('IPerformanceManager', class PerformanceManager {
    constructor() {
      this.cacheEnabled = environment !== 'testing';
      this.stats = { hits: 0, misses: 0 };
    }

    getMoveFromCache() { return null; }
    cacheMoveResult() { return true; }
    getPerformanceStats() { return this.stats; }
    clearCaches() { this.stats = { hits: 0, misses: 0 }; }
  });

  // Error Handling Services
  container.registerSingleton('IErrorLogger', class ErrorLogger {
    constructor() {
      this.errors = [];
    }

    log(error, severity = 'ERROR') {
      this.errors.push({ error, severity, timestamp: Date.now() });
      if (environment === 'development') {
        console.error(`[${severity}]`, error);
      }
    }

    getErrors() { return [...this.errors]; }
    clear() { this.errors = []; }
  });

  container.register('IInputValidator', class InputValidator {
    static validateColumn(col) {
      if (typeof col !== 'number' || col < 0 || col > 6) {
        throw new Error(`Invalid column: ${col}`);
      }
      return true;
    }

    static validatePlayer(player) {
      if (player !== 1 && player !== 2) {
        throw new Error(`Invalid player: ${player}`);
      }
      return true;
    }
  });
  // Game Engine Services - Using mock implementations for now
  container.registerSingleton('IEventSystem', class MockEventSystem {
    constructor() {
      this.listeners = new Map();
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

    once(event, callback) {
      const onceCallback = (data) => {
        callback(data);
        this.off(event, onceCallback);
      };
      this.on(event, onceCallback);
    }

    removeAllListeners() {
      this.listeners.clear();
    }
  });

  container.registerSingleton('IPlayerManager', class MockPlayerManager {
    constructor() {
      this.players = { 1: 'Player 1', 2: 'Player 2' };
      this.currentPlayer = 1;
    }

    setPlayer(playerNum, name) {
      this.players[playerNum] = name;
    }

    getPlayer(playerNum) {
      return this.players[playerNum];
    }

    switchPlayer() {
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    resetPlayers() {
      this.currentPlayer = 1;
    }
  });

  container.registerSingleton('IScoreManager', class MockScoreManager {
    constructor() {
      this.scores = { 1: 0, 2: 0, draws: 0 };
    }

    updateScore(player) {
      if (player) {
        this.scores[player]++;
      } else {
        this.scores.draws++;
      }
    }

    getScore(player) {
      return this.scores[player];
    }

    resetScore() {
      this.scores = { 1: 0, 2: 0, draws: 0 };
    }

    saveScore() { /* Mock - no persistence */ }
    loadScore() { /* Mock - no persistence */ }
  });

  // AI Strategy Services - Mock implementations
  container.registerFactory('IBotStrategy', (_container) => {
    return (difficulty) => {
      return {
        getBestMove: () => 3, // Always center column
        getDifficulty: () => difficulty,
        getName: () => `Mock${difficulty}Bot`
      };
    };
  });

  // Helper System Services - Mock implementations
  container.registerSingleton('IThreatDetector', class MockThreatDetector {
    detectWinningMoves() { return []; }
    detectBlockingMoves() { return []; }
  });

  container.registerSingleton('ISafetyAnalyzer', class MockSafetyAnalyzer {
    analyzeMoveConsequences() { return { isWinning: false, blocksOpponent: false }; }
    getForkOpportunities() { return []; }
  });

  return container;
}

/**
 * Factory function for creating test containers
 * @returns {ServiceContainer} Container with mock services
 */
function createTestContainer() {
  const container = new ServiceContainer();

  // Register mock implementations for testing
  container.register('IEventSystem', class MockEventSystem {
    on() { return this; }
    emit() { return this; }
    off() { return this; }
  });

  container.register('IBotStrategy', class MockBotStrategy {
    getBestMove() { return 3; } // Always center column
  });

  return container;
}

export {
  ServiceContainer,
  globalContainer,
  configureConnect4Services,
  createTestContainer
};
