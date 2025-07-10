#!/usr/bin/env node

/**
 * Quick Integration Test for Phase 2A/2B
 * 
 * Tests the critical integration points that were fixed in Phase 1
 * and validates the Modal System + New Game Button functionality.
 */

import { readFileSync, existsSync } from 'fs';

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

function testModalSystemIntegration() {
    logSection('Phase 2A: Modal System Integration Test');
    
    try {
        const uiFile = readFileSync('games/connect4/js/ui.js', 'utf8');
        
        // Test modal debugging integration
        const hasDebugModal = uiFile.includes('debugModalSystem()');
        const hasToggleModal = uiFile.includes('toggleModal(\'assistance\')');
        const hasTestModal = uiFile.includes('testModalSystem()');
        const hasGlobalTest = uiFile.includes('window.testModalSystem');
        
        if (hasDebugModal) {
            log('✅ Modal system debug integration added', 'green');
        } else {
            log('❌ Modal system debug integration missing', 'red');
        }
        
        if (hasToggleModal) {
            log('✅ toggleModal assistance integration exists', 'green');
        } else {
            log('❌ toggleModal assistance integration missing', 'red');
        }
        
        if (hasTestModal) {
            log('✅ testModalSystem method implemented', 'green');
        } else {
            log('❌ testModalSystem method missing', 'red');
        }
        
        if (hasGlobalTest) {
            log('✅ Global test access configured', 'green');
        } else {
            log('❌ Global test access missing', 'red');
        }
        
        // Test Connect4 config has modal configuration
        const configFile = readFileSync('games/connect4/js/connect4-config.js', 'utf8');
        const hasModalConfig = configFile.includes('modals:');
        const hasHelpModal = configFile.includes('help:');
        const hasAssistanceModal = configFile.includes('assistance:');
        
        if (hasModalConfig && hasHelpModal && hasAssistanceModal) {
            log('✅ Connect4 modal configuration complete', 'green');
        } else {
            log('❌ Connect4 modal configuration incomplete', 'red');
        }
        
        const modalScore = [hasDebugModal, hasToggleModal, hasTestModal, hasGlobalTest, hasModalConfig].filter(Boolean).length;
        
        if (modalScore >= 4) {
            log(`✅ Modal System Integration: ${modalScore}/5 PASSED`, 'green');
            return true;
        } else {
            log(`❌ Modal System Integration: ${modalScore}/5 FAILED`, 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Modal system integration test failed: ${error.message}`, 'red');
        return false;
    }
}

function testNewGameButtonIntegration() {
    logSection('Phase 2B: New Game Button Integration Test');
    
    try {
        const uiFile = readFileSync('games/connect4/js/ui.js', 'utf8');
        const gameFile = readFileSync('games/connect4/js/game.js', 'utf8');
        
        // Test new game method exists
        const hasNewGameMethod = uiFile.includes('newGame()');
        const hasNewGameReset = uiFile.includes('game.newGame()');
        const hasBoardClear = uiFile.includes('clearBoard()');
        
        // Test WASM integration
        const hasWASMReset = gameFile.includes('board.reset()');
        const hasMemoryCalc = gameFile.includes('naiveMemoryUsage = 84');
        
        if (hasNewGameMethod) {
            log('✅ newGame() method exists in UI', 'green');
        } else {
            log('❌ newGame() method missing in UI', 'red');
        }
        
        if (hasNewGameReset) {
            log('✅ game.newGame() call implemented', 'green');
        } else {
            log('❌ game.newGame() call missing', 'red');
        }
        
        if (hasBoardClear) {
            log('✅ Board clear functionality exists', 'green');
        } else {
            log('❌ Board clear functionality missing', 'red');
        }
        
        if (hasWASMReset) {
            log('✅ WASM board reset implemented', 'green');
        } else {
            log('❌ WASM board reset missing', 'red');
        }
        
        if (hasMemoryCalc) {
            log('✅ Memory calculation fix applied', 'green');
        } else {
            log('❌ Memory calculation fix missing', 'red');
        }
        
        const newGameScore = [hasNewGameMethod, hasNewGameReset, hasBoardClear, hasWASMReset, hasMemoryCalc].filter(Boolean).length;
        
        if (newGameScore >= 4) {
            log(`✅ New Game Button Integration: ${newGameScore}/5 PASSED`, 'green');
            return true;
        } else {
            log(`❌ New Game Button Integration: ${newGameScore}/5 FAILED`, 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ New game button integration test failed: ${error.message}`, 'red');
        return false;
    }
}

function testKeyboardSystemIntegration() {
    logSection('Phase 2C: Keyboard System Integration Test');
    
    try {
        const uiFile = readFileSync('games/connect4/js/ui.js', 'utf8');
        
        // Test keyboard actions from Phase 1
        const hasDropColumns = uiFile.includes('dropColumn1') && uiFile.includes('dropColumn7');
        const hasToggleAssistance = uiFile.includes('toggleAssistance');
        const hasAddAction = uiFile.includes('keyboardController.addAction');
        const hasActionLoop = uiFile.includes('connect4ActionMap');
        
        if (hasDropColumns) {
            log('✅ Drop column actions (1-7) defined', 'green');
        } else {
            log('❌ Drop column actions missing', 'red');
        }
        
        if (hasToggleAssistance) {
            log('✅ Toggle assistance action defined', 'green');
        } else {
            log('❌ Toggle assistance action missing', 'red');
        }
        
        if (hasAddAction) {
            log('✅ addAction registration implemented', 'green');
        } else {
            log('❌ addAction registration missing', 'red');
        }
        
        if (hasActionLoop) {
            log('✅ Action mapping loop implemented', 'green');
        } else {
            log('❌ Action mapping loop missing', 'red');
        }
        
        const keyboardScore = [hasDropColumns, hasToggleAssistance, hasAddAction, hasActionLoop].filter(Boolean).length;
        
        if (keyboardScore >= 3) {
            log(`✅ Keyboard System Integration: ${keyboardScore}/4 PASSED`, 'green');
            return true;
        } else {
            log(`❌ Keyboard System Integration: ${keyboardScore}/4 FAILED`, 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Keyboard system integration test failed: ${error.message}`, 'red');
        return false;
    }
}

function testDebugToolsIntegration() {
    logSection('Phase 2D: Debug Tools Integration Test');
    
    try {
        // Test debug tools exist
        const htmlExists = existsSync('test-modal-system.html');
        const diagnoseExists = existsSync('diagnose-new-game-button.html');
        const validateExists = existsSync('validate-fixes.html');
        
        if (htmlExists) {
            log('✅ Modal system test tool created', 'green');
        } else {
            log('❌ Modal system test tool missing', 'red');
        }
        
        if (diagnoseExists) {
            log('✅ New game button diagnosis tool created', 'green');
        } else {
            log('❌ New game button diagnosis tool missing', 'red');
        }
        
        if (validateExists) {
            log('✅ Fixes validation tool exists', 'green');
        } else {
            log('❌ Fixes validation tool missing', 'red');
        }
        
        const debugScore = [htmlExists, diagnoseExists, validateExists].filter(Boolean).length;
        
        if (debugScore >= 2) {
            log(`✅ Debug Tools Integration: ${debugScore}/3 PASSED`, 'green');
            return true;
        } else {
            log(`❌ Debug Tools Integration: ${debugScore}/3 FAILED`, 'red');
            return false;
        }
        
    } catch (error) {
        log(`❌ Debug tools integration test failed: ${error.message}`, 'red');
        return false;
    }
}

function main() {
    logHeader('Phase 2: Frontend Integration Testing');
    
    const tests = [
        testModalSystemIntegration,
        testNewGameButtonIntegration,
        testKeyboardSystemIntegration,
        testDebugToolsIntegration
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    tests.forEach(test => {
        if (test()) {
            passedTests++;
        }
    });

    logHeader('📊 Phase 2 Integration Summary');
    
    if (passedTests === totalTests) {
        log(`✅ All Phase 2 integration tests passed! (${passedTests}/${totalTests})`, 'green');
        log('🎉 Phase 2: Frontend Integration successfully completed', 'green');
        log('', 'green');
        log('Next steps:', 'bright');
        log('1. Test modal system in browser: http://localhost:8080/test-modal-system.html', 'cyan');
        log('2. Test new game button: http://localhost:8080/diagnose-new-game-button.html', 'cyan');
        log('3. Run comprehensive validation: http://localhost:8080/validate-fixes.html', 'cyan');
        log('4. Test live integration on production site', 'cyan');
    } else {
        log(`❌ Some Phase 2 integration tests failed (${passedTests}/${totalTests})`, 'red');
        log('⚠️ Phase 2 implementation needs attention', 'yellow');
        
        if (passedTests > totalTests / 2) {
            log('✨ Good progress made, minor fixes needed', 'cyan');
        }
    }
}

// Run integration tests
main();