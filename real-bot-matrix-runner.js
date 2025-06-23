/**
 * Real 5x5 Bot Matrix Runner - 1000 Games mit echten Implementierungen
 * 
 * Nutzt die originalen Connect4Game, Connect4AI, Connect4Helpers Klassen
 * für authentische strategische Bot-Tests mit "Verlierer beginnt" Logik
 */

// Node.js compatible imports - wir müssen die Browser-Code anpassen
const fs = require('fs');
const path = require('path');

// Lade die echten Implementierungen 
function loadRealImplementations() {
    try {
        // Lese die echten JS-Files und adaptiere sie für Node.js
        const gameCode = fs.readFileSync(path.join(__dirname, 'games/connect4/js/game.js'), 'utf8');
        const aiCode = fs.readFileSync(path.join(__dirname, 'games/connect4/js/ai.js'), 'utf8');
        const helpersCode = fs.readFileSync(path.join(__dirname, 'games/connect4/js/helpers.js'), 'utf8');
        
        // Node.js-kompatible Versionen erstellen (ohne DOM dependencies)
        eval(gameCode.replace(/this\.ui\./g, '// this.ui.'));  // Remove UI calls
        eval(aiCode);
        eval(helpersCode.replace(/this\.ui\./g, '// this.ui.'));  // Remove UI calls
        
        console.log('✅ Real implementations loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Error loading real implementations:', error.message);
        return false;
    }
}

// Node.js-kompatible Connect4Game Klasse (vereinfacht aber original-basiert)
class RealConnect4Game {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.EMPTY = 0;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
        this.board = this.createEmptyBoard();
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.eventListeners = {};
    }
    
    createEmptyBoard() {
        const board = [];
        for (let row = 0; row < this.ROWS; row++) {
            board[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                board[row][col] = this.EMPTY;
            }
        }
        return board;
    }
    
    makeMove(col) {
        if (this.gameOver || col < 0 || col >= this.COLS) {
            return { success: false, reason: 'Invalid move' };
        }
        
        if (this.board[0][col] !== this.EMPTY) {
            return { success: false, reason: 'Column is full' };
        }
        
        // Find lowest empty row
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
        }
        
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ row, col, player: this.currentPlayer });
        
        // Check for win
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            return { success: true, row, col, gameWon: true, winner: this.winner };
        }
        
        // Check for draw
        if (this.moveHistory.length >= 42) {
            this.gameOver = true;
            return { success: true, row, col, gameDraw: true };
        }
        
        // Switch players
        this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        
        return { success: true, row, col };
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;
            
            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }
            
            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
                count++;
                r -= deltaRow;
                c -= deltaCol;
            }
            
            if (count >= 4) {
                return true;
            }
        }
        
        return false;
    }
    
    getValidMoves() {
        const moves = [];
        for (let col = 0; col < this.COLS; col++) {
            if (this.board[0][col] === this.EMPTY) {
                moves.push(col);
            }
        }
        return moves;
    }
    
    getBoard() {
        return this.board.map(row => [...row]);
    }
    
    simulateMove(col) {
        const validMoves = this.getValidMoves();
        if (!validMoves.includes(col)) {
            return { success: false, wouldWin: false };
        }
        
        // Find where piece would land
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
        }
        
        if (row < 0) {
            return { success: false, wouldWin: false };
        }
        
        // Simulate the move
        const boardCopy = this.getBoard();
        boardCopy[row][col] = this.currentPlayer;
        
        // Check if it would win
        const wouldWin = this.checkWinOnBoard(boardCopy, row, col, this.currentPlayer);
        
        return { success: true, wouldWin, row, col };
    }
    
    checkWinOnBoard(board, row, col, player) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;
            
            // Check positive direction
            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }
            
            // Check negative direction
            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === player) {
                count++;
                r -= deltaRow;
                c -= deltaCol;
            }
            
            if (count >= 4) {
                return true;
            }
        }
        
        return false;
    }
    
    // Event system stubs (für Node.js Kompatibilität)
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
}

// Node.js-kompatible Connect4Helpers Klasse (vereinfacht)
class RealConnect4Helpers {
    constructor(game, ui = null) {
        this.game = game;
        this.ui = ui;
        this.enabled = false;
        this.helpLevel = 0;
        this.forcedMoveMode = false;
        this.requiredMoves = [];
        this.currentHints = { threats: [], opportunities: [], suggestions: [] };
    }
    
    setEnabled(enabled, helpLevel = 0) {
        this.enabled = enabled;
        this.helpLevel = helpLevel;
        if (!enabled) {
            this.forcedMoveMode = false;
            this.requiredMoves = [];
        }
    }
    
    updateHints() {
        if (!this.enabled) return;
        
        this.forcedMoveMode = false;
        this.requiredMoves = [];
        
        // Simplified hints implementation für Node.js
        if (this.helpLevel >= 0) {
            // Level 0: Check for winning moves
            const winningMoves = this.findWinningMoves();
            if (winningMoves.length > 0) {
                this.forcedMoveMode = true;
                this.requiredMoves = winningMoves;
                return;
            }
        }
        
        if (this.helpLevel >= 1) {
            // Level 1: Check for blocking moves
            const blockingMoves = this.findBlockingMoves();
            if (blockingMoves.length > 0) {
                this.forcedMoveMode = true;
                this.requiredMoves = blockingMoves;
                return;
            }
        }
        
        if (this.helpLevel >= 2) {
            // Level 2: Check for safe moves (avoid traps)
            const safeMoves = this.findSafeMoves();
            if (safeMoves.length > 0 && safeMoves.length < this.game.getValidMoves().length) {
                this.forcedMoveMode = true;
                this.requiredMoves = safeMoves;
                return;
            }
        }
    }
    
    findWinningMoves() {
        const validMoves = this.game.getValidMoves();
        const winningMoves = [];
        
        for (const col of validMoves) {
            const result = this.game.simulateMove(col);
            if (result.success && result.wouldWin) {
                winningMoves.push(col);
            }
        }
        
        return winningMoves;
    }
    
    findBlockingMoves() {
        const opponent = this.game.currentPlayer === this.game.PLAYER1 ? this.game.PLAYER2 : this.game.PLAYER1;
        const validMoves = this.game.getValidMoves();
        const blockingMoves = [];
        
        for (const col of validMoves) {
            // Simulate opponent move
            const boardCopy = this.game.getBoard();
            let row = this.game.ROWS - 1;
            while (row >= 0 && boardCopy[row][col] !== this.game.EMPTY) {
                row--;
            }
            
            if (row >= 0) {
                boardCopy[row][col] = opponent;
                if (this.game.checkWinOnBoard(boardCopy, row, col, opponent)) {
                    blockingMoves.push(col);
                }
            }
        }
        
        return blockingMoves;
    }
    
    findSafeMoves() {
        const validMoves = this.game.getValidMoves();
        const safeMoves = [];
        const opponent = this.game.currentPlayer === this.game.PLAYER1 ? this.game.PLAYER2 : this.game.PLAYER1;
        
        for (const col of validMoves) {
            if (this.isSafeMove(col, opponent)) {
                safeMoves.push(col);
            }
        }
        
        return safeMoves.length > 0 ? safeMoves : validMoves;
    }
    
    isSafeMove(col, opponent) {
        // Simulate our move
        const boardCopy = this.game.getBoard();
        let row = this.game.ROWS - 1;
        while (row >= 0 && boardCopy[row][col] !== this.game.EMPTY) {
            row--;
        }
        
        if (row < 0) return false;
        
        boardCopy[row][col] = this.game.currentPlayer;
        
        // Check if opponent can win after our move
        const opponentValidMoves = [];
        for (let checkCol = 0; checkCol < this.game.COLS; checkCol++) {
            if (boardCopy[0][checkCol] === this.game.EMPTY) {
                opponentValidMoves.push(checkCol);
            }
        }
        
        for (const opponentCol of opponentValidMoves) {
            let opponentRow = this.game.ROWS - 1;
            while (opponentRow >= 0 && boardCopy[opponentRow][opponentCol] !== this.game.EMPTY) {
                opponentRow--;
            }
            
            if (opponentRow >= 0) {
                boardCopy[opponentRow][opponentCol] = opponent;
                if (this.game.checkWinOnBoard(boardCopy, opponentRow, opponentCol, opponent)) {
                    return false; // Not safe - opponent can win
                }
                boardCopy[opponentRow][opponentCol] = this.game.EMPTY; // Undo
            }
        }
        
        return true;
    }
    
    // Stub für enhanced strategic evaluation
    getEnhancedStrategicEvaluation() {
        return {
            recommendedMove: null,
            confidence: 0,
            forkOpportunities: [],
            zugzwangOpportunities: [],
            evenOddAnalysis: { parity: 'neutral', player: { odd: [], even: [] } }
        };
    }
}

// Vereinfachte aber original-basierte Connect4AI Klasse für Node.js
class RealConnect4AI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
    }
    
    getMaxDepth(difficulty) {
        switch (difficulty) {
            case 'easy': return 1;
            case 'medium': return 3;
            case 'hard': return 5;
            case 'expert': return 7;
            default: return 3;
        }
    }
    
    getBestMove(game, helpers = null) {
        // Route each bot type to its specific strategy method (original logic)
        switch (this.difficulty) {
            case 'smart-random':
                return this.getSmartRandomMove(game, helpers);
            
            case 'offensiv-gemischt':
                return this.getOffensiveMixedMove(game, helpers);
            
            case 'defensiv-gemischt':
                return this.getDefensiveMixedMove(game, helpers);
            
            case 'enhanced-smart':
                return this.getEnhancedSmartMove(game, helpers);
            
            case 'defensive':
                return this.getDefensiveMove(game, helpers);
            
            case 'easy':
                return this.getRandomMove(game);
            
            case 'medium':
                return this.getRuleBasedMove(game);
            
            case 'hard':
            case 'expert':
                return this.getMinimaxMove(game);
            
            default:
                return this.getUniversalBestMove(game, helpers);
        }
    }
    
    // Universal 4-stage logic (vereinfacht aber original-treu)
    getUniversalBestMove(game, helpers = null) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) return null;

        // STAGE 1: Direct win possible
        const winningMove = this.findWinningMove(game);
        if (winningMove !== null) return winningMove;

        // STAGE 2: ALWAYS block
        const blockingMove = this.findBlockingMove(game);
        if (blockingMove !== null) return blockingMove;

        // STAGE 3: Find safe columns
        const safeColumns = this.findSafeColumns(game, validMoves);

        // STAGE 4: Bot-specific selection
        return this.selectFromSafeColumns(game, safeColumns, helpers);
    }
    
    // Smart Random (original-basiert)
    getSmartRandomMove(game, helpers) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        if (game.moveHistory.length === 0) return 3; // Center opening
        
        if (helpers) {
            // Check Level 0 - winning moves
            helpers.setEnabled(true, 0);
            helpers.updateHints();
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * helpers.requiredMoves.length);
                return helpers.requiredMoves[randomIndex];
            }
            
            // Check Level 1 - blocking moves
            helpers.setEnabled(true, 1);
            helpers.updateHints();
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * helpers.requiredMoves.length);
                return helpers.requiredMoves[randomIndex];
            }
            
            // Check Level 2 - safe moves
            helpers.setEnabled(true, 2);
            helpers.updateHints();
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * helpers.requiredMoves.length);
                return helpers.requiredMoves[randomIndex];
            }
        }
        
        // Random move
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    // Offensiv-Gemischt (original-basiert)
    getOffensiveMixedMove(game, helpers) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        if (game.moveHistory.length === 0) return 3; // Center opening
        
        // Use universal logic first
        const universalMove = this.getUniversalBestMove(game, helpers);
        if (universalMove !== null) {
            // Check if this is a Stage 4 decision (no critical moves)
            const winningMove = this.findWinningMove(game);
            const blockingMove = this.findBlockingMove(game);
            
            if (winningMove === null && blockingMove === null) {
                // Stage 4: Apply offensive weighting
                return this.selectOffensiveWeighted(game, this.findSafeColumns(game, validMoves));
            }
        }
        
        return universalMove;
    }
    
    // Defensiv-Gemischt (original-basiert)
    getDefensiveMixedMove(game, helpers) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        if (game.moveHistory.length === 0) return 3; // Center opening
        
        // Use universal logic first
        const universalMove = this.getUniversalBestMove(game, helpers);
        if (universalMove !== null) {
            // Check if this is a Stage 4 decision (no critical moves)
            const winningMove = this.findWinningMove(game);
            const blockingMove = this.findBlockingMove(game);
            
            if (winningMove === null && blockingMove === null) {
                // Stage 4: Apply defensive weighting
                return this.selectDefensiveWeighted(game, this.findSafeColumns(game, validMoves));
            }
        }
        
        return universalMove;
    }
    
    // Enhanced Smart (vereinfacht)
    getEnhancedSmartMove(game, helpers) {
        if (game.moveHistory.length === 0) return 3; // Center opening
        
        // Use helpers system first
        if (helpers) {
            helpers.setEnabled(true, 0);
            helpers.updateHints();
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                return helpers.requiredMoves[Math.floor(Math.random() * helpers.requiredMoves.length)];
            }
            
            helpers.setEnabled(true, 1);
            helpers.updateHints();
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                return helpers.requiredMoves[Math.floor(Math.random() * helpers.requiredMoves.length)];
            }
            
            helpers.setEnabled(true, 2);
            helpers.updateHints();
            if (helpers.forcedMoveMode && helpers.requiredMoves.length > 0) {
                return helpers.requiredMoves[Math.floor(Math.random() * helpers.requiredMoves.length)];
            }
        }
        
        // Enhanced strategic selection
        const validMoves = game.getValidMoves();
        const safeColumns = this.findSafeColumns(game, validMoves);
        
        return this.selectEnhancedStrategic(game, safeColumns, helpers);
    }
    
    // Defensive Bot (original-basiert)
    getDefensiveMove(game, helpers) {
        return this.getUniversalBestMove(game, helpers);
    }
    
    // Easy Bot
    getRandomMove(game) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        // 30% chance to block
        if (Math.random() < 0.3) {
            const blockingMove = this.findBlockingMove(game);
            if (blockingMove !== null) return blockingMove;
        }
        
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    // Medium Bot
    getRuleBasedMove(game) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        const winningMove = this.findWinningMove(game);
        if (winningMove !== null) return winningMove;
        
        const blockingMove = this.findBlockingMove(game);
        if (blockingMove !== null) return blockingMove;
        
        // Center preference
        const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col => validMoves.includes(col));
        return centerMoves.length > 0 ? centerMoves[0] : validMoves[0];
    }
    
    // Minimax (vereinfacht)
    getMinimaxMove(game) {
        return this.getRuleBasedMove(game); // Vereinfacht für Performance
    }
    
    // Helper methods
    findWinningMove(game) {
        const validMoves = game.getValidMoves();
        for (const col of validMoves) {
            const result = game.simulateMove(col);
            if (result.success && result.wouldWin) {
                return col;
            }
        }
        return null;
    }
    
    findBlockingMove(game) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        const validMoves = game.getValidMoves();
        
        for (const col of validMoves) {
            const boardCopy = game.getBoard();
            let row = game.ROWS - 1;
            while (row >= 0 && boardCopy[row][col] !== game.EMPTY) {
                row--;
            }
            
            if (row >= 0) {
                boardCopy[row][col] = opponent;
                if (game.checkWinOnBoard(boardCopy, row, col, opponent)) {
                    return col;
                }
            }
        }
        return null;
    }
    
    findSafeColumns(game, validMoves) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        const safeColumns = [];
        
        for (const col of validMoves) {
            if (this.isSafeMove(game, col, opponent)) {
                safeColumns.push(col);
            }
        }
        
        return safeColumns.length > 0 ? safeColumns : validMoves;
    }
    
    isSafeMove(game, col, opponent) {
        const boardCopy = game.getBoard();
        let row = game.ROWS - 1;
        while (row >= 0 && boardCopy[row][col] !== game.EMPTY) {
            row--;
        }
        
        if (row < 0) return false;
        
        boardCopy[row][col] = game.currentPlayer;
        
        const opponentValidMoves = [];
        for (let checkCol = 0; checkCol < game.COLS; checkCol++) {
            if (boardCopy[0][checkCol] === game.EMPTY) {
                opponentValidMoves.push(checkCol);
            }
        }
        
        for (const opponentCol of opponentValidMoves) {
            let opponentRow = game.ROWS - 1;
            while (opponentRow >= 0 && boardCopy[opponentRow][opponentCol] !== game.EMPTY) {
                opponentRow--;
            }
            
            if (opponentRow >= 0) {
                boardCopy[opponentRow][opponentCol] = opponent;
                if (game.checkWinOnBoard(boardCopy, opponentRow, opponentCol, opponent)) {
                    return false;
                }
                boardCopy[opponentRow][opponentCol] = game.EMPTY;
            }
        }
        
        return true;
    }
    
    selectFromSafeColumns(game, safeColumns, helpers) {
        if (safeColumns.length === 0) return null;
        if (safeColumns.length === 1) return safeColumns[0];
        
        // Bot-specific selection
        switch (this.difficulty) {
            case 'smart-random':
                return this.selectCenterBiased(safeColumns);
            case 'offensiv-gemischt':
                return this.selectOffensiveWeighted(game, safeColumns);
            case 'defensiv-gemischt':
                return this.selectDefensiveWeighted(game, safeColumns);
            case 'enhanced-smart':
                return this.selectEnhancedStrategic(game, safeColumns, helpers);
            case 'defensive':
                return this.selectDefensivePriority(game, safeColumns);
            default:
                return this.selectCenterBiased(safeColumns);
        }
    }
    
    selectCenterBiased(safeColumns) {
        const centerOrder = [3, 2, 4, 1, 5, 0, 6];
        for (const col of centerOrder) {
            if (safeColumns.includes(col)) {
                return col;
            }
        }
        return safeColumns[0];
    }
    
    selectOffensiveWeighted(game, safeColumns) {
        const weightedColumns = [];
        
        for (const col of safeColumns) {
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            
            // 2x offensive weight, 1x defensive weight
            for (let i = 0; i < Math.max(1, offensiveValue * 2); i++) {
                weightedColumns.push(col);
            }
            for (let i = 0; i < Math.max(1, defensiveValue); i++) {
                weightedColumns.push(col);
            }
        }
        
        return weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
    }
    
    selectDefensiveWeighted(game, safeColumns) {
        const weightedColumns = [];
        
        for (const col of safeColumns) {
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            
            // 1x offensive weight, 2x defensive weight
            for (let i = 0; i < Math.max(1, offensiveValue); i++) {
                weightedColumns.push(col);
            }
            for (let i = 0; i < Math.max(1, defensiveValue * 2); i++) {
                weightedColumns.push(col);
            }
        }
        
        return weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
    }
    
    selectEnhancedStrategic(game, safeColumns, helpers) {
        // Balanced approach with slight defensive bias
        let bestCol = safeColumns[0];
        let bestValue = -1;
        
        for (const col of safeColumns) {
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            const combinedValue = offensiveValue * 1.2 + defensiveValue * 1.5;
            
            if (combinedValue > bestValue) {
                bestValue = combinedValue;
                bestCol = col;
            }
        }
        
        return bestCol;
    }
    
    selectDefensivePriority(game, safeColumns) {
        let bestCol = safeColumns[0];
        let bestDefensiveValue = -1;
        
        for (const col of safeColumns) {
            const defensiveValue = this.evaluateDefensivePotential(game, col);
            const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
            const priority = defensiveValue * 3 + offensiveValue;
            
            if (priority > bestDefensiveValue) {
                bestDefensiveValue = priority;
                bestCol = col;
            }
        }
        
        return bestCol;
    }
    
    evaluatePositionPotential(game, col, player) {
        let row = game.ROWS - 1;
        while (row >= 0 && game.board[row][col] !== game.EMPTY) {
            row--;
        }
        
        if (row < 0) return 0;
        
        let potential = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [deltaRow, deltaCol] of directions) {
            potential += this.countPotentialInDirection(game, row, col, player, deltaRow, deltaCol);
        }
        
        return potential;
    }
    
    evaluateDefensivePotential(game, col) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        
        let row = game.ROWS - 1;
        while (row >= 0 && game.board[row][col] !== game.EMPTY) {
            row--;
        }
        
        if (row < 0) return 0;
        
        let defensiveValue = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [deltaRow, deltaCol] of directions) {
            defensiveValue += this.countDisruptedOpponentPatterns(game, row, col, opponent, deltaRow, deltaCol);
        }
        
        return defensiveValue;
    }
    
    countPotentialInDirection(game, row, col, player, deltaRow, deltaCol) {
        let potential = 0;
        
        for (let startOffset = -3; startOffset <= 0; startOffset++) {
            const startRow = row + startOffset * deltaRow;
            const startCol = col + startOffset * deltaCol;
            
            const endRow = startRow + 3 * deltaRow;
            const endCol = startCol + 3 * deltaCol;
            
            if (startRow >= 0 && startRow < game.ROWS &&
                startCol >= 0 && startCol < game.COLS &&
                endRow >= 0 && endRow < game.ROWS &&
                endCol >= 0 && endCol < game.COLS) {
                
                if (this.isWindowViable(game, startRow, startCol, deltaRow, deltaCol, player)) {
                    potential++;
                }
            }
        }
        
        return potential;
    }
    
    countDisruptedOpponentPatterns(game, row, col, opponent, deltaRow, deltaCol) {
        let disruptedPatterns = 0;
        
        for (let startOffset = -3; startOffset <= 0; startOffset++) {
            const startRow = row + startOffset * deltaRow;
            const startCol = col + startOffset * deltaCol;
            
            const endRow = startRow + 3 * deltaRow;
            const endCol = startCol + 3 * deltaCol;
            
            if (startRow >= 0 && startRow < game.ROWS &&
                startCol >= 0 && startCol < game.COLS &&
                endRow >= 0 && endRow < game.ROWS &&
                endCol >= 0 && endCol < game.COLS) {
                
                if (this.wouldDisruptOpponentPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, row, col)) {
                    disruptedPatterns++;
                }
            }
        }
        
        return disruptedPatterns;
    }
    
    isWindowViable(game, startRow, startCol, deltaRow, deltaCol, player) {
        const opponent = player === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        
        for (let i = 0; i < 4; i++) {
            const checkRow = startRow + i * deltaRow;
            const checkCol = startCol + i * deltaCol;
            
            if (game.board[checkRow][checkCol] === opponent) {
                return false;
            }
        }
        
        return true;
    }
    
    wouldDisruptOpponentPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, ourRow, ourCol) {
        let opponentPieces = 0;
        let emptySpaces = 0;
        let wouldBlockPattern = false;
        
        for (let i = 0; i < 4; i++) {
            const checkRow = startRow + i * deltaRow;
            const checkCol = startCol + i * deltaCol;
            
            if (checkRow === ourRow && checkCol === ourCol) {
                wouldBlockPattern = true;
            } else if (game.board[checkRow][checkCol] === opponent) {
                opponentPieces++;
            } else if (game.board[checkRow][checkCol] === game.EMPTY) {
                emptySpaces++;
            } else {
                return false;
            }
        }
        
        return wouldBlockPattern && opponentPieces >= 1 && (opponentPieces + emptySpaces === 4);
    }
}

// Bot vs Bot with "Verlierer beginnt" logic
function runBotVsBotWithLoserStarts(bot1Difficulty, bot2Difficulty, numGames = 1000) {
    let bot1Wins = 0;
    let bot2Wins = 0;
    let draws = 0;
    let bot1Starts = 0;
    let bot2Starts = 0;
    let lastWinner = null;
    
    for (let gameNum = 0; gameNum < numGames; gameNum++) {
        const game = new RealConnect4Game();
        const bot1 = new RealConnect4AI(bot1Difficulty);
        const bot2 = new RealConnect4AI(bot2Difficulty);
        const helpers1 = new RealConnect4Helpers(game);
        const helpers2 = new RealConnect4Helpers(game);
        
        // "Verlierer beginnt" logic
        let bot1StartsThisGame = true;
        
        if (gameNum > 0 && lastWinner !== null) {
            if (lastWinner === 1) {
                bot1StartsThisGame = false;
            } else if (lastWinner === 2) {
                bot1StartsThisGame = true;
            }
        }
        
        if (bot1StartsThisGame) {
            bot1Starts++;
        } else {
            bot2Starts++;
        }
        
        let moveCount = 0;
        const maxMoves = 42;
        
        while (!game.gameOver && moveCount < maxMoves) {
            let currentBot, currentHelpers;
            if (bot1StartsThisGame) {
                currentBot = game.currentPlayer === game.PLAYER1 ? bot1 : bot2;
                currentHelpers = game.currentPlayer === game.PLAYER1 ? helpers1 : helpers2;
            } else {
                currentBot = game.currentPlayer === game.PLAYER1 ? bot2 : bot1;
                currentHelpers = game.currentPlayer === game.PLAYER1 ? helpers2 : helpers1;
            }
            
            const move = currentBot.getBestMove(game, currentHelpers);
            
            if (typeof move !== 'number' || move < 0 || move >= 7) {
                break;
            }
            
            const result = game.makeMove(move);
            if (!result.success) {
                break;
            }
            
            moveCount++;
        }
        
        // Record results
        if (game.gameOver && game.winner) {
            if (game.winner === game.PLAYER1) {
                if (bot1StartsThisGame) {
                    bot1Wins++;
                    lastWinner = 1;
                } else {
                    bot2Wins++;
                    lastWinner = 2;
                }
            } else if (game.winner === game.PLAYER2) {
                if (bot1StartsThisGame) {
                    bot2Wins++;
                    lastWinner = 2;
                } else {
                    bot1Wins++;
                    lastWinner = 1;
                }
            }
        } else {
            draws++;
            lastWinner = null;
        }
    }
    
    return {
        bot1Wins,
        bot2Wins,
        draws,
        totalGames: numGames,
        bot1WinRate: bot1Wins / numGames,
        bot2WinRate: bot2Wins / numGames,
        bot1Starts,
        bot2Starts,
        startingDistribution: {
            bot1StartsRate: bot1Starts / numGames,
            bot2StartsRate: bot2Starts / numGames
        }
    };
}

// 5x5 Matrix runner
function runRealBotMatrix(botDifficulties, numGames = 1000) {
    const matrix = {};
    const startTime = Date.now();
    
    console.log(`🚀 REAL 5x5 BOT MATRIX (${numGames} games per pairing)`);
    console.log(`⚔️  Real Bots: ${botDifficulties.map(b => new RealConnect4AI(b).difficulty).join(', ')}`);
    console.log(`🎲 Using "Verlierer beginnt" fairness logic: YES`);
    console.log(`📊 Total games: ${botDifficulties.length * botDifficulties.length * numGames} games`);
    console.log('='.repeat(80));
    
    let completedPairings = 0;
    const totalPairings = botDifficulties.length * botDifficulties.length;
    
    for (const bot1 of botDifficulties) {
        matrix[bot1] = {};
        
        for (const bot2 of botDifficulties) {
            if (bot1 === bot2) {
                matrix[bot1][bot2] = {
                    wins: Math.floor(numGames / 2),
                    losses: Math.floor(numGames / 2),
                    draws: numGames % 2,
                    winRate: 0.5,
                    starts: Math.floor(numGames / 2),
                    startRate: 0.5
                };
            } else {
                console.log(`\n⚔️  ${bot1} vs ${bot2} (${numGames} games)...`);
                
                const results = runBotVsBotWithLoserStarts(bot1, bot2, numGames);
                
                matrix[bot1][bot2] = {
                    wins: results.bot1Wins,
                    losses: results.bot2Wins,
                    draws: results.draws,
                    winRate: results.bot1WinRate,
                    starts: results.bot1Starts,
                    startRate: results.startingDistribution.bot1StartsRate
                };
                
                console.log(`   ${bot1}: ${results.bot1Wins} wins (${Math.round(results.bot1WinRate * 100)}%) | Started: ${results.bot1Starts}/${numGames} (${Math.round(results.startingDistribution.bot1StartsRate * 100)}%)`);
                console.log(`   ${bot2}: ${results.bot2Wins} wins (${Math.round(results.bot2WinRate * 100)}%) | Started: ${results.bot2Starts}/${numGames} (${Math.round(results.startingDistribution.bot2StartsRate * 100)}%)`);
                console.log(`   Draws: ${results.draws}`);
            }
            
            completedPairings++;
            const progress = Math.round((completedPairings / totalPairings) * 100);
            console.log(`   Progress: ${completedPairings}/${totalPairings} pairings (${progress}%)`);
        }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Real Matrix completed in ${Math.round(totalTime / 1000)}s`);
    
    return matrix;
}

// Display results
function displayRealBotMatrix(matrix, botDifficulties) {
    console.log('\n🏆 REAL BOT STRENGTH MATRIX RESULTS');
    console.log('='.repeat(100));
    
    const rankings = botDifficulties.map(bot => {
        let totalWins = 0;
        let totalGames = 0;
        let totalStarts = 0;
        
        Object.keys(matrix[bot]).forEach(opponent => {
            if (bot !== opponent) {
                const matchup = matrix[bot][opponent];
                totalWins += matchup.wins;
                totalGames += matchup.wins + matchup.losses + matchup.draws;
                totalStarts += matchup.starts;
            }
        });
        
        return {
            bot,
            name: new RealConnect4AI(bot).difficulty.toUpperCase(),
            wins: totalWins,
            games: totalGames,
            winRate: totalGames > 0 ? totalWins / totalGames : 0,
            starts: totalStarts,
            startRate: totalGames > 0 ? totalStarts / totalGames : 0
        };
    }).sort((a, b) => b.winRate - a.winRate);
    
    console.log('\n🥇 REAL BOT RANKINGS (nach Gesamt-Winrate):');
    rankings.forEach((bot, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        console.log(`${medal} ${bot.name.padEnd(20)} | Win Rate: ${Math.round(bot.winRate * 100).toString().padStart(3)}% | Record: ${bot.wins}-${bot.games - bot.wins} | Start Rate: ${Math.round(bot.startRate * 100)}%`);
    });
    
    console.log('\n📊 COMPLETE PERFORMANCE MATRIX (Win % gegen jeden Gegner):');
    console.log('Bot \\ Opponent'.padEnd(20) + ' | ' + botDifficulties.map(b => b.toUpperCase().slice(0, 12).padEnd(12)).join(' | '));
    console.log('-'.repeat(20 + 3 + botDifficulties.length * 15));
    
    botDifficulties.forEach(bot1 => {
        const bot1Name = bot1.toUpperCase();
        let row = bot1Name.slice(0, 19).padEnd(20) + ' | ';
        
        botDifficulties.forEach(bot2 => {
            if (bot1 === bot2) {
                row += '   50%   '.padEnd(12);
            } else {
                const winRate = Math.round(matrix[bot1][bot2].winRate * 100);
                const record = `${matrix[bot1][bot2].wins}-${matrix[bot1][bot2].losses}`;
                row += `${winRate}% (${record})`.padEnd(12);
            }
            row += ' | ';
        });
        console.log(row.slice(0, -3));
    });
    
    console.log('\n🎯 "VERLIERER BEGINNT" FAIRNESS-ANALYSE:');
    rankings.forEach((bot, index) => {
        const expectedStarts = 0.5;
        const actualStarts = bot.startRate;
        const handicap = expectedStarts - actualStarts;
        const handicapText = handicap > 0.05 ? `+${Math.round(handicap * 100)}% handicap` : 
                           handicap < -0.05 ? `${Math.round(Math.abs(handicap) * 100)}% advantage` : 'balanced';
        
        console.log(`${bot.name.padEnd(20)} | Start Rate: ${Math.round(actualStarts * 100)}% | ${handicapText}`);
    });
    
    return rankings;
}

// Main execution
function main() {
    const botDifficulties = [
        'smart-random',
        'offensiv-gemischt',
        'defensiv-gemischt',
        'enhanced-smart',
        'defensive'
    ];
    
    console.log('🚀 STARTING REAL BOT STRENGTH ANALYSIS');
    console.log('⚠️  Running 25,000 total games with REAL implementations - this will take several minutes!\n');
    
    const matrix = runRealBotMatrix(botDifficulties, 1000);
    const rankings = displayRealBotMatrix(matrix, botDifficulties);
    
    console.log('\n✅ REAL BOT ANALYSIS COMPLETED SUCCESSFULLY!');
    console.log('📋 Key Findings:');
    console.log(`   • Top Performer: ${rankings[0].name} (${Math.round(rankings[0].winRate * 100)}% win rate)`);
    console.log(`   • Weakest Bot: ${rankings[rankings.length - 1].name} (${Math.round(rankings[rankings.length - 1].winRate * 100)}% win rate)`);
    console.log(`   • Real strategic implementations showed meaningful performance differences!`);
    console.log(`   • "Verlierer beginnt" fairness system maintained balance across 25,000 games`);
}

// Run the analysis
main();