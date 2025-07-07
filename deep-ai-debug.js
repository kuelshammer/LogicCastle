/**
 * Deep AI Debug - Focuses specifically on game.makeMove() failure
 */

import puppeteer from 'puppeteer';

async function deepAIDebug() {
    console.log('🔬 Deep AI Debug Starting...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enhanced console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🔴') || text.includes('🔍') || text.includes('🎮') || text.includes('❌') || msg.type() === 'error') {
            console.log(`[${msg.type().toUpperCase()}] ${text}`);
        }
    });
    
    await page.goto('http://localhost:8081/games/connect4/');
    
    // Wait for full initialization
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test the exact failing scenario
    console.log('\n🎯 Testing exact AI failure scenario...');
    
    const detailedError = await page.evaluate(() => {
        return new Promise((resolve) => {
            // Set AI mode
            document.getElementById('gameMode').value = 'vs-bot-easy';
            window.ui.setGameMode('vs-bot-easy');
            
            // Start new game
            window.ui.newGame();
            
            setTimeout(async () => {
                try {
                    console.log('🔬 Deep debugging makeMove failure...');
                    
                    // Test game object directly
                    const gameDebug = {
                        gameExists: !!window.game,
                        gameType: typeof window.game,
                        gameConstructor: window.game ? window.game.constructor.name : 'none',
                        makeMoveFn: window.game ? typeof window.game.makeMove : 'none',
                        getCurrentPlayerFn: window.game ? typeof window.game.getCurrentPlayer : 'none',
                        isGameOverFn: window.game ? typeof window.game.isGameOver : 'none'
                    };
                    
                    console.log('🔍 Game Object Debug:', gameDebug);
                    
                    if (!window.game) {
                        resolve({ error: 'Game object not found' });
                        return;
                    }
                    
                    // Test game methods individually
                    try {
                        const currentPlayer = window.game.getCurrentPlayer();
                        console.log('✅ getCurrentPlayer() works:', currentPlayer);
                    } catch (err) {
                        console.error('❌ getCurrentPlayer() failed:', err.message);
                        resolve({ error: 'getCurrentPlayer failed', details: err.message });
                        return;
                    }
                    
                    try {
                        const gameOver = window.game.isGameOver();
                        console.log('✅ isGameOver() works:', gameOver);
                    } catch (err) {
                        console.error('❌ isGameOver() failed:', err.message);
                        resolve({ error: 'isGameOver failed', details: err.message });
                        return;
                    }
                    
                    // Now test makeMove with different parameters
                    console.log('🎮 Testing makeMove(1) directly...');
                    try {
                        const moveResult = await window.game.makeMove(1);
                        console.log('✅ makeMove(1) works:', moveResult);
                        resolve({ success: true, moveResult });
                    } catch (err) {
                        console.error('❌ makeMove(1) failed:', err);
                        
                        // Get detailed error info
                        const errorDetails = {
                            message: err.message,
                            name: err.name,
                            stack: err.stack,
                            errorType: typeof err,
                            errorConstructor: err.constructor.name
                        };
                        
                        console.error('🔬 Detailed error analysis:', errorDetails);
                        resolve({ error: 'makeMove failed', details: errorDetails });
                    }
                    
                } catch (outerErr) {
                    console.error('❌ Debug script failed:', outerErr);
                    resolve({ error: 'debug script failed', details: outerErr.message });
                }
            }, 2000);
        });
    });
    
    console.log('\n📊 Deep Debug Results:', detailedError);
    
    console.log('\n🔍 Debug complete. Browser window left open for inspection.');
    return new Promise(() => {}); // Keep browser open
}

deepAIDebug().catch(console.error);