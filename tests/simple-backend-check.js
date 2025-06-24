#!/usr/bin/env node

// Check if we can load classes
global.performance = require('perf_hooks').performance;

// Load classes with explicit eval in global context
(function() {
  const gameCode = require('fs').readFileSync('./games/connect4/js/game.js', 'utf8');
  const aiCode = require('fs').readFileSync('./games/connect4/js/ai.js', 'utf8');

  // Create a function to make classes global
  const vm = require('vm');
  const context = vm.createContext(global);

  vm.runInContext(gameCode, context);
  vm.runInContext(aiCode, context);
})();

// Test if classes are available
console.log('Testing class availability...');
try {
  const game = new Connect4Game();
  console.log('✅ Connect4Game loaded successfully');
  console.log('✅ Game has', game.ROWS, 'rows and', game.COLS, 'columns');

  const ai = new Connect4AI('easy');
  console.log('✅ Connect4AI loaded successfully');
  console.log('✅ AI difficulty:', ai.difficulty);
} catch (error) {
  console.log('❌ Error:', error.message);
}
