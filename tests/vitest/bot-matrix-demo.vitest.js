import { describe, it, expect } from 'vitest';

/**
 * Demo Test für Bot Matrix Analysis
 * Kleinere Version um die Funktionalität zu testen
 */

// Mock Connect4 classes (same as in main test)
class MockConnect4Game {
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

    // Check for win (simplified)
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
}

class MockConnect4AI {
  constructor(difficulty) {
    this.difficulty = difficulty;
  }

  getBestMove(game, helpers = null) {
    const validMoves = game.getValidMoves();
    if (validMoves.length === 0) return null;

    // Simulate different bot behaviors based on difficulty
    switch (this.difficulty) {
    case 'easy':
      // Pure random
      return validMoves[Math.floor(Math.random() * validMoves.length)];

    case 'smart-random':
      // 70% random, 30% strategic
      if (Math.random() < 0.3) {
        // Simple strategic: prefer center
        const centerMoves = validMoves.filter(col => col >= 2 && col <= 4);
        return centerMoves.length > 0
          ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
          : validMoves[Math.floor(Math.random() * validMoves.length)];
      }
      return validMoves[Math.floor(Math.random() * validMoves.length)];

    case 'enhanced-smart':
      // 80% strategic, 20% random
      if (Math.random() < 0.8) {
        // Advanced strategic: check for wins/blocks + prefer center
        const winMove = this.findWinningMove(game);
        if (winMove !== null) return winMove;

        const blockMove = this.findBlockingMove(game);
        if (blockMove !== null) return blockMove;

        // Prefer center columns
        const centerMoves = validMoves.filter(col => col >= 2 && col <= 4);
        return centerMoves.length > 0
          ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
          : validMoves[Math.floor(Math.random() * validMoves.length)];
      }
      return validMoves[Math.floor(Math.random() * validMoves.length)];

    default:
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  findWinningMove(game) {
    const validMoves = game.getValidMoves();
    for (const col of validMoves) {
      // Simulate move
      const boardCopy = game.getBoard();
      let row = game.ROWS - 1;
      while (row >= 0 && boardCopy[row][col] !== game.EMPTY) {
        row--;
      }
      if (row >= 0) {
        boardCopy[row][col] = game.currentPlayer;
        if (this.checkWinOnBoard(boardCopy, row, col, game.currentPlayer, game)) {
          return col;
        }
      }
    }
    return null;
  }

  findBlockingMove(game) {
    const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;
    const validMoves = game.getValidMoves();

    for (const col of validMoves) {
      // Simulate opponent move
      const boardCopy = game.getBoard();
      let row = game.ROWS - 1;
      while (row >= 0 && boardCopy[row][col] !== game.EMPTY) {
        row--;
      }
      if (row >= 0) {
        boardCopy[row][col] = opponent;
        if (this.checkWinOnBoard(boardCopy, row, col, opponent, game)) {
          return col; // Block this winning move
        }
      }
    }
    return null;
  }

  checkWinOnBoard(board, row, col, player, game) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [deltaRow, deltaCol] of directions) {
      let count = 1;

      // Check positive direction
      let r = row + deltaRow;
      let c = col + deltaCol;
      while (r >= 0 && r < game.ROWS && c >= 0 && c < game.COLS && board[r][c] === player) {
        count++;
        r += deltaRow;
        c += deltaCol;
      }

      // Check negative direction
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

class MockConnect4Helpers {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
  }

  analyzeMoveConsequences(col) {
    // Simple mock analysis
    return {
      isWinning: Math.random() < 0.1,
      blocksOpponent: Math.random() < 0.2,
      createsThreats: Math.floor(Math.random() * 3),
      strategicValue: Math.random() < 0.3 ? 'good' : 'neutral'
    };
  }
}

/**
 * Run a head-to-head match between two bots with "Verlierer beginnt" logic
 */
function runBotVsBot(bot1Difficulty, bot2Difficulty, numGames = 10, useLoserStarts = false) {
  let bot1Wins = 0;
  let bot2Wins = 0;
  let draws = 0;
  let bot1Starts = 0;
  let bot2Starts = 0;
  let lastWinner = null; // Track who won the last game

  for (let gameNum = 0; gameNum < numGames; gameNum++) {
    const game = new MockConnect4Game();
    const bot1 = new MockConnect4AI(bot1Difficulty);
    const bot2 = new MockConnect4AI(bot2Difficulty);
    const helpers = new MockConnect4Helpers(game, null);

    // Determine who starts based on "Verlierer beginnt" logic
    let bot1StartsThisGame = true; // Default: bot1 starts

    if (useLoserStarts && gameNum > 0 && lastWinner !== null) {
      if (lastWinner === 1) {
        // Bot1 won last game, so Bot2 (loser) starts this game
        bot1StartsThisGame = false;
      } else if (lastWinner === 2) {
        // Bot2 won last game, so Bot1 (loser) starts this game
        bot1StartsThisGame = true;
      }
      // If it was a draw (lastWinner === null), keep previous starting arrangement
    }

    // Track starting statistics
    if (bot1StartsThisGame) {
      bot1Starts++;
    } else {
      bot2Starts++;
    }

    let moveCount = 0;
    const maxMoves = 42;

    while (!game.gameOver && moveCount < maxMoves) {
      // Determine current bot based on starting player and game state
      let currentBot;
      if (bot1StartsThisGame) {
        currentBot = game.currentPlayer === game.PLAYER1 ? bot1 : bot2;
      } else {
        currentBot = game.currentPlayer === game.PLAYER1 ? bot2 : bot1;
      }

      const move = currentBot.getBestMove(game, helpers);

      if (typeof move !== 'number' || move < 0 || move >= 7) {
        break;
      }

      const result = game.makeMove(move);
      if (!result.success) {
        break;
      }

      moveCount++;
    }

    // Record results and track winner for next game
    if (game.gameOver) {
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
      lastWinner = null; // Draw
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

/**
 * Run comprehensive bot matrix analysis (all bots vs all bots)
 */
function runBotMatrix(botDifficulties, numGames = 1000, useLoserStarts = true) {
  const matrix = {};
  const startTime = Date.now();

  console.log(`\n🤖 Starting Bot Matrix Analysis (${numGames} games per pairing)...`);
  console.log(`⚔️  Bots: ${botDifficulties.join(', ')}`);
  console.log(`🎲 Using "Verlierer beginnt" logic: ${useLoserStarts ? 'YES' : 'NO'}`);
  console.log('=' .repeat(60));

  let totalPairings = 0;
  let completedPairings = 0;

  // Calculate total pairings
  for (let i = 0; i < botDifficulties.length; i++) {
    for (let j = i + 1; j < botDifficulties.length; j++) {
      totalPairings++;
    }
  }

  // Run all pairings
  for (let i = 0; i < botDifficulties.length; i++) {
    const bot1 = botDifficulties[i];
    matrix[bot1] = {};

    for (let j = i + 1; j < botDifficulties.length; j++) {
      const bot2 = botDifficulties[j];

      console.log(`\n⚔️  ${bot1} vs ${bot2} (${numGames} games)...`);

      const results = runBotVsBot(bot1, bot2, numGames, useLoserStarts);

      // Store bidirectional results
      matrix[bot1][bot2] = {
        wins: results.bot1Wins,
        losses: results.bot2Wins,
        draws: results.draws,
        winRate: results.bot1WinRate,
        starts: results.bot1Starts,
        startRate: results.startingDistribution.bot1StartsRate
      };

      if (!matrix[bot2]) matrix[bot2] = {};
      matrix[bot2][bot1] = {
        wins: results.bot2Wins,
        losses: results.bot1Wins,
        draws: results.draws,
        winRate: results.bot2WinRate,
        starts: results.bot2Starts,
        startRate: results.startingDistribution.bot2StartsRate
      };

      console.log(`   ${bot1}: ${results.bot1Wins} wins (${Math.round(results.bot1WinRate * 100)}%) | Started: ${results.bot1Starts}/${numGames} (${Math.round(results.startingDistribution.bot1StartsRate * 100)}%)`);
      console.log(`   ${bot2}: ${results.bot2Wins} wins (${Math.round(results.bot2WinRate * 100)}%) | Started: ${results.bot2Starts}/${numGames} (${Math.round(results.startingDistribution.bot2StartsRate * 100)}%)`);
      console.log(`   Draws: ${results.draws}`);

      completedPairings++;
      const progress = Math.round((completedPairings / totalPairings) * 100);
      console.log(`   Progress: ${completedPairings}/${totalPairings} pairings (${progress}%)`);
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(`\n⏱️  Matrix Analysis completed in ${Math.round(totalTime / 1000)}s`);

  return matrix;
}

describe('Bot Matrix Demo Tests', () => {

  it('Demo: 50-Game Bot Matrix with "Verlierer beginnt" Logic', () => {
    console.log('\n🧪 DEMO: Bot Matrix with "Verlierer beginnt" Logic (50 games per pairing)');

    const botDifficulties = ['enhanced-smart', 'smart-random', 'easy'];

    // Run smaller matrix analysis for demo
    const matrix = runBotMatrix(botDifficulties, 50, true);

    console.log('\n📊 Demo Results Summary:');

    // Calculate and display results
    const results = {};
    botDifficulties.forEach(bot => {
      let totalWins = 0;
      let totalGames = 0;

      Object.keys(matrix[bot]).forEach(opponent => {
        const matchup = matrix[bot][opponent];
        totalWins += matchup.wins;
        totalGames += matchup.wins + matchup.losses + matchup.draws;
      });

      results[bot] = {
        wins: totalWins,
        games: totalGames,
        winRate: totalGames > 0 ? totalWins / totalGames : 0
      };
    });

    const rankings = Object.entries(results)
      .sort(([,a], [,b]) => b.winRate - a.winRate)
      .map(([bot, stats], index) => ({ rank: index + 1, bot, ...stats }));

    console.log('\n🏆 Demo Rankings:');
    rankings.forEach(bot => {
      console.log(`${bot.rank}. ${bot.bot.padEnd(15)} | Win Rate: ${Math.round(bot.winRate * 100)}% | Record: ${bot.wins}-${bot.games - bot.wins}`);
    });

    // Basic validation
    expect(rankings.length).toBe(3);
    console.log('\n✅ Demo completed successfully!');
    console.log('🎯 Ready for full 1000-game analysis!');
  });

});
