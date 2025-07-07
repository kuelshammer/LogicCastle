/**
 * Simple AI Test - Analysiert nur die wichtigsten AI-Logs
 */

import puppeteer from 'puppeteer';

async function testAI() {
    console.log('🤖 Simple AI Test Starting...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Sammle nur AI-relevante Logs
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('🤖') || text.includes('AI') || text.includes('makeAIMove') || 
            text.includes('Connect4AI') || msg.type() === 'error') {
            console.log(`[${msg.type().toUpperCase()}] ${text}`);
        }
    });
    
    await page.goto('http://localhost:8081/games/connect4/');
    
    // Warte einfach 5 Sekunden auf vollständige Initialisierung
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Teste manuelle AI-Funktion
    console.log('\n🔧 Testing AI functionality manually...');
    
    const aiTestResult = await page.evaluate(() => {
        // Teste alle relevanten AI-Komponenten
        const results = {
            gameExists: !!window.game,
            aiExists: !!window.ai,
            uiExists: !!window.ui,
            connect4AIClass: typeof Connect4AI !== 'undefined',
            makeAIMoveMethod: window.ui && typeof window.ui.makeAIMove === 'function'
        };
        
        console.log('🔍 AI Component Check:', results);
        
        // Teste Connect4AI direkt
        if (typeof Connect4AI !== 'undefined' && window.game) {
            try {
                console.log('🤖 Testing Connect4AI.getBestMove directly...');
                const testMove = Connect4AI.getBestMove(window.game, 2);
                console.log('🤖 Direct AI test result:', testMove);
                results.directAITest = testMove;
            } catch (error) {
                console.error('❌ Direct AI test failed:', error);
                results.directAIError = error.message;
            }
        }
        
        return results;
    });
    
    console.log('\n📊 AI Test Results:', aiTestResult);
    
    // Wenn AI existiert, teste einen echten AI-Zug
    if (aiTestResult.makeAIMoveMethod) {
        console.log('\n🎮 Testing actual AI move...');
        
        await page.evaluate(() => {
            // Setze AI-Modus
            document.getElementById('gameMode').value = 'vs-bot-easy';
            window.ui.setGameMode('vs-bot-easy');
            
            // Starte neues Spiel
            window.ui.newGame();
            
            // Versuche AI-Zug
            setTimeout(() => {
                console.log('🤖 Manually triggering AI move...');
                window.ui.makeAIMove();
            }, 1000);
        });
        
        // Warte auf AI-Reaktion
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('\n✅ AI Test complete. Check console logs above for details.');
    console.log('Browser window left open for manual testing.');
}

testAI().catch(console.error);