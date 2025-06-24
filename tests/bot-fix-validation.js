#!/usr/bin/env node

/**
 * Bot Fix Validation Tests
 *
 * Tests that Enhanced Smart Bot can make moves and doesn't get stuck in "thinking" state
 * after fixing the getEnhancedStrategicEvaluation() issue
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Start test server with error handling
 */
function startTestServer(port = 8084) {
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
 * Test Enhanced Smart Bot functionality
 */
async function runBotFixValidationTests() {
  console.log('🚨 Bot Fix Validation Tests');
  console.log('='.repeat(35));

  let server;
  let browser;

  try {
    // Start server
    server = await startTestServer(8084);
    const serverPort = server.address().port;

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Load Connect4 game page
    console.log('📂 Loading Connect4 game page...');
    await page.goto(`http://localhost:${serverPort}/games/connect4/index.html`, {
      waitUntil: 'networkidle0'
    });
    console.log('✅ Game page loaded\n');

    // Test results array
    const testResults = [];

    // ======================
    // TEST 1: Enhanced Smart Bot Move Execution
    // ======================
    console.log('🚀 TEST 1: Enhanced Smart Bot Can Make Moves');
    console.log('-'.repeat(45));

    try {
      // Switch to strong bot mode
      await page.select('#gameMode', 'vs-bot-strong');
      await page.waitForTimeout(500);

      // Start new game to trigger bot if it goes first
      await page.click('#newGameBtn');
      await page.waitForTimeout(1000);

      // Make a human move to trigger bot response
      await page.click('.column-indicator[data-col="3"]'); // Select center
      await page.click('.column-indicator[data-col="3"]'); // Confirm move
      await page.waitForTimeout(500);

      // Wait for bot to complete its move (max 10 seconds)
      console.log('⏳ Waiting for Enhanced Smart Bot to make move...');
      const botMoveCompleted = await page.waitForFunction(() => {
        const status = document.querySelector('#gameStatus');
        const thinking = status && status.textContent.includes('denkt nach');
        const cells = document.querySelectorAll('.cell.yellow');
        return !thinking && cells.length > 0;
      }, { timeout: 10000 }).catch(() => false);

      if (botMoveCompleted) {
        console.log('✅ Enhanced Smart Bot successfully made a move!');
        testResults.push({ test: 'Enhanced Bot Move Execution', result: 'PASS' });

        // Verify bot move was actually made
        const yellowCells = await page.$$eval('.cell.yellow', cells => cells.length);
        console.log(`   🟡 Bot placed ${yellowCells} piece(s) on board`);

      } else {
        console.log('❌ Enhanced Smart Bot got stuck in thinking state!');
        testResults.push({ test: 'Enhanced Bot Move Execution', result: 'FAIL - Bot stuck thinking' });
      }

    } catch (error) {
      console.log('❌ Enhanced Smart Bot test failed:', error.message);
      testResults.push({ test: 'Enhanced Bot Move Execution', result: `FAIL - ${  error.message}` });
    }

    // ======================
    // TEST 2: Error Recovery Test
    // ======================
    console.log('\n🛡️  TEST 2: Bot Error Recovery');
    console.log('-'.repeat(30));

    try {
      // Reset game
      await page.click('#resetScoreBtn');
      await page.waitForTimeout(500);

      // Switch to enhanced smart bot
      await page.select('#gameMode', 'vs-bot-strong');
      await page.waitForTimeout(500);

      // Inject console error monitoring
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Make several moves to test bot stability
      const humanMoves = [3, 2, 4, 1];
      let botMovesSuccessful = 0;

      for (let i = 0; i < humanMoves.length; i++) {
        console.log(`   Making human move ${i + 1}: Column ${humanMoves[i] + 1}`);

        // Human move
        await page.click(`.column-indicator[data-col="${humanMoves[i]}"]`);
        await page.click(`.column-indicator[data-col="${humanMoves[i]}"]`);
        await page.waitForTimeout(300);

        // Wait for bot move
        console.log(`   Waiting for bot response ${i + 1}...`);
        const botMoved = await page.waitForFunction(() => {
          const status = document.querySelector('#gameStatus');
          const thinking = status && status.textContent.includes('denkt nach');
          return !thinking;
        }, { timeout: 8000 }).catch(() => false);

        if (botMoved) {
          botMovesSuccessful++;
          console.log(`   ✅ Bot move ${i + 1} completed`);
        } else {
          console.log(`   ❌ Bot move ${i + 1} failed/timeout`);
          break;
        }

        await page.waitForTimeout(500);
      }

      console.log(`Bot completed ${botMovesSuccessful}/${humanMoves.length} moves`);

      if (botMovesSuccessful === humanMoves.length) {
        console.log('✅ Bot error recovery test passed!');
        testResults.push({ test: 'Bot Error Recovery', result: 'PASS' });
      } else {
        console.log('❌ Bot error recovery test failed!');
        testResults.push({ test: 'Bot Error Recovery', result: `FAIL - ${botMovesSuccessful}/${humanMoves.length} moves` });
      }

      if (consoleErrors.length > 0) {
        console.log('⚠️  Console errors detected:');
        consoleErrors.forEach(err => console.log(`    ${err}`));
      }

    } catch (error) {
      console.log('❌ Error recovery test failed:', error.message);
      testResults.push({ test: 'Bot Error Recovery', result: `FAIL - ${  error.message}` });
    }

    // ======================
    // TEST 3: All Bot Types Functional Test
    // ======================
    console.log('\n🤖 TEST 3: All Bot Types Functional');
    console.log('-'.repeat(35));

    const botModes = [
      { value: 'vs-bot-easy', name: 'Easy Bot' },
      { value: 'vs-bot-smart', name: 'Smart Bot' },
      { value: 'vs-bot-strong', name: 'Strong Bot' }
    ];

    for (const botMode of botModes) {
      try {
        console.log(`   Testing ${botMode.name}...`);

        // Reset and switch mode
        await page.click('#resetScoreBtn');
        await page.waitForTimeout(300);
        await page.select('#gameMode', botMode.value);
        await page.waitForTimeout(300);

        // Make human move
        await page.click('.column-indicator[data-col="3"]');
        await page.click('.column-indicator[data-col="3"]');
        await page.waitForTimeout(200);

        // Wait for bot move
        const botMoved = await page.waitForFunction(() => {
          const status = document.querySelector('#gameStatus');
          const thinking = status && status.textContent.includes('denkt nach');
          return !thinking;
        }, { timeout: 6000 }).catch(() => false);

        if (botMoved) {
          console.log(`   ✅ ${botMode.name} working correctly`);
          testResults.push({ test: `${botMode.name} Functionality`, result: 'PASS' });
        } else {
          console.log(`   ❌ ${botMode.name} failed to move`);
          testResults.push({ test: `${botMode.name} Functionality`, result: 'FAIL - No move' });
        }

      } catch (error) {
        console.log(`   ❌ ${botMode.name} test error:`, error.message);
        testResults.push({ test: `${botMode.name} Functionality`, result: `FAIL - ${  error.message}` });
      }
    }

    // ======================
    // RESULTS SUMMARY
    // ======================
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(25));

    const passed = testResults.filter(r => r.result === 'PASS').length;
    const total = testResults.length;

    testResults.forEach(result => {
      const status = result.result === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.result}`);
    });

    console.log(`\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED - Bot fix is working!');
    } else {
      console.log('⚠️  Some tests failed - Bot issues may remain');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.close();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBotFixValidationTests().catch(console.error);
}

module.exports = { runBotFixValidationTests };
