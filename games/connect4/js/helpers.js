/**
 * Connect4Helpers - Helper system for Connect 4 game
 */
class Connect4Helpers {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.threatIndicators = [];
        this.opportunityIndicators = [];
        this.currentHints = {
            threats: [],
            opportunities: [],
            suggestions: []
        };
    }
    
    /**
     * Enable or disable the hints system
     * @param {boolean} enabled - Whether hints should be enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            this.clearAllHints();
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
        
        // Analyze current position
        this.analyzeThreats();
        this.analyzeOpportunities();
        this.generateStrategicSuggestions();
        
        // Display hints
        this.displayHints();
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
        
        hintsOverlay.innerHTML = '';
        hintsOverlay.style.display = 'block';
        
        // Show threat indicators
        this.currentHints.threats.forEach(threat => {
            const indicator = this.createHintIndicator(threat.row, threat.column, 'threat');
            hintsOverlay.appendChild(indicator);
        });
        
        // Show opportunity indicators
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
        // Clear visual hints
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
}