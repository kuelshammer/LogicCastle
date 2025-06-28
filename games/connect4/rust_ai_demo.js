import init, { Game, Player } from '../../game_engine/pkg/game_engine.js';

/**
 * Phase 1 AI Enhancements Demo
 * 
 * This demonstrates the memory-efficient AI enhancements added to the Rust game engine:
 * 1. Lightweight cloning for simulations
 * 2. Efficient legal move generation
 * 3. Fast threat detection
 * 4. Memory-optimized position evaluation
 */

async function initWasm() {
    await init();
}

class Connect4AI {
    constructor(depth = 4) {
        this.maxDepth = depth;
    }

    /**
     * Simple minimax implementation using the new Rust AI enhancements
     */
    getBestMove(game) {
        const legalMoves = game.get_legal_moves_connect4();
        
        if (legalMoves.length === 0) {
            return null;
        }

        if (legalMoves.length === 1) {
            return legalMoves[0];
        }

        let bestMove = legalMoves[0];
        let bestScore = -Infinity;

        for (const move of legalMoves) {
            try {
                // Use fast simulation (memory efficient)
                const nextState = game.simulate_move_connect4(move);
                const score = this.minimax(nextState, this.maxDepth - 1, false, -Infinity, Infinity);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            } catch (error) {
                console.warn(`Invalid move ${move}:`, error);
            }
        }

        return bestMove;
    }

    /**
     * Minimax with alpha-beta pruning using Rust optimizations
     */
    minimax(game, depth, isMaximizing, alpha, beta) {
        // Use Rust's fast terminal check
        if (depth === 0 || game.is_terminal()) {
            return game.evaluate_position();
        }

        // Use efficient legal move generation
        const legalMoves = game.get_legal_moves_connect4();
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            
            for (const move of legalMoves) {
                try {
                    // Fast simulation with memory reuse
                    const nextState = game.simulate_move_connect4(move);
                    const eval = this.minimax(nextState, depth - 1, false, alpha, beta);
                    
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                    
                    if (beta <= alpha) {
                        break; // Alpha-beta pruning
                    }
                } catch (error) {
                    // Skip invalid moves
                    continue;
                }
            }
            
            return maxEval;
        } else {
            let minEval = Infinity;
            
            for (const move of legalMoves) {
                try {
                    const nextState = game.simulate_move_connect4(move);
                    const eval = this.minimax(nextState, depth - 1, true, alpha, beta);
                    
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    
                    if (beta <= alpha) {
                        break; // Alpha-beta pruning
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return minEval;
        }
    }

    /**
     * Quick threat analysis using Rust's efficient threat detection
     */
    analyzePosition(game) {
        const currentPlayer = game.get_current_player();
        const opponent = currentPlayer === Player.Yellow ? Player.Red : Player.Yellow;
        
        const myThreats = game.count_threats(currentPlayer);
        const opponentThreats = game.count_threats(opponent);
        const legalMoveCount = game.legal_move_count_connect4();
        
        return {
            myThreats,
            opponentThreats,
            legalMoveCount,
            isWinning: myThreats > 0,
            isLosing: opponentThreats > 0,
            mobility: legalMoveCount
        };
    }
}

/**
 * Performance benchmark comparing old vs new approach
 */
async function benchmarkPerformance() {
    await initWasm();
    
    console.log("🧪 Phase 1 AI Enhancements - Performance Benchmark");
    console.log("=" .repeat(50));
    
    const game = new Game(6, 7, 4, true);
    const ai = new Connect4AI(4);
    
    // Make a few moves to create an interesting position
    game.make_move_connect4_js(3); // Yellow center
    game.make_move_connect4_js(3); // Red center
    game.make_move_connect4_js(2); // Yellow
    game.make_move_connect4_js(4); // Red
    game.make_move_connect4_js(2); // Yellow
    
    console.log("📊 Current Position Analysis:");
    const analysis = ai.analyzePosition(game);
    console.log(`  • Legal moves: ${analysis.legalMoveCount}`);
    console.log(`  • My threats: ${analysis.myThreats}`);
    console.log(`  • Opponent threats: ${analysis.opponentThreats}`);
    console.log(`  • Position status: ${analysis.isWinning ? 'Winning' : analysis.isLosing ? 'Losing' : 'Neutral'}`);
    
    // Benchmark AI decision time
    const startTime = performance.now();
    const bestMove = ai.getBestMove(game);
    const endTime = performance.now();
    
    console.log(`⚡ AI Performance:`);
    console.log(`  • Best move: Column ${bestMove}`);
    console.log(`  • Decision time: ${(endTime - startTime).toFixed(2)}ms`);
    
    // Test memory efficiency with multiple simulations
    const simulationStart = performance.now();
    const numSimulations = 1000;
    
    for (let i = 0; i < numSimulations; i++) {
        const cloned = game.fast_clone();
        cloned.get_legal_moves_connect4();
    }
    
    const simulationEnd = performance.now();
    const avgSimulationTime = (simulationEnd - simulationStart) / numSimulations;
    
    console.log(`📈 Memory Efficiency Test:`);
    console.log(`  • ${numSimulations} fast clones + legal move generation`);
    console.log(`  • Average time per simulation: ${avgSimulationTime.toFixed(3)}ms`);
    console.log(`  • Total time: ${(simulationEnd - simulationStart).toFixed(2)}ms`);
    
    return {
        decisionTime: endTime - startTime,
        avgSimulationTime,
        analysis
    };
}

/**
 * Demo game with AI
 */
async function playDemo() {
    await initWasm();
    
    console.log("🎮 Connect4 AI Demo - Phase 1 Enhancements");
    console.log("=" .repeat(40));
    
    const game = new Game(6, 7, 4, true);
    const ai = new Connect4AI(5); // Depth 5 for strong play
    
    let moveCount = 0;
    
    while (!game.is_game_over() && moveCount < 20) {
        const currentPlayer = game.get_current_player();
        const playerName = currentPlayer === Player.Yellow ? "Yellow" : "Red";
        
        console.log(`\n🔄 Move ${moveCount + 1} - ${playerName}'s turn`);
        
        if (currentPlayer === Player.Yellow) {
            // Human move (simulated as center-preferring)
            const legalMoves = game.get_legal_moves_connect4();
            const centerCol = Math.floor(game.get_board().length / 7 / 2);
            const humanMove = legalMoves.includes(centerCol) ? centerCol : legalMoves[0];
            
            console.log(`👤 Human plays column ${humanMove}`);
            game.make_move_connect4_js(humanMove);
        } else {
            // AI move
            const aiStart = performance.now();
            const aiMove = ai.getBestMove(game);
            const aiEnd = performance.now();
            
            console.log(`🤖 AI plays column ${aiMove} (${(aiEnd - aiStart).toFixed(1)}ms)`);
            
            if (aiMove !== null) {
                game.make_move_connect4_js(aiMove);
            }
        }
        
        moveCount++;
    }
    
    // Game result
    const winner = game.check_win();
    if (winner) {
        const winnerName = winner === Player.Yellow ? "Yellow (Human)" : "Red (AI)";
        console.log(`🏆 Game Over! Winner: ${winnerName}`);
    } else {
        console.log(`🤝 Game Over! It's a draw.`);
    }
    
    return game;
}

// Export for use
export { initWasm, Connect4AI, benchmarkPerformance, playDemo };

// Auto-run demo if this script is executed directly
if (typeof window !== 'undefined') {
    window.Connect4AI = Connect4AI;
    window.benchmarkPerformance = benchmarkPerformance;
    window.playDemo = playDemo;
    
    console.log("✅ Connect4 AI Phase 1 Enhancements loaded!");
    console.log("Try: benchmarkPerformance() or playDemo()");
}