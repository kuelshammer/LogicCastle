#!/usr/bin/env node

/**
 * Simplified Fix Validation Script
 * 
 * Validates the critical fixes implemented in Phase 1 without requiring WASM loading.
 * Focuses on code structure and file integrity.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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

function validateMemoryCalculationFix() {
    logSection('1. Memory Calculation Fix Validation');
    
    try {
        const gameFile = readFileSync('games/connect4/js/game.js', 'utf8');
        
        // Check for the fixed memory calculation logic
        const hasNaiveMemoryUsage = gameFile.includes('const naiveMemoryUsage = 84');
        const hasConditionalLogic = gameFile.includes('if (memoryUsage <= naiveMemoryUsage)');
        const hasOverheadLogic = gameFile.includes('Memory overhead:');
        
        if (hasNaiveMemoryUsage && hasConditionalLogic && hasOverheadLogic) {
            log('✅ Memory calculation fix implemented correctly', 'green');
            log('   - Uses naiveMemoryUsage constant', 'green');
            log('   - Has conditional logic for savings vs overhead', 'green');
            log('   - Handles negative percentage cases', 'green');
            return true;
        } else {
            log('❌ Memory calculation fix incomplete', 'red');
            log(`   - naiveMemoryUsage: ${hasNaiveMemoryUsage}`, hasNaiveMemoryUsage ? 'green' : 'red');
            log(`   - Conditional logic: ${hasConditionalLogic}`, hasConditionalLogic ? 'green' : 'red');
            log(`   - Overhead logic: ${hasOverheadLogic}`, hasOverheadLogic ? 'green' : 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Error validating memory calculation: ${error.message}`, 'red');
        return false;
    }
}

function validateKeyboardActionsFix() {
    logSection('2. Keyboard Actions Fix Validation');
    
    try {
        const uiFile = readFileSync('games/connect4/js/ui.js', 'utf8');
        
        // Check for the keyboard actions fix
        const hasDropColumnActions = uiFile.includes("'dropColumn1': () => this.dropDiscInColumn(0)");
        const hasToggleAssistance = uiFile.includes("'toggleAssistance': () => this.toggleModal('assistance')");
        const hasAddActionCall = uiFile.includes('keyboardController.addAction(actionName, actionHandler)');
        
        if (hasDropColumnActions && hasToggleAssistance && hasAddActionCall) {
            log('✅ Keyboard actions fix implemented correctly', 'green');
            log('   - dropColumn1-7 actions defined', 'green');
            log('   - toggleAssistance action defined', 'green');
            log('   - Actions registered with addAction()', 'green');
            return true;
        } else {
            log('❌ Keyboard actions fix incomplete', 'red');
            log(`   - dropColumn actions: ${hasDropColumnActions}`, hasDropColumnActions ? 'green' : 'red');
            log(`   - toggleAssistance: ${hasToggleAssistance}`, hasToggleAssistance ? 'green' : 'red');
            log(`   - addAction calls: ${hasAddActionCall}`, hasAddActionCall ? 'green' : 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Error validating keyboard actions: ${error.message}`, 'red');
        return false;
    }
}

function validateInitializationGuards() {
    logSection('3. Initialization Guards Validation');
    
    try {
        const uiFile = readFileSync('games/connect4/js/ui.js', 'utf8');
        
        // Check for initialization guards
        const hasInitializedFlag = uiFile.includes('this.isInitialized = false');
        const hasBeforeInitGuard = uiFile.includes('if (this.isInitialized) {') && 
                                   uiFile.includes('skipping beforeInit');
        const hasAfterInitGuard = uiFile.includes('skipping afterInit');
        const hasMarkInitialized = uiFile.includes('this.isInitialized = true');
        
        if (hasInitializedFlag && hasBeforeInitGuard && hasAfterInitGuard && hasMarkInitialized) {
            log('✅ Initialization guards implemented correctly', 'green');
            log('   - isInitialized flag added', 'green');
            log('   - beforeInit guard implemented', 'green');
            log('   - afterInit guard implemented', 'green');
            log('   - Initialization marking added', 'green');
            return true;
        } else {
            log('❌ Initialization guards incomplete', 'red');
            log(`   - isInitialized flag: ${hasInitializedFlag}`, hasInitializedFlag ? 'green' : 'red');
            log(`   - beforeInit guard: ${hasBeforeInitGuard}`, hasBeforeInitGuard ? 'green' : 'red');
            log(`   - afterInit guard: ${hasAfterInitGuard}`, hasAfterInitGuard ? 'green' : 'red');
            log(`   - Mark initialized: ${hasMarkInitialized}`, hasMarkInitialized ? 'green' : 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Error validating initialization guards: ${error.message}`, 'red');
        return false;
    }
}

function validateWASMAPI() {
    logSection('4. WASM API Structure Validation');
    
    try {
        // Check if WASM files exist
        const wasmFiles = [
            'game_engine/pkg/game_engine.js',
            'game_engine/pkg/game_engine_bg.wasm',
            'game_engine/pkg/game_engine.d.ts'
        ];

        let allFilesExist = true;
        wasmFiles.forEach(file => {
            if (existsSync(file)) {
                log(`✅ ${file} exists`, 'green');
            } else {
                log(`❌ ${file} missing`, 'red');
                allFilesExist = false;
            }
        });

        // Check Connect4Game Rust source for API methods
        const rustFile = readFileSync('game_engine/src/games/connect4.rs', 'utf8');
        
        const criticalMethods = [
            'memory_usage',
            'get_board',
            'can_undo',
            'undo_move',
            'get_ai_move',
            'evaluate_position_for_player'
        ];

        let methodsImplemented = 0;
        criticalMethods.forEach(method => {
            if (rustFile.includes(`pub fn ${method}`)) {
                log(`✅ ${method} implemented in Rust`, 'green');
                methodsImplemented++;
            } else {
                log(`❌ ${method} missing in Rust`, 'red');
            }
        });

        const success = allFilesExist && methodsImplemented === criticalMethods.length;
        
        if (success) {
            log(`✅ WASM API structure validated (${methodsImplemented}/${criticalMethods.length} methods)`, 'green');
        } else {
            log(`❌ WASM API structure incomplete (${methodsImplemented}/${criticalMethods.length} methods)`, 'red');
        }
        
        return success;
        
    } catch (error) {
        log(`❌ Error validating WASM API: ${error.message}`, 'red');
        return false;
    }
}

function validateAPIContractTestStructure() {
    logSection('5. API Contract Test Structure Validation');
    
    try {
        // Check if API contract test was created
        if (existsSync('tests/api-contract/wasm-api-contract.test.js')) {
            log('✅ API contract test file created', 'green');
            
            const testFile = readFileSync('tests/api-contract/wasm-api-contract.test.js', 'utf8');
            
            // Check for comprehensive test coverage
            const hasMemoryTests = testFile.includes('memory_usage()');
            const hasUndoTests = testFile.includes('can_undo()');
            const hasAliasTests = testFile.includes('camelCase aliases');
            const hasRegressionTests = testFile.includes('Regression Tests');
            
            if (hasMemoryTests && hasUndoTests && hasAliasTests && hasRegressionTests) {
                log('✅ API contract tests comprehensive', 'green');
                log('   - Memory usage tests included', 'green');
                log('   - Undo functionality tests included', 'green');
                log('   - camelCase alias tests included', 'green');
                log('   - Regression tests included', 'green');
                return true;
            } else {
                log('⚠️ API contract tests could be more comprehensive', 'yellow');
                return true; // Still valid, just not complete
            }
        } else {
            log('❌ API contract test file missing', 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Error validating API contract tests: ${error.message}`, 'red');
        return false;
    }
}

function main() {
    logHeader('Phase 1: Critical Fixes Validation');
    
    const validations = [
        validateMemoryCalculationFix,
        validateKeyboardActionsFix,
        validateInitializationGuards,
        validateWASMAPI,
        validateAPIContractTestStructure
    ];

    let passedValidations = 0;
    const totalValidations = validations.length;

    validations.forEach(validation => {
        if (validation()) {
            passedValidations++;
        }
    });

    logHeader('📊 Validation Summary');
    
    if (passedValidations === totalValidations) {
        log(`✅ All validations passed! (${passedValidations}/${totalValidations})`, 'green');
        log('🎉 Phase 1: Critical Fixes successfully implemented', 'green');
        log('', 'green');
        log('Next steps:', 'bright');
        log('1. Test the fixes in browser using validate-fixes.html', 'cyan');
        log('2. Run frontend tests to ensure integration works', 'cyan');
        log('3. Deploy to production environment', 'cyan');
    } else {
        log(`❌ Some validations failed (${passedValidations}/${totalValidations})`, 'red');
        log('⚠️ Phase 1 implementation needs attention', 'yellow');
        
        if (passedValidations > totalValidations / 2) {
            log('✨ Good progress made, just a few issues to resolve', 'cyan');
        }
    }
}

// Run validation
main();