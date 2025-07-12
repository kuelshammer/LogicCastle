# Project Websites

- **Webseite:** https://www.github.com/kuelshammer/LogicCastle/

# GOMOKU BITPACKED 3-LAYER FIX PLAN

## Problem: Gomoku folgt nicht Connect4's 3-Schichten-BitPacked-Standard

### Connect4's Working 3-Layer Architecture:
```
LAYER 3 (UI/Frontend) ──→ Connect4UI uses Connect4GameBitPacked
LAYER 2 (Game Logic)  ──→ Connect4GameBitPacked wraps Connect4Game  
LAYER 1 (WASM/Rust)   ──→ Connect4Game (BitPackedBoard)
```

### Critical Import Errors in Gomoku:
1. **Layer 2**: `import { GomokuBoard }` ← **doesn't exist!**
2. **Layer 2**: `this.board = new GomokuBoard()` ← **wrong class!**
3. **Layer 3**: Imports from `game_v2.js` instead of `game-bitpacked.js`
4. **API Inconsistency**: `current_player()` vs `get_current_player()`

### Fix Plan:
- **STEP 1**: WASM-Layer check - verify GomokuGame export and API alignment
- **STEP 2**: Game Logic Layer repair - fix game-bitpacked.js import errors
- **STEP 3**: UI Layer adaptation - fix index-goldstandard.html BitPacked integration
- **STEP 4**: Component Integration - adapt UI-Components to BitPacked wrapper
- **STEP 5**: Testing & Verification - test 15x15 board and performance