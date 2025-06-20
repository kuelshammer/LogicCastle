#!/usr/bin/env node

/**
 * Simple Smart Bot test runner that uses the test HTML page
 * but with better error handling and timeout management.
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Start test server with better error handling
 */
function startTestServer(port = 8082) {
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
 * Run Smart Bot tests
 */
async function runSmartBotTests() {
    console.log('🤖 Smart Bot Test Runner');
    console.log('='.repeat(25));
    
    let server;
    let browser;
    
    try {
        // Start server
        server = await startTestServer(8082);
        const serverPort = server.address().port;
        
        // Launch browser
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set longer timeout
        page.setDefaultTimeout(30000);
        
        // Load test page
        console.log('📂 Loading test page...');
        await page.goto(`http://localhost:${serverPort}/tests/test-smart-bot.html`, { 
            waitUntil: 'networkidle0'
        });
        
        console.log('✅ Test page loaded\n');
        
        // Run basic functionality test
        console.log('🧪 Testing basic functionality...');
        
        const basicTest = await page.evaluate(() => {
            try {
                // Test if classes are available
                if (typeof Connect4Game === 'undefined') {
                    return { success: false, error: 'Connect4Game not available' };
                }
                if (typeof Connect4AI === 'undefined') {
                    return { success: false, error: 'Connect4AI not available' };
                }
                if (typeof Connect4TestUtils === 'undefined') {
                    return { success: false, error: 'Connect4TestUtils not available' };
                }
                
                // Test basic instantiation
                const game = new Connect4Game();
                const ai = new Connect4AI('smart-random');
                const helpers = new Connect4Helpers(game, null);
                
                return { success: true, message: 'All classes instantiated successfully' };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        if (!basicTest.success) {
            throw new Error(`Basic test failed: ${basicTest.error}`);
        }
        
        console.log(`✅ ${basicTest.message}`);
        
        // Test opening move
        console.log('\n🎯 Testing opening move...');
        const openingTest = await page.evaluate(() => {
            try {
                const game = new Connect4Game();
                const ai = new Connect4AI('smart-random');
                const helpers = new Connect4Helpers(game, null);
                
                const move = ai.getBestMove(game, helpers);
                
                return {
                    success: move === 3,
                    move: move,
                    expected: 3
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        if (openingTest.success) {
            console.log(`✅ Opening move test passed (column ${openingTest.move + 1})`);
        } else if (openingTest.error) {
            console.log(`❌ Opening move test error: ${openingTest.error}`);
        } else {
            console.log(`❌ Opening move test failed: got column ${openingTest.move + 1}, expected column 4`);
        }
        
        // Test pattern creation
        console.log('\n📋 Testing pattern creation...');
        const patternTest = await page.evaluate(() => {
            try {
                const game = new Connect4Game();
                
                Connect4TestUtils.createTestPosition(game, "red,yellow,empty,red-yellow,empty,empty,yellow", 1);
                
                const ascii = Connect4TestUtils.toAscii(game);
                const hasRed = ascii.includes('R');
                const hasYellow = ascii.includes('Y');
                
                return {
                    success: hasRed && hasYellow,
                    ascii: ascii
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        if (patternTest.success) {
            console.log('✅ Pattern creation test passed');
            console.log('   Board state:');
            patternTest.ascii.split('\n').forEach(line => console.log(`   ${line}`));
        } else {
            console.log(`❌ Pattern creation test failed: ${patternTest.error}`);
        }
        
        // Test winning move detection
        console.log('\n🏆 Testing winning move detection...');
        const winTest = await page.evaluate(() => {
            try {
                const game = new Connect4Game();
                const ai = new Connect4AI('smart-random');
                const helpers = new Connect4Helpers(game, null);
                
                Connect4TestUtils.createTestPosition(game, "empty,yellow,yellow,yellow,empty,empty,empty", 2);
                
                const move = ai.getBestMove(game, helpers);
                const expected = [0, 4]; // Column 1 or 5
                
                return {
                    success: expected.includes(move),
                    move: move,
                    expected: expected
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        if (winTest.success) {
            console.log(`✅ Winning move test passed (column ${winTest.move + 1})`);
        } else if (winTest.error) {
            console.log(`❌ Winning move test error: ${winTest.error}`);
        } else {
            console.log(`❌ Winning move test failed: got column ${winTest.move + 1}, expected column 1 or 5`);
        }
        
        // Summary
        const allTests = [basicTest, openingTest, patternTest, winTest];
        const passedTests = allTests.filter(t => t.success).length;
        const totalTests = allTests.length;
        
        console.log('\n' + '='.repeat(25));
        console.log('📊 Test Summary:');
        console.log(`   Tests: ${passedTests}/${totalTests}`);
        console.log(`   Status: ${passedTests === totalTests ? '✅ All passed' : '❌ Some failed'}`);
        
        if (passedTests === totalTests) {
            console.log('\n🎉 Smart Bot tests completed successfully!');
            return { success: true, passed: passedTests, total: totalTests };
        } else {
            console.log('\n⚠️ Some tests failed. Check implementation.');
            return { success: false, passed: passedTests, total: totalTests };
        }
        
    } catch (error) {
        console.error(`\n❌ Test failed: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
        if (server) server.close();
    }
}

// Run if called directly
if (require.main === module) {
    runSmartBotTests().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { runSmartBotTests };