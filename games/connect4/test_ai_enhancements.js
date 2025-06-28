/**
 * Test Suite for Connect4 Phase 1 AI Enhancements
 * 
 * Validates the memory-efficient AI optimizations implemented in Rust
 */

import init, { Game, Player } from '../../game_engine/pkg/game_engine.js';

class AIEnhancementTester {
    constructor() {
        this.testResults = [];
        this.wasmInitialized = false;
    }

    async initialize() {
        if (!this.wasmInitialized) {
            await init();
            this.wasmInitialized = true;
            console.log("✅ WASM initialized for testing");
        }
    }

    addTestResult(name, passed, details = null) {
        this.testResults.push({
            name,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${name}${details ? ` - ${details}` : ''}`);
    }

    /**
     * Test 1: Player opponent() method
     */
    testPlayerOpponent() {
        const yellow = Player.Yellow;
        const red = Player.Red;
        
        // Test that the opponent method works correctly
        // Note: We can't directly call opponent() from JS due to WASM bindings
        // But we can test the behavior through game state changes
        
        const game = new Game(6, 7, 4, true);
        const initialPlayer = game.get_current_player();
        
        // Make a move and check player changes
        game.make_move_connect4_js(0);
        const nextPlayer = game.get_current_player();
        
        const opponentWorks = initialPlayer !== nextPlayer;
        this.addTestResult(
            'Player opponent switching',
            opponentWorks,
            `${initialPlayer} -> ${nextPlayer}`
        );
        
        return opponentWorks;
    }

    /**
     * Test 2: Board column utilities
     */
    testBoardUtilities() {
        const game = new Game(6, 7, 4, true);
        
        // Test legal move count on empty board
        const initialMoveCount = game.legal_move_count_connect4();
        const expectedMoves = 7; // All columns should be available
        
        this.addTestResult(
            'Initial legal move count',
            initialMoveCount === expectedMoves,
            `Got ${initialMoveCount}, expected ${expectedMoves}`
        );
        
        // Test legal moves array
        const legalMoves = game.get_legal_moves_connect4();
        const correctMoves = legalMoves.length === 7 && 
                           legalMoves.every((move, idx) => move === idx);
        
        this.addTestResult(
            'Legal moves array',
            correctMoves,
            `Moves: [${legalMoves.join(', ')}]`
        );
        
        // Fill a column and test
        for (let i = 0; i < 6; i++) {
            game.make_move_connect4_js(0);
        }
        
        const reducedMoveCount = game.legal_move_count_connect4();
        const expectedReduced = 6; // Column 0 should be full now
        
        this.addTestResult(
            'Reduced legal move count after filling column',
            reducedMoveCount === expectedReduced,
            `Got ${reducedMoveCount}, expected ${expectedReduced}`
        );
        
        return initialMoveCount === expectedMoves && correctMoves && reducedMoveCount === expectedReduced;
    }

    /**
     * Test 3: Fast cloning and simulation
     */
    testFastCloning() {
        const game = new Game(6, 7, 4, true);
        
        // Make some moves
        game.make_move_connect4_js(3);
        game.make_move_connect4_js(2);
        game.make_move_connect4_js(4);
        
        const originalBoard = game.get_board();
        const originalPlayer = game.get_current_player();
        
        // Test fast clone
        const cloned = game.fast_clone();
        const clonedBoard = cloned.get_board();
        const clonedPlayer = cloned.get_current_player();
        
        // Verify clone is identical
        const boardsMatch = originalBoard.every((cell, idx) => cell === clonedBoard[idx]);
        const playersMatch = originalPlayer === clonedPlayer;
        
        this.addTestResult(
            'Fast clone accuracy',
            boardsMatch && playersMatch,
            `Boards match: ${boardsMatch}, Players match: ${playersMatch}`
        );
        
        // Test simulation doesn't affect original
        try {
            const simulated = game.simulate_move_connect4(5);
            const afterSimBoard = game.get_board();
            const afterSimPlayer = game.get_current_player();
            
            const originalUnchanged = originalBoard.every((cell, idx) => cell === afterSimBoard[idx]) &&
                                   originalPlayer === afterSimPlayer;
            
            this.addTestResult(
                'Simulation immutability',
                originalUnchanged,
                'Original game state preserved after simulation'
            );
            
            return boardsMatch && playersMatch && originalUnchanged;
        } catch (error) {
            this.addTestResult('Simulation immutability', false, `Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Test 4: Position evaluation
     */
    testPositionEvaluation() {
        // Test empty board evaluation
        const emptyGame = new Game(6, 7, 4, true);
        const emptyEval = emptyGame.evaluate_position();
        
        this.addTestResult(
            'Empty board evaluation',
            emptyEval === 0,
            `Got ${emptyEval}, expected 0`
        );
        
        // Create a winning position for Yellow
        const winGame = new Game(6, 7, 4, true);
        // Set up a horizontal win for Yellow (player 1)
        for (let i = 0; i < 4; i++) {
            winGame.make_move_connect4_js(i); // Yellow
            if (i < 3) {
                winGame.make_move_connect4_js(i); // Red (on top)
            }
        }
        
        const winEval = winGame.evaluate_position();
        const isWinningEval = Math.abs(winEval) === 1000;
        
        this.addTestResult(
            'Winning position evaluation',
            isWinningEval,
            `Got ${winEval}, expected ±1000`
        );
        
        return emptyEval === 0 && isWinningEval;
    }

    /**
     * Test 5: Threat detection
     */
    testThreatDetection() {
        // Create a position with a threat
        const game = new Game(6, 7, 4, true);
        
        // Set up three in a row for Yellow, Red's turn
        game.make_move_connect4_js(0); // Yellow
        game.make_move_connect4_js(0); // Red
        game.make_move_connect4_js(1); // Yellow  
        game.make_move_connect4_js(1); // Red
        game.make_move_connect4_js(2); // Yellow
        game.make_move_connect4_js(3); // Red
        
        // Now Yellow has three in a row, needs to block at column 3
        const yellowThreats = game.count_threats(Player.Yellow);
        const redThreats = game.count_threats(Player.Red);
        
        this.addTestResult(
            'Threat detection',
            yellowThreats >= 1,
            `Yellow threats: ${yellowThreats}, Red threats: ${redThreats}`
        );
        
        return yellowThreats >= 1;
    }

    /**
     * Test 6: Terminal state detection
     */
    testTerminalStates() {
        // Test non-terminal state
        const ongoingGame = new Game(6, 7, 4, true);
        ongoingGame.make_move_connect4_js(3);
        
        const isTerminal1 = ongoingGame.is_terminal();
        this.addTestResult(
            'Non-terminal state detection',
            !isTerminal1,
            'Game with one move should not be terminal'
        );
        
        // Test full board (draw)
        const fullGame = new Game(6, 7, 4, true);
        // Fill the board
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 6; row++) {
                try {
                    fullGame.make_move_connect4_js(col);
                } catch (e) {
                    // Column might be full, continue
                }
            }
        }
        
        const isTerminal2 = fullGame.is_terminal();
        this.addTestResult(
            'Full board terminal detection',
            isTerminal2,
            'Full board should be terminal'
        );
        
        return !isTerminal1 && isTerminal2;
    }

    /**
     * Test 7: Performance characteristics
     */
    async testPerformance() {
        const iterations = 1000;
        const game = new Game(6, 7, 4, true);
        
        // Test cloning performance
        const cloneStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            const cloned = game.fast_clone();
        }
        const cloneEnd = performance.now();
        const cloneTime = (cloneEnd - cloneStart) / iterations;
        
        // Test legal move generation performance
        const moveStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            const moves = game.get_legal_moves_connect4();
        }
        const moveEnd = performance.now();
        const moveTime = (moveEnd - moveStart) / iterations;
        
        // Test simulation performance
        const simStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            try {
                const sim = game.simulate_move_connect4(3);
            } catch (e) {
                // Ignore errors for performance test
            }
        }
        const simEnd = performance.now();
        const simTime = (simEnd - simStart) / iterations;
        
        // Performance targets (adjust based on expectations)
        const cloneThreshold = 0.1; // ms
        const moveThreshold = 0.05; // ms
        const simThreshold = 0.2; // ms
        
        this.addTestResult(
            'Cloning performance',
            cloneTime < cloneThreshold,
            `${cloneTime.toFixed(3)}ms/op (threshold: ${cloneThreshold}ms)`
        );
        
        this.addTestResult(
            'Move generation performance',
            moveTime < moveThreshold,
            `${moveTime.toFixed(3)}ms/op (threshold: ${moveThreshold}ms)`
        );
        
        this.addTestResult(
            'Simulation performance',
            simTime < simThreshold,
            `${simTime.toFixed(3)}ms/op (threshold: ${simThreshold}ms)`
        );
        
        return {
            cloneTime,
            moveTime,
            simTime,
            passedPerformance: cloneTime < cloneThreshold && 
                             moveTime < moveThreshold && 
                             simTime < simThreshold
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log("🧪 Starting Connect4 Phase 1 AI Enhancement Tests");
        console.log("=" .repeat(60));
        
        await this.initialize();
        
        // Run functional tests
        const tests = [
            () => this.testPlayerOpponent(),
            () => this.testBoardUtilities(),
            () => this.testFastCloning(),
            () => this.testPositionEvaluation(),
            () => this.testThreatDetection(),
            () => this.testTerminalStates()
        ];
        
        let functionalTestsPassed = 0;
        for (const test of tests) {
            try {
                if (test()) {
                    functionalTestsPassed++;
                }
            } catch (error) {
                console.error(`Test failed with error: ${error.message}`);
            }
        }
        
        // Run performance tests
        const performanceResults = await this.testPerformance();
        
        // Summary
        console.log("\n" + "=" .repeat(60));
        console.log("📊 Test Summary");
        console.log("=" .repeat(60));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        
        console.log(`Total tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success rate: ${(passedTests / totalTests * 100).toFixed(1)}%`);
        
        console.log("\n📈 Performance Summary:");
        console.log(`  Clone time: ${performanceResults.cloneTime.toFixed(3)}ms/op`);
        console.log(`  Move gen time: ${performanceResults.moveTime.toFixed(3)}ms/op`);
        console.log(`  Simulation time: ${performanceResults.simTime.toFixed(3)}ms/op`);
        
        const overallSuccess = passedTests === totalTests && performanceResults.passedPerformance;
        
        if (overallSuccess) {
            console.log("\n🎉 All tests passed! Phase 1 AI enhancements are working correctly.");
        } else {
            console.log("\n⚠️ Some tests failed. Please review the implementation.");
        }
        
        return {
            totalTests,
            passedTests,
            successRate: passedTests / totalTests,
            performance: performanceResults,
            overallSuccess,
            details: this.testResults
        };
    }
}

// Export for use in other modules
export { AIEnhancementTester };

// If run directly in browser
if (typeof window !== 'undefined') {
    window.AIEnhancementTester = AIEnhancementTester;
    
    // Auto-run tests
    const tester = new AIEnhancementTester();
    tester.runAllTests().then(results => {
        console.log("Tests completed. Results:", results);
    });
}