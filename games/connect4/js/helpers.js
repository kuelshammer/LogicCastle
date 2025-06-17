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
        
        this.clearAllHints();
        
        // Check for winning opportunities first (Level 0+)
        if (this.helpLevel >= 0) {
            this.checkWinningOpportunities();
        }
        
        // Check for critical defensive situations (Level 1+)
        if (this.helpLevel >= 1) {
            this.checkForcedMoves();
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
        
        if (row < 0) return false; // Column full
        
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
        
        // Look for setup moves (moves that create multiple threats)
        this.analyzeSetupMoves();
    }
    
    /**
     * Analyze setup moves that create multiple win opportunities
     */
    analyzeSetupMoves() {
        const validMoves = this.game.getValidMoves();
        
        for (const col of validMoves) {
            const threats = this.countThreatsAfterMove(col);
            
            if (threats >= 2) {
                // Find the row where the piece would land
                let row = this.game.ROWS - 1;
                while (row >= 0 && this.game.board[row][col] !== this.game.EMPTY) {
                    row--;
                }
                
                this.currentHints.opportunities.push({
                    column: col,
                    row: row,
                    type: 'setup_move',
                    message: `Zwickmühle möglich! (${threats} Bedrohungen)`,
                    priority: 'medium'
                });
            }
        }
    }
    
    /**
     * Count how many threats would be created after a move
     */
    countThreatsAfterMove(col) {
        // Create a copy of the game state
        const boardCopy = this.game.getBoard();
        
        // Find where the piece would land
        let row = this.game.ROWS - 1;
        while (row >= 0 && boardCopy[row][col] !== this.game.EMPTY) {
            row--;
        }
        
        if (row < 0) return 0; // Column full
        
        // Place the piece
        boardCopy[row][col] = this.game.currentPlayer;
        
        // Count potential wins from this new state
        let threats = 0;
        
        for (let testCol = 0; testCol < this.game.COLS; testCol++) {
            if (boardCopy[0][testCol] === this.game.EMPTY) {
                // Find where a piece would land in this column
                let testRow = this.game.ROWS - 1;
                while (testRow >= 0 && boardCopy[testRow][testCol] !== this.game.EMPTY) {
                    testRow--;
                }
                
                if (testRow >= 0) {
                    // Test if placing a piece here would win
                    if (this.wouldWinAtPosition(boardCopy, testRow, testCol, this.game.currentPlayer)) {
                        threats++;
                    }
                }
            }
        }
        
        return threats;
    }
    
    /**
     * Check if placing a piece at a position would result in a win
     */
    wouldWinAtPosition(board, row, col, player) {
        // Temporarily place the piece
        board[row][col] = player;
        
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;
            
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
                // Remove the temporarily placed piece
                board[row][col] = this.game.EMPTY;
                return true;
            }
        }
        
        // Remove the temporarily placed piece
        board[row][col] = this.game.EMPTY;
        return false;
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
        
        // Priority 3: Create setup moves
        if (this.currentHints.opportunities.some(opp => opp.type === 'setup_move')) {
            this.currentHints.suggestions.push({
                type: 'strategic_advice',
                message: '⚡ Zwickmühle möglich - schaffe mehrere Bedrohungen!',
                priority: 'medium'
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
        if (!hintsOverlay) return;
        
        // For Level 1, we don't show visual overlays - only column blocking
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
        
        if (!helpPanel) return;
        
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