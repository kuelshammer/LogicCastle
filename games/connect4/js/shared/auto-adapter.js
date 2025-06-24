/**
 * Automatic Interface Adapter System
 *
 * Automatically adapts existing modules to standardized interfaces,
 * generating adapter code and providing seamless migration paths.
 */

import { STANDARDIZED_INTERFACES, defaultValidator } from './standardized-interfaces.js';
import { _defaultComplianceAnalyzer } from './interface-compliance.js';

/**
 * Auto Adapter Generator
 * Generates adapter code to make existing modules interface-compliant
 */
export class AutoAdapterGenerator {
  constructor() {
    this.adapterTemplates = new Map();
    this.generatedAdapters = new Map();
    this.setupDefaultTemplates();
  }

  /**
     * Setup default adapter templates
     */
  setupDefaultTemplates() {
    // Game Engine adapter template
    this.adapterTemplates.set('IGameEngine', {
      makeMove: {
        fallbacks: ['makeMove', 'dropPiece', 'placePiece'],
        generator: (obj, method) => `
                makeMove(column, player = null) {
                    const currentPlayer = player || this.target.currentPlayer || 1;
                    return this.target.${method}(column);
                }`
      },
      getBoard: {
        fallbacks: ['getBoard', 'board', 'grid'],
        generator: (obj, method) => `
                getBoard() {
                    ${method.startsWith('get') ? `return this.target.${method}();` : `return this.target.${method};`}
                }`
      },
      getCurrentPlayer: {
        fallbacks: ['getCurrentPlayer', 'currentPlayer'],
        generator: (obj, method) => `
                getCurrentPlayer() {
                    ${method.startsWith('get') ? `return this.target.${method}();` : `return this.target.${method};`}
                }`
      },
      isGameOver: {
        fallbacks: ['isGameOver', 'gameOver'],
        generator: (obj, method) => `
                isGameOver() {
                    ${method.startsWith('is') ? `return this.target.${method}();` : `return this.target.${method};`}
                }`
      },
      getWinner: {
        fallbacks: ['getWinner', 'winner'],
        generator: (obj, method) => `
                getWinner() {
                    ${method.startsWith('get') ? `return this.target.${method}();` : `return this.target.${method};`}
                }`
      },
      getValidMoves: {
        fallbacks: ['getValidMoves', 'getAvailableColumns', 'validMoves'],
        generator: (obj, method) => `
                getValidMoves() {
                    if (this.target.${method}) {
                        return this.target.${method}();
                    }
                    // Generate valid moves from board state
                    const board = this.getBoard();
                    const validMoves = [];
                    for (let col = 0; col < ${obj.COLS || 7}; col++) {
                        if (board[0][col] === 0) validMoves.push(col);
                    }
                    return validMoves;
                }`
      },
      simulateMove: {
        fallbacks: ['simulateMove', 'tryMove', 'previewMove'],
        generator: (obj, method) => `
                simulateMove(column, player = null) {
                    if (this.target.${method}) {
                        return this.target.${method}(column, player);
                    }
                    // Basic simulation implementation
                    const board = this.getBoard();
                    const currentPlayer = player || this.getCurrentPlayer();
                    for (let row = board.length - 1; row >= 0; row--) {
                        if (board[row][column] === 0) {
                            return { row, col: column, player: currentPlayer };
                        }
                    }
                    return null;
                }`
      },
      on: {
        fallbacks: ['on', 'addEventListener', 'addListener'],
        generator: (obj, method) => `
                on(event, callback) {
                    if (this.target.${method}) {
                        return this.target.${method}(event, callback);
                    }
                    // Fallback event system
                    if (!this._eventListeners) this._eventListeners = new Map();
                    if (!this._eventListeners.has(event)) {
                        this._eventListeners.set(event, []);
                    }
                    this._eventListeners.get(event).push(callback);
                }`
      },
      emit: {
        fallbacks: ['emit', 'dispatchEvent', 'trigger'],
        generator: (obj, method) => `
                emit(event, data) {
                    if (this.target.${method}) {
                        return this.target.${method}(event, data);
                    }
                    // Fallback event emission
                    if (this._eventListeners && this._eventListeners.has(event)) {
                        this._eventListeners.get(event).forEach(callback => callback(data));
                    }
                }`
      },
      off: {
        fallbacks: ['off', 'removeEventListener', 'removeListener'],
        generator: (obj, method) => `
                off(event, callback) {
                    if (this.target.${method}) {
                        return this.target.${method}(event, callback);
                    }
                    // Fallback event removal
                    if (this._eventListeners && this._eventListeners.has(event)) {
                        const listeners = this._eventListeners.get(event);
                        const index = listeners.indexOf(callback);
                        if (index > -1) listeners.splice(index, 1);
                    }
                }`
      }
    });

    // Bot Strategy adapter template
    this.adapterTemplates.set('IBotStrategy', {
      getBestMove: {
        fallbacks: ['getBestMove', 'getMove', 'calculateMove'],
        generator: (obj, method) => `
                getBestMove(gameState, player = null) {
                    return this.target.${method}(gameState, player);
                }`
      },
      getDifficulty: {
        fallbacks: ['getDifficulty', 'difficulty'],
        generator: (obj, method) => `
                getDifficulty() {
                    ${method.startsWith('get') ? `return this.target.${method}();` : `return this.target.${method} || 'medium';`}
                }`
      },
      getName: {
        fallbacks: ['getName', 'name'],
        generator: (obj, method) => `
                getName() {
                    ${method.startsWith('get') ? `return this.target.${method}();` : `return this.target.${method} || this.target.constructor.name;`}
                }`
      }
    });

    // Helper System adapter template
    this.adapterTemplates.set('IHelperSystem', {
      detectWinningMoves: {
        fallbacks: ['detectWinningMoves', 'findWinningMoves', 'getWinningMoves'],
        generator: (obj, method) => `
                detectWinningMoves(player = null) {
                    if (this.target.${method}) {
                        return this.target.${method}(player);
                    }
                    return [];
                }`
      },
      detectBlockingMoves: {
        fallbacks: ['detectBlockingMoves', 'findBlockingMoves', 'getBlockingMoves'],
        generator: (obj, method) => `
                detectBlockingMoves(player = null) {
                    if (this.target.${method}) {
                        return this.target.${method}(player);
                    }
                    return [];
                }`
      },
      getHint: {
        fallbacks: ['getHint', 'getAdvice', 'suggest'],
        generator: (obj, method) => `
                getHint(level = 1) {
                    if (this.target.${method}) {
                        return this.target.${method}(level);
                    }
                    return null;
                }`
      }
    });
  }

  /**
     * Generate adapter for module to match interface
     * @param {Object} module - Module to adapt
     * @param {string} interfaceName - Target interface name
     * @param {Object} options - Generation options
     * @returns {Object} Generated adapter
     */
  generateAdapter(module, interfaceName, options = {}) {
    const interfaceDefinition = STANDARDIZED_INTERFACES[interfaceName];
    if (!interfaceDefinition) {
      throw new Error(`Unknown interface: ${interfaceName}`);
    }

    const template = this.adapterTemplates.get(interfaceName);
    if (!template) {
      throw new Error(`No adapter template for interface: ${interfaceName}`);
    }

    // Analyze what methods are missing or need adaptation
    const analysis = this.analyzeModule(module, interfaceDefinition);

    // Generate adapter class
    const adapterClass = this.generateAdapterClass(module, interfaceName, template, analysis, options);

    // Create and cache adapter instance
    const adapter = new adapterClass(module);
    this.generatedAdapters.set(`${module.constructor.name}_${interfaceName}`, adapter);

    return adapter;
  }

  /**
     * Analyze module for adapter generation
     * @param {Object} module - Module to analyze
     * @param {Object} interfaceDefinition - Interface definition
     * @returns {Object} Analysis result
     */
  analyzeModule(module, interfaceDefinition) {
    const analysis = {
      existing: [],
      missing: [],
      needsAdapter: [],
      directMap: new Map(),
      fallbackMap: new Map()
    };

    for (const [methodName, expectedType] of Object.entries(interfaceDefinition)) {
      if (methodName in module && typeof module[methodName] === expectedType) {
        // Method exists with correct type
        analysis.existing.push(methodName);
        analysis.directMap.set(methodName, methodName);
      } else {
        // Method missing or wrong type - needs adaptation
        analysis.missing.push(methodName);

        // Look for fallback methods
        const fallback = this.findFallbackMethod(module, methodName);
        if (fallback) {
          analysis.needsAdapter.push(methodName);
          analysis.fallbackMap.set(methodName, fallback);
        } else {
          analysis.missing.push(methodName);
        }
      }
    }

    return analysis;
  }

  /**
     * Find fallback method in module
     * @param {Object} module - Module to search
     * @param {string} methodName - Target method name
     * @returns {string|null} Fallback method name
     */
  findFallbackMethod(module, methodName) {
    // Check if method exists directly
    if (methodName in module) {
      return methodName;
    }

    // Common method name variations
    const variations = [
      methodName.replace(/^get/, ''),
      methodName.replace(/^is/, ''),
      methodName.toLowerCase(),
      methodName.replace(/([A-Z])/g, '_$1').toLowerCase(),
      methodName.replace(/([A-Z])/g, '-$1').toLowerCase()
    ];

    for (const variation of variations) {
      if (variation in module && typeof module[variation] === 'function') {
        return variation;
      }
    }

    // Check for property access
    for (const variation of variations) {
      if (variation in module) {
        return variation;
      }
    }

    return null;
  }

  /**
     * Generate adapter class
     * @param {Object} module - Source module
     * @param {string} interfaceName - Target interface
     * @param {Object} template - Adapter template
     * @param {Object} analysis - Module analysis
     * @param {Object} options - Generation options
     * @returns {Function} Adapter class constructor
     */
  generateAdapterClass(module, interfaceName, template, analysis, options) {
    const className = `${module.constructor.name}${interfaceName}Adapter`;

    // Generate adapter methods
    const adapterMethods = {};
    const interfaceDefinition = STANDARDIZED_INTERFACES[interfaceName];

    for (const [methodName, expectedType] of Object.entries(interfaceDefinition)) {
      if (analysis.existing.includes(methodName)) {
        // Direct pass-through
        adapterMethods[methodName] = function(...args) {
          return this.target[methodName](...args);
        };
      } else if (analysis.fallbackMap.has(methodName)) {
        // Use fallback method
        const fallbackMethod = analysis.fallbackMap.get(methodName);
        if (template[methodName]) {
          // Use template if available
          const methodCode = template[methodName].generator(module, fallbackMethod);
          adapterMethods[methodName] = new Function(`return ${  methodCode}`)();
        } else {
          // Simple fallback
          adapterMethods[methodName] = function(...args) {
            if (typeof this.target[fallbackMethod] === 'function') {
              return this.target[fallbackMethod](...args);
            }
            return this.target[fallbackMethod];

          };
        }
      } else {
        // Generate stub method
        adapterMethods[methodName] = this.generateStubMethod(methodName, expectedType, options);
      }
    }

    // Create adapter class
    const AdapterClass = function(target) {
      this.target = target;
      this._interfaceName = interfaceName;
      this._className = className;
      this._generatedAt = new Date().toISOString();

      // Copy adapter methods
      for (const [name, method] of Object.entries(adapterMethods)) {
        this[name] = method.bind(this);
      }
    };

    // Add metadata
    AdapterClass.prototype._getAdapterInfo = function() {
      return {
        interfaceName: this._interfaceName,
        className: this._className,
        generatedAt: this._generatedAt,
        targetType: this.target.constructor.name,
        methods: Object.keys(adapterMethods)
      };
    };

    AdapterClass.prototype._validateCompliance = function() {
      return defaultValidator.validate(this, this._interfaceName);
    };

    return AdapterClass;
  }

  /**
     * Generate stub method for missing functionality
     * @param {string} methodName - Method name
     * @param {string} expectedType - Expected return type
     * @param {Object} options - Generation options
     * @returns {Function} Stub method
     */
  generateStubMethod(methodName, expectedType, options) {
    const stubMode = options.stubMode || 'warning'; // 'warning', 'error', 'silent'

    return function(..._args) {
      const message = `Method '${methodName}' not implemented in adapter for ${this.target.constructor.name}`;

      switch (stubMode) {
      case 'error':
        throw new Error(message);
      case 'warning':
        console.warn(message);
        break;
      case 'silent':
        break;
      }

      // Return appropriate default value
      switch (expectedType) {
      case 'function':
        return () => null;
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'string':
        return '';
      case 'object':
        return null;
      default:
        return undefined;
      }
    };
  }

  /**
     * Auto-adapt module to best matching interface
     * @param {Object} module - Module to adapt
     * @param {Object} options - Adaptation options
     * @returns {Object} Adapter with best interface match
     */
  autoAdapt(module, options = {}) {
    // Find best matching interface
    const bestMatch = this.findBestInterface(module);

    if (!bestMatch) {
      throw new Error(`No suitable interface found for ${module.constructor.name}`);
    }

    console.log(`🔄 Auto-adapting ${module.constructor.name} to ${bestMatch.interface} (${bestMatch.compliance}% match)`);

    return this.generateAdapter(module, bestMatch.interface, options);
  }

  /**
     * Find best matching interface for module
     * @param {Object} module - Module to analyze
     * @returns {Object|null} Best interface match
     */
  findBestInterface(module) {
    let bestMatch = null;
    let bestCompliance = 0;

    for (const [interfaceName, interfaceDefinition] of Object.entries(STANDARDIZED_INTERFACES)) {
      const compliance = this.calculateCompliance(module, interfaceDefinition);

      if (compliance > bestCompliance && compliance > 30) { // Minimum 30% match
        bestCompliance = compliance;
        bestMatch = {
          interface: interfaceName,
          compliance,
          definition: interfaceDefinition
        };
      }
    }

    return bestMatch;
  }

  /**
     * Calculate compliance percentage
     * @param {Object} module - Module to check
     * @param {Object} interfaceDefinition - Interface definition
     * @returns {number} Compliance percentage
     */
  calculateCompliance(module, interfaceDefinition) {
    const totalMethods = Object.keys(interfaceDefinition).length;
    let matchingMethods = 0;

    for (const [methodName, expectedType] of Object.entries(interfaceDefinition)) {
      if (methodName in module && typeof module[methodName] === expectedType) {
        matchingMethods++;
      } else if (this.findFallbackMethod(module, methodName)) {
        matchingMethods += 0.7; // Partial credit for fallbacks
      }
    }

    return Math.round((matchingMethods / totalMethods) * 100);
  }

  /**
     * Generate adapter code as string (for manual implementation)
     * @param {Object} module - Module to adapt
     * @param {string} interfaceName - Target interface
     * @returns {string} Generated adapter code
     */
  generateAdapterCode(module, interfaceName) {
    const interfaceDefinition = STANDARDIZED_INTERFACES[interfaceName];
    const template = this.adapterTemplates.get(interfaceName);
    const analysis = this.analyzeModule(module, interfaceDefinition);

    let code = `/**\n * Auto-generated adapter for ${module.constructor.name}\n`;
    code += ` * Target Interface: ${interfaceName}\n`;
    code += ` * Generated: ${new Date().toISOString()}\n */\n\n`;

    code += `class ${module.constructor.name}${interfaceName}Adapter {\n`;
    code += '    constructor(target) {\n';
    code += '        this.target = target;\n';
    code += '    }\n\n';

    // Generate methods
    for (const [methodName, expectedType] of Object.entries(interfaceDefinition)) {
      if (analysis.existing.includes(methodName)) {
        code += `    ${methodName}(...args) {\n`;
        code += `        return this.target.${methodName}(...args);\n`;
        code += '    }\n\n';
      } else if (analysis.fallbackMap.has(methodName) && template[methodName]) {
        const methodCode = template[methodName].generator(module, analysis.fallbackMap.get(methodName));
        code += `    ${methodCode}\n\n`;
      } else {
        code += `    ${methodName}(...args) {\n`;
        code += `        // TODO: Implement ${methodName} method\n`;
        code += `        console.warn('Method ${methodName} not implemented');\n`;
        code += `        return ${this.getDefaultReturn(expectedType)};\n`;
        code += '    }\n\n';
      }
    }

    code += '}\n\n';
    code += `export default ${module.constructor.name}${interfaceName}Adapter;\n`;

    return code;
  }

  /**
     * Get default return value for type
     * @param {string} type - Expected type
     * @returns {string} Default return value
     */
  getDefaultReturn(type) {
    switch (type) {
    case 'boolean': return 'false';
    case 'number': return '0';
    case 'string': return "''";
    case 'object': return 'null';
    case 'function': return '() => null';
    default: return 'undefined';
    }
  }

  /**
     * Get generated adapter
     * @param {string} key - Adapter key
     * @returns {Object|null} Generated adapter
     */
  getAdapter(key) {
    return this.generatedAdapters.get(key);
  }

  /**
     * List all generated adapters
     * @returns {Array} List of adapter info
     */
  listAdapters() {
    const adapters = [];
    for (const [key, adapter] of this.generatedAdapters) {
      adapters.push({
        key,
        info: adapter._getAdapterInfo(),
        compliance: adapter._validateCompliance()
      });
    }
    return adapters;
  }

  /**
     * Clear all generated adapters
     */
  clearAdapters() {
    this.generatedAdapters.clear();
  }
}

/**
 * Batch Adapter Manager
 * Manages bulk adaptation of multiple modules
 */
export class BatchAdapterManager {
  constructor(generator = new AutoAdapterGenerator()) {
    this.generator = generator;
    this.adaptationQueue = [];
    this.results = [];
  }

  /**
     * Add module to adaptation queue
     * @param {Object} module - Module to adapt
     * @param {string} interfaceName - Target interface (optional, auto-detect if not provided)
     * @param {Object} options - Adaptation options
     */
  queueModule(module, interfaceName = null, options = {}) {
    this.adaptationQueue.push({
      module,
      interfaceName,
      options,
      moduleName: module.constructor.name,
      queuedAt: new Date().toISOString()
    });
    return this;
  }

  /**
     * Process adaptation queue
     * @returns {Array} Adaptation results
     */
  async processQueue() {
    this.results = [];

    for (const item of this.adaptationQueue) {
      try {
        const adapter = item.interfaceName
          ? this.generator.generateAdapter(item.module, item.interfaceName, item.options)
          : this.generator.autoAdapt(item.module, item.options);

        const result = {
          moduleName: item.moduleName,
          interfaceName: adapter._interfaceName,
          success: true,
          adapter,
          compliance: adapter._validateCompliance(),
          processedAt: new Date().toISOString()
        };

        this.results.push(result);
        console.log(`✅ Adapted ${item.moduleName} to ${adapter._interfaceName}`);

      } catch (error) {
        const result = {
          moduleName: item.moduleName,
          interfaceName: item.interfaceName,
          success: false,
          error: error.message,
          processedAt: new Date().toISOString()
        };

        this.results.push(result);
        console.error(`❌ Failed to adapt ${item.moduleName}:`, error.message);
      }
    }

    return this.results;
  }

  /**
     * Generate batch adaptation report
     * @returns {string} Formatted report
     */
  generateReport() {
    if (this.results.length === 0) {
      return 'No adaptations processed yet.';
    }

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    let report = '\n🔧 BATCH ADAPTATION REPORT\n';
    report += `${'═'.repeat(50)  }\n`;
    report += `Total Modules: ${this.results.length}\n`;
    report += `Successful: ${successful.length}\n`;
    report += `Failed: ${failed.length}\n`;
    report += `Success Rate: ${Math.round(successful.length / this.results.length * 100)}%\n\n`;

    if (successful.length > 0) {
      report += '✅ SUCCESSFUL ADAPTATIONS:\n';
      successful.forEach(result => {
        const compliance = result.compliance.compliance.percentage;
        report += `   • ${result.moduleName} → ${result.interfaceName} (${compliance}% compliant)\n`;
      });
      report += '\n';
    }

    if (failed.length > 0) {
      report += '❌ FAILED ADAPTATIONS:\n';
      failed.forEach(result => {
        report += `   • ${result.moduleName}: ${result.error}\n`;
      });
    }

    return report;
  }

  /**
     * Clear queue and results
     */
  clear() {
    this.adaptationQueue = [];
    this.results = [];
  }
}

/**
 * Default instances
 */
export const defaultAdapterGenerator = new AutoAdapterGenerator();
export const defaultBatchManager = new BatchAdapterManager(defaultAdapterGenerator);

/**
 * Convenience functions
 */

/**
 * Quick adapter generation
 * @param {Object} module - Module to adapt
 * @param {string} interfaceName - Target interface
 * @returns {Object} Generated adapter
 */
export const adaptModule = (module, interfaceName) => {
  return defaultAdapterGenerator.generateAdapter(module, interfaceName);
};

/**
 * Auto-adapt module to best interface
 * @param {Object} module - Module to adapt
 * @returns {Object} Generated adapter
 */
export const autoAdapt = (module) => {
  return defaultAdapterGenerator.autoAdapt(module);
};

/**
 * Generate adapter code
 * @param {Object} module - Module to adapt
 * @param {string} interfaceName - Target interface
 * @returns {string} Generated code
 */
export const generateCode = (module, interfaceName) => {
  return defaultAdapterGenerator.generateAdapterCode(module, interfaceName);
};

/**
 * Batch adapt multiple modules
 * @param {Array} modules - Array of {module, interface} objects
 * @returns {Promise<Array>} Adaptation results
 */
export const batchAdapt = async (modules) => {
  const manager = new BatchAdapterManager();
  modules.forEach(({module, interface: interfaceName, options}) => {
    manager.queueModule(module, interfaceName, options);
  });
  return await manager.processQueue();
};
