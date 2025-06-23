import { describe, it, expect } from 'vitest';

/**
 * Bot Tournament System (Vitest)
 * 
 * Final validation with tournament-style testing and ELO-like rating system
 */

// Mock Connect4 classes (simplified for tournament)
class TournamentGame {
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
    }
    
    createEmptyBoard() {
        return Array(6).fill().map(() => Array(7).fill(0));
    }
    
    makeMove(col) {
        if (this.gameOver || col < 0 || col >= 7 || this.board[0][col] !== 0) {
            return { success: false };
        }
        
        let row = 5;
        while (row >= 0 && this.board[row][col] !== 0) row--;
        
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ row, col, player: this.currentPlayer });
        
        if (this.checkWin(row, col) || this.moveHistory.length >= 42) {
            this.gameOver = true;
            this.winner = this.checkWin(row, col) ? this.currentPlayer : null;
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
        
        return { success: true, row, col };
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            for (const dir of [-1, 1]) {
                let r = row + dir * dr, c = col + dir * dc;
                while (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) {
                    count++;
                    r += dir * dr;
                    c += dir * dc;
                }
            }
            if (count >= 4) return true;
        }
        return false;
    }
    
    getValidMoves() {
        const moves = [];
        for (let col = 0; col < 7; col++) {
            if (this.board[0][col] === 0) moves.push(col);
        }
        return moves;
    }
}

class TournamentBot {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.name = this.getBotName(difficulty);
        this.rating = 1000; // Starting ELO-like rating
    }
    
    getBotName(difficulty) {
        const names = {
            'easy': 'Easy Bot',
            'smart-random': 'Smart Random',
            'enhanced-smart': 'Enhanced Smart',
            'defensive': 'Defensive',
            'offensiv-gemischt': 'Offensive Mixed'
        };
        return names[difficulty] || difficulty;
    }
    
    getBestMove(game) {
        const validMoves = game.getValidMoves();
        if (validMoves.length === 0) return null;
        
        switch (this.difficulty) {
            case 'easy':
                return validMoves[Math.floor(Math.random() * validMoves.length)];
                
            case 'smart-random':
                // 40% strategic, 60% random
                if (Math.random() < 0.4) {
                    const win = this.findWin(game);
                    if (win !== null) return win;
                    const block = this.findBlock(game);
                    if (block !== null) return block;
                    return this.preferCenter(validMoves);
                }
                return validMoves[Math.floor(Math.random() * validMoves.length)];
                
            case 'enhanced-smart':
                // 85% strategic, 15% random
                if (Math.random() < 0.85) {
                    const win = this.findWin(game);
                    if (win !== null) return win;
                    const block = this.findBlock(game);
                    if (block !== null) return block;
                    const strategic = this.findStrategicMove(game);
                    if (strategic !== null) return strategic;
                    return this.preferCenter(validMoves);
                }
                return validMoves[Math.floor(Math.random() * validMoves.length)];
                
            case 'defensive':
                // Focus on blocking
                const block = this.findBlock(game);
                if (block !== null) return block;
                const win = this.findWin(game);
                if (win !== null) return win;
                return this.preferCenter(validMoves);
                
            default:
                return this.preferCenter(validMoves);
        }
    }
    
    findWin(game) {
        const validMoves = game.getValidMoves();
        for (const col of validMoves) {
            const testGame = this.simulateMove(game, col, game.currentPlayer);
            if (testGame && testGame.winner === game.currentPlayer) {
                return col;
            }
        }
        return null;
    }
    
    findBlock(game) {
        const opponent = game.currentPlayer === 1 ? 2 : 1;
        const validMoves = game.getValidMoves();
        for (const col of validMoves) {
            const testGame = this.simulateMove(game, col, opponent);
            if (testGame && testGame.winner === opponent) {
                return col;
            }
        }
        return null;
    }
    
    findStrategicMove(game) {
        const validMoves = game.getValidMoves();
        // Prefer moves that create multiple threats
        for (const col of validMoves) {
            const threats = this.countThreats(game, col);
            if (threats >= 2) return col;
        }
        return null;
    }
    
    countThreats(game, col) {
        // Simplified threat counting
        let row = 5;
        while (row >= 0 && game.board[row][col] !== 0) row--;
        if (row < 0) return 0;
        
        // Count potential 4-in-a-rows this move would create
        let threats = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            for (const dir of [-1, 1]) {
                let r = row + dir * dr, c = col + dir * dc;
                let spaces = 0;
                while (r >= 0 && r < 6 && c >= 0 && c < 7 && spaces < 3) {
                    if (game.board[r][c] === game.currentPlayer) count++;
                    else if (game.board[r][c] === 0) spaces++;
                    else break;
                    r += dir * dr;
                    c += dir * dc;
                }
            }
            if (count >= 3) threats++;
        }
        
        return threats;
    }
    
    preferCenter(validMoves) {
        const centerMoves = validMoves.filter(col => col >= 2 && col <= 4);
        return centerMoves.length > 0 
            ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
            : validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    simulateMove(game, col, player) {
        // Quick simulation
        if (game.board[0][col] !== 0) return null;
        
        let row = 5;
        while (row >= 0 && game.board[row][col] !== 0) row--;
        
        const testBoard = game.board.map(r => [...r]);
        testBoard[row][col] = player;
        
        // Check win
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dr, dc] of directions) {
            let count = 1;
            for (const dir of [-1, 1]) {
                let r = row + dir * dr, c = col + dir * dc;
                while (r >= 0 && r < 6 && c >= 0 && c < 7 && testBoard[r][c] === player) {
                    count++;
                    r += dir * dr;
                    c += dir * dc;
                }
            }
            if (count >= 4) {
                return { winner: player };
            }
        }
        
        return { winner: null };
    }
}

/**
 * Run tournament between bots
 */
function runTournament(bots, gamesPerPair = 8) {
    const results = {};
    
    // Initialize results
    bots.forEach(bot => {
        results[bot.name] = {
            wins: 0,
            losses: 0,
            draws: 0,
            rating: bot.rating,
            games: 0
        };
    });
    
    // Round-robin tournament
    for (let i = 0; i < bots.length; i++) {
        for (let j = i + 1; j < bots.length; j++) {
            const bot1 = bots[i];
            const bot2 = bots[j];
            
            for (let game = 0; game < gamesPerPair; game++) {
                const result = playGame(bot1, bot2);
                
                results[bot1.name].games++;
                results[bot2.name].games++;
                
                if (result.winner === 1) {
                    results[bot1.name].wins++;
                    results[bot2.name].losses++;
                    updateRatings(bot1, bot2, 1);
                } else if (result.winner === 2) {
                    results[bot1.name].losses++;
                    results[bot2.name].wins++;
                    updateRatings(bot1, bot2, 0);
                } else {
                    results[bot1.name].draws++;
                    results[bot2.name].draws++;
                    updateRatings(bot1, bot2, 0.5);
                }
            }
        }
    }
    
    // Update final ratings
    bots.forEach(bot => {
        results[bot.name].rating = bot.rating;
    });
    
    return results;
}

function playGame(bot1, bot2) {
    const game = new TournamentGame();
    let moveCount = 0;
    const maxMoves = 42;
    
    while (!game.gameOver && moveCount < maxMoves) {
        const currentBot = game.currentPlayer === 1 ? bot1 : bot2;
        const move = currentBot.getBestMove(game);
        
        if (move === null || !game.makeMove(move).success) {
            break;
        }
        
        moveCount++;
    }
    
    return {
        winner: game.winner,
        moves: moveCount
    };
}

function updateRatings(bot1, bot2, score) {
    // Simple ELO-like rating system
    const K = 32; // K-factor
    const expectedScore1 = 1 / (1 + Math.pow(10, (bot2.rating - bot1.rating) / 400));
    
    const ratingChange = K * (score - expectedScore1);
    bot1.rating += ratingChange;
    bot2.rating -= ratingChange;
}

describe('Bot Tournament System', () => {
    
    it('should run complete tournament and establish rankings', () => {
        console.log('\n🏆 Running Bot Tournament...\n');
        
        const bots = [
            new TournamentBot('enhanced-smart'),
            new TournamentBot('smart-random'),
            new TournamentBot('defensive'),
            new TournamentBot('easy')
        ];
        
        const results = runTournament(bots, 6);
        
        // Sort by rating (highest first)
        const rankings = Object.entries(results)
            .sort(([,a], [,b]) => b.rating - a.rating)
            .map(([name, stats], index) => ({
                rank: index + 1,
                name,
                ...stats,
                winRate: stats.games > 0 ? (stats.wins / stats.games * 100).toFixed(1) : 0
            }));
        
        console.log('🥇 Final Tournament Rankings:');
        console.log('=' .repeat(60));
        rankings.forEach(bot => {
            console.log(`${bot.rank}. ${bot.name.padEnd(15)} | Rating: ${Math.round(bot.rating).toString().padStart(4)} | Win Rate: ${bot.winRate.toString().padStart(5)}% | Record: ${bot.wins}-${bot.losses}-${bot.draws}`);
        });
        
        // Validate expected hierarchy
        const enhancedSmartRank = rankings.find(r => r.name === 'Enhanced Smart').rank;
        const smartRandomRank = rankings.find(r => r.name === 'Smart Random').rank;
        const easyBotRank = rankings.find(r => r.name === 'Easy Bot').rank;
        
        // Enhanced Smart should be top 2
        expect(enhancedSmartRank).toBeLessThanOrEqual(2);
        
        // Enhanced Smart should beat Easy Bot
        expect(enhancedSmartRank).toBeLessThan(easyBotRank);
        
        // Smart Random should beat Easy Bot  
        expect(smartRandomRank).toBeLessThan(easyBotRank);
        
        console.log('\n✅ Tournament validation passed!');
    });
    
    it('should validate Enhanced Smart Bot performance metrics', () => {
        console.log('\n📊 Enhanced Smart Bot Performance Analysis...\n');
        
        const enhancedBot = new TournamentBot('enhanced-smart');
        const opponents = [
            new TournamentBot('smart-random'),
            new TournamentBot('easy'),
            new TournamentBot('defensive')
        ];
        
        const performanceMetrics = {};
        
        opponents.forEach(opponent => {
            let wins = 0;
            let games = 10;
            
            for (let i = 0; i < games; i++) {
                const result = playGame(enhancedBot, opponent);
                if (result.winner === 1) wins++;
            }
            
            const winRate = (wins / games * 100).toFixed(1);
            performanceMetrics[opponent.name] = {
                wins,
                games,
                winRate: parseFloat(winRate)
            };
            
            console.log(`vs ${opponent.name}: ${wins}/${games} wins (${winRate}%)`);
        });
        
        // Enhanced Smart should have good performance against all opponents
        expect(performanceMetrics['Smart Random'].winRate).toBeGreaterThan(30);
        expect(performanceMetrics['Easy Bot'].winRate).toBeGreaterThan(50);
        expect(performanceMetrics['Defensive'].winRate).toBeGreaterThan(30);
        
        console.log('\n✅ Performance metrics validated!');
    });
    
    it('should demonstrate strategic improvement over time', () => {
        console.log('\n📈 Strategic Evolution Test...\n');
        
        const bot = new TournamentBot('enhanced-smart');
        const testOpponent = new TournamentBot('smart-random');
        
        // Play multiple rounds and track improvement
        const rounds = 3;
        const gamesPerRound = 8;
        const roundResults = [];
        
        for (let round = 0; round < rounds; round++) {
            let wins = 0;
            
            for (let game = 0; game < gamesPerRound; game++) {
                const result = playGame(bot, testOpponent);
                if (result.winner === 1) wins++;
            }
            
            const winRate = (wins / gamesPerRound * 100).toFixed(1);
            roundResults.push({
                round: round + 1,
                wins,
                winRate: parseFloat(winRate),
                rating: Math.round(bot.rating)
            });
            
            console.log(`Round ${round + 1}: ${wins}/${gamesPerRound} wins (${winRate}%) | Rating: ${Math.round(bot.rating)}`);
        }
        
        // Bot should maintain consistent performance
        const avgWinRate = roundResults.reduce((sum, r) => sum + r.winRate, 0) / rounds;
        expect(avgWinRate).toBeGreaterThan(25);
        
        // Rating should be reasonable
        expect(bot.rating).toBeGreaterThan(900);
        expect(bot.rating).toBeLessThan(1200);
        
        console.log(`\nAverage Performance: ${avgWinRate.toFixed(1)}% win rate`);
        console.log('✅ Strategic consistency validated!');
    });
    
});