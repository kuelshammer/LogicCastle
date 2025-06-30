/**
 * DEPRECATED: Pure JavaScript Game Logic Removed
 * 
 * This file previously contained the JavaScript implementation of Gobang game logic.
 * As per project requirements, ALL game logic must now be implemented in Rust/WASM.
 * 
 * The game logic is now exclusively available through:
 * - Rust implementation in game_engine/src/lib.rs
 * - WASM wrapper in js/game_v2.js
 * 
 * This ensures consistent architecture where:
 * - Rust/WASM handles ALL game logic 
 * - JavaScript handles ONLY UI and WASM integration
 */

console.warn('⚠️ DEPRECATED: game.js contains legacy JavaScript game logic that has been disabled');
console.warn('🦀 Use GobangGame from game_v2.js (WASM wrapper) for all game logic operations');

// Export stub to prevent errors in legacy code
class _GobangGameStub {
    constructor() {
        throw new Error(
            'JavaScript game logic is deprecated. Use GobangGame from game_v2.js (WASM wrapper) instead.'
        );
    }
}

if (typeof window !== 'undefined') {
    window.GobangGameLegacy = _GobangGameStub;
}