/**
 * Quick AI Test - Test the await fix
 */

import puppeteer from 'puppeteer';

async function quickAITest() {
    console.log('🚀 Quick AI Test - Testing await fix...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🤖') || text.includes('✅') || text.includes('❌') || msg.type() === 'error') {
            console.log(`[${msg.type().toUpperCase()}] ${text}`);
        }
    });
    
    await page.goto('http://localhost:8081/games/connect4/');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Test AI functionality
    const aiTestResult = await page.evaluate(() => {
        return new Promise((resolve) => {
            console.log('🚀 Testing AI with await fix...');
            
            // Set AI mode
            document.getElementById('gameMode').value = 'vs-bot-easy';
            window.ui.setGameMode('vs-bot-easy');
            
            // Start new game
            window.ui.newGame();
            
            // Make one human move to trigger AI
            setTimeout(() => {
                // Human move in column 4
                window.ui.dropDiscInColumn(3).then(() => {
                    console.log('✅ Human move completed, waiting for AI...');
                    
                    // Wait for AI response
                    setTimeout(() => {
                        const gameState = {
                            moveCount: window.game.getMoveCount(),
                            currentPlayer: window.game.getCurrentPlayer(),
                            gameOver: window.game.isGameOver(),
                            isProcessing: window.ui.isProcessingMove
                        };
                        
                        console.log('📊 Final game state:', gameState);
                        resolve(gameState);
                    }, 3000);
                }).catch(err => {
                    console.error('❌ Human move failed:', err);
                    resolve({ error: 'Human move failed', details: err.message });
                });
            }, 1000);
        });
    });
    
    console.log('\n📊 AI Test Results:', aiTestResult);
    
    console.log('\n🚀 Quick test complete. Browser left open for inspection.');
    return new Promise(() => {}); // Keep browser open
}

quickAITest().catch(console.error);