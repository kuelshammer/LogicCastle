# Trio Backend API Documentation

## 🦀 Rust-WASM TrioGame API Reference

**Version:** 2025-07-24  
**Architecture:** 3-Layer (Data/Geometry/Logic) with BitPacked Board  
**Board Size:** 7×7 (49 positions)  
**Game Type:** Mathematical puzzle - find three adjacent numbers where a×b+c or a×b-c = target  
**Storage:** BitPackedBoard<7,7,4> with 49% memory efficiency  
**Performance:** 1000x+ faster than brute force (120 patterns vs 117,649 combinations)  

---

## 🏗️ Constructor & Initialization

### `new(difficulty: u8) -> TrioGame`
```rust
#[wasm_bindgen(constructor)]
pub fn new(difficulty: u8) -> Self
```
**Description:** Creates new Trio game with specified difficulty  
**Parameters:** `difficulty` - 1 (kinderfreundlich), 2 (vollspektrum), 3 (strategisch), 4 (analytisch)  
**Returns:** `TrioGame` instance with generated board and target  
**Usage:** `const game = new TrioGame(2);`  
**Side Effects:** Generates 7×7 board filled with numbers 1-9, calculates target number  

---

## 🎮 Core Game Actions

### `validate_trio(row1: usize, col1: usize, row2: usize, col2: usize, row3: usize, col3: usize) -> i32`
```rust
#[wasm_bindgen]
pub fn validate_trio(&self, row1: usize, col1: usize, row2: usize, col2: usize, row3: usize, col3: usize) -> i32
```
**Description:** Validate if three positions form a valid trio solution  
**Parameters:** Six coordinates for three board positions (row1,col1), (row2,col2), (row3,col3)  
**Returns:** Target number if valid trio, `-1` if invalid  
**Validation Rules:**  
- Positions must be adjacent (horizontal, vertical, or diagonal line)  
- Numbers must be 1-9  
- Either a×b+c or a×b-c must equal target number  
**Performance:** O(1) with adjacency precomputation  

### `generate_new_board(difficulty: u8) -> u8`
```rust
#[wasm_bindgen]
pub fn generate_new_board(&mut self, difficulty: u8) -> u8
```
**Description:** Generate new 7×7 board with specified difficulty  
**Parameters:** `difficulty` - 1-4 difficulty level  
**Returns:** New target number for the generated board  
**Side Effects:** Replaces current board, resets solution history  
**Algorithm:** Difficulty-based number distribution (easy=more small numbers, hard=more complex)  

---

## 📊 Game State Access

### `get_number(row: usize, col: usize) -> u8`
```rust
#[wasm_bindgen]
pub fn get_number(&self, row: usize, col: usize) -> u8
```
**Description:** Get number at specific board position  
**Parameters:** `row` (0-6), `col` (0-6)  
**Returns:** Number at position (1-9), or 0 if invalid position  

### `get_board_array() -> Vec<u8>`
```rust
#[wasm_bindgen]
pub fn get_board_array(&self) -> Vec<u8>
```
**Description:** Get entire board as flat array  
**Returns:** `Vec<u8>` of length 49 (7×7 board)  
**Format:** `[row0_col0, row0_col1, ..., row6_col6]`  
**Usage:** Convenient for UI rendering, bulk operations  

### `get_target_number() -> u8`
```rust
#[wasm_bindgen]
pub fn get_target_number(&self) -> u8
```
**Description:** Get current target number players must achieve  
**Returns:** Target number (typically 10-100 range depending on difficulty)  

### `get_difficulty() -> u8`
```rust
#[wasm_bindgen]
pub fn get_difficulty(&self) -> u8
```
**Description:** Get current difficulty level  
**Returns:** Difficulty (1=kinderfreundlich, 2=vollspektrum, 3=strategisch, 4=analytisch)  

---

## 🔍 Advanced Analysis

### `find_all_solutions() -> Vec<u8>`
```rust
#[wasm_bindgen]
pub fn find_all_solutions(&self) -> Vec<u8>
```
**Description:** Find all possible trio solutions on current board  
**Returns:** Flat array with solution data: `[row1, col1, row2, col2, row3, col3, result, ...]`  
**Format:** Each solution uses 7 bytes: 6 coordinates + 1 result value  
**Performance:** O(120) - only checks valid adjacent triplets, not all 117,649 combinations  
**Algorithm:** Uses pre-computed adjacency patterns for 1000x speedup  

### `count_possible_solutions() -> usize`
```rust
#[wasm_bindgen]
pub fn count_possible_solutions(&self) -> usize
```
**Description:** Count total possible solutions without returning them  
**Returns:** Number of valid solutions on current board  
**Usage:** Difficulty assessment, hint system  

---

## 🏁 Game Status & Validation

### `is_valid_position(row: usize, col: usize) -> bool`
```rust
#[wasm_bindgen]
pub fn is_valid_position(&self, row: usize, col: usize) -> bool
```
**Description:** Check if position coordinates are valid  
**Parameters:** `row` (0-6), `col` (0-6)  
**Returns:** `true` if position within 7×7 board bounds  

### `validate_adjacency_pattern(positions: &[(usize, usize); 3]) -> bool`
```rust
pub fn validate_adjacency_pattern(&self, positions: &[(usize, usize); 3]) -> bool
```
**Description:** Check if three positions form valid adjacent pattern  
**Internal Usage:** Called by `validate_trio` for adjacency validation  
**Patterns:** Horizontal, vertical, diagonal lines only  

---

## 🎯 Difficulty System

### **Difficulty Levels:**
1. **Kinderfreundlich (1):** Easy patterns, more small numbers (1-5), simple calculations
2. **Vollspektrum (2):** Balanced distribution, moderate complexity  
3. **Strategisch (3):** More complex numbers (6-9), fewer obvious solutions
4. **Analytisch (4):** Expert level, complex patterns, advanced calculations

### **Target Number Generation:**
- **Easy:** Targets 10-30 (simple multiplications)
- **Medium:** Targets 20-60 (balanced complexity) 
- **Hard:** Targets 40-80 (requires strategic thinking)
- **Expert:** Targets 50-100 (advanced mathematical reasoning)

---

## 🔧 Utility & Debug

### `memory_usage() -> usize`
```rust
#[wasm_bindgen]
pub fn memory_usage(&self) -> usize
```
**Description:** Get approximate memory usage in bytes  
**Returns:** Memory usage estimate including board and adjacency patterns  
**Usage:** Performance monitoring, optimization validation  

### `memory_efficiency() -> f32`
```rust
#[wasm_bindgen]
pub fn memory_efficiency(&self) -> f32
```
**Description:** Get memory efficiency percentage vs naive array storage  
**Returns:** Efficiency percentage (49% savings with BitPacked storage)  
**Calculation:** `(1.0 - bitpacked_bytes / array_bytes) * 100.0`  

### `board_string() -> String`
```rust
#[wasm_bindgen] 
pub fn board_string(&self) -> String
```
**Description:** Get human-readable board representation  
**Returns:** 7-line string showing numbers in grid format  
**Usage:** Console debugging, development logging  

### `get_adjacency_pattern_count() -> usize`
```rust
#[wasm_bindgen]
pub fn get_adjacency_pattern_count(&self) -> usize
```
**Description:** Get total number of valid adjacency patterns  
**Returns:** 120 (pre-computed linear triplet patterns)  
**Technical:** Optimization validation - shows algorithm efficiency  

---

## 🏗️ Architecture Notes

### **BitPacked Board System**
- **Storage:** `BitPackedBoard<7,7,4>` - 4 bits per cell (perfect for numbers 1-9)
- **Memory:** 25 bytes vs 49 bytes array storage (49% reduction)
- **Performance:** Native bit operations for rapid access

### **3-Layer Architecture**
```rust
struct TrioGame {
    geometry: TrioGrid,           // Adjacency patterns, validation logic
    board: BitPackedBoard<7,7,4>, // Efficient number storage (1-9)
    target_number: u8,            // Current puzzle target
    difficulty: u8,               // Game difficulty (1-4)
    found_solutions: Vec<TrioSolution>, // Solution history
}
```

### **TrioGrid Geometry System**
- **Adjacent Triplets:** 120 pre-computed linear patterns
- **Pattern Types:** Horizontal (5×7=35), Vertical (7×5=35), Diagonal-1 (5×5=25), Diagonal-2 (5×5=25)
- **Validation:** O(1) adjacency checking with pre-sorted pattern matching
- **Optimization:** 1000x speedup vs brute force (120 vs 117,649 combinations)

### **Solution Algorithm Performance**
1. **Brute Force:** 7^6 = 117,649 combinations to check
2. **Optimized:** 120 adjacency patterns only  
3. **Speedup:** 980x faster (117,649 / 120 ≈ 980)
4. **Memory:** Constant O(1) space for pattern lookup

### **Difficulty-Based Generation**
- **Number Distribution:** Adjusts frequency of 1-9 based on difficulty
- **Target Calculation:** Ensures solvable puzzles with appropriate complexity
- **Balance:** Multiple solutions available but not trivial to find

---

## 📚 Integration Examples

### **Basic Game Setup**
```javascript
const game = new TrioGame(2); // Vollspektrum difficulty

// Get game info
console.log('Target:', game.get_target_number());
console.log('Board size: 7x7');
console.log('Memory usage:', game.memory_usage(), 'bytes');
console.log('Memory efficiency:', game.memory_efficiency().toFixed(1) + '%');
```

### **Trio Validation**
```javascript
const game = new TrioGame(2);

// Check if positions (0,0), (0,1), (0,2) form valid trio
const result = game.validate_trio(0, 0, 0, 1, 0, 2);
if (result !== -1) {
    console.log('Valid trio! Result:', result);
} else {
    console.log('Invalid trio - not adjacent or wrong calculation');
}
```

### **Solution Finding**
```javascript
const game = new TrioGame(3); // Strategisch difficulty

// Find all solutions on current board
const solutions = game.find_all_solutions();
console.log('Found', solutions.length / 7, 'solutions');

// Parse solutions (7 bytes per solution: row1,col1,row2,col2,row3,col3,result)
for (let i = 0; i < solutions.length; i += 7) {
    const solution = {
        pos1: [solutions[i], solutions[i+1]],
        pos2: [solutions[i+2], solutions[i+3]], 
        pos3: [solutions[i+4], solutions[i+5]],
        result: solutions[i+6]
    };
    console.log('Solution:', solution);
}
```

### **Board Access**
```javascript
const game = new TrioGame(1); // Kinderfreundlich

// Access individual numbers
const num = game.get_number(3, 4); // Row 3, Col 4
console.log('Number at (3,4):', num);

// Get entire board as flat array
const board = game.get_board_array();
console.log('Board:', board); // [1,2,3,4,5,6,7, 8,9,1,2,3,4,5, ...]

// Convert to 7x7 matrix for display
const matrix = [];
for (let row = 0; row < 7; row++) {
    matrix[row] = board.slice(row * 7, (row + 1) * 7);
}
console.table(matrix);
```

### **Dynamic Difficulty**
```javascript
const game = new TrioGame(1); // Start easy

// Play some rounds...
// User getting too good? Increase difficulty
const newTarget = game.generate_new_board(4); // Analytisch
console.log('New challenge! Target:', newTarget);
console.log('Difficulty:', game.get_difficulty()); // 4
```

---

## 🔍 Trio vs Other Games Comparison

### **Trio vs Connect4**
- **Board:** 7×7 number grid vs 6×7 drop-based
- **Objective:** Mathematical calculation vs 4-in-a-row  
- **Moves:** Select 3 adjacent positions vs drop in column
- **AI:** Not needed (puzzle) vs strategic AI required

### **Trio vs Gomoku** 
- **Board:** 7×7 numbers vs 15×15 intersections
- **Logic:** Mathematical validation vs pattern matching
- **Adjacency:** Linear triplets only vs 5-in-a-row any direction
- **Complexity:** Number-based puzzle vs positional strategy

### **Unique Features**
- **Mathematical Focus:** Only LogicCastle game requiring arithmetic
- **Adjacent Constraint:** Linear patterns create geometric challenge  
- **Self-Contained:** No opponent needed, pure puzzle solving
- **Scalable Difficulty:** Algorithmic difficulty progression

---

**📄 Documentation Generated:** 2025-07-24  
**🦀 WASM Module:** game_engine.wasm  
**📚 Source:** `/game_engine/src/games/trio.rs`  
**🎯 Game Type:** Mathematical Puzzle, Single Player, Logic-Based  
**🔧 Architecture:** 3-Layer with BitPacked optimization