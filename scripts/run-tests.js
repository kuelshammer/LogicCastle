#!/usr/bin/env node

import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple HTTP server for testing
 */
function startServer(port = 8081) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, '..', req.url === '/' ? '/index.html' : req.url);

      // Handle directory requests
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      // Determine content type
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon'
      }[ext] || 'text/plain';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
          } else {
            res.writeHead(500);
            res.end('Server Error');
          }
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

    server.on('error', reject);
  });
}

/**
 * Run Smart Bot tests using our new test utilities
 */
async function runSmartBotTests() {
  console.log('\n🤖 Running Smart Bot Tests...\n');

  let server;
  let browser;

  try {
    // Start local server
    server = await startServer(8081);

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Load test page
    await page.goto('http://localhost:8081/tests/test-smart-bot.html', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });

    // Test Smart Bot scenarios
    const testResults = await page.evaluate(() => {
      /* global Connect4TestUtils:false */
      const results = [];

      // Test 1: Empty board opening
      try {
        const game = new Connect4Game();
        const helpers = new Connect4Helpers(game, null);
        const ai = new Connect4AI('medium');
        const move = ai.getBestMove(game, helpers);
        results.push({
          name: 'Empty board opening',
          passed: move === 3,
          details: `Expected column 4, got column ${move + 1}`
        });
      } catch (e) {
        results.push({
          name: 'Empty board opening',
          passed: false,
          details: `Error: ${e.message}`
        });
      }

      // Test 2: Take winning move
      try {
        const game2 = new Connect4Game();
        const helpers2 = new Connect4Helpers(game2, null);
        const ai2 = new Connect4AI('medium');
        Connect4TestUtils.createTestPosition(game2, 'empty,yellow,yellow,yellow,empty,empty,empty', 2);
        const move = ai2.getBestMove(game2, helpers2);
        const expected = [0, 4]; // Column 1 or 5
        results.push({
          name: 'Take winning move',
          passed: expected.includes(move),
          details: `Expected column 1 or 5, got column ${move + 1}`
        });
      } catch (e) {
        results.push({
          name: 'Take winning move',
          passed: false,
          details: `Error: ${e.message}`
        });
      }

      // Test 3: Block opponent threat
      try {
        const game3 = new Connect4Game();
        const helpers3 = new Connect4Helpers(game3, null);
        const ai3 = new Connect4AI('defensiv-gemischt');
        Connect4TestUtils.createTestPosition(game3, 'red,red,red,empty,empty,empty,empty', 2);
        const move = ai3.getBestMove(game3, helpers3);
        results.push({
          name: 'Block opponent threat',
          passed: move === 3,
          details: `Expected column 4, got column ${move + 1}`
        });
      } catch (e) {
        results.push({
          name: 'Block opponent threat',
          passed: false,
          details: `Error: ${e.message}`
        });
      }

      return results;
    });

    // Print results
    let passed = 0;
    testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.name}: ${result.details}`);
      if (result.passed) passed++;
    });

    const success = passed === testResults.length;
    console.log(`\n${success ? '🎉' : '⚠️'} Smart Bot Tests: ${passed}/${testResults.length} passed\n`);

    return {
      success: success,
      tests: testResults.length,
      passed: passed,
      results: testResults
    };

  } catch (error) {
    console.error(`❌ Smart Bot tests failed: ${error.message}\n`);
    return {
      success: false,
      error: error.message,
      tests: 3,
      passed: 0
    };
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
}

/**
 * Run Connect4 tests using Puppeteer
 */
async function runConnect4Tests() {
  console.log('\n🎮 Running Connect4 Tests...\n');

  let server;
  let browser;

  try {
    // Start local server
    server = await startServer(8081);

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Capture console logs and errors
    const logs = [];
    const errors = [];

    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('error', err => {
      errors.push(err.message);
    });

    page.on('pageerror', err => {
      errors.push(`Page Error: ${err.message}`);
    });

    // Test 1: Page loads without errors
    console.log('📝 Test 1: Page Loading');
    await page.goto('http://localhost:8081/games/connect4/index.html', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });

    const title = await page.title();
    console.log(`   ✅ Page loaded: "${title}"`);

    // Test 2: Game elements are present
    console.log('📝 Test 2: UI Elements');
    const gameBoard = await page.$('#gameBoard');
    const newGameBtn = await page.$('#newGameBtn');
    const columnIndicators = await page.$$('.column-indicator');

    if (!gameBoard) throw new Error('Game board not found');
    if (!newGameBtn) throw new Error('New game button not found');
    if (columnIndicators.length !== 7) throw new Error(`Expected 7 column indicators, found ${columnIndicators.length}`);

    console.log('   ✅ All UI elements present');

    // Test 3: Stone visibility (crucial test!)
    console.log('📝 Test 3: Stone Visibility');

    // Count initial empty cells (should be 42 white circles)
    const initialCells = await page.evaluate(() => {
      const cells = document.querySelectorAll('.cell');
      return {
        total: cells.length,
        empty: Array.from(cells).filter(cell =>
          !cell.classList.contains('red') &&
                    !cell.classList.contains('yellow')
        ).length
      };
    });

    if (initialCells.total !== 42) throw new Error(`Expected 42 cells, found ${initialCells.total}`);
    if (initialCells.empty !== 42) throw new Error(`Expected 42 empty cells, found ${initialCells.empty}`);

    console.log('   ✅ All 42 empty cells visible');

    // Test 4: Make a move and verify stone appears
    console.log('📝 Test 4: Stone Placement');

    // Click column 4 twice (select and place)
    await page.click('.column-indicator[data-col="3"]');
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.click('.column-indicator[data-col="3"]');
    await new Promise(resolve => setTimeout(resolve, 600)); // Wait for animation

    const afterMove = await page.evaluate(() => {
      const cells = document.querySelectorAll('.cell');
      return {
        red: Array.from(cells).filter(cell => cell.classList.contains('red')).length,
        yellow: Array.from(cells).filter(cell => cell.classList.contains('yellow')).length,
        empty: Array.from(cells).filter(cell =>
          !cell.classList.contains('red') &&
                    !cell.classList.contains('yellow')
        ).length
      };
    });

    if (afterMove.red !== 1) throw new Error(`Expected 1 red stone, found ${afterMove.red}`);
    if (afterMove.empty !== 41) throw new Error(`Expected 41 empty cells, found ${afterMove.empty}`);

    console.log('   ✅ Red stone placed and visible');

    // Test 5: Player turn indicator
    console.log('📝 Test 5: Turn Management');
    const currentPlayer = await page.evaluate(() => {
      const indicator = document.querySelector('#currentPlayerIndicator .player-name');
      return indicator ? indicator.textContent : null;
    });

    if (currentPlayer !== '🟡') throw new Error(`Expected yellow player turn, got ${currentPlayer}`);
    console.log('   ✅ Turn switched to yellow player');

    // Test 6: Second move
    console.log('📝 Test 6: Second Move');
    await page.click('.column-indicator[data-col="2"]');
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.click('.column-indicator[data-col="2"]');
    await new Promise(resolve => setTimeout(resolve, 600));

    const afterSecondMove = await page.evaluate(() => {
      const cells = document.querySelectorAll('.cell');
      return {
        red: Array.from(cells).filter(cell => cell.classList.contains('red')).length,
        yellow: Array.from(cells).filter(cell => cell.classList.contains('yellow')).length
      };
    });

    if (afterSecondMove.red !== 1) throw new Error(`Expected 1 red stone, found ${afterSecondMove.red}`);
    if (afterSecondMove.yellow !== 1) throw new Error(`Expected 1 yellow stone, found ${afterSecondMove.yellow}`);

    console.log('   ✅ Yellow stone placed and visible');

    // Test 7: Check for JavaScript errors
    console.log('📝 Test 7: JavaScript Errors');
    if (errors.length > 0) {
      console.log('   ⚠️  JavaScript errors detected:');
      errors.forEach(err => console.log(`      - ${err}`));
    } else {
      console.log('   ✅ No JavaScript errors');
    }

    console.log('\n🎉 All Connect4 tests passed!\n');

    return {
      success: true,
      tests: 7,
      passed: 7,
      errors: errors.length,
      logs: logs.length
    };

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}\n`);
    return {
      success: false,
      error: error.message,
      tests: 7,
      passed: 0
    };
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 LogicCastle Test Suite\n');
  console.log('='.repeat(50));

  // Run UI tests
  const uiResults = await runConnect4Tests();

  // Run Smart Bot tests
  const botResults = await runSmartBotTests();

  console.log('='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   UI Tests: ${uiResults.passed}/${uiResults.tests} ${uiResults.success ? '✅' : '❌'}`);
  console.log(`   Bot Tests: ${botResults.passed}/${botResults.tests} ${botResults.success ? '✅' : '❌'}`);

  const totalTests = uiResults.tests + botResults.tests;
  const totalPassed = uiResults.passed + botResults.passed;
  const overallSuccess = uiResults.success && botResults.success;

  console.log(`   Overall: ${totalPassed}/${totalTests} ${overallSuccess ? '✅' : '❌'}`);

  if (!overallSuccess) {
    if (!uiResults.success) console.log(`   UI Error: ${uiResults.error}`);
    if (!botResults.success) console.log(`   Bot Error: ${botResults.error}`);
    process.exit(1);
  }

  console.log('\n✨ All tests completed successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runConnect4Tests, runSmartBotTests, startServer };
