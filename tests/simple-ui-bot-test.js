#!/usr/bin/env node

/**
 * Simple UI Bot Mode Test
 *
 * Tests that the new Bot (Einfach/Mittel/Stark) modes work correctly
 * by loading the actual game classes and testing the logic
 */

const vm = require('vm');
const fs = require('fs');

// Load game classes with proper global context
const gameCode = fs.readFileSync('./games/connect4/js/game.js', 'utf8');
const aiCode = fs.readFileSync('./games/connect4/js/ai.js', 'utf8');
const helpersCode = fs.readFileSync('./games/connect4/js/helpers.js', 'utf8');
const uiCode = fs.readFileSync('./games/connect4/js/ui.js', 'utf8');

// Mock DOM globals
const mockDOM = {
  document: {
    getElementById: () => ({
      addEventListener: () => {},
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      closest: () => ({ style: {} })
    }),
    createElement: () => ({
      appendChild: () => {},
      addEventListener: () => {},
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false }
    }),
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  },
  window: { addEventListener: () => {} },
  console: { log: () => {}, error: () => {}, warn: () => {} }
};

const context = vm.createContext({ ...global, ...mockDOM });
vm.runInContext(gameCode, context);
vm.runInContext(aiCode, context);
vm.runInContext(helpersCode, context);
vm.runInContext(uiCode, context);

console.log('🧪 UI Bot Mode Functional Test');
console.log('='.repeat(35));

let testsPassed = 0;
let testsTotal = 0;

function test(name, testFn) {
  testsTotal++;
  try {
    testFn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Bot Mode Mapping
test('Bot mode mapping works correctly', () => {
  const game = new context.Connect4Game();
  const ui = new context.Connect4UI(game);

  // Test vs-bot-easy → offensiv-gemischt
  ui.gameMode = 'vs-bot-easy';
  ui.ai = null;
  ui.getAIMove();
  if (ui.ai.difficulty !== 'offensiv-gemischt') {
    throw new Error(`Expected offensiv-gemischt, got ${ui.ai.difficulty}`);
  }

  // Test vs-bot-medium → enhanced-smart
  ui.gameMode = 'vs-bot-medium';
  ui.ai = null;
  ui.getAIMove();
  if (ui.ai.difficulty !== 'enhanced-smart') {
    throw new Error(`Expected enhanced-smart, got ${ui.ai.difficulty}`);
  }

  // Test vs-bot-strong → defensive
  ui.gameMode = 'vs-bot-strong';
  ui.ai = null;
  ui.getAIMove();
  if (ui.ai.difficulty !== 'defensive') {
    throw new Error(`Expected defensive, got ${ui.ai.difficulty}`);
  }
});

// Test 2: AI Mode Detection
test('AI mode detection works correctly', () => {
  const game = new context.Connect4Game();
  const ui = new context.Connect4UI(game);

  ui.gameMode = 'vs-bot-easy';
  if (!ui.isAIMode()) throw new Error('vs-bot-easy should be AI mode');

  ui.gameMode = 'vs-bot-medium';
  if (!ui.isAIMode()) throw new Error('vs-bot-medium should be AI mode');

  ui.gameMode = 'vs-bot-strong';
  if (!ui.isAIMode()) throw new Error('vs-bot-strong should be AI mode');

  ui.gameMode = 'two-player';
  if (ui.isAIMode()) throw new Error('two-player should not be AI mode');
});

// Test 3: Player Name Configuration
test('Player names are set correctly', () => {
  const game = new context.Connect4Game();
  const ui = new context.Connect4UI(game);

  ui.gameMode = 'vs-bot-easy';
  ui.updateGameModeUI();
  if (ui.game.playerConfig.yellowPlayer !== '🤖 Bot (Einfach)') {
    throw new Error(`Expected 'Bot (Einfach)', got '${ui.game.playerConfig.yellowPlayer}'`);
  }

  ui.gameMode = 'vs-bot-medium';
  ui.updateGameModeUI();
  if (ui.game.playerConfig.yellowPlayer !== '🤖 Bot (Mittel)') {
    throw new Error(`Expected 'Bot (Mittel)', got '${ui.game.playerConfig.yellowPlayer}'`);
  }

  ui.gameMode = 'vs-bot-strong';
  ui.updateGameModeUI();
  if (ui.game.playerConfig.yellowPlayer !== '🤖 Bot (Stark)') {
    throw new Error(`Expected 'Bot (Stark)', got '${ui.game.playerConfig.yellowPlayer}'`);
  }
});

// Test 4: Valid Move Generation
test('All bots generate valid moves', () => {
  const game = new context.Connect4Game();
  const ui = new context.Connect4UI(game);

  const botModes = ['vs-bot-easy', 'vs-bot-medium', 'vs-bot-strong'];

  botModes.forEach(mode => {
    ui.gameMode = mode;
    ui.ai = null;

    const move = ui.getAIMove();

    if (typeof move !== 'number') {
      throw new Error(`${mode}: Expected number, got ${typeof move}`);
    }
    if (move < 0 || move >= 7) {
      throw new Error(`${mode}: Move ${move} out of range [0-6]`);
    }
  });
});

// Test 5: Legacy Compatibility
test('Legacy compatibility maintained', () => {
  const game = new context.Connect4Game();
  const ui = new context.Connect4UI(game);

  ui.gameMode = 'vs-bot-smart';
  ui.ai = null;
  ui.getAIMove();

  if (ui.ai.difficulty !== 'smart-random') {
    throw new Error(`Expected smart-random, got ${ui.ai.difficulty}`);
  }

  ui.updateGameModeUI();
  if (ui.game.playerConfig.yellowPlayer !== '🟡 Smart Bot') {
    throw new Error(`Expected 'Smart Bot', got '${ui.game.playerConfig.yellowPlayer}'`);
  }
});

// Test 6: Bot Strength Hierarchy
test('Bot strength hierarchy is correct', () => {
  const game = new context.Connect4Game();
  const ui = new context.Connect4UI(game);

  // Get bot difficulties for each UI mode
  const botStrengths = {};

  ['vs-bot-easy', 'vs-bot-medium', 'vs-bot-strong'].forEach(mode => {
    ui.gameMode = mode;
    ui.ai = null;
    ui.getAIMove();
    botStrengths[mode] = ui.ai.difficulty;
  });

  // Validate we're using the scientifically ranked bots
  const expectedBots = {
    'vs-bot-easy': 'offensiv-gemischt',   // Rank #4 (44 points)
    'vs-bot-medium': 'enhanced-smart',    // Rank #2 (83 points)
    'vs-bot-strong': 'defensive'          // Rank #1 (92 points)
  };

  Object.entries(expectedBots).forEach(([mode, expectedBot]) => {
    if (botStrengths[mode] !== expectedBot) {
      throw new Error(`${mode}: Expected ${expectedBot}, got ${botStrengths[mode]}`);
    }
  });
});

// Results
console.log('\n📊 Test Results');
console.log('='.repeat(20));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsTotal - testsPassed}`);
console.log(`📊 Total: ${testsTotal}`);
console.log(`🎯 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 All UI Bot Mode Tests PASSED!');
  console.log('✅ Bot (Einfach/Mittel/Stark) UI integration is working correctly!');
  console.log('✅ Scientific bot rankings properly implemented!');
} else {
  console.log('\n⚠️  Some UI Bot Mode tests failed.');
  console.log('🔍 Please check the implementation.');
}

process.exit(testsPassed === testsTotal ? 0 : 1);
