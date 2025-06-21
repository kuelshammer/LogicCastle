/**
 * Connect4Helpers - Helper system for Connect 4 game
 */
class Connect4Helpers {
    constructor(game, ui = null) {
        this.game = game;
        this.ui = ui; // Reference to UI for player help checking
        this.enabled = false;
        this.threatIndicators = [];
        this.opportunityIndicators = [];
        this.helpLevel = 0; // 0=none, 1=critical, 2=warnings, 3=strategic, 4=full
        this.forcedMoveMode = false;
        this.requiredMoves = [];
        this.currentHints = {
            threats: [],
            opportunities: [],
            suggestions: []
        };

        // Auto-update when board state changes
        this.game.on('boardStateChanged', (data) => {
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

        // Event system for UI communication
        this.eventListeners = {};
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
    }

    /**
     * Update all hints for the current game state
     */
    updateHints() {
        if (!this.enabled || this.game.gameOver) {
            return;
        }

        // Check if current player has help enabled - but allow Bot analysis in AI mode
        if (this.ui && !this.ui.getCurrentPlayerHelpEnabled()) {
            // In bot mode, always allow helpers analysis for the bot player
            if (this.ui.isAIMode() && this.game.currentPlayer === this.game.PLAYER2) {
                // Bot player - continue with analysis even if human has no help
            } else {
                this.clearAllHints();
                return; // No help for human player
            }
        }

        this.clearAllHints();

        // Check for winning opportunities first (Level 0+)
        if (this.helpLevel >= 0) {
            this.checkWinningOpportunities();
        }

        // Check for critical defensive situations (Level 1+)
        if (this.helpLevel >= 1) {
            this.checkForcedMoves();
        }

        // Check for trap avoidance (Level 2+) - only if no higher priority moves found
        if (this.helpLevel >= 2 && !this.forcedMoveMode) {
            this.checkTrapAvoidance();
        }

        // Only analyze other hints if not in forced move mode
        if (!this.forcedMoveMode) {
            this.analyzeThreats();
            this.analyzeOpportunities();
            this.generateStrategicSuggestions();

            // Display hints only for non-forced situations
            this.displayHints();
        }
        // Note: For Level 1, we only use column blocking, no visual overlays
    }

    /**
     * Check for winning opportunities (Level 0 help: find own winning moves)
     */
    checkWinningOpportunities() {
        this.forcedMoveMode = false;
        this.requiredMoves = [];

        // Check if current player has help enabled
        if (this.ui && !this.ui.getCurrentPlayerHelpEnabled()) {
            return; // No help for this player
        }

        const validMoves = this.game.getValidMoves();
        const winningMoves = [];

        // Check each valid move to see if current player can win there
        for (const col of validMoves) {
            const result = this.game.simulateMove(col);
            if (result.success && result.wouldWin) {
                winningMoves.push({
                    column: col,
                    row: result.row,
                    reason: 'Winning move available'
                });
            }
        }

        // If there are winning moves, enter forced move mode for offensive play
        if (winningMoves.length > 0) {
            this.forcedMoveMode = true;
            this.requiredMoves = winningMoves.map(move => move.column);

            // Add these as winning opportunities
            this.currentHints.opportunities = winningMoves.map(move => ({
                column: move.column,
                row: move.row,
                type: 'winning_opportunity',
                message: 'Du kannst hier GEWINNEN!',
                priority: 'critical'
            }));

            // Emit winning opportunity event for UI
            this.emit('winningOpportunityActivated', {
                requiredMoves: this.requiredMoves,
                opportunities: this.currentHints.opportunities
            });

            console.log('🎯 Level 0: Winning opportunity detected at columns', this.requiredMoves);
        } else {
            // No winning moves found
            if (this.forcedMoveMode) {
                this.forcedMoveMode = false;
                this.requiredMoves = [];
                this.emit('winningOpportunityDeactivated');
            }
        }
    }

    /**
     * Check for forced moves (Level 1 help: must block opponent's winning threats)
     * Only called if Level 0 didn't find winning opportunities
     */
    checkForcedMoves() {
        // Don't override if Level 0 already found winning moves
        if (this.forcedMoveMode && this.requiredMoves.length > 0) {
            console.log('🎯 Level 1: Skipping threat check - Level 0 winning move takes priority');
            return;
        }

        this.forcedMoveMode = false;
        this.requiredMoves = [];

        // Check if current player has help enabled
        if (this.ui && !this.ui.getCurrentPlayerHelpEnabled()) {
            return; // No help for this player
        }

        const opponent = this.game.currentPlayer === this.game.PLAYER1 ?
            this.game.PLAYER2 : this.game.PLAYER1;

        const validMoves = this.game.getValidMoves();
        const blockingMoves = [];

        // Check each valid move to see if opponent could win there
        for (const col of validMoves) {
            if (this.wouldOpponentWinAt(col, opponent)) {
                // Find the row where the opponent piece would land
                let row = this.game.ROWS - 1;
                while (row >= 0 && this.game.board[row][col] !== this.game.EMPTY) {
                    row--;
                }

                if (row >= 0) {
                    blockingMoves.push({
                        column: col,
                        row: row,
                        reason: 'Blocks opponent win'
                    });
                }
            }
        }

        // If there are moves that must be blocked, enter forced move mode
        if (blockingMoves.length > 0) {
            this.forcedMoveMode = true;
            this.requiredMoves = blockingMoves.map(move => move.column);

            // Add these as critical threats
            this.currentHints.threats = blockingMoves.map(move => ({
                column: move.column,
                row: move.row,
                type: 'forced_block',
                message: 'Du MUSST hier spielen um zu verhindern, dass der Gegner gewinnt!',
                priority: 'critical'
            }));

            // Emit forced move event for UI
            this.emit('forcedMoveActivated', {
                requiredMoves: this.requiredMoves,
                threats: this.currentHints.threats
            });
        } else {
            // No forced moves - deactivate if previously active
            if (this.forcedMoveMode) {
                this.forcedMoveMode = false;
                this.requiredMoves = [];
                this.emit('forcedMoveDeactivated');
            }
        }
    }

    /**
     * Check for trap avoidance (Level 2 help: avoid moves that allow opponent to win next turn)
     */
    checkTrapAvoidance() {
        // Check if current player has help enabled
        if (this.ui && !this.ui.getCurrentPlayerHelpEnabled()) {
            return; // No help for this player
        }

        const validMoves = this.game.getValidMoves();
        const safeMoves = [];
        const dangerousMoves = [];

        // Analyze each possible move for safety
        for (const col of validMoves) {
            if (this.isMoveUnsafe(col)) {
                dangerousMoves.push({
                    column: col,
                    reason: 'Allows opponent to win next turn'
                });
            } else {
                safeMoves.push({
                    column: col,
                    reason: 'Safe move - no immediate counter-threat'
                });
            }
        }

        // Determine action based on safe moves availability
        if (safeMoves.length === 0) {
            // All moves are dangerous - player is trapped!
            console.log('⚠️ Level 2: Player is TRAPPED - all moves lead to opponent wins');
            this.handleTrappedSituation(dangerousMoves);
        } else if (dangerousMoves.length > 0) {
            // Some moves are dangerous - filter them out
            console.log('🛡️ Level 2: Filtering out dangerous moves:', dangerousMoves.map(m => m.column));
            this.forcedMoveMode = true;
            this.requiredMoves = safeMoves.map(move => move.column);

            // Add these as safe move recommendations
            this.currentHints.suggestions = [{
                type: 'trap_avoidance',
                message: `⚠️ Vermeide Spalten ${dangerousMoves.map(m => m.column + 1).join(', ')} - Gegnerfallen!`,
                priority: 'medium',
                safeMoves: this.requiredMoves
            }];

            // Emit trap avoidance event for UI
            this.emit('trapAvoidanceActivated', {
                requiredMoves: this.requiredMoves,
                dangerousMoves: dangerousMoves.map(m => m.column),
                reason: 'Avoiding opponent traps'
            });

            console.log('🎯 Level 2: Safe moves only:', this.requiredMoves);
        } else {
            // All moves are safe - no action needed
            console.log('✅ Level 2: All moves are safe - no traps detected');
        }
    }

    /**
     * Check if a move is unsafe (allows opponent to win on next turn)
     * @param {number} col - Column to check
     * @returns {boolean} - True if move is unsafe
     */
    isMoveUnsafe(col) {
        // First, simulate our move
        const result = this.game.simulateMove(col);
        if (!result.success) {
            return true; // Invalid move is unsafe
        }

        if (result.wouldWin) {
            return false; // Winning moves are always safe (Level 0 should handle this)
        }

        // Create board state after our move
        const boardCopy = this.copyBoard(this.game.board);
        const row = this.getLowestEmptyRow(boardCopy, col);
        if (row === -1) {
            return true;
        } // Column full

        // Place our piece
        boardCopy[row][col] = this.game.currentPlayer;

        // Now check all possible opponent responses
        const opponent = this.game.currentPlayer === this.game.PLAYER1 ?
            this.game.PLAYER2 : this.game.PLAYER1;

        const opponentMoves = this.getValidMovesForBoard(boardCopy);

        for (const opponentCol of opponentMoves) {
            if (this.wouldMoveWinOnBoard(boardCopy, opponentCol, opponent)) {
                return true; // Opponent can win - our move is unsafe
            }
        }

        return false; // No opponent winning responses - move is safe
    }

    /**
     * Handle situation where player is completely trapped
     * @param {Array} dangerousMoves - All available moves (all dangerous)
     */
    handleTrappedSituation(dangerousMoves) {
        // Player is trapped - still need to make a move
        // Choose the "least bad" option or let them choose
        this.forcedMoveMode = false; // Don't force specific moves when trapped
        this.requiredMoves = [];

        // Add warning about trapped situation
        this.currentHints.suggestions = [{
            type: 'trapped_warning',
            message: '🚨 GEFANGEN! Alle Züge erlauben dem Gegner zu gewinnen. Wähle den besten schlechten Zug.',
            priority: 'critical',
            trappedMoves: dangerousMoves.map(m => m.column)
        }];

        // Emit trapped event for UI
        this.emit('playerTrapped', {
            dangerousMoves: dangerousMoves.map(m => m.column),
            message: 'All moves lead to opponent wins'
        });
    }

    /**
     * Copy game board
     * @param {Array} board - Original board
     * @returns {Array} - Copied board
     */
    copyBoard(board) {
        return board.map(row => [...row]);
    }

    /**
     * Get valid moves for a given board state
     * @param {Array} board - Board state
     * @returns {Array} - Valid column indices
     */
    getValidMovesForBoard(board) {
        const validMoves = [];
        for (let col = 0; col < this.game.COLS; col++) {
            if (board[0][col] === this.game.EMPTY) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }

    /**
     * Get lowest empty row in column for given board
     * @param {Array} board - Board state
     * @param {number} col - Column index
     * @returns {number} - Row index or -1 if column full
     */
    getLowestEmptyRow(board, col) {
        for (let row = this.game.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === this.game.EMPTY) {
                return row;
            }
        }
        return -1;
    }

    /**
     * Check if a move would win on a given board state
     * @param {Array} board - Board state
     * @param {number} col - Column to check
     * @param {number} player - Player making the move
     * @returns {boolean} - True if move would win
     */
    wouldMoveWinOnBoard(board, col, player) {
        const row = this.getLowestEmptyRow(board, col);
        if (row === -1) {
            return false;
        } // Column full

        // Temporarily place piece
        board[row][col] = player;

        // Check for win
        const isWin = this.checkWinAtPosition(row, col, player);

        // Remove piece
        board[row][col] = this.game.EMPTY;

        return isWin;
    }

    /**
     * Check if opponent would win by playing in the given column
     * @param {number} col - Column to check
     * @param {number} opponent - Opponent player number
     * @returns {boolean} - True if opponent would win
     */
    wouldOpponentWinAt(col, opponent) {
        // Find where the piece would land
        let row = this.game.ROWS - 1;
        while (row >= 0 && this.game.board[row][col] !== this.game.EMPTY) {
            row--;
        }

        if (row < 0) {
            return false;
        } // Column full

        // Temporarily place opponent's piece
        this.game.board[row][col] = opponent;

        // Check if this creates a win
        const isWin = this.checkWinAtPosition(row, col, opponent);

        // Remove the piece
        this.game.board[row][col] = this.game.EMPTY;

        return isWin;
    }

    /**
     * Check if there's a win at the given position for the given player
     * @param {number} row - Row position
     * @param {number} col - Column position
     * @param {number} player - Player to check for
     * @returns {boolean} - True if there's a win
     */
    checkWinAtPosition(row, col, player) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        for (const [deltaRow, deltaCol] of directions) {
            let count = 1; // Count the placed piece

            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS &&
                   this.game.board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }

            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS &&
                   this.game.board[r][c] === player) {
                count++;
                r -= deltaRow;
                c -= deltaCol;
            }

            if (count >= 4) {
                return true;
            }
        }

        return false;
    }

    /**
     * Analyze immediate threats (opponent can win next move)
     */
    analyzeThreats() {
        this.currentHints.threats = [];

        const opponent = this.game.currentPlayer === this.game.PLAYER1 ?
            this.game.PLAYER2 : this.game.PLAYER1;

        const validMoves = this.game.getValidMoves();

        for (const col of validMoves) {
            // Simulate opponent move
            const originalPlayer = this.game.currentPlayer;
            this.game.currentPlayer = opponent;

            const result = this.game.simulateMove(col);

            this.game.currentPlayer = originalPlayer;

            if (result.success && result.wouldWin) {
                this.currentHints.threats.push({
                    column: col,
                    row: result.row,
                    type: 'immediate_threat',
                    message: 'Gegner kann hier gewinnen!',
                    priority: 'critical'
                });
            }
        }
    }

    /**
     * Analyze win opportunities (current player can win next move)
     */
    analyzeOpportunities() {
        this.currentHints.opportunities = [];

        const validMoves = this.game.getValidMoves();

        for (const col of validMoves) {
            const result = this.game.simulateMove(col);

            if (result.success && result.wouldWin) {
                this.currentHints.opportunities.push({
                    column: col,
                    row: result.row,
                    type: 'winning_move',
                    message: 'Gewinnzug verfügbar!',
                    priority: 'high'
                });
            }
        }
    }




    /**
     * Generate strategic suggestions
     */
    generateStrategicSuggestions() {
        this.currentHints.suggestions = [];

        // Priority 1: Take winning moves
        if (this.currentHints.opportunities.some(opp => opp.type === 'winning_move')) {
            this.currentHints.suggestions.push({
                type: 'strategic_advice',
                message: '🎯 Gewinnzug verfügbar - nutze ihn!',
                priority: 'critical'
            });
            return; // No other suggestions needed if win is available
        }

        // Priority 2: Block threats
        if (this.currentHints.threats.length > 0) {
            this.currentHints.suggestions.push({
                type: 'defensive_advice',
                message: '🛡️ Blockiere die gegnerische Bedrohung!',
                priority: 'high'
            });
        }


        // General strategic advice based on game state
        this.addGeneralStrategicAdvice();
    }

    /**
     * Add general strategic advice
     */
    addGeneralStrategicAdvice() {
        const moveCount = this.game.moveHistory.length;
        const validMoves = this.game.getValidMoves();

        // Early game advice
        if (moveCount < 4) {
            if (validMoves.includes(3)) {
                this.currentHints.suggestions.push({
                    type: 'strategic_advice',
                    message: '🎯 Spiele in der Mitte für bessere Kontrolle',
                    priority: 'low'
                });
            }
        }

        // Mid game advice
        if (moveCount >= 4 && moveCount < 12) {
            this.currentHints.suggestions.push({
                type: 'strategic_advice',
                message: '🏗️ Baue Verbindungen auf und vermeide Fallen',
                priority: 'low'
            });
        }

        // Check for dangerous patterns
        if (this.hasOpponentBuiltTrap()) {
            this.currentHints.suggestions.push({
                type: 'warning',
                message: '⚠️ Vorsicht vor gegnerischen Fallen!',
                priority: 'medium'
            });
        }
    }

    /**
     * Check if opponent has built a potential trap
     */
    hasOpponentBuiltTrap() {
        const opponent = this.game.currentPlayer === this.game.PLAYER1 ?
            this.game.PLAYER2 : this.game.PLAYER1;

        // Look for opponent patterns that could become dangerous
        let opponentThreats = 0;

        // Switch to opponent perspective temporarily
        const originalPlayer = this.game.currentPlayer;
        this.game.currentPlayer = opponent;

        const validMoves = this.game.getValidMoves();
        for (const col of validMoves) {
            const threats = this.countThreatsAfterMove(col);
            if (threats >= 2) {
                opponentThreats++;
            }
        }

        // Restore original player
        this.game.currentPlayer = originalPlayer;

        return opponentThreats > 0;
    }

    /**
     * Display all current hints in the UI
     */
    displayHints() {
        this.displayVisualHints();
        this.displayTextualHints();
    }

    /**
     * Display visual hints on the board
     */
    displayVisualHints() {
        const hintsOverlay = document.getElementById('hintsOverlay');
        if (!hintsOverlay) {
            return;
        }

        // Double-check: Only show visual hints if current player has help enabled
        if (this.ui && !this.ui.getCurrentPlayerHelpEnabled()) {
            hintsOverlay.innerHTML = '';
            hintsOverlay.style.display = 'none';
            return;
        }

        // For Level 1 and below, we don't show visual overlays - only column blocking
        if (this.helpLevel <= 1) {
            hintsOverlay.innerHTML = '';
            hintsOverlay.style.display = 'none';
            return;
        }

        hintsOverlay.innerHTML = '';
        hintsOverlay.style.display = 'block';

        // Show threat indicators (only for Level 2+)
        this.currentHints.threats.forEach(threat => {
            const indicator = this.createHintIndicator(threat.row, threat.column, 'threat');
            hintsOverlay.appendChild(indicator);
        });

        // Show opportunity indicators (only for Level 2+)
        this.currentHints.opportunities.forEach(opportunity => {
            const indicator = this.createHintIndicator(opportunity.row, opportunity.column, 'opportunity');
            hintsOverlay.appendChild(indicator);
        });
    }

    /**
     * Create a visual hint indicator
     */
    createHintIndicator(row, col, type) {
        const indicator = document.createElement('div');
        indicator.className = `hint-indicator ${type}`;

        // Position the indicator over the corresponding cell
        const cellSize = 60; // Should match CSS cell size
        const gap = 8; // Should match CSS gap
        const padding = 20; // Should match board padding

        const left = padding + col * (cellSize + gap);
        const top = padding + row * (cellSize + gap);

        indicator.style.left = `${left}px`;
        indicator.style.top = `${top}px`;

        return indicator;
    }

    /**
     * Display textual hints in the help panel
     */
    displayTextualHints() {
        const helpPanel = document.getElementById('helpPanel');
        const threatWarning = document.getElementById('threatWarning');
        const strategyHint = document.getElementById('strategyHint');

        if (!helpPanel) {
            return;
        }

        // Show help panel if there are hints
        const hasHints = this.currentHints.threats.length > 0 ||
                        this.currentHints.opportunities.length > 0 ||
                        this.currentHints.suggestions.length > 0;

        helpPanel.style.display = hasHints ? 'block' : 'none';

        // Display threats
        if (threatWarning && this.currentHints.threats.length > 0) {
            threatWarning.style.display = 'block';
            threatWarning.textContent = this.currentHints.threats[0].message;
        } else if (threatWarning) {
            threatWarning.style.display = 'none';
        }

        // Display strategic suggestions
        if (strategyHint && this.currentHints.suggestions.length > 0) {
            strategyHint.style.display = 'block';
            const suggestion = this.currentHints.suggestions
                .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority))[0];
            strategyHint.textContent = suggestion.message;
        } else if (strategyHint) {
            strategyHint.style.display = 'none';
        }
    }

    /**
     * Get numeric value for priority sorting
     */
    getPriorityValue(priority) {
        switch (priority) {
            case 'critical': return 4;
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    }

    /**
     * Clear all visual and textual hints
     */
    clearAllHints() {
        // Always hide visual hints overlay for Level 1
        const hintsOverlay = document.getElementById('hintsOverlay');
        if (hintsOverlay) {
            hintsOverlay.innerHTML = '';
            hintsOverlay.style.display = 'none';
        }

        // Clear textual hints
        const helpPanel = document.getElementById('helpPanel');
        if (helpPanel) {
            helpPanel.style.display = 'none';
        }

        // Reset hints data
        this.currentHints = {
            threats: [],
            opportunities: [],
            suggestions: []
        };
    }

    /**
     * Get all current hints as an object
     */
    getCurrentHints() {
        return {
            threats: [...this.currentHints.threats],
            opportunities: [...this.currentHints.opportunities],
            suggestions: [...this.currentHints.suggestions]
        };
    }

    /**
     * Analyze a specific move and return hints about it
     */
    analyzeMoveConsequences(col) {
        const analysis = {
            isWinning: false,
            blocksOpponent: false,
            createsThreats: 0,
            allowsOpponentWin: false,
            strategicValue: 'neutral'
        };

        // Check if it's a winning move
        const result = this.game.simulateMove(col);
        if (result.success && result.wouldWin) {
            analysis.isWinning = true;
            analysis.strategicValue = 'excellent';
            return analysis;
        }

        // Check if it blocks opponent
        const opponent = this.game.currentPlayer === this.game.PLAYER1 ?
            this.game.PLAYER2 : this.game.PLAYER1;

        const originalPlayer = this.game.currentPlayer;
        this.game.currentPlayer = opponent;
        const opponentResult = this.game.simulateMove(col);
        this.game.currentPlayer = originalPlayer;

        if (opponentResult.success && opponentResult.wouldWin) {
            analysis.blocksOpponent = true;
            analysis.strategicValue = 'good';
        }

        // Check threats created
        analysis.createsThreats = this.countThreatsAfterMove(col);
        if (analysis.createsThreats >= 2) {
            analysis.strategicValue = 'very good';
        }

        // Check if move allows opponent to win on next turn
        // (This is a simplified check - could be more sophisticated)
        if (this.currentHints.threats.length === 0) {
            // Simulate the move and check if opponent gets new threats
            const boardCopy = this.game.getBoard();
            let row = this.game.ROWS - 1;
            while (row >= 0 && boardCopy[row][col] !== this.game.EMPTY) {
                row--;
            }

            if (row >= 0) {
                boardCopy[row][col] = this.game.currentPlayer;

                // Check if this gives opponent new winning opportunities
                const tempGame = Object.create(this.game);
                tempGame.board = boardCopy;
                tempGame.currentPlayer = opponent;

                const tempHelpers = new Connect4Helpers(tempGame);
                tempHelpers.analyzeOpportunities();

                if (tempHelpers.currentHints.opportunities.some(opp => opp.type === 'winning_move')) {
                    analysis.allowsOpponentWin = true;
                    analysis.strategicValue = 'poor';
                }
            }
        }

        return analysis;
    }

    /**
     * Count threats after making a specific move
     * @param {number} col - Column to analyze
     * @returns {number} - Number of threats created
     */
    countThreatsAfterMove(col) {
        // Simulate the move
        const result = this.game.simulateMove(col);
        if (!result.success) {
            return 0; // Invalid move
        }

        // Count how many ways current player can win from this new position
        let threats = 0;
        const validMoves = this.game.getValidMoves();

        for (const checkCol of validMoves) {
            const checkResult = this.game.simulateMove(checkCol);
            if (checkResult.success && checkResult.wouldWin) {
                threats++;
            }
        }

        return threats;
    }

    // ========== ADVANCED STRATEGIC ANALYSIS ==========

    /**
     * Analyze Even/Odd threats according to Connect 4 theory
     * Even threats: rows 2, 4, 6 (0-indexed: 1, 3, 5)
     * Odd threats: rows 1, 3, 5 (0-indexed: 0, 2, 4)
     */
    analyzeEvenOddThreats() {
        const analysis = {
            player: { odd: [], even: [] },
            opponent: { odd: [], even: [] },
            parity: 'unknown'
        };

        const currentPlayer = this.game.currentPlayer;
        const opponent = currentPlayer === this.game.PLAYER1 ? this.game.PLAYER2 : this.game.PLAYER1;

        // Analyze all possible threats on the board
        for (let col = 0; col < this.game.COLS; col++) {
            const threatInfo = this.analyzeColumnThreats(col, currentPlayer);
            const opponentThreatInfo = this.analyzeColumnThreats(col, opponent);

            // Categorize threats by even/odd
            threatInfo.forEach(threat => {
                if (threat.row % 2 === 0) {
                    analysis.player.odd.push({...threat, column: col});
                } else {
                    analysis.player.even.push({...threat, column: col});
                }
            });

            opponentThreatInfo.forEach(threat => {
                if (threat.row % 2 === 0) {
                    analysis.opponent.odd.push({...threat, column: col});
                } else {
                    analysis.opponent.even.push({...threat, column: col});
                }
            });
        }

        // Determine parity advantage
        const playerOddCount = analysis.player.odd.length;
        const playerEvenCount = analysis.player.even.length;
        const opponentOddCount = analysis.opponent.odd.length;
        const opponentEvenCount = analysis.opponent.even.length;

        if (playerOddCount >= 3) {
            analysis.parity = 'player_winning_odd';
        } else if (opponentOddCount >= 3) {
            analysis.parity = 'opponent_winning_odd';
        } else if (playerEvenCount > 0 && opponentOddCount === 0) {
            analysis.parity = 'player_even_advantage';
        } else if (opponentEvenCount > 0 && playerOddCount === 0) {
            analysis.parity = 'opponent_even_advantage';
        }

        return analysis;
    }

    /**
     * Count connected pieces in a specific direction from a position
     */
    countConnectedPieces(row, col, deltaRow, deltaCol, player) {
        let count = 1; // Count the piece at the starting position
        
        // Check positive direction
        let r = row + deltaRow;
        let c = col + deltaCol;
        while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && 
               this.game.board[r][c] === player) {
            count++;
            r += deltaRow;
            c += deltaCol;
        }
        
        // Check negative direction  
        r = row - deltaRow;
        c = col - deltaCol;
        while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && 
               this.game.board[r][c] === player) {
            count++;
            r -= deltaRow;
            c -= deltaCol;
        }
        
        return count;
    }

    /**
     * Analyze potential threats in a specific column
     */
    analyzeColumnThreats(col, player) {
        const threats = [];
        
        for (let row = 0; row < this.game.ROWS; row++) {
            if (this.game.board[row][col] === this.game.EMPTY) {
                // Check if placing a piece here would create a threat
                const threatLevel = this.evaluateThreatAtPosition(row, col, player);
                if (threatLevel > 0) {
                    threats.push({
                        row: row,
                        level: threatLevel,
                        type: row % 2 === 0 ? 'odd' : 'even'
                    });
                }
            }
        }
        
        return threats;
    }

    /**
     * Evaluate threat level at a specific position
     */
    evaluateThreatAtPosition(row, col, player) {
        // Temporarily place piece
        this.game.board[row][col] = player;
        
        let threatLevel = 0;
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1] // horizontal, vertical, diagonals
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            const lineLength = this.countConnectedPieces(row, col, deltaRow, deltaCol, player);
            if (lineLength === 3) {
                threatLevel = 3; // Immediate win threat
                break;
            } else if (lineLength === 2) {
                threatLevel = Math.max(threatLevel, 2); // Strong threat
            }
        }
        
        // Remove piece
        this.game.board[row][col] = this.game.EMPTY;
        
        return threatLevel;
    }

    /**
     * Detect Zugzwang situations (opponent forced to make bad moves)
     * Uses board simulation to avoid corrupting game state
     */
    detectZugzwang() {
        const validMoves = this.game.getValidMoves();
        const opponent = this.game.currentPlayer === this.game.PLAYER1 ? this.game.PLAYER2 : this.game.PLAYER1;
        
        let zugzwangMoves = [];
        
        for (const col of validMoves) {
            // Create board copy for safe simulation
            const boardCopy = this.copyBoard(this.game.board);
            
            // Simulate opponent move on copy
            const row = this.getLowestEmptyRow(boardCopy, col);
            if (row === -1) continue; // Column full
            
            boardCopy[row][col] = opponent;
            
            // Check if this creates winning opportunities for us
            const ourWinningMoves = this.findWinningMovesOnBoard(boardCopy, this.game.currentPlayer);
            const opponentCanBlock = ourWinningMoves.length <= 1; // Simple heuristic
            
            if (ourWinningMoves.length > 0 && !opponentCanBlock) {
                zugzwangMoves.push({
                    column: col,
                    winningMoves: ourWinningMoves,
                    description: 'Forces opponent into losing position'
                });
            }
        }
        
        return zugzwangMoves;
    }

    /**
     * Find all winning moves for a player
     */
    findWinningMoves(player) {
        const winningMoves = [];
        const validMoves = this.game.getValidMoves();
        
        for (const col of validMoves) {
            const result = this.game.simulateMove(col);
            if (result.success && result.wouldWin) {
                winningMoves.push(col);
            }
        }
        
        return winningMoves;
    }

    /**
     * Check if opponent can block all our threats
     */
    canOpponentBlockAllThreats(threats, opponent) {
        if (threats.length === 0) return true;
        if (threats.length === 1) return true; // Can always block one threat
        
        // If we have multiple threats, opponent cannot block all
        return false;
    }

    /**
     * Detect and plan fork opportunities (multiple winning threats)
     */
    analyzeForkOpportunities() {
        const forks = [];
        const validMoves = this.game.getValidMoves();
        
        for (const col of validMoves) {
            const forkPotential = this.evaluateForkPotential(col);
            if (forkPotential.threats >= 2) {
                forks.push({
                    column: col,
                    threats: forkPotential.threats,
                    winPaths: forkPotential.paths,
                    priority: forkPotential.threats >= 3 ? 'critical' : 'high'
                });
            }
        }
        
        return forks.sort((a, b) => b.threats - a.threats);
    }

    /**
     * Evaluate fork potential for a move
     * Uses board simulation to avoid corrupting game state
     */
    evaluateForkPotential(col) {
        // Create board copy for safe simulation
        const boardCopy = this.copyBoard(this.game.board);
        
        // Simulate the move on copy
        const row = this.getLowestEmptyRow(boardCopy, col);
        if (row === -1) return { threats: 0, paths: [] };
        
        boardCopy[row][col] = this.game.currentPlayer;
        
        // Count how many winning moves we would have
        const winningMoves = this.findWinningMovesOnBoard(boardCopy, this.game.currentPlayer);
        const paths = this.analyzePotentialWinPathsOnBoard(boardCopy);
        
        return {
            threats: winningMoves.length,
            paths: paths
        };
    }

    /**
     * Analyze potential winning paths from current position
     */
    analyzePotentialWinPaths() {
        const paths = [];
        const validMoves = this.game.getValidMoves();
        
        for (const col of validMoves) {
            const path = this.tracePotentialWinPath(col);
            if (path.length > 0) {
                paths.push({
                    startColumn: col,
                    sequence: path,
                    length: path.length
                });
            }
        }
        
        return paths;
    }

    /**
     * Trace a potential winning path from a starting move
     */
    tracePotentialWinPath(startCol) {
        // This is a simplified version - in practice would use deeper analysis
        const row = this.getLowestEmptyRow(this.game.board, startCol);
        if (row === -1) return [];
        
        // Check if this move leads to immediate tactical advantages
        const threats = this.countThreatsAfterMove(startCol);
        
        return threats >= 2 ? [startCol] : [];
    }

    /**
     * Copy board for safe simulation
     */
    copyBoard(board) {
        return board.map(row => [...row]);
    }

    /**
     * Find winning moves on a specific board state
     */
    findWinningMovesOnBoard(board, player) {
        const winningMoves = [];
        const validMoves = this.getValidMovesOnBoard(board);
        
        for (const col of validMoves) {
            const row = this.getLowestEmptyRow(board, col);
            if (row !== -1) {
                // Temporarily place piece
                board[row][col] = player;
                
                // Check for win
                if (this.checkWinOnBoard(board, row, col, player)) {
                    winningMoves.push(col);
                }
                
                // Remove piece
                board[row][col] = this.game.EMPTY;
            }
        }
        
        return winningMoves;
    }

    /**
     * Get valid moves for a board state
     */
    getValidMovesOnBoard(board) {
        const validMoves = [];
        for (let col = 0; col < this.game.COLS; col++) {
            if (board[0][col] === this.game.EMPTY) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }

    /**
     * Check win condition on a board
     */
    checkWinOnBoard(board, row, col, player) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1] // horizontal, vertical, diagonals
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            let count = 1; // Count the placed piece
            
            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }
            
            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < this.game.ROWS && c >= 0 && c < this.game.COLS && board[r][c] === player) {
                count++;
                r -= deltaRow;
                c -= deltaCol;
            }
            
            if (count >= 4) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Analyze potential winning paths on a board (simplified version)
     */
    analyzePotentialWinPathsOnBoard(board) {
        // Simplified implementation for now
        return [];
    }

    /**
     * Enhanced strategic move evaluation combining all analysis
     */
    getEnhancedStrategicEvaluation() {
        const evaluation = {
            evenOddAnalysis: this.analyzeEvenOddThreats(),
            zugzwangOpportunities: this.detectZugzwang(),
            forkOpportunities: this.analyzeForkOpportunities(),
            recommendedMove: null,
            confidence: 'low'
        };

        // Determine best move based on combined analysis
        if (evaluation.forkOpportunities.length > 0) {
            evaluation.recommendedMove = evaluation.forkOpportunities[0].column;
            evaluation.confidence = 'high';
        } else if (evaluation.zugzwangOpportunities.length > 0) {
            evaluation.recommendedMove = evaluation.zugzwangOpportunities[0].column;
            evaluation.confidence = 'medium';
        } else if (evaluation.evenOddAnalysis.parity === 'player_winning_odd') {
            // Prefer odd threats
            const oddThreats = evaluation.evenOddAnalysis.player.odd;
            if (oddThreats.length > 0) {
                evaluation.recommendedMove = oddThreats[0].column;
                evaluation.confidence = 'medium';
            }
        }

        return evaluation;
    }

    /**
     * Event system methods for UI communication
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
}
