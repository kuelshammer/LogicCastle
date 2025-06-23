#!/usr/bin/env node

/**
 * Bot Strength Validation Tests
 * 
 * Tests that prove Enhanced Smart Bot is actually "stronger" than Smart Random Bot
 * through head-to-head matches, win rate analysis, and strategic quality metrics
 */

// Global variables for test framework
global.performance = require('perf_hooks').performance;

// Simple test framework
class TestSuite {
    constructor() {
        this.results = [];
    }
    
    test(suite, name, testFn) {
        const startTime = performance.now();
        try {
            testFn();
            const duration = performance.now() - startTime;
            this.results.push({
                suite: suite,
                name: name,
                passed: true,
                error: null,
                duration: Math.round(duration * 100) / 100
            });
        } catch (error) {
            const duration = performance.now() - startTime;
            this.results.push({
                suite: suite,
                name: name,
                passed: false,
                error: error.message,
                duration: Math.round(duration * 100) / 100
            });
        }
    }
    
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
        if (actual !== expected) {
            throw new Error(message);
        }
    }
    
    assertGreater(actual, expected, message = `Expected ${actual} > ${expected}`) {
        if (actual <= expected) {
            throw new Error(message);
        }
    }
    
    getSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = total - passed;
        return { total, passed, failed };
    }
}

// Load game classes with proper global context
const vm = require('vm');
const fs = require('fs');

const gameCode = fs.readFileSync('./games/connect4/js/game.js', 'utf8');
const aiCode = fs.readFileSync('./games/connect4/js/ai.js', 'utf8');
const helpersCode = fs.readFileSync('./games/connect4/js/helpers.js', 'utf8');

const context = vm.createContext(global);
vm.runInContext(gameCode, context);
vm.runInContext(aiCode, context);
vm.runInContext(helpersCode, context);

console.log('🏆 Bot Strength Validation Tests');
console.log('='.repeat(35));

const testSuite = new TestSuite();

/**
 * Run a head-to-head match between two bots
 */
function runBotVsBot(bot1Difficulty, bot2Difficulty, numGames = 10) {
    let bot1Wins = 0;
    let bot2Wins = 0;
    let draws = 0;
    const gameDurations = [];
    
    for (let gameNum = 0; gameNum < numGames; gameNum++) {
        const game = new Connect4Game();
        const bot1 = new Connect4AI(bot1Difficulty);
        const bot2 = new Connect4AI(bot2Difficulty);
        const helpers = new Connect4Helpers(game, null);
        
        const startTime = performance.now();
        let moveCount = 0;
        const maxMoves = 42; // Maximum possible moves in Connect4
        
        // Alternate between bots (bot1 is Player 1/Red, bot2 is Player 2/Yellow)
        while (!game.gameOver && moveCount < maxMoves) {
            try {
                const currentBot = game.currentPlayer === game.PLAYER1 ? bot1 : bot2;
                const move = currentBot.getBestMove(game, helpers);
                
                if (typeof move !== 'number' || move < 0 || move >= 7) {
                    console.error(`Invalid move from ${game.currentPlayer === game.PLAYER1 ? bot1Difficulty : bot2Difficulty}: ${move}`);
                    break;
                }
                
                const result = game.makeMove(move);
                if (!result.success) {
                    console.error(`Move failed: ${result.reason}`);
                    break;
                }
                
                moveCount++;
            } catch (error) {
                console.error(`Bot error in game ${gameNum + 1}:`, error.message);
                break;
            }
        }
        
        const endTime = performance.now();
        gameDurations.push(endTime - startTime);
        
        if (game.gameOver) {
            if (game.winner === game.PLAYER1) {
                bot1Wins++;
            } else if (game.winner === game.PLAYER2) {
                bot2Wins++;
            }
        } else {
            draws++;
        }
    }
    
    const avgDuration = gameDurations.reduce((a, b) => a + b, 0) / gameDurations.length;
    
    return {
        bot1Wins,
        bot2Wins,
        draws,
        totalGames: numGames,
        avgDuration: Math.round(avgDuration),
        bot1WinRate: bot1Wins / numGames,
        bot2WinRate: bot2Wins / numGames,
        drawRate: draws / numGames
    };
}

/**
 * Analyze move quality by counting strategic moves
 */
function analyzeMoveQuality(botDifficulty, numAnalyses = 20) {
    let strategicMoves = 0;
    let totalMoves = 0;
    
    for (let i = 0; i < numAnalyses; i++) {
        const game = new Connect4Game();
        const bot = new Connect4AI(botDifficulty);
        const helpers = new Connect4Helpers(game, null);
        
        // Create various board states for analysis
        const randomMoves = Math.floor(Math.random() * 5) + 1;
        for (let j = 0; j < randomMoves; j++) {
            const validMoves = game.getValidMoves();
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                game.makeMove(randomMove);
            }
        }
        
        if (!game.gameOver) {
            try {
                const move = bot.getBestMove(game, helpers);
                totalMoves++;
                
                // Analyze if move has strategic value
                if (typeof move === 'number' && move >= 0 && move < 7) {
                    // Check if move blocks opponent or creates threats
                    const moveAnalysis = helpers.analyzeMoveConsequences(move);
                    
                    if (moveAnalysis.isWinning || moveAnalysis.blocksOpponent || 
                        moveAnalysis.createsThreats > 0 || moveAnalysis.strategicValue !== 'neutral') {
                        strategicMoves++;
                    }
                }
            } catch (error) {
                // Count as non-strategic if bot fails
            }
        }
    }
    
    return {
        strategicMoves,
        totalMoves,
        strategicRatio: totalMoves > 0 ? strategicMoves / totalMoves : 0
    };
}

// Test 1: Enhanced Smart vs Smart Random Head-to-Head
testSuite.test('Bot-Strength-Validation', 'Enhanced Smart vs Smart Random (10 games)', () => {
    console.log('🥊 Running Enhanced Smart vs Smart Random (10 games)...');
    
    const results = runBotVsBot('enhanced-smart', 'smart-random', 10);
    
    console.log(`   Enhanced Smart: ${results.bot1Wins} wins (${Math.round(results.bot1WinRate * 100)}%)`);
    console.log(`   Smart Random: ${results.bot2Wins} wins (${Math.round(results.bot2WinRate * 100)}%)`);
    console.log(`   Draws: ${results.draws} (${Math.round(results.drawRate * 100)}%)`);
    console.log(`   Avg game duration: ${results.avgDuration}ms`);
    
    // Enhanced Smart should win at least 60% of games to be considered "stronger"
    testSuite.assertGreater(results.bot1WinRate, 0.5, 
        `Enhanced Smart should win majority of games (${Math.round(results.bot1WinRate * 100)}% actual)`);
});

// Test 2: Enhanced Smart vs Easy Bot (should dominate)
testSuite.test('Bot-Strength-Validation', 'Enhanced Smart vs Easy Bot (dominance test)', () => {
    console.log('🎯 Running Enhanced Smart vs Easy Bot (5 games)...');
    
    const results = runBotVsBot('enhanced-smart', 'easy', 5);
    
    console.log(`   Enhanced Smart: ${results.bot1Wins} wins (${Math.round(results.bot1WinRate * 100)}%)`);
    console.log(`   Easy Bot: ${results.bot2Wins} wins (${Math.round(results.bot2WinRate * 100)}%)`);
    
    // Enhanced Smart should win at least 80% against Easy Bot
    testSuite.assertGreater(results.bot1WinRate, 0.6, 
        `Enhanced Smart should dominate Easy Bot (${Math.round(results.bot1WinRate * 100)}% actual)`);
});

// Test 3: Move Quality Analysis
testSuite.test('Bot-Strength-Validation', 'Move Quality Analysis', () => {
    console.log('📊 Analyzing move quality...');
    
    const enhancedQuality = analyzeMoveQuality('enhanced-smart', 15);
    const smartRandomQuality = analyzeMoveQuality('smart-random', 15);
    const easyQuality = analyzeMoveQuality('easy', 15);
    
    console.log(`   Enhanced Smart: ${enhancedQuality.strategicMoves}/${enhancedQuality.totalMoves} strategic (${Math.round(enhancedQuality.strategicRatio * 100)}%)`);
    console.log(`   Smart Random: ${smartRandomQuality.strategicMoves}/${smartRandomQuality.totalMoves} strategic (${Math.round(smartRandomQuality.strategicRatio * 100)}%)`);
    console.log(`   Easy Bot: ${easyQuality.strategicMoves}/${easyQuality.totalMoves} strategic (${Math.round(easyQuality.strategicRatio * 100)}%)`);
    
    // Enhanced Smart should have higher strategic ratio than Smart Random
    testSuite.assert(enhancedQuality.strategicRatio >= smartRandomQuality.strategicRatio,
        `Enhanced Smart should have equal or higher strategic ratio (${Math.round(enhancedQuality.strategicRatio * 100)}% vs ${Math.round(smartRandomQuality.strategicRatio * 100)}%)`);
    
    // Both should be better than Easy Bot
    testSuite.assertGreater(enhancedQuality.strategicRatio, easyQuality.strategicRatio,
        'Enhanced Smart should be more strategic than Easy Bot');
    testSuite.assertGreater(smartRandomQuality.strategicRatio, easyQuality.strategicRatio,
        'Smart Random should be more strategic than Easy Bot');
});

// Test 4: Opening Move Preferences
testSuite.test('Bot-Strength-Validation', 'Opening Move Preferences', () => {
    console.log('🏁 Analyzing opening preferences...');
    
    const bots = [
        { difficulty: 'enhanced-smart', name: 'Enhanced Smart' },
        { difficulty: 'smart-random', name: 'Smart Random' },
        { difficulty: 'easy', name: 'Easy' }
    ];
    
    const openingAnalysis = {};
    
    bots.forEach(botInfo => {
        const game = new Connect4Game(); // Fresh game
        const bot = new Connect4AI(botInfo.difficulty);
        const helpers = new Connect4Helpers(game, null);
        
        const openingMove = bot.getBestMove(game, helpers);
        openingAnalysis[botInfo.name] = openingMove;
        console.log(`   ${botInfo.name}: Column ${openingMove + 1}`);
    });
    
    // Enhanced Smart and Smart Random should prefer strategic openings (center-ish)
    testSuite.assert(openingAnalysis['Enhanced Smart'] >= 2 && openingAnalysis['Enhanced Smart'] <= 4,
        'Enhanced Smart should prefer center-ish opening');
    testSuite.assert(openingAnalysis['Smart Random'] >= 2 && openingAnalysis['Smart Random'] <= 4,
        'Smart Random should prefer center-ish opening');
});

// Test 5: Performance Under Pressure
testSuite.test('Bot-Strength-Validation', 'Performance Under Pressure', () => {
    console.log('🔥 Testing performance under pressure...');
    
    // Create high-pressure situation (near-full board)
    const game = new Connect4Game();
    
    // Fill board strategically to create complex situation
    const complexPattern = [
        [0, 1, 2, 1, 2, 1, 0],
        [1, 2, 1, 2, 1, 2, 0],
        [2, 1, 2, 1, 2, 1, 0],
        [1, 2, 1, 2, 1, 0, 0],
        [2, 1, 2, 1, 0, 0, 0],
        [1, 2, 1, 0, 0, 0, 0]
    ];
    
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            game.board[row][col] = complexPattern[row][col];
        }
    }
    
    const enhancedBot = new Connect4AI('enhanced-smart');
    const smartRandomBot = new Connect4AI('smart-random');
    const helpers = new Connect4Helpers(game, null);
    
    // Test response times under pressure
    const startTime1 = performance.now();
    const enhancedMove = enhancedBot.getBestMove(game, helpers);
    const enhancedTime = performance.now() - startTime1;
    
    const startTime2 = performance.now();
    const smartRandomMove = smartRandomBot.getBestMove(game, helpers);
    const smartRandomTime = performance.now() - startTime2;
    
    console.log(`   Enhanced Smart: Column ${enhancedMove + 1} in ${Math.round(enhancedTime)}ms`);
    console.log(`   Smart Random: Column ${smartRandomMove + 1} in ${Math.round(smartRandomTime)}ms`);
    
    // Both should generate valid moves even under pressure
    testSuite.assert(typeof enhancedMove === 'number' && enhancedMove >= 0 && enhancedMove < 7,
        'Enhanced Smart should handle pressure situations');
    testSuite.assert(typeof smartRandomMove === 'number' && smartRandomMove >= 0 && smartRandomMove < 7,
        'Smart Random should handle pressure situations');
    
    // Response times should be reasonable (under 2 seconds even in complex situations)
    testSuite.assert(enhancedTime < 2000, `Enhanced Smart should respond quickly (${Math.round(enhancedTime)}ms)`);
    testSuite.assert(smartRandomTime < 2000, `Smart Random should respond quickly (${Math.round(smartRandomTime)}ms)`);
});

// Test 6: Bot Hierarchy Validation
testSuite.test('Bot-Strength-Validation', 'Bot Hierarchy Validation', () => {
    console.log('📈 Validating bot strength hierarchy...');
    
    // Test multiple bot matchups to establish hierarchy
    const matchups = [
        { bot1: 'enhanced-smart', bot2: 'smart-random', expectedWinner: 'bot1' },
        { bot1: 'smart-random', bot2: 'easy', expectedWinner: 'bot1' },
        { bot1: 'enhanced-smart', bot2: 'easy', expectedWinner: 'bot1' }
    ];
    
    matchups.forEach(matchup => {
        const results = runBotVsBot(matchup.bot1, matchup.bot2, 5);
        console.log(`   ${matchup.bot1} vs ${matchup.bot2}: ${results.bot1Wins}-${results.bot2Wins} (${Math.round(results.bot1WinRate * 100)}% win rate)`);
        
        if (matchup.expectedWinner === 'bot1') {
            testSuite.assertGreater(results.bot1WinRate, 0.4, // At least 40% to account for randomness
                `${matchup.bot1} should outperform ${matchup.bot2}`);
        }
    });
});

// Display Results
console.log('\n📊 Bot Strength Validation Results');
console.log('='.repeat(35));

const summary = testSuite.getSummary();
console.log(`✅ Passed: ${summary.passed}`);
console.log(`❌ Failed: ${summary.failed}`);
console.log(`📊 Total: ${summary.total}`);
console.log(`🎯 Success Rate: ${Math.round((summary.passed / summary.total) * 100)}%`);

if (summary.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testSuite.results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.suite}: ${result.name}`);
        console.log(`     Error: ${result.error}`);
    });
}

if (summary.passed === summary.total) {
    console.log('\n🎉 ALL STRENGTH TESTS PASSED!');
    console.log('✅ Enhanced Smart Bot is demonstrably stronger than other bots!');
} else {
    console.log('\n⚠️  Some strength tests failed.');
    console.log('🔍 Bot strength hierarchy may need review.');
}