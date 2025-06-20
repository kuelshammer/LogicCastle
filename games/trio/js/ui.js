/**
 * TrioUI - User Interface controller for Trio mathematical game
 */
class TrioUI {
    constructor(game) {
        this.game = game;
        this.selectedPositions = [];
        this.currentPlayerId = null;
        this.gameMode = 'single';
        this.ai = null;

        // DOM elements (will be bound in init)
        this.elements = {};

        // Bind methods
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleStartGame = this.handleStartGame.bind(this);
        this.handleNewRound = this.handleNewRound.bind(this);
        this.handleSubmitSolution = this.handleSubmitSolution.bind(this);
        this.handleClearSelection = this.handleClearSelection.bind(this);
        this.handleShowSolution = this.handleShowSolution.bind(this);
        this.handleNewGame = this.handleNewGame.bind(this);
        this.handleHelp = this.handleHelp.bind(this);
        this.handleGameModeChange = this.handleGameModeChange.bind(this);
        this.handleAddPlayer = this.handleAddPlayer.bind(this);
        this.handleStartWithPlayers = this.handleStartWithPlayers.bind(this);
    }

    /**
     * Initialize the UI
     */
    init() {
        this.bindElements();
        this.attachEventListeners();
        this.setupGameEventListeners();
        this.createNumberGrid();
        this.updateUI();

        // Set initial player for single player mode
        this.currentPlayerId = 'player1';
        this.game.addPlayer('player1', 'Spieler 1');
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        console.log('Binding DOM elements...');
        this.elements = {
            // Game board
            numberGrid: document.getElementById('numberGrid'),

            // Target display
            targetDisplay: document.getElementById('targetDisplay'),
            targetNumber: document.getElementById('targetNumber'),
            targetAnalysis: document.getElementById('targetAnalysis'),
            realizedCount: document.getElementById('realizedCount'),
            theoreticalCount: document.getElementById('theoreticalCount'),

            // Controls
            startGameBtn: document.getElementById('startGameBtn'),
            newRoundBtn: document.getElementById('newRoundBtn'),
            showSolutionBtn: document.getElementById('showSolutionBtn'),
            newGameBtn: document.getElementById('newGameBtn'),

            // Player setup
            playerSetup: document.getElementById('playerSetup'),
            playerNameInput: document.getElementById('playerNameInput'),
            addPlayerBtn: document.getElementById('addPlayerBtn'),
            playersList: document.getElementById('playersList'),
            startWithPlayersBtn: document.getElementById('startWithPlayersBtn'),

            // Solution panel
            selectedDisplay: document.getElementById('selectedDisplay'),
            selected1: document.getElementById('selected1'),
            selected2: document.getElementById('selected2'),
            selected3: document.getElementById('selected3'),
            operatorSign: document.getElementById('operatorSign'),
            calculatedResult: document.getElementById('calculatedResult'),
            submitSolutionBtn: document.getElementById('submitSolutionBtn'),
            clearSelectionBtn: document.getElementById('clearSelectionBtn'),

            // Game info
            gameStatus: document.getElementById('gameStatus'),
            chipsRemaining: document.getElementById('chipsRemaining'),
            scoresList: document.getElementById('scoresList'),
            solutionHistory: document.getElementById('solutionHistory'),
            historyList: document.getElementById('historyList'),

            // Modal and help
            helpModal: document.getElementById('helpModal'),
            helpBtn: document.getElementById('helpBtn'),
            closeHelpBtn: document.getElementById('closeHelpBtn'),

            // Game mode
            gameMode: document.getElementById('gameMode')
        };

        // Debug: Check if critical elements were found
        console.log('numberGrid element:', this.elements.numberGrid);
        console.log('targetNumber element:', this.elements.targetNumber);

        if (!this.elements.numberGrid) {
            console.error('CRITICAL: numberGrid element not found!');
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Game controls
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.addEventListener('click', this.handleStartGame);
        }

        if (this.elements.newRoundBtn) {
            this.elements.newRoundBtn.addEventListener('click', this.handleNewRound);
        }

        if (this.elements.showSolutionBtn) {
            this.elements.showSolutionBtn.addEventListener('click', this.handleShowSolution);
        }

        if (this.elements.newGameBtn) {
            this.elements.newGameBtn.addEventListener('click', this.handleNewGame);
        }

        // Solution controls
        if (this.elements.submitSolutionBtn) {
            this.elements.submitSolutionBtn.addEventListener('click', this.handleSubmitSolution);
        }

        if (this.elements.clearSelectionBtn) {
            this.elements.clearSelectionBtn.addEventListener('click', this.handleClearSelection);
        }

        // Player setup (optional elements)
        if (this.elements.addPlayerBtn) {
            this.elements.addPlayerBtn.addEventListener('click', this.handleAddPlayer);
        }

        if (this.elements.startWithPlayersBtn) {
            this.elements.startWithPlayersBtn.addEventListener('click', this.handleStartWithPlayers);
        }

        if (this.elements.playerNameInput) {
            this.elements.playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddPlayer();
                }
            });
        }

        // Help and modal
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', this.handleHelp);
        }

        if (this.elements.closeHelpBtn) {
            this.elements.closeHelpBtn.addEventListener('click', this.handleHelp);
        }

        if (this.elements.helpModal) {
            this.elements.helpModal.addEventListener('click', (e) => {
                if (e.target === this.elements.helpModal) {
                    this.handleHelp();
                }
            });
        }

        // Game mode
        if (this.elements.gameMode) {
            this.elements.gameMode.addEventListener('change', this.handleGameModeChange);
        }

        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyPress);
    }

    /**
     * Setup game event listeners
     */
    setupGameEventListeners() {
        this.game.on('newRound', (data) => this.onNewRound(data));
        this.game.on('solutionFound', (data) => this.onSolutionFound(data));
        this.game.on('gameEnded', (data) => this.onGameEnded(data));
        this.game.on('playerAdded', (data) => this.onPlayerAdded(data));
        this.game.on('gameReset', () => this.onGameReset());
    }

    /**
     * Create the 7x7 number grid
     */
    createNumberGrid() {
        if (!this.elements.numberGrid) {
            console.warn('Number grid element not found');
            return;
        }

        this.elements.numberGrid.innerHTML = '';

        // Ensure game has a number grid
        if (!this.game.numberGrid || this.game.numberGrid.length === 0) {
            console.log('Generating number grid...');
            try {
                this.game.generateNumberGrid();
            } catch (error) {
                console.error('Error generating number grid:', error);
                return;
            }
        }

        for (let row = 0; row < this.game.ROWS; row++) {
            for (let col = 0; col < this.game.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'number-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const number = this.game.getNumberAt(row, col);
                if (number !== null) {
                    cell.textContent = number;
                } else {
                    cell.textContent = '?';
                    console.warn(`No number found at position ${row},${col}`);
                }

                cell.addEventListener('click', () => this.handleCellClick(row, col));

                this.elements.numberGrid.appendChild(cell);
            }
        }

        console.log(`Created ${this.game.ROWS}x${this.game.COLS} number grid with ${this.elements.numberGrid.children.length} cells`);
    }

    /**
     * Handle cell click in number grid
     */
    handleCellClick(row, col) {
        if (!this.game.currentTarget) {
            this.showMessage('Starte zuerst eine Runde!', 'warning');
            return;
        }

        const position = { row, col };
        const positionExists = this.selectedPositions.some(pos =>
            pos.row === row && pos.col === col
        );

        if (positionExists) {
            // Remove from selection
            this.selectedPositions = this.selectedPositions.filter(pos =>
                !(pos.row === row && pos.col === col)
            );
        } else {
            // Add to selection (max 3)
            if (this.selectedPositions.length < 3) {
                this.selectedPositions.push(position);
            } else {
                this.showMessage('Du kannst maximal 3 Zahlen auswählen!', 'warning');
                return;
            }
        }

        this.updateGridSelection();
        this.updateSelectedDisplay();
    }

    /**
     * Update visual selection in grid
     */
    updateGridSelection() {
        // Clear all selections
        this.elements.numberGrid.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.remove('selected', 'selected-1', 'selected-2', 'selected-3');
        });

        // Apply selections with order indicators
        this.selectedPositions.forEach((pos, index) => {
            const cell = this.elements.numberGrid.querySelector(
                `[data-row="${pos.row}"][data-col="${pos.col}"]`
            );
            if (cell) {
                cell.classList.add('selected', `selected-${index + 1}`);
            }
        });
    }

    /**
     * Update the selected numbers display
     */
    updateSelectedDisplay() {
        const numbers = this.selectedPositions.map(pos =>
            this.game.getNumberAt(pos.row, pos.col)
        );

        // Update display
        this.elements.selected1.textContent = numbers[0] || '?';
        this.elements.selected2.textContent = numbers[1] || '?';
        this.elements.selected3.textContent = numbers[2] || '?';

        // Calculate result if we have all 3 numbers
        if (numbers.length === 3) {
            const [a, b, c] = numbers;
            const solution = this.game.validateSolution(a, b, c, this.game.currentTarget);

            if (solution.isValid) {
                this.elements.calculatedResult.textContent = this.game.currentTarget;
                this.elements.calculatedResult.className = 'result valid';
                this.elements.operatorSign.textContent = solution.operation === 'multiplication_addition' ? '+' : '-';
                this.elements.submitSolutionBtn.disabled = false;
            } else {
                this.elements.calculatedResult.textContent = '✗';
                this.elements.calculatedResult.className = 'result invalid';
                this.elements.operatorSign.textContent = '±';
                this.elements.submitSolutionBtn.disabled = true;
            }
        } else {
            this.elements.calculatedResult.textContent = '?';
            this.elements.calculatedResult.className = 'result';
            this.elements.operatorSign.textContent = '±';
            this.elements.submitSolutionBtn.disabled = true;
        }
    }

    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        switch (e.key) {
            case 'F1':
                e.preventDefault();
                this.handleHelp();
                break;
            case 'Enter':
                if (!this.elements.submitSolutionBtn.disabled) {
                    this.handleSubmitSolution();
                }
                break;
            case 'Escape':
                this.handleClearSelection();
                break;
            case ' ':
                e.preventDefault();
                if (this.game.currentTarget && this.selectedPositions.length === 0) {
                    this.handleNewRound();
                }
                break;
        }
    }

    /**
     * Handle start game button
     */
    handleStartGame() {
        this.startGame();
    }

    /**
     * Start the actual game (single player only)
     */
    startGame() {
        this.elements.startGameBtn.disabled = true;
        this.elements.newRoundBtn.disabled = false;
        this.elements.showSolutionBtn.disabled = false;

        this.updateGameStatus(`Spiel gestartet! Schwierigkeit: ${this.game.difficulty.toUpperCase()}. Klicke "Nächste Runde" für die erste Aufgabe.`);
        this.updateUI();
    }

    /**
     * Handle new round button
     */
    handleNewRound() {
        const started = this.game.startNewRound();
        if (!started) {
            this.updateGameStatus('Keine Chips mehr übrig! Spiel beendet.');
        }
    }

    /**
     * Handle submit solution
     */
    handleSubmitSolution() {
        if (this.selectedPositions.length !== 3) {
            this.showMessage('Wähle genau 3 Zahlen aus!', 'error');
            return;
        }

        const result = this.game.submitSolution(this.currentPlayerId, this.selectedPositions);

        if (result.success) {
            this.showMessage(`Richtig! ${result.solution.formula}`, 'success');
            this.handleClearSelection();
            this.addToHistory(result.solution, this.selectedPositions);
        } else {
            this.showMessage(`Falsch! ${result.attempted?.attempted || 'Keine gültige Lösung'}`, 'error');
        }
    }

    /**
     * Handle clear selection
     */
    handleClearSelection() {
        this.selectedPositions = [];
        this.updateGridSelection();
        this.updateSelectedDisplay();
    }

    /**
     * Handle show solution
     */
    handleShowSolution() {
        if (!this.game.currentTarget) {
            this.showMessage('Keine aktive Runde!', 'warning');
            return;
        }

        const solutions = this.game.findAllSolutions(this.game.currentTarget);
        if (solutions.length > 0) {
            this.displayAllSolutions(solutions);
            this.showMessage(`${solutions.length} Lösung(en) für Zielzahl ${this.game.currentTarget} gefunden!`, 'info');
        } else {
            this.showMessage('Keine Lösung für diese Zielzahl gefunden!', 'warning');
        }
    }

    /**
     * Display all solutions for current target
     */
    displayAllSolutions(solutions) {
        if (!this.elements.solutionHistory || !this.elements.historyList) {
            console.warn('Solution history elements not found');
            return;
        }

        // Clear existing solutions
        this.elements.historyList.innerHTML = '';

        // Create header with solution count and target
        const header = document.createElement('div');
        header.className = 'solutions-header';
        header.innerHTML = `
            <h3>Alle Lösungen für Zielzahl ${this.game.currentTarget}</h3>
            <p>${solutions.length} Lösung(en) gefunden:</p>
            <button class="btn btn-outline close-solutions-btn">Lösungen schließen</button>
        `;

        // Add close button functionality
        const closeBtn = header.querySelector('.close-solutions-btn');
        closeBtn.addEventListener('click', () => {
            this.elements.solutionHistory.style.display = 'none';
        });

        this.elements.historyList.appendChild(header);

        // Group solutions by formula, keeping all positions
        const groupedSolutions = this.groupSolutionsByFormula(solutions);

        // Add statistics
        const statsDiv = document.createElement('div');
        statsDiv.className = 'solution-stats';
        statsDiv.innerHTML = `
            <p><strong>${groupedSolutions.length}</strong> einzigartige Formeln, 
            <strong>${solutions.length}</strong> verschiedene Positionen insgesamt</p>
        `;
        this.elements.historyList.appendChild(statsDiv);

        // Display each grouped solution
        groupedSolutions.forEach((group, index) => {
            const solutionItem = document.createElement('div');
            solutionItem.className = 'solution-item';

            // Create position text for all positions of this formula
            const allPositionsText = group.positions.map(posArray =>
                posArray.map(pos => `(${pos.row + 1},${pos.col + 1})`).join(',')
            ).join(' | ');

            solutionItem.innerHTML = `
                <div class="solution-formula">${group.formula}</div>
                <div class="solution-details">
                    <span class="solution-numbers">Zahlen: ${group.numbers.join(', ')}</span>
                    <span class="solution-count">${group.positions.length} Position(en) verfügbar</span>
                    <div class="solution-positions">
                        <details>
                            <summary>Alle Positionen anzeigen</summary>
                            <div class="positions-list">${allPositionsText}</div>
                        </details>
                    </div>
                </div>
                <div class="solution-buttons">
                    <button class="btn btn-small show-solution-btn" data-solution-index="${index}">
                        Alle zeigen
                    </button>
                    <button class="btn btn-small show-first-btn" data-solution-index="${index}">
                        Erste zeigen
                    </button>
                </div>
            `;

            // Add show all button functionality
            const showAllBtn = solutionItem.querySelector('.show-solution-btn');
            showAllBtn.addEventListener('click', () => {
                this.highlightAllPositions(group);
            });

            // Add show first button functionality
            const showFirstBtn = solutionItem.querySelector('.show-first-btn');
            showFirstBtn.addEventListener('click', () => {
                this.highlightSolution(group.allSolutions[0]);
            });

            this.elements.historyList.appendChild(solutionItem);
        });

        // Show the solution history
        this.elements.solutionHistory.style.display = 'block';

        // Scroll to solutions
        this.elements.solutionHistory.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }

    /**
     * Group solutions by formula, keeping all positions for each formula
     */
    groupSolutionsByFormula(solutions) {
        const groupedSolutions = new Map();

        solutions.forEach(sol => {
            const formula = sol.solution.formula;
            if (!groupedSolutions.has(formula)) {
                groupedSolutions.set(formula, {
                    formula: formula,
                    operation: sol.solution.operation,
                    numbers: sol.numbers,
                    positions: [],
                    allSolutions: []
                });
            }

            groupedSolutions.get(formula).positions.push(sol.positions);
            groupedSolutions.get(formula).allSolutions.push(sol);
        });

        return Array.from(groupedSolutions.values());
    }

    /**
     * Highlight a specific solution on the grid
     */
    highlightSolution(solution) {
        // Clear current selection
        this.handleClearSelection();

        // Set new selection
        this.selectedPositions = solution.positions;
        this.updateGridSelection();
        this.updateSelectedDisplay();

        // Clear selection after 3 seconds
        setTimeout(() => {
            this.handleClearSelection();
        }, 3000);

        // Show brief message
        this.showMessage(`Lösung markiert: ${solution.solution.formula}`, 'info');
    }

    /**
     * Highlight all positions for a formula group
     */
    highlightAllPositions(group) {
        // Clear current selection
        this.handleClearSelection();

        // Clear existing highlights
        this.elements.numberGrid.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.remove('multiple-solution', 'solution-1', 'solution-2', 'solution-3', 'solution-4', 'solution-5');
        });

        // Highlight all positions with different colors/styles
        group.positions.forEach((positionSet, setIndex) => {
            const colorClass = `solution-${(setIndex % 5) + 1}`;

            positionSet.forEach(pos => {
                const cell = this.elements.numberGrid.querySelector(
                    `[data-row="${pos.row}"][data-col="${pos.col}"]`
                );
                if (cell) {
                    cell.classList.add('multiple-solution', colorClass);
                }
            });
        });

        // Show message with count
        this.showMessage(`${group.positions.length} Positionen für "${group.formula}" markiert`, 'info');

        // Clear highlights after 5 seconds
        setTimeout(() => {
            this.elements.numberGrid.querySelectorAll('.number-cell').forEach(cell => {
                cell.classList.remove('multiple-solution', 'solution-1', 'solution-2', 'solution-3', 'solution-4', 'solution-5');
            });
        }, 5000);
    }

    /**
     * Handle new game
     */
    handleNewGame() {
        this.game.initializeGame();
        this.currentPlayerId = 'player1';
        this.game.addPlayer('player1', 'Spieler 1');

        this.elements.startGameBtn.disabled = false;
        this.elements.newRoundBtn.disabled = true;
        this.elements.showSolutionBtn.disabled = true;
        this.elements.playerSetup.style.display = 'none';

        this.createNumberGrid();
        this.handleClearSelection();
        this.updateGameStatus('Bereit für ein neues Spiel!');
        this.updateUI();
    }

    /**
     * Handle help modal
     */
    handleHelp() {
        this.elements.helpModal.classList.toggle('active');
    }

    /**
     * Handle game mode change
     */
    handleGameModeChange() {
        const newDifficulty = this.elements.gameMode.value;
        console.log('Difficulty changed to:', newDifficulty);

        // Update game difficulty
        this.game.difficulty = newDifficulty;

        // Regenerate target chips with new difficulty
        this.game.generateTargetChips();

        // Reset game state
        this.game.resetGameState();

        // Update UI
        this.updateUI();
        this.updateGameStatus('Neue Schwierigkeit gewählt! Klicke "Spiel starten".');
    }

    /**
     * Handle add player
     */
    handleAddPlayer() {
        const name = this.elements.playerNameInput.value.trim();
        if (!name) {
            this.showMessage('Bitte gib einen Spielernamen ein!', 'warning');
            return;
        }

        if (this.game.players.length >= 6) {
            this.showMessage('Maximal 6 Spieler erlaubt!', 'warning');
            return;
        }

        const playerId = `player${this.game.players.length + 1}`;
        this.game.addPlayer(playerId, name);
        this.elements.playerNameInput.value = '';
        this.elements.playerNameInput.focus();

        if (this.game.players.length >= 2) {
            this.elements.startWithPlayersBtn.disabled = false;
        }
    }

    /**
     * Handle start with players
     */
    handleStartWithPlayers() {
        this.elements.playerSetup.style.display = 'none';
        this.currentPlayerId = this.game.players[0].id;
        this.startGame();
    }

    /**
     * Game event handlers
     */
    onNewRound(data) {
        this.elements.targetNumber.textContent = data.target;
        this.updateGameStatus(`Neue Runde! Finde eine Lösung für: ${data.target}`);
        this.handleClearSelection();

        // Show analysis for strategic and analytical modes
        if (this.game.difficulty === 'strategisch' || this.game.difficulty === 'analytisch') {
            const analysis = this.game.calculateDifficultyRatio(data.target);
            this.elements.realizedCount.textContent = analysis.realizedCount;
            this.elements.theoreticalCount.textContent = analysis.theoreticalCount;
            this.elements.targetAnalysis.style.display = 'block';
            console.log(`Target ${data.target} analysis:`, analysis);
        } else {
            this.elements.targetAnalysis.style.display = 'none';
        }

        this.updateUI();
    }

    onSolutionFound(data) {
        this.updateGameStatus(`${this.getPlayerName(data.playerId)} hat die Lösung gefunden: ${data.solution.formula}`);
        this.updateUI();
    }

    onGameEnded(data) {
        const winnerName = data.winner ? this.getPlayerName(data.winner.id) : 'Niemand';
        this.updateGameStatus(`Spiel beendet! Gewinner: ${winnerName}`);
        this.elements.newRoundBtn.disabled = true;
        this.elements.showSolutionBtn.disabled = true;
    }

    onPlayerAdded(player) {
        this.updatePlayersList();
    }

    onGameReset() {
        this.updateUI();
    }

    /**
     * Update UI elements
     */
    updateUI() {
        this.updateChipsRemaining();
        this.updateScores();
    }

    updateChipsRemaining() {
        if (this.elements.chipsRemaining) {
            this.elements.chipsRemaining.textContent = this.game.targetChips.length;
        }
    }

    updateScores() {
        if (this.elements.scoresList) {
            this.elements.scoresList.innerHTML = '';

            this.game.players.forEach(player => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'score-item';
                scoreItem.innerHTML = `
                    <span class="player-name">${player.name}:</span>
                    <span class="chip-count">${this.game.scores[player.id] || 0} 🏆</span>
                `;
                this.elements.scoresList.appendChild(scoreItem);
            });
        }
    }

    updatePlayersList() {
        this.elements.playersList.innerHTML = '';

        this.game.players.forEach((player, index) => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <span>${index + 1}. ${player.name}</span>
                <button class="btn btn-small remove-player" data-player-id="${player.id}">×</button>
            `;
            this.elements.playersList.appendChild(playerItem);
        });

        // Add remove functionality
        this.elements.playersList.querySelectorAll('.remove-player').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerId = e.target.dataset.playerId;
                this.removePlayer(playerId);
            });
        });
    }

    removePlayer(playerId) {
        this.game.players = this.game.players.filter(p => p.id !== playerId);
        delete this.game.scores[playerId];
        this.updatePlayersList();

        if (this.game.players.length < 2) {
            this.elements.startWithPlayersBtn.disabled = true;
        }
    }

    updateGameStatus(message) {
        this.elements.gameStatus.textContent = message;
    }

    addToHistory(solution, positions) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span class="solution-formula">${solution.formula}</span>
            <span class="solution-player">${this.getPlayerName(this.currentPlayerId)}</span>
        `;

        this.elements.historyList.appendChild(historyItem);
        this.elements.solutionHistory.style.display = 'block';
    }

    getPlayerName(playerId) {
        const player = this.game.players.find(p => p.id === playerId);
        return player ? player.name : 'Unbekannt';
    }

    showMessage(message, type = 'info') {
        // Create temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;

        // Style the message
        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '1000',
            maxWidth: '300px',
            animation: 'slideInRight 0.3s ease'
        });

        // Set color based on type
        const colors = {
            info: '#3498db',
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
}
