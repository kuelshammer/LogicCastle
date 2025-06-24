/**
 * Standardized Interfaces for Connect4 Modular Architecture
 *
 * Comprehensive interface definitions that ensure consistent contracts
 * across all modules and enable seamless interoperability.
 */

import { _validateInterface, createInterfaceProxy } from './interfaces.js';

/**
 * Core Game Interfaces
 */

// Enhanced Game Engine Interface
export const IGameEngine = {
  // Core game operations
  makeMove: 'function',
  undoMove: 'function',
  reset: 'function',

  // Game state queries
  getBoard: 'function',
  getCurrentPlayer: 'function',
  getValidMoves: 'function',
  getMoveHistory: 'function',

  // Game status
  isGameOver: 'function',
  getWinner: 'function',
  isDraw: 'function',

  // Simulation and analysis
  simulateMove: 'function',
  evaluatePosition: 'function',

  // Event system
  on: 'function',
  emit: 'function',
  off: 'function',

  // Configuration
  getConfig: 'function',
  setConfig: 'function'
};

// Enhanced AI Strategy Interface
export const IBotStrategy = {
  // Core AI operations
  getBestMove: 'function',
  evaluatePosition: 'function',

  // Strategy information
  getDifficulty: 'function',
  getName: 'function',
  getDescription: 'function',

  // Performance metrics
  getThinkingTime: 'function',
  getConfidence: 'function',
  getNodesExplored: 'function',

  // Configuration
  setDepth: 'function',
  setTimeout: 'function',

  // Analysis
  explainMove: 'function',
  getAlternatives: 'function'
};

// AI Factory Interface
export const IAIFactory = {
  createBot: 'function',
  getSupportedDifficulties: 'function',
  getDefaultDifficulty: 'function',
  validateDifficulty: 'function'
};

// Enhanced Helper System Interface
export const IHelperSystem = {
  // Threat analysis
  detectWinningMoves: 'function',
  detectBlockingMoves: 'function',
  detectThreats: 'function',

  // Strategic analysis
  analyzeMoveConsequences: 'function',
  getForkOpportunities: 'function',
  getSetupMoves: 'function',

  // Position evaluation
  evaluatePosition: 'function',
  getPositionStrength: 'function',

  // Hint system
  getHint: 'function',
  getHintExplanation: 'function',
  updateHintLevel: 'function',

  // Configuration
  setDifficulty: 'function',
  enableFeature: 'function',
  disableFeature: 'function'
};

/**
 * UI and Presentation Interfaces
 */

// Enhanced UI Controller Interface
export const IUIController = {
  // Rendering
  render: 'function',
  updateBoard: 'function',
  updateStatus: 'function',

  // User interactions
  handleColumnClick: 'function',
  handleButtonClick: 'function',
  handleKeyPress: 'function',

  // Game state updates
  onMoveMade: 'function',
  onGameOver: 'function',
  onPlayerChanged: 'function',

  // Visual feedback
  showMessage: 'function',
  showHint: 'function',
  highlightCells: 'function',
  animateMove: 'function',

  // Mode management
  setMode: 'function',
  getMode: 'function',

  // Configuration
  setTheme: 'function',
  enableSounds: 'function',
  setAnimationSpeed: 'function'
};

// Animation Controller Interface
export const IAnimationController = {
  // Animation operations
  animateMove: 'function',
  animateWin: 'function',
  animateHint: 'function',

  // Animation control
  pauseAnimation: 'function',
  resumeAnimation: 'function',
  stopAnimation: 'function',

  // Configuration
  setSpeed: 'function',
  setEasing: 'function',
  enableAnimations: 'function',

  // Callbacks
  onAnimationComplete: 'function',
  onAnimationStart: 'function'
};

// Sound Controller Interface
export const ISoundController = {
  // Sound operations
  playMove: 'function',
  playWin: 'function',
  playError: 'function',
  playHint: 'function',

  // Volume control
  setVolume: 'function',
  getVolume: 'function',
  mute: 'function',
  unmute: 'function',

  // Sound management
  preloadSounds: 'function',
  enableSounds: 'function',
  disableSounds: 'function'
};

/**
 * State Management Interfaces
 */

// Enhanced Score Manager Interface
export const IScoreManager = {
  // Score operations
  updateScore: 'function',
  getScore: 'function',
  resetScore: 'function',

  // Statistics
  getWinRate: 'function',
  getGameStats: 'function',
  getTotalGames: 'function',

  // Persistence
  saveScore: 'function',
  loadScore: 'function',
  exportStats: 'function',
  importStats: 'function',

  // Events
  onScoreChanged: 'function',
  onStatisticsUpdated: 'function'
};

// Enhanced Player Manager Interface
export const IPlayerManager = {
  // Player operations
  setPlayer: 'function',
  getPlayer: 'function',
  switchPlayer: 'function',
  resetPlayers: 'function',

  // Player configuration
  setPlayerName: 'function',
  setPlayerType: 'function',
  getPlayerType: 'function',

  // Player state
  getCurrentPlayer: 'function',
  getOpponentPlayer: 'function',
  isPlayerHuman: 'function',
  isPlayerBot: 'function',

  // Events
  onPlayerChanged: 'function',
  onPlayerConfigured: 'function'
};

// Game State Manager Interface
export const IGameStateManager = {
  // State operations
  saveState: 'function',
  loadState: 'function',
  getState: 'function',
  setState: 'function',

  // History management
  getHistory: 'function',
  addToHistory: 'function',
  clearHistory: 'function',

  // Snapshots
  createSnapshot: 'function',
  restoreSnapshot: 'function',
  listSnapshots: 'function',

  // Validation
  validateState: 'function',
  isStateValid: 'function'
};

/**
 * Infrastructure Interfaces
 */

// Repository Interface
export const IRepository = {
  // CRUD operations
  save: 'function',
  load: 'function',
  delete: 'function',
  exists: 'function',

  // Query operations
  find: 'function',
  findAll: 'function',
  count: 'function',

  // Batch operations
  saveMany: 'function',
  deleteMany: 'function'
};

// Storage Adapter Interface
export const IStorageAdapter = {
  // Storage operations
  set: 'function',
  get: 'function',
  remove: 'function',
  clear: 'function',

  // Batch operations
  setMany: 'function',
  getMany: 'function',

  // Storage info
  getSize: 'function',
  getKeys: 'function',
  exists: 'function'
};

// Logger Interface
export const ILogger = {
  // Logging levels
  debug: 'function',
  info: 'function',
  warn: 'function',
  error: 'function',

  // Configuration
  setLevel: 'function',
  getLevel: 'function',
  enableTimestamps: 'function',

  // Output
  flush: 'function',
  clear: 'function'
};

// Analytics Service Interface
export const IAnalyticsService = {
  // Event tracking
  trackEvent: 'function',
  trackMove: 'function',
  trackGameEnd: 'function',
  trackBotPerformance: 'function',

  // User tracking
  trackUser: 'function',
  setUserProperty: 'function',

  // Configuration
  enable: 'function',
  disable: 'function',
  isEnabled: 'function'
};

// Performance Monitor Interface
export const IPerformanceMonitor = {
  // Timing
  startTimer: 'function',
  endTimer: 'function',
  measureFunction: 'function',

  // Memory monitoring
  getMemoryUsage: 'function',
  trackMemory: 'function',

  // Reporting
  getReport: 'function',
  exportMetrics: 'function',
  clearMetrics: 'function'
};

/**
 * Module-Specific Interfaces
 */

// Threat Detector Interface
export const IThreatDetector = {
  detectWinningMoves: 'function',
  detectBlockingMoves: 'function',
  detectForks: 'function',
  detectSetups: 'function',
  analyzeThreatLevel: 'function',
  countThreats: 'function'
};

// Safety Analyzer Interface
export const ISafetyAnalyzer = {
  analyzeMoveConsequences: 'function',
  isSafeMove: 'function',
  getTrappedColumns: 'function',
  evaluateSafety: 'function',
  predictOpponentResponse: 'function'
};

// Opportunity Analyzer Interface
export const IOpportunityAnalyzer = {
  getForkOpportunities: 'function',
  getSetupMoves: 'function',
  findBestMoves: 'function',
  analyzeOpportunities: 'function',
  rankMoves: 'function'
};

// Move Validator Interface
export const IMoveValidator = {
  isValidMove: 'function',
  validateMoveSequence: 'function',
  checkMoveConstraints: 'function',
  getValidationErrors: 'function'
};

// Hint Manager Interface
export const IHintManager = {
  getHint: 'function',
  getHintExplanation: 'function',
  updateHintLevel: 'function',
  setHintMode: 'function',
  enableHints: 'function',
  disableHints: 'function'
};

/**
 * Interface Registry
 * Central registry for all standardized interfaces
 */
export const STANDARDIZED_INTERFACES = {
  // Core Game
  IGameEngine,
  IBotStrategy,
  IAIFactory,
  IHelperSystem,

  // UI and Presentation
  IUIController,
  IAnimationController,
  ISoundController,

  // State Management
  IScoreManager,
  IPlayerManager,
  IGameStateManager,

  // Infrastructure
  IRepository,
  IStorageAdapter,
  ILogger,
  IAnalyticsService,
  IPerformanceMonitor,

  // Module-Specific
  IThreatDetector,
  ISafetyAnalyzer,
  IOpportunityAnalyzer,
  IMoveValidator,
  IHintManager
};

/**
 * Interface Validator
 * Validates objects against standardized interfaces with detailed reporting
 */
export class InterfaceValidator {
  constructor() {
    this.validationCache = new Map();
    this.strictMode = false;
  }

  /**
     * Enable strict mode validation
     * @param {boolean} enabled - Whether to enable strict mode
     */
  setStrictMode(enabled) {
    this.strictMode = enabled;
    if (enabled) {
      this.validationCache.clear();
    }
  }

  /**
     * Validate object against interface with detailed reporting
     * @param {Object} obj - Object to validate
     * @param {string} interfaceName - Interface name
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
  validate(obj, interfaceName, options = {}) {
    const cacheKey = `${interfaceName}_${JSON.stringify(Object.keys(obj || {}))}`;

    if (!this.strictMode && this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }

    const interfaceDefinition = STANDARDIZED_INTERFACES[interfaceName];
    if (!interfaceDefinition) {
      return {
        isValid: false,
        errors: [`Unknown interface: ${interfaceName}`],
        warnings: [],
        missing: [],
        extra: [],
        summary: 'Unknown interface'
      };
    }

    const result = this.performValidation(obj, interfaceDefinition, interfaceName, options);

    if (!this.strictMode) {
      this.validationCache.set(cacheKey, result);
    }

    return result;
  }

  /**
     * Perform detailed validation
     * @param {Object} obj - Object to validate
     * @param {Object} interfaceDefinition - Interface definition
     * @param {string} interfaceName - Interface name
     * @param {Object} options - Validation options
     * @returns {Object} Detailed validation result
     */
  performValidation(obj, interfaceDefinition, interfaceName, options) {
    const errors = [];
    const warnings = [];
    const missing = [];
    const extra = [];

    if (!obj || typeof obj !== 'object') {
      return {
        isValid: false,
        errors: ['Object is null, undefined, or not an object'],
        warnings,
        missing,
        extra,
        summary: 'Invalid object'
      };
    }

    // Check required properties
    for (const [property, expectedType] of Object.entries(interfaceDefinition)) {
      if (!(property in obj)) {
        missing.push(property);
        errors.push(`Missing required property: ${property}`);
        continue;
      }

      const actualType = typeof obj[property];
      if (actualType !== expectedType) {
        errors.push(`Wrong type for ${property}: expected ${expectedType}, got ${actualType}`);
      }
    }

    // Check for extra properties (if strict mode or option enabled)
    if (this.strictMode || options.checkExtra) {
      for (const property in obj) {
        if (!(property in interfaceDefinition)) {
          extra.push(property);
          if (this.strictMode) {
            warnings.push(`Extra property not in interface: ${property}`);
          }
        }
      }
    }

    // Generate summary
    const totalRequired = Object.keys(interfaceDefinition).length;
    const implemented = totalRequired - missing.length;
    const percentage = Math.round((implemented / totalRequired) * 100);

    let summary;
    if (errors.length === 0) {
      summary = `✅ Fully compliant (${percentage}%)`;
    } else {
      summary = `❌ ${errors.length} errors, ${implemented}/${totalRequired} implemented (${percentage}%)`;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missing,
      extra,
      summary,
      compliance: {
        percentage,
        implemented,
        total: totalRequired,
        missing: missing.length,
        extra: extra.length
      }
    };
  }

  /**
     * Validate multiple objects against their interfaces
     * @param {Object} objects - Map of interfaceName -> object
     * @returns {Object} Validation results for all objects
     */
  validateMultiple(objects) {
    const results = {};

    for (const [interfaceName, obj] of Object.entries(objects)) {
      results[interfaceName] = this.validate(obj, interfaceName);
    }

    return results;
  }

  /**
     * Generate validation report
     * @param {Object} validationResult - Result from validate()
     * @returns {string} Formatted report
     */
  generateReport(validationResult) {
    const { isValid: _isValid, errors, warnings, missing, extra, summary, compliance } = validationResult;

    let report = '\n📋 Interface Validation Report\n';
    report += `${'='.repeat(40)}\n`;
    report += `Status: ${summary}\n`;

    if (compliance) {
      report += `Compliance: ${compliance.implemented}/${compliance.total} properties (${compliance.percentage}%)\n`;
    }

    if (errors.length > 0) {
      report += `\n❌ Errors (${errors.length}):\n`;
      errors.forEach(error => report += `  • ${error}\n`);
    }

    if (warnings.length > 0) {
      report += `\n⚠️  Warnings (${warnings.length}):\n`;
      warnings.forEach(warning => report += `  • ${warning}\n`);
    }

    if (missing.length > 0) {
      report += `\n📋 Missing Properties (${missing.length}):\n`;
      missing.forEach(prop => report += `  • ${prop}\n`);
    }

    if (extra.length > 0) {
      report += `\n➕ Extra Properties (${extra.length}):\n`;
      extra.forEach(prop => report += `  • ${prop}\n`);
    }

    return report;
  }

  /**
     * Clear validation cache
     */
  clearCache() {
    this.validationCache.clear();
  }
}

/**
 * Interface Factory
 * Creates interface-compliant objects with validation
 */
export class InterfaceFactory {
  constructor(validator = new InterfaceValidator()) {
    this.validator = validator;
    this.templates = new Map();
  }

  /**
     * Register a template for creating interface-compliant objects
     * @param {string} interfaceName - Interface name
     * @param {Function} template - Template function
     */
  registerTemplate(interfaceName, template) {
    this.templates.set(interfaceName, template);
    return this;
  }

  /**
     * Create interface-compliant object
     * @param {string} interfaceName - Interface name
     * @param {Object} config - Configuration for object creation
     * @returns {Object} Interface-compliant object
     */
  create(interfaceName, config = {}) {
    const template = this.templates.get(interfaceName);
    if (!template) {
      throw new Error(`No template registered for interface: ${interfaceName}`);
    }

    const obj = template(config);
    const validation = this.validator.validate(obj, interfaceName);

    if (!validation.isValid) {
      throw new Error(`Created object doesn't comply with ${interfaceName}:\n${this.validator.generateReport(validation)}`);
    }

    return obj;
  }

  /**
     * Create validated proxy for existing object
     * @param {Object} obj - Existing object
     * @param {string} interfaceName - Interface name
     * @returns {Proxy} Validated proxy object
     */
  createProxy(obj, interfaceName) {
    const validation = this.validator.validate(obj, interfaceName);
    if (!validation.isValid) {
      console.warn(`Object doesn't fully comply with ${interfaceName}:`, validation.summary);
    }

    return createInterfaceProxy(obj, STANDARDIZED_INTERFACES[interfaceName], interfaceName);
  }
}

/**
 * Default instances
 */
export const defaultValidator = new InterfaceValidator();
export const defaultFactory = new InterfaceFactory(defaultValidator);

/**
 * Convenience functions
 */

/**
 * Quick validation function
 * @param {Object} obj - Object to validate
 * @param {string} interfaceName - Interface name
 * @returns {boolean} True if valid
 */
export const isValid = (obj, interfaceName) => {
  return defaultValidator.validate(obj, interfaceName).isValid;
};

/**
 * Validate and throw if invalid
 * @param {Object} obj - Object to validate
 * @param {string} interfaceName - Interface name
 * @param {string} objectName - Name for error messages
 */
export const validateOrThrow = (obj, interfaceName, objectName = 'Object') => {
  const result = defaultValidator.validate(obj, interfaceName);
  if (!result.isValid) {
    throw new Error(`${objectName} doesn't implement ${interfaceName}:\n${defaultValidator.generateReport(result)}`);
  }
};

/**
 * Get compliance percentage
 * @param {Object} obj - Object to check
 * @param {string} interfaceName - Interface name
 * @returns {number} Compliance percentage
 */
export const getCompliance = (obj, interfaceName) => {
  const result = defaultValidator.validate(obj, interfaceName);
  return result.compliance?.percentage || 0;
};

/**
 * Generate full compliance report for object
 * @param {Object} obj - Object to analyze
 * @param {string} interfaceName - Interface name
 * @returns {string} Formatted compliance report
 */
export const generateComplianceReport = (obj, interfaceName) => {
  const result = defaultValidator.validate(obj, interfaceName);
  return defaultValidator.generateReport(result);
};

/**
 * Analyze all interfaces for an object
 * @param {Object} obj - Object to analyze
 * @returns {Array} Array of interface compliance results
 */
export const analyzeAllInterfaces = (obj) => {
  const results = [];

  for (const interfaceName of Object.keys(STANDARDIZED_INTERFACES)) {
    const result = defaultValidator.validate(obj, interfaceName);
    if (result.compliance.percentage > 50) { // Only include likely matches
      results.push({
        interface: interfaceName,
        compliance: result.compliance.percentage,
        isValid: result.isValid,
        summary: result.summary
      });
    }
  }

  return results.sort((a, b) => b.compliance - a.compliance);
};
