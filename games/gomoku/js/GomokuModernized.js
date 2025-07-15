/**
 * GomokuModernized - Hybrid system combining:
 * - Modern Glassmorphism UI (from index-new.html)
 * - BitPacked WASM Backend (from production system)
 * - Intersection-based placement (Gemini Report implementation)
 * - Connect4 API compatibility
 * - Victory animations with player-specific colors
 * 
 * Features:
 * - 2-Layer UI System (Visual + Interaction)
 * - BitPackedBoard<15,15,2> integration
 * - AI analysis and threat visualization
 * - Modern responsive design
 * - Spectacular victory animations
 */

import init, { GomokuGame } from '../../../game_engine/pkg/game_engine.js';

class GomokuModernized {
    constructor() {
        this.game = null;
        this.initialized = false;
        this.gameActive = false;
        this.aiThinking = false;
        
        // UI state
        this.boardSize = 15;
        this.visualStones = new Map(); // Track visual stones by position
        this.threatVisualization = false;
        
        // Star points (traditional Go/Gomoku board markers)
        this.starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Initializing GomokuModernized...');
            
            // Initialize WASM
            await init();
            
            // Create game instance
            this.game = new GomokuGame();
            this.initialized = true;
            this.gameActive = true;
            
            // Create UI
            this.createBoard();
            this.setupEventListeners();
            this.updateDisplay();
            
            console.log('✅ GomokuModernized initialized successfully');
            console.log(`📊 Memory usage: ${this.game.memory_usage()} bytes`);
            
        } catch (error) {
            console.error('❌ Failed to initialize GomokuModernized:', error);
            this.showMessage('Fehler beim Laden des Spiels', 'error');
        }
    }
    
    createBoard() {
        this.createGridLines();
        this.createIntersectionPoints();
        console.log('✅ 15x15 Gomoku board created with BitPacked backend');
    }
    
    createGridLines() {
        const gridLines = document.getElementById('gridLines');
        gridLines.innerHTML = '';
        
        // Create 15 horizontal lines at exact pixel positions
        for (let i = 0; i < 15; i++) {
            const hLine = document.createElement('div');
            hLine.className = 'grid-line-h';
            hLine.style.top = `${i * 30}px`; // 0, 30, 60, ..., 420px
            gridLines.appendChild(hLine);
        }
        
        // Create 15 vertical lines at exact pixel positions
        for (let i = 0; i < 15; i++) {
            const vLine = document.createElement('div');
            vLine.className = 'grid-line-v';
            vLine.style.left = `${i * 30}px`; // 0, 30, 60, ..., 420px
            gridLines.appendChild(vLine);
        }
    }
    
    createIntersectionPoints() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        // Create 15x15 intersection points - positioned exactly on line crossings
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = document.createElement('div');
                intersection.className = 'intersection';
                intersection.dataset.row = row;
                intersection.dataset.col = col;
                
                // Position exactly on line crossing
                intersection.style.left = `${col * 30}px`; // 0, 30, 60, ..., 420px
                intersection.style.top = `${row * 30}px`;   // 0, 30, 60, ..., 420px
                
                // Add star points (traditional Go/Gomoku markers)
                if (this.starPoints.some(([r, c]) => r === row && c === col)) {
                    const starPoint = document.createElement('div');
                    starPoint.className = 'star-point';
                    intersection.appendChild(starPoint);
                }
                
                // Add click handler
                intersection.addEventListener('click', () => this.handleCellClick(row, col));
                
                // Add hover effect for threat visualization
                intersection.addEventListener('mouseenter', () => this.showThreatLevel(row, col));
                intersection.addEventListener('mouseleave', () => this.hideThreatLevel(row, col));
                
                gameBoard.appendChild(intersection);
            }
        }
    }
    
    setupEventListeners() {
        // Game controls
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        document.getElementById('aiMoveBtn').addEventListener('click', () => this.makeAIMove());
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzePosition());
        
        // Victory overlay controls
        document.getElementById('victoryNewGameBtn').addEventListener('click', () => {
            this.hideVictoryOverlay();
            this.newGame();
        });
        
        // Close victory overlay on ESC or click
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVictoryOverlayVisible()) {
                this.hideVictoryOverlay();
            }
        });
        
        document.getElementById('victoryOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('victoryOverlay')) {
                this.hideVictoryOverlay();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'n':
                    this.newGame();
                    e.preventDefault();
                    break;
                case 'u':
                    this.undoMove();
                    e.preventDefault();
                    break;
                case 'a':
                    this.makeAIMove();
                    e.preventDefault();
                    break;
                case 'f1':
                    this.analyzePosition();
                    e.preventDefault();
                    break;
                case 't':
                    this.toggleThreatVisualization();
                    e.preventDefault();
                    break;
            }
        });
        
        console.log('✅ Event listeners set up');
    }
    
    handleCellClick(row, col) {
        if (!this.gameActive || this.aiThinking) {
            return;
        }
        
        if (!this.game.is_valid_move(row, col)) {
            this.showMessage('Ungültiger Zug', 'warning');
            return;
        }
        
        try {
            // Make move in WASM backend
            const won = this.game.make_move(row, col);
            
            // Update visual representation
            this.updateBoardFromBackend();
            
            if (won) {
                this.handleGameWin();
            } else {
                this.updateDisplay();
                this.updateAnalysis();
            }
            
        } catch (error) {
            console.error('❌ Move failed:', error);
            this.showMessage('Zug fehlgeschlagen', 'error');
        }
    }
    
    updateBoardFromBackend() {
        // Clear existing visual stones
        this.clearVisualStones();
        
        // Get board state from backend
        const board = this.game.get_board();
        
        // Recreate visual stones
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const cellValue = board[row * 15 + col];
                if (cellValue !== 0) {
                    this.placeVisualStone(row, col, cellValue);
                }
            }
        }
    }
    
    placeVisualStone(row, col, player) {
        const boardContainer = document.getElementById('boardContainer');
        if (!boardContainer) return;
        
        const stone = document.createElement('div');
        stone.className = `stone ${player === 1 ? 'stone-black' : 'stone-white'}`;
        stone.dataset.row = row;
        stone.dataset.col = col;
        
        // Position stone exactly on the line intersection
        stone.style.position = 'absolute';
        stone.style.left = `${30 + col * 30}px`;  // 30px padding + line position
        stone.style.top = `${30 + row * 30}px`;   // 30px padding + line position
        stone.style.zIndex = '10';
        
        boardContainer.appendChild(stone);
        
        // Store reference for cleanup
        this.visualStones.set(`${row},${col}`, stone);
    }
    
    clearVisualStones() {
        this.visualStones.forEach(stone => {
            if (stone.parentNode) {
                stone.parentNode.removeChild(stone);
            }
        });
        this.visualStones.clear();
    }
    
    makeAIMove() {
        if (!this.gameActive || this.aiThinking) {
            return;
        }
        
        this.aiThinking = true;
        this.showMessage('AI denkt...', 'info');
        
        // Add visual thinking indicator
        const aiIndicator = document.getElementById('currentPlayerIndicator');
        aiIndicator.classList.add('ai-thinking');
        
        // Simulate AI thinking time
        setTimeout(() => {
            try {
                const aiMove = this.game.get_ai_move();
                
                if (aiMove.length === 2) {
                    const [row, col] = aiMove;
                    this.handleCellClick(row, col);
                    this.showMessage(`AI zieht: (${row + 1}, ${col + 1})`, 'info');
                } else {
                    this.showMessage('AI konnte keinen Zug finden', 'warning');
                }
                
            } catch (error) {
                console.error('❌ AI move failed:', error);
                this.showMessage('AI-Fehler', 'error');
            }
            
            this.aiThinking = false;
            aiIndicator.classList.remove('ai-thinking');
        }, 800);
    }
    
    analyzePosition() {
        if (!this.gameActive) return;
        
        try {
            const analysis = this.game.analyze_position();
            console.log('📊 Position analysis:', analysis);
            
            // Update analysis display
            this.updateAnalysis();
            
            // Show analysis message
            const evaluation = this.game.evaluate_position();
            const message = evaluation > 0 ? 
                `Position: +${evaluation} (Vorteil)` : 
                evaluation < 0 ? 
                `Position: ${evaluation} (Nachteil)` : 
                'Position: Ausgeglichen';
            
            this.showMessage(message, 'info');
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            this.showMessage('Analyse fehlgeschlagen', 'error');
        }
    }
    
    updateAnalysis() {
        if (!this.initialized) return;
        
        try {
            // Get analysis data from backend
            const evaluation = this.game.evaluate_position();
            const winningMoves = this.game.get_winning_moves();
            const blockingMoves = this.game.get_blocking_moves();
            const threateningMoves = this.game.get_threatening_moves();
            
            // Update analysis display
            document.getElementById('positionEvaluation').textContent = evaluation;
            document.getElementById('threatCount').textContent = Math.floor(threateningMoves.length / 2);
            document.getElementById('winningMoves').textContent = Math.floor(winningMoves.length / 2);
            document.getElementById('blockingMoves').textContent = Math.floor(blockingMoves.length / 2);
            
        } catch (error) {
            console.error('❌ Analysis update failed:', error);
        }
    }
    
    showThreatLevel(row, col) {
        if (!this.threatVisualization || !this.gameActive) return;
        
        try {
            const currentPlayer = this.game.get_current_player();
            const threatLevel = this.game.get_threat_level(row, col, currentPlayer);
            
            if (threatLevel > 0) {
                const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                intersection.classList.add(`threat-level-${Math.min(threatLevel, 5)}`);
            }
        } catch (error) {
            // Silently ignore threat level errors
        }
    }
    
    hideThreatLevel(row, col) {
        const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        for (let i = 1; i <= 5; i++) {
            intersection.classList.remove(`threat-level-${i}`);
        }
    }
    
    toggleThreatVisualization() {
        this.threatVisualization = !this.threatVisualization;
        this.showMessage(
            `Bedrohungsvisualisierung: ${this.threatVisualization ? 'An' : 'Aus'}`, 
            'info'
        );
    }
    
    handleGameWin() {
        this.gameActive = false;
        
        const winner = this.game.get_winner();
        const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
        
        this.showMessage(`🎉 ${winnerName} gewinnt!`, 'success');
        this.updateDisplay();
        
        // Highlight winning stones (if available)
        this.highlightWinningStones();
        
        // Show victory animation after a short delay
        setTimeout(() => {
            this.showVictoryAnimation(winner);
        }, 1000);
        
        console.log(`🏆 Game Over! ${winnerName} wins in ${this.game.get_move_count()} moves`);
    }
    
    showVictoryAnimation(winner) {
        const overlay = document.getElementById('victoryOverlay');
        const background = document.getElementById('victoryBackground');
        const title = document.getElementById('victoryTitle');
        const stats = document.getElementById('victoryStats');
        const stones = document.querySelectorAll('.victory-stone');
        
        const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
        const moveCount = this.game.get_move_count();
        
        // Update content
        title.textContent = `🎉 ${winnerName} gewinnt! 🎉`;
        stats.textContent = `Gewonnen in ${moveCount} Zügen`;
        
        // Set background and text colors based on winner
        if (winner === 1) {
            // Black wins - dark background, light text
            background.className = 'victory-background-black';
            title.className = 'text-6xl font-bold mb-4 victory-text-white';
            stats.className = 'text-2xl mb-8 victory-text-white opacity-90';
            stones.forEach(stone => {
                stone.className = 'victory-stone victory-stone-black';
            });
        } else {
            // White wins - light background, dark text
            background.className = 'victory-background-white';
            title.className = 'text-6xl font-bold mb-4 victory-text-black';
            stats.className = 'text-2xl mb-8 victory-text-black opacity-90';
            stones.forEach(stone => {
                stone.className = 'victory-stone victory-stone-white';
            });
        }
        
        // Show overlay with animation
        overlay.classList.add('show');
        
        // Add confetti effect
        this.createConfetti();
        
        console.log(`🎊 Victory animation shown for ${winnerName}`);
    }
    
    createConfetti() {
        const overlay = document.getElementById('victoryOverlay');
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            // Random colors
            const colors = ['#fbbf24', '#f59e0b', '#10b981', '#059669', '#3b82f6', '#1d4ed8', '#8b5cf6', '#7c3aed'];
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            overlay.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 6000);
        }
    }
    
    isVictoryOverlayVisible() {
        return document.getElementById('victoryOverlay').classList.contains('show');
    }
    
    hideVictoryOverlay() {
        const overlay = document.getElementById('victoryOverlay');
        overlay.classList.remove('show');
        
        // Clean up confetti
        const confetti = overlay.querySelectorAll('.confetti');
        confetti.forEach(c => c.remove());
    }
    
    highlightWinningStones() {
        // Add winning animation to all stones of the winning player
        const winner = this.game.get_winner();
        if (winner) {
            this.visualStones.forEach(stone => {
                const isWinningStone = (winner === 1 && stone.classList.contains('stone-black')) ||
                                      (winner === 2 && stone.classList.contains('stone-white'));
                
                if (isWinningStone) {
                    stone.classList.add('winning-stone');
                }
            });
        }
    }
    
    undoMove() {
        if (!this.gameActive) {
            this.showMessage('Spiel ist beendet', 'info');
            return;
        }
        
        try {
            const success = this.game.undo_move();
            
            if (success) {
                this.updateBoardFromBackend();
                this.updateDisplay();
                this.updateAnalysis();
                this.showMessage('Zug rückgängig gemacht', 'info');
            } else {
                this.showMessage('Kann nicht rückgängig machen', 'warning');
            }
            
        } catch (error) {
            console.error('❌ Undo failed:', error);
            this.showMessage('Rückgängig fehlgeschlagen', 'error');
        }
    }
    
    newGame() {
        try {
            this.game.reset();
            this.gameActive = true;
            this.clearVisualStones();
            this.updateDisplay();
            this.updateAnalysis();
            
            // Clear winning highlights
            document.querySelectorAll('.winning-stone').forEach(stone => {
                stone.classList.remove('winning-stone');
            });
            
            // Hide victory overlay if visible
            if (this.isVictoryOverlayVisible()) {
                this.hideVictoryOverlay();
            }
            
            this.showMessage('Neues Spiel gestartet', 'success');
            console.log('🆕 New Gomoku game started');
            
        } catch (error) {
            console.error('❌ New game failed:', error);
            this.showMessage('Neues Spiel fehlgeschlagen', 'error');
        }
    }
    
    updateDisplay() {
        if (!this.initialized) return;
        
        try {
            const currentPlayer = this.game.get_current_player();
            const winner = this.game.get_winner();
            const moveCount = this.game.get_move_count();
            const gamePhase = this.game.get_game_phase();
            const memoryUsage = this.game.memory_usage();
            
            // Update current player indicator
            const playerStone = document.getElementById('currentPlayerStone');
            const playerText = document.getElementById('currentPlayerText');
            
            if (winner) {
                const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
                playerText.textContent = `${winnerName} hat gewonnen!`;
                playerStone.className = `w-6 h-6 rounded-full mr-3 ${winner === 1 ? 'stone-black' : 'stone-white'}`;
            } else {
                const playerName = currentPlayer === 1 ? 'Schwarz' : 'Weiß';
                playerStone.className = `w-6 h-6 rounded-full mr-3 ${currentPlayer === 1 ? 'stone-black' : 'stone-white'}`;
                playerText.textContent = `${playerName} ist am Zug`;
            }
            
            // Update game info
            document.getElementById('moveCounter').textContent = moveCount;
            document.getElementById('gamePhase').textContent = this.formatGamePhase(gamePhase);
            document.getElementById('memoryBytes').textContent = `${memoryUsage} Bytes`;
            
            // Update game status
            const gameStatus = document.getElementById('gameStatus');
            if (winner) {
                const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';
                gameStatus.textContent = `${winnerName} gewinnt!`;
                gameStatus.className = 'text-center font-semibold text-green-400';
            } else if (this.game.is_draw()) {
                gameStatus.textContent = 'Unentschieden';
                gameStatus.className = 'text-center font-semibold text-yellow-400';
            } else {
                gameStatus.textContent = 'Spiel läuft';
                gameStatus.className = 'text-center font-semibold';
            }
            
        } catch (error) {
            console.error('❌ Display update failed:', error);
        }
    }
    
    formatGamePhase(phase) {
        switch (phase) {
            case 0: return 'Eröffnung';
            case 1: return 'Mittelspiel';
            case 2: return 'Endspiel';
            default: return 'Unbekannt';
        }
    }
    
    showMessage(text, type = 'info') {
        // Create toast message
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
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gomokuModernized = new GomokuModernized();
});

// Export for testing
export { GomokuModernized };