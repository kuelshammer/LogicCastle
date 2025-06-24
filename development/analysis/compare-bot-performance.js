#!/usr/bin/env node

/**
 * Compare Bot Performance: Before vs After Enhanced Smart Bot Fixes
 *
 * This script tests the SAME bots twice:
 * 1. With ORIGINAL Enhanced Smart Bot (before fixes)
 * 2. With IMPROVED Enhanced Smart Bot (after fixes)
 */

// Mock Connect4 classes (same as before - these haven't changed)
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
  constructor(difficulty, useImprovedEnhanced = false) {
    this.difficulty = difficulty;
    this.useImprovedEnhanced = useImprovedEnhanced;
  }

  getBestMove(game, helpers = null) {
    const validMoves = game.getValidMoves();
    if (validMoves.length === 0) return null;

    // Simulate different bot behaviors based on difficulty
    switch (this.difficulty) {
    case 'easy':
      // Pure random with 30% threat blocking
      if (Math.random() < 0.3) {
        const blockMove = this.findBlockingMove(game);
        if (blockMove !== null) return blockMove;
      }
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
      if (this.useImprovedEnhanced) {
        // IMPROVED VERSION: Better strategic analysis + defensive patterns
        return this.getImprovedEnhancedSmartMove(game, validMoves);
      }
      // ORIGINAL VERSION: Flawed strategic analysis, falls back to center preference
      return this.getOriginalEnhancedSmartMove(game, validMoves);


    case 'defensive':
      // Pure defensive strategy - unchanged
      return this.getDefensiveMove(game, validMoves);

    case 'defensiv-gemischt':
      // Weighted random with defensive focus (2x weight for defensive moves)
      return this.getDefensiveMixedMove(game, validMoves);

    case 'offensiv-gemischt':
      // Weighted random with offensive focus (2x weight for aggressive moves)
      return this.getOffensiveMixedMove(game, validMoves);

    default:
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  // ORIGINAL Enhanced Smart (flawed implementation)
  getOriginalEnhancedSmartMove(game, validMoves) {
    // Win/block first
    const winMove = this.findWinningMove(game);
    if (winMove !== null) return winMove;

    const blockMove = this.findBlockingMove(game);
    if (blockMove !== null) return blockMove;

    // FLAWED: Column-based even/odd analysis (wrong!)
    const evenColumns = validMoves.filter(col => col % 2 === 0);
    const oddColumns = validMoves.filter(col => col % 2 === 1);

    if (oddColumns.length > 0 && Math.random() < 0.3) {
      return oddColumns[Math.floor(Math.random() * oddColumns.length)];
    }

    // Falls back to center preference quickly
    const centerMoves = validMoves.filter(col => col >= 2 && col <= 4);
    return centerMoves.length > 0
      ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
      : validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // IMPROVED Enhanced Smart (fixed implementation)
  getImprovedEnhancedSmartMove(game, validMoves) {
    // Win/block first
    const winMove = this.findWinningMove(game);
    if (winMove !== null) return winMove;

    const blockMove = this.findBlockingMove(game);
    if (blockMove !== null) return blockMove;

    // IMPROVED: Proper defensive pattern analysis
    const enhancedMoves = validMoves.map(col => {
      const defensiveValue = this.evaluateDefensivePotential(game, col);
      const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);

      // Enhanced Smart: Balanced approach (1.5x defensive, 1x offensive)
      const combinedValue = defensiveValue * 1.5 + offensiveValue;

      return {
        column: col,
        defensiveValue: defensiveValue,
        offensiveValue: offensiveValue,
        combinedValue: combinedValue
      };
    });

    // Find moves with highest combined value
    const maxCombinedValue = Math.max(...enhancedMoves.map(m => m.combinedValue));
    const bestEnhancedMoves = enhancedMoves.filter(m => m.combinedValue === maxCombinedValue);

    if (bestEnhancedMoves.length > 0 && maxCombinedValue > 0) {
      const randomIndex = Math.floor(Math.random() * bestEnhancedMoves.length);
      return bestEnhancedMoves[randomIndex].column;
    }

    // Fallback to weighted center preference
    const centerMoves = validMoves.filter(col => col >= 2 && col <= 4);
    return centerMoves.length > 0
      ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
      : validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  getDefensiveMove(game, validMoves) {
    // Win/block first
    const winMove = this.findWinningMove(game);
    if (winMove !== null) return winMove;

    const blockMove = this.findBlockingMove(game);
    if (blockMove !== null) return blockMove;

    // Pure defensive strategy - analyze defensive potential
    const defensiveMoves = validMoves.map(col => {
      const defensiveValue = this.evaluateDefensivePotential(game, col);
      const offensiveValue = this.evaluatePositionPotential(game, col, game.currentPlayer);
      return {
        column: col,
        defensiveValue: defensiveValue,
        offensiveValue: offensiveValue,
        combinedValue: defensiveValue * 2 + offensiveValue // Pure defensive focus
      };
    });

    const maxCombinedValue = Math.max(...defensiveMoves.map(m => m.combinedValue));
    const bestDefensiveMoves = defensiveMoves.filter(m => m.combinedValue === maxCombinedValue);

    if (bestDefensiveMoves.length > 0 && maxCombinedValue > 0) {
      const randomIndex = Math.floor(Math.random() * bestDefensiveMoves.length);
      return bestDefensiveMoves[randomIndex].column;
    }

    // Fallback
    const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col => validMoves.includes(col));
    return centerMoves.length > 0 ? centerMoves[0] : validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  getDefensiveMixedMove(game, validMoves) {
    // Win/block first
    const winMove = this.findWinningMove(game);
    if (winMove !== null) return winMove;

    const blockMove = this.findBlockingMove(game);
    if (blockMove !== null) return blockMove;

    // Weighted random - defensive focus
    const weightedColumns = [];

    for (const col of validMoves) {
      const offensivePotential = this.evaluatePositionPotential(game, col, game.currentPlayer);
      const defensivePotential = this.evaluateDefensivePotential(game, col);

      // DEFENSIVE FOCUS: Each defensive block adds column 2x, each offensive 4-possibility adds column 1x
      for (let i = 0; i < defensivePotential * 2; i++) {
        weightedColumns.push(col);
      }
      for (let i = 0; i < offensivePotential * 1; i++) {
        weightedColumns.push(col);
      }

      // Base weight: add each column at least once
      if (offensivePotential === 0 && defensivePotential === 0) {
        weightedColumns.push(col);
      }
    }

    if (weightedColumns.length > 0) {
      return weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
    }

    // Fallback
    const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col => validMoves.includes(col));
    return centerMoves.length > 0 ? centerMoves[0] : validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  getOffensiveMixedMove(game, validMoves) {
    // Win/block first
    const winMove = this.findWinningMove(game);
    if (winMove !== null) return winMove;

    const blockMove = this.findBlockingMove(game);
    if (blockMove !== null && Math.random() < 0.5) return blockMove; // Only 50% chance to block

    // Weighted random - offensive focus
    const weightedColumns = [];

    for (const col of validMoves) {
      const offensivePotential = this.evaluatePositionPotential(game, col, game.currentPlayer);
      const defensivePotential = this.evaluateDefensivePotential(game, col);

      // OFFENSIVE FOCUS: Each offensive 4-possibility adds column 2x, each defensive block adds column 1x
      for (let i = 0; i < offensivePotential * 2; i++) {
        weightedColumns.push(col);
      }
      for (let i = 0; i < defensivePotential * 1; i++) {
        weightedColumns.push(col);
      }

      // Base weight: add each column at least once
      if (offensivePotential === 0 && defensivePotential === 0) {
        weightedColumns.push(col);
      }
    }

    if (weightedColumns.length > 0) {
      return weightedColumns[Math.floor(Math.random() * weightedColumns.length)];
    }

    // Fallback
    const centerMoves = [3, 2, 4, 1, 5, 0, 6].filter(col => validMoves.includes(col));
    return centerMoves.length > 0 ? centerMoves[0] : validMoves[Math.floor(Math.random() * validMoves.length)];
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

  evaluatePositionPotential(game, col, player) {
    // Find where the piece would land
    let row = game.ROWS - 1;
    while (row >= 0 && game.board[row][col] !== game.EMPTY) {
      row--;
    }

    if (row < 0) {
      return 0; // Column full
    }

    let potential = 0;
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal /
      [1, -1]   // Diagonal \
    ];

    // Check each direction for potential 4-in-a-row patterns
    for (const [deltaRow, deltaCol] of directions) {
      potential += this.countPotentialInDirection(game, row, col, player, deltaRow, deltaCol);
    }

    return potential;
  }

  countPotentialInDirection(game, row, col, player, deltaRow, deltaCol) {
    let potential = 0;

    // Check all possible 4-cell windows that include this position
    for (let startOffset = -3; startOffset <= 0; startOffset++) {
      const startRow = row + startOffset * deltaRow;
      const startCol = col + startOffset * deltaCol;

      // Check if this 4-cell window is valid (within board bounds)
      const endRow = startRow + 3 * deltaRow;
      const endCol = startCol + 3 * deltaCol;

      if (startRow >= 0 && startRow < game.ROWS &&
                startCol >= 0 && startCol < game.COLS &&
                endRow >= 0 && endRow < game.ROWS &&
                endCol >= 0 && endCol < game.COLS) {

        // Check if this window could potentially form a 4-in-a-row
        if (this.isWindowViable(game, startRow, startCol, deltaRow, deltaCol, player)) {
          potential++;
        }
      }
    }

    return potential;
  }

  isWindowViable(game, startRow, startCol, deltaRow, deltaCol, player) {
    const opponent = player === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;

    for (let i = 0; i < 4; i++) {
      const checkRow = startRow + i * deltaRow;
      const checkCol = startCol + i * deltaCol;

      // If there's an opponent piece in this window, it's not viable
      if (game.board[checkRow][checkCol] === opponent) {
        return false;
      }

      // For vertical direction, check if position is reachable
      if (deltaRow === 1 && deltaCol === 0) {
        // Check if this cell is reachable (no floating pieces)
        if (game.board[checkRow][checkCol] === game.EMPTY) {
          // Check if there's support below (or it's the bottom row)
          if (checkRow < game.ROWS - 1 && game.board[checkRow + 1][checkCol] === game.EMPTY) {
            return false; // Would be floating
          }
        }
      }
    }

    return true;
  }

  evaluateDefensivePotential(game, col) {
    const opponent = game.currentPlayer === game.PLAYER1 ? game.PLAYER2 : game.PLAYER1;

    // Find where our piece would land
    let row = game.ROWS - 1;
    while (row >= 0 && game.board[row][col] !== game.EMPTY) {
      row--;
    }

    if (row < 0) {
      return 0; // Column full
    }

    let defensiveValue = 0;
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal /
      [1, -1]   // Diagonal \
    ];

    // For each direction, count how many opponent 4-in-a-row patterns we would disrupt
    for (const [deltaRow, deltaCol] of directions) {
      defensiveValue += this.countDisruptedOpponentPatterns(game, row, col, opponent, deltaRow, deltaCol);
    }

    return defensiveValue;
  }

  countDisruptedOpponentPatterns(game, row, col, opponent, deltaRow, deltaCol) {
    let disruptedPatterns = 0;

    // Check all possible 4-cell windows that include this position
    for (let startOffset = -3; startOffset <= 0; startOffset++) {
      const startRow = row + startOffset * deltaRow;
      const startCol = col + startOffset * deltaCol;

      // Check if this 4-cell window is valid (within board bounds)
      const endRow = startRow + 3 * deltaRow;
      const endCol = startCol + 3 * deltaCol;

      if (startRow >= 0 && startRow < game.ROWS &&
                startCol >= 0 && startCol < game.COLS &&
                endRow >= 0 && endRow < game.ROWS &&
                endCol >= 0 && endCol < game.COLS) {

        // Check if this window contains a potential opponent pattern that we would disrupt
        if (this.wouldDisruptOpponentPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, row, col)) {
          disruptedPatterns++;
        }
      }
    }

    return disruptedPatterns;
  }

  wouldDisruptOpponentPattern(game, startRow, startCol, deltaRow, deltaCol, opponent, ourRow, ourCol) {
    let opponentPieces = 0;
    let emptySpaces = 0;
    let wouldBlockPattern = false;

    for (let i = 0; i < 4; i++) {
      const checkRow = startRow + i * deltaRow;
      const checkCol = startCol + i * deltaCol;

      if (checkRow === ourRow && checkCol === ourCol) {
        // This is where we would place our piece
        wouldBlockPattern = true;
      } else if (game.board[checkRow][checkCol] === opponent) {
        opponentPieces++;
      } else if (game.board[checkRow][checkCol] === game.EMPTY) {
        emptySpaces++;

        // For vertical direction, check if this empty space is actually reachable
        if (deltaRow === 1 && deltaCol === 0) {
          if (checkRow < game.ROWS - 1 && game.board[checkRow + 1][checkCol] === game.EMPTY) {
            // This would be a floating piece, so this pattern isn't viable anyway
            return false;
          }
        }
      } else {
        // Contains our pieces, so opponent can't use this pattern anyway
        return false;
      }
    }

    // We disrupt a pattern if:
    // 1. The pattern was viable for the opponent (had opponent pieces + empty spaces)
    // 2. Our piece would be placed in this pattern
    // 3. The opponent had at least 1 piece in this pattern (making it worth disrupting)
    return wouldBlockPattern && opponentPieces >= 1 && (opponentPieces + emptySpaces === 4);
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
function runBotVsBot(bot1Difficulty, bot2Difficulty, numGames = 10, useImprovedEnhanced = false, useLoserStarts = false) {
  let bot1Wins = 0;
  let bot2Wins = 0;
  let draws = 0;
  let bot1Starts = 0;
  let bot2Starts = 0;
  let lastWinner = null; // Track who won the last game

  for (let gameNum = 0; gameNum < numGames; gameNum++) {
    const game = new MockConnect4Game();
    const bot1 = new MockConnect4AI(bot1Difficulty, useImprovedEnhanced);
    const bot2 = new MockConnect4AI(bot2Difficulty, useImprovedEnhanced);
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

// Main comparison
console.log('🧪 BEFORE vs AFTER: Enhanced Smart Bot Performance Comparison');
console.log('==============================================================\n');

const testPairings = [
  ['enhanced-smart', 'defensive'],
  ['enhanced-smart', 'defensiv-gemischt'],
  ['enhanced-smart', 'offensiv-gemischt'],
  ['enhanced-smart', 'smart-random']
];

const numGames = 300; // Reasonable sample size

console.log(`Testing ${numGames} games per pairing with "Verlierer beginnt" logic...\n`);

for (const [bot1, bot2] of testPairings) {
  console.log(`\n⚔️  ${bot1} vs ${bot2}:`);

  // BEFORE: Original Enhanced Smart
  const resultsBefore = runBotVsBot(bot1, bot2, numGames, false, true);

  // AFTER: Improved Enhanced Smart
  const resultsAfter = runBotVsBot(bot1, bot2, numGames, true, true);

  console.log(`  BEFORE (Original): ${bot1} ${resultsBefore.bot1Wins} wins (${Math.round(resultsBefore.bot1WinRate * 100)}%) | Started: ${Math.round(resultsBefore.startingDistribution.bot1StartsRate * 100)}%`);
  console.log(`  AFTER  (Improved): ${bot1} ${resultsAfter.bot1Wins} wins (${Math.round(resultsAfter.bot1WinRate * 100)}%) | Started: ${Math.round(resultsAfter.startingDistribution.bot1StartsRate * 100)}%`);

  const winRateChange = (resultsAfter.bot1WinRate - resultsBefore.bot1WinRate) * 100;
  const winRateColor = winRateChange > 0 ? '📈' : winRateChange < 0 ? '📉' : '➡️';

  console.log(`  CHANGE: ${winRateColor} ${winRateChange > 0 ? '+' : ''}${winRateChange.toFixed(1)}% win rate change`);
}

console.log(`\n${  '='.repeat(60)}`);
console.log('🎯 CONCLUSION:');
console.log('If the "AFTER" results show significant improvements,');
console.log('then the Enhanced Smart Bot fixes were successful!');
console.log('If not, the improvements may be minimal or the bots');
console.log('are using different strategies that cancel out the gains.');
