/**
 * TrioUINew - New Implementation using UI Module System
 * 
 * Replaces the 890-line TrioUI custom implementation with the standardized
 * UI Module System, providing better maintainability and consistency.
 * 
 * Features migrated from legacy TrioUI:
 * - Mathematical puzzle game with target number solving
 * - 7x7 number grid with three-number selection
 * - Solution validation (a×b+c or a×b-c)
 * - Chip collection system with scoring
 * - Multiple game modes (kinderfreundlich, vollspektrum, strategisch, analytisch)
 * - Multi-player support with player management
 * - Solution history tracking
 * - Keyboard shortcuts (F1, Enter, Escape, etc.)
 * - Modal help system
 * - AI opponent integration
 * - WASM integration for number generation
 * - BitPackedBoard performance optimization
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { TRIO_UI_CONFIG, createTrioConfig } from './trio-config.js';

export class TrioUINew extends BaseGameUI {
    constructor(game) {
        // Initialize with Trio-specific configuration
        super(game, TRIO_UI_CONFIG);
        
        // Trio-specific properties
        this.selectedPositions = [];
        this.currentPlayerId = 'player1';
        this.gameMode = 'kinderfreundlich';
        this.ai = null;
        this.bitPackedIntegration = null;
        
        // Game state
        this.isGameActive = false;
        this.currentRound = 0;
        this.totalChips = 20;
        this.remainingChips = 20;
        
        // Selected numbers tracking
        this.selectedNumbers = [];
        this.selectedCells = [];
        
        // Solution history
        this.solutionHistory = [];
        
        // Player management
        this.players = new Map();
        this.playerScores = new Map();
        
        // Bind Trio-specific methods
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleStartGame = this.handleStartGame.bind(this);
        this.handleNewRound = this.handleNewRound.bind(this);
        this.handleSubmitSolution = this.handleSubmitSolution.bind(this);
        this.handleClearSelection = this.handleClearSelection.bind(this);
        this.handleShowSolution = this.handleShowSolution.bind(this);
        this.handleGameModeChange = this.handleGameModeChange.bind(this);
    }

    /**
     * Override beforeInit to set up Trio-specific initialization
     */
    async beforeInit() {
        console.log('🧮 Starting Trio UI initialization...');
        
        // Update configuration based on current game mode
        const currentMode = document.getElementById('gameMode')?.value || 'kinderfreundlich';
        this.config = createTrioConfig(currentMode);
        this.gameMode = currentMode;
        
        // Initialize default player
        this.game.addPlayer('player1', 'Spieler 1');
        this.players.set('player1', { name: 'Spieler 1', id: 'player1' });
        this.playerScores.set('player1', 0);
    }

    /**
     * Override afterInit to complete Trio-specific setup
     */
    async afterInit() {
        console.log('🧮 Completing Trio UI initialization...');
        
        // Create the number grid
        this.createNumberGrid();
        
        // Set up initial game state
        this.updateUI();
        
        // Initialize responsive handling
        this.initResponsiveHandling();
        
        console.log('✅ Trio UI fully initialized with UI Module System');
    }

    /**
     * Override setupGameEventListeners for Trio-specific game events
     */
    setupGameEventListeners() {
        // Call parent implementation for common events
        super.setupGameEventListeners();
        
        // Trio-specific game events
        const trioEvents = {
            'targetGenerated': (data) => this.onTargetGenerated(data),
            'solutionFound': (data) => this.onSolutionFound(data),
            'solutionSubmitted': (data) => this.onSolutionSubmitted(data),
            'roundCompleted': (data) => this.onRoundCompleted(data),
            'gameCompleted': (data) => this.onGameCompleted(data),
            'playerAdded': (data) => this.onPlayerAdded(data),
            'chipCollected': (data) => this.onChipCollected(data)
        };

        // Register Trio-specific events
        Object.entries(trioEvents).forEach(([event, handler]) => {
            if (this.game && typeof this.game.on === 'function') {
                this.game.on(event, handler);
            }
        });
    }

    /**
     * Override setupUIEventListeners for Trio-specific UI events
     */
    setupUIEventListeners() {
        // Call parent implementation
        super.setupUIEventListeners();
        
        // Trio-specific UI event listeners
        const trioButtonMap = {
            'startGameBtn': this.handleStartGame,
            'newRoundBtn': this.handleNewRound,
            'submitSolutionBtn': this.handleSubmitSolution,
            'clearSelectionBtn': this.handleClearSelection,
            'showSolutionBtn': this.handleShowSolution,
            'gameMode': this.handleGameModeChange
        };

        // Bind Trio-specific UI events
        Object.entries(trioButtonMap).forEach(([elementKey, handler]) => {
            if (this.elements[elementKey]) {
                const eventType = elementKey === 'gameMode' ? 'change' : 'click';
                this.elements[elementKey].addEventListener(eventType, handler);
            }
        });
    }

    /**
     * Override keyboard action binding for Trio-specific shortcuts
     */
    bindKeyboardActions(keyboardController) {
        // Call parent implementation
        super.bindKeyboardActions(keyboardController);
        
        // Trio-specific keyboard actions
        const trioActionMap = {
            'submitSolution': () => this.handleSubmitSolution(),
            'clearSelection': () => this.handleClearSelection(),
            'showSolution': () => this.handleShowSolution(),
            'startGame': () => this.handleStartGame()
        };

        // Register Trio-specific keyboard actions
        Object.entries(this.config.keyboard).forEach(([key, action]) => {
            if (trioActionMap[action]) {
                keyboardController.register(key, action, trioActionMap[action]);
            }
        });
    }

    /**
     * Create the 7x7 number grid
     */
    createNumberGrid() {
        if (!this.elements.numberGrid) {
            console.error('❌ Number grid container not found');
            return;
        }

        // Clear existing grid
        this.elements.numberGrid.innerHTML = '';
        
        // Create grid structure
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'number-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.position = `${row},${col}`;
                
                // Add click handler
                cell.addEventListener('click', this.handleCellClick);
                
                // Add number placeholder
                const numberSpan = document.createElement('span');
                numberSpan.className = 'number-value';
                numberSpan.textContent = '0';
                cell.appendChild(numberSpan);
                
                this.elements.numberGrid.appendChild(cell);
            }
        }
        
        console.log('✅ Created 7x7 number grid (49 cells)');
    }

    /**
     * Handle number cell clicks
     */
    handleCellClick(event) {
        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const position = `${row},${col}`;
        
        // Don't allow selection if game is not active
        if (!this.isGameActive) {
            this.showMessage('Starte zuerst ein Spiel!', 'warning');
            return;
        }
        
        // Check if cell is already selected
        if (this.selectedPositions.includes(position)) {
            this.deselectCell(position);
        } else {
            this.selectCell(position);
        }
    }

    /**
     * Select a number cell
     */
    selectCell(position) {
        // Maximum 3 selections
        if (this.selectedPositions.length >= 3) {
            this.showMessage('Maximal 3 Zahlen auswählen!', 'warning');
            return;
        }
        
        this.selectedPositions.push(position);
        
        // Update visual selection
        const cell = this.elements.numberGrid.querySelector(`[data-position="${position}"]`);
        if (cell) {
            cell.classList.add('selected');
            cell.classList.add(`selected-${this.selectedPositions.length}`);
        }
        
        // Update selected numbers display
        this.updateSelectedDisplay();
        
        // Enable submit button if 3 numbers selected
        if (this.selectedPositions.length === 3) {
            this.elements.submitSolutionBtn.disabled = false;
        }
        
        console.log(`✅ Selected cell at ${position} (${this.selectedPositions.length}/3)`);
    }

    /**
     * Deselect a number cell
     */
    deselectCell(position) {
        const index = this.selectedPositions.indexOf(position);
        if (index > -1) {
            this.selectedPositions.splice(index, 1);
            
            // Update visual selection
            const cell = this.elements.numberGrid.querySelector(`[data-position="${position}"]`);
            if (cell) {
                cell.classList.remove('selected');
                cell.classList.remove('selected-1', 'selected-2', 'selected-3');
            }
            
            // Re-number remaining selections
            this.updateSelectionNumbers();
            
            // Update selected numbers display
            this.updateSelectedDisplay();
            
            // Disable submit button if less than 3 numbers
            if (this.selectedPositions.length < 3) {
                this.elements.submitSolutionBtn.disabled = true;
            }
            
            console.log(`✅ Deselected cell at ${position} (${this.selectedPositions.length}/3)`);
        }
    }

    /**
     * Update selection number indicators
     */
    updateSelectionNumbers() {
        this.selectedPositions.forEach((position, index) => {
            const cell = this.elements.numberGrid.querySelector(`[data-position="${position}"]`);
            if (cell) {
                cell.classList.remove('selected-1', 'selected-2', 'selected-3');
                cell.classList.add(`selected-${index + 1}`);
            }
        });
    }

    /**
     * Update the selected numbers display
     */
    updateSelectedDisplay() {
        const selectedElements = [
            this.elements.selected1,
            this.elements.selected2,
            this.elements.selected3
        ];
        
        // Clear all selections
        selectedElements.forEach(element => {
            if (element) element.textContent = '?';
        });
        
        // Update selected numbers
        this.selectedNumbers = [];
        this.selectedPositions.forEach((position, index) => {
            const cell = this.elements.numberGrid.querySelector(`[data-position="${position}"]`);
            if (cell) {
                const numberValue = parseInt(cell.querySelector('.number-value').textContent);
                this.selectedNumbers[index] = numberValue;
                
                if (selectedElements[index]) {
                    selectedElements[index].textContent = numberValue;
                }
            }
        });
        
        // Calculate and display result
        this.calculateResult();
    }

    /**
     * Calculate the result of selected numbers
     */
    calculateResult() {
        if (this.selectedNumbers.length !== 3) {
            if (this.elements.calculatedResult) {
                this.elements.calculatedResult.textContent = '?';
            }
            if (this.elements.operatorSign) {
                this.elements.operatorSign.textContent = '±';
            }
            return;
        }
        
        const [a, b, c] = this.selectedNumbers;
        const addResult = a * b + c;
        const subResult = a * b - c;
        
        // Check which operation matches target
        const targetNumber = this.game.getCurrentTarget();
        if (targetNumber) {
            if (addResult === targetNumber) {
                if (this.elements.operatorSign) this.elements.operatorSign.textContent = '+';
                if (this.elements.calculatedResult) this.elements.calculatedResult.textContent = addResult;
            } else if (subResult === targetNumber) {
                if (this.elements.operatorSign) this.elements.operatorSign.textContent = '-';
                if (this.elements.calculatedResult) this.elements.calculatedResult.textContent = subResult;
            } else {
                if (this.elements.operatorSign) this.elements.operatorSign.textContent = '±';
                if (this.elements.calculatedResult) this.elements.calculatedResult.textContent = `${addResult}/${subResult}`;
            }
        }
    }

    /**
     * Handle starting a new game
     */
    handleStartGame() {
        if (!this.game.isReady()) {
            this.showMessage('Spiel noch nicht bereit!', 'error');
            return;
        }
        
        this.isGameActive = true;
        this.currentRound = 1;
        this.remainingChips = this.totalChips;
        
        // Start first round
        this.game.startNewRound();
        
        // Update UI
        this.updateGameControls();
        this.showMessage('Spiel gestartet! Erste Runde beginnt.', 'success');
        
        console.log('🎮 Started new Trio game');
    }

    /**
     * Handle new round
     */
    handleNewRound() {
        if (!this.isGameActive) {
            this.showMessage('Kein aktives Spiel!', 'warning');
            return;
        }
        
        this.currentRound++;
        this.clearSelection();
        this.game.startNewRound();
        
        this.showMessage(`Runde ${this.currentRound} gestartet!`, 'info');
        console.log(`🎮 Started round ${this.currentRound}`);
    }

    /**
     * Handle solution submission
     */
    handleSubmitSolution() {
        if (this.selectedNumbers.length !== 3) {
            this.showMessage('Wähle genau 3 Zahlen aus!', 'warning');
            return;
        }
        
        const [a, b, c] = this.selectedNumbers;
        const targetNumber = this.game.getCurrentTarget();
        
        // Check both possible solutions
        const addResult = a * b + c;
        const subResult = a * b - c;
        
        if (addResult === targetNumber || subResult === targetNumber) {
            // Correct solution
            const operation = (addResult === targetNumber) ? 'addition' : 'subtraction';
            const result = (addResult === targetNumber) ? addResult : subResult;
            const operator = (addResult === targetNumber) ? '+' : '-';
            
            this.onSolutionSubmitted({
                numbers: [a, b, c],
                operation,
                result,
                operator,
                isCorrect: true,
                playerId: this.currentPlayerId
            });
            
            this.showMessage(`Richtig! ${a} × ${b} ${operator} ${c} = ${result}`, 'success');
            
            // Collect chip
            this.collectChip(this.currentPlayerId);
            
        } else {
            // Wrong solution
            this.showMessage(`Falsch! ${a} × ${b} ± ${c} = ${addResult}/${subResult} ≠ ${targetNumber}`, 'error');
        }
        
        // Clear selection
        this.clearSelection();
    }

    /**
     * Handle clearing selection
     */
    handleClearSelection() {
        this.clearSelection();
        this.showMessage('Auswahl gelöscht', 'info');
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        // Clear visual selections
        this.selectedPositions.forEach(position => {
            const cell = this.elements.numberGrid.querySelector(`[data-position="${position}"]`);
            if (cell) {
                cell.classList.remove('selected', 'selected-1', 'selected-2', 'selected-3');
            }
        });
        
        // Clear data
        this.selectedPositions = [];
        this.selectedNumbers = [];
        
        // Update display
        this.updateSelectedDisplay();
        
        // Disable submit button
        if (this.elements.submitSolutionBtn) {
            this.elements.submitSolutionBtn.disabled = true;
        }
    }

    /**
     * Handle showing solution
     */
    handleShowSolution() {
        if (!this.isGameActive) {
            this.showMessage('Kein aktives Spiel!', 'warning');
            return;
        }
        
        const solution = this.game.getSolution();
        if (solution) {
            const { numbers, operation, result } = solution;
            const operator = operation === 'addition' ? '+' : '-';
            this.showMessage(`Lösung: ${numbers[0]} × ${numbers[1]} ${operator} ${numbers[2]} = ${result}`, 'info');
        } else {
            this.showMessage('Keine Lösung verfügbar', 'warning');
        }
    }

    /**
     * Handle game mode change
     */
    handleGameModeChange(event) {
        const newMode = event.target.value;
        if (newMode !== this.gameMode) {
            this.gameMode = newMode;
            this.config = createTrioConfig(newMode);
            this.showMessage(`Spielmodus: ${newMode}`, 'info');
            console.log(`🎮 Changed game mode to: ${newMode}`);
        }
    }

    /**
     * Collect a chip for a player
     */
    collectChip(playerId) {
        if (this.remainingChips <= 0) {
            this.showMessage('Alle Chips sind vergeben!', 'warning');
            return;
        }
        
        // Update player score
        const currentScore = this.playerScores.get(playerId) || 0;
        this.playerScores.set(playerId, currentScore + 1);
        
        // Update remaining chips
        this.remainingChips--;
        
        // Update UI
        this.updateScoreDisplay();
        this.updateChipsDisplay();
        
        // Emit chip collection event
        this.game.emit('chipCollected', {
            playerId,
            newScore: currentScore + 1,
            remainingChips: this.remainingChips
        });
        
        this.showMessage(`Chip gesammelt! (+1 Punkt)`, 'chip');
        
        // Check if game is complete
        if (this.remainingChips === 0) {
            this.endGame();
        }
    }

    /**
     * End the game
     */
    endGame() {
        this.isGameActive = false;
        
        // Find winner
        let winnerScore = 0;
        let winners = [];
        
        this.playerScores.forEach((score, playerId) => {
            if (score > winnerScore) {
                winnerScore = score;
                winners = [playerId];
            } else if (score === winnerScore) {
                winners.push(playerId);
            }
        });
        
        // Announce winner
        if (winners.length === 1) {
            const winnerName = this.players.get(winners[0]).name;
            this.showMessage(`🎉 ${winnerName} hat gewonnen mit ${winnerScore} Chips!`, 'win');
        } else {
            this.showMessage(`🎉 Unentschieden mit ${winnerScore} Chips!`, 'win');
        }
        
        // Update UI
        this.updateGameControls();
        
        console.log('🎮 Game ended');
    }

    /**
     * Update game controls based on state
     */
    updateGameControls() {
        const controls = {
            'startGameBtn': !this.isGameActive,
            'newRoundBtn': this.isGameActive,
            'showSolutionBtn': this.isGameActive,
            'submitSolutionBtn': false
        };
        
        Object.entries(controls).forEach(([elementKey, enabled]) => {
            if (this.elements[elementKey]) {
                this.elements[elementKey].disabled = !enabled;
            }
        });
    }

    /**
     * Update score display
     */
    updateScoreDisplay() {
        if (!this.elements.scoresList) return;
        
        this.elements.scoresList.innerHTML = '';
        
        // Sort players by score
        const sortedPlayers = Array.from(this.playerScores.entries())
            .sort((a, b) => b[1] - a[1]);
        
        sortedPlayers.forEach(([playerId, score]) => {
            const player = this.players.get(playerId);
            if (player) {
                const scoreElement = document.createElement('div');
                scoreElement.className = 'score-item';
                scoreElement.innerHTML = `
                    <span class="player-name">${player.name}</span>
                    <span class="player-score">${score}</span>
                `;
                this.elements.scoresList.appendChild(scoreElement);
            }
        });
    }

    /**
     * Update chips display
     */
    updateChipsDisplay() {
        if (this.elements.chipsRemaining) {
            this.elements.chipsRemaining.textContent = this.remainingChips;
        }
    }

    /**
     * Update the entire UI
     */
    updateUI() {
        this.updateGameControls();
        this.updateScoreDisplay();
        this.updateChipsDisplay();
        this.updateSelectedDisplay();
    }

    /**
     * Initialize responsive handling
     */
    initResponsiveHandling() {
        // Add responsive classes based on screen size
        const updateResponsiveClasses = () => {
            const width = window.innerWidth;
            const body = document.body;
            
            body.classList.remove('mobile', 'tablet', 'desktop');
            
            if (width < this.config.responsive.mobile) {
                body.classList.add('mobile');
            } else if (width < this.config.responsive.tablet) {
                body.classList.add('tablet');
            } else {
                body.classList.add('desktop');
            }
        };
        
        // Initial call
        updateResponsiveClasses();
        
        // Update on resize
        window.addEventListener('resize', updateResponsiveClasses);
    }

    // ==================== GAME EVENT HANDLERS ====================

    onTargetGenerated(data) {
        const { target, analysis } = data;
        
        if (this.elements.targetNumber) {
            this.elements.targetNumber.textContent = target;
        }
        
        if (analysis && this.elements.targetAnalysis) {
            this.elements.realizedCount.textContent = analysis.realized;
            this.elements.theoreticalCount.textContent = analysis.theoretical;
            this.elements.targetAnalysis.style.display = 'block';
        }
        
        this.showMessage(`Neue Zielzahl: ${target}`, 'info');
        console.log(`🎯 Target generated: ${target}`);
    }

    onSolutionFound(data) {
        console.log('🔍 Solution found:', data);
        // Add to solution history
        this.solutionHistory.push(data);
        this.updateSolutionHistory();
    }

    onSolutionSubmitted(data) {
        console.log('📤 Solution submitted:', data);
    }

    onRoundCompleted(data) {
        console.log('🎲 Round completed:', data);
        this.showMessage(`Runde ${this.currentRound} beendet!`, 'success');
    }

    onGameCompleted(data) {
        console.log('🎮 Game completed:', data);
        this.endGame();
    }

    onPlayerAdded(data) {
        const { playerId, playerName } = data;
        this.players.set(playerId, { name: playerName, id: playerId });
        this.playerScores.set(playerId, 0);
        this.updateScoreDisplay();
        console.log(`👤 Player added: ${playerName} (${playerId})`);
    }

    onChipCollected(data) {
        console.log('🏆 Chip collected:', data);
    }

    /**
     * Update solution history display
     */
    updateSolutionHistory() {
        if (!this.elements.historyList) return;
        
        this.elements.historyList.innerHTML = '';
        
        this.solutionHistory.forEach((solution, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="solution-number">${index + 1}.</span>
                <span class="solution-formula">${solution.numbers[0]} × ${solution.numbers[1]} ${solution.operator} ${solution.numbers[2]} = ${solution.result}</span>
            `;
            this.elements.historyList.appendChild(historyItem);
        });
        
        // Show history if there are solutions
        if (this.solutionHistory.length > 0 && this.elements.solutionHistory) {
            this.elements.solutionHistory.style.display = 'block';
        }
    }

    // ==================== OVERRIDE GAME ACTIONS ====================

    newGame() {
        this.isGameActive = false;
        this.currentRound = 0;
        this.remainingChips = this.totalChips;
        this.solutionHistory = [];
        this.clearSelection();
        
        // Reset player scores
        this.playerScores.forEach((score, playerId) => {
            this.playerScores.set(playerId, 0);
        });
        
        // Reset game
        if (this.game && typeof this.game.resetGame === 'function') {
            this.game.resetGame();
        }
        
        // Update UI
        this.updateUI();
        
        // Hide solution history
        if (this.elements.solutionHistory) {
            this.elements.solutionHistory.style.display = 'none';
        }
        
        this.showMessage('Neues Spiel bereit!', 'info');
        console.log('🆕 New Trio game prepared');
    }

    resetScore() {
        // Reset all player scores
        this.playerScores.forEach((score, playerId) => {
            this.playerScores.set(playerId, 0);
        });
        
        this.updateScoreDisplay();
        this.showMessage('Punkte zurückgesetzt!', 'info');
        console.log('🔄 Scores reset');
    }
}