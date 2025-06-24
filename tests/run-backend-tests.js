#!/usr/bin/env node

/**
 * Backend Test Runner for Node.js
 * Runs only backend tests that don't require DOM
 */

// Global variables for test framework
global.performance = require('perf_hooks').performance;

// Load test framework
const { TestSuite } = require('./test-framework.js');

// Load Connect4 classes and make them global
global.eval(require('fs').readFileSync('./games/connect4/js/game.js', 'utf8'));
global.eval(require('fs').readFileSync('./games/connect4/js/ai.js', 'utf8'));

// Load backend test files
eval(require('fs').readFileSync('./tests/backend/backend-game-core.js', 'utf8'));
eval(require('fs').readFileSync('./tests/backend/backend-game-edge-cases.js', 'utf8'));
eval(require('fs').readFileSync('./tests/backend/backend-simulation.js', 'utf8'));
eval(require('fs').readFileSync('./tests/backend/backend-events.js', 'utf8'));

// Create test suite
const testSuite = new TestSuite();

console.log('🧪 Running Backend Tests...\n');

// Run all backend tests
try {
  runBackendGameCoreTests(testSuite);
  runBackendGameEdgeCasesTests(testSuite);
  runBackendSimulationTests(testSuite);
  runBackendEventsTests(testSuite);
} catch (error) {
  console.error('❌ Error running tests:', error.message);
  process.exit(1);
}

// Display results
console.log('\n🎯 Backend Test Results:');
const summary = testSuite.getSummary();
console.log(`✅ Passed: ${summary.passed}`);
console.log(`❌ Failed: ${summary.failed}`);
console.log(`📊 Total: ${summary.total}`);

if (summary.failed > 0) {
  console.log('\n❌ Failed tests:');
  testSuite.results.filter(r => !r.passed).forEach(result => {
    console.log(`   - ${result.suite}: ${result.name}`);
    console.log(`     Error: ${result.error}`);
  });
}

// Check if all tests passed
if (summary.failed > 0) {
  console.log(`\n❌ ${summary.failed} tests failed!`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${summary.total} backend tests passed!`);

  // Write JSON results
  const fs = require('fs');
  fs.writeFileSync('./test-results-backend.json', JSON.stringify(testSuite.toJSON(), null, 2));
  console.log('📄 Results written to test-results-backend.json');

  process.exit(0);
}
