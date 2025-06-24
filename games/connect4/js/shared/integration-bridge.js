/**
 * Integration Bridge - Seamless Connection Between Legacy and Clean Architecture
 *
 * This bridge enables gradual migration from legacy code to clean architecture
 * while maintaining full backwards compatibility and providing enhanced features.
 */

import { defaultCleanArchitecture } from './clean-architecture.js';
import { defaultArchitectureBridge } from './architecture-adapters.js';
import { globalContainer } from './service-container.js';

/**
 * Integration Bridge Class
 * Provides seamless integration between legacy Connect4 code and clean architecture
 */
export class IntegrationBridge {
  constructor() {
    this.cleanArchitecture = defaultCleanArchitecture;
    this.architectureBridge = defaultArchitectureBridge;
    this.container = globalContainer;

    this.legacyComponents = {};
    this.adapters = {};
    this.isIntegrated = false;

    this.migrationMode = 'gradual'; // 'gradual' | 'full' | 'legacy'
    this.featureFlags = new Map();

    this.setupFeatureFlags();
  }

  /**
     * Setup feature flags for gradual migration
     */
  setupFeatureFlags() {
    this.featureFlags.set('useCleanArchitectureForMoves', true);
    this.featureFlags.set('useCleanArchitectureForAI', true);
    this.featureFlags.set('useCleanArchitectureForHints', true);
    this.featureFlags.set('useCleanArchitectureForUI', false); // Start with legacy UI
    this.featureFlags.set('useCleanArchitectureForPersistence', true);
    this.featureFlags.set('enableAnalytics', true);
    this.featureFlags.set('enableAdvancedLogging', false);
  }

  /**
     * Integrate legacy components with clean architecture
     * @param {Object} components - Legacy component instances
     * @returns {Promise<IntegrationBridge>} This instance for chaining
     */
  async integrate(components = {}) {
    if (this.isIntegrated) return this;

    // Store legacy components
    this.legacyComponents = { ...components };

    // Initialize clean architecture
    await this.cleanArchitecture.initialize();
    await this.architectureBridge.initialize();

    // Create adapters for legacy components
    this.adapters = await this.architectureBridge.createAdapters(components);

    // Setup integrated services
    await this.setupIntegratedServices();

    // Setup event bridges
    this.setupEventBridges();

    this.isIntegrated = true;
    console.log('🔧 Integration Bridge: Successfully integrated legacy components with clean architecture');

    return this;
  }

  /**
     * Setup integrated services that work with both architectures
     */
  async setupIntegratedServices() {
    // Integrated Game Service
    this.container.register('IIntegratedGameService', class IntegratedGameService {
      constructor(cleanArch, legacyGame, featureFlags) {
        this.cleanArch = cleanArch;
        this.legacyGame = legacyGame;
        this.featureFlags = featureFlags;
      }

      async makeMove(column, player) {
        if (this.featureFlags.get('useCleanArchitectureForMoves')) {
          return await this.cleanArch.execute('game', 'makeMove', { column, player });
        }
        // Use legacy implementation
        return this.legacyGame.makeMove(column);

      }

      async getAIMove(difficulty) {
        if (this.featureFlags.get('useCleanArchitectureForAI')) {
          const result = await this.cleanArch.execute('game', 'getAIMove', {
            difficulty,
            player: this.getCurrentPlayer()
          });
          return result.recommended.column;
        }
        // Use legacy AI
        return this.legacyGame.ai?.getBestMove(this.legacyGame) || 3;

      }

      async getHint(level = 1) {
        if (this.featureFlags.get('useCleanArchitectureForHints')) {
          return await this.cleanArch.execute('game', 'getHint', { level });
        }
        // Use legacy helpers
        return this.legacyGame.helpers?.getHint() || null;

      }

      getCurrentPlayer() {
        return this.legacyGame.currentPlayer || 1;
      }

      getBoard() {
        return this.legacyGame.getBoard();
      }

      isGameOver() {
        return this.legacyGame.gameOver || false;
      }

      getWinner() {
        return this.legacyGame.winner || null;
      }
    }, {
      singleton: true,
      dependencies: ['ICleanArchitecture', 'ILegacyGame', 'IFeatureFlags']
    });

    // Register dependencies
    this.container.register('ICleanArchitecture', () => this.cleanArchitecture);
    this.container.register('ILegacyGame', () => this.legacyComponents.game);
    this.container.register('IFeatureFlags', () => this.featureFlags);

    // Integrated AI Service
    this.container.register('IIntegratedAIService', class IntegratedAIService {
      constructor(cleanArch, legacyAI, featureFlags) {
        this.cleanArch = cleanArch;
        this.legacyAI = legacyAI;
        this.featureFlags = featureFlags;
        this.aiCache = new Map();
      }

      async getBestMove(gameState, difficulty = 'medium') {
        const cacheKey = `${JSON.stringify(gameState.board)}_${difficulty}`;

        if (this.aiCache.has(cacheKey)) {
          return this.aiCache.get(cacheKey);
        }

        let move;
        if (this.featureFlags.get('useCleanArchitectureForAI')) {
          const result = await this.cleanArch.execute('game', 'getAIMove', {
            difficulty,
            player: gameState.currentPlayer
          });
          move = result.recommended.column;
        } else {
          move = this.legacyAI.getBestMove(gameState);
        }

        // Cache result for performance
        this.aiCache.set(cacheKey, move);

        // Clear cache when it gets too large
        if (this.aiCache.size > 100) {
          this.aiCache.clear();
        }

        return move;
      }

      clearCache() {
        this.aiCache.clear();
      }

      getDifficulty() {
        return this.legacyAI?.difficulty || 'medium';
      }
    }, {
      singleton: true,
      dependencies: ['ICleanArchitecture', 'ILegacyAI', 'IFeatureFlags']
    });

    this.container.register('ILegacyAI', () => this.legacyComponents.ai);
  }

  /**
     * Setup event bridges between legacy and clean architecture
     */
  setupEventBridges() {
    // Bridge legacy game events to clean architecture
    if (this.legacyComponents.game?.on) {
      this.legacyComponents.game.on('moveMade', async (moveData) => {
        if (this.featureFlags.get('enableAnalytics')) {
          await this.logAnalytics('moveMade', moveData);
        }
      });

      this.legacyComponents.game.on('gameWon', async (winData) => {
        if (this.featureFlags.get('enableAnalytics')) {
          await this.logAnalytics('gameWon', winData);
        }
      });
    }

    // Bridge UI events if legacy UI exists
    if (this.legacyComponents.ui?.on) {
      this.legacyComponents.ui.on('columnClick', async (column) => {
        await this.handleIntegratedMove(column);
      });
    }
  }

  /**
     * Handle move using integrated service
     * @param {number} column - Column to play
     */
  async handleIntegratedMove(column) {
    try {
      const gameService = await this.container.resolve('IIntegratedGameService');
      const currentPlayer = gameService.getCurrentPlayer();

      const result = await gameService.makeMove(column, currentPlayer);

      if (result.success) {
        // Update legacy UI if needed
        if (this.legacyComponents.ui && !this.featureFlags.get('useCleanArchitectureForUI')) {
          this.legacyComponents.ui.onMoveMade?.(result.move || result);
        }

        // Check for AI move if in bot mode
        if (this.isInBotMode() && !gameService.isGameOver()) {
          await this.handleAIMove();
        }
      }
    } catch (_error) {
      console.error('Integrated move handling failed:', error);
    }
  }

  /**
     * Handle AI move using integrated service
     */
  async handleAIMove() {
    try {
      const gameService = await this.container.resolve('IIntegratedGameService');
      const aiService = await this.container.resolve('IIntegratedAIService');

      const _gameState = {
        board: gameService.getBoard(),
        currentPlayer: gameService.getCurrentPlayer()
      };

      const difficulty = aiService.getDifficulty();
      const aiMove = await aiService.getBestMove(_gameState, difficulty);

      if (aiMove !== null && aiMove !== undefined) {
        const result = await gameService.makeMove(aiMove, gameService.getCurrentPlayer());

        if (result.success && this.legacyComponents.ui) {
          this.legacyComponents.ui.onMoveMade?.(result.move || result);
        }
      }
    } catch (_error) {
      console.error('AI move handling failed:', error);
    }
  }

  /**
     * Check if game is in bot mode
     * @returns {boolean} True if in bot mode
     */
  isInBotMode() {
    return this.legacyComponents.ui?.gameMode?.includes('bot') || false;
  }

  /**
     * Log analytics through clean architecture
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
  async logAnalytics(event, data) {
    try {
      const infrastructure = this.cleanArchitecture.getInfrastructure();
      const analytics = await infrastructure.getService('IAnalyticsService');

      switch (event) {
      case 'moveMade':
        analytics.trackMove(data);
        break;
      case 'gameWon':
        analytics.trackGameEnd(data);
        break;
      default:
        console.log(`Analytics: ${event}`, data);
      }
    } catch (_error) {
      console.warn('Analytics logging failed:', error);
    }
  }

  /**
     * Set feature flag
     * @param {string} flag - Feature flag name
     * @param {boolean} value - Flag value
     */
  setFeatureFlag(flag, value) {
    this.featureFlags.set(flag, value);
    console.log(`🚩 Feature flag '${flag}' set to ${value}`);
  }

  /**
     * Get feature flag value
     * @param {string} flag - Feature flag name
     * @returns {boolean} Flag value
     */
  getFeatureFlag(flag) {
    return this.featureFlags.get(flag) || false;
  }

  /**
     * Set migration mode
     * @param {string} mode - Migration mode ('gradual' | 'full' | 'legacy')
     */
  setMigrationMode(mode) {
    this.migrationMode = mode;

    switch (mode) {
    case 'full':
      // Enable all clean architecture features
      this.featureFlags.set('useCleanArchitectureForMoves', true);
      this.featureFlags.set('useCleanArchitectureForAI', true);
      this.featureFlags.set('useCleanArchitectureForHints', true);
      this.featureFlags.set('useCleanArchitectureForUI', true);
      break;
    case 'legacy':
      // Disable all clean architecture features
      this.featureFlags.set('useCleanArchitectureForMoves', false);
      this.featureFlags.set('useCleanArchitectureForAI', false);
      this.featureFlags.set('useCleanArchitectureForHints', false);
      this.featureFlags.set('useCleanArchitectureForUI', false);
      break;
    case 'gradual':
    default:
      // Keep current settings for gradual migration
      break;
    }

    console.log(`🔄 Migration mode set to: ${mode}`);
  }

  /**
     * Get migration status
     * @returns {Object} Migration status information
     */
  getMigrationStatus() {
    return {
      mode: this.migrationMode,
      isIntegrated: this.isIntegrated,
      featureFlags: Object.fromEntries(this.featureFlags),
      componentsIntegrated: {
        game: !!this.legacyComponents.game,
        ai: !!this.legacyComponents.ai,
        helpers: !!this.legacyComponents.helpers,
        ui: !!this.legacyComponents.ui
      },
      adaptersCreated: {
        game: !!this.adapters.game,
        ai: !!this.adapters.ai,
        helpers: !!this.adapters.helpers,
        ui: !!this.adapters.ui
      }
    };
  }

  /**
     * Execute action through integrated service
     * @param {string} service - Service name
     * @param {string} action - Action name
     * @param {...any} args - Action arguments
     * @returns {Promise<any>} Action result
     */
  async execute(service, action, ...args) {
    if (!this.isIntegrated) {
      throw new Error('Integration bridge not initialized. Call integrate() first.');
    }

    const serviceInstance = await this.container.resolve(`IIntegrated${service}Service`);

    if (typeof serviceInstance[action] !== 'function') {
      throw new Error(`Action '${action}' not available on service: ${service}`);
    }

    return await serviceInstance[action](...args);
  }

  /**
     * Get legacy component
     * @param {string} name - Component name
     * @returns {Object} Legacy component instance
     */
  getLegacyComponent(name) {
    return this.legacyComponents[name];
  }

  /**
     * Get adapter
     * @param {string} name - Adapter name
     * @returns {Object} Adapter instance
     */
  getAdapter(name) {
    return this.adapters[name];
  }

  /**
     * Get clean architecture instance
     * @returns {CleanArchitecture} Clean architecture instance
     */
  getCleanArchitecture() {
    return this.cleanArchitecture;
  }

  /**
     * Perform health check on integration
     * @returns {Object} Health check results
     */
  async performHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      issues: [],
      warnings: []
    };

    try {
      // Check if integration is initialized
      if (!this.isIntegrated) {
        results.issues.push('Integration bridge not initialized');
        results.status = 'unhealthy';
      }

      // Check clean architecture
      if (!this.cleanArchitecture.isInitialized) {
        results.issues.push('Clean architecture not initialized');
        results.status = 'unhealthy';
      }

      // Check services
      try {
        await this.container.resolve('IIntegratedGameService');
      } catch (_error) {
        results.issues.push('Integrated game service not available');
        results.status = 'unhealthy';
      }

      try {
        await this.container.resolve('IIntegratedAIService');
      } catch (_error) {
        results.issues.push('Integrated AI service not available');
        results.status = 'unhealthy';
      }

      // Check legacy components
      if (!this.legacyComponents.game) {
        results.warnings.push('No legacy game component registered');
      }

      if (!this.legacyComponents.ai) {
        results.warnings.push('No legacy AI component registered');
      }

      // Check feature flags consistency
      if (this.migrationMode === 'full' && !this.featureFlags.get('useCleanArchitectureForMoves')) {
        results.warnings.push('Migration mode is full but not all features enabled');
      }

    } catch (_error) {
      results.issues.push(`Health check failed: ${error.message}`);
      results.status = 'unhealthy';
    }

    return results;
  }
}

/**
 * Default integration bridge instance
 */
export const defaultIntegrationBridge = new IntegrationBridge();

/**
 * Convenience function for integrating components
 * @param {Object} components - Legacy components to integrate
 * @returns {Promise<IntegrationBridge>} Integration bridge instance
 */
export const integrateComponents = async (components) => {
  return await defaultIntegrationBridge.integrate(components);
};

/**
 * Convenience function for executing integrated actions
 * @param {string} service - Service name
 * @param {string} action - Action name
 * @param {...any} args - Action arguments
 * @returns {Promise<any>} Action result
 */
export const executeIntegrated = async (service, action, ...args) => {
  return await defaultIntegrationBridge.execute(service, action, ...args);
};
