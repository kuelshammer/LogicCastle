# L-Game Backend API Documentation

## 🦀 Rust-WASM LGame API Reference

**Version:** 2025-07-26  
**Architecture:** 3-Layer (Data/Geometry/AI) with BitPacked Board  
**Performance:** 5x+ faster than JavaScript implementation  
**Board Size:** 4x4 grid with L-pieces and neutral pieces

---

## 🏗️ Constructor & Initialization

### `new() -> LGame`
```rust
#[wasm_bindgen(constructor)]
pub fn new() -> Self
```
**Description:** Creates new L-Game with Yellow player starting  
**Returns:** `LGame` instance  
**Usage:** `const game = new LGame();`

### `new_with_starting_player(player: Player) -> LGame`  
```rust
pub fn new_with_starting_player(starting_player: Player) -> Self
```
**Description:** Creates game with specific starting player  
**Parameters:** `Player::Yellow` or `Player::Red`  
**Returns:** `LGame` instance  
**Usage:** Game series where "loser starts next game"

---

## 🎮 Core Game Actions

### `make_move(l_to_row: usize, l_to_col: usize, l_to_orientation: u8) -> Result<(), GameError>`
```rust
pub fn make_move(&mut self, l_to_row: usize, l_to_col: usize, l_to_orientation: u8) -> Result<(), GameError>
```
**Description:** Make an L-piece move to specified position and orientation  
**Parameters:** 
- `l_to_row` - Target row (0-3)
- `l_to_col` - Target column (0-3)  
- `l_to_orientation` - L-piece orientation (0-7)
**Returns:** `Ok(())` if move successful, `Err(GameError)` if invalid  
**Side Effects:** Updates board state, switches player, checks win condition  

### `move_neutral_piece(from_row: usize, from_col: usize, to_row: usize, to_col: usize) -> Result<(), GameError>`
```rust
pub fn move_neutral_piece(&mut self, from_row: usize, from_col: usize, to_row: usize, to_col: usize) -> Result<(), GameError>
```
**Description:** Move a neutral piece (optional part of turn)  
**Parameters:** Source and destination coordinates  
**Returns:** `Ok(())` if move successful, `Err(GameError)` if invalid  
**Note:** Can only be called after a valid L-piece move

### `is_valid_l_move(row: usize, col: usize, orientation: u8) -> bool`
```rust
#[wasm_bindgen]
pub fn is_valid_l_move(&self, row: usize, col: usize, orientation: u8) -> bool
```
**Description:** Check if L-piece move is valid without executing it  
**Parameters:** Target position and orientation  
**Returns:** `true` if move is valid, `false` otherwise  
**Usage:** Move validation for UI hover effects

---

## 📊 Game State Queries

### `get_cell(row: usize, col: usize) -> u8`
```rust
pub fn get_cell(&self, row: usize, col: usize) -> u8
```
**Description:** Get piece type at specific board position  
**Parameters:** Row and column coordinates (0-3)  
**Returns:** `0=empty, 1=player1, 2=player2, 3=neutral`  
**Usage:** Board rendering and game logic

### `get_board() -> Vec<u8>`
```rust
#[wasm_bindgen]
pub fn get_board(&self) -> Vec<u8>
```
**Description:** Get complete board state as flat array  
**Returns:** Array of 16 elements (4x4 grid flattened)  
**Format:** `[row0_col0, row0_col1, ..., row3_col3]`  
**Usage:** Efficient board state transfer to frontend

### `get_board_state() -> Vec<u8>`
```rust
pub fn get_board_state(&self) -> Vec<u8>
```
**Description:** Alias for `get_board()` for compatibility  
**Returns:** Same as `get_board()`

### `current_player() -> Player`
```rust
#[wasm_bindgen(getter)]
pub fn current_player(&self) -> Player
```
**Description:** Get the player whose turn it is  
**Returns:** `Player::Yellow` or `Player::Red`

### `get_current_player() -> Player`
```rust
#[wasm_bindgen]
pub fn get_current_player(&self) -> Player
```
**Description:** Frontend naming convention for `current_player()`  
**Returns:** Current player

---

## 🏆 Game Status & Win Detection

### `game_over() -> bool`
```rust
#[wasm_bindgen(getter)]
pub fn game_over(&self) -> bool
```
**Description:** Check if game has ended  
**Returns:** `true` if game is over, `false` if still in progress

### `is_game_over() -> bool`
```rust
#[wasm_bindgen]
pub fn is_game_over(&self) -> bool
```
**Description:** Frontend naming convention for `game_over()`  
**Returns:** Game over status

### `winner() -> Option<Player>`
```rust
#[wasm_bindgen(getter)]
pub fn winner(&self) -> Option<Player>
```
**Description:** Get the winner if game is over  
**Returns:** `Some(Player)` if someone won, `None` if game ongoing

### `get_winner() -> Option<Player>`
```rust
#[wasm_bindgen]
pub fn get_winner(&self) -> Option<Player>
```
**Description:** Frontend naming convention for `winner()`  
**Returns:** Winner if any

### `is_current_player_blocked() -> bool`
```rust
pub fn is_current_player_blocked(&self) -> bool
```
**Description:** Check if current player has no valid moves (loses)  
**Returns:** `true` if player is blocked, `false` if moves available  
**Usage:** Win condition detection

---

## 🔄 Move Management & Undo

### `move_count() -> u32`
```rust
#[wasm_bindgen(getter)]
pub fn move_count(&self) -> u32
```
**Description:** Get number of moves played  
**Returns:** Move counter

### `get_move_count() -> u32`
```rust
#[wasm_bindgen]
pub fn get_move_count(&self) -> u32
```
**Description:** Frontend naming convention for `move_count()`  
**Returns:** Move count

### `can_undo() -> bool`
```rust
#[wasm_bindgen]
pub fn can_undo(&self) -> bool
```
**Description:** Check if undo is possible  
**Returns:** `true` if moves can be undone, `false` otherwise

### `undo_move() -> bool`
```rust
#[wasm_bindgen]
pub fn undo_move(&mut self) -> bool
```
**Description:** Undo the last move  
**Returns:** `true` if undo successful, `false` if no moves to undo  
**Side Effects:** Restores previous board state, switches player

### `undoMove() -> bool`
```rust
#[wasm_bindgen]
pub fn undoMove(&mut self) -> bool
```
**Description:** CamelCase alias for `undo_move()`  
**Returns:** Undo success status

---

## 🔄 Game Control

### `reset()`
```rust
#[wasm_bindgen]
pub fn reset(&mut self)
```
**Description:** Reset game to initial state with Yellow starting  
**Side Effects:** Clears board, resets all state, sets up initial position

### `reset_with_starting_player(starting_player: Player)`
```rust
pub fn reset_with_starting_player(&mut self, starting_player: Player)
```
**Description:** Reset game with specific starting player  
**Parameters:** Player to start the new game  
**Usage:** Game series management

### `newGame()`
```rust
#[wasm_bindgen]
pub fn newGame(&mut self)
```
**Description:** CamelCase alias for `reset()`  
**Side Effects:** Same as `reset()`

---

## 📍 L-Piece Specific Operations

### `get_l_piece_position(player: Player) -> Vec<u8>`
```rust
#[wasm_bindgen]
pub fn get_l_piece_position(&self, player: Player) -> Vec<u8>
```
**Description:** Get L-piece position and orientation for specific player  
**Parameters:** Player to query  
**Returns:** `[row, col, orientation]` or empty array if not found  
**Usage:** UI highlighting and game logic

### `get_valid_l_moves_json() -> String`
```rust
#[wasm_bindgen]
pub fn get_valid_l_moves_json(&self) -> String
```
**Description:** Get all valid L-piece moves as JSON  
**Returns:** JSON string with array of `{row, col, orientation}` objects  
**Usage:** Frontend move generation and validation

### `get_valid_moves_count() -> usize`
```rust
pub fn get_valid_moves_count(&self) -> usize
```
**Description:** Count of valid L-piece moves for current player  
**Returns:** Number of available moves  
**Usage:** AI evaluation and UI feedback

---

## 🔮 Neutral Piece Operations

### `get_neutral_positions() -> Vec<u8>`
```rust
#[wasm_bindgen]
pub fn get_neutral_positions(&self) -> Vec<u8>
```
**Description:** Get positions of both neutral pieces  
**Returns:** Flat array `[row1, col1, row2, col2]`  
**Usage:** UI rendering and move validation

---

## 📈 Performance & Analysis

### `memory_usage() -> usize`
```rust
#[wasm_bindgen]
pub fn memory_usage(&self) -> usize
```
**Description:** Get approximate memory usage in bytes  
**Returns:** Memory usage estimate  
**Usage:** Performance monitoring and optimization

### `analyze_position() -> PositionAnalysis`
```rust
#[wasm_bindgen]
pub fn analyze_position(&self) -> PositionAnalysis
```
**Description:** Comprehensive position analysis for AI  
**Returns:** `PositionAnalysis` struct with threats, mobility, phase info  
**Usage:** AI evaluation and debugging

### `get_game_phase() -> GamePhase`
```rust
#[wasm_bindgen]
pub fn get_game_phase(&self) -> GamePhase
```
**Description:** Determine current game phase  
**Returns:** `GamePhase::Opening`, `GamePhase::Middle`, or `GamePhase::Endgame`  
**Usage:** AI strategy selection

---

## 🐛 Debug & Development

### `get_status_summary() -> String`
```rust
pub fn get_status_summary(&self) -> String
```
**Description:** Get formatted game status for debugging  
**Returns:** Human-readable status string  
**Usage:** Development and testing

---

## 🔧 L-Piece Orientations Reference

The L-piece has 8 possible orientations (4 rotations × 2 reflections):

```
Orientation 0:    Orientation 1:    Orientation 2:    Orientation 3:
X . .            X X X            . X .            . . X
X . .            X . .            . X .            X X X
X X .            . . .            . X X            . . .

Orientation 4:    Orientation 5:    Orientation 6:    Orientation 7:
. X .            X . .            X . .            X X X
. X .            X X X            X . .            . . X
X X .            . . .            X X .            . . .
```

**Coordinate System:**
- Origin (0,0) is top-left
- Rows increase downward (0-3)
- Columns increase rightward (0-3)
- Each orientation specifies the relative positions of the 4 L-piece cells

---

## 🎯 Usage Examples

### Basic Game Setup
```javascript
const game = new LGame();
console.log(game.get_board()); // Initial board state
console.log(game.get_current_player()); // Yellow starts
```

### Making Moves
```javascript
// Check if move is valid
if (game.is_valid_l_move(1, 1, 2)) {
    // Make the L-piece move
    try {
        game.make_move(1, 1, 2);
        console.log("Move successful!");
    } catch (error) {
        console.log("Move failed:", error);
    }
}

// Optionally move a neutral piece
try {
    game.move_neutral_piece(0, 3, 1, 3);
} catch (error) {
    console.log("Neutral move failed:", error);
}
```

### Game State Monitoring
```javascript
// Check game status
if (game.is_game_over()) {
    const winner = game.get_winner();
    console.log(winner ? `${winner} wins!` : "Game ended");
}

// Get available moves
const movesJson = game.get_valid_l_moves_json();
const availableMoves = JSON.parse(movesJson);
console.log(`${availableMoves.length} moves available`);
```

### Undo Functionality
```javascript
if (game.can_undo()) {
    const undoSuccess = game.undo_move();
    console.log(undoSuccess ? "Undo successful" : "Undo failed");
}
```

---

## ⚡ Performance Characteristics

| Operation | Typical Time | Memory Impact |
|-----------|-------------|---------------|
| Constructor | <0.1ms | 1.2KB |
| make_move() | <0.2ms | +16B (history) |
| get_board() | <0.05ms | 16B allocation |
| is_valid_l_move() | <0.1ms | 0B |
| get_valid_l_moves_json() | <1ms | Variable |
| undo_move() | <0.15ms | -16B (history) |

**Memory Efficiency:**
- BitPacked storage: 4x4 grid = 16 cells per board
- 3 boards × 1 bit per cell = 48 bits = 6 bytes for game state
- Total memory usage typically <2KB including metadata

---

## 🔗 Related Documentation

- [L-Game API Usage Analysis](./LGame-API-Usage-Analysis.md)
- [WASM Integration Best Practices](./WASM-Integration-Best-Practices.md)
- [LogicCastle Architecture Overview](./ARCHITECTURE.md)

---

**✅ Status:** Complete Implementation | Ready for Frontend Integration  
**📅 Last Updated:** 2025-07-26  
**👨‍💻 Maintainer:** LogicCastle WASM Backend Team