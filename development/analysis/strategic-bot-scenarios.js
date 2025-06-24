/**
 * Strategic Bot Test Scenarios
 *
 * Predefined game positions designed to test specific strategic concepts
 * and differentiate between different bot strategies.
 */

class StrategicBotScenarios {

  /**
     * Scenarios designed to test specific strategic capabilities
     */
  static scenarios = {

    /**
         * Opening Scenarios - Test early game strategy
         */
    emptyBoard: {
      pattern: 'empty,empty,empty,empty,empty,empty,empty',
      currentPlayer: 1,
      description: 'Empty board - should prefer center',
      expectedBehavior: {
        'all': 'Should prefer column 4 (center)'
      }
    },

    secondMove: {
      pattern: 'empty,empty,empty,red,empty,empty,empty',
      currentPlayer: 2,
      description: 'Second move - Yellow responds to Red center',
      expectedBehavior: {
        'smart-random': 'Random center preference',
        'defensive': 'Adjacent to Red or center',
        'enhanced-smart': 'Strategic center-adjacent'
      }
    },

    /**
         * Tactical Scenarios - Win/Block detection
         */
    immediateWin: {
      pattern: 'empty,yellow,yellow,yellow,empty,empty,empty',
      currentPlayer: 2,
      description: 'Yellow can win immediately at column 1 or 5',
      expectedBehavior: {
        'all': 'Must take winning move'
      }
    },

    mustBlock: {
      pattern: 'red,red,red,empty,empty,empty,empty',
      currentPlayer: 2,
      description: "Yellow must block Red's winning threat",
      expectedBehavior: {
        'all': 'Must block at column 4'
      }
    },

    multipleThreats: {
      pattern: 'red,red,red,empty,yellow,yellow,yellow',
      currentPlayer: 1,
      description: 'Both players have threats - Red moves first',
      expectedBehavior: {
        'all': 'Must take win rather than block'
      }
    },

    /**
         * Strategic Depth Scenarios - Differentiate bot strategies
         */
    forkOpportunity: {
      pattern: 'empty,red,yellow,red-yellow,empty,yellow,red',
      currentPlayer: 1,
      description: 'Red can create fork (multiple win threats)',
      expectedBehavior: {
        'offensiv-gemischt': 'Should create fork aggressively',
        'defensiv-gemischt': 'More cautious approach',
        'enhanced-smart': 'Should recognize fork pattern'
      }
    },

    trapAvoidance: {
      pattern: 'red,yellow,empty,red-yellow,empty,yellow,red',
      currentPlayer: 2,
      description: 'Yellow must avoid trap moves',
      expectedBehavior: {
        'smart-random': 'May fall into trap',
        'defensive': 'Should avoid dangerous moves',
        'enhanced-smart': 'Advanced trap detection'
      }
    },

    centerControl: {
      pattern: 'empty,red,yellow,empty,yellow,red,empty',
      currentPlayer: 1,
      description: 'Early game center control battle',
      expectedBehavior: {
        'offensiv-gemischt': 'Aggressive center play',
        'defensiv-gemischt': 'Defensive positioning'
      }
    },

    /**
         * Advanced Strategic Scenarios
         */
    evenOddThreats: {
      pattern: 'red,empty,yellow,red-yellow,yellow,empty,red',
      currentPlayer: 1,
      description: 'Even/Odd threat patterns (Connect 4 theory)',
      expectedBehavior: {
        'enhanced-smart': 'Should use even/odd analysis',
        'defensive': 'Focus on blocking patterns'
      }
    },

    zugzwang: {
      pattern: 'red-yellow,yellow-red,red,yellow-red-yellow,red,red-yellow,yellow-red',
      currentPlayer: 2,
      description: 'Zugzwang - forced into bad moves',
      expectedBehavior: {
        'enhanced-smart': 'Should recognize forcing sequences',
        'defensive': 'Minimize damage'
      }
    },

    complexMidgame: {
      pattern: 'red-yellow,empty,red,yellow-red,yellow,red-yellow,empty',
      currentPlayer: 1,
      description: 'Complex midgame position',
      expectedBehavior: {
        'offensiv-gemischt': 'Look for attacking chances',
        'defensiv-gemischt': 'Prioritize safety',
        'enhanced-smart': 'Balance offense/defense'
      }
    },

    /**
         * Pressure Scenarios - Test under time/complexity pressure
         */
    almostFull: {
      pattern: 'red-yellow-red-yellow,yellow-red-yellow-red,red-yellow-red,yellow-red-yellow-red,red-yellow-red-yellow,yellow-red-yellow,red-yellow-red-yellow',
      currentPlayer: 1,
      description: 'Nearly full board - limited options',
      expectedBehavior: {
        'all': 'Should handle complex positions quickly'
      }
    },

    crowdedCenter: {
      pattern: 'red,yellow,red-yellow,red-yellow-red,yellow-red-yellow,red-yellow,yellow',
      currentPlayer: 2,
      description: 'Crowded center area - tactical precision needed',
      expectedBehavior: {
        'enhanced-smart': 'Precise tactical calculation',
        'defensive': 'Avoid creating opponent threats'
      }
    },

    /**
         * Edge Case Scenarios
         */
    edgePlay: {
      pattern: 'red-yellow,empty,empty,empty,empty,empty,yellow-red',
      currentPlayer: 1,
      description: 'Edge vs center play dynamics',
      expectedBehavior: {
        'smart-random': 'May prefer center',
        'offensiv-gemischt': 'Look for attacking patterns'
      }
    },

    columnFull: {
      pattern: 'red-yellow-red-yellow-red-yellow,empty,red,yellow,red,empty,yellow',
      currentPlayer: 2,
      description: 'Some columns full - limited choices',
      expectedBehavior: {
        'all': 'Should adapt to limited options'
      }
    }
  };

  /**
     * Get a scenario by name
     */
  static getScenario(name) {
    if (!(name in this.scenarios)) {
      throw new Error(`Unknown scenario: "${name}". Available: ${Object.keys(this.scenarios).join(', ')}`);
    }
    return this.scenarios[name];
  }

  /**
     * Get all scenario names
     */
  static getScenarioNames() {
    return Object.keys(this.scenarios);
  }

  /**
     * Get scenarios by category
     */
  static getScenariosByCategory() {
    return {
      opening: ['emptyBoard', 'secondMove'],
      tactical: ['immediateWin', 'mustBlock', 'multipleThreats'],
      strategic: ['forkOpportunity', 'trapAvoidance', 'centerControl'],
      advanced: ['evenOddThreats', 'zugzwang', 'complexMidgame'],
      pressure: ['almostFull', 'crowdedCenter'],
      edge: ['edgePlay', 'columnFull']
    };
  }

  /**
     * Load a scenario into a game instance
     */
  static loadScenario(game, scenarioName, testUtils = null) {
    const scenario = this.getScenario(scenarioName);

    if (testUtils && testUtils.createTestPosition) {
      // Use provided test utils
      return testUtils.createTestPosition(game, scenario.pattern, scenario.currentPlayer);
    } else if (typeof Connect4TestUtils !== 'undefined') {
      // Use global Connect4TestUtils
      return Connect4TestUtils.createTestPosition(game, scenario.pattern, scenario.currentPlayer);
    }
    throw new Error('Test utilities not available. Pass testUtils parameter or ensure Connect4TestUtils is loaded.');

  }

  /**
     * Get expected behavior for a bot in a scenario
     */
  static getExpectedBehavior(scenarioName, botType) {
    const scenario = this.getScenario(scenarioName);

    // Check bot-specific expectation
    if (scenario.expectedBehavior[botType]) {
      return scenario.expectedBehavior[botType];
    }

    // Check 'all' bots expectation
    if (scenario.expectedBehavior.all) {
      return scenario.expectedBehavior.all;
    }

    return 'No specific expectation defined';
  }

  /**
     * Validate that a scenario is properly formed
     */
  static validateScenario(scenarioName) {
    try {
      const scenario = this.getScenario(scenarioName);

      // Check required fields
      if (!scenario.pattern || !scenario.description) {
        return { valid: false, error: 'Missing required fields' };
      }

      // Validate pattern format
      const columns = scenario.pattern.split(',');
      if (columns.length !== 7) {
        return { valid: false, error: 'Pattern must have exactly 7 columns' };
      }

      // Validate current player
      if (![1, 2].includes(scenario.currentPlayer)) {
        return { valid: false, error: 'Current player must be 1 or 2' };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
     * Get scenario statistics
     */
  static getStats() {
    const categories = this.getScenariosByCategory();
    const totalScenarios = Object.keys(this.scenarios).length;

    return {
      total: totalScenarios,
      byCategory: Object.entries(categories).map(([cat, scenarios]) => ({
        category: cat,
        count: scenarios.length
      })),
      botTypes: this.getReferencedBotTypes(),
      complexityLevels: this.getComplexityDistribution()
    };
  }

  /**
     * Get all bot types referenced in scenarios
     */
  static getReferencedBotTypes() {
    const botTypes = new Set();

    Object.values(this.scenarios).forEach(scenario => {
      Object.keys(scenario.expectedBehavior).forEach(bot => {
        if (bot !== 'all') {
          botTypes.add(bot);
        }
      });
    });

    return Array.from(botTypes).sort();
  }

  /**
     * Analyze complexity distribution
     */
  static getComplexityDistribution() {
    const distribution = { simple: 0, medium: 0, complex: 0 };

    Object.values(this.scenarios).forEach(scenario => {
      const pieceCount = (scenario.pattern.match(/-/g) || []).length;

      if (pieceCount <= 5) distribution.simple++;
      else if (pieceCount <= 15) distribution.medium++;
      else distribution.complex++;
    });

    return distribution;
  }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StrategicBotScenarios;
}
