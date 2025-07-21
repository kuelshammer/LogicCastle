/**
 * TrioAssistanceManager - Help and Assistance System for Trio
 * 
 * Adapted from Connect4/Gomoku AssistanceManager for Trio puzzle game.
 * Provides hints, tutorials, and guided assistance for players.
 * 
 * Features:
 * - Dynamic hint generation for finding valid trios
 * - Tutorial mode for new players
 * - Difficulty-based assistance levels
 * - Visual highlighting for hints
 * - Progress tracking and adaptive hints
 * - Accessibility support for assisted play
 */

export class TrioAssistanceManager {
    constructor(gameState, boardRenderer) {
        this.gameState = gameState;
        this.boardRenderer = boardRenderer;
        
        // Assistance configuration
        this.assistanceLevel = 'medium'; // none, low, medium, high, tutorial
        this.hintsEnabled = true;
        this.tutorialMode = false;
        this.autoHints = false;
        
        // Hint generation state
        this.availableHints = [];
        this.usedHints = new Set();
        this.hintCooldown = false;
        this.hintCooldownDuration = 3000; // 3 seconds between hints
        
        // Tutorial progress
        this.tutorialStep = 0;
        this.tutorialSteps = [
            'welcome',
            'board_overview', 
            'number_selection',
            'trio_validation',
            'strategies',
            'completion'
        ];
        
        // Assistance UI elements
        this.hintButton = null;
        this.tutorialOverlay = null;
        this.messageSystem = null;
        
        // Statistics tracking
        this.assistanceStats = {
            hintsRequested: 0,
            hintsUsed: 0,
            tutorialCompleted: false,
            firstPlaySession: true
        };
        
        // Initialize assistance system
        this.initializeAssistanceSystem();
        
        console.log('🆘 TrioAssistanceManager initialized');
    }

    /**
     * Initialize assistance system
     * @private
     */
    initializeAssistanceSystem() {
        // Create assistance UI
        this.createAssistanceUI();
        
        // Load user preferences
        this.loadAssistancePreferences();
        
        // Check if first-time player
        if (this.assistanceStats.firstPlaySession) {
            this.offerTutorial();
        }
    }

    /**
     * Create assistance UI elements
     * @private
     */
    createAssistanceUI() {
        // Create hint button
        this.createHintButton();
        
        // Create tutorial overlay
        this.createTutorialOverlay();
    }

    /**
     * Create hint button
     * @private
     */
    createHintButton() {
        this.hintButton = document.createElement('button');
        this.hintButton.id = 'trio-hint-button';
        this.hintButton.innerHTML = '💡 Tipp';
        
        // Styling with glassmorphism
        this.hintButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(59, 130, 246, 0.2);
            border: 2px solid rgba(59, 130, 246, 0.4);
            border-radius: 12px;
            backdrop-filter: blur(16px) saturate(180%);
            color: white;
            font-weight: 600;
            cursor: pointer;
            z-index: 500;
            transition: all 0.3s ease;
            font-family: system-ui, sans-serif;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        `;
        
        // Add hover effects
        this.hintButton.addEventListener('mouseenter', () => {
            this.hintButton.style.background = 'rgba(59, 130, 246, 0.3)';
            this.hintButton.style.transform = 'scale(1.05)';
        });
        
        this.hintButton.addEventListener('mouseleave', () => {
            this.hintButton.style.background = 'rgba(59, 130, 246, 0.2)';
            this.hintButton.style.transform = 'scale(1)';
        });
        
        // Add click handler
        this.hintButton.addEventListener('click', () => {
            this.requestHint();
        });
        
        document.body.appendChild(this.hintButton);
    }

    /**
     * Create tutorial overlay
     * @private
     */
    createTutorialOverlay() {
        this.tutorialOverlay = document.createElement('div');
        this.tutorialOverlay.id = 'trio-tutorial-overlay';
        this.tutorialOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            z-index: 1500;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        
        document.body.appendChild(this.tutorialOverlay);
    }

    /**
     * Request a hint for current board state
     */
    async requestHint() {
        if (!this.hintsEnabled || this.hintCooldown) {
            this.showMessage('Tipp-System ist momentan nicht verfügbar', 'warning');
            return;
        }
        
        console.log('💡 Hint requested');
        this.assistanceStats.hintsRequested++;
        
        try {
            // Start cooldown
            this.startHintCooldown();
            
            // Generate hint based on current board
            const hint = await this.generateHint();
            
            if (hint) {
                this.displayHint(hint);
                this.assistanceStats.hintsUsed++;
            } else {
                this.showMessage('Keine Tipps für diese Situation verfügbar', 'info');
            }
            
        } catch (error) {
            console.error('❌ Error generating hint:', error);
            this.showMessage('Fehler beim Generieren von Tipps', 'error');
        }
    }

    /**
     * Generate hint based on current game state
     * @private
     */
    async generateHint() {
        if (!this.gameState || !this.boardRenderer) {
            return null;
        }
        
        try {
            // Get current board state
            const currentBoard = this.boardRenderer.getCurrentBoard();
            if (!currentBoard) return null;
            
            // Find all possible trios on current board
            const allTrios = await this.findAllValidTrios(currentBoard);
            
            // Filter out already used hints
            const availableHints = allTrios.filter(trio => 
                !this.usedHints.has(this.getTrioSignature(trio.positions))
            );
            
            if (availableHints.length === 0) {
                return {
                    type: 'no_more_hints',
                    message: 'Alle verfügbaren Tipps wurden bereits verwendet',
                    suggestion: 'Versuche verschiedene Zahlenkombinationen systematisch'
                };
            }
            
            // Select hint based on assistance level
            const selectedHint = this.selectHintByDifficulty(availableHints);
            
            // Mark hint as used
            this.usedHints.add(this.getTrioSignature(selectedHint.positions));
            
            return selectedHint;
            
        } catch (error) {
            console.error('❌ Error in hint generation:', error);
            return null;
        }
    }

    /**
     * Find all valid trios on current board
     * @private
     */
    async findAllValidTrios(board) {
        const validTrios = [];
        
        // Check all possible 3-cell combinations
        for (let r1 = 0; r1 < 7; r1++) {
            for (let c1 = 0; c1 < 7; c1++) {
                for (let r2 = 0; r2 < 7; r2++) {
                    for (let c2 = 0; c2 < 7; c2++) {
                        for (let r3 = 0; r3 < 7; r3++) {
                            for (let c3 = 0; c3 < 7; c3++) {
                                // Skip duplicate positions
                                if (r1 === r2 && c1 === c2) continue;
                                if (r1 === r3 && c1 === c3) continue;
                                if (r2 === r3 && c2 === c3) continue;
                                
                                const positions = [
                                    { row: r1, col: c1 },
                                    { row: r2, col: c2 },
                                    { row: r3, col: c3 }
                                ];
                                
                                // Check if this forms a valid trio
                                const isValid = await this.gameState.validateTrio(positions);
                                if (isValid) {
                                    const numbers = positions.map(pos => board[pos.row][pos.col]);
                                    const sum = numbers.reduce((a, b) => a + b, 0);
                                    
                                    validTrios.push({
                                        positions,
                                        numbers,
                                        sum,
                                        calculation: `${numbers[0]} + ${numbers[1]} + ${numbers[2]} = ${sum}`,
                                        difficulty: this.calculateTrioDifficulty(positions, numbers)
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return validTrios;
    }

    /**
     * Calculate difficulty score for a trio
     * @private
     */
    calculateTrioDifficulty(positions, numbers) {
        let difficulty = 0;
        
        // Higher numbers are harder to find
        const avgNumber = numbers.reduce((a, b) => a + b, 0) / 3;
        difficulty += avgNumber / 49 * 30; // 0-30 points
        
        // Scattered positions are harder
        const distances = [];
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const dist = Math.abs(positions[i].row - positions[j].row) + 
                            Math.abs(positions[i].col - positions[j].col);
                distances.push(dist);
            }
        }
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        difficulty += avgDistance * 3; // 0-36 points (max distance 12)
        
        // Odd sums are slightly harder
        const sum = numbers.reduce((a, b) => a + b, 0);
        if (sum % 2 === 1) difficulty += 5;
        
        return Math.round(difficulty);
    }

    /**
     * Select hint based on assistance level
     * @private
     */
    selectHintByDifficulty(availableHints) {
        switch (this.assistanceLevel) {
            case 'tutorial':
            case 'high':
                // Show easiest hint first
                return availableHints.sort((a, b) => a.difficulty - b.difficulty)[0];
                
            case 'medium':
                // Show medium difficulty hint
                const sorted = availableHints.sort((a, b) => a.difficulty - b.difficulty);
                const midIndex = Math.floor(sorted.length / 2);
                return sorted[midIndex];
                
            case 'low':
                // Show harder hints
                return availableHints.sort((a, b) => b.difficulty - a.difficulty)[0];
                
            default:
                // Random hint
                return availableHints[Math.floor(Math.random() * availableHints.length)];
        }
    }

    /**
     * Display hint to user
     * @private
     */
    displayHint(hint) {
        if (!hint) return;
        
        const hintMessage = this.formatHintMessage(hint);
        
        // Show message
        this.showMessage(hintMessage.text, hintMessage.type, {
            calculation: hint.calculation,
            duration: 6000
        });
        
        // Highlight hint positions if available
        if (hint.positions && this.assistanceLevel !== 'low') {
            this.highlightHintPositions(hint.positions);
        }
        
        console.log(`💡 Hint displayed: ${hint.calculation}`);
    }

    /**
     * Format hint message based on assistance level
     * @private
     */
    formatHintMessage(hint) {
        switch (this.assistanceLevel) {
            case 'tutorial':
            case 'high':
                return {
                    text: `Probiere diese Kombination: Zellen bei ${hint.positions.map(p => `(${p.row+1},${p.col+1})`).join(', ')}`,
                    type: 'success'
                };
                
            case 'medium':
                return {
                    text: `Ein gültiges Trio ergibt ${hint.sum}. Suche nach Zahlen, die diese Summe ergeben!`,
                    type: 'info'
                };
                
            case 'low':
                return {
                    text: `Es gibt eine Lösung mit einer Summe zwischen ${hint.sum - 5} und ${hint.sum + 5}`,
                    type: 'info'
                };
                
            default:
                return {
                    text: 'Ein gültiges Trio ist auf dem Spielfeld versteckt',
                    type: 'info'
                };
        }
    }

    /**
     * Highlight hint positions on board
     * @private
     */
    highlightHintPositions(positions) {
        // Clear any existing hint highlights
        this.clearHintHighlights();
        
        // Add hint highlight to each position
        positions.forEach((pos, index) => {
            setTimeout(() => {
                const cell = this.boardRenderer.getCellAt(pos.row, pos.col);
                if (cell) {
                    cell.classList.add('trio-hint-highlight');
                    
                    // Add hint styling
                    cell.style.background = 'rgba(34, 197, 94, 0.2) !important';
                    cell.style.border = '2px dashed rgba(34, 197, 94, 0.6) !important';
                    cell.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.4) !important';
                }
            }, index * 300); // Staggered highlighting
        });
        
        // Remove highlights after delay
        setTimeout(() => {
            this.clearHintHighlights();
        }, 5000);
    }

    /**
     * Clear hint highlights
     */
    clearHintHighlights() {
        const highlightedCells = document.querySelectorAll('.trio-hint-highlight');
        highlightedCells.forEach(cell => {
            cell.classList.remove('trio-hint-highlight');
            
            // Restore original styling
            const number = parseInt(cell.textContent);
            if (!isNaN(number) && this.boardRenderer) {
                // Use board renderer to restore proper styling
                const theme = this.boardRenderer.getNumberTheme ? 
                    this.boardRenderer.getNumberTheme(number) : null;
                
                if (theme) {
                    cell.style.background = theme.background + ' !important';
                    cell.style.border = theme.border + ' !important';
                    cell.style.boxShadow = theme.glow + ' !important';
                }
            }
        });
    }

    /**
     * Start hint cooldown
     * @private
     */
    startHintCooldown() {
        this.hintCooldown = true;
        
        // Update button state
        if (this.hintButton) {
            this.hintButton.disabled = true;
            this.hintButton.innerHTML = '⏱️ Warten...';
            this.hintButton.style.opacity = '0.5';
        }
        
        // Clear cooldown after duration
        setTimeout(() => {
            this.hintCooldown = false;
            
            if (this.hintButton) {
                this.hintButton.disabled = false;
                this.hintButton.innerHTML = '💡 Tipp';
                this.hintButton.style.opacity = '1';
            }
        }, this.hintCooldownDuration);
    }

    /**
     * Get unique signature for trio positions
     * @private
     */
    getTrioSignature(positions) {
        // Sort positions to ensure consistent signature
        const sorted = [...positions].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });
        
        return sorted.map(p => `${p.row}-${p.col}`).join(',');
    }

    /**
     * Set assistance level
     */
    setAssistanceLevel(level) {
        const validLevels = ['none', 'low', 'medium', 'high', 'tutorial'];
        if (!validLevels.includes(level)) return;
        
        this.assistanceLevel = level;
        
        // Update hint button visibility
        if (this.hintButton) {
            this.hintButton.style.display = level === 'none' ? 'none' : 'block';
        }
        
        console.log(`🆘 Assistance level set to: ${level}`);
    }

    /**
     * Enable/disable hints
     */
    setHintsEnabled(enabled) {
        this.hintsEnabled = enabled;
        
        if (this.hintButton) {
            this.hintButton.style.display = enabled ? 'block' : 'none';
        }
        
        console.log(`💡 Hints ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Start tutorial mode
     */
    startTutorial() {
        this.tutorialMode = true;
        this.tutorialStep = 0;
        this.setAssistanceLevel('tutorial');
        
        this.showTutorialStep();
        
        console.log('🎓 Tutorial mode started');
    }

    /**
     * Show current tutorial step
     * @private
     */
    showTutorialStep() {
        const step = this.tutorialSteps[this.tutorialStep];
        const tutorials = this.getTutorialContent();
        
        if (!tutorials[step]) return;
        
        const content = tutorials[step];
        this.showMessage(content.message, 'info', { duration: 8000 });
        
        if (content.highlight) {
            this.highlightHintPositions(content.highlight);
        }
    }

    /**
     * Get tutorial content
     * @private
     */
    getTutorialContent() {
        return {
            welcome: {
                message: 'Willkommen bei Trio! Wähle 3 Zellen aus, deren Zahlen sich zu einer bestimmten Summe addieren.',
            },
            board_overview: {
                message: 'Das 7×7 Spielfeld enthält Zahlen von 1-49. Verschiedene Farben helfen bei der Orientierung.',
            },
            number_selection: {
                message: 'Klicke auf 3 Zellen, um sie auszuwählen. Die Auswahl wird farblich hervorgehoben.',
            },
            trio_validation: {
                message: 'Nach der Auswahl von 3 Zellen wird automatisch geprüft, ob sie ein gültiges Trio bilden.',
            },
            strategies: {
                message: 'Tipp: Beginne mit kleineren Zahlen und arbeite systematisch. Nutze die Farbcodierung!',
            },
            completion: {
                message: 'Tutorial abgeschlossen! Viel Spaß beim Spielen. Du kannst jederzeit Tipps anfordern.',
            }
        };
    }

    /**
     * Set message system for user feedback
     */
    setMessageSystem(messageSystem) {
        this.messageSystem = messageSystem;
        console.log('💬 Message system connected to assistance manager');
    }

    /**
     * Show message to user
     * @private
     */
    showMessage(text, type = 'info', options = {}) {
        if (this.messageSystem) {
            this.messageSystem.show(text, type, options);
        } else {
            // Fallback to console
            console.log(`💬 ${type.toUpperCase()}: ${text}`);
        }
    }

    /**
     * Offer tutorial to new players
     * @private
     */
    offerTutorial() {
        if (this.messageSystem) {
            this.messageSystem.show(
                'Neu bei Trio? Möchtest du das Tutorial starten?',
                'info',
                {
                    duration: 10000,
                    persistent: false
                }
            );
        }
    }

    /**
     * Load assistance preferences
     * @private
     */
    loadAssistancePreferences() {
        try {
            const saved = localStorage.getItem('trio-assistance-prefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.assistanceLevel = prefs.assistanceLevel || 'medium';
                this.hintsEnabled = prefs.hintsEnabled !== false;
                this.assistanceStats = { ...this.assistanceStats, ...prefs.stats };
            }
        } catch (error) {
            console.warn('⚠️ Could not load assistance preferences');
        }
    }

    /**
     * Save assistance preferences
     */
    saveAssistancePreferences() {
        try {
            const prefs = {
                assistanceLevel: this.assistanceLevel,
                hintsEnabled: this.hintsEnabled,
                stats: this.assistanceStats
            };
            localStorage.setItem('trio-assistance-prefs', JSON.stringify(prefs));
        } catch (error) {
            console.warn('⚠️ Could not save assistance preferences');
        }
    }

    /**
     * Get assistance statistics
     */
    getAssistanceStats() {
        return {
            ...this.assistanceStats,
            assistanceLevel: this.assistanceLevel,
            hintsEnabled: this.hintsEnabled,
            tutorialMode: this.tutorialMode,
            availableHints: this.availableHints.length,
            usedHints: this.usedHints.size
        };
    }

    /**
     * Reset assistance state for new game
     */
    reset() {
        this.clearHintHighlights();
        this.usedHints.clear();
        this.availableHints = [];
        this.hintCooldown = false;
        
        // Reset button state
        if (this.hintButton) {
            this.hintButton.disabled = false;
            this.hintButton.innerHTML = '💡 Tipp';
            this.hintButton.style.opacity = '1';
        }
        
        console.log('🔄 Assistance manager reset');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Save preferences
        this.saveAssistancePreferences();
        
        // Remove UI elements
        if (this.hintButton && this.hintButton.parentNode) {
            this.hintButton.parentNode.removeChild(this.hintButton);
        }
        
        if (this.tutorialOverlay && this.tutorialOverlay.parentNode) {
            this.tutorialOverlay.parentNode.removeChild(this.tutorialOverlay);
        }
        
        // Clear highlights
        this.clearHintHighlights();
        
        // Clear references
        this.gameState = null;
        this.boardRenderer = null;
        this.messageSystem = null;
        
        console.log('🆘 TrioAssistanceManager destroyed');
    }
}

export default TrioAssistanceManager;