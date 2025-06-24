/**
 * Connect4HelperSystem - Main coordinator for modular helper system
 *
 * Provides backward compatibility with Connect4Helpers while using modular architecture
 */
/* global ThreatDetector, OpportunityAnalyzer, MoveValidator, HintManager */
class Connect4HelperSystem {
  constructor(game, ui = null) {
    this.game = game;
    this.ui = ui;

    // Initialize modules
    this.threatDetector = new ThreatDetector(game);
    this.opportunityAnalyzer = new OpportunityAnalyzer(game);
    this.moveValidator = new MoveValidator(game);
    this.hintManager = new HintManager(game, ui);

    // Backward compatibility properties
    this.enabled = false;
    this.helpLevel = 0;
    this.forcedMoveMode = false;
    this.requiredMoves = [];
    this.threatIndicators = [];
    this.opportunityIndicators = [];
    this.currentHints = {
      threats: [],
      opportunities: [],
      suggestions: []
    };

    // Event system
    this.eventListeners = {};

    this.setupIntegration();
  }

  /**
     * Setup integration between modules
     * @private
     */
  setupIntegration() {
    // Sync state with hint manager
    this.hintManager.on('hintsToggled', (data) => {
      this.enabled = data.enabled;
      this.helpLevel = data.helpLevel;
      this.emit('hintsToggled', data);
    });

    this.hintManager.on('hintsUpdated', (data) => {
      this.currentHints = data.hints;
      this.forcedMoveMode = data.forcedMode;
      this.requiredMoves = this.extractRequiredMoves(data.hints);
      this.emit('hintsUpdated', data);
    });
  }

  /**
     * Extract required moves from hints for forced move mode
     * @private
     */
  extractRequiredMoves(hints) {
    const moves = [];

    // Extract from critical opportunities (wins)
    hints.opportunities.forEach(opp => {
      if (opp.priority === 'critical' && opp.moves) {
        moves.push(...opp.moves);
      }
    });

    // Extract from critical threats (blocks)
    hints.threats.forEach(threat => {
      if (threat.priority === 'critical' && threat.moves) {
        moves.push(...threat.moves);
      }
    });

    return moves;
  }

  // ==== BACKWARD COMPATIBILITY API ====

  /**
     * Enable or disable the hints system
     * @param {boolean} enabled - Whether hints should be enabled
     * @param {number} helpLevel - Level of help (0-4)
     */
  setEnabled(enabled, helpLevel = 0) {
    this.hintManager.setEnabled(enabled, helpLevel);
  }

  /**
     * Update hints based on current game state
     */
  updateHints() {
    this.hintManager.updateHints();
  }

  /**
     * Clear all hints
     */
  clearAllHints() {
    this.hintManager.clearAllHints();
    this.currentHints = { threats: [], opportunities: [], suggestions: [] };
    this.forcedMoveMode = false;
    this.requiredMoves = [];
  }

  /**
     * Check if a move is allowed (for forced move mode)
     * @param {number} column - Column to check
     * @returns {boolean} Whether the move is allowed
     */
  isMoveAllowed(column) {
    return this.hintManager.isMoveAllowed(column);
  }

  /**
     * Get current hint message
     * @returns {string} Hint message for display
     */
  getHintMessage() {
    return this.hintManager.getHintMessage();
  }

  // ==== LEGACY METHODS (for backward compatibility) ====

  /**
     * Detect winning moves (legacy method)
     * @returns {Array} Array of winning moves
     */
  detectWinningMoves() {
    return this.threatDetector.detectWinningMoves();
  }

  /**
     * Detect blocking moves (legacy method)
     * @returns {Array} Array of blocking moves
     */
  detectBlockingMoves() {
    return this.threatDetector.detectBlockingMoves();
  }

  /**
     * Count threats for a player (legacy method)
     * @param {number} player - Player to count threats for
     * @returns {Array} Array of threat positions
     */
  countThreats(player = null) {
    return this.threatDetector.countThreats(player);
  }

  /**
     * Count threats after a move (legacy method)
     * @param {number} column - Column for the move
     * @param {number} player - Player making the move
     * @returns {number} Number of threats after the move
     */
  countThreatsAfterMove(column, player = null) {
    const currentPlayer = player || this.game.currentPlayer;
    const moveResult = this.game.simulateMove(column, currentPlayer);

    if (!moveResult) return 0;

    // Create temporary game state and count threats
    const _gameState = this.game.createGameStateFromBoard(moveResult.newBoard, currentPlayer);
    const threats = this.threatDetector.countThreats(currentPlayer);

    return threats.length;
  }

  /**
     * Validate move safety (legacy method)
     * @param {number} column - Column to validate
     * @param {number} player - Player making the move
     * @returns {Object} Validation result
     */
  validateMove(column, player = null) {
    return this.moveValidator.validateMove(column, player);
  }

  /**
     * Get dangerous moves (legacy method)
     * @param {number} player - Player to analyze for
     * @returns {Array} Array of dangerous moves
     */
  getDangerousMoves(player = null) {
    return this.moveValidator.getDangerousMoves(player);
  }

  /**
     * Get safe moves (legacy method)
     * @param {number} player - Player to analyze for
     * @returns {Array} Array of safe moves
     */
  getSafeMoves(player = null) {
    return this.moveValidator.getSafeMoves(player);
  }

  // ==== NEW MODULAR API ====

  /**
     * Get comprehensive analysis of current position
     * @returns {Object} Complete strategic analysis
     */
  getComprehensiveAnalysis() {
    const threats = this.threatDetector.detectImmediateThreats();
    const opportunities = this.opportunityAnalyzer.analyzeOpportunities();
    const safeMoves = this.moveValidator.getSafeMoves();
    const dangerousMoves = this.moveValidator.getDangerousMoves();

    return {
      threats,
      opportunities,
      safeMoves,
      dangerousMoves,
      timestamp: new Date().toISOString(),
      gameState: {
        currentPlayer: this.game.currentPlayer,
        moveCount: this.game.moveHistory ? this.game.moveHistory.length : 0,
        gamePhase: this.getGamePhase()
      }
    };
  }

  /**
     * Get current game phase for strategic context
     * @private
     */
  getGamePhase() {
    const moveCount = this.game.moveHistory ? this.game.moveHistory.length : 0;

    if (moveCount < 8) return 'opening';
    if (moveCount < 20) return 'midgame';
    return 'endgame';
  }

  /**
     * Get strategic recommendation for current position
     * @returns {Object} Strategic recommendation with reasoning
     */
  getStrategicRecommendation() {
    const analysis = this.getComprehensiveAnalysis();

    // Priority 1: Immediate wins
    if (analysis.threats.winningMoves.length > 0) {
      return {
        type: 'immediate_win',
        moves: analysis.threats.winningMoves,
        reason: 'Gewinne sofort!',
        priority: 'critical'
      };
    }

    // Priority 2: Block opponent wins
    if (analysis.threats.blockingMoves.length > 0) {
      return {
        type: 'block_threat',
        moves: analysis.threats.blockingMoves,
        reason: 'Blockiere Gegnersieg!',
        priority: 'critical'
      };
    }

    // Priority 3: Create forks
    if (analysis.opportunities.forks.length > 0) {
      return {
        type: 'create_fork',
        moves: analysis.opportunities.forks,
        reason: 'Erstelle Zwickmühle!',
        priority: 'high'
      };
    }

    // Priority 4: Setup moves
    if (analysis.opportunities.setups.length > 0) {
      return {
        type: 'setup_move',
        moves: analysis.opportunities.setups,
        reason: 'Bereite Angriff vor',
        priority: 'medium'
      };
    }

    // Priority 5: Safe moves
    if (analysis.safeMoves.length > 0) {
      return {
        type: 'safe_move',
        moves: analysis.safeMoves,
        reason: 'Sicherer Zug',
        priority: 'low'
      };
    }

    // Fallback: Any valid move
    const validMoves = this.game.getValidMoves();
    return {
      type: 'any_move',
      moves: validMoves.map(col => ({ column: col })),
      reason: 'Beliebiger Zug',
      priority: 'minimal'
    };
  }

  // ==== EVENT SYSTEM ====

  /**
     * Add event listener
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
     * Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in helper system event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {function} callback - Callback function to remove
     */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }
}

// ==== BACKWARD COMPATIBILITY ALIAS ====
// This ensures existing code continues to work
class Connect4Helpers extends Connect4HelperSystem {
  constructor(game, ui = null) {
    super(game, ui);
    console.log('ℹ️ Connect4Helpers is now using the modular helper system');
  }
}

// Export for modular usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Connect4HelperSystem, Connect4Helpers };
}

// Global access for backward compatibility
if (typeof window !== 'undefined') {
  window.Connect4HelperSystem = Connect4HelperSystem;
  window.Connect4Helpers = Connect4Helpers; // Backward compatibility
}
