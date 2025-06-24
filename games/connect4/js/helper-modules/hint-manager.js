/**
 * HintManager - Manages hint display and forced move logic
 *
 * Core responsibility: Coordinate hint display, forced moves, and UI integration
 */
class HintManager {
    constructor(game, ui = null) {
        this.game = game;
        this.ui = ui;
        this.enabled = false;
        this.helpLevel = 0; // 0=none, 1=critical, 2=warnings, 3=strategic, 4=full
        this.forcedMoveMode = false;

        // Current hint state
        this.currentHints = {
            threats: [],
            opportunities: [],
            suggestions: [],
            warnings: []
        };

        // Visual indicators
        this.threatIndicators = [];
        this.opportunityIndicators = [];
        this.requiredMoves = [];

        // Event system for communication
        this.eventListeners = {};

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for game state changes
     * @private
     */
    setupEventListeners() {
        // Auto-update when board state changes
        this.game.on('boardStateChanged', data => {
            if (this.enabled && !data.gameOver) {
                this.updateHints();
            }
        });

        // Clear hints when game resets
        this.game.on('gameReset', () => {
            this.clearAllHints();
            this.forcedMoveMode = false;
            this.requiredMoves = [];
        });
    }

    /**
     * Enable or disable the hints system
     * @param {boolean} enabled - Whether hints should be enabled
     * @param {number} helpLevel - Level of help (0-4)
     */
    setEnabled(enabled, helpLevel = 0) {
        this.enabled = enabled;
        this.helpLevel = helpLevel;

        if (!enabled) {
            this.clearAllHints();
            this.forcedMoveMode = false;
            this.requiredMoves = [];
        } else {
            this.updateHints();
        }

        this.emit('hintsToggled', { enabled, helpLevel });
    }

    /**
     * Update all hints based on current game state
     */
    updateHints() {
        if (!this.enabled) return;

        // Clear previous hints
        this.clearAllHints();

        // Analyze current position
        const analysis = this.analyzePosition();

        // Generate hints based on help level
        this.generateHints(analysis);

        // Update visual indicators
        this.updateVisualIndicators();

        // Emit update event
        this.emit('hintsUpdated', {
            hints: this.currentHints,
            analysis,
            forcedMode: this.forcedMoveMode
        });
    }

    /**
     * Analyze current position for all types of hints
     * @private
     */
    analyzePosition() {
        // This would integrate with ThreatDetector, OpportunityAnalyzer, and MoveValidator
        // For now, we'll implement basic analysis here

        const threats = this.detectThreats();
        const opportunities = this.detectOpportunities();
        const dangerousMoves = this.getDangerousMoves();
        const safeMoves = this.getSafeMoves();

        return {
            threats,
            opportunities,
            dangerousMoves,
            safeMoves,
            hasImmediateThreat: threats.length > 0,
            hasOpportunity: opportunities.length > 0
        };
    }

    /**
     * Generate hints based on analysis and help level
     * @private
     */
    generateHints(_analysis) {
        // Level 1: Critical only (wins/blocks)
        if (this.helpLevel >= 1) {
            this.generateCriticalHints(_analysis);
        }

        // Level 2: Add warnings about dangerous moves
        if (this.helpLevel >= 2) {
            this.generateWarningHints(_analysis);
        }

        // Level 3: Add strategic suggestions
        if (this.helpLevel >= 3) {
            this.generateStrategicHints(_analysis);
        }

        // Level 4: Full analysis with detailed explanations
        if (this.helpLevel >= 4) {
            this.generateDetailedHints(_analysis);
        }
    }

    /**
     * Generate critical hints (wins and blocks)
     * @private
     */
    generateCriticalHints(_analysis) {
        // Check for winning moves
        const winningMoves = this.detectWinningMoves();
        if (winningMoves.length > 0) {
            this.currentHints.opportunities.push({
                type: 'winning_opportunity',
                moves: winningMoves,
                message: 'Du kannst hier GEWINNEN!',
                priority: 'critical'
            });

            this.requiredMoves = winningMoves;
            this.forcedMoveMode = true;
        }

        // Check for blocking moves
        const blockingMoves = this.detectBlockingMoves();
        if (blockingMoves.length > 0 && winningMoves.length === 0) {
            this.currentHints.threats.push({
                type: 'forced_block',
                moves: blockingMoves,
                message: 'Du MUSST hier spielen um zu verhindern, dass der Gegner gewinnt!',
                priority: 'critical'
            });

            this.requiredMoves = blockingMoves;
            this.forcedMoveMode = true;
        }
    }

    /**
     * Generate warning hints about dangerous moves
     * @private
     */
    generateWarningHints(analysis) {
        if (analysis.dangerousMoves.length > 0) {
            this.currentHints.warnings.push({
                type: 'trap_avoidance',
                moves: analysis.dangerousMoves,
                message: `⚠️ Vermeide Spalten ${analysis.dangerousMoves.map(m => m.column + 1).join(', ')} - Gegnerfallen!`,
                priority: 'warning'
            });
        }
    }

    /**
     * Generate strategic hints
     * @private
     */
    generateStrategicHints(analysis) {
        if (analysis.opportunities.length > 0) {
            this.currentHints.suggestions.push({
                type: 'strategic_opportunity',
                moves: analysis.opportunities,
                message: 'Strategische Gelegenheit erkannt',
                priority: 'medium'
            });
        }

        // Center play suggestions
        const centerMoves = this.getCenterMoves();
        if (centerMoves.length > 0 && this.game.moveHistory.length < 6) {
            this.currentHints.suggestions.push({
                type: 'center_play',
                moves: centerMoves,
                message: 'Spiele zentral für bessere Kontrolle',
                priority: 'low'
            });
        }
    }

    /**
     * Generate detailed hints with explanations
     * @private
     */
    generateDetailedHints(_analysis) {
        // Add detailed positional analysis
        const positionAnalysis = this.analyzePosition();

        this.currentHints.suggestions.push({
            type: 'detailed_analysis',
            analysis: positionAnalysis,
            message: 'Detaillierte Positionsanalyse verfügbar',
            priority: 'info'
        });
    }

    /**
     * Update visual indicators on the board
     * @private
     */
    updateVisualIndicators() {
        if (!this.ui) return;

        // Clear existing indicators
        this.clearVisualIndicators();

        // Add threat indicators
        this.currentHints.threats.forEach(threat => {
            if (threat.moves) {
                threat.moves.forEach(move => {
                    this.addThreatIndicator(move.column, 'threat');
                });
            }
        });

        // Add opportunity indicators
        this.currentHints.opportunities.forEach(opportunity => {
            if (opportunity.moves) {
                opportunity.moves.forEach(move => {
                    this.addOpportunityIndicator(move.column, 'opportunity');
                });
            }
        });

        // Add warning indicators
        this.currentHints.warnings.forEach(warning => {
            if (warning.moves) {
                warning.moves.forEach(move => {
                    this.addThreatIndicator(move.column, 'warning');
                });
            }
        });
    }

    /**
     * Add threat indicator to column
     * @private
     */
    addThreatIndicator(column, type) {
        if (this.ui && this.ui.addHintIndicator) {
            const indicator = this.ui.addHintIndicator(column, type);
            this.threatIndicators.push(indicator);
        }
    }

    /**
     * Add opportunity indicator to column
     * @private
     */
    addOpportunityIndicator(column, type) {
        if (this.ui && this.ui.addHintIndicator) {
            const indicator = this.ui.addHintIndicator(column, type);
            this.opportunityIndicators.push(indicator);
        }
    }

    /**
     * Clear all visual indicators
     * @private
     */
    clearVisualIndicators() {
        if (this.ui && this.ui.clearHintIndicators) {
            this.ui.clearHintIndicators();
        }

        this.threatIndicators = [];
        this.opportunityIndicators = [];
    }

    /**
     * Clear all hints
     */
    clearAllHints() {
        this.currentHints = {
            threats: [],
            opportunities: [],
            suggestions: [],
            warnings: []
        };

        this.clearVisualIndicators();
    }

    /**
     * Check if a move is allowed (forced move logic)
     * @param {number} column - Column to check
     * @returns {boolean} Whether the move is allowed
     */
    isMoveAllowed(column) {
        if (!this.forcedMoveMode) return true;

        return this.requiredMoves.some(move => move.column === column);
    }

    /**
     * Get hint message for display
     * @returns {string} Current hint message
     */
    getHintMessage() {
        if (!this.enabled) return '';

        // Priority: Critical > Warning > Strategic > Info
        const critical = this.currentHints.threats
            .concat(this.currentHints.opportunities)
            .filter(hint => hint.priority === 'critical');

        if (critical.length > 0) {
            return critical[0].message;
        }

        const warnings = this.currentHints.warnings.filter(hint => hint.priority === 'warning');

        if (warnings.length > 0) {
            return warnings[0].message;
        }

        const suggestions = this.currentHints.suggestions.filter(
            hint => hint.priority === 'medium'
        );

        if (suggestions.length > 0) {
            return suggestions[0].message;
        }

        return '';
    }

    // Basic analysis methods (these would be replaced by module integrations)

    /**
     * Detect winning moves for current player
     * @private
     */
    detectWinningMoves() {
        const winningMoves = [];
        const validMoves = this.game.getValidMoves();

        for (const col of validMoves) {
            const moveResult = this.game.simulateMove(col, this.game.currentPlayer);
            if (moveResult && moveResult.isWin) {
                winningMoves.push({
                    column: col,
                    row: moveResult.row,
                    reason: 'Winning move available'
                });
            }
        }

        return winningMoves;
    }

    /**
     * Detect blocking moves against opponent
     * @private
     */
    detectBlockingMoves() {
        const blockingMoves = [];
        const opponent = this.game.currentPlayer === 1 ? 2 : 1;
        const validMoves = this.game.getValidMoves();

        for (const col of validMoves) {
            const moveResult = this.game.simulateMove(col, opponent);
            if (moveResult && moveResult.isWin) {
                blockingMoves.push({
                    column: col,
                    row: moveResult.row,
                    reason: 'Blocks opponent win'
                });
            }
        }

        return blockingMoves;
    }

    /**
     * Detect general threats
     * @private
     */
    detectThreats() {
        return this.detectBlockingMoves();
    }

    /**
     * Detect opportunities
     * @private
     */
    detectOpportunities() {
        return this.detectWinningMoves();
    }

    /**
     * Get dangerous moves
     * @private
     */
    getDangerousMoves() {
        // Simplified implementation
        return [];
    }

    /**
     * Get safe moves
     * @private
     */
    getSafeMoves() {
        return this.game.getValidMoves().map(col => ({ column: col }));
    }

    /**
     * Get center moves
     * @private
     */
    getCenterMoves() {
        const center = Math.floor(this.game.COLS / 2);
        const validMoves = this.game.getValidMoves();

        return validMoves.filter(col => Math.abs(col - center) <= 1).map(col => ({ column: col }));
    }

    // Event system methods

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
                    console.error(`Error in hint manager event handler for ${event}:`, error);
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

// Export for modular usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HintManager };
}

// Global access for backward compatibility
if (typeof window !== 'undefined') {
    window.HintManager = HintManager;
}
