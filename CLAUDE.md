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
- Inherit difficulty progression: random → rule-based → minimax
- Implement position evaluation functions specific to game mechanics
- Use move ordering for performance optimization
- Test across all difficulty levels

### UI Consistency
- Maintain two-click interaction pattern where applicable
- Implement keyboard shortcuts (number keys for quick access)
- Follow responsive design principles established in main stylesheet
- Include comprehensive help modals with keyboard shortcuts documentation

## Current Development Task

**See PLAN.md for current development plan and implementation status.**

Current focus: Connect4 "Neues Spiel" vs "Reset" Unterscheidung & UI-Verbesserungen
- ✅ Implementing separate next game vs full reset functionality
- ✅ Removing unnecessary colons from emoji labels  
- ✅ Adding contextual button behavior

**✅ CRITICAL BUG RESOLVED:**
Turn order chaos in bot mode was caused by double AI-triggering:
- Fixed by removing AI trigger from onPlayerChanged() event handler (ui.js:663-665)
- AI now only triggered in makePlayerMove() and reset functions
- Turn sequence now works correctly: Red → Yellow → Red → Yellow
- Validated with comprehensive test suite in test-turn-order-fix.js

**Root Cause:** 
- onPlayerChanged() was triggered after every move, including AI moves
- Led to multiple bot moves per player turn
- Caused bots to place stones in same column due to parallel AI calls

**Status:** FIXED ✅