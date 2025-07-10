/**
 * 🧠 MEMORY-OPTIMIZED GOMOKU VALIDATION
 * 
 * Phase 2: Integration Testing for Memory Optimization
 * Tests the memory-optimized classes against baseline measurements
 */

import { performance } from 'perf_hooks';
import { MemoryOptimizedGomokuGame, MoveObjectPool, CowBoardState, GameStateDelta } from '../../games/gomoku/js/memory-optimized-game.js';
import GomokuMemoryBenchmark from './gomoku-memory-benchmark.js';

class MemoryOptimizedValidation {
    constructor() {
        this.baseline = null;
        this.optimized = null;
        this.validationResults = {
            timestamp: new Date().toISOString(),
            baseline: {},
            optimized: {},
            improvements: {},
            validationStatus: 'PENDING'
        };
    }

    /**
     * Run complete validation suite
     */
    async runValidation() {
        console.log('🧪 MEMORY-OPTIMIZED GOMOKU VALIDATION');
        console.log('====================================');
        
        // 1. Run baseline benchmark
        await this.runBaselineBenchmark();
        
        // 2. Run optimized benchmark
        await this.runOptimizedBenchmark();
        
        // 3. Compare results
        this.compareResults();
        
        // 4. Validate functionality
        await this.validateFunctionality();
        
        // 5. Generate validation report
        this.generateValidationReport();
    }

    /**
     * Run baseline benchmark for comparison
     */
    async runBaselineBenchmark() {
        console.log('\n📊 Running baseline benchmark...');
        
        const benchmark = new GomokuMemoryBenchmark();
        benchmark.testIterations = 50; // Reduce for faster validation
        
        await benchmark.runBenchmark();
        this.baseline = benchmark.results;
        
        console.log('✅ Baseline benchmark completed');
    }

    /**
     * Run optimized memory benchmark
     */
    async runOptimizedBenchmark() {
        console.log('\n🚀 Running optimized memory benchmark...');
        
        const measurements = {
            gameCreation: [],
            moveExecution: [],
            undoOperations: [],
            memoryUsage: [],
            poolEfficiency: []
        };
        
        const testIterations = 50;
        
        for (let i = 0; i < testIterations; i++) {
            const startMemory = this.getMemoryUsage();
            
            // Create optimized game instance
            const game = new MemoryOptimizedGomokuGame();
            const creationMemory = this.getMemoryUsage();
            
            // Execute moves
            const moveCount = 30;
            for (let move = 0; move < moveCount; move++) {
                const row = Math.floor(Math.random() * 19);
                const col = Math.floor(Math.random() * 19);
                
                const moveStart = this.getMemoryUsage();
                game.makeMove(row, col);
                const moveEnd = this.getMemoryUsage();
                
                measurements.moveExecution.push({
                    moveNumber: move,
                    memoryDelta: moveEnd.heapUsed - moveStart.heapUsed
                });
            }
            
            // Test undo operations
            const undoCount = Math.min(10, moveCount);
            for (let undo = 0; undo < undoCount; undo++) {
                const undoStart = this.getMemoryUsage();
                game.undoMove();
                const undoEnd = this.getMemoryUsage();
                
                measurements.undoOperations.push({
                    undoNumber: undo,
                    memoryDelta: undoEnd.heapUsed - undoStart.heapUsed
                });
            }
            
            // Collect memory stats
            const memoryStats = game.getMemoryStats();
            measurements.memoryUsage.push(memoryStats);
            
            // Cleanup
            game.cleanup();
            const endMemory = this.getMemoryUsage();
            
            measurements.gameCreation.push({
                iteration: i,
                creationMemory: creationMemory.heapUsed - startMemory.heapUsed,
                totalMemory: endMemory.heapUsed - startMemory.heapUsed
            });
            
            if (global.gc) global.gc();
        }
        
        this.optimized = this.analyzeOptimizedMeasurements(measurements);
        console.log('✅ Optimized benchmark completed');
    }

    /**
     * Analyze optimized measurements
     */
    analyzeOptimizedMeasurements(measurements) {
        return {
            gameCreation: {
                avgMemoryDelta: this.average(measurements.gameCreation.map(m => m.creationMemory)),
                totalMemoryDelta: this.average(measurements.gameCreation.map(m => m.totalMemory))
            },
            moveExecution: {
                avgMemoryDelta: this.average(measurements.moveExecution.map(m => m.memoryDelta)),
                totalMoves: measurements.moveExecution.length
            },
            undoOperations: {
                avgMemoryDelta: this.average(measurements.undoOperations.map(m => m.memoryDelta)),
                totalUndos: measurements.undoOperations.length
            },
            memoryStats: measurements.memoryUsage[measurements.memoryUsage.length - 1] || {},
            poolEfficiency: this.calculatePoolEfficiency(measurements.memoryUsage)
        };
    }

    /**
     * Calculate object pool efficiency
     */
    calculatePoolEfficiency(memoryUsage) {
        const lastStats = memoryUsage[memoryUsage.length - 1];
        if (!lastStats || !lastStats.movePool) {
            return { hitRate: 0, efficiency: 'N/A' };
        }
        
        const { hits, misses, hitRate } = lastStats.movePool;
        return {
            hits,
            misses,
            hitRate,
            efficiency: hitRate > 0.8 ? 'EXCELLENT' : hitRate > 0.6 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
        };
    }

    /**
     * Compare baseline vs optimized results
     */
    compareResults() {
        console.log('\n📈 Comparing results...');
        
        const baselineAI = this.baseline.hotspots.aiAnalysis.avgMemoryDelta;
        const baselineObjects = this.baseline.hotspots.objectCreation.avgMemoryDelta;
        const baselineUndo = this.baseline.hotspots.undoRedo.avgMemoryDelta;
        
        const optimizedMove = this.optimized.moveExecution.avgMemoryDelta;
        const optimizedUndo = this.optimized.undoOperations.avgMemoryDelta;
        
        this.validationResults.baseline = {
            aiAnalysis: baselineAI,
            objectCreation: baselineObjects,
            undoRedo: baselineUndo,
            total: baselineAI + baselineObjects + baselineUndo
        };
        
        this.validationResults.optimized = {
            moveExecution: optimizedMove,
            undoOperations: optimizedUndo,
            total: optimizedMove + optimizedUndo
        };
        
        // Calculate improvements
        const moveImprovement = ((baselineAI - optimizedMove) / baselineAI) * 100;
        const undoImprovement = ((baselineUndo - optimizedUndo) / baselineUndo) * 100;
        const totalImprovement = ((this.validationResults.baseline.total - this.validationResults.optimized.total) / this.validationResults.baseline.total) * 100;
        
        this.validationResults.improvements = {
            moveExecution: moveImprovement,
            undoOperations: undoImprovement,
            total: totalImprovement,
            targetAchieved: totalImprovement >= 50 // 50% reduction target
        };
        
        console.log('✅ Results comparison completed');
    }

    /**
     * Validate functionality integrity
     */
    async validateFunctionality() {
        console.log('\n🔍 Validating functionality integrity...');
        
        const game = new MemoryOptimizedGomokuGame();
        const functionalityTests = {
            gameCreation: false,
            moveExecution: false,
            undoOperations: false,
            memoryStats: false,
            cleanup: false
        };
        
        try {
            // Test game creation
            functionalityTests.gameCreation = game instanceof MemoryOptimizedGomokuGame;
            
            // Test move execution
            const moveResult = game.makeMove(9, 9);
            functionalityTests.moveExecution = moveResult === true;
            
            // Test undo operations
            const undoResult = game.undoMove();
            functionalityTests.undoOperations = undoResult === true;
            
            // Test memory stats
            const memoryStats = game.getMemoryStats();
            functionalityTests.memoryStats = memoryStats && typeof memoryStats === 'object';
            
            // Test cleanup
            game.cleanup();
            functionalityTests.cleanup = true;
            
        } catch (error) {
            console.error('❌ Functionality validation failed:', error);
        }
        
        this.validationResults.functionalityTests = functionalityTests;
        const allPassed = Object.values(functionalityTests).every(test => test === true);
        
        if (allPassed) {
            console.log('✅ Functionality validation passed');
        } else {
            console.log('❌ Functionality validation failed');
        }
    }

    /**
     * Generate comprehensive validation report
     */
    generateValidationReport() {
        console.log('\n📊 MEMORY OPTIMIZATION VALIDATION REPORT');
        console.log('========================================');
        
        // Summary
        console.log('\n🎯 OPTIMIZATION SUMMARY:');
        console.log(`Memory Reduction: ${this.validationResults.improvements.total.toFixed(2)}%`);
        console.log(`Target Achievement: ${this.validationResults.improvements.targetAchieved ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        // Detailed improvements
        console.log('\n📈 DETAILED IMPROVEMENTS:');
        console.log(`Move Execution: ${this.validationResults.improvements.moveExecution.toFixed(2)}% reduction`);
        console.log(`Undo Operations: ${this.validationResults.improvements.undoOperations.toFixed(2)}% reduction`);
        
        // Pool efficiency
        if (this.optimized.poolEfficiency) {
            console.log('\n🏊 OBJECT POOL EFFICIENCY:');
            console.log(`Hit Rate: ${(this.optimized.poolEfficiency.hitRate * 100).toFixed(2)}%`);
            console.log(`Efficiency: ${this.optimized.poolEfficiency.efficiency}`);
        }
        
        // Functionality tests
        console.log('\n🔍 FUNCTIONALITY TESTS:');
        Object.entries(this.validationResults.functionalityTests).forEach(([test, passed]) => {
            console.log(`${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        });
        
        // Final validation status
        const memoryTargetMet = this.validationResults.improvements.targetAchieved;
        const functionalityPassed = Object.values(this.validationResults.functionalityTests).every(test => test === true);
        
        this.validationResults.validationStatus = (memoryTargetMet && functionalityPassed) ? 'SUCCESS' : 'FAILED';
        
        console.log('\n🏆 VALIDATION STATUS:');
        console.log(`Overall: ${this.validationResults.validationStatus}`);
        
        if (this.validationResults.validationStatus === 'SUCCESS') {
            console.log('✅ Memory optimization implementation is ready for integration');
        } else {
            console.log('❌ Memory optimization needs further work before integration');
        }
    }

    /**
     * Utility methods
     */
    getMemoryUsage() {
        return process.memoryUsage();
    }

    average(numbers) {
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validation = new MemoryOptimizedValidation();
    validation.runValidation().catch(console.error);
}

export default MemoryOptimizedValidation;