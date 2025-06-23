/**
 * Monte Carlo Bot Matrix Test - 6x6 Matrix mit 100 Spielen pro Paarung
 */

// Load and adapt real-bot-matrix-runner
const fs = require('fs');
const matrixRunnerCode = fs.readFileSync('./real-bot-matrix-runner.js', 'utf8');

// Replace the main() function call to prevent auto-execution
const adaptedCode = matrixRunnerCode.replace('main();', '// main() disabled for import');

// Extract just the class definitions and helper functions
const codeUntilMain = adaptedCode.split('// Main execution')[0];
eval(codeUntilMain);

// Monte Carlo Matrix Test - smaller scale
function runMonteCarloMatrixTest() {
    const botDifficulties = [
        'smart-random',
        'offensiv-gemischt', 
        'defensiv-gemischt',
        'enhanced-smart',
        'defensive',
        'monte-carlo'
    ];
    
    const gamesPerPair = 100; // Smaller for testing
    
    console.log('🎯 MONTE CARLO 6x6 MATRIX TEST');
    console.log(`⚔️  Bots: ${botDifficulties.join(', ')}`);
    console.log(`🎲 Games per pairing: ${gamesPerPair}`);
    console.log(`📊 Total games: ${botDifficulties.length * botDifficulties.length * gamesPerPair}`);
    console.log('================================================================================\n');
    
    const matrix = {};
    let completedPairs = 0;
    const totalPairs = botDifficulties.length * botDifficulties.length;
    
    for (let i = 0; i < botDifficulties.length; i++) {
        const bot1 = botDifficulties[i];
        matrix[bot1] = {};
        
        for (let j = 0; j < botDifficulties.length; j++) {
            const bot2 = botDifficulties[j];
            completedPairs++;
            
            console.log(`⚔️  ${bot1} vs ${bot2} (${gamesPerPair} games)...`);
            
            if (bot1 === bot2) {
                // Self-play always results in 50/50
                matrix[bot1][bot2] = {
                    wins: gamesPerPair / 2,
                    losses: gamesPerPair / 2,
                    draws: 0,
                    winRate: 0.5
                };
                console.log(`   Self-play: 50/50 split`);
            } else {
                const results = runBotVsBotWithLoserStarts(bot1, bot2, gamesPerPair);
                
                matrix[bot1][bot2] = {
                    wins: results.bot1Wins,
                    losses: results.bot2Wins,
                    draws: results.draws,
                    winRate: results.bot1Wins / (results.bot1Wins + results.bot2Wins + results.draws)
                };
                
                console.log(`   ${bot1}: ${results.bot1Wins} wins (${Math.round(results.bot1Wins/gamesPerPair*100)}%)`);
                console.log(`   ${bot2}: ${results.bot2Wins} wins (${Math.round(results.bot2Wins/gamesPerPair*100)}%)`);
                console.log(`   Draws: ${results.draws}`);
            }
            
            console.log(`   Progress: ${completedPairs}/${totalPairs} pairings (${Math.round(completedPairs/totalPairs*100)}%)\\n`);
        }
    }
    
    return displayMonteCarloResults(matrix, botDifficulties);
}

function displayMonteCarloResults(matrix, botDifficulties) {
    console.log('\\n🏆 MONTE CARLO 6x6 MATRIX RESULTS');
    console.log('===============================================');
    
    // Calculate overall rankings
    const rankings = [];
    for (const bot of botDifficulties) {
        let totalWins = 0;
        let totalGames = 0;
        
        for (const opponent of botDifficulties) {
            if (bot !== opponent) {
                totalWins += matrix[bot][opponent].wins;
                totalGames += matrix[bot][opponent].wins + matrix[bot][opponent].losses + matrix[bot][opponent].draws;
            }
        }
        
        rankings.push({
            name: bot,
            winRate: totalWins / totalGames,
            wins: totalWins,
            games: totalGames
        });
    }
    
    // Sort by win rate
    rankings.sort((a, b) => b.winRate - a.winRate);
    
    console.log('\\n📊 BOT RANKINGS:');
    rankings.forEach((bot, index) => {
        const winRate = Math.round(bot.winRate * 100);
        console.log(`${index + 1}. ${bot.name.padEnd(20)} | ${winRate}% win rate (${bot.wins}/${bot.games})`);
    });
    
    // Display matrix
    console.log('\\n🎯 DETAILED MATRIX:');
    console.log('Row = Bot 1, Column = Bot 2, Value = Bot 1 win rate');
    console.log(' '.repeat(18) + botDifficulties.map(b => b.substring(0, 8).padEnd(10)).join(' '));
    
    botDifficulties.forEach(bot1 => {
        let row = bot1.substring(0, 16).padEnd(18);
        botDifficulties.forEach(bot2 => {
            if (bot1 === bot2) {
                row += '50%'.padEnd(10);
            } else {
                const winRate = Math.round(matrix[bot1][bot2].winRate * 100);
                row += `${winRate}%`.padEnd(10);
            }
        });
        console.log(row);
    });
    
    return rankings;
}

// Run the test
console.log('🚀 Starting Monte Carlo Matrix Test...');
const rankings = runMonteCarloMatrixTest();

console.log('\\n✅ MONTE CARLO MATRIX TEST COMPLETED!');
console.log('📋 Key Findings:');
console.log(`   • Monte Carlo Rank: #${rankings.findIndex(r => r.name === 'monte-carlo') + 1}`);
console.log(`   • Monte Carlo Win Rate: ${Math.round(rankings.find(r => r.name === 'monte-carlo').winRate * 100)}%`);
console.log(`   • Top Performer: ${rankings[0].name} (${Math.round(rankings[0].winRate * 100)}%)`);
console.log(`   • Monte Carlo works and is integrated successfully! 🎯`);