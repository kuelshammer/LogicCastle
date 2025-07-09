# 🎯 LogicCastle Naming & Architecture Standards

## Strategic Vision
Establish clean, consistent naming conventions across all games in LogicCastle to eliminate confusion and improve maintainability.

## Core Principles

### 1. File Naming Convention
**Current Version = Base Name** | **Legacy Version = -legacy suffix**

✅ **GOOD:**
- `ui.js` (current UI implementation)
- `ai.js` (current AI implementation)  
- `game.js` (current game logic)
- `ui-legacy.js` (old version kept for reference)
- `game-legacy.js` (old version kept for reference)

❌ **AVOID:**
- `ui-new.js`, `ui_v2.js`, `ui-production.js`
- `ai_v2.js`, `ai-enhanced.js`, `ai-optimized.js`
- `game_refactored.js`, `game-bitpacked.js`

### 2. Test Directory Structure
**Game-Specific Directories** | **Component-Based Organization**

✅ **GOOD:**
```
tests/
├── connect4/
│   ├── components/
│   │   ├── BoardRenderer.test.js
│   │   ├── InteractionHandler.test.js
│   │   └── AssistanceManager.test.js
│   ├── integration/
│   │   └── ComponentIntegration.test.js
│   ├── ui.test.js
│   └── ai.test.js
├── gomoku/
│   ├── components/
│   └── ui.test.js
└── hex/
    ├── components/
    └── ui.test.js
```

❌ **AVOID:**
```
tests/
├── ultrathink/
├── modern/connect4/
├── unit/games/Connect4UINew.test.js
└── integration/modern/
```

### 3. Class Naming Convention
**Simple, Clear Names** | **No Version Suffixes**

✅ **GOOD:**
- `Connect4UI` (not `Connect4UINew`)
- `Connect4AI` (not `Connect4AI_v2`)
- `HexUI` (not `HexUIModern`)

### 4. Component Architecture
**Focused Components** | **Clear Responsibilities**

✅ **GOOD:**
```
components/
├── BoardRenderer.js      // Board creation & visual updates
├── InteractionHandler.js // User interactions & events  
├── AssistanceManager.js  // Player assistance & hints
├── MemoryManager.js      // Resource cleanup & optimization
└── OptimizedElementBinder.js // DOM element binding
```

## Implementation Checklist

### For Each Game Refactoring:

#### Phase 1: File Renaming
- [ ] `ui-new.js` → `ui.js`
- [ ] `ai_v2.js` → `ai.js`  
- [ ] `game_v2.js` → `game.js`
- [ ] `ui_v2.js` → `ui-legacy.js`
- [ ] Delete redundant files (`ui-debug.js`, `ui-production.js`, etc.)

#### Phase 2: Test Restructuring  
- [ ] Create `tests/{game}/` directory
- [ ] Create `tests/{game}/components/` subdirectory
- [ ] Create `tests/{game}/integration/` subdirectory
- [ ] Move component tests to `tests/{game}/components/`
- [ ] Move main tests to `tests/{game}/`
- [ ] Remove confusing path names (`ultrathink/`, `modern/`)

#### Phase 3: Import Updates
- [ ] Update all import paths in JS files
- [ ] Update all import paths in test files
- [ ] Update HTML file imports
- [ ] Update class name references

#### Phase 4: Documentation
- [ ] Update comments to remove temporary terminology
- [ ] Update class and file descriptions
- [ ] Document component architecture

#### Phase 5: Validation
- [ ] Run tests to verify functionality
- [ ] Test HTML pages load correctly
- [ ] Verify all imports resolve

## Benefits

### Maintainability
- **Clear naming:** Instantly understand which is current vs legacy
- **Organized tests:** Find tests by game, then by component
- **No confusion:** No more guessing which `ui_v2.js` is newer

### Scalability  
- **Transferable:** Same pattern works for all games
- **Consistent:** New developers understand structure immediately
- **Future-proof:** Easy to add new games following same pattern

### Development Experience
- **Fast navigation:** `tests/connect4/components/BoardRenderer.test.js`
- **Logical imports:** `import { Connect4UI } from './ui.js'`
- **Clean IDE:** No clutter from versioned file names

## Applied Examples

### Connect4 (Completed ✅)
```
games/connect4/js/
├── ui.js              (was ui-new.js)
├── ai.js              (was ai_v2.js)  
├── game.js            (was Connect4GameBitPacked.js)
├── ui-legacy.js       (was ui_v2.js)
└── components/        (unchanged - already clean)

tests/connect4/        (was tests/ultrathink/)
├── components/        (was tests/ultrathink/components/)
├── integration/       (was tests/ultrathink/integration/)
├── ui.test.js         (was tests/unit/games/Connect4UINew.test.js)
└── ai.test.js         (was tests/unit/ai/ai_v2.test.js)
```

### Next: Gomoku, Hex, L-Game
Apply the same pattern to establish consistency across all games.

---

**Result:** Clean, maintainable codebase with consistent naming that eliminates confusion and scales to all LogicCastle games.