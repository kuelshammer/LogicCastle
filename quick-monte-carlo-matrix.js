/**
 * Quick Monte Carlo Matrix Test - 50 games per pairing
 */

// Load the matrix runner
const fs = require('fs');
const matrixRunnerCode = fs.readFileSync('./real-bot-matrix-runner.js', 'utf8');
const adaptedCode = matrixRunnerCode.replace('main();', '// main() disabled');
const codeUntilMain = adaptedCode.split('// Main execution')[0];
eval(codeUntilMain);

// Quick test with fewer games
function quickMonteCarloTest() {
    const botDifficulties = [
        'smart-random',
        'defensive',
        'monte-carlo'
    ];
    
    const gamesPerPair = 50;
    console.log('🎯 QUICK MONTE CARLO TEST');
    console.log(`⚔️  Bots: ${botDifficulties.join(', ')}`);
    console.log(`🎲 Games per pairing: ${gamesPerPair}`);
    console.log('=====================================\\n');
    
    const matrix = {};
    
    for (let i = 0; i < botDifficulties.length; i++) {
        const bot1 = botDifficulties[i];
        matrix[bot1] = {};
        
        for (let j = 0; j < botDifficulties.length; j++) {
            const bot2 = botDifficulties[j];
            
            console.log(`⚔️  ${bot1} vs ${bot2} (${gamesPerPair} games)...`);
            
            if (bot1 === bot2) {
                matrix[bot1][bot2] = { wins: 25, losses: 25, draws: 0, winRate: 0.5 };
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
            console.log('');
        }
    }
    
    // Display results
    console.log('\\n🏆 RESULTS:');
    console.log('Row wins vs Column:');
    console.log(' '.repeat(15) + botDifficulties.map(b => b.substring(0, 10).padEnd(12)).join(''));
    
    botDifficulties.forEach(bot1 => {
        let row = bot1.substring(0, 13).padEnd(15);
        botDifficulties.forEach(bot2 => {
            const winRate = Math.round(matrix[bot1][bot2].winRate * 100);
            row += `${winRate}%`.padEnd(12);
        });
        console.log(row);
    });
    
    // Calculate rankings
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
    
    rankings.sort((a, b) => b.winRate - a.winRate);
    
    console.log('\\n📊 FINAL RANKINGS:');
    rankings.forEach((bot, index) => {
        const winRate = Math.round(bot.winRate * 100);
        console.log(`${index + 1}. ${bot.name.padEnd(15)} | ${winRate}% win rate (${bot.wins}/${bot.games})`);
    });
    
    const monteCarloRank = rankings.findIndex(r => r.name === 'monte-carlo') + 1;
    const monteCarloWinRate = Math.round(rankings.find(r => r.name === 'monte-carlo').winRate * 100);
    
    console.log(`\\n🎯 Monte Carlo Performance:`);
    console.log(`   Rank: #${monteCarloRank} of ${rankings.length}`);
    console.log(`   Win Rate: ${monteCarloWinRate}%`);
    console.log(`   Status: ${monteCarloWinRate >= 50 ? '✅ Above average' : '❌ Below average'}`);
    
    return rankings;
}

// Run the test
console.log('🚀 Starting Quick Monte Carlo Test...');
const rankings = quickMonteCarloTest();
console.log('\\n✅ Quick Monte Carlo Test Complete!');