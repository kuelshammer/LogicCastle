/**
 * DEPRECATED: Pure JavaScript Helpers Logic Removed
 * 
 * This file previously contained the JavaScript implementation of Gobang strategic helpers.
 * As per project requirements, ALL game logic (including strategic analysis) must now be implemented in Rust/WASM.
 * 
 * The strategic analysis is now exclusively available through:
 * - WASM Integration in js/wasm-integration.js
 * - Enhanced AI in js/ai-enhanced.js (WASM-powered)
 * - Rust implementation in game_engine/src/lib.rs
 * 
 * This ensures consistent architecture where:
 * - Rust/WASM handles ALL strategic pattern detection and threat analysis
 * - JavaScript handles ONLY UI integration and visualization
 */

console.warn('⚠️ DEPRECATED: helpers.js contains legacy JavaScript strategic logic that has been disabled');
console.warn('🦀 Use WasmGobangIntegration from wasm-integration.js for all strategic analysis');

// Export stub to prevent errors in legacy code
class _GobangHelpersStub {
    constructor() {
        throw new Error(
            'JavaScript helpers logic is deprecated. Use WasmGobangIntegration from wasm-integration.js (WASM-powered) instead.'
        );
    }
}

if (typeof window !== 'undefined') {
    window.GobangHelpersLegacy = _GobangHelpersStub;
}