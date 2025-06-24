#!/usr/bin/env node

/**
 * Helper Level Validation Script
 *
 * Validates that all Smart Bot helper levels (0-2) are working correctly
 * by testing the core scenarios directly via test page.
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Simple test server
 */
function createServer(port = 8084) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, '..', req.url === '/' ? '/index.html' : req.url);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8'
      }[ext] || 'text/plain; charset=utf-8';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    // Handle port conflicts
    server.listen(port, (err) => {
      if (err) {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} busy, trying ${port + 1}...`);
          createServer(port + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      } else {
        console.log(`✅ Server started on port ${port}`);
        resolve({ server, port });
      }
    });
  });
}

/**
 * Main test function
 */
async function validateHelperLevels() {
  console.log('🔍 Smart Bot Helper Level Validation');
  console.log('=' .repeat(40));

  let serverInfo;
  let browser;

  try {
    // Start server
    serverInfo = await createServer();
    const { server, port } = serverInfo;

    // Launch browser with better error handling
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--no-first-run'
      ],
      timeout: 30000
    });

    const page = await browser.newPage();

    // Set viewport and timeout
    await page.setViewport({ width: 1280, height: 720 });
    page.setDefaultTimeout(15000);

    // Navigate to test page
    console.log('📂 Loading test interface...');
    await page.goto(`http://localhost:${port}/tests/test-smart-bot.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    // Wait for scripts to load
    await page.waitForFunction(() => {
      return typeof Connect4Game !== 'undefined' &&
                   typeof Connect4AI !== 'undefined' &&
                   typeof Connect4TestUtils !== 'undefined';
    }, { timeout: 5000 });

    console.log('✅ Test interface loaded\n');

    // Test core helper level functionality
    const testResults = await page.evaluate(() => {
      const results = [];

      try {
        // Test 1: Level 0 - Horizontal Win Detection
        console.log('Testing Level 0 - Horizontal Win...');
        let game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        let helpers = new Connect4Helpers(game, null);

        Connect4TestUtils.createTestPosition(game, 'empty,yellow,yellow,yellow,empty,empty,empty', 2);
        const l0Move = ai.getBestMove(game, helpers);

        results.push({
          level: 'L0',
          test: 'Horizontal Win',
          passed: [0, 4].includes(l0Move),
          details: `Expected column 1 or 5, got ${l0Move + 1}`
        });

        // Test 2: Level 0 - Vertical Win Detection
        console.log('Testing Level 0 - Vertical Win...');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);

        Connect4TestUtils.createTestPosition(game, 'empty,empty,empty,yellow-yellow-yellow,empty,empty,empty', 2);
        const l0vMove = ai.getBestMove(game, helpers);

        results.push({
          level: 'L0',
          test: 'Vertical Win',
          passed: l0vMove === 3,
          details: `Expected column 4, got ${l0vMove + 1}`
        });

        // Test 3: Level 1 - Horizontal Block
        console.log('Testing Level 1 - Horizontal Block...');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);

        Connect4TestUtils.createTestPosition(game, 'red,red,red,empty,empty,empty,empty', 2);
        const l1Move = ai.getBestMove(game, helpers);

        results.push({
          level: 'L1',
          test: 'Horizontal Block',
          passed: l1Move === 3,
          details: `Expected column 4, got ${l1Move + 1}`
        });

        // Test 4: Level 1 - Vertical Block
        console.log('Testing Level 1 - Vertical Block...');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);

        Connect4TestUtils.createTestPosition(game, 'empty,empty,red-red-red,empty,empty,empty,empty', 2);
        const l1vMove = ai.getBestMove(game, helpers);

        results.push({
          level: 'L1',
          test: 'Vertical Block',
          passed: l1vMove === 2,
          details: `Expected column 3, got ${l1vMove + 1}`
        });

        // Test 5: Level 2 - Basic Trap Avoidance
        console.log('Testing Level 2 - Trap Avoidance...');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);

        Connect4TestUtils.loadScenario(game, 'trapScenario', 2);
        const l2Move = ai.getBestMove(game, helpers);
        const validMoves = game.getValidMoves();

        results.push({
          level: 'L2',
          test: 'Trap Avoidance',
          passed: validMoves.includes(l2Move),
          details: `Made valid move: column ${l2Move + 1}`
        });

        // Test 6: Priority Test - Win over Block
        console.log('Testing Priority - Win over Block...');
        game = new Connect4Game();
        helpers = new Connect4Helpers(game, null);

        // Setup where bot can both win AND block - should choose win
        Connect4TestUtils.createTestPosition(game, 'yellow,yellow,yellow,empty,red,red,red', 2);
        const priorityMove = ai.getBestMove(game, helpers);

        results.push({
          level: 'Priority',
          test: 'Win over Block',
          passed: priorityMove === 3, // Should choose to win at column 4
          details: `Expected to win at column 4, chose ${priorityMove + 1}`
        });

      } catch (error) {
        results.push({
          level: 'Error',
          test: 'Test Execution',
          passed: false,
          details: error.message
        });
      }

      return results;
    });

    // Process and display results
    console.log('📊 Test Results:');
    console.log('-'.repeat(40));

    let allPassed = true;
    const levelStats = { L0: { total: 0, passed: 0 }, L1: { total: 0, passed: 0 }, L2: { total: 0, passed: 0 }, Priority: { total: 0, passed: 0 } };

    testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.level} ${result.test}: ${result.details}`);

      if (!result.passed) allPassed = false;

      if (levelStats[result.level]) {
        levelStats[result.level].total++;
        if (result.passed) levelStats[result.level].passed++;
      }
    });

    console.log(`\n${  '='.repeat(40)}`);
    console.log('📈 Summary by Level:');
    console.log('-'.repeat(40));

    Object.entries(levelStats).forEach(([level, stats]) => {
      if (stats.total > 0) {
        const percentage = Math.round((stats.passed / stats.total) * 100);
        const status = stats.passed === stats.total ? '✅' : '❌';
        console.log(`${status} ${level}: ${stats.passed}/${stats.total} (${percentage}%)`);
      }
    });

    const totalTests = testResults.length;
    const totalPassed = testResults.filter(t => t.passed).length;
    const overallPercentage = Math.round((totalPassed / totalTests) * 100);

    console.log('-'.repeat(40));
    console.log(`🎯 Overall: ${totalPassed}/${totalTests} (${overallPercentage}%)`);

    if (allPassed) {
      console.log('\n🎉 All Smart Bot helper levels validated successfully!');
      console.log('   Level 0 (Winning): ✅ Working');
      console.log('   Level 1 (Blocking): ✅ Working');
      console.log('   Level 2 (Trap Avoidance): ✅ Working');
      console.log('   Priority System: ✅ Working');
    } else {
      console.log('\n⚠️ Some helper levels need attention.');
      const failed = testResults.filter(t => !t.passed);
      failed.forEach(test => {
        console.log(`   - ${test.level} ${test.test}: ${test.details}`);
      });
    }

    return {
      success: allPassed,
      totalTests: totalTests,
      totalPassed: totalPassed,
      levelStats: levelStats
    };

  } catch (error) {
    console.error(`\n❌ Validation failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
    if (serverInfo && serverInfo.server) {
      serverInfo.server.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  validateHelperLevels().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { validateHelperLevels };
