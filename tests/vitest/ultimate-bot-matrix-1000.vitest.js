import { describe, test, expect } from 'vitest';
import { Game as Connect4Game } from '../../games/connect4/js/modules/game.js';
import { Connect4AI } from '../../games/connect4/js/ai-strategies/ai-modular.js';

function runBotVsBotWithLoserStarts(bot1Difficulty, bot2Difficulty, numGames = 100) {
  let bot1Wins = 0;
  let bot2Wins = 0;
  let draws = 0;
  let bot1Starts = 0;
  let bot2Starts = 0;
  let lastWinner = null;

  for (let gameNum = 0; gameNum < numGames; gameNum++) {
    const game = new Connect4Game();
    const bot1 = new Connect4AI(bot1Difficulty);
    const bot2 = new Connect4AI(bot2Difficulty);

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
      let currentBot;
      if (bot1StartsThisGame) {
        currentBot = game.currentPlayer === game.PLAYER1 ? bot1 : bot2;
      } else {
        currentBot = game.currentPlayer === game.PLAYER1 ? bot2 : bot1;
      }

      const move = currentBot.getBestMove(game);
      if (typeof move !== 'number' || move < 0 || move >= 7) {
        break;
      }

      const result = game.makeMove(move);
      if (!result.success) {
        break;
      }
      moveCount++;
    }

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
  };
}

describe('Bot Matrix Tests', () => {
  test('should run a 2x2 matrix with easy and smart-random bots', () => {
    const botDifficulties = ['easy', 'smart-random'];
    const results = {};

    for (const bot1 of botDifficulties) {
      results[bot1] = {};
      for (const bot2 of botDifficulties) {
        if (bot1 === bot2) continue;
        const matchResult = runBotVsBotWithLoserStarts(bot1, bot2, 100);
        results[bot1][bot2] = matchResult;
      }
    }

    console.log('2x2 Bot Matrix Results:', results);
    expect(results['smart-random']['easy'].bot1WinRate).toBeGreaterThanOrEqual(0.45);
  }, 30000);
});
