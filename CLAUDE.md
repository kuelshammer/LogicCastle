# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LogicCastle is a collection of mathematical strategy games implemented in vanilla JavaScript. The project features three games: Connect 4 (4 Gewinnt), Gobang (5 Gewinnt), and Trio, each with sophisticated AI opponents and rich user interfaces.

## Development Commands

### Testing
- **Run all tests**: Open `tests/test-runner.html` in a browser
- **Run specific game tests**: Open individual test files (e.g., `tests/connect4-tests.js`) through the test runner
- **Test framework**: Custom framework in `tests/test-framework.js` with comprehensive assertion methods

### Local Development
- **Serve locally**: Use any HTTP server (e.g., `python -m http.server` or Live Server extension)
- **Main entry point**: Open `index.html` in browser
- **Individual games**: Navigate to `games/{game-name}/index.html`

## Architecture Overview

### Game Engine Pattern
Each game follows a consistent three-layer architecture:
- **Game Logic Layer** (`js/game.js`): Core game state, move validation, win detection
- **AI Layer** (`js/ai.js`): Minimax algorithms with alpha-beta pruning, difficulty levels
- **UI Layer** (`js/ui.js`): DOM manipulation, event handling, animations

### Event-Driven System
All games use a custom event system for decoupled communication:
```javascript
game.on('moveMade', (move) => ui.onMoveMade(move));
game.emit('gameWon', { winner, winningCells });
```

### AI Architecture
- **Difficulty Scaling**: Easy (random), Medium (rule-based), Hard/Expert (minimax with increasing depth)
- **Evaluation Functions**: Position scoring, threat detection, win/block priorities
- **Move Ordering**: Center-out ordering for optimal alpha-beta pruning

### Hints System (Connect 4)
The `Connect4Helpers` class provides strategic analysis:
- **Threat Detection**: Identifies immediate winning/losing positions
- **Setup Moves**: Detects "Zwickmühle" (fork) opportunities
- **Strategic Advice**: Context-aware suggestions based on game phase

## Key Implementation Details

### Game State Management
Each game maintains immutable state through:
- Deep copying for simulation (`getBoard()`, `simulateMove()`)
- Move history for undo functionality
- Event emission for UI synchronization

### Connect 4 Specifics
- **Two-click interaction**: First click selects column, second click drops piece
- **Column highlighting**: Visual feedback with perfect alignment
- **Minimax depth**: Easy(1), Medium(3), Hard(5), Expert(7)

### Testing Strategy
- **Custom test framework**: Simple but comprehensive assertion library
- **Game logic focus**: Extensive coverage of win conditions, move validation
- **AI testing**: Move generation and difficulty validation
- **Mock helpers**: `createMockGameState()` and `createEmptyBoard()` utilities

## File Organization Patterns

### Game Structure
```
games/{game-name}/
├── index.html          # Game interface with help modal
├── js/
│   ├── game.js        # Core game logic and state
│   ├── ai.js          # AI opponents
│   ├── helpers.js     # Strategic analysis (Connect 4 only)
│   └── ui.js          # User interface controller
└── css/
    ├── game.css       # Game board styling
    └── ui.css         # Interface elements
```

### Constants and Configuration
- Game dimensions defined as class constants (e.g., `ROWS = 6`, `COLS = 7`)
- Player constants for type safety (`PLAYER1 = 1`, `PLAYER2 = 2`)
- Win conditions vary by game (Connect 4: 4-in-a-row, Gobang: 5-in-a-row, Trio: 3-in-a-row)

## Development Considerations

### Adding New Games
1. Follow the three-layer architecture pattern
2. Implement the standard event system (`on`, `emit`, `off`)
3. Create corresponding test suite
4. Add game card to main `index.html` with preview

### AI Development
- Inherit difficulty progression: random → rule-based → minimax → monte carlo
- Implement position evaluation functions specific to game mechanics
- Use move ordering for performance optimization
- Test across all difficulty levels

#### Monte Carlo AI Enhancement (Connect 4)
- **Universal 4-Stage Framework**: All bots follow Win > Block > Avoid Traps > Stage 4 Strategy
- **Monte Carlo Stage 4**: Replaces pattern evaluation with simulation-based analysis
- **Simulation Strategy**: Uses defensive vs defensive AI for neutral game evaluation
- **Performance**: ~50-100 simulations per safe column within 1 second time limit
- **Integration**: Preserves existing bot behavior while adding sophisticated analysis

### UI Consistency
- Maintain two-click interaction pattern where applicable
- Implement keyboard shortcuts (number keys for quick access)
- Follow responsive design principles established in main stylesheet
- Include comprehensive help modals with keyboard shortcuts documentation

## Recent Updates

### Connect4 Bot System Overhaul (2025-06-23) ✅
**Real Bot Testing & UI Mapping Update:**
- **Problem Identified**: Mock tests showed artificial 50:50 bot equality, masking real strategic differences
- **Solution Implemented**: Created real implementation testing framework with 25,000 game matrix
- **Dramatic Results**: Bots range from 32% to 60% winrate - huge performance differences confirmed!

**Updated UI Bot Mapping (based on real test results):**
- **Einfach**: smart-random (32% winrate) - Perfect for beginners with helpers + randomness
- **Mittel**: defensiv-gemischt (45% winrate) - Solid mid-tier with 2x defensive weighting  
- **Stark**: defensive (60% winrate) - The strongest bot with pure pattern disruption
- **Alternative**: enhanced-smart (59% winrate) - Available as fallback, advanced analysis but slightly weaker

**Real Bot Rankings from 25k games:**
1. 🥇 Defensive (60%) - Pure pattern disruption
2. 🥈 Enhanced Smart (59%) - Advanced strategic analysis  
3. 🥉 Offensiv-Gemischt (48%) - 2x offensive weighting
4. Defensiv-Gemischt (45%) - 2x defensive weighting
5. Smart Random (32%) - Helpers + heavy randomness

## Current Development Task

**Status: Monte Carlo Bot Implementation Complete ✅**

Previous fixes maintained:
- ✅ Turn order chaos resolved (double AI-triggering fixed)
- ✅ "Neues Spiel" vs "Reset" distinction implemented
- ✅ UI improvements completed
- ✅ Bot system validated & updated with real performance testing
- ✅ Monte Carlo bot integrated (90% winrate, strongest bot)

**Next Priority**: Connect4 Code Refactoring (see TODO below)

## TODO: CONNECT4 REFACTORING MASTERPLAN 🏗️

### 📊 PROBLEM ANALYSIS
**Current Connect4 Codebase Issues:**
- **ai.js**: 2120 lines (6+ bot strategies in monolithic class)
- **ui.js**: 1199 lines (game logic + DOM + events mixed)
- **helpers.js**: 1585 lines (level system + threat detection + strategic analysis)
- **20+ loose test files** in root directory causing clutter
- **Mixed concerns**: Debug logging in production, business logic in UI

### 🎯 REFACTORING STRATEGY: 4-PHASE PLAN

---

#### 📅 PHASE 1: FOUNDATION & CLEANUP (Week 1)
**Goal:** Clean foundation without changing functionality

**Step 1.1: COMPREHENSIVE TEST BASELINE (Day 1)**
- Create Golden Master Tests for all bot performance matrices
- Implement UI Integration Tests for complete game flows
- Establish Performance Benchmarks as regression protection
- **SUCCESS CRITERIA:** 100% test coverage for critical paths

**Step 1.2: FILE ORGANIZATION CLEANUP (Day 2)**
- Move all 20+ loose test files → `/temp-legacy/`
- Organize debug HTMLs → `/games/connect4/debug/`
- Clean root directory from test artifacts
- **SUCCESS CRITERIA:** Clear directory structure, no broken tests

**Step 1.3: REMOVE DEAD CODE & DEBUG LOGS (Day 3)**
- Replace production console.logs with configurable logger
- Remove unused functions & variables (ESLint)
- Eliminate deprecated code paths
- **SUCCESS CRITERIA:** 20%+ size reduction, all tests green

---

#### 🧩 PHASE 2: MODULAR EXTRACTION (Week 2)
**Goal:** Split large classes into logical modules

**Step 2.1: AI STRATEGY EXTRACTION (Day 4-5)**
```javascript
// NEW: Modular Bot Architecture
abstract class BotStrategy {
    abstract getBestMove(game, helpers);
}

class SmartRandomBot extends BotStrategy { /* 150 lines */ }
class DefensiveBot extends BotStrategy { /* 200 lines */ }
class MonteCarloBot extends BotStrategy { /* 180 lines */ }

class Connect4AI { // Factory/Coordinator: 300 lines
    constructor() { this.strategies = new Map(); }
    getBestMove(game, difficulty) {
        return this.strategies.get(difficulty).getBestMove(game);
    }
}
```
- **SUCCESS CRITERIA:** AI class 2120 → ~300 lines, bot matrix tests pass

**Step 2.2: HELPERS DECOMPOSITION (Day 6)**
```javascript
class ThreatDetector { /* Win/Block Logic: 200 lines */ }
class SafetyAnalyzer { /* Trap Detection: 180 lines */ }
class HintSystem { /* UI Level Management: 150 lines */ }

class Connect4Helpers { // Facade: 200 lines
    constructor() {
        this.threatDetector = new ThreatDetector();
        this.safetyAnalyzer = new SafetyAnalyzer();
        this.hintSystem = new HintSystem();
    }
}
```
- **SUCCESS CRITERIA:** Helpers 1585 → ~200 lines, all hint tests pass

**Step 2.3: UI SEPARATION (Day 7)**
```javascript
class GameController { /* Game State: 250 lines */ }
class DOMRenderer { /* Pure View Logic: 200 lines */ }
class EventHandler { /* User Interactions: 180 lines */ }

class Connect4UI { // Coordinator: 300 lines
    constructor() {
        this.controller = new GameController();
        this.renderer = new DOMRenderer();
        this.eventHandler = new EventHandler();
    }
}
```
- **SUCCESS CRITERIA:** UI 1199 → ~300 lines, all UI tests pass

---

#### 🏛️ PHASE 3: ARCHITECTURE REFINEMENT (Week 3)
**Goal:** Establish Clean Architecture

**Step 3.1: DEPENDENCY INJECTION SETUP (Day 8-9)**
```javascript
class ServiceContainer {
    register(interface, implementation) { /* DI Logic */ }
    resolve(interface) { /* Factory Logic */ }
}

// Usage
container.register('IBotFactory', Connect4AI);
container.register('IGameEngine', Connect4Game);
container.register('IHintSystem', Connect4Helpers);
```
- **SUCCESS CRITERIA:** Loose coupling, easy test mocks

**Step 3.2: PERFORMANCE OPTIMIZATION (Day 10)**
- Implement AI caching for repeated positions
- Add lazy loading for heavy computations (Monte Carlo)
- Create memory pool for board simulations
- **SUCCESS CRITERIA:** 50%+ performance improvement in benchmarks

**Step 3.3: ERROR HANDLING & RESILIENCE (Day 11)**
- Implement graceful degradation for bot failures
- Add input validation with clear error messages
- Create retry logic for intermittent issues
- **SUCCESS CRITERIA:** Robustness tests, no unhandled exceptions

---

#### ✨ PHASE 4: FINAL POLISH (Week 4)
**Goal:** Long-term maintainability

**Step 4.1: COMPREHENSIVE DOCUMENTATION (Day 12)**
- Create Architecture Decision Records (ADRs)
- Write API documentation with TypeScript-style definitions
- Develop developer onboarding guide
- **SUCCESS CRITERIA:** New developers productive in 1 day

**Step 4.2: MONITORING & OBSERVABILITY (Day 13)**
- Add performance metrics for bot decision times
- Implement error tracking for production issues
- Create A/B testing framework for bot improvements
- **SUCCESS CRITERIA:** Data-driven bot development possible

**Step 4.3: INTEGRATION & E2E VALIDATION (Day 14)**
- Complete game flow tests (Human vs All Bots)
- Cross-browser compatibility tests
- Load testing with multiple concurrent games
- **SUCCESS CRITERIA:** Production-ready, all user journeys functional

---

### 🛡️ RISK MITIGATION

**ROLLBACK STRATEGY:**
- Each step has own Git branch with comprehensive tests
- Immediate rollback to last stable state if issues arise
- Continuous integration with automated test suites
- Backup current version as `legacy-stable-backup`

**SUCCESS METRICS:**
- **Code Lines:** 6074 → ~2000 lines (67% reduction)
- **Average File Size:** 1000+ → <300 lines
- **Test Coverage:** Fragmented → 95%+ structured
- **Performance:** No regression, 50%+ improvement possible
- **Maintainability:** New features in hours instead of days

**FINAL DELIVERABLES:**
✅ **14 modular, testable components** instead of 3 monoliths
✅ **Comprehensive test suite** with ~200 structured tests
✅ **Clean Architecture** with clear interfaces
✅ **Production-ready code** with monitoring
✅ **Complete documentation** for sustainable maintenance

**This plan is conservative, low-risk, and delivers measurable improvements in manageable steps.**

## Development Guidelines
- Immer wenn wir ein JS Feature ergänzen, sollten wir auch Tests dafür implementieren und laufen lassen.

## Development Notes
- Bei jedem Push aus der Haupseite den Footer anpassen! Bitte Farbe in weiß statt grau.