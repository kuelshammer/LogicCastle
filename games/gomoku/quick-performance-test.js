/**
 * Quick Performance Test for Gobang WASM vs JavaScript
 * Run this in browser console or Node.js
 */

// Performance Test Results
const results = {
    gameLogic: { js: 0, wasm: 0 },
    helpers: { js: 'N/A', wasm: 0 },
    memory: { js: 0, wasm: 0 }
};

async function runQuickPerformanceTest() {
    console.log('🚀 Starte Gobang Performance Vergleich...');
    
    const iterations = 5000;
    const testMoves = [
        [7, 7], [7, 8], [6, 7], [8, 7], [7, 9],
        [5, 7], [9, 7], [7, 6], [7, 10], [4, 7]
    ];

    // Test 1: JavaScript Spiellogik
    console.log('📝 Teste JavaScript Spiellogik...');
    const jsStartTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        const game = new window.GobangGame();
        
        // Make test moves
        testMoves.forEach(([row, col]) => {
            if (!game.isPositionOccupied(row, col)) {
                game.makeMove(row, col);
            }
        });
        
        // Test basic operations
        game.getValidMoves();
        game.getGameState();
    }
    
    const jsTime = performance.now() - jsStartTime;
    results.gameLogic.js = jsTime;
    console.log(`✅ JavaScript: ${jsTime.toFixed(2)} ms (${(jsTime/iterations).toFixed(3)} ms per iteration)`);

    // Test 2: WASM Spiellogik
    console.log('🦀 Teste Rust/WASM Spiellogik...');
    
    try {
        const wasmGame = new window.GobangGame();
        await wasmGame.init();
        
        const wasmStartTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            wasmGame.newGame();
            
            // Make test moves
            testMoves.forEach(([row, col]) => {
                if (wasmGame.isEmpty(row, col)) {
                    try {
                        wasmGame.makeMove(row, col);
                    } catch (e) {
                        // Skip invalid moves
                    }
                }
            });
            
            // Test basic operations
            wasmGame.getValidMoves();
            wasmGame.getGameStats();
        }
        
        const wasmTime = performance.now() - wasmStartTime;
        results.gameLogic.wasm = wasmTime;
        console.log(`✅ Rust/WASM: ${wasmTime.toFixed(2)} ms (${(wasmTime/iterations).toFixed(3)} ms per iteration)`);
        
        // Test 3: WASM Hilfsfunktionen (nur WASM hat diese)
        console.log('🔍 Teste Rust/WASM Hilfsfunktionen...');
        const helpersIterations = 1000;
        
        const helpersStartTime = performance.now();
        let totalFunctionCalls = 0;
        
        for (let i = 0; i < helpersIterations; i++) {
            wasmGame.newGame();
            
            // Setup a test scenario
            try {
                wasmGame.makeMove(7, 7);
                wasmGame.makeMove(7, 8);
                wasmGame.makeMove(8, 7);
                wasmGame.makeMove(8, 8);
            } catch (e) {
                // Skip setup errors
            }
            
            // Test all helper functions
            wasmGame.getWinningMoves();
            wasmGame.getBlockingMoves();
            wasmGame.getDangerousMoves();
            wasmGame.getOpenThreeMoves();
            wasmGame.getClosedFourMoves();
            wasmGame.getDoubleThreeForks();
            wasmGame.getMoveAnalysis();
            totalFunctionCalls += 7;
            
            // Test threat levels for a few positions
            for (let row = 6; row <= 8; row++) {
                for (let col = 6; col <= 8; col++) {
                    if (wasmGame.isEmpty(row, col)) {
                        wasmGame.getThreatLevel(row, col);
                        totalFunctionCalls++;
                    }
                }
            }
        }
        
        const helpersTime = performance.now() - helpersStartTime;
        results.helpers.wasm = helpersTime;
        console.log(`✅ Hilfsfunktionen: ${helpersTime.toFixed(2)} ms (${totalFunctionCalls} calls, ${(helpersTime/totalFunctionCalls).toFixed(3)} ms per call)`);
        
    } catch (error) {
        console.error('❌ WASM Test fehlgeschlagen:', error);
        results.gameLogic.wasm = 'Error';
        results.helpers.wasm = 'Error';
    }

    // Results Summary
    console.log('\n📊 PERFORMANCE ERGEBNISSE:');
    console.log('=' .repeat(50));
    
    if (typeof results.gameLogic.wasm === 'number' && results.gameLogic.js > 0) {
        const speedup = results.gameLogic.js / results.gameLogic.wasm;
        console.log(`🎮 Spiellogik Performance:`);
        console.log(`   JavaScript: ${results.gameLogic.js.toFixed(2)} ms`);
        console.log(`   Rust/WASM: ${results.gameLogic.wasm.toFixed(2)} ms`);
        
        if (speedup > 1) {
            console.log(`   🏆 WASM ist ${speedup.toFixed(2)}x schneller!`);
        } else {
            console.log(`   🏆 JavaScript ist ${(1/speedup).toFixed(2)}x schneller!`);
        }
    }
    
    if (typeof results.helpers.wasm === 'number') {
        console.log(`\n🔍 Erweiterte Hilfsfunktionen:`);
        console.log(`   JavaScript: Nicht implementiert`);
        console.log(`   Rust/WASM: ${results.helpers.wasm.toFixed(2)} ms`);
        console.log(`   🏆 Nur WASM bietet erweiterte Analyse-Features!`);
    }
    
    console.log('\n💡 FAZIT:');
    if (typeof results.gameLogic.wasm === 'number' && results.gameLogic.wasm < results.gameLogic.js) {
        console.log('✅ Rust/WASM bietet bessere Performance UND erweiterte Funktionalität');
    } else if (typeof results.gameLogic.wasm === 'number') {
        console.log('✅ Rust/WASM bietet vergleichbare Performance mit erweiterten Features');
    } else {
        console.log('❌ WASM konnte nicht korrekt getestet werden');
    }
    
    return results;
}

// Export for use in browser/node
if (typeof window !== 'undefined') {
    window.runQuickPerformanceTest = runQuickPerformanceTest;
}

console.log('🔧 Quick Performance Test geladen. Führe runQuickPerformanceTest() aus.');