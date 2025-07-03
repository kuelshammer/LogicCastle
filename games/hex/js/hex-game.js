/**
 * Hex Game Main Module
 * 
 * Hex is a strategic connection game played on an 11x11 hexagonal board.
 * Players (Red and Blue) take turns placing stones, trying to form an 
 * unbroken chain connecting their opposite sides of the board.
 * 
 * Features:
 * - BitPackedBoard<11,11,2> for memory efficiency (93.4% savings)
 * - SVG hexagonal grid with precise coordinate mapping
 * - Union-Find algorithm for efficient path detection
 * - Educational demonstrations of topology and graph theory
 */

import init, { HexBoard } from '../../../game_engine/pkg/game_engine.js';

// Game constants
const BOARD_SIZE = 11;
const PLAYER_EMPTY = 0;
const PLAYER_RED = 1;
const PLAYER_BLUE = 2;

class HexGame {
    constructor() {
        this.board = null;
        this.currentPlayer = PLAYER_RED;
        this.moveCount = 0;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.initialized = false;
        
        // SVG rendering properties
        this.hexRadius = 20;
        this.hexSpacing = 35;
        this.boardOffsetX = 50;
        this.boardOffsetY = 50;
        
        // Game state callbacks
        this.onGameStateChange = null;
        this.onMoveComplete = null;
        this.onGameEnd = null;
    }

    /**
     * Initialize the game with WASM BitPackedBoard
     */
    async init() {
        try {
            this.updateLoadingProgress('Initialisiere WASM...');
            
            // Initialize WASM module
            await init();
            
            this.updateLoadingProgress('Erstelle BitPackedBoard...');
            
            // Create BitPackedBoard<11,11,2> instance
            this.board = new HexBoard();
            this.initialized = true;
            
            this.updateLoadingProgress('Erstelle Hexagon-Grid...');
            
            // Initialize SVG board
            this.initializeHexBoard();
            
            this.updateLoadingProgress('Fertig!');
            await this.delay(500);
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            // Update UI
            this.updateGameDisplay();
            this.updateSystemStatus();
            
            console.log('✅ Hex Game initialized successfully');
            console.log(`📊 Board memory usage: ${this.board.memory_usage()} bytes`);
            console.log(`📐 Board dimensions: ${this.board.dimensions()}`);
            
        } catch (error) {
            console.error('❌ Hex Game initialization failed:', error);
            this.showError('WASM BitPackedBoard Initialization Failed', error.message);
        }
    }

    /**
     * Initialize SVG hexagonal board
     */
    initializeHexBoard() {
        const svg = document.getElementById('hex-board');
        const cellsGroup = document.getElementById('hex-cells');
        const labelsGroup = document.getElementById('coord-labels');
        const bordersGroup = document.getElementById('border-indicators');
        
        // Clear existing content
        cellsGroup.innerHTML = '';
        labelsGroup.innerHTML = '';
        bordersGroup.innerHTML = '';
        
        // Generate hexagonal cells
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.createHexagonCell(cellsGroup, row, col);
            }
        }
        
        // Add coordinate labels
        this.addCoordinateLabels(labelsGroup);
        
        // Add border indicators
        this.addBorderIndicators(bordersGroup);
        
        // Set up click handlers
        this.setupBoardInteraction();
    }

    /**
     * Create a single hexagon cell in SVG
     */
    createHexagonCell(parent, row, col) {
        const pos = this.getHexPosition(row, col);
        
        // Create hexagon path
        const hexPath = this.generateHexagonPath(pos.x, pos.y, this.hexRadius);
        
        const hexagon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hexagon.setAttribute('d', hexPath);
        hexagon.setAttribute('fill', '#ffffff');
        hexagon.setAttribute('stroke', '#dee2e6');
        hexagon.setAttribute('stroke-width', '1.5');
        hexagon.setAttribute('class', 'hex-cell');
        hexagon.setAttribute('data-row', row);
        hexagon.setAttribute('data-col', col);
        
        // Add hover effects
        hexagon.style.cursor = 'pointer';
        hexagon.addEventListener('mouseenter', () => {
            if (this.board.get_cell(row, col) === PLAYER_EMPTY && !this.gameOver) {
                hexagon.setAttribute('fill', '#f8f9fa');
                hexagon.setAttribute('stroke', '#6c757d');
            }
        });
        
        hexagon.addEventListener('mouseleave', () => {
            if (this.board.get_cell(row, col) === PLAYER_EMPTY) {
                hexagon.setAttribute('fill', '#ffffff');
                hexagon.setAttribute('stroke', '#dee2e6');
            }
        });
        
        parent.appendChild(hexagon);
    }

    /**
     * Get pixel position for hex cell
     */
    getHexPosition(row, col) {
        const x = this.boardOffsetX + col * this.hexSpacing + (row % 2) * (this.hexSpacing / 2);
        const y = this.boardOffsetY + row * this.hexSpacing * 0.866; // sin(60°) ≈ 0.866
        return { x, y };
    }

    /**
     * Generate SVG path for hexagon
     */
    generateHexagonPath(cx, cy, radius) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i; // 60° increments
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        }
        return `M ${points[0]} L ${points.slice(1).join(' L ')} Z`;
    }

    /**
     * Add coordinate labels to board
     */
    addCoordinateLabels(parent) {
        // Add row numbers (1-11) on left side
        for (let row = 0; row < BOARD_SIZE; row++) {
            const pos = this.getHexPosition(row, -0.8);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'coord-label');
            text.setAttribute('fill', '#6c757d');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-family', 'monospace');
            text.textContent = (row + 1).toString();
            parent.appendChild(text);
        }
        
        // Add column letters (A-K) on top
        for (let col = 0; col < BOARD_SIZE; col++) {
            const pos = this.getHexPosition(-0.8, col);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'coord-label');
            text.setAttribute('fill', '#6c757d');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-family', 'monospace');
            text.textContent = String.fromCharCode(65 + col); // A, B, C, ...
            parent.appendChild(text);
        }
    }

    /**
     * Add border indicators for player connection goals
     */
    addBorderIndicators(parent) {
        // Red borders (left and right)
        for (let row = 0; row < BOARD_SIZE; row++) {
            // Left border
            const leftPos = this.getHexPosition(row, -0.5);
            const leftBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            leftBorder.setAttribute('x', leftPos.x - 10);
            leftBorder.setAttribute('y', leftPos.y - 15);
            leftBorder.setAttribute('width', '5');
            leftBorder.setAttribute('height', '30');
            leftBorder.setAttribute('fill', '#dc3545');
            leftBorder.setAttribute('opacity', '0.7');
            parent.appendChild(leftBorder);
            
            // Right border
            const rightPos = this.getHexPosition(row, BOARD_SIZE - 0.5);
            const rightBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rightBorder.setAttribute('x', rightPos.x + 5);
            rightBorder.setAttribute('y', rightPos.y - 15);
            rightBorder.setAttribute('width', '5');
            rightBorder.setAttribute('height', '30');
            rightBorder.setAttribute('fill', '#dc3545');
            rightBorder.setAttribute('opacity', '0.7');
            parent.appendChild(rightBorder);
        }
        
        // Blue borders (top and bottom)
        for (let col = 0; col < BOARD_SIZE; col++) {
            // Top border
            const topPos = this.getHexPosition(-0.5, col);
            const topBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            topBorder.setAttribute('x', topPos.x - 15);
            topBorder.setAttribute('y', topPos.y - 10);
            topBorder.setAttribute('width', '30');
            topBorder.setAttribute('height', '5');
            topBorder.setAttribute('fill', '#007bff');
            topBorder.setAttribute('opacity', '0.7');
            parent.appendChild(topBorder);
            
            // Bottom border
            const bottomPos = this.getHexPosition(BOARD_SIZE - 0.5, col);
            const bottomBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bottomBorder.setAttribute('x', bottomPos.x - 15);
            bottomBorder.setAttribute('y', bottomPos.y + 5);
            bottomBorder.setAttribute('width', '30');
            bottomBorder.setAttribute('height', '5');
            bottomBorder.setAttribute('fill', '#007bff');
            bottomBorder.setAttribute('opacity', '0.7');
            parent.appendChild(bottomBorder);
        }
    }

    /**
     * Set up board click interaction
     */
    setupBoardInteraction() {
        const cellsGroup = document.getElementById('hex-cells');
        
        cellsGroup.addEventListener('click', (event) => {
            if (!this.initialized || this.gameOver) return;
            
            const target = event.target;
            if (!target.classList.contains('hex-cell')) return;
            
            const row = parseInt(target.getAttribute('data-row'));
            const col = parseInt(target.getAttribute('data-col'));
            
            this.makeMove(row, col);
        });
    }

    /**
     * Make a move at the specified position
     */
    makeMove(row, col) {
        if (!this.initialized || this.gameOver) return false;
        
        try {
            // Check if position is valid and empty
            if (!this.board.is_valid_position(row, col)) {
                console.warn('Invalid position:', row, col);
                return false;
            }
            
            if (this.board.get_cell(row, col) !== PLAYER_EMPTY) {
                console.warn('Position already occupied:', row, col);
                return false;
            }
            
            // Place stone
            this.board.set_cell(row, col, this.currentPlayer);
            this.moveCount++;
            
            // Record move
            this.moveHistory.push({ row, col, player: this.currentPlayer });
            
            // Update visual representation
            this.updateCellVisual(row, col, this.currentPlayer);
            
            // Check for win
            const winner = this.checkForWin();
            if (winner) {
                this.gameOver = true;
                this.winner = winner;
                this.updateGameDisplay();
                this.showWinMessage(winner);
                
                if (this.onGameEnd) {
                    this.onGameEnd(winner);
                }
            } else {
                // Switch players
                this.currentPlayer = this.currentPlayer === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;
                this.updateGameDisplay();
            }
            
            if (this.onMoveComplete) {
                this.onMoveComplete({ row, col, player: this.currentPlayer });
            }
            
            return true;
            
        } catch (error) {
            console.error('Error making move:', error);
            return false;
        }
    }

    /**
     * Update visual representation of a cell
     */
    updateCellVisual(row, col, player) {
        const cellsGroup = document.getElementById('hex-cells');
        const cell = cellsGroup.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (!cell) return;
        
        if (player === PLAYER_RED) {
            cell.setAttribute('fill', '#dc3545');
            cell.setAttribute('stroke', '#a71e2a');
        } else if (player === PLAYER_BLUE) {
            cell.setAttribute('fill', '#007bff');
            cell.setAttribute('stroke', '#0056b3');
        }
        
        cell.style.cursor = 'default';
    }

    /**
     * Check for winning condition using Union-Find algorithm
     */
    checkForWin() {
        // For now, use a simplified pathfinding approach
        // TODO: Implement proper Union-Find for educational demonstration
        
        // Check Red (left-right connection)
        if (this.hasPath(PLAYER_RED, 'horizontal')) {
            return PLAYER_RED;
        }
        
        // Check Blue (top-bottom connection)  
        if (this.hasPath(PLAYER_BLUE, 'vertical')) {
            return PLAYER_BLUE;
        }
        
        return null;
    }

    /**
     * Check if player has connecting path (simplified BFS)
     */
    hasPath(player, direction) {
        const visited = new Set();
        const queue = [];
        
        // Find starting positions
        if (direction === 'horizontal') {
            // Red: start from left column
            for (let row = 0; row < BOARD_SIZE; row++) {
                if (this.board.get_cell(row, 0) === player) {
                    queue.push({ row, col: 0 });
                    visited.add(`${row},0`);
                }
            }
        } else {
            // Blue: start from top row
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (this.board.get_cell(0, col) === player) {
                    queue.push({ row: 0, col });
                    visited.add(`0,${col}`);
                }
            }
        }
        
        // BFS to find path to opposite side
        while (queue.length > 0) {
            const { row, col } = queue.shift();
            
            // Check if reached target side
            if (direction === 'horizontal' && col === BOARD_SIZE - 1) {
                return true; // Red reached right side
            }
            if (direction === 'vertical' && row === BOARD_SIZE - 1) {
                return true; // Blue reached bottom side
            }
            
            // Check all 6 hexagonal neighbors
            const neighbors = this.getHexNeighbors(row, col);
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(key) && 
                    this.board.is_valid_position(neighbor.row, neighbor.col) &&
                    this.board.get_cell(neighbor.row, neighbor.col) === player) {
                    
                    visited.add(key);
                    queue.push(neighbor);
                }
            }
        }
        
        return false;
    }

    /**
     * Get all 6 hexagonal neighbors of a cell
     */
    getHexNeighbors(row, col) {
        const neighbors = [];
        
        // Hexagonal grid has 6 neighbors
        // Pattern depends on whether row is even or odd
        const isEvenRow = row % 2 === 0;
        
        const directions = isEvenRow ? [
            [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
        ] : [
            [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        
        return neighbors;
    }

    /**
     * Start new game
     */
    newGame() {
        if (!this.initialized) return;
        
        this.board.clear();
        this.currentPlayer = PLAYER_RED;
        this.moveCount = 0;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        
        // Reset visual board
        this.resetBoardVisuals();
        this.updateGameDisplay();
        
        console.log('🎮 New Hex game started');
    }

    /**
     * Reset visual board to empty state
     */
    resetBoardVisuals() {
        const cellsGroup = document.getElementById('hex-cells');
        const cells = cellsGroup.querySelectorAll('.hex-cell');
        
        cells.forEach(cell => {
            cell.setAttribute('fill', '#ffffff');
            cell.setAttribute('stroke', '#dee2e6');
            cell.style.cursor = 'pointer';
        });
    }

    /**
     * Update game display
     */
    updateGameDisplay() {
        // Update current player
        const currentPlayerElement = document.getElementById('current-player');
        if (currentPlayerElement) {
            const playerColor = this.currentPlayer === PLAYER_RED ? 'red' : 'blue';
            const playerName = this.currentPlayer === PLAYER_RED ? 'Rot' : 'Blau';
            const bgColor = this.currentPlayer === PLAYER_RED ? 'bg-red-500' : 'bg-blue-500';
            
            currentPlayerElement.innerHTML = `
                <span class="inline-block w-4 h-4 ${bgColor} rounded-full mr-2"></span>
                ${playerName}
            `;
        }
        
        // Update move count
        const moveCountElement = document.getElementById('move-count');
        if (moveCountElement) {
            moveCountElement.textContent = this.moveCount;
        }
        
        // Update stone counts
        const redStones = this.board.count_stones(PLAYER_RED);
        const blueStones = this.board.count_stones(PLAYER_BLUE);
        
        const redStonesElement = document.getElementById('red-stones');
        const blueStonesElement = document.getElementById('blue-stones');
        
        if (redStonesElement) redStonesElement.textContent = redStones;
        if (blueStonesElement) blueStonesElement.textContent = blueStones;
        
        // Update game status
        const gameStatusElement = document.getElementById('game-status');
        if (gameStatusElement) {
            if (this.gameOver) {
                const winnerName = this.winner === PLAYER_RED ? 'Rot' : 'Blau';
                const winnerColor = this.winner === PLAYER_RED ? 'text-red-600' : 'text-blue-600';
                gameStatusElement.textContent = `${winnerName} gewinnt!`;
                gameStatusElement.className = `font-bold ${winnerColor}`;
            } else {
                gameStatusElement.textContent = 'Läuft';
                gameStatusElement.className = 'font-bold text-green-600';
            }
        }
        
        // Update memory usage
        const memoryElement = document.getElementById('memory-usage');
        if (memoryElement && this.board) {
            memoryElement.textContent = `${this.board.memory_usage()} bytes`;
        }
        
        // Update connection status
        this.updateConnectionStatus();
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus() {
        const redConnectionElement = document.getElementById('red-connection');
        const blueConnectionElement = document.getElementById('blue-connection');
        
        if (redConnectionElement) {
            const redConnected = this.hasPath(PLAYER_RED, 'horizontal');
            redConnectionElement.textContent = redConnected ? 'Verbunden!' : 'Keine';
            redConnectionElement.className = redConnected ? 'font-bold text-green-600' : 'font-bold text-red-600';
        }
        
        if (blueConnectionElement) {
            const blueConnected = this.hasPath(PLAYER_BLUE, 'vertical');
            blueConnectionElement.textContent = blueConnected ? 'Verbunden!' : 'Keine';
            blueConnectionElement.className = blueConnected ? 'font-bold text-green-600' : 'font-bold text-blue-600';
        }
    }

    /**
     * Update system status
     */
    updateSystemStatus() {
        const wasmStatus = document.getElementById('wasm-status');
        const hexEngineStatus = document.getElementById('hex-engine-status');
        const svgStatus = document.getElementById('svg-status');
        
        if (wasmStatus) {
            wasmStatus.textContent = this.initialized ? 'Bereit' : 'Loading...';
            wasmStatus.className = this.initialized ? 'font-bold text-green-600' : 'font-bold text-yellow-600';
        }
        
        if (hexEngineStatus) {
            hexEngineStatus.textContent = this.board ? 'Bereit' : 'Initializing...';
            hexEngineStatus.className = this.board ? 'font-bold text-green-600' : 'font-bold text-yellow-600';
        }
        
        if (svgStatus) {
            const svgElement = document.getElementById('hex-board');
            const svgReady = svgElement && svgElement.children.length > 0;
            svgStatus.textContent = svgReady ? 'Bereit' : 'Loading...';
            svgStatus.className = svgReady ? 'font-bold text-green-600' : 'font-bold text-yellow-600';
        }
    }

    /**
     * Show win message
     */
    showWinMessage(winner) {
        const winnerName = winner === PLAYER_RED ? 'Rot' : 'Blau';
        const winnerColor = winner === PLAYER_RED ? 'red' : 'blue';
        
        // Could implement a proper modal here
        setTimeout(() => {
            alert(`🎉 ${winnerName} gewinnt!\n\nVerbindung erfolgreich hergestellt!`);
        }, 500);
    }

    /**
     * Utility functions
     */
    updateLoadingProgress(message) {
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.textContent = message;
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(title, message) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                    <h2 class="text-xl font-bold text-red-600 mb-4">❌ ${title}</h2>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <button onclick="location.reload()" class="game-button">🔄 Erneut versuchen</button>
                </div>
            `;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const game = new HexGame();
    
    // Set up UI controls
    document.getElementById('new-game')?.addEventListener('click', () => game.newGame());
    
    // Help modal
    const helpModal = document.getElementById('help-modal');
    const helpButton = document.getElementById('help');
    const closeHelpButtons = document.querySelectorAll('#close-help, #close-help-btn');
    
    helpButton?.addEventListener('click', () => {
        helpModal?.classList.add('active');
    });
    
    closeHelpButtons.forEach(btn => {
        btn?.addEventListener('click', () => {
            helpModal?.classList.remove('active');
        });
    });
    
    // Close modal on outside click
    helpModal?.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.remove('active');
        }
    });
    
    // Make game globally available for debugging
    window.hexGame = game;
    
    // Initialize the game
    await game.init();
    
    console.log('🎮 Hex Game ready for Phase 2 implementation!');
});

export default HexGame;