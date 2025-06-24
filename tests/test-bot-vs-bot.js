#!/usr/bin/env node

/**
 * Bot vs Bot Test
 *
 * Tests if Smart Bot can make moves automatically by simulating
 * a complete game between two AI players.
 */

const fs = require('fs');
const path = require('path');

// Load game classes (simulate browser environment)
global.window = undefined;
global.document = undefined;

// Create minimal EventTarget simulation
class MockEventTarget {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Mock UI for helpers
class MockUI {
  constructor(gameMode = 'vs-bot-smart') {
    this.gameMode = gameMode;
    this.playerHelpEnabled = {
      red: { level0: false, level1: false, level2: false },
      yellow: { level0: true, level1: true, level2: true }
    };
  }

  isAIMode() {
    return this.gameMode.startsWith('vs-bot');
  }

  getCurrentPlayerHelpEnabled() {
    // In bot vs bot, both players should have help
    return true;
  }
}

// Load game files
const gameFiles = [
  '../games/connect4/js/game.js',
  '../games/connect4/js/helpers.js',
  '../games/connect4/js/ai.js'
];

try {
  gameFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    eval(content);
  });
} catch (error) {
  console.error('Error loading game files:', error.message);
  process.exit(1);
}

/**
 * Simulate a Bot vs Bot game
 */
function runBotVsBotTest() {
  console.log('🤖 Starting Bot vs Bot Test');
  console.log('=============================\n');

  const game = new Connect4Game();
  const mockUI = new MockUI('vs-bot-smart');
  const helpers = new Connect4Helpers(game, mockUI);
  const redBot = new Connect4AI('smart-random');
  const yellowBot = new Connect4AI('smart-random');

  let moveCount = 0;
  const maxMoves = 42; // Full board

  console.log('Initial board:');
  console.log(toAscii(game));

  while (!game.gameOver && moveCount < maxMoves) {
    const currentPlayer = game.currentPlayer;
    const playerName = currentPlayer === game.PLAYER1 ? 'Red Bot' : 'Yellow Bot';
    const bot = currentPlayer === game.PLAYER1 ? redBot : yellowBot;

    console.log(`\nMove ${moveCount + 1}: ${playerName} (Player ${currentPlayer})`);

    try {
      // Get bot move
      const botMove = bot.getBestMove(game, helpers);

      if (botMove === null) {
        console.error(`❌ ${playerName} returned null move!`);
        break;
      }

      console.log(`🤖 ${playerName} chose column ${botMove + 1}`);

      // Make the move
      const result = game.makeMove(botMove);

      if (!result.success) {
        console.error(`❌ Move failed: ${result.reason}`);
        break;
      }

      console.log('✅ Move successful');
      console.log(toAscii(game));

      moveCount++;

    } catch (error) {
      console.error(`❌ Error during ${playerName} move:`, error.message);
      break;
    }
  }

  // Game result
  console.log('\n=============================');
  if (game.gameOver) {
    if (game.winner) {
      const winnerName = game.winner === game.PLAYER1 ? 'Red Bot' : 'Yellow Bot';
      console.log(`🎉 Game Over! ${winnerName} wins after ${moveCount} moves!`);
    } else {
      console.log(`🤝 Game Over! Draw after ${moveCount} moves!`);
    }
  } else {
    console.log(`⚠️ Test stopped after ${moveCount} moves (max limit or error)`);
  }

  return {
    success: game.gameOver || moveCount > 10, // Success if game finished or many moves made
    moveCount: moveCount,
    winner: game.winner,
    gameOver: game.gameOver
  };
}

/**
 * Convert game board to ASCII representation
 */
function toAscii(game) {
  let ascii = '';
  for (let row = 0; row < game.ROWS; row++) {
    let line = '';
    for (let col = 0; col < game.COLS; col++) {
      const cell = game.board[row][col];
      if (cell === game.EMPTY) {
        line += '. ';
      } else if (cell === game.PLAYER1) {
        line += 'R ';
      } else if (cell === game.PLAYER2) {
        line += 'Y ';
      }
    }
    ascii += `${line  }\n`;
  }
  return ascii;
}

/**
 * Run multiple bot games for reliability
 */
function runMultipleBotGames(numGames = 3) {
  console.log(`🤖 Running ${numGames} Bot vs Bot games...\n`);

  const results = [];

  for (let i = 0; i < numGames; i++) {
    console.log(`\n🎮 Game ${i + 1}/${numGames}`);
    console.log('='.repeat(50));

    const result = runBotVsBotTest();
    results.push(result);

    if (!result.success) {
      console.error(`❌ Game ${i + 1} failed!`);
      break;
    }
  }

  // Summary
  console.log(`\n${  '='.repeat(50)}`);
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));

  const successful = results.filter(r => r.success).length;
  const totalMoves = results.reduce((sum, r) => sum + r.moveCount, 0);
  const avgMoves = totalMoves / results.length;

  console.log(`✅ Successful games: ${successful}/${results.length}`);
  console.log(`📈 Average moves per game: ${avgMoves.toFixed(1)}`);
  console.log(`🎯 Bot functionality: ${successful === results.length ? 'WORKING' : 'FAILED'}`);

  return successful === results.length;
}

// Run the test
if (require.main === module) {
  const success = runMultipleBotGames(3);
  process.exit(success ? 0 : 1);
}

module.exports = { runBotVsBotTest, runMultipleBotGames };
