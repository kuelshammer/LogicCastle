/**
 * GomokuModernized - Hybrid system combining:
 * - Modern Glassmorphism UI (from index-new.html)
 * - BitPacked WASM Backend (from production system)
 * - Intersection-based placement (Gemini Report implementation)
 * - Connect4 API compatibility
 * 
 * Features:
 * - 2-Layer UI System (Visual + Interaction)
 * - BitPackedBoard<15,15,2> integration
 * - AI analysis and threat visualization
 * - Modern responsive design
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
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;\n            \n            switch(e.key.toLowerCase()) {\n                case 'n':\n                    this.newGame();\n                    e.preventDefault();\n                    break;\n                case 'u':\n                    this.undoMove();\n                    e.preventDefault();\n                    break;\n                case 'a':\n                    this.makeAIMove();\n                    e.preventDefault();\n                    break;\n                case 'f1':\n                    this.analyzePosition();\n                    e.preventDefault();\n                    break;\n                case 't':\n                    this.toggleThreatVisualization();\n                    e.preventDefault();\n                    break;\n            }\n        });\n        \n        console.log('✅ Event listeners set up');\n    }\n    \n    handleCellClick(row, col) {\n        if (!this.gameActive || this.aiThinking) {\n            return;\n        }\n        \n        if (!this.game.is_valid_move(row, col)) {\n            this.showMessage('Ungültiger Zug', 'warning');\n            return;\n        }\n        \n        try {\n            // Make move in WASM backend\n            const won = this.game.make_move(row, col);\n            \n            // Update visual representation\n            this.updateBoardFromBackend();\n            \n            if (won) {\n                this.handleGameWin();\n            } else {\n                this.updateDisplay();\n                this.updateAnalysis();\n            }\n            \n        } catch (error) {\n            console.error('❌ Move failed:', error);\n            this.showMessage('Zug fehlgeschlagen', 'error');\n        }\n    }\n    \n    updateBoardFromBackend() {\n        // Clear existing visual stones\n        this.clearVisualStones();\n        \n        // Get board state from backend\n        const board = this.game.get_board();\n        \n        // Recreate visual stones\n        for (let row = 0; row < 15; row++) {\n            for (let col = 0; col < 15; col++) {\n                const cellValue = board[row * 15 + col];\n                if (cellValue !== 0) {\n                    this.placeVisualStone(row, col, cellValue);\n                }\n            }\n        }\n    }\n    \n    placeVisualStone(row, col, player) {\n        const boardContainer = document.getElementById('boardContainer');\n        if (!boardContainer) return;\n        \n        const stone = document.createElement('div');\n        stone.className = `stone ${player === 1 ? 'stone-black' : 'stone-white'}`;\n        stone.dataset.row = row;\n        stone.dataset.col = col;\n        \n        // Position stone exactly on the line intersection\n        stone.style.position = 'absolute';\n        stone.style.left = `${30 + col * 30}px`;  // 30px padding + line position\n        stone.style.top = `${30 + row * 30}px`;   // 30px padding + line position\n        stone.style.zIndex = '10';\n        \n        boardContainer.appendChild(stone);\n        \n        // Store reference for cleanup\n        this.visualStones.set(`${row},${col}`, stone);\n    }\n    \n    clearVisualStones() {\n        this.visualStones.forEach(stone => {\n            if (stone.parentNode) {\n                stone.parentNode.removeChild(stone);\n            }\n        });\n        this.visualStones.clear();\n    }\n    \n    makeAIMove() {\n        if (!this.gameActive || this.aiThinking) {\n            return;\n        }\n        \n        this.aiThinking = true;\n        this.showMessage('AI denkt...', 'info');\n        \n        // Add visual thinking indicator\n        const aiIndicator = document.getElementById('currentPlayerIndicator');\n        aiIndicator.classList.add('ai-thinking');\n        \n        // Simulate AI thinking time\n        setTimeout(() => {\n            try {\n                const aiMove = this.game.get_ai_move();\n                \n                if (aiMove.length === 2) {\n                    const [row, col] = aiMove;\n                    this.handleCellClick(row, col);\n                    this.showMessage(`AI zieht: (${row + 1}, ${col + 1})`, 'info');\n                } else {\n                    this.showMessage('AI konnte keinen Zug finden', 'warning');\n                }\n                \n            } catch (error) {\n                console.error('❌ AI move failed:', error);\n                this.showMessage('AI-Fehler', 'error');\n            }\n            \n            this.aiThinking = false;\n            aiIndicator.classList.remove('ai-thinking');\n        }, 800);\n    }\n    \n    analyzePosition() {\n        if (!this.gameActive) return;\n        \n        try {\n            const analysis = this.game.analyze_position();\n            console.log('📊 Position analysis:', analysis);\n            \n            // Update analysis display\n            this.updateAnalysis();\n            \n            // Show analysis message\n            const evaluation = this.game.evaluate_position();\n            const message = evaluation > 0 ? \n                `Position: +${evaluation} (Vorteil)` : \n                evaluation < 0 ? \n                `Position: ${evaluation} (Nachteil)` : \n                'Position: Ausgeglichen';\n            \n            this.showMessage(message, 'info');\n            \n        } catch (error) {\n            console.error('❌ Analysis failed:', error);\n            this.showMessage('Analyse fehlgeschlagen', 'error');\n        }\n    }\n    \n    updateAnalysis() {\n        if (!this.initialized) return;\n        \n        try {\n            // Get analysis data from backend\n            const evaluation = this.game.evaluate_position();\n            const winningMoves = this.game.get_winning_moves();\n            const blockingMoves = this.game.get_blocking_moves();\n            const threateningMoves = this.game.get_threatening_moves();\n            \n            // Update analysis display\n            document.getElementById('positionEvaluation').textContent = evaluation;\n            document.getElementById('threatCount').textContent = Math.floor(threateningMoves.length / 2);\n            document.getElementById('winningMoves').textContent = Math.floor(winningMoves.length / 2);\n            document.getElementById('blockingMoves').textContent = Math.floor(blockingMoves.length / 2);\n            \n        } catch (error) {\n            console.error('❌ Analysis update failed:', error);\n        }\n    }\n    \n    showThreatLevel(row, col) {\n        if (!this.threatVisualization || !this.gameActive) return;\n        \n        try {\n            const currentPlayer = this.game.get_current_player();\n            const threatLevel = this.game.get_threat_level(row, col, currentPlayer);\n            \n            if (threatLevel > 0) {\n                const intersection = document.querySelector(`[data-row=\"${row}\"][data-col=\"${col}\"]`);\n                intersection.classList.add(`threat-level-${Math.min(threatLevel, 5)}`);\n            }\n        } catch (error) {\n            // Silently ignore threat level errors\n        }\n    }\n    \n    hideThreatLevel(row, col) {\n        const intersection = document.querySelector(`[data-row=\"${row}\"][data-col=\"${col}\"]`);\n        for (let i = 1; i <= 5; i++) {\n            intersection.classList.remove(`threat-level-${i}`);\n        }\n    }\n    \n    toggleThreatVisualization() {\n        this.threatVisualization = !this.threatVisualization;\n        this.showMessage(\n            `Bedrohungsvisualisierung: ${this.threatVisualization ? 'An' : 'Aus'}`, \n            'info'\n        );\n    }\n    \n    handleGameWin() {\n        this.gameActive = false;\n        \n        const winner = this.game.get_winner();\n        const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';\n        \n        this.showMessage(`🎉 ${winnerName} gewinnt!`, 'success');\n        this.updateDisplay();\n        \n        // Highlight winning stones (if available)\n        this.highlightWinningStones();\n        \n        console.log(`🏆 Game Over! ${winnerName} wins in ${this.game.get_move_count()} moves`);\n    }\n    \n    highlightWinningStones() {\n        // Add winning animation to all stones of the winning player\n        const winner = this.game.get_winner();\n        if (winner) {\n            this.visualStones.forEach(stone => {\n                const isWinningStone = (winner === 1 && stone.classList.contains('stone-black')) ||\n                                      (winner === 2 && stone.classList.contains('stone-white'));\n                \n                if (isWinningStone) {\n                    stone.classList.add('winning-stone');\n                }\n            });\n        }\n    }\n    \n    undoMove() {\n        if (!this.gameActive) {\n            this.showMessage('Spiel ist beendet', 'info');\n            return;\n        }\n        \n        try {\n            const success = this.game.undo_move();\n            \n            if (success) {\n                this.updateBoardFromBackend();\n                this.updateDisplay();\n                this.updateAnalysis();\n                this.showMessage('Zug rückgängig gemacht', 'info');\n            } else {\n                this.showMessage('Kann nicht rückgängig machen', 'warning');\n            }\n            \n        } catch (error) {\n            console.error('❌ Undo failed:', error);\n            this.showMessage('Rückgängig fehlgeschlagen', 'error');\n        }\n    }\n    \n    newGame() {\n        try {\n            this.game.reset();\n            this.gameActive = true;\n            this.clearVisualStones();\n            this.updateDisplay();\n            this.updateAnalysis();\n            \n            // Clear winning highlights\n            document.querySelectorAll('.winning-stone').forEach(stone => {\n                stone.classList.remove('winning-stone');\n            });\n            \n            this.showMessage('Neues Spiel gestartet', 'success');\n            console.log('🆕 New Gomoku game started');\n            \n        } catch (error) {\n            console.error('❌ New game failed:', error);\n            this.showMessage('Neues Spiel fehlgeschlagen', 'error');\n        }\n    }\n    \n    updateDisplay() {\n        if (!this.initialized) return;\n        \n        try {\n            const currentPlayer = this.game.get_current_player();\n            const winner = this.game.get_winner();\n            const moveCount = this.game.get_move_count();\n            const gamePhase = this.game.get_game_phase();\n            const memoryUsage = this.game.memory_usage();\n            \n            // Update current player indicator\n            const playerStone = document.getElementById('currentPlayerStone');\n            const playerText = document.getElementById('currentPlayerText');\n            \n            if (winner) {\n                const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';\n                playerText.textContent = `${winnerName} hat gewonnen!`;\n                playerStone.className = `w-6 h-6 rounded-full mr-3 ${winner === 1 ? 'stone-black' : 'stone-white'}`;\n            } else {\n                const playerName = currentPlayer === 1 ? 'Schwarz' : 'Weiß';\n                playerStone.className = `w-6 h-6 rounded-full mr-3 ${currentPlayer === 1 ? 'stone-black' : 'stone-white'}`;\n                playerText.textContent = `${playerName} ist am Zug`;\n            }\n            \n            // Update game info\n            document.getElementById('moveCounter').textContent = moveCount;\n            document.getElementById('gamePhase').textContent = this.formatGamePhase(gamePhase);\n            document.getElementById('memoryBytes').textContent = `${memoryUsage} Bytes`;\n            \n            // Update game status\n            const gameStatus = document.getElementById('gameStatus');\n            if (winner) {\n                const winnerName = winner === 1 ? 'Schwarz' : 'Weiß';\n                gameStatus.textContent = `${winnerName} gewinnt!`;\n                gameStatus.className = 'text-center font-semibold text-green-400';\n            } else if (this.game.is_draw()) {\n                gameStatus.textContent = 'Unentschieden';\n                gameStatus.className = 'text-center font-semibold text-yellow-400';\n            } else {\n                gameStatus.textContent = 'Spiel läuft';\n                gameStatus.className = 'text-center font-semibold';\n            }\n            \n        } catch (error) {\n            console.error('❌ Display update failed:', error);\n        }\n    }\n    \n    formatGamePhase(phase) {\n        switch (phase) {\n            case 0: return 'Eröffnung';\n            case 1: return 'Mittelspiel';\n            case 2: return 'Endspiel';\n            default: return 'Unbekannt';\n        }\n    }\n    \n    showMessage(text, type = 'info') {\n        // Create toast message\n        const toast = document.createElement('div');\n        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 transform translate-x-full`;\n        \n        // Set color based on type\n        switch(type) {\n            case 'success':\n                toast.classList.add('bg-green-500');\n                break;\n            case 'error':\n                toast.classList.add('bg-red-500');\n                break;\n            case 'warning':\n                toast.classList.add('bg-yellow-500');\n                break;\n            default:\n                toast.classList.add('bg-blue-500');\n        }\n        \n        toast.textContent = text;\n        document.body.appendChild(toast);\n        \n        // Animate in\n        setTimeout(() => {\n            toast.classList.remove('translate-x-full');\n        }, 100);\n        \n        // Animate out and remove\n        setTimeout(() => {\n            toast.classList.add('translate-x-full');\n            setTimeout(() => {\n                if (document.body.contains(toast)) {\n                    document.body.removeChild(toast);\n                }\n            }, 300);\n        }, 3000);\n    }\n}\n\n// Initialize the game when DOM is loaded\ndocument.addEventListener('DOMContentLoaded', () => {\n    window.gomokuModernized = new GomokuModernized();\n});\n\n// Export for testing\nexport { GomokuModernized };