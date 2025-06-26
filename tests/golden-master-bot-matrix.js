
/**
 * BOT MATRIX SYMMETRY VALIDATION
 *
 * This test validates the symmetry of bot performance. It ensures that the outcomes
 * of Bot A vs. Bot B are consistent with Bot B vs. Bot A, accounting for statistical noise.
 * A significant deviation suggests a potential flaw in the game logic or bot implementation.
 */
import { Game } from '../games/connect4/js/game.js';
import { SmartRandomBot } from '../games/connect4/js/ai-strategies/smart-random-bot.js';
import { DefensiveBot } from '../games/connect4/js/ai-strategies/defensive-bot.js';
import { EnhancedSmartBot } from '../games/connect4/js/ai-strategies/enhanced-smart-bot.js';
import { OffensiveMixedBot, DefensiveMixedBot } from '../games/connect4/js/ai-strategies/mixed-strategy-bots.js';
import { MonteCarloBot } from '../games/connect4/js/ai-strategies/monte-carlo-bot.js';

// Tolerance for statistical deviation in win/loss symmetry (in percentage points)
const SYMMETRY_TOLERANCE = 10;

const botStrategies = {
    'smart-random': SmartRandomBot,
    'defensive': DefensiveBot,
    'enhanced-smart': EnhancedSmartBot,
    'offensiv-gemischt': OffensiveMixedBot,
    'defensiv-gemischt': DefensiveMixedBot,
    'monte-carlo': MonteCarloBot
};

/**
 * Run Bot Matrix Symmetry Validation Test
 */
export function runSymmetryValidationTest() {
  console.log('🏆 BOT MATRIX SYMMETRY VALIDATION');
  console.log('=================================');
  console.log('Testing bot performance for symmetrical consistency...\n');

  const results = runComprehensiveBotMatrix();
  const validationResults = validateSymmetry(results);

  return validationResults;
}

/**
 * Run comprehensive 6x6 bot matrix with all current bots
 */
function runComprehensiveBotMatrix() {
  console.log('📊 Running comprehensive 6x6 bot matrix (100 games per pairing)...');

  const botTypes = [
    'smart-random',
    'offensiv-gemischt',
    'defensiv-gemischt',
    'enhanced-smart',
    'defensive',
    'monte-carlo'
  ];

  const results = {};
  const totalPairings = botTypes.length * botTypes.length;
  let completedPairings = 0;

  for (const bot1 of botTypes) {
    results[bot1] = {};

    for (const bot2 of botTypes) {
      completedPairings++;
      console.log(`\n⚔️  ${bot1} vs ${bot2} (${completedPairings}/${totalPairings})`);

      if (bot1 === bot2) {
        // Self-play is not needed for symmetry check, but we can fill it for completeness
        results[bot1][bot2] = { winRate: 50, games: 100, wins: 50, losses: 50, draws: 0 };
         console.log(`   Result: 50% winrate (self-play)`);
      } else {
        // Run actual bot vs bot games
        const gameResults = runBotVsBotSeries(bot1, bot2, 1000);
        results[bot1][bot2] = {
          winRate: Math.round((gameResults.wins / gameResults.total) * 100),
          games: gameResults.total,
          wins: gameResults.wins,
          losses: gameResults.losses,
          draws: gameResults.draws
        };
         console.log(`   Result: ${results[bot1][bot2].wins} wins, ${results[bot1][bot2].losses} losses, ${results[bot1][bot2].draws} draws (${results[bot1][bot2].winRate}% winrate)`);
      }
    }
  }

  return results;
}

/**
 * Validate the symmetry of the results.
 * The win rate of A vs B should be roughly (100 - win rate of B vs A).
 */
function validateSymmetry(currentResults) {
  console.log('🔍 VALIDATING BOT MATRIX SYMMETRY (with Draws)');
  console.log('=============================================');

  const validationResults = {
    totalPairings: 0,
    passedPairings: 0,
    failedPairings: 0,
    failures: []
  };

  const botTypes = Object.keys(currentResults);

  for (let i = 0; i < botTypes.length; i++) {
    for (let j = i + 1; j < botTypes.length; j++) {
      const bot1 = botTypes[i];
      const bot2 = botTypes[j];

      validationResults.totalPairings++;

      const result1 = currentResults[bot1][bot2]; // Bot1 vs Bot2
      const result2 = currentResults[bot2][bot1]; // Bot2 vs Bot1

      let isSymmetric = true;
      const failureDetails = [];

      // Check wins symmetry: Bot1 wins vs Bot2 should be Bot2 losses vs Bot1
      const winDeviation = Math.abs(result1.wins - result2.losses);
      if (winDeviation > SYMMETRY_TOLERANCE) {
        isSymmetric = false;
        failureDetails.push(`Wins deviation: ${winDeviation} (Bot1 wins: ${result1.wins}, Bot2 losses: ${result2.losses})`);
      }

      // Check losses symmetry: Bot1 losses vs Bot2 should be Bot2 wins vs Bot1
      const lossDeviation = Math.abs(result1.losses - result2.wins);
      if (lossDeviation > SYMMETRY_TOLERANCE) {
        isSymmetric = false;
        failureDetails.push(`Losses deviation: ${lossDeviation} (Bot1 losses: ${result1.losses}, Bot2 wins: ${result2.wins})`);
      }

      // Check draws symmetry: Draws should be roughly the same in both directions
      const drawDeviation = Math.abs(result1.draws - result2.draws);
      if (drawDeviation > SYMMETRY_TOLERANCE) {
        isSymmetric = false;
        failureDetails.push(`Draws deviation: ${drawDeviation} (Bot1 draws: ${result1.draws}, Bot2 draws: ${result2.draws})`);
      }

      if (isSymmetric) {
        validationResults.passedPairings++;
        console.log(`✅ ${bot1} vs ${bot2}: Symmetric`);
      } else {
        validationResults.failedPairings++;
        validationResults.failures.push({
          pairing: `${bot1} vs ${bot2}`,
          details: failureDetails
        });
        console.log(`❌ ${bot1} vs ${bot2}: Asymmetric! Details: ${failureDetails.join(', ')}`);
      }
    }
  }

  return validationResults;
}


function runBotVsBotSeries(bot1Type, bot2Type, numGames) {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    const Bot1 = botStrategies[bot1Type];
    const Bot2 = botStrategies[bot2Type];

    const game = new Game(); // Create game instance once
    const bot1 = new Bot1(game, 1);
    const bot2 = new Bot2(game, 2);

    for (let i = 0; i < numGames; i++) {
        // Use fullReset for the first game, then resetGame for subsequent games
        // to apply the "loser starts" rule.
        if (i === 0) {
            game.fullReset();
        } else {
            game.resetGame();
        }

        while (!game.gameOver) {
            const currentPlayer = game.currentPlayer;
            const bot = currentPlayer === 1 ? bot1 : bot2;
            const move = bot.getBestMove(game);

            if (move === null) {
                // Bot couldn't find a move, likely a draw or error
                break;
            }

            game.makeMove(move);
        }

        const winner = game.winner;
        if (winner === 1) {
            wins++;
        } else if (winner === 2) {
            losses++;
        } else {
            draws++;
        }
    }

    return {
        wins,
        losses,
        draws,
        total: numGames
    };
}

/**
 * Generate detailed report of validation results
 */
export function generateValidationReport(validationResults) {
  console.log('\n📋 BOT MATRIX SYMMETRY VALIDATION REPORT');
  console.log('=======================================');

  const successRate = (validationResults.passedPairings / validationResults.totalPairings) * 100;

  console.log(`Total pairings tested: ${validationResults.totalPairings}`);
  console.log(`Passed validations: ${validationResults.passedPairings}`);
  console.log(`Failed validations: ${validationResults.failedPairings}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%`);

  if (validationResults.failedPairings > 0) {
    console.log('\n❌ FAILED VALIDATIONS:');
    validationResults.failures.forEach(failure => {
      console.log(`   ${failure.pairing}: ${failure.details.join('; ')}`);
    });

    console.log('\n🚨 SYMMETRY VALIDATION FAILED!');
    console.log('Bot performance is not consistent. Investigate before proceeding.');
    return false;
  }
  console.log('\n✅ ALL SYMMETRY VALIDATIONS PASSED!');
  console.log('Bot performance is consistent and symmetrical.');
  return true;

}

/**
 * Main execution function
 */
export function runSymmetryTest() {
  console.log('🚀 STARTING BOT MATRIX SYMMETRY TEST');
  console.log('This test will validate that bot performance is symmetrical.\n');

  try {
    const validationResults = runSymmetryValidationTest();
    const success = generateValidationReport(validationResults);

    return {
      success: success,
      results: validationResults,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Symmetry Test failed with error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

runSymmetryTest();
