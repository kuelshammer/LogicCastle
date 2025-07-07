/**
 * Context Debug - Check if this.game vs window.game issue
 */

import puppeteer from 'puppeteer';

async function contextDebug() {
    console.log('🎯 Context Debug Starting...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🎯') || text.includes('❌') || text.includes('✅') || msg.type() === 'error') {
            console.log(`[${msg.type().toUpperCase()}] ${text}`);
        }
    });
    
    await page.goto('http://localhost:8081/games/connect4/');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const contextAnalysis = await page.evaluate(() => {
        return new Promise((resolve) => {
            // Set AI mode and start new game
            document.getElementById('gameMode').value = 'vs-bot-easy';
            window.ui.setGameMode('vs-bot-easy');
            window.ui.newGame();
            
            setTimeout(() => {
                try {
                    console.log('🎯 Analyzing game object contexts...');
                    
                    const analysis = {
                        windowGame: !!window.game,
                        uiGame: !!window.ui.game,
                        sameObject: window.game === window.ui.game,
                        windowGameType: window.game ? typeof window.game.makeMove : 'none',
                        uiGameType: window.ui.game ? typeof window.ui.game.makeMove : 'none'
                    };
                    
                    console.log('🎯 Context Analysis:', analysis);
                    
                    // Test both contexts
                    let windowResult = null;
                    let uiResult = null;
                    let dropResult = null;
                    
                    try {
                        console.log('🎯 Testing window.game.makeMove(3)...');
                        windowResult = window.game.makeMove(3);
                        console.log('✅ window.game.makeMove(3) success');
                    } catch (err) {
                        console.log('❌ window.game.makeMove(3) failed:', err.message);
                        windowResult = { error: err.message };
                    }
                    
                    try {
                        console.log('🎯 Testing window.ui.game.makeMove(4)...');
                        uiResult = window.ui.game.makeMove(4);
                        console.log('✅ window.ui.game.makeMove(4) success');
                    } catch (err) {
                        console.log('❌ window.ui.game.makeMove(4) failed:', err.message);
                        uiResult = { error: err.message };
                    }
                    
                    try {
                        console.log('🎯 Testing window.ui.dropDiscInColumn(5) directly...');
                        dropResult = window.ui.dropDiscInColumn(5);
                        console.log('✅ window.ui.dropDiscInColumn(5) called, waiting for result...');
                        
                        // Give it time to complete
                        setTimeout(() => {
                            resolve({
                                analysis,
                                windowResult,
                                uiResult,
                                dropResult: 'called successfully'
                            });
                        }, 2000);
                        return;
                        
                    } catch (err) {
                        console.log('❌ window.ui.dropDiscInColumn(5) failed:', err.message);
                        dropResult = { error: err.message };
                    }
                    
                    resolve({
                        analysis,
                        windowResult,
                        uiResult,
                        dropResult
                    });
                    
                } catch (err) {
                    console.error('❌ Context debug failed:', err);
                    resolve({ error: err.message });
                }
            }, 2000);
        });
    });
    
    console.log('\n📊 Context Analysis Results:', contextAnalysis);
    
    console.log('\n🎯 Context debug complete. Browser window left open.');
    return new Promise(() => {}); // Keep browser open
}

contextDebug().catch(console.error);