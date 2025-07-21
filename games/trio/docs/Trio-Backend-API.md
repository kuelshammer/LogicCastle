# 🎯 Trio Backend API Reference

**Status**: Production Ready ✅  
**Engine**: TrioGameBitPacked with WASM Backend  
**Architecture**: 3-Layer Design (UI → Game Logic → WASM)  
**Memory**: BitPackedBoard<7,7,4> for 49% efficiency  

---

## 🏗️ Architecture Overview

### **3-Layer Architecture Pattern (Connect4 Standard)**
```
Layer 3: UI/Frontend     → TrioUIBitPacked + Components
Layer 2: Game Logic      → TrioGameBitPacked (This API)
Layer 1: WASM/Rust       → TrioGame + BitPackedBoard<7,7,4>
```

### **Core Game Concept**
- **Puzzle Game**: Find combinations where `a×b+c` or `a×b-c` = target
- **Board Size**: 7×7 grid with numbers 1-9
- **Goal**: Select 3 numbers that form valid trio calculations
- **No AI**: Pure puzzle-solving experience

---

## 📋 Complete API Reference

### **1. Constructor & Initialization**

#### `constructor(difficulty = 'kinderfreundlich')`
Creates new TrioGameBitPacked instance.
```javascript
const game = new TrioGameBitPacked('vollspektrum');
```
**Parameters:**
- `difficulty` (string): Game difficulty level
  - `'kinderfreundlich'` (1) - Child-friendly numbers
  - `'vollspektrum'` (2) - Full spectrum complexity
  - `'strategisch'` (3) - Strategic calculations
  - `'analytisch'` (4) - Analytical precision

#### `async init()`
Initializes WASM Trio engine and prepares game state.
```javascript
const success = await game.init();
console.log('Engine ready:', success);
```
**Returns:** `Promise<boolean>` - Initialization success status

---

### **2. Core Game Actions**

#### `validateTrio(positions)`
Validates if three positions form a valid trio calculation.
```javascript
const positions = [
  {row: 0, col: 0}, // a
  {row: 1, col: 1}, // b  
  {row: 2, col: 2}  // c
];
const result = game.validateTrio(positions);
// Returns: {valid: true, result: 15, calculation: "3×4+3 = 15"}
```
**Parameters:**
- `positions` (Array<{row: number, col: number}>): Exactly 3 board positions

**Returns:** 
```javascript
{
  valid: boolean,     // True if forms valid trio
  result: number,     // Calculated result value  
  calculation: string // Human-readable formula
}
```

#### `submitTrio(positions)`
Submits a valid trio solution and updates game statistics.
```javascript
const success = game.submitTrio(positions);
if (success) {
  console.log('Solution accepted!');
}
```
**Parameters:**
- `positions` (Array<{row: number, col: number}>): Valid trio positions

**Returns:** `boolean` - True if solution accepted

---

### **3. Board Access Methods**

#### `getNumber(row, col)`
Retrieves the number at specific board position.
```javascript
const value = game.getNumber(2, 3);
console.log('Position (2,3):', value); // e.g., 7
```
**Parameters:**
- `row` (number): Row index (0-6)
- `col` (number): Column index (0-6)

**Returns:** `number` - Value at position (1-9)

#### `getBoard()`
Returns complete board as 2D array.
```javascript
const board = game.getBoard();
console.log('Board:', board);
// Returns: [[1,2,3,4,5,6,7], [8,9,1,2,3,4,5], ...]
```
**Returns:** `number[][]` - 7×7 board array

#### `getBoardFlat()`
Returns board as single flat array (row-major order).
```javascript
const flatBoard = game.getBoardFlat();
console.log('Flat board:', flatBoard.length); // 49 elements
```
**Returns:** `number[]` - 49-element flat array

#### `getTargetNumber()`
Gets the current target number for trio calculations.
```javascript
const target = game.getTargetNumber();
console.log('Find trios that equal:', target);
```
**Returns:** `number` - Current target value

---

### **4. Board Generation & Management**

#### `generateNewBoard(difficulty?)`
Generates a new puzzle board with specified difficulty.
```javascript
const success = game.generateNewBoard('strategisch');
if (success) {
  console.log('New board generated!');
  const target = game.getTargetNumber();
}
```
**Parameters:**
- `difficulty` (string, optional): Override current difficulty

**Returns:** `boolean` - Generation success status

---

### **5. Solution Finding & Analysis**

#### `findAllSolutions()`
Finds all possible trio combinations on current board.
```javascript
const solutions = game.findAllSolutions();
console.log(`Found ${solutions.length} solutions`);
solutions.forEach(sol => {
  console.log(sol.calculation); // "2×3+4 = 10"
});
```
**Returns:** 
```javascript
Array<{
  positions: Array<{row: number, col: number}>,
  result: number,
  calculation: string
}>
```

---

### **6. Game State & Statistics**

#### `getGameStats()`
Returns comprehensive game statistics and state.
```javascript
const stats = game.getGameStats();
console.log('Progress:', `${stats.solutionsFound} solutions found`);
console.log('Efficiency:', `${stats.memoryEfficiency}% memory saved`);
```
**Returns:**
```javascript
{
  difficulty: string,        // Current difficulty level
  difficultyNumber: number,  // Difficulty as number (1-4)
  target: number,           // Current target number
  solutionsFound: number,   // Solutions submitted
  totalMoves: number,       // Total moves made
  gameActive: boolean,      // Game in progress
  memoryUsage: number,      // Memory usage in bytes
  memoryEfficiency: number  // Memory efficiency %
}
```

#### `getSolutionHistory()`
Returns complete history of submitted solutions.
```javascript
const history = game.getSolutionHistory();
history.forEach((solution, index) => {
  console.log(`Solution ${index + 1}: ${solution.calculation}`);
});
```
**Returns:**
```javascript
Array<{
  positions: Array<{row: number, col: number}>,
  result: number,
  calculation: string,
  timestamp: number,
  moveNumber: number
}>
```

---

### **7. Game Control & Status**

#### `isInitialized()`
Checks if WASM engine is ready.
```javascript
if (game.isInitialized()) {
  // Safe to make game calls
}
```
**Returns:** `boolean` - Engine ready status

#### `isGameActive()`
Checks if game is in progress.
```javascript
if (game.isGameActive()) {
  // Game is active, accepting moves
}
```
**Returns:** `boolean` - Game active status

#### `resetGame()`
Resets game statistics while keeping current board.
```javascript
game.resetGame();
console.log('Game reset, board preserved');
```
**Returns:** `void`

---

### **8. Difficulty Management**

#### `getCurrentDifficulty()`
Gets current difficulty level as string.
```javascript
const difficulty = game.getCurrentDifficulty();
console.log('Current difficulty:', difficulty); // "vollspektrum"
```
**Returns:** `string` - Difficulty level name

#### `mapDifficultyToNumber(difficulty)`
Converts difficulty string to numeric level.
```javascript
const level = game.mapDifficultyToNumber('strategisch');
console.log('Difficulty level:', level); // 3
```
**Parameters:**
- `difficulty` (string): Difficulty name

**Returns:** `number` - Difficulty level (1-4)

#### `mapDifficultyToString(difficultyNumber)`
Converts numeric difficulty to string name.
```javascript
const name = game.mapDifficultyToString(2);
console.log('Difficulty name:', name); // "vollspektrum"
```
**Parameters:**
- `difficultyNumber` (number): Difficulty level (1-4)

**Returns:** `string` - Difficulty name

---

### **9. Memory & Performance**

#### `getMemoryInfo()`
Returns BitPackedBoard memory optimization statistics.
```javascript
const memory = game.getMemoryInfo();
console.log(`Memory usage: ${memory.usage} bytes`);
console.log(`Efficiency: ${memory.efficiency}% saved`);
```
**Returns:**
```javascript
{
  usage: number,      // Current memory usage in bytes
  efficiency: number  // Percentage memory saved vs naive approach
}
```

---

### **10. Event System**

#### `setCallback(callbackName, callback)`
Sets event callback for game events.
```javascript
game.setCallback('onSolutionFound', (data) => {
  console.log('Solution found:', data.calculation);
  updateUI();
});
```
**Available Callbacks:**
- `onGameStateChange(data)` - Game state changes
- `onSolutionFound(data)` - Valid solution submitted
- `onBoardGenerated(data)` - New board created  
- `onError(data)` - Error occurred

**Parameters:**
- `callbackName` (string): Event name
- `callback` (function): Callback function

---

## 🎯 Usage Examples

### **Basic Game Setup**
```javascript
// Create and initialize game
const game = new TrioGameBitPacked('vollspektrum');
await game.init();

// Generate board and get target
game.generateNewBoard();
const target = game.getTargetNumber();
console.log(`Find trios that equal ${target}`);

// Get board for UI
const board = game.getBoard();
```

### **Trio Validation Flow**
```javascript
// User selects 3 positions
const positions = [
  {row: 0, col: 0}, // value: 3
  {row: 1, col: 1}, // value: 4  
  {row: 2, col: 2}  // value: 5
];

// Validate trio
const validation = game.validateTrio(positions);
if (validation.valid) {
  console.log(`Valid trio: ${validation.calculation}`);
  
  // Submit solution
  const accepted = game.submitTrio(positions);
  if (accepted) {
    console.log('Solution accepted and recorded!');
  }
}
```

### **Game Statistics Tracking**
```javascript
// Get comprehensive stats
const stats = game.getGameStats();
console.log(`Progress: ${stats.solutionsFound} solutions found`);
console.log(`Moves: ${stats.totalMoves}`);
console.log(`Difficulty: ${stats.difficulty}`);

// Get solution history
const history = game.getSolutionHistory();
console.log(`Total solutions: ${history.length}`);
```

---

## 🏗️ Technical Architecture

### **BitPackedBoard Optimization**
- **Memory Efficiency**: 49% reduction vs naive approach
- **Performance**: Optimized bit operations in WASM
- **Scalability**: Handles complex difficulty levels efficiently

### **3-Layer Design Benefits**
- **Separation of Concerns**: UI, Logic, Engine clearly separated
- **Testability**: Each layer can be tested independently  
- **Performance**: Critical operations run in WASM
- **Maintainability**: Clear interfaces between layers

### **WASM Integration**
- **Engine**: Rust-based trio calculation engine
- **Fallback**: JavaScript implementation available
- **Performance**: 10x+ speedup for complex boards
- **Memory**: Efficient BitPacked representation

---

## 📊 API Utilization Assessment

**Total API Methods**: 20+ methods  
**Core Game Methods**: 8 methods  
**State Access**: 6 methods  
**Utility Methods**: 6 methods  

**Current UI Integration**: ~75% API utilization  
**Optimization Potential**: High - full API surface available  

---

**🎯 Trio Backend API provides complete puzzle game functionality with efficient WASM backend and comprehensive event system for premium UI integration.**