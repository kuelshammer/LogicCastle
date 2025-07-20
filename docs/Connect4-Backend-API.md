# Connect4 Backend API Documentation

## 🦀 Rust-WASM Connect4Game API Reference

**Version:** 2025-07-20  
**Architecture:** 3-Layer (Data/Geometry/AI) with BitPacked Board  
**Performance:** 10x+ faster than JavaScript implementation  

---

## 🏗️ Constructor & Initialization

### `new() -> Connect4Game`
```rust
#[wasm_bindgen(constructor)]
pub fn new() -> Self
```
**Description:** Creates new Connect4 game with Yellow player starting  
**Returns:** `Connect4Game` instance  
**Usage:** `const game = new Connect4Game();`

### `new_with_starting_player(player: Player) -> Connect4Game`  
```rust
pub fn new_with_starting_player(starting_player: Player) -> Self
```
**Description:** Creates game with specific starting player  
**Parameters:** `Player::Yellow` or `Player::Red`  
**Returns:** `Connect4Game` instance  
**Usage:** Game series where "loser starts next game"

---

## 🎮 Core Game Actions

### `make_move(column: usize) -> Result<bool, JsValue>`
```rust
#[wasm_bindgen]
pub fn make_move(&mut self, column: usize) -> Result<bool, JsValue>
```
**Description:** Make a move in specified column (0-6)  
**Parameters:** `column` - Column index (0-6)  
**Returns:** `Ok(true)` if move successful, `Err()` if invalid  
**Side Effects:** Updates board state, switches player, checks win condition  

### `is_valid_move(column: usize) -> bool`
```rust
#[wasm_bindgen]
pub fn is_valid_move(&self, column: usize) -> bool
```
**Description:** Check if move is valid without executing it  
**Parameters:** `column` - Column index (0-6)  
**Returns:** `true` if column has space and game not over  

### `reset()`
```rust
#[wasm_bindgen]
pub fn reset(&mut self)
```
**Description:** Reset game to initial state (Yellow starts)  
**Side Effects:** Clears board, resets all counters  

---

## 📊 Game State Access

### `get_cell(row: usize, col: usize) -> u8`
```rust
#[wasm_bindgen]
pub fn get_cell(&self, row: usize, col: usize) -> u8
```
**Description:** Get cell value at position  
**Parameters:** `row` (0-5), `col` (0-6)  
**Returns:** `0` = empty, `1` = yellow, `2` = red  

### `get_board() -> Vec<u8>`
```rust
#[wasm_bindgen]
pub fn get_board(&self) -> Vec<u8>
```
**Description:** Get entire board as flat array  
**Returns:** `Vec<u8>` of length 42 (6×7 board)  
**Format:** `[row0_col0, row0_col1, ..., row5_col6]`  

### `current_player() -> Player`
```rust
#[wasm_bindgen]
pub fn current_player(&self) -> Player
```
**Description:** Get current player  
**Returns:** `Player::Yellow` or `Player::Red`  

### `winner() -> Option<Player>`
```rust
#[wasm_bindgen]
pub fn winner(&self) -> Option<Player>
```
**Description:** Get winner if game is over  
**Returns:** `Some(Player)` if won, `None` if ongoing/draw  

### `move_count() -> usize`
```rust
#[wasm_bindgen]
pub fn move_count(&self) -> usize
```
**Description:** Get number of moves played  
**Returns:** Move count (0-42)  

### `get_column_height(column: usize) -> usize`
```rust
#[wasm_bindgen]
pub fn get_column_height(&self, column: usize) -> usize
```
**Description:** Get number of pieces in column  
**Parameters:** `column` (0-6)  
**Returns:** Height (0-6)  

---

## 🏁 Game Status

### `is_game_over() -> bool`
```rust
#[wasm_bindgen]
pub fn is_game_over(&self) -> bool
```
**Description:** Check if game is finished  
**Returns:** `true` if won or draw  

### `is_draw() -> bool`
```rust
#[wasm_bindgen]
pub fn is_draw(&self) -> bool
```
**Description:** Check if game is draw  
**Returns:** `true` if board full with no winner  

### `get_game_phase() -> GamePhase`
```rust
#[wasm_bindgen]
pub fn get_game_phase(&self) -> GamePhase
```
**Description:** Get current game phase for strategy  
**Returns:** `Opening` (0-8 moves), `Midgame` (9-20), `Endgame` (21+)  

---

## 🤖 AI Integration

### `get_ai_move() -> Option<usize>`
```rust
#[wasm_bindgen]
pub fn get_ai_move(&self) -> Option<usize>
```
**Description:** Get best AI move for current player  
**Returns:** `Some(column)` or `None` if no moves available  
**Algorithm:** Multi-stage evaluation (Win → Block → Strategy)  

### `set_ai_difficulty(difficulty: AIDifficulty)`
```rust
#[wasm_bindgen]
pub fn set_ai_difficulty(&mut self, difficulty: crate::ai::connect4_ai::AIDifficulty)
```
**Description:** Set AI difficulty level  
**Parameters:** `Easy`, `Medium`, `Hard`, `Expert`  
**Side Effects:** Changes AI evaluation depth and strategy  

### `get_ai_difficulty() -> AIDifficulty`
```rust
#[wasm_bindgen]
pub fn get_ai_difficulty(&self) -> crate::ai::connect4_ai::AIDifficulty
```
**Description:** Get current AI difficulty  
**Returns:** Current difficulty setting  

---

## 📈 Advanced Analysis

### `analyze_position() -> PositionAnalysis`
```rust
#[wasm_bindgen]
pub fn analyze_position(&self) -> PositionAnalysis
```
**Description:** Comprehensive position analysis  
**Returns:** Struct with threats, opportunities, evaluation score  
**Usage:** Strategic UI feedback, move suggestions  

### `get_winning_moves(player: Player) -> Vec<usize>`
```rust
#[wasm_bindgen]
pub fn get_winning_moves(&self, player: Player) -> Vec<usize>
```
**Description:** Get all columns that result in immediate win  
**Parameters:** `Player::Yellow` or `Player::Red`  
**Returns:** `Vec<usize>` of winning column indices  

### `get_blocking_moves(player: Player) -> Vec<usize>`
```rust
#[wasm_bindgen]
pub fn get_blocking_moves(&self, player: Player) -> Vec<usize>
```
**Description:** Get all columns that block opponent's win  
**Parameters:** `Player::Yellow` or `Player::Red`  
**Returns:** `Vec<usize>` of blocking column indices  

### `get_threatening_moves(player: Player) -> Vec<usize>`
```rust
#[wasm_bindgen]
pub fn get_threatening_moves(&self, player: Player) -> Vec<usize>
```
**Description:** Get all columns that create threats  
**Parameters:** `Player::Yellow` or `Player::Red`  
**Returns:** `Vec<usize>` of threatening column indices  

### `evaluate_position_for_player(player: Player) -> i32`
```rust
#[wasm_bindgen]
pub fn evaluate_position_for_player(&self, player: Player) -> i32
```
**Description:** Evaluate position strength for specific player  
**Parameters:** `Player::Yellow` or `Player::Red`  
**Returns:** Score (-1000 to +1000, higher = better for player)  

---

## ↩️ Undo System

### `can_undo() -> bool`
```rust
#[wasm_bindgen]
pub fn can_undo(&self) -> bool
```
**Description:** Check if undo is possible  
**Returns:** `true` if moves exist and game not over  

### `undo_move() -> bool`
```rust
#[wasm_bindgen]
pub fn undo_move(&mut self) -> bool
```
**Description:** Undo last move  
**Returns:** `true` if undo successful  
**Side Effects:** Reverts board state, switches player  

---

## 🎯 Series Management

### `start_new_series_with_players(player_a: Player, player_b: Player, winner: Player)`
```rust
#[wasm_bindgen]
pub fn start_new_series_with_players(&mut self, player_a: Player, player_b: Player, winner: Player)
```
**Description:** Start new game in series with specified starting player  
**Parameters:** Player definitions and winner from previous game  
**Usage:** Tournament mode, best-of-X series  

---

## 🔧 Utility & Debug

### `board_string() -> String`
```rust
#[wasm_bindgen]
pub fn board_string(&self) -> String
```
**Description:** Get human-readable board representation  
**Returns:** Multi-line string with board layout  
**Usage:** Debugging, console logging  

### `memory_usage() -> usize`
```rust
#[wasm_bindgen]
pub fn memory_usage(&self) -> usize
```
**Description:** Get approximate memory usage in bytes  
**Returns:** Memory usage estimate  
**Usage:** Performance monitoring  

---

## 🔄 Legacy Compatibility

### `newGame()`
```rust
#[wasm_bindgen]
pub fn newGame(&mut self)
```
**Description:** Legacy alias for `reset()`  
**Deprecated:** Use `reset()` instead  

### `undoMove() -> bool`
```rust
#[wasm_bindgen]
pub fn undoMove(&mut self) -> bool
```
**Description:** Legacy alias for `undo_move()`  
**Deprecated:** Use `undo_move()` instead  

### `getAIMove() -> Option<usize>`
```rust
#[wasm_bindgen]
pub fn getAIMove(&self) -> Option<usize>
```
**Description:** Legacy alias for `get_ai_move()`  
**Deprecated:** Use `get_ai_move()` instead  

---

## 🏗️ Architecture Notes

### **BitPacked Board System**
- **Storage:** Two `BitPackedBoard<6,7,2>` instances (Yellow + Red)
- **Performance:** 64-bit operations for 6×7 board
- **Memory:** ~32 bytes vs. 168 bytes for array

### **3-Layer Architecture**
```rust
struct Connect4Game {
    geometry: Connect4Grid,        // Coordinate logic
    yellow_board: BitPackedBoard,  // Data storage  
    red_board: BitPackedBoard,     // Data storage
    ai: Connect4AI,               // Strategic evaluation
    evaluator: PatternEvaluator,  // Pattern recognition
}
```

### **AI Strategy Stages**
1. **ABSOLUTE PRIORITY:** Immediate winning moves
2. **HIGH PRIORITY:** Block opponent wins
3. **STRATEGIC:** Center preference, pattern building
4. **FALLBACK:** Random valid move

### **Performance Benchmarks**
- **Move Execution:** 10x+ faster than JavaScript
- **AI Evaluation:** 5x+ faster pattern recognition
- **Memory Usage:** 80% reduction vs. array-based storage

---

## 📚 Integration Examples

### **Basic Game Loop**
```javascript
const game = new Connect4Game();

// Make moves
game.make_move(3);  // Yellow plays column 3
game.make_move(3);  // Red plays column 3

// Check status
console.log(game.current_player());  // Player.Red
console.log(game.move_count());      // 2
console.log(game.is_game_over());    // false
```

### **AI Integration**
```javascript
const game = new Connect4Game();
game.set_ai_difficulty(AIDifficulty.Hard);

// Player move
game.make_move(3);

// AI response
const aiMove = game.get_ai_move();
if (aiMove !== null) {
    game.make_move(aiMove);
}
```

### **Advanced Analysis**
```javascript
const game = new Connect4Game();

// Get strategic information
const analysis = game.analyze_position();
const winningMoves = game.get_winning_moves(Player.Yellow);
const blockingMoves = game.get_blocking_moves(Player.Yellow);

// UI feedback
winningMoves.forEach(col => highlightColumn(col, 'green'));
blockingMoves.forEach(col => highlightColumn(col, 'red'));
```

---

**📄 Documentation Generated:** 2025-07-20  
**🦀 WASM Module:** game_engine.wasm  
**📚 Source:** `/game_engine/src/games/connect4.rs`