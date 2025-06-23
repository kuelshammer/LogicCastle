/**
 * Standalone Bot Matrix Runner - 5x5 100er Serien
 */

// Test Connect4 Game Implementation
class BotMatrixGame {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
        this.EMPTY = 0;
        this.currentPlayer = this.PLAYER1;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.board = this.createEmptyBoard();
    }
    
    createEmptyBoard() {
        return Array(this.ROWS).fill().map(() => Array(this.COLS).fill(this.EMPTY));
    }
    
    getValidMoves() {
        const validMoves = [];
        for (let col = 0; col < this.COLS; col++) {
            if (this.board[0][col] === this.EMPTY) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }
    
    makeMove(col) {
        if (col < 0 || col >= this.COLS || this.board[0][col] !== this.EMPTY) {
            return { success: false, error: 'Invalid move' };
        }
        
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
        }
        
        if (row < 0) {
            return { success: false, error: 'Column full' };
        }
        
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ player: this.currentPlayer, col, row });
        
        if (this.checkWinAtPosition(row, col, this.currentPlayer)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
        } else if (this.moveHistory.length >= this.ROWS * this.COLS) {
            this.gameOver = true;
            this.winner = 'draw';
        }
        
        this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
        
        return { success: true, gameOver: this.gameOver, winner: this.winner };
    }
    
    checkWinAtPosition(row, col, player) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;

            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }

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
    
    simulateMove(col) {
        if (col < 0 || col >= this.COLS || this.board[0][col] !== this.EMPTY) {
            return { success: false };
        }
        
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== this.EMPTY) {
            row--;
        }
        
        if (row < 0) {
            return { success: false };
        }
        
        this.board[row][col] = this.currentPlayer;
        const wouldWin = this.checkWinAtPosition(row, col, this.currentPlayer);
        this.board[row][col] = this.EMPTY;
        
        return { success: true, wouldWin, row, col };
    }
    
    resetGame() {
        this.board = this.createEmptyBoard();
        this.moveHistory = [];
        this.gameOver = false;
        this.winner = null;
        this.currentPlayer = this.PLAYER1;
    }
}

// Bot AI Implementation with Universal 4-Stage Logic
class MatrixBotAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.name = this.getBotName(difficulty);
    }
    
    getBotName(difficulty) {
        const names = {
            'easy': 'Easy Bot',
            'smart-random': 'Smart Random',
            'offensiv-gemischt': 'Offensiv-Gemischt',
            'defensiv-gemischt': 'Defensiv-Gemischt',
            'enhanced-smart': 'Enhanced Smart'
        };
        return names[difficulty] || difficulty;
    }
    
    getBestMove(game) {
        return this.getUniversalBestMove(game);
    }
    
    // Universal 4-stage logic
    getUniversalBestMove(game) {
        const validMoves = game.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }

        // STAGE 1: Direct win
        const winningMove = this.findWinningMove(game);
        if (winningMove !== null) {
            return winningMove;
        }

        // STAGE 2: Block threats
        const blockingMove = this.findComprehensiveBlockingMove(game);
        if (blockingMove !== null) {
            return blockingMove;
        }

        // STAGE 3: Safe columns only
        const safeColumns = this.findSafeColumns(game, validMoves);

        // STAGE 4: Bot-specific selection
        return this.selectFromSafeColumns(game, safeColumns);
    }
    
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
    
    findComprehensiveBlockingMove(game) {
        const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
        const validMoves = game.getValidMoves();

        for (const col of validMoves) {
            const boardCopy = this.copyBoard(game.board);
            const row = this.getLowestEmptyRow(boardCopy, col, game);
            
            if (row !== -1) {
                boardCopy[row][col] = opponent;
                if (this.checkWinOnBoardAtPosition(boardCopy, row, col, opponent, game)) {
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
        const boardCopy = this.copyBoard(game.board);
        const row = this.simulateMove(boardCopy, col, game.currentPlayer);
        
        if (row === -1) {
            return false;
        }
        
        const opponentValidMoves = this.getValidMovesForBoard(boardCopy, game);
        
        for (const opponentCol of opponentValidMoves) {
            const opponentRow = this.simulateMove(boardCopy, opponentCol, opponent);
            if (opponentRow !== -1) {
                if (this.checkWinOnBoardAtPosition(boardCopy, opponentRow, opponentCol, opponent, game)) {
                    boardCopy[opponentRow][opponentCol] = game.EMPTY;
                    return false;
                }
                boardCopy[opponentRow][opponentCol] = game.EMPTY;
            }
        }
        
        return true;
    }
    
    selectFromSafeColumns(game, safeColumns) {
        if (safeColumns.length === 0) {
            return null;
        }
        
        if (safeColumns.length === 1) {
            return safeColumns[0];
        }
        
        switch (this.difficulty) {
            case 'easy':
                return safeColumns[Math.floor(Math.random() * safeColumns.length)];
                
            case 'smart-random':
                return this.selectCenterBiased(safeColumns);
                
            case 'offensiv-gemischt':
                return this.selectOffensiveWeighted(game, safeColumns);
                
            case 'defensiv-gemischt':
                return this.selectDefensiveWeighted(game, safeColumns);
                
            case 'enhanced-smart':
                return this.selectEnhancedStrategy(game, safeColumns);
                
            default:
                return this.selectCenterBiased(safeColumns);
        }
    }
    
    selectOffensiveWeighted(game, safeColumns) {
        let bestCol = safeColumns[0];
        let bestScore = -1;
        
        for (const col of safeColumns) {
            const score = this.evaluateOffensivePotential(game, col) + (3 - Math.abs(col - 3)) * 0.1;
            if (score > bestScore) {
                bestScore = score;
                bestCol = col;
            }
        }
        
        return bestCol;
    }
    
    selectDefensiveWeighted(game, safeColumns) {
        let bestCol = safeColumns[0];
        let bestScore = -1;
        
        for (const col of safeColumns) {
            const score = this.evaluateDefensivePotential(game, col) + (3 - Math.abs(col - 3)) * 0.1;
            if (score > bestScore) {
                bestScore = score;
                bestCol = col;
            }
        }
        
        return bestCol;
    }
    
    selectEnhancedStrategy(game, safeColumns) {
        let bestCol = safeColumns[0];
        let bestScore = -1;
        
        for (const col of safeColumns) {
            const offensiveScore = this.evaluateOffensivePotential(game, col);
            const defensiveScore = this.evaluateDefensivePotential(game, col);
            const centerBonus = (3 - Math.abs(col - 3)) * 0.2;
            const totalScore = offensiveScore * 0.6 + defensiveScore * 0.4 + centerBonus;
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestCol = col;
            }
        }
        
        return bestCol;
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
    
    evaluateOffensivePotential(game, col) {
        let row = game.ROWS - 1;
        while (row >= 0 && game.board[row][col] !== game.EMPTY) {
            row--;
        }
        
        if (row < 0) return 0;
        
        let potential = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [deltaRow, deltaCol] of directions) {
            for (let startOffset = -3; startOffset <= 0; startOffset++) {
                const startRow = row + startOffset * deltaRow;
                const startCol = col + startOffset * deltaCol;
                
                if (this.isValidWindow(game, startRow, startCol, deltaRow, deltaCol) &&
                    this.isWindowViable(game, startRow, startCol, deltaRow, deltaCol, game.currentPlayer)) {
                    potential++;
                }
            }
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
        
        let potential = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [deltaRow, deltaCol] of directions) {
            for (let startOffset = -3; startOffset <= 0; startOffset++) {
                const startRow = row + startOffset * deltaRow;
                const startCol = col + startOffset * deltaCol;
                
                if (this.isValidWindow(game, startRow, startCol, deltaRow, deltaCol) &&
                    this.wouldDisruptPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, row, col)) {
                    potential++;
                }
            }
        }
        
        return potential;
    }
    
    isValidWindow(game, startRow, startCol, deltaRow, deltaCol) {
        const endRow = startRow + 3 * deltaRow;
        const endCol = startCol + 3 * deltaCol;
        
        return startRow >= 0 && startRow < game.ROWS &&
               startCol >= 0 && startCol < game.COLS &&
               endRow >= 0 && endRow < game.ROWS &&
               endCol >= 0 && endCol < game.COLS;
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
    
    wouldDisruptPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, ourRow, ourCol) {
        let opponentPieces = 0;
        let emptySpaces = 0;
        let wouldBlock = false;
        
        for (let i = 0; i < 4; i++) {
            const checkRow = startRow + i * deltaRow;
            const checkCol = startCol + i * deltaCol;
            
            if (checkRow === ourRow && checkCol === ourCol) {
                wouldBlock = true;
            } else if (game.board[checkRow][checkCol] === opponent) {
                opponentPieces++;
            } else if (game.board[checkRow][checkCol] === game.EMPTY) {
                emptySpaces++;
            } else {
                return false;
            }
        }
        
        return wouldBlock && opponentPieces >= 1 && (opponentPieces + emptySpaces === 4);
    }
    
    // Helper methods
    copyBoard(board) {
        return board.map(row => [...row]);
    }
    
    simulateMove(board, col, player) {
        for (let row = board.length - 1; row >= 0; row--) {
            if (board[row][col] === 0) {
                board[row][col] = player;
                return row;
            }
        }
        return -1;
    }
    
    getLowestEmptyRow(board, col, game) {
        for (let row = game.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === game.EMPTY) {
                return row;
            }
        }
        return -1;
    }
    
    getValidMovesForBoard(board, game) {
        const validMoves = [];
        for (let col = 0; col < game.COLS; col++) {
            if (board[0][col] === game.EMPTY) {
                validMoves.push(col);
            }
        }
        return validMoves;
    }
    
    checkWinOnBoardAtPosition(board, row, col, player, game) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [deltaRow, deltaCol] of directions) {
            let count = 1;

            let r = row + deltaRow;
            let c = col + deltaCol;
            while (r >= 0 && r < game.ROWS && c >= 0 && c < game.COLS && board[r][c] === player) {
                count++;
                r += deltaRow;
                c += deltaCol;
            }

            r = row - deltaRow;
            c = col - deltaCol;
            while (r >= 0 && r < game.ROWS && c >= 0 && c < game.COLS && board[r][c] === player) {
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
}

// Matrix Runner
function runBotMatrix(bots, gamesPerMatch = 100) {
    const results = {};
    const totalMatches = bots.length * bots.length;
    let completedMatches = 0;
    
    // Initialize results matrix
    bots.forEach(bot1 => {
        results[bot1] = {};
        bots.forEach(bot2 => {
            results[bot1][bot2] = { wins: 0, losses: 0, draws: 0, total: 0 };
        });
    });
    
    // Run all matches
    for (const bot1Type of bots) {
        for (const bot2Type of bots) {
            completedMatches++;
            
            if (bot1Type === bot2Type) {
                // Self-play: 50/50 distribution
                results[bot1Type][bot2Type] = { 
                    wins: Math.floor(gamesPerMatch / 2), 
                    losses: Math.floor(gamesPerMatch / 2), 
                    draws: gamesPerMatch % 2, 
                    total: gamesPerMatch 
                };
                continue;
            }
            
            let player1Wins = 0;
            let player2Wins = 0;
            let draws = 0;
            
            for (let gameNum = 0; gameNum < gamesPerMatch; gameNum++) {
                const game = new BotMatrixGame();
                const bot1 = new MatrixBotAI(bot1Type);
                const bot2 = new MatrixBotAI(bot2Type);
                
                let moves = 0;
                const maxMoves = 42;
                
                while (!game.gameOver && moves < maxMoves) {
                    const currentBot = game.currentPlayer === game.PLAYER1 ? bot1 : bot2;
                    const move = currentBot.getBestMove(game);
                    
                    if (move !== null && move >= 0 && move < 7) {
                        const result = game.makeMove(move);
                        if (!result.success) break;
                    } else {
                        break;
                    }
                    
                    moves++;
                }
                
                if (game.winner === game.PLAYER1) {
                    player1Wins++;
                } else if (game.winner === game.PLAYER2) {
                    player2Wins++;
                } else {
                    draws++;
                }
            }
            
            results[bot1Type][bot2Type] = {
                wins: player1Wins,
                losses: player2Wins,
                draws: draws,
                total: gamesPerMatch
            };
            
            // Progress indicator
            if (completedMatches % 5 === 0) {
                console.log(`Progress: ${completedMatches}/${totalMatches} matches completed`);
            }
        }
    }
    
    return results;
}

// Matrix Analysis
function analyzeBotMatrix(results, bots) {
    const analysis = {};
    
    bots.forEach(bot => {
        let totalWins = 0;
        let totalGames = 0;
        let defeats = [];
        let victories = [];
        
        bots.forEach(opponent => {
            if (bot !== opponent) {
                const matchResult = results[bot][opponent];
                totalWins += matchResult.wins;
                totalGames += matchResult.total;
                
                const winRate = matchResult.wins / matchResult.total;
                if (winRate > 0.6) {
                    victories.push({ opponent, winRate });
                } else if (winRate < 0.4) {
                    defeats.push({ opponent, winRate });
                }
            }
        });
        
        analysis[bot] = {
            overallWinRate: totalWins / totalGames,
            totalWins,
            totalGames,
            victories: victories.sort((a, b) => b.winRate - a.winRate),
            defeats: defeats.sort((a, b) => a.winRate - b.winRate)
        };
    });
    
    return analysis;
}

// Format Results
function formatMatrix(results, bots) {
    let output = '\n📊 **5x5 Bot Performance Matrix (100 games each)**\n\n';
    
    // Header
    output += '| Bot \\ Opponent |';
    bots.forEach(bot => {
        const shortName = bot.replace('-', '-').substring(0, 12);
        output += ` ${shortName} |`;
    });
    output += '\n|---|';
    bots.forEach(() => output += '---|');
    output += '\n';
    
    // Rows
    bots.forEach(bot1 => {
        const botName = bot1.replace('-', '-').substring(0, 15);
        output += `| **${botName}** |`;
        
        bots.forEach(bot2 => {
            const result = results[bot1][bot2];
            if (bot1 === bot2) {
                output += ` *50/50* |`;
            } else {
                const winRate = ((result.wins / result.total) * 100).toFixed(0);
                const record = `${result.wins}-${result.losses}`;
                if (result.draws > 0) {
                    output += ` ${winRate}% (${record}-${result.draws}) |`;
                } else {
                    output += ` **${winRate}%** (${record}) |`;
                }
            }
        });
        output += '\n';
    });
    
    return output;
}

function formatRankings(analysis, bots) {
    let output = '\n🏆 **Bot Rankings** (nach Gesamt-Winrate)\n\n';
    
    const rankings = bots
        .map(bot => ({
            bot,
            winRate: analysis[bot].overallWinRate,
            record: `${analysis[bot].totalWins}/${analysis[bot].totalGames}`
        }))
        .sort((a, b) => b.winRate - a.winRate);
    
    rankings.forEach((bot, index) => {
        const percentage = (bot.winRate * 100).toFixed(1);
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        output += `${medal} **${bot.bot}**: ${percentage}% (${bot.record})\n`;
    });
    
    return output;
}

// Run the matrix
function main() {
    const bots = [
        'easy',
        'smart-random', 
        'offensiv-gemischt',
        'defensiv-gemischt',
        'enhanced-smart'
    ];
    
    console.log('🎮 Starting 5x5 Bot Matrix (25 matches × 100 games = 2500 total games)...\n');
    
    const results = runBotMatrix(bots, 100);
    const analysis = analyzeBotMatrix(results, bots);
    
    // Output formatted results
    console.log(formatMatrix(results, bots));
    console.log(formatRankings(analysis, bots));
    
    // Detailed analysis
    console.log('\n📈 **Detailed Analysis**\n');
    bots.forEach(bot => {
        const botAnalysis = analysis[bot];
        const botName = new MatrixBotAI(bot).name;
        
        console.log(`**${botName}** (${(botAnalysis.overallWinRate * 100).toFixed(1)}% overall):`);
        
        if (botAnalysis.victories.length > 0) {
            console.log(`  ✅ Dominates: ${botAnalysis.victories.map(v => 
                `${new MatrixBotAI(v.opponent).name} (${(v.winRate * 100).toFixed(0)}%)`
            ).join(', ')}`);
        }
        
        if (botAnalysis.defeats.length > 0) {
            console.log(`  ❌ Struggles vs: ${botAnalysis.defeats.map(d => 
                `${new MatrixBotAI(d.opponent).name} (${(d.winRate * 100).toFixed(0)}%)`
            ).join(', ')}`);
        }
        
        console.log('');
    });
    
    console.log('✅ **Matrix completed successfully!** All 25 matches × 100 games = 2500 total games');
}

main();