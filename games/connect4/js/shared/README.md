# Connect4 Shared Utilities

This directory contains shared utilities used across all Connect4 modules.

## 📁 Structure

```
shared/
├── constants.js         # Game constants and configuration
├── board-utils.js       # Board manipulation utilities
├── event-utils.js       # Event system utilities
├── performance-utils.js # Performance monitoring tools
├── index.js             # Main export file
└── README.md           # This file
```

## 🎯 Purpose

These utilities eliminate code duplication and provide:
- **Consistent constants** across all modules
- **Reusable board operations** for game logic
- **Event system infrastructure** for component communication
- **Performance monitoring** for optimization

## 📦 Module Details

### constants.js

Defines all game constants and configuration:

```javascript
import { GAME_CONFIG, PLAYERS, ALL_DIRECTIONS } from './constants.js';

// Game dimensions
console.log(GAME_CONFIG.ROWS);    // 6
console.log(GAME_CONFIG.COLS);    // 7

// Player constants
console.log(PLAYERS.PLAYER1);     // 1 (Red)
console.log(PLAYERS.PLAYER2);     // 2 (Yellow)
```

### board-utils.js

Board manipulation and analysis functions:

```javascript
import { createEmptyBoard, simulateMove, checkWinAtPosition } from './board-utils.js';

// Create new board
const board = createEmptyBoard();

// Simulate move
const result = simulateMove(board, 3, PLAYERS.PLAYER1);
if (result.isWin) {
    console.log('Winning move!', result.winningCells);
}
```

### event-utils.js

Event system for component communication:

```javascript
import { EventEmitter, GameEventDispatcher } from './event-utils.js';

// Basic event emitter
const emitter = new EventEmitter();
emitter.on('test', data => console.log(data));
emitter.emit('test', 'Hello!');

// Game-specific event dispatcher
const gameEvents = new GameEventDispatcher();
gameEvents.emitGameEvent('moveMade', { column: 3, player: 1 });
```

### performance-utils.js

Performance monitoring and optimization:

```javascript
import { PerformanceTimer, profileFunction } from './performance-utils.js';

// Time operations
const timer = new PerformanceTimer('AI Calculation');
timer.start();
// ... do work ...
const duration = timer.stop();

// Profile functions
const profiledFunction = profileFunction(myFunction, 'MyFunction');
```

## 🔄 Usage Patterns

### Import Individual Items

```javascript
// Import specific utilities
import { PLAYERS, simulateMove, EventEmitter } from '../shared/index.js';
```

### Import All from Category

```javascript
// Import all constants
import * as Constants from '../shared/constants.js';

// Import all board utilities
import * as BoardUtils from '../shared/board-utils.js';
```

### Backward Compatibility

```javascript
// Legacy global access still works
const board = createEmptyBoard(); // Global function
const config = Connect4Constants.GAME_CONFIG; // Global object
```

## 🎪 Integration Examples

### AI Strategy Module

```javascript
import { 
    PLAYERS, 
    ALL_DIRECTIONS, 
    simulateMove, 
    getValidMoves,
    PerformanceTimer 
} from '../shared/index.js';

class MyBotStrategy {
    getBestMove(game) {
        const timer = new PerformanceTimer('Move Calculation');
        timer.start();
        
        const validMoves = getValidMoves(game.board);
        
        for (const col of validMoves) {
            const result = simulateMove(game.board, col, PLAYERS.PLAYER1);
            if (result.isWin) {
                timer.stop();
                return col;
            }
        }
        
        timer.stop();
        return validMoves[0];
    }
}
```

### Helper Module

```javascript
import { 
    GAME_CONFIG,
    ALL_DIRECTIONS,
    countLineLength,
    EventEmitter,
    HINT_TYPES 
} from '../shared/index.js';

class ThreatDetector extends EventEmitter {
    detectThreats(board, player) {
        const threats = [];
        
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                for (const direction of ALL_DIRECTIONS) {
                    const length = countLineLength(board, row, col, direction, player);
                    if (length >= 3) {
                        threats.push({ row, col, direction, length });
                    }
                }
            }
        }
        
        this.emit('threatsDetected', { threats, type: HINT_TYPES.FORCED_BLOCK });
        return threats;
    }
}
```

## 🚀 Performance Benefits

### Code Reuse
- **Eliminates duplication**: Same function used across 6+ modules
- **Consistent behavior**: Single implementation ensures consistency
- **Easier maintenance**: Update once, applies everywhere

### Optimized Functions
- **Board operations**: Optimized for Connect4 specific dimensions
- **Direction calculations**: Pre-computed direction vectors
- **Memory management**: Efficient board copying and simulation

### Performance Monitoring
- **Built-in timers**: Measure any operation
- **Memory tracking**: Monitor memory usage
- **Budget enforcement**: Ensure operations stay within performance budgets

## 🔧 Development Guidelines

### Adding New Utilities

1. **Choose the right module**:
   - `constants.js` - Configuration values, enums
   - `board-utils.js` - Board manipulation, game logic
   - `event-utils.js` - Event handling, communication
   - `performance-utils.js` - Performance, monitoring

2. **Follow naming conventions**:
   - Constants: `UPPER_SNAKE_CASE`
   - Functions: `camelCase`
   - Classes: `PascalCase`

3. **Add JSDoc documentation**:
   ```javascript
   /**
    * Simulate a move on the board
    * @param {Array[]} board - Game board
    * @param {number} col - Column for move
    * @param {number} player - Player making move
    * @returns {Object|null} Move result or null if invalid
    */
   export function simulateMove(board, col, player) {
       // implementation
   }
   ```

4. **Export from index.js**:
   ```javascript
   // Add to index.js for easy importing
   export { myNewFunction } from './board-utils.js';
   ```

5. **Add backward compatibility**:
   ```javascript
   // Add to global window object
   if (typeof window !== 'undefined') {
       window.myNewFunction = myNewFunction;
   }
   ```

### Testing Utilities

Create tests in `tests/shared-utils-tests.js`:

```javascript
import { simulateMove, PLAYERS } from '../games/connect4/js/shared/index.js';

// Test your utilities
function testSimulateMove() {
    const board = createEmptyBoard();
    const result = simulateMove(board, 3, PLAYERS.PLAYER1);
    
    assert(result !== null, 'Valid move should return result');
    assert(result.player === PLAYERS.PLAYER1, 'Player should match');
}
```

## 🔗 Dependencies

- **No external dependencies**: All utilities are self-contained
- **ES6 modules**: Use modern import/export syntax
- **Backward compatible**: Global access for legacy code
- **Browser & Node.js**: Works in both environments

## 📊 Impact

After implementing shared utilities:

- **Reduced code duplication**: ~200 lines removed across modules
- **Improved consistency**: Single source of truth for constants
- **Better performance**: Optimized, reusable functions
- **Easier testing**: Utilities can be tested independently
- **Cleaner imports**: One import location for common functionality

The shared utilities layer provides a solid foundation for the modular Connect4 architecture.