/**
 * 🧠 GOMOKU MEMORY BENCHMARK SUITE
 * 
 * Comprehensive memory usage analysis for Gomoku optimization
 * Measures baseline performance before optimization implementation
 * 
 * Usage: node tests/memory/gomoku-memory-benchmark.js
 */

import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';
import { join } from 'path';

class GomokuMemoryBenchmark {
    constructor() {
        this.results = {
            baseline: {},
            hotspots: {},
            measurements: [],
            timestamp: new Date().toISOString()
        };
        
        this.testIterations = 100;
        this.gameLength = 50; // Average game length in moves
    }

    /**
     * Run complete memory benchmark suite
     */
    async runBenchmark() {
        console.log('🧠 GOMOKU MEMORY BENCHMARK SUITE');
        console.log('==================================');
        console.log(`Test iterations: ${this.testIterations}`);
        console.log(`Average game length: ${this.gameLength} moves\n`);

        // 1. Baseline Memory Usage
        await this.measureBaselineMemory();
        
        // 2. Undo/Redo System Analysis
        await this.measureUndoRedoMemory();
        
        // 3. AI Analysis Memory
        await this.measureAIAnalysisMemory();
        
        // 4. Game State Snapshot Analysis
        await this.measureGameStateMemory();
        
        // 5. Object Creation Patterns
        await this.measureObjectCreationMemory();
        
        // Generate comprehensive report
        this.generateReport();
    }

    /**
     * Measure baseline memory usage for empty game
     */
    async measureBaselineMemory() {
        console.log('📊 Measuring baseline memory usage...');
        
        const measurements = [];
        
        for (let i = 0; i < this.testIterations; i++) {
            const startMemory = this.getMemoryUsage();
            
            // Simulate game initialization
            const gameState = {
                board: new Array(19).fill(null).map(() => new Array(19).fill(0)),
                moveHistory: [],
                currentPlayer: 1,
                moveCount: 0
            };
            
            const endMemory = this.getMemoryUsage();
            
            measurements.push({
                iteration: i,
                startMemory,
                endMemory,
                memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                boardSize: 19 * 19 * 4 // 4 bytes per cell estimate
            });
            
            // Cleanup
            gameState.board = null;
            gameState.moveHistory = null;
            
            if (global.gc) global.gc();
        }
        
        this.results.baseline = this.analyzeMemoryMeasurements(measurements);
        console.log(`✅ Baseline: ${this.formatMemory(this.results.baseline.avgMemoryDelta)}`);
    }

    /**
     * Measure memory usage of undo/redo system
     */
    async measureUndoRedoMemory() {
        console.log('🔄 Measuring undo/redo memory usage...');
        
        const measurements = [];
        
        for (let i = 0; i < this.testIterations; i++) {
            const startMemory = this.getMemoryUsage();
            
            // Simulate full game with undo operations
            const moveHistory = [];
            
            // Create moves
            for (let move = 0; move < this.gameLength; move++) {
                const moveObject = {
                    row: Math.floor(Math.random() * 19),
                    col: Math.floor(Math.random() * 19),
                    player: (move % 2) + 1,
                    moveNumber: move + 1,
                    timestamp: Date.now()
                };
                moveHistory.push(moveObject);
            }
            
            // Simulate undo operation (critical hotspot)
            const undoMemoryStart = this.getMemoryUsage();
            
            // This simulates the critical hotspot: [...this.moveHistory]
            const movesToReplay = [...moveHistory];
            const newMoveHistory = [];
            
            // Simulate replay (O(n) operation)
            for (const move of movesToReplay) {
                const replayedMove = { ...move }; // Object cloning
                newMoveHistory.push(replayedMove);
            }
            
            const undoMemoryEnd = this.getMemoryUsage();
            const endMemory = this.getMemoryUsage();
            
            measurements.push({
                iteration: i,
                startMemory,
                endMemory,
                undoMemoryStart,
                undoMemoryEnd,
                memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                totalMemoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                undoMemoryDelta: undoMemoryEnd.heapUsed - undoMemoryStart.heapUsed,
                moveCount: moveHistory.length,
                memoryPerMove: moveHistory.length > 0 ? (endMemory.heapUsed - startMemory.heapUsed) / moveHistory.length : 0
            });
            
            // Cleanup
            moveHistory.length = 0;
            newMoveHistory.length = 0;
            
            if (global.gc) global.gc();
        }
        
        this.results.hotspots.undoRedo = this.analyzeMemoryMeasurements(measurements);
        console.log(`✅ Undo/Redo: ${this.formatMemory(this.results.hotspots.undoRedo.avgMemoryDelta)}`);
    }

    /**
     * Measure AI analysis memory usage
     */
    async measureAIAnalysisMemory() {
        console.log('🤖 Measuring AI analysis memory usage...');
        
        const measurements = [];
        
        for (let i = 0; i < this.testIterations; i++) {
            const startMemory = this.getMemoryUsage();
            
            // Simulate AI candidate move generation
            const candidateMoves = [];
            const movesToAnalyze = 30; // Typical AI analysis breadth
            
            for (let move = 0; move < movesToAnalyze; move++) {
                const moveObject = {
                    row: Math.floor(Math.random() * 19),
                    col: Math.floor(Math.random() * 19),
                    strength: Math.random() * 100,
                    reasoning: `Analysis for move ${move}`,
                    priority: Math.floor(Math.random() * 5) + 1,
                    threats: [],
                    opportunities: [],
                    // Simulate object spreading (hotspot)
                    ...{
                        evaluationScore: Math.random() * 1000,
                        patterns: ['pattern1', 'pattern2', 'pattern3'],
                        defenseRating: Math.random() * 100,
                        attackRating: Math.random() * 100
                    }
                };
                
                candidateMoves.push(moveObject);
            }
            
            // Simulate move selection and scoring
            const scoredMoves = candidateMoves.map(move => ({
                ...move, // Critical hotspot: object spreading
                finalScore: move.strength + move.evaluationScore,
                rank: candidateMoves.indexOf(move)
            }));
            
            const endMemory = this.getMemoryUsage();
            
            measurements.push({
                iteration: i,
                startMemory,
                endMemory,
                memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                candidateCount: candidateMoves.length,
                memoryPerCandidate: (endMemory.heapUsed - startMemory.heapUsed) / candidateMoves.length
            });
            
            // Cleanup
            candidateMoves.length = 0;
            scoredMoves.length = 0;
            
            if (global.gc) global.gc();
        }
        
        this.results.hotspots.aiAnalysis = this.analyzeMemoryMeasurements(measurements);
        console.log(`✅ AI Analysis: ${this.formatMemory(this.results.hotspots.aiAnalysis.avgMemoryDelta)}`);
    }

    /**
     * Measure game state snapshot memory
     */
    async measureGameStateMemory() {
        console.log('💾 Measuring game state snapshot memory...');
        
        const measurements = [];
        
        for (let i = 0; i < this.testIterations; i++) {
            const startMemory = this.getMemoryUsage();
            
            const gameHistory = [];
            
            // Simulate game progression with state snapshots
            for (let turn = 0; turn < this.gameLength; turn++) {
                const gameState = {
                    board: new Array(19).fill(null).map(() => new Array(19).fill(0)),
                    currentPlayer: (turn % 2) + 1,
                    moveCount: turn + 1,
                    moveHistory: new Array(turn + 1).fill(null).map((_, idx) => ({
                        row: Math.floor(Math.random() * 19),
                        col: Math.floor(Math.random() * 19),
                        player: (idx % 2) + 1,
                        moveNumber: idx + 1
                    })),
                    timestamp: Date.now()
                };
                
                // Critical hotspot: state accumulation
                gameHistory.push(gameState);
            }
            
            const endMemory = this.getMemoryUsage();
            
            measurements.push({
                iteration: i,
                startMemory,
                endMemory,
                memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                stateCount: gameHistory.length,
                memoryPerState: (endMemory.heapUsed - startMemory.heapUsed) / gameHistory.length,
                totalBoardCells: gameHistory.length * 19 * 19
            });
            
            // Cleanup
            gameHistory.length = 0;
            
            if (global.gc) global.gc();
        }
        
        this.results.hotspots.gameState = this.analyzeMemoryMeasurements(measurements);
        console.log(`✅ Game State: ${this.formatMemory(this.results.hotspots.gameState.avgMemoryDelta)}`);
    }

    /**
     * Measure object creation patterns
     */
    async measureObjectCreationMemory() {
        console.log('🏗️ Measuring object creation patterns...');
        
        const measurements = [];
        
        for (let i = 0; i < this.testIterations; i++) {
            const startMemory = this.getMemoryUsage();
            
            // Simulate typical object creation patterns
            const objectPool = [];
            const objectCount = 1000; // Simulate high object creation
            
            for (let obj = 0; obj < objectCount; obj++) {
                const moveObject = {
                    id: obj,
                    row: Math.floor(Math.random() * 19),
                    col: Math.floor(Math.random() * 19),
                    data: new Array(50).fill(Math.random()) // Simulate data payload
                };
                
                // Simulate object spreading (common pattern)
                const extendedObject = {
                    ...moveObject,
                    timestamp: Date.now(),
                    metadata: {
                        created: Date.now(),
                        processed: false
                    }
                };
                
                objectPool.push(extendedObject);
            }
            
            const endMemory = this.getMemoryUsage();
            
            measurements.push({
                iteration: i,
                startMemory,
                endMemory,
                memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                objectCount: objectPool.length,
                memoryPerObject: (endMemory.heapUsed - startMemory.heapUsed) / objectPool.length
            });
            
            // Cleanup
            objectPool.length = 0;
            
            if (global.gc) global.gc();
        }
        
        this.results.hotspots.objectCreation = this.analyzeMemoryMeasurements(measurements);
        console.log(`✅ Object Creation: ${this.formatMemory(this.results.hotspots.objectCreation.avgMemoryDelta)}`);
    }

    /**
     * Analyze memory measurement results
     */
    analyzeMemoryMeasurements(measurements) {
        const memoryDeltas = measurements.map(m => m.memoryDelta);
        
        return {
            avgMemoryDelta: this.average(memoryDeltas),
            minMemoryDelta: Math.min(...memoryDeltas),
            maxMemoryDelta: Math.max(...memoryDeltas),
            stdDevMemoryDelta: this.standardDeviation(memoryDeltas),
            measurements: measurements.length,
            totalMemoryUsed: memoryDeltas.reduce((sum, delta) => sum + delta, 0)
        };
    }

    /**
     * Get current memory usage
     */
    getMemoryUsage() {
        return process.memoryUsage();
    }

    /**
     * Calculate average
     */
    average(numbers) {
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }

    /**
     * Calculate standard deviation
     */
    standardDeviation(numbers) {
        const avg = this.average(numbers);
        const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
        return Math.sqrt(this.average(squaredDiffs));
    }

    /**
     * Format memory size for display
     */
    formatMemory(bytes) {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    }

    /**
     * Generate comprehensive benchmark report
     */
    generateReport() {
        console.log('\n📊 GOMOKU MEMORY BENCHMARK RESULTS');
        console.log('=====================================');
        
        // Summary table
        console.log('\n🎯 MEMORY USAGE SUMMARY:');
        console.log('┌─────────────────────┬──────────────┬──────────────┬──────────────┐');
        console.log('│ Component           │ Avg Memory   │ Min Memory   │ Max Memory   │');
        console.log('├─────────────────────┼──────────────┼──────────────┼──────────────┤');
        
        Object.entries(this.results.hotspots).forEach(([key, data]) => {
            const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`│ ${name.padEnd(19)} │ ${this.formatMemory(data.avgMemoryDelta).padEnd(12)} │ ${this.formatMemory(data.minMemoryDelta).padEnd(12)} │ ${this.formatMemory(data.maxMemoryDelta).padEnd(12)} │`);
        });
        
        console.log('└─────────────────────┴──────────────┴──────────────┴──────────────┘');
        
        // Optimization priorities
        console.log('\n🔥 OPTIMIZATION PRIORITIES:');
        const sortedHotspots = Object.entries(this.results.hotspots)
            .sort(([,a], [,b]) => b.avgMemoryDelta - a.avgMemoryDelta);
        
        sortedHotspots.forEach(([key, data], index) => {
            const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const priority = index === 0 ? '🔴 HIGH' : index === 1 ? '🟡 MEDIUM' : '🟢 LOW';
            console.log(`${index + 1}. ${name}: ${this.formatMemory(data.avgMemoryDelta)} ${priority}`);
        });
        
        // Save detailed report
        const reportPath = join(process.cwd(), 'tests/results/gomoku-memory-benchmark.json');
        writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Implement object pooling for highest priority component');
        console.log('2. Add copy-on-write for board state management');
        console.log('3. Optimize undo/redo system with incremental updates');
        console.log('4. Monitor memory usage improvements');
    }
}

// Run benchmark if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const benchmark = new GomokuMemoryBenchmark();
    benchmark.runBenchmark().catch(console.error);
}

export default GomokuMemoryBenchmark;