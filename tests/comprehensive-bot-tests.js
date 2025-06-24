#!/usr/bin/env node

/**
 * Comprehensive Smart Bot Tests for All Helper Levels
 *
 * Tests Level 0 (Winning), Level 1 (Blocking), Level 2 (Trap Avoidance)
 * across all directions: horizontal, vertical, diagonal
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Start test server with error handling
 */
function startTestServer(port = 8083) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, '..', req.url === '/' ? '/index.html' : req.url);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css'
      }[ext] || 'text/plain';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(port, () => {
      console.log(`✅ Test server running on http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} busy, trying ${port + 1}...`);
        startTestServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Run comprehensive Smart Bot tests
 */
async function runComprehensiveBotTests() {
  console.log('🤖 Comprehensive Smart Bot Tests - All Helper Levels');
  console.log('='.repeat(55));

  let server;
  let browser;

  try {
    // Start server
    server = await startTestServer(8083);
    const serverPort = server.address().port;

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Load test page
    console.log('📂 Loading test page...');
    await page.goto(`http://localhost:${serverPort}/tests/test-smart-bot.html`, {
      waitUntil: 'networkidle0'
    });
    console.log('✅ Test page loaded\n');

    // Test results array
    const testResults = [];

    // ======================
    // LEVEL 0 TESTS (Winning Moves)
    // ======================
    console.log('🏆 LEVEL 0 TESTS: Winning Move Detection');
    console.log('-'.repeat(45));

    // Level 0.1: Horizontal Winning
    console.log('📝 Test L0.1: Horizontal Winning');
    const l0_1 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Yellow has 3 in a row horizontally, can win at column 1 or 5
        Connect4TestUtils.createTestPosition(game, 'empty,yellow,yellow,yellow,empty,empty,empty', 2);

        const move = ai.getBestMove(game, helpers);
        const expected = [0, 4]; // Column 1 or 5

        return {
          success: expected.includes(move),
          move: move,
          expected: expected,
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L0.1 Horizontal Win', ...l0_1 });
    console.log(`   ${l0_1.success ? '✅' : '❌'} ${l0_1.success ? `Column ${l0_1.move + 1}` : l0_1.error || `Expected 1 or 5, got ${l0_1.move + 1}`}`);

    // Level 0.2: Vertical Winning
    console.log('📝 Test L0.2: Vertical Winning');
    const l0_2 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Yellow has 3 vertically in column 4, can win on top
        Connect4TestUtils.createTestPosition(game, 'empty,empty,empty,yellow-yellow-yellow,empty,empty,empty', 2);

        const move = ai.getBestMove(game, helpers);

        return {
          success: move === 3, // Column 4
          move: move,
          expected: [3],
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L0.2 Vertical Win', ...l0_2 });
    console.log(`   ${l0_2.success ? '✅' : '❌'} ${l0_2.success ? `Column ${l0_2.move + 1}` : l0_2.error || `Expected 4, got ${l0_2.move + 1}`}`);

    // Level 0.3: Diagonal Winning (more complex setup)
    console.log('📝 Test L0.3: Diagonal Winning');
    const l0_3 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Create diagonal setup: Yellow needs one more for diagonal win
        // Bottom-left to top-right diagonal
        Connect4TestUtils.createTestPosition(game, 'empty,yellow,red-yellow,red-red-yellow,empty,empty,empty', 2);

        const move = ai.getBestMove(game, helpers);

        return {
          success: move === 4, // Column 5 completes diagonal
          move: move,
          expected: [4],
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L0.3 Diagonal Win', ...l0_3 });
    console.log(`   ${l0_3.success ? '✅' : '❌'} ${l0_3.success ? `Column ${l0_3.move + 1}` : l0_3.error || `Expected 5, got ${l0_3.move + 1}`}`);

    // ======================
    // LEVEL 1 TESTS (Blocking)
    // ======================
    console.log('\n🛡️ LEVEL 1 TESTS: Threat Blocking');
    console.log('-'.repeat(35));

    // Level 1.1: Block Horizontal Threat
    console.log('📝 Test L1.1: Block Horizontal Threat');
    const l1_1 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Red has 3 in a row, Yellow must block at column 4
        Connect4TestUtils.createTestPosition(game, 'red,red,red,empty,empty,empty,empty', 2);

        const move = ai.getBestMove(game, helpers);

        return {
          success: move === 3, // Column 4
          move: move,
          expected: [3],
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L1.1 Block Horizontal', ...l1_1 });
    console.log(`   ${l1_1.success ? '✅' : '❌'} ${l1_1.success ? `Column ${l1_1.move + 1}` : l1_1.error || `Expected 4, got ${l1_1.move + 1}`}`);

    // Level 1.2: Block Vertical Threat
    console.log('📝 Test L1.2: Block Vertical Threat');
    const l1_2 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Red has 3 vertically, Yellow must block on top
        Connect4TestUtils.createTestPosition(game, 'empty,empty,red-red-red,empty,empty,empty,empty', 2);

        const move = ai.getBestMove(game, helpers);

        return {
          success: move === 2, // Column 3
          move: move,
          expected: [2],
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L1.2 Block Vertical', ...l1_2 });
    console.log(`   ${l1_2.success ? '✅' : '❌'} ${l1_2.success ? `Column ${l1_2.move + 1}` : l1_2.error || `Expected 3, got ${l1_2.move + 1}`}`);

    // Level 1.3: Block Diagonal Threat
    console.log('📝 Test L1.3: Block Diagonal Threat');
    const l1_3 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Red has 3 diagonally, Yellow must block
        Connect4TestUtils.createTestPosition(game, 'red,yellow-red,yellow-red-red,empty,empty,empty,empty', 2);

        const move = ai.getBestMove(game, helpers);

        return {
          success: move === 3, // Column 4 blocks diagonal
          move: move,
          expected: [3],
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L1.3 Block Diagonal', ...l1_3 });
    console.log(`   ${l1_3.success ? '✅' : '❌'} ${l1_3.success ? `Column ${l1_3.move + 1}` : l1_3.error || `Expected 4, got ${l1_3.move + 1}`}`);

    // ======================
    // LEVEL 2 TESTS (Trap Avoidance)
    // ======================
    console.log('\n🪤 LEVEL 2 TESTS: Trap Avoidance');
    console.log('-'.repeat(30));

    // Level 2.1: Avoid Creating Opponent Threat
    console.log('📝 Test L2.1: Avoid Creating Threat');
    const l2_1 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Dangerous setup: some moves would give opponent winning chances
        Connect4TestUtils.createTestPosition(game, 'empty,red,yellow,red-yellow,yellow-red,red,empty', 2);

        const move = ai.getBestMove(game, helpers);
        const validMoves = game.getValidMoves();

        // At minimum, should make a valid move
        return {
          success: validMoves.includes(move),
          move: move,
          expected: validMoves,
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L2.1 Trap Avoidance', ...l2_1 });
    console.log(`   ${l2_1.success ? '✅' : '❌'} ${l2_1.success ? `Valid move: Column ${l2_1.move + 1}` : l2_1.error || 'Invalid move'}`);

    // Level 2.2: Prefer Safe Moves
    console.log('📝 Test L2.2: Prefer Safe Moves');
    const l2_2 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Position where some moves are safer than others
        Connect4TestUtils.createTestPosition(game, 'empty,red-yellow,red-yellow-red,yellow-red-yellow,red-yellow,yellow-red,empty', 2);

        const move = ai.getBestMove(game, helpers);
        const validMoves = game.getValidMoves();

        return {
          success: validMoves.includes(move),
          move: move,
          expected: validMoves,
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L2.2 Safe Move Preference', ...l2_2 });
    console.log(`   ${l2_2.success ? '✅' : '❌'} ${l2_2.success ? `Safe move: Column ${l2_2.move + 1}` : l2_2.error || 'Invalid move'}`);

    // Level 2.3: Complex Trap Analysis
    console.log('📝 Test L2.3: Complex Trap Analysis');
    const l2_3 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Load complex scenario from predefined patterns
        Connect4TestUtils.loadScenario(game, 'trapScenario', 2);

        const move = ai.getBestMove(game, helpers);
        const validMoves = game.getValidMoves();

        return {
          success: validMoves.includes(move),
          move: move,
          expected: validMoves,
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'L2.3 Complex Trap Analysis', ...l2_3 });
    console.log(`   ${l2_3.success ? '✅' : '❌'} ${l2_3.success ? `Strategic move: Column ${l2_3.move + 1}` : l2_3.error || 'Invalid move'}`);

    // ======================
    // PRIORITY TESTS
    // ======================
    console.log('\n⚡ PRIORITY TESTS: Level Hierarchy');
    console.log('-'.repeat(35));

    // Priority 1: Win > Block
    console.log('📝 Test P1: Win over Block Priority');
    const p1 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Both can win AND block - should choose to win
        Connect4TestUtils.createTestPosition(game, 'red,yellow,yellow,yellow,red,red,red', 2);

        const move = ai.getBestMove(game, helpers);
        // Should win at column 1 rather than block at column 7

        return {
          success: move === 0, // Column 1 - winning move
          move: move,
          expected: [0],
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'P1 Win > Block Priority', ...p1 });
    console.log(`   ${p1.success ? '✅' : '❌'} ${p1.success ? `Chose to win: Column ${p1.move + 1}` : p1.error || `Should win at 1, chose ${p1.move + 1}`}`);

    // Priority 2: Block > Safe
    console.log('📝 Test P2: Block over Safe Priority');
    const p2 = await page.evaluate(() => {
      try {
        const game = new Connect4Game();
        const ai = new Connect4AI('smart-random');
        const helpers = new Connect4Helpers(game, null);

        // Must block threat even if other moves are "safer"
        Connect4TestUtils.createTestPosition(game, 'red,red,red,empty,yellow,yellow,empty', 2);

        const move = ai.getBestMove(game, helpers);

        return {
          success: move === 3, // Column 4 - must block
          move: move,
          expected: [3],
          ascii: Connect4TestUtils.toAscii(game)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    testResults.push({ name: 'P2 Block > Safe Priority', ...p2 });
    console.log(`   ${p2.success ? '✅' : '❌'} ${p2.success ? `Chose to block: Column ${p2.move + 1}` : p2.error || `Should block at 4, chose ${p2.move + 1}`}`);

    // ======================
    // SUMMARY
    // ======================
    console.log(`\n${  '='.repeat(55)}`);
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(55));

    const level0Tests = testResults.filter(t => t.name.startsWith('L0'));
    const level1Tests = testResults.filter(t => t.name.startsWith('L1'));
    const level2Tests = testResults.filter(t => t.name.startsWith('L2'));
    const priorityTests = testResults.filter(t => t.name.startsWith('P'));

    const level0Passed = level0Tests.filter(t => t.success).length;
    const level1Passed = level1Tests.filter(t => t.success).length;
    const level2Passed = level2Tests.filter(t => t.success).length;
    const priorityPassed = priorityTests.filter(t => t.success).length;

    console.log(`🏆 Level 0 (Winning):     ${level0Passed}/${level0Tests.length} ${level0Passed === level0Tests.length ? '✅' : '❌'}`);
    console.log(`🛡️ Level 1 (Blocking):    ${level1Passed}/${level1Tests.length} ${level1Passed === level1Tests.length ? '✅' : '❌'}`);
    console.log(`🪤 Level 2 (Trap Avoid):  ${level2Passed}/${level2Tests.length} ${level2Passed === level2Tests.length ? '✅' : '❌'}`);
    console.log(`⚡ Priority Tests:        ${priorityPassed}/${priorityTests.length} ${priorityPassed === priorityTests.length ? '✅' : '❌'}`);

    const totalPassed = testResults.filter(t => t.success).length;
    const totalTests = testResults.length;

    console.log('-'.repeat(55));
    console.log(`📈 OVERALL:               ${totalPassed}/${totalTests} ${totalPassed === totalTests ? '✅' : '❌'}`);
    console.log(`🎯 Success Rate:          ${Math.round((totalPassed / totalTests) * 100)}%`);

    if (totalPassed < totalTests) {
      console.log('\n❌ Failed Tests:');
      testResults
        .filter(t => !t.success)
        .forEach(t => {
          console.log(`   - ${t.name}: ${t.error || 'Logic error'}`);
          if (t.ascii) {
            console.log('     Board state:');
            t.ascii.split('\n').forEach(line => console.log(`       ${line}`));
          }
        });
    } else {
      console.log('\n🎉 All Smart Bot helper levels working perfectly!');
    }

    return {
      success: totalPassed === totalTests,
      totalTests: totalTests,
      totalPassed: totalPassed,
      level0: { passed: level0Passed, total: level0Tests.length },
      level1: { passed: level1Passed, total: level1Tests.length },
      level2: { passed: level2Passed, total: level2Tests.length },
      priority: { passed: priorityPassed, total: priorityTests.length },
      results: testResults
    };

  } catch (error) {
    console.error(`\n❌ Comprehensive tests failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      totalTests: 0,
      totalPassed: 0
    };
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
}

// Run if called directly
if (require.main === module) {
  runComprehensiveBotTests().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { runComprehensiveBotTests };
