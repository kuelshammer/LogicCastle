/**
 * DEPRECATED: Pure JavaScript Evaluation Logic Removed
 * 
 * This file previously contained the JavaScript implementation of Gobang position evaluation.
 * As per project requirements, ALL game logic (including position evaluation) must now be implemented in Rust/WASM.
 * 
 * The position evaluation is now exclusively available through:
 * - WASM Integration in js/wasm-integration.js
 * - Enhanced AI in js/ai-enhanced.js (WASM-powered)
 * - Rust implementation in game_engine/src/lib.rs with advanced threat analysis
 * 
 * This ensures consistent architecture where:
 * - Rust/WASM handles ALL position evaluation and strategic analysis
 * - JavaScript handles ONLY UI integration and result visualization
 */

console.warn('⚠️ DEPRECATED: evaluation.js contains legacy JavaScript evaluation logic that has been disabled');
console.warn('🦀 Use WASM-powered evaluation through WasmGobangIntegration and EnhancedGobangAI');

// Export stub to prevent errors in legacy code
class _GobangEvaluationStub {
    constructor() {
        throw new Error(
            'JavaScript evaluation logic is deprecated. Use WASM-powered evaluation through WasmGobangIntegration instead.'
        );
    }
}

if (typeof window !== 'undefined') {
    window.GobangEvaluationLegacy = _GobangEvaluationStub;
}