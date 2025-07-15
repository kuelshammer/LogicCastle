/**
 * Modern Gomoku Game with Glassmorphism Design
 * Features: Intersection-based placement, proper player switching, beautiful animations
 */

class ModernGomoku {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1 = Black, 2 = White
        this.gameOver = false;
        this.moveCount = 0;
        this.gameMode = 'two-player';
        this.scores = { black: 0, white: 0 };
        this.gameHistory = [];
        
        // Star points (traditional Go/Gomoku board markers)
        this.starPoints = [
            [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
        ];
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.updateDisplay();
        console.log('🎯 Modern Gomoku initialized with glassmorphism design');
    }
    
    createBoard() {
        this.createGridLines();
        this.createIntersectionPoints();
        console.log('✅ 15x15 Gomoku board created with true intersection-based placement');
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
                
                gameBoard.appendChild(intersection);
            }
        }
    }
    
    setupEventListeners() {
        // Game controls
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        document.getElementById('gameMode').addEventListener('change', (e) => this.setGameMode(e.target.value));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'n':
                    this.newGame();
                    e.preventDefault();
                    break;
                case 'u':
                    this.undoMove();
                    e.preventDefault();
                    break;
                case 'f1':
                    this.showHint();
                    e.preventDefault();
                    break;
            }
        });
        
        console.log('✅ Event listeners set up');
    }
    
    handleCellClick(row, col) {
        if (this.gameOver || this.board[row][col] !== 0) {
            return;
        }
        
        this.makeMove(row, col);
    }
    
    makeMove(row, col) {
        // Place stone
        this.board[row][col] = this.currentPlayer;
        this.moveCount++;
        
        // Add to history for undo
        this.gameHistory.push({
            row, col, 
            player: this.currentPlayer,
            moveNumber: this.moveCount
        });
        
        // Create visual stone
        this.placeStone(row, col, this.currentPlayer);
        
        // Check for win
        if (this.checkWin(row, col)) {
            this.handleGameWin();
            return;
        }
        
        // Switch players
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateDisplay();
        
        console.log(`🎯 Move ${this.moveCount}: Player ${this.currentPlayer === 2 ? 1 : 2} placed stone at (${row}, ${col})`);
        
        // AI move in single player mode
        if (this.gameMode === 'single-player' && this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }
    
    placeStone(row, col, player) {
        const boardContainer = document.getElementById('boardContainer');
        if (!boardContainer) return;
        
        const stone = document.createElement('div');
        stone.className = `stone ${player === 1 ? 'stone-black' : 'stone-white'}`;
        stone.dataset.row = row;
        stone.dataset.col = col;
        
        // Position stone exactly on the line intersection
        // Account for 30px padding + exact line positions
        stone.style.position = 'absolute';
        stone.style.left = `${30 + col * 30}px`;  // 30px padding + line position
        stone.style.top = `${30 + row * 30}px`;   // 30px padding + line position
        stone.style.transform = 'translate(-50%, -50%)';
        stone.style.zIndex = '10';
        
        boardContainer.appendChild(stone);
        
        // Add placement sound effect (if available)
        this.playSound('place');
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal \\
            [1, -1]   // Diagonal /
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1; // Count the placed stone
            const winningStones = [[row, col]];
            
            // Check positive direction
            for (let i = 1; i < 5; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                
                if (newRow >= 0 && newRow < this.boardSize && 
                    newCol >= 0 && newCol < this.boardSize && 
                    this.board[newRow][newCol] === player) {
                    count++;
                    winningStones.push([newRow, newCol]);
                } else {
                    break;
                }
            }
            
            // Check negative direction
            for (let i = 1; i < 5; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                
                if (newRow >= 0 && newRow < this.boardSize && 
                    newCol >= 0 && newCol < this.boardSize && 
                    this.board[newRow][newCol] === player) {
                    count++;
                    winningStones.unshift([newRow, newCol]);
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                this.highlightWinningStones(winningStones.slice(0, 5));
                return true;
            }
        }
        
        return false;
    }
    
    highlightWinningStones(stones) {
        stones.forEach(([row, col]) => {
            const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            const stone = intersection.querySelector('.stone');
            if (stone) {
                stone.classList.add('winning-stone');
            }
        });
    }
    
    handleGameWin() {
        this.gameOver = true;
        const winner = this.currentPlayer === 1 ? 'Schwarz' : 'Weiß';
        const winnerKey = this.currentPlayer === 1 ? 'black' : 'white';
        
        this.scores[winnerKey]++;
        this.updateDisplay();
        
        // Show win message
        this.showMessage(`🎉 ${winner} gewinnt!`, 'success');
        this.playSound('win');
        
        console.log(`🏆 Game Over! ${winner} wins in ${this.moveCount} moves`);
    }
    
    makeAIMove() {
        if (this.gameOver) return;
        
        // Simple AI: Random move for now (can be improved with minimax)
        const emptySpots = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    emptySpots.push([row, col]);
                }
            }
        }
        
        if (emptySpots.length > 0) {
            const [row, col] = emptySpots[Math.floor(Math.random() * emptySpots.length)];
            this.makeMove(row, col);
        }
    }
    
    undoMove() {
        if (this.gameHistory.length === 0) {
            this.showMessage('Keine Züge zum Rückgängigmachen', 'info');
            return;
        }
        
        const lastMove = this.gameHistory.pop();
        this.board[lastMove.row][lastMove.col] = 0;
        this.moveCount--;
        
        // Remove visual stone
        const stone = document.querySelector(`[data-row="${lastMove.row}"][data-col="${lastMove.col}"].stone`);
        if (stone) {
            stone.remove();
        }
        
        // Switch back to previous player
        this.currentPlayer = lastMove.player;
        this.gameOver = false;
        
        // Clear winning highlights
        document.querySelectorAll('.winning-stone').forEach(stone => {
            stone.classList.remove('winning-stone');
        });
        
        this.updateDisplay();
        this.showMessage('Zug rückgängig gemacht', 'info');
        
        console.log(`↶ Undo: Removed move ${lastMove.moveNumber} at (${lastMove.row}, ${lastMove.col})`);
    }
    
    newGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.moveCount = 0;
        this.gameHistory = [];
        
        this.createBoard();
        this.updateDisplay();
        
        this.showMessage('Neues Spiel gestartet', 'success');
        console.log('🆕 New Gomoku game started');
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        this.updateDisplay();
        this.showMessage(`Spielmodus: ${mode === 'single-player' ? 'Gegen KI' : '2 Spieler'}`, 'info');
        console.log(`🎮 Game mode changed to: ${mode}`);
    }
    
    showHint() {
        if (this.gameOver) {
            this.showMessage('Spiel ist beendet', 'info');
            return;
        }
        
        // Simple hint: show a random valid move
        const emptySpots = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    emptySpots.push([row, col]);
                }
            }
        }
        
        if (emptySpots.length > 0) {
            const [row, col] = emptySpots[Math.floor(Math.random() * emptySpots.length)];
            const intersection = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            
            // Highlight suggestion
            intersection.style.background = 'rgba(34, 197, 94, 0.3)';
            setTimeout(() => {
                intersection.style.background = '';
            }, 2000);
            
            this.showMessage(`Vorschlag: Position (${row + 1}, ${col + 1})`, 'info');
        }
    }
    
    updateDisplay() {
        // Update current player indicator
        const playerStone = document.getElementById('currentPlayerStone');
        const playerText = document.getElementById('currentPlayerText');
        
        if (this.gameOver) {
            const winner = this.currentPlayer === 1 ? 'Schwarz' : 'Weiß';
            playerText.textContent = `${winner} hat gewonnen!`;
        } else {
            const playerName = this.currentPlayer === 1 ? 'Schwarz' : 'Weiß';
            playerStone.className = `w-6 h-6 rounded-full mr-3 ${this.currentPlayer === 1 ? 'stone-black' : 'stone-white'}`;
            playerText.textContent = `${playerName} ist am Zug`;
        }
        
        // Update move counter
        document.getElementById('moveCounter').textContent = this.moveCount;
        
        // Update game mode
        document.getElementById('currentMode').textContent = this.gameMode === 'single-player' ? 'Gegen KI' : '2 Spieler';
        
        // Update scores
        document.getElementById('blackScore').textContent = this.scores.black;
        document.getElementById('whiteScore').textContent = this.scores.white;
        
        // Update game status
        const gameStatus = document.getElementById('gameStatus');
        if (this.gameOver) {
            const winner = this.currentPlayer === 1 ? 'Schwarz' : 'Weiß';
            gameStatus.textContent = `${winner} gewinnt!`;
            gameStatus.className = 'text-center font-semibold text-green-400';
        } else {
            gameStatus.textContent = 'Bereit zum Spielen';
            gameStatus.className = 'text-center font-semibold';
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
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    playSound(type) {
        // Placeholder for sound effects
        // Could be implemented with Web Audio API or audio elements
        console.log(`🔊 Playing sound: ${type}`);
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gomoku = new ModernGomoku();
});

// Export for testing
export { ModernGomoku };