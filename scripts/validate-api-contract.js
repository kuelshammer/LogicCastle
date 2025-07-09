#!/usr/bin/env node

/**
 * API Contract Validation Script
 * 
 * This script validates the WASM API contract and generates a report
 * of any discrepancies between frontend expectations and backend implementation.
 * 
 * Usage:
 *   node scripts/validate-api-contract.js
 *   npm run validate-api
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`${message}`, 'cyan');
    log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
    log(`\n${'-'.repeat(40)}`, 'blue');
    log(`${message}`, 'blue');
    log(`${'-'.repeat(40)}`, 'blue');
}

async function runTests() {
    return new Promise((resolve, reject) => {
        logSection('Running API Contract Tests');
        
        const testProcess = spawn('npx', ['vitest', 'run', 'tests/api-contract/wasm-api-contract.test.js'], {
            stdio: 'inherit',
            shell: true
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                log('\n✅ All API contract tests passed!', 'green');
                resolve(true);
            } else {
                log('\n❌ Some API contract tests failed!', 'red');
                resolve(false);
            }
        });

        testProcess.on('error', (error) => {
            log(`\n❌ Error running tests: ${error.message}`, 'red');
            reject(error);
        });
    });
}

async function validateWasmBuild() {
    logSection('Validating WASM Build');
    
    const wasmFiles = [
        'game_engine/pkg/game_engine.js',
        'game_engine/pkg/game_engine_bg.wasm',
        'game_engine/pkg/game_engine.d.ts'
    ];

    let allFilesExist = true;
    
    for (const file of wasmFiles) {
        if (existsSync(file)) {
            log(`✅ ${file} exists`, 'green');
        } else {
            log(`❌ ${file} missing`, 'red');
            allFilesExist = false;
        }
    }

    if (!allFilesExist) {
        log('\n⚠️  WASM build incomplete. Run: cd game_engine && wasm-pack build', 'yellow');
        return false;
    }

    return true;
}

async function generateApiReport() {
    logSection('Generating API Contract Report');
    
    try {
        // Import the game to validate API
        const { Connect4GameBitPacked } = await import('../games/connect4/js/game.js');
        
        log('📋 API Contract Validation Report', 'bright');
        log('Generated at: ' + new Date().toISOString(), 'bright');
        
        const game = new Connect4GameBitPacked();
        await game.init();
        const wasmBoard = game.board;
        
        // Check critical methods
        const criticalMethods = [
            'memory_usage',
            'get_board', 
            'can_undo',
            'undo_move',
            'get_ai_move',
            'evaluate_position_for_player'
        ];

        log('\n🔍 Critical API Methods:', 'bright');
        criticalMethods.forEach(method => {
            if (wasmBoard[method]) {
                log(`  ✅ ${method}`, 'green');
            } else {
                log(`  ❌ ${method}`, 'red');
            }
        });

        // Check camelCase aliases
        const aliasTests = [
            ['get_current_player', 'getCurrentPlayer'],
            ['get_move_count', 'getMoveCount'], 
            ['is_game_over', 'isGameOver'],
            ['get_winner', 'getWinner'],
            ['is_valid_move', 'isValidMove']
        ];

        log('\n🔄 camelCase Aliases:', 'bright');
        aliasTests.forEach(([snakeCase, camelCase]) => {
            if (wasmBoard[snakeCase] && wasmBoard[camelCase]) {
                log(`  ✅ ${snakeCase} → ${camelCase}`, 'green');
            } else {
                log(`  ❌ ${snakeCase} → ${camelCase}`, 'red');
            }
        });

        // Memory usage validation
        log('\n💾 Memory Usage:', 'bright');
        const memoryUsage = wasmBoard.memory_usage();
        log(`  Current usage: ${memoryUsage} bytes`, 'cyan');
        
        if (memoryUsage > 0 && memoryUsage < 10000) {
            log(`  ✅ Memory usage is reasonable`, 'green');
        } else {
            log(`  ⚠️  Memory usage seems unusual`, 'yellow');
        }

        return true;
        
    } catch (error) {
        log(`❌ Error generating report: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    logHeader('API Contract Validation');
    
    try {
        // Step 1: Validate WASM build
        const wasmValid = await validateWasmBuild();
        if (!wasmValid) {
            process.exit(1);
        }

        // Step 2: Generate API report
        const reportValid = await generateApiReport();
        if (!reportValid) {
            process.exit(1);
        }

        // Step 3: Run contract tests
        const testsValid = await runTests();
        if (!testsValid) {
            process.exit(1);
        }

        logHeader('✅ API Contract Validation Complete');
        log('All API contract validations passed!', 'green');
        log('Frontend-Backend API integration is stable.', 'green');
        
    } catch (error) {
        log(`❌ Validation failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Run the validation
main().catch(error => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
});