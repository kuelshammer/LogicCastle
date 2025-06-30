/**
 * DEPRECATED: Pure JavaScript AI Logic Removed
 * 
 * This file previously contained the JavaScript implementation of Gobang AI.
 * As per project requirements, ALL game logic (including AI) must now be implemented in Rust/WASM.
 * 
 * The AI logic is now exclusively available through:
 * - Enhanced AI in js/ai-enhanced.js (WASM-powered)
 * - Rust implementation in game_engine/src/lib.rs
 * 
 * This ensures consistent architecture where:
 * - Rust/WASM handles ALL strategic analysis and move generation
 * - JavaScript handles ONLY UI integration and AI coordination
 */

console.warn('⚠️ DEPRECATED: ai.js contains legacy JavaScript AI logic that has been disabled');
console.warn('🦀 Use EnhancedGobangAI from ai-enhanced.js (WASM-powered) for all AI operations');

// Export stub to prevent errors in legacy code
class _GobangAIStub {
    constructor() {
        throw new Error(
            'JavaScript AI logic is deprecated. Use EnhancedGobangAI from ai-enhanced.js (WASM-powered) instead.'
        );
    }
}

if (typeof window !== 'undefined') {
    window.GobangAILegacy = _GobangAIStub;
}