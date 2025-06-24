#!/usr/bin/env node

/**
 * Simple Test Runner (No Browser Required)
 * Runs backend tests directly in Node.js environment
 */

// Import test files directly
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load game files
function loadGameFiles() {
  const gameFiles = [
    '../games/connect4/js/game.js',
    '../games/connect4/js/ai.js',
    '../games/connect4/js/helpers.js'
  ];

  let gameCode = '';
  gameFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      gameCode += `${fs.readFileSync(filePath, 'utf8')  }\n`;
    }
  });

  return gameCode;
}

// Load test framework
function loadTestFramework() {
  const frameworkPath = path.join(__dirname, '../tests/test-framework.js');
  return fs.readFileSync(frameworkPath, 'utf8');
}

// Load backend test files
function loadBackendTests() {
  const testFiles = [
    '../tests/backend/backend-game-core.js',
    '../tests/backend/backend-game-edge-cases.js',
    '../tests/backend/backend-events.js',
    '../tests/backend/backend-simulation.js'
  ];

  let testCode = '';
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      testCode += `${fs.readFileSync(filePath, 'utf8')  }\n`;
    }
  });

  return testCode;
}

// Load AI strategy tests
function loadAITests() {
  const testFiles = [
    '../tests/ai-strategy/ai-strategy-enhanced-smart.js',
    '../tests/ai-strategy/ai-strategy-consistency.js',
    '../tests/ai-strategy/ai-strategy-smart-random.js'
  ];

  let testCode = '';
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      testCode += `${fs.readFileSync(filePath, 'utf8')  }\n`;
    }
  });

  return testCode;
}

// Mock DOM environment for Node.js
function createMockDOM() {
  return `
        // Mock DOM for Node.js environment
        global.document = {
            createElement: function(tag) {
                return {
                    tagName: tag.toUpperCase(),
                    id: '',
                    className: '',
                    classList: {
                        add: function() {},
                        remove: function() {},
                        contains: function() { return false; }
                    },
                    style: {},
                    appendChild: function() {},
                    removeChild: function() {},
                    addEventListener: function() {},
                    innerHTML: '',
                    textContent: ''
                };
            },
            getElementById: function() { return null; },
            querySelectorAll: function() { return []; },
            body: {
                appendChild: function() {},
                removeChild: function() {}
            }
        };
        
        global.performance = {
            now: function() { return Date.now(); },
            memory: null
        };
        
        global.window = {
            CI_ENVIRONMENT: true,
            CI_TIMEOUT_MULTIPLIER: 1
        };
        
        // Mock Connect4UI class for tests that need it
        global.Connect4UI = function(game) {
            this.game = game;
            this.gameMode = 'two-player';
            this.ai = null;
            this.helpers = null;
            this.playerHelpEnabled = {
                red: { level0: false, level1: false, level2: false },
                yellow: { level0: false, level1: false, level2: false }
            };
            this.getCurrentPlayerHelpEnabled = function() { return false; };
            this.createBoard = function() {};
            this.updateBoard = function() {};
            this.updateUI = function() {};
            this.showMessage = function() {};
        };
    `;
}

// Run tests in VM context
function runTests() {
  console.log('🧪 LogicCastle Simple Test Runner (Node.js)');
  console.log('='.repeat(50));

  try {
    // Prepare code
    const mockDOM = createMockDOM();
    const gameCode = loadGameFiles();
    const frameworkCode = loadTestFramework();
    const backendTests = loadBackendTests();
    const aiTests = loadAITests();

    const fullCode = `
            ${mockDOM}
            ${gameCode}
            ${frameworkCode}
            ${backendTests}
            ${aiTests}
            
            // Run tests
            const testSuite = new TestSuite();
            
            console.log('Running Backend Tests...');
            if (typeof runBackendGameCoreTests === 'function') runBackendGameCoreTests(testSuite);
            if (typeof runBackendGameEdgeCasesTests === 'function') runBackendGameEdgeCasesTests(testSuite);
            if (typeof runBackendEventsTests === 'function') runBackendEventsTests(testSuite);
            if (typeof runBackendSimulationTests === 'function') runBackendSimulationTests(testSuite);
            
            console.log('Running AI Strategy Tests...');
            if (typeof runAIStrategyEnhancedSmartTests === 'function') runAIStrategyEnhancedSmartTests(testSuite);
            if (typeof runAIStrategyConsistencyTests === 'function') runAIStrategyConsistencyTests(testSuite);
            if (typeof runAIStrategySmartRandomTests === 'function') runAIStrategySmartRandomTests(testSuite);
            
            // Return results
            const results = testSuite.getResults();
            const summary = testSuite.getSummary();
            
            ({ results, summary });
        `;

    // Create VM context
    const context = vm.createContext({
      console: console,
      global: global,
      Date: Date,
      Math: Math,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Error: Error,
      TypeError: TypeError,
      RangeError: RangeError,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      performance: {
        now: () => Date.now(),
        memory: null
      }
    });

    // Run tests
    const result = vm.runInContext(fullCode, context, {
      timeout: 30000,
      filename: 'test-runner.js'
    });

    // Display results
    console.log('\n📊 Test Results:');
    console.log('='.repeat(50));

    const categories = {};
    result.results.forEach(test => {
      const category = test.suite.split('-')[0];
      if (!categories[category]) {
        categories[category] = { total: 0, passed: 0 };
      }
      categories[category].total++;
      if (test.passed) categories[category].passed++;
    });

    Object.keys(categories).forEach(category => {
      const stats = categories[category];
      const status = stats.passed === stats.total ? '✅' : '❌';
      console.log(`   ${status} ${category.padEnd(12)}: ${stats.passed}/${stats.total}`);
    });

    console.log('='.repeat(50));
    const overall = result.summary;
    const overallStatus = overall.passed === overall.total ? '✅' : '❌';
    console.log(`   ${overallStatus} OVERALL: ${overall.passed}/${overall.total} (${Math.round((overall.passed/overall.total)*100)}%)`);

    // Show failed tests
    const failedTests = result.results.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.suite}: ${test.name}`);
        console.log(`     Error: ${test.error}`);
      });
    }

    console.log(`\n⏱️  Total execution time: ${process.uptime().toFixed(1)}s`);
    console.log('✨ Simple test runner completed!');

    // Exit with appropriate code
    if (overall.passed === overall.total) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
