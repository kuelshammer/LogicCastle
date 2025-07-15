/**
 * TrioUIBitPacked - Modern Trio UI using 3-Layer Architecture
 * 
 * Following Connect4's successful pattern:
 * - Layer 3: UI/Frontend -> TrioUIBitPacked (this file)
 * - Layer 2: Game Logic -> TrioGameBitPacked  
 * - Layer 1: WASM/Rust -> TrioGame + BitPackedBoard<7,7,4>
 * 
 * Features:
 * - Modern UI Module System integration
 * - BitPacked game logic for 49% memory efficiency
 * - Trio puzzle game: find a×b+c or a×b-c = target
 * - No AI needed - pure puzzle game
 * - Responsive glassmorphism design
 * - Keyboard shortcuts and accessibility
 */

import { BaseGameUI } from '../../../assets/js/ui-modules/index.js';
import { TRIO_UI_CONFIG } from './trio-config.js';
import { TrioGameBitPacked } from './TrioGameBitPacked.js';

export class TrioUIBitPacked extends BaseGameUI {
    constructor() {
        // Initialize with BitPacked game logic
        const game = new TrioGameBitPacked();
        super(game, TRIO_UI_CONFIG);
        
        // Trio-specific UI state
        this.selectedCells = [];
        this.currentTarget = 0;
        this.gameActive = false;
        this.solutionsFound = 0;
        this.totalMoves = 0;
        this.currentDifficulty = 'vollspektrum';
        
        // Animation and visual feedback
        this.animationEnabled = true;
        this.lastSelectedCell = null;
        this.highlightedCells = new Set();
        
        // Game mode (single player only for Trio)
        this.gameMode = 'puzzle';
        
        console.log('🎮 TrioUIBitPacked initialized with 3-layer architecture');
    }
    
    /**
     * Initialize the UI and game
     */
    async init() {
        try {
            console.log('🚀 Initializing TrioUIBitPacked...');
            
            // Initialize the game logic first
            await this.game.init();
            
            // Initialize the base UI system
            await super.init();
            
            // Setup Trio-specific UI
            this.setupTrioUI();
            this.setupGameCallbacks();
            
            // Initial render
            this.updateGameDisplay();
            
            console.log('✅ TrioUIBitPacked initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize TrioUIBitPacked:', error);
            this.showMessage('Fehler beim Initialisieren des Spiels', 'error');
            return false;
        }
    }
    
    /**
     * Setup Trio-specific UI elements
     */
    setupTrioUI() {
        this.createNumberGrid();
        this.setupCellClickHandlers();
        this.setupDifficultySelector();
        this.updateTargetDisplay();
        this.updateGameStats();
    }
    
    /**
     * Create the 7x7 number grid
     */
    createNumberGrid() {
        const gridElement = this.elements.numberGrid;
        if (!gridElement) {
            console.error('❌ numberGrid element not found');
            return;
        }
        
        // Clear existing grid
        gridElement.innerHTML = '';
        
        // Add CSS classes for styling
        gridElement.className = 'trio-number-grid';
        
        // Create 7x7 grid
        const board = this.game.getBoard();
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = this.createNumberCell(row, col, board[row][col]);
                gridElement.appendChild(cell);
            }
        }
        
        console.log('✅ 7x7 number grid created');
    }
    
    /**
     * Create individual number cell
     */
    createNumberCell(row, col, number) {
        const cell = document.createElement('div');
        cell.className = 'trio-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.textContent = number;
        
        // Add visual styling
        cell.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        `;
        
        // Add hover effects
        cell.addEventListener('mouseenter', () => {
            if (!this.isSelected(row, col)) {
                cell.style.background = 'rgba(255, 255, 255, 0.2)';
                cell.style.transform = 'scale(1.05)';
            }
        });
        
        cell.addEventListener('mouseleave', () => {
            if (!this.isSelected(row, col)) {
                cell.style.background = 'rgba(255, 255, 255, 0.1)';
                cell.style.transform = 'scale(1)';
            }
        });
        
        return cell;
    }
    
    /**
     * Setup click handlers for grid cells
     */
    setupCellClickHandlers() {
        const gridElement = this.elements.numberGrid;
        if (!gridElement) return;
        
        gridElement.addEventListener('click', (event) => {
            const cell = event.target.closest('.trio-cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.handleCellClick(row, col);
        });
    }
    
    /**
     * Handle cell click
     */
    handleCellClick(row, col) {
        if (!this.gameActive) {
            this.showMessage('Spiel nicht aktiv', 'info');
            return;
        }
        
        // Check if cell is already selected
        const selectedIndex = this.selectedCells.findIndex(pos => pos.row === row && pos.col === col);
        
        if (selectedIndex >= 0) {
            // Deselect cell
            this.selectedCells.splice(selectedIndex, 1);
            this.updateCellSelection(row, col, false);
            console.log(`🔄 Cell (${row}, ${col}) deselected`);
        } else {
            // Select cell (max 3 selections)
            if (this.selectedCells.length >= 3) {
                this.showMessage('Maximal 3 Zellen auswählen', 'warning');
                return;
            }
            
            this.selectedCells.push({ row, col });
            this.updateCellSelection(row, col, true);
            console.log(`✅ Cell (${row}, ${col}) selected`);
        }
        
        // Update UI
        this.updateSelectedDisplay();
        this.updateSubmitButton();
        
        // Auto-submit if 3 cells selected
        if (this.selectedCells.length === 3) {
            setTimeout(() => this.submitSolution(), 300);
        }
    }
    
    /**
     * Update cell selection visual feedback
     */
    updateCellSelection(row, col, selected) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        if (selected) {
            cell.style.background = 'rgba(34, 197, 94, 0.6)';
            cell.style.borderColor = 'rgba(34, 197, 94, 1)';
            cell.style.transform = 'scale(1.1)';
            cell.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.4)';
        } else {
            cell.style.background = 'rgba(255, 255, 255, 0.1)';
            cell.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            cell.style.transform = 'scale(1)';
            cell.style.boxShadow = 'none';
        }
    }
    
    /**
     * Check if cell is selected
     */
    isSelected(row, col) {
        return this.selectedCells.some(pos => pos.row === row && pos.col === col);
    }
    
    /**
     * Update selected display
     */
    updateSelectedDisplay() {
        const selectedDisplay = this.elements.selectedDisplay;
        if (!selectedDisplay) return;
        
        if (this.selectedCells.length === 0) {
            selectedDisplay.innerHTML = '<span class="text-gray-400">Keine Auswahl</span>';
            return;
        }
        
        const numbers = this.selectedCells.map(pos => this.game.getNumber(pos.row, pos.col));
        const positions = this.selectedCells.map(pos => `(${pos.row + 1}, ${pos.col + 1})`);
        
        selectedDisplay.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-white font-semibold">${numbers.join(' × ')}</span>
                <span class="text-gray-400">${positions.join(', ')}</span>
            </div>
        `;
        
        // Update individual number displays
        for (let i = 0; i < 3; i++) {
            const element = this.elements[`selected${i + 1}`];
            if (element) {
                element.textContent = i < numbers.length ? numbers[i] : '?';
            }
        }
        
        // Update calculated result if 3 selected
        if (this.selectedCells.length === 3) {
            this.updateCalculatedResult();
        }
    }
    
    /**
     * Update calculated result display
     */
    updateCalculatedResult() {
        const resultElement = this.elements.calculatedResult;
        if (!resultElement) return;
        
        if (this.selectedCells.length !== 3) {
            resultElement.textContent = '?';
            return;
        }
        
        const numbers = this.selectedCells.map(pos => this.game.getNumber(pos.row, pos.col));
        const [a, b, c] = numbers;
        
        const addResult = a * b + c;
        const subResult = a * b - c;
        const target = this.game.getTargetNumber();
        
        if (addResult === target) {
            resultElement.innerHTML = `<span class="text-green-400 font-bold">${addResult}</span>`;
        } else if (subResult === target) {
            resultElement.innerHTML = `<span class="text-green-400 font-bold">${subResult}</span>`;
        } else {
            resultElement.innerHTML = `<span class="text-red-400">${addResult}/${subResult}</span>`;
        }
    }
    
    /**
     * Update submit button state
     */
    updateSubmitButton() {
        const submitBtn = this.elements.submitSolutionBtn;
        if (!submitBtn) return;
        
        const canSubmit = this.selectedCells.length === 3;
        submitBtn.disabled = !canSubmit;
        submitBtn.classList.toggle('opacity-50', !canSubmit);
    }
    
    /**
     * Submit solution
     */
    submitSolution() {
        if (this.selectedCells.length !== 3) {
            this.showMessage('Bitte wählen Sie 3 Zellen aus', 'warning');
            return;
        }
        
        const success = this.game.submitTrio(this.selectedCells);
        
        if (success) {
            this.showMessage('Lösung gefunden! 🎉', 'success');
            this.highlightCorrectSolution();
            this.updateGameStats();
            
            // Clear selection after success
            setTimeout(() => {
                this.clearSelection();
            }, 2000);
        } else {
            this.showMessage('Nicht korrekt. Versuchen Sie es erneut.', 'error');
            this.animateIncorrectSolution();
        }
    }
    
    /**
     * Highlight correct solution
     */
    highlightCorrectSolution() {
        this.selectedCells.forEach(pos => {
            const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cell) {
                cell.style.background = 'rgba(34, 197, 94, 0.8)';
                cell.style.animation = 'pulse 0.5s ease-in-out 3';
            }
        });
    }
    
    /**
     * Animate incorrect solution
     */
    animateIncorrectSolution() {
        this.selectedCells.forEach(pos => {
            const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cell) {
                cell.style.background = 'rgba(239, 68, 68, 0.6)';
                cell.style.animation = 'shake 0.5s ease-in-out';
            }
        });
        
        // Reset colors after animation
        setTimeout(() => {
            this.selectedCells.forEach(pos => {
                this.updateCellSelection(pos.row, pos.col, true);
            });
        }, 500);
    }
    
    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedCells.forEach(pos => {
            this.updateCellSelection(pos.row, pos.col, false);
        });
        
        this.selectedCells = [];
        this.updateSelectedDisplay();
        this.updateSubmitButton();
    }
    
    /**
     * Setup game callbacks
     */
    setupGameCallbacks() {
        this.game.setCallback('onGameStateChange', (data) => {
            this.handleGameStateChange(data);
        });
        
        this.game.setCallback('onSolutionFound', (data) => {
            this.handleSolutionFound(data);
        });
        
        this.game.setCallback('onBoardGenerated', (data) => {
            this.handleBoardGenerated(data);
        });
        
        this.game.setCallback('onError', (data) => {
            this.handleGameError(data);
        });
    }
    
    /**
     * Handle game state changes
     */
    handleGameStateChange(data) {
        console.log('🎮 Game state changed:', data.type);
        
        switch (data.type) {
            case 'new_board':
                this.currentTarget = data.data.target;
                this.currentDifficulty = data.data.difficulty;
                this.clearSelection();
                this.createNumberGrid();
                this.updateTargetDisplay();
                this.updateGameStats();
                break;
                
            case 'solution_found':
                this.solutionsFound = this.game.getGameStats().solutionsFound;
                this.totalMoves = this.game.getGameStats().totalMoves;
                this.updateGameStats();
                break;
                
            case 'reset':
                this.clearSelection();
                this.updateGameStats();
                break;
        }
    }
    
    /**
     * Handle solution found
     */
    handleSolutionFound(data) {
        console.log('✅ Solution found:', data.validation.calculation);
        
        // Update solution history
        this.updateSolutionHistory();
        
        // Update statistics
        this.updateGameStats();
    }
    
    /**
     * Handle board generated
     */
    handleBoardGenerated(data) {
        console.log('🎲 Board generated:', data);
        
        this.currentTarget = data.target;
        this.currentDifficulty = data.difficulty;
        this.gameActive = true;
        
        this.createNumberGrid();
        this.updateTargetDisplay();
        this.updateGameStats();
        
        this.showMessage(`Neues Spiel: Ziel ${data.target}`, 'info');
    }
    
    /**
     * Handle game error
     */
    handleGameError(data) {
        console.error('❌ Game error:', data.error);
        this.showMessage(`Fehler: ${data.error}`, 'error');
    }
    
    /**
     * Update target display
     */
    updateTargetDisplay() {
        const targetElement = this.elements.targetNumber;
        if (targetElement) {
            targetElement.textContent = this.game.getTargetNumber();
        }
        
        const targetDisplay = this.elements.targetDisplay;
        if (targetDisplay) {
            targetDisplay.innerHTML = `
                <div class="text-center">
                    <div class="text-4xl font-bold text-white">${this.game.getTargetNumber()}</div>
                    <div class="text-sm text-gray-300">Ziel</div>
                </div>
            `;
        }
    }
    
    /**
     * Update game statistics
     */
    updateGameStats() {
        const stats = this.game.getGameStats();
        
        // Update counters
        if (this.elements.realizedCount) {
            this.elements.realizedCount.textContent = stats.solutionsFound;
        }
        
        if (this.elements.moveCounter) {
            this.elements.moveCounter.textContent = stats.totalMoves;
        }
        
        // Update game status
        this.updateGameStatus();
    }
    
    /**
     * Update game status
     */
    updateGameStatus() {
        const statusElement = this.elements.gameStatus;
        if (!statusElement) return;
        
        const stats = this.game.getGameStats();
        
        if (stats.solutionsFound > 0) {
            statusElement.textContent = `${stats.solutionsFound} Lösung${stats.solutionsFound === 1 ? '' : 'en'} gefunden`;
            statusElement.className = 'text-green-400 font-semibold';
        } else if (stats.totalMoves > 0) {
            statusElement.textContent = `${stats.totalMoves} Versuch${stats.totalMoves === 1 ? '' : 'e'}`;
            statusElement.className = 'text-yellow-400 font-semibold';
        } else {
            statusElement.textContent = 'Bereit zum Spielen';
            statusElement.className = 'text-white font-semibold';
        }
    }
    
    /**
     * Update solution history
     */
    updateSolutionHistory() {
        const historyElement = this.elements.solutionHistory;
        if (!historyElement) return;
        
        const history = this.game.getSolutionHistory();
        
        historyElement.innerHTML = '';
        
        history.forEach((solution, index) => {
            const item = document.createElement('div');
            item.className = 'solution-history-item p-2 border-b border-gray-600';
            item.innerHTML = `
                <div class="text-sm text-gray-300">#${index + 1}</div>
                <div class="text-white font-mono">${solution.calculation}</div>
                <div class="text-xs text-gray-400">Zug ${solution.moveNumber}</div>
            `;
            historyElement.appendChild(item);
        });
    }
    
    /**
     * Setup difficulty selector
     */
    setupDifficultySelector() {
        const selector = this.elements.gameMode;
        if (!selector) return;
        
        selector.innerHTML = `
            <option value="kinderfreundlich">Kinderfreundlich</option>
            <option value="vollspektrum" selected>Vollspektrum</option>
            <option value="strategisch">Strategisch</option>
            <option value="analytisch">Analytisch</option>
        `;
        
        selector.addEventListener('change', (e) => {
            this.changeDifficulty(e.target.value);
        });
    }
    
    /**
     * Change difficulty
     */
    changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.game.generateNewBoard(difficulty);
        this.showMessage(`Schwierigkeit: ${difficulty}`, 'info');
    }
    
    /**
     * Start new game
     */
    newGame() {
        this.game.generateNewBoard(this.currentDifficulty);
        this.showMessage('Neues Spiel gestartet', 'success');
    }
    
    /**
     * Show all solutions
     */
    showSolution() {
        const solutions = this.game.findAllSolutions();
        
        if (solutions.length === 0) {
            this.showMessage('Keine Lösungen gefunden', 'warning');
            return;
        }
        
        this.showMessage(`${solutions.length} Lösung${solutions.length === 1 ? '' : 'en'} gefunden`, 'info');
        
        // Highlight first solution
        const firstSolution = solutions[0];
        this.selectedCells = firstSolution.positions;
        this.updateSelectedDisplay();
        
        firstSolution.positions.forEach(pos => {
            this.updateCellSelection(pos.row, pos.col, true);
        });
    }
    
    /**
     * Update game display
     */
    updateGameDisplay() {
        this.updateTargetDisplay();
        this.updateGameStats();
        this.updateSelectedDisplay();
        this.updateSubmitButton();
    }
    
    /**
     * Show message to user
     */
    showMessage(text, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 transform translate-x-full`;
        
        // Set color based on type
        switch(type) {
            case 'success':
                toast.classList.add('bg-green-500');
                break;
            case 'error':
                toast.classList.add('bg-red-500');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500');
                break;
            default:
                toast.classList.add('bg-blue-500');
        }
        
        toast.textContent = text;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcut(action) {
        switch(action) {
            case 'newGame':
                this.newGame();
                break;
            case 'clearSelection':
                this.clearSelection();
                break;
            case 'submitSolution':
                this.submitSolution();
                break;
            case 'showSolution':
                this.showSolution();
                break;
            case 'startGame':
                this.newGame();
                break;
            case 'toggleHelp':
                this.toggleHelp();
                break;
            default:
                console.log(`🎹 Keyboard shortcut: ${action}`);
        }
    }
}