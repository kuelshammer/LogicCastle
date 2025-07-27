/**
 * LGameAssistanceManager - L-Game Player Assistance & Hints
 * 
 * Adapted from Connect4/Gomoku AssistanceManager for L-Game specific mechanics.
 * Provides intelligent move suggestions, blockade warnings, and strategic hints.
 * 
 * Responsibilities:
 * - Valid L-piece move highlighting
 * - Blockade threat detection
 * - Strategic position analysis
 * - Player assistance toggles
 * - Move suggestion system
 */

export class LGameAssistanceManager {
    constructor(gameLogic, boardRenderer) {
        this.gameLogic = gameLogic;
        this.boardRenderer = boardRenderer;
        
        // Assistance state
        this.assistanceEnabled = true;
        this.showHints = true;
        this.showThreats = true;
        this.showValidMoves = false;
        
        // Current assistance data
        this.currentHints = [];
        this.currentThreats = [];
        this.suggestedMoves = [];
        
        // UI elements
        this.assistancePanel = null;
        this.initialized = false;
    }

    /**
     * Initialize assistance manager
     */
    async init() {
        this.createAssistancePanel();
        this.bindEvents();
        this.initialized = true;
        console.log('🔮 L-Game AssistanceManager initialized');
        return true;
    }

    /**
     * Create assistance control panel
     * @private
     */
    createAssistancePanel() {
        // Find or create assistance container
        let container = document.getElementById('assistance-controls');
        if (!container) {
            container = document.createElement('div');
            container.id = 'assistance-controls';
            container.className = 'lc-glass rounded-xl p-4 space-y-3';
            
            // Insert into sidebar or create floating panel
            const sidebar = document.querySelector('.space-y-6');
            if (sidebar) {
                sidebar.appendChild(container);
            } else {
                document.body.appendChild(container);
                container.style.position = 'fixed';
                container.style.top = '20px';
                container.style.right = '20px';
                container.style.zIndex = '1000';
            }
        }

        container.innerHTML = `
            <h3 class="text-lg font-bold text-white mb-3">🔮 Spielhilfen</h3>
            <div class="space-y-2">
                <label class="flex items-center text-sm text-gray-200">
                    <input type="checkbox" id="toggle-hints" ${this.showHints ? 'checked' : ''} 
                           class="mr-2 rounded">
                    💡 Strategische Hinweise
                </label>
                <label class="flex items-center text-sm text-gray-200">
                    <input type="checkbox" id="toggle-threats" ${this.showThreats ? 'checked' : ''} 
                           class="mr-2 rounded">
                    ⚠️ Blockade-Warnungen
                </label>
                <label class="flex items-center text-sm text-gray-200">
                    <input type="checkbox" id="toggle-valid-moves" ${this.showValidMoves ? 'checked' : ''} 
                           class="mr-2 rounded">
                    🎯 Gültige Züge anzeigen
                </label>
            </div>
            <div class="mt-4 pt-3 border-t border-white/20">
                <button id="suggest-move" class="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 
                                               text-white rounded-lg text-sm transition-colors">
                    🤖 Zug vorschlagen
                </button>
            </div>
            <div id="assistance-info" class="mt-3 text-xs text-gray-300">
                <!-- Assistance information will be displayed here -->
            </div>
        `;

        this.assistancePanel = container;
    }

    /**
     * Bind assistance control events
     * @private
     */
    bindEvents() {
        if (!this.assistancePanel) return;

        // Toggle controls
        const toggleHints = this.assistancePanel.querySelector('#toggle-hints');
        const toggleThreats = this.assistancePanel.querySelector('#toggle-threats');
        const toggleValidMoves = this.assistancePanel.querySelector('#toggle-valid-moves');
        const suggestButton = this.assistancePanel.querySelector('#suggest-move');

        if (toggleHints) {
            toggleHints.addEventListener('change', (e) => {
                this.showHints = e.target.checked;
                this.updateAssistance();
            });
        }

        if (toggleThreats) {
            toggleThreats.addEventListener('change', (e) => {
                this.showThreats = e.target.checked;
                this.updateAssistance();
            });
        }

        if (toggleValidMoves) {
            toggleValidMoves.addEventListener('change', (e) => {
                this.showValidMoves = e.target.checked;
                this.updateAssistance();
            });
        }

        if (suggestButton) {
            suggestButton.addEventListener('click', () => {
                this.suggestBestMove();
            });
        }
    }

    /**
     * Update assistance based on current game state
     */
    async updateAssistance() {
        if (!this.assistanceEnabled || !this.gameLogic) return;

        try {
            // Clear previous assistance
            this.clearAssistance();

            // Get current game state
            const gameState = this.gameLogic.getGameState();
            if (!gameState || gameState.gameOver) return;

            // Show valid moves if enabled
            if (this.showValidMoves) {
                await this.showValidLMoves();
            }

            // Detect and show threats
            if (this.showThreats) {
                await this.detectBlockadeThreats();
            }

            // Show strategic hints
            if (this.showHints) {
                await this.showStrategicHints();
            }

            // Update assistance info panel
            this.updateAssistanceInfo();

        } catch (error) {
            console.warn('⚠️ Assistance update failed:', error);
        }
    }

    /**
     * Show valid L-piece moves for current player
     * @private
     */
    async showValidLMoves() {
        try {
            // Get valid moves from game logic
            const validMoves = this.gameLogic.getValidLMoves();
            
            if (validMoves && validMoves.length > 0) {
                // Extract unique positions from valid moves
                const validPositions = validMoves.map(move => [move.row, move.col]);
                
                // Highlight on board
                this.boardRenderer.highlightValidMoves(validPositions);
                
                console.log(`💡 Showing ${validMoves.length} valid L-piece moves`);
            }
        } catch (error) {
            console.warn('⚠️ Failed to show valid moves:', error);
        }
    }

    /**
     * Detect and highlight blockade threats
     * @private
     */
    async detectBlockadeThreats() {
        try {
            // Check if current player is in danger of being blocked
            const threatAnalysis = this.analyzeBlockadeThreats();
            
            if (threatAnalysis.isInDanger) {
                // Highlight threatened positions
                this.boardRenderer.showBlockadeThreat(threatAnalysis.dangerousPositions);
                
                // Add to current threats for info display
                this.currentThreats.push({
                    type: 'blockade',
                    severity: threatAnalysis.severity,
                    description: threatAnalysis.description
                });
                
                console.log('⚠️ Blockade threat detected:', threatAnalysis.description);
            }
        } catch (error) {
            console.warn('⚠️ Failed to detect threats:', error);
        }
    }

    /**
     * Analyze blockade threats for current player
     * @private
     */
    analyzeBlockadeThreats() {
        try {
            const validMoves = this.gameLogic.getValidLMoves();
            const currentPlayer = this.gameLogic.getCurrentPlayer();
            
            // Check mobility
            const mobilityCount = validMoves ? validMoves.length : 0;
            
            if (mobilityCount === 0) {
                return {
                    isInDanger: true,
                    severity: 'critical',
                    description: 'Keine gültigen Züge verfügbar - Sie sind blockiert!',
                    dangerousPositions: []
                };
            } else if (mobilityCount <= 2) {
                return {
                    isInDanger: true,
                    severity: 'high',
                    description: `Nur ${mobilityCount} Zug${mobilityCount > 1 ? 'ü' : ''}ge verfügbar - Blockade-Gefahr!`,
                    dangerousPositions: validMoves.map(move => [move.row, move.col])
                };
            } else if (mobilityCount <= 4) {
                return {
                    isInDanger: true,
                    severity: 'medium',
                    description: `Begrenzte Mobilität: ${mobilityCount} Züge verfügbar`,
                    dangerousPositions: []
                };
            }
            
            return { isInDanger: false };
        } catch (error) {
            console.warn('⚠️ Threat analysis failed:', error);
            return { isInDanger: false };
        }
    }

    /**
     * Show strategic hints
     * @private
     */
    async showStrategicHints() {
        try {
            const hints = this.generateStrategicHints();
            this.currentHints = hints;
            
            // Log hints for debugging
            if (hints.length > 0) {
                console.log('💡 Strategic hints:', hints.map(h => h.description));
            }
        } catch (error) {
            console.warn('⚠️ Failed to generate hints:', error);
        }
    }

    /**
     * Generate strategic hints based on game state
     * @private
     */
    generateStrategicHints() {
        const hints = [];
        
        try {
            const gameState = this.gameLogic.getGameState();
            if (!gameState) return hints;

            const validMoves = this.gameLogic.getValidLMoves();
            const moveCount = this.gameLogic.getMoveCount();
            
            // Opening hints
            if (moveCount < 4) {
                hints.push({
                    type: 'opening',
                    priority: 'medium',
                    description: 'Frühe Spielphase: Kontrollieren Sie das Zentrum und behalten Sie Flexibilität.'
                });
            }
            
            // Mobility hints
            if (validMoves && validMoves.length > 0) {
                if (validMoves.length <= 3) {
                    hints.push({
                        type: 'mobility',
                        priority: 'high',
                        description: 'Niedrige Mobilität! Vermeiden Sie weitere Einschränkungen.'
                    });
                } else if (validMoves.length >= 8) {
                    hints.push({
                        type: 'mobility',
                        priority: 'low',
                        description: 'Hohe Mobilität - nutzen Sie diese für strategische Positionierung.'
                    });
                }
            }
            
            // Center control hints
            const centerPositions = [[1, 1], [1, 2], [2, 1], [2, 2]];
            const centerControl = this.analyzeCenterControl(centerPositions);
            
            if (centerControl.advantage === 'opponent') {
                hints.push({
                    type: 'positioning',
                    priority: 'medium',
                    description: 'Gegner kontrolliert das Zentrum - versuchen Sie, zurückzuerobern.'
                });
            }
            
        } catch (error) {
            console.warn('⚠️ Hint generation failed:', error);
        }
        
        return hints;
    }

    /**
     * Analyze center control
     * @private
     */
    analyzeCenterControl(centerPositions) {
        try {
            let playerControl = 0;
            let opponentControl = 0;
            const currentPlayer = this.gameLogic.getCurrentPlayer();
            
            centerPositions.forEach(([row, col]) => {
                const piece = this.boardRenderer.getPieceAt(row, col);
                if (piece && piece.type === 'lpiece') {
                    if (piece.player === currentPlayer) {
                        playerControl++;
                    } else {
                        opponentControl++;
                    }
                }
            });
            
            return {
                player: playerControl,
                opponent: opponentControl,
                advantage: playerControl > opponentControl ? 'player' : 
                          opponentControl > playerControl ? 'opponent' : 'neutral'
            };
        } catch (error) {
            console.warn('⚠️ Center analysis failed:', error);
            return { advantage: 'neutral' };
        }
    }

    /**
     * Suggest best move for current player
     */
    async suggestBestMove() {
        try {
            const validMoves = this.gameLogic.getValidLMoves();
            if (!validMoves || validMoves.length === 0) {
                this.showAssistanceMessage('Keine gültigen Züge verfügbar!', 'error');
                return null;
            }

            // Simple move evaluation - prefer center positions and high mobility
            const bestMove = this.evaluateBestMove(validMoves);
            
            if (bestMove) {
                // Highlight suggested move
                this.boardRenderer.highlightValidMoves([[bestMove.row, bestMove.col]]);
                
                // Show suggestion message
                this.showAssistanceMessage(
                    `Vorgeschlagener Zug: Position (${bestMove.row + 1}, ${bestMove.col + 1}), Orientierung ${bestMove.orientation}`,
                    'suggestion'
                );
                
                console.log('🤖 Move suggestion:', bestMove);
                return bestMove;
            }
        } catch (error) {
            console.error('❌ Move suggestion failed:', error);
            this.showAssistanceMessage('Fehler beim Generieren der Zugempfehlung', 'error');
        }
        
        return null;
    }

    /**
     * Evaluate best move from valid moves
     * @private
     */
    evaluateBestMove(validMoves) {
        if (!validMoves.length) return null;
        
        // Simple evaluation: prefer center positions
        const centerPositions = [[1, 1], [1, 2], [2, 1], [2, 2]];
        
        let bestMove = validMoves[0];
        let bestScore = -1;
        
        validMoves.forEach(move => {
            let score = 0;
            
            // Bonus for center positions
            const distanceToCenter = centerPositions.reduce((minDist, center) => {
                const dist = Math.abs(move.row - center[0]) + Math.abs(move.col - center[1]);
                return Math.min(minDist, dist);
            }, Infinity);
            
            score += 5 - distanceToCenter; // Closer to center = higher score
            
            // Random factor for variety
            score += Math.random() * 2;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });
        
        return bestMove;
    }

    /**
     * Show assistance message to user
     * @private
     */
    showAssistanceMessage(message, type = 'info') {
        const infoElement = this.assistancePanel?.querySelector('#assistance-info');
        if (infoElement) {
            const iconMap = {
                'info': 'ℹ️',
                'suggestion': '🤖',
                'warning': '⚠️',
                'error': '❌'
            };
            
            infoElement.innerHTML = `${iconMap[type] || 'ℹ️'} ${message}`;
            infoElement.className = `mt-3 text-xs ${
                type === 'error' ? 'text-red-300' :
                type === 'warning' ? 'text-yellow-300' :
                type === 'suggestion' ? 'text-blue-300' :
                'text-gray-300'
            }`;
            
            // Auto-clear after 5 seconds
            setTimeout(() => {
                if (infoElement) {
                    infoElement.innerHTML = '';
                }
            }, 5000);
        }
    }

    /**
     * Update assistance information display
     * @private
     */
    updateAssistanceInfo() {
        const infoElement = this.assistancePanel?.querySelector('#assistance-info');
        if (!infoElement) return;

        let infoText = '';
        
        if (this.currentThreats.length > 0) {
            const threat = this.currentThreats[0];
            infoText += `⚠️ ${threat.description}`;
        } else if (this.currentHints.length > 0) {
            const hint = this.currentHints.find(h => h.priority === 'high') || this.currentHints[0];
            infoText += `💡 ${hint.description}`;
        }
        
        infoElement.innerHTML = infoText;
    }

    /**
     * Clear all assistance highlights
     */
    clearAssistance() {
        this.currentHints = [];
        this.currentThreats = [];
        this.suggestedMoves = [];
        
        if (this.boardRenderer) {
            this.boardRenderer.clearHighlights();
        }
    }

    /**
     * Enable/disable assistance
     */
    setAssistanceEnabled(enabled) {
        this.assistanceEnabled = enabled;
        if (!enabled) {
            this.clearAssistance();
        }
        
        if (this.assistancePanel) {
            this.assistancePanel.style.opacity = enabled ? '1' : '0.5';
        }
    }

    /**
     * Get assistance statistics
     */
    getAssistanceStats() {
        return {
            enabled: this.assistanceEnabled,
            showHints: this.showHints,
            showThreats: this.showThreats,
            showValidMoves: this.showValidMoves,
            currentHints: this.currentHints.length,
            currentThreats: this.currentThreats.length
        };
    }
}