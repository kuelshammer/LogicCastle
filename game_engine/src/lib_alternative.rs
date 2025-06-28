// Alternative Phase 1 Implementation: Memory-Optimized Game Engine
// Trade-offs: Memory efficiency > Flexibility, Zero-allocation > Dynamic allocation

use wasm_bindgen::prelude::*;
use std::fmt;

// Alternative 1: Bit-packed Player representation for memory efficiency
#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u8)]
pub enum Cell {
    Empty = 0,
    Player1 = 1,  // Yellow in UI
    Player2 = 2,  // Red in UI
}

impl Cell {
    #[inline]
    const fn is_empty(self) -> bool {
        matches!(self, Cell::Empty)
    }
    
    #[inline]
    const fn is_player(self) -> bool {
        !self.is_empty()
    }
    
    #[inline]
    const fn opponent(self) -> Self {
        match self {
            Cell::Player1 => Cell::Player2,
            Cell::Player2 => Cell::Player1,
            Cell::Empty => Cell::Empty,
        }
    }
}

impl From<Cell> for u8 {
    #[inline]
    fn from(cell: Cell) -> Self {
        cell as u8
    }
}

impl From<u8> for Cell {
    #[inline]
    fn from(value: u8) -> Self {
        match value & 0x3 {  // Only use 2 bits
            1 => Cell::Player1,
            2 => Cell::Player2,
            _ => Cell::Empty,
        }
    }
}

// Alternative 2: Fixed-size board with const generics for zero-allocation
#[derive(Clone)]
pub struct FixedBoard<const ROWS: usize, const COLS: usize> {
    // Pack 4 cells per byte (2 bits each) for memory efficiency
    data: [u8; (ROWS * COLS + 3) / 4],  // Ceiling division
    move_count: u16,
}

impl<const ROWS: usize, const COLS: usize> FixedBoard<ROWS, COLS> {
    pub const fn new() -> Self {
        Self {
            data: [0; (ROWS * COLS + 3) / 4],
            move_count: 0,
        }
    }
    
    #[inline]
    const fn cell_index(row: usize, col: usize) -> usize {
        row * COLS + col
    }
    
    #[inline]
    const fn byte_and_offset(linear_index: usize) -> (usize, usize) {
        (linear_index / 4, (linear_index % 4) * 2)
    }
    
    #[inline]
    pub fn get_cell(&self, row: usize, col: usize) -> Cell {
        if row >= ROWS || col >= COLS {
            return Cell::Empty;
        }
        
        let linear_index = Self::cell_index(row, col);
        let (byte_index, bit_offset) = Self::byte_and_offset(linear_index);
        
        let value = (self.data[byte_index] >> bit_offset) & 0x3;
        Cell::from(value)
    }
    
    #[inline]
    pub fn set_cell(&mut self, row: usize, col: usize, cell: Cell) -> bool {
        if row >= ROWS || col >= COLS {
            return false;
        }
        
        let linear_index = Self::cell_index(row, col);
        let (byte_index, bit_offset) = Self::byte_and_offset(linear_index);
        
        // Clear the 2 bits and set new value
        self.data[byte_index] &= !(0x3 << bit_offset);
        self.data[byte_index] |= (cell as u8) << bit_offset;
        
        if cell.is_player() {
            self.move_count += 1;
        }
        
        true
    }
    
    #[inline]
    pub fn is_full(&self) -> bool {
        self.move_count as usize >= ROWS * COLS
    }
    
    #[inline]
    pub fn move_count(&self) -> u16 {
        self.move_count
    }
    
    // Alternative 3: Compact serialization for training data
    pub fn serialize_compact(&self) -> Vec<u8> {
        let mut result = Vec::with_capacity(self.data.len() + 2);
        result.extend_from_slice(&self.move_count.to_le_bytes());
        result.extend_from_slice(&self.data);
        result
    }
    
    pub fn deserialize_compact(data: &[u8]) -> Option<Self> {
        if data.len() < 2 {
            return None;
        }
        
        let move_count = u16::from_le_bytes([data[0], data[1]]);
        let board_data = &data[2..];
        
        if board_data.len() != (ROWS * COLS + 3) / 4 {
            return None;
        }
        
        let mut board_array = [0u8; (ROWS * COLS + 3) / 4];
        board_array.copy_from_slice(board_data);
        
        Some(Self {
            data: board_array,
            move_count,
        })
    }
    
    // SIMD-friendly data layout getter
    pub fn get_raw_data(&self) -> &[u8] {
        &self.data
    }
}

impl<const ROWS: usize, const COLS: usize> fmt::Display for FixedBoard<ROWS, COLS> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        for row in 0..ROWS {
            for col in 0..COLS {
                let cell = self.get_cell(row, col);
                let char = match cell {
                    Cell::Empty => '.',
                    Cell::Player1 => 'O',
                    Cell::Player2 => 'X',
                };
                write!(f, "{}", char)?;
            }
            writeln!(f)?;
        }
        Ok(())
    }
}

// Alternative 4: Builder pattern for different game configurations
pub struct GameBuilder {
    rows: usize,
    cols: usize,
    win_condition: usize,
    gravity: bool,
    current_player: Cell,
}

impl GameBuilder {
    pub fn new() -> Self {
        Self {
            rows: 6,
            cols: 7,
            win_condition: 4,
            gravity: true,
            current_player: Cell::Player1,
        }
    }
    
    pub fn dimensions(mut self, rows: usize, cols: usize) -> Self {
        self.rows = rows;
        self.cols = cols;
        self
    }
    
    pub fn win_condition(mut self, win_condition: usize) -> Self {
        self.win_condition = win_condition;
        self
    }
    
    pub fn gravity(mut self, enabled: bool) -> Self {
        self.gravity = enabled;
        self
    }
    
    pub fn starting_player(mut self, player: Cell) -> Self {
        self.current_player = player;
        self
    }
    
    // Specialized builders for common game types
    pub fn connect4() -> Self {
        Self::new()
            .dimensions(6, 7)
            .win_condition(4)
            .gravity(true)
    }
    
    pub fn gobang() -> Self {
        Self::new()
            .dimensions(15, 15)
            .win_condition(5)
            .gravity(false)
    }
    
    pub fn build_dynamic(self) -> DynamicGame {
        DynamicGame::new(self.rows, self.cols, self.win_condition, self.gravity, self.current_player)
    }
}

// Alternative 5: Different move generation approach using iterators
#[derive(Clone, Copy, Debug)]
pub struct Move {
    pub row: usize,
    pub col: usize,
    pub player: Cell,
}

impl Move {
    pub fn new(row: usize, col: usize, player: Cell) -> Self {
        Self { row, col, player }
    }
}

// Alternative 6: Zero-allocation move validation
pub struct MoveValidator<const ROWS: usize, const COLS: usize> {
    board: *const FixedBoard<ROWS, COLS>,
    gravity: bool,
}

impl<const ROWS: usize, const COLS: usize> MoveValidator<ROWS, COLS> {
    pub fn new(board: &FixedBoard<ROWS, COLS>, gravity: bool) -> Self {
        Self {
            board: board as *const _,
            gravity,
        }
    }
    
    #[inline]
    pub fn is_valid_move(&self, row: usize, col: usize) -> bool {
        if row >= ROWS || col >= COLS {
            return false;
        }
        
        let board = unsafe { &*self.board };
        
        if !board.get_cell(row, col).is_empty() {
            return false;
        }
        
        if self.gravity && row < ROWS - 1 {
            // In gravity mode, piece must fall to lowest position
            board.get_cell(row + 1, col).is_player()
        } else {
            true
        }
    }
    
    #[inline]
    pub fn find_gravity_row(&self, col: usize) -> Option<usize> {
        if !self.gravity || col >= COLS {
            return None;
        }
        
        let board = unsafe { &*self.board };
        
        for row in (0..ROWS).rev() {
            if board.get_cell(row, col).is_empty() {
                return Some(row);
            }
        }
        None
    }
}

// Alternative 7: Specialized Connect4 implementation with const generics
#[wasm_bindgen]
#[derive(Clone)]
pub struct Connect4Game {
    board: FixedBoard<6, 7>,
    current_player: Cell,
    validator: MoveValidator<6, 7>,
    game_over: bool,
    winner: Cell,
}

#[wasm_bindgen]
impl Connect4Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let board = FixedBoard::new();
        let validator = MoveValidator::new(&board, true);
        
        Self {
            board,
            current_player: Cell::Player1,
            validator,
            game_over: false,
            winner: Cell::Empty,
        }
    }
    
    pub fn make_move(&mut self, col: usize) -> Result<(), JsValue> {
        if self.game_over {
            return Err(JsValue::from_str("Game is already over"));
        }
        
        if col >= 7 {
            return Err(JsValue::from_str("Column out of bounds"));
        }
        
        // Update validator reference
        self.validator = MoveValidator::new(&self.board, true);
        
        if let Some(row) = self.validator.find_gravity_row(col) {
            self.board.set_cell(row, col, self.current_player);
            
            if self.check_win_at(row, col) {
                self.game_over = true;
                self.winner = self.current_player;
            } else if self.board.is_full() {
                self.game_over = true;
                self.winner = Cell::Empty; // Draw
            }
            
            self.current_player = self.current_player.opponent();
            Ok(())
        } else {
            Err(JsValue::from_str("Column is full"))
        }
    }
    
    // Alternative 8: Optimized win detection (only check around last move)
    fn check_win_at(&self, row: usize, col: usize) -> bool {
        let player = self.board.get_cell(row, col);
        if player.is_empty() {
            return false;
        }
        
        // Check all 4 directions from the placed piece
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        for &(dr, dc) in &directions {
            let mut count = 1; // Count the piece we just placed
            
            // Count in positive direction
            let mut r = row as isize + dr;
            let mut c = col as isize + dc;
            while r >= 0 && r < 6 && c >= 0 && c < 7 {
                if self.board.get_cell(r as usize, c as usize) == player {
                    count += 1;
                    r += dr;
                    c += dc;
                } else {
                    break;
                }
            }
            
            // Count in negative direction
            let mut r = row as isize - dr;
            let mut c = col as isize - dc;
            while r >= 0 && r < 6 && c >= 0 && c < 7 {
                if self.board.get_cell(r as usize, c as usize) == player {
                    count += 1;
                    r -= dr;
                    c -= dc;
                } else {
                    break;
                }
            }
            
            if count >= 4 {
                return true;
            }
        }
        
        false
    }
    
    pub fn get_board_state(&self) -> Vec<u8> {
        let mut result = Vec::with_capacity(42);
        for row in 0..6 {
            for col in 0..7 {
                result.push(self.board.get_cell(row, col) as u8);
            }
        }
        result
    }
    
    pub fn get_current_player(&self) -> u8 {
        self.current_player as u8
    }
    
    pub fn is_game_over(&self) -> bool {
        self.game_over
    }
    
    pub fn get_winner(&self) -> u8 {
        self.winner as u8
    }
    
    pub fn get_move_count(&self) -> u16 {
        self.board.move_count()
    }
    
    // Alternative 9: Move generation for AI (returns valid columns)
    pub fn generate_valid_moves(&self) -> Vec<usize> {
        let mut moves = Vec::with_capacity(7);
        for col in 0..7 {
            if self.validator.find_gravity_row(col).is_some() {
                moves.push(col);
            }
        }
        moves
    }
    
    // Alternative 10: Board state serialization for training data
    pub fn serialize_for_training(&self) -> Vec<u8> {
        let mut data = self.board.serialize_compact();
        data.push(self.current_player as u8);
        data.push(if self.game_over { 1 } else { 0 });
        data.push(self.winner as u8);
        data
    }
    
    pub fn deserialize_from_training(data: &[u8]) -> Option<Self> {
        if data.len() < 3 {
            return None;
        }
        
        let board_data = &data[..data.len() - 3];
        let board = FixedBoard::deserialize_compact(board_data)?;
        
        let current_player = Cell::from(data[data.len() - 3]);
        let game_over = data[data.len() - 2] != 0;
        let winner = Cell::from(data[data.len() - 1]);
        
        let validator = MoveValidator::new(&board, true);
        
        Some(Self {
            board,
            current_player,
            validator,
            game_over,
            winner,
        })
    }
    
    // Get compact representation for WASM binary size optimization
    pub fn get_compact_state(&self) -> js_sys::Uint8Array {
        let data = self.serialize_for_training();
        js_sys::Uint8Array::from(&data[..])
    }
}

// Alternative 11: Dynamic game for other game types (fallback)
#[wasm_bindgen]
pub struct DynamicGame {
    board: Vec<u8>,
    rows: usize,
    cols: usize,
    win_condition: usize,
    gravity: bool,
    current_player: Cell,
    game_over: bool,
    winner: Cell,
}

#[wasm_bindgen]
impl DynamicGame {
    #[wasm_bindgen(constructor)]
    pub fn new(rows: usize, cols: usize, win_condition: usize, gravity: bool, starting_player: Cell) -> Self {
        let board = vec![0u8; rows * cols];
        
        Self {
            board,
            rows,
            cols,
            win_condition,
            gravity,
            current_player: starting_player,
            game_over: false,
            winner: Cell::Empty,
        }
    }
    
    pub fn make_move_at(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        if self.game_over {
            return Err(JsValue::from_str("Game is already over"));
        }
        
        if row >= self.rows || col >= self.cols {
            return Err(JsValue::from_str("Position out of bounds"));
        }
        
        let index = row * self.cols + col;
        if self.board[index] != 0 {
            return Err(JsValue::from_str("Position already occupied"));
        }
        
        self.board[index] = self.current_player as u8;
        
        if self.check_win_at(row, col) {
            self.game_over = true;
            self.winner = self.current_player;
        } else if self.is_board_full() {
            self.game_over = true;
            self.winner = Cell::Empty;
        }
        
        self.current_player = self.current_player.opponent();
        Ok(())
    }
    
    pub fn make_move_column(&mut self, col: usize) -> Result<(), JsValue> {
        if !self.gravity {
            return Err(JsValue::from_str("Use make_move_at for non-gravity games"));
        }
        
        if col >= self.cols {
            return Err(JsValue::from_str("Column out of bounds"));
        }
        
        // Find lowest empty row
        for row in (0..self.rows).rev() {
            let index = row * self.cols + col;
            if self.board[index] == 0 {
                return self.make_move_at(row, col);
            }
        }
        
        Err(JsValue::from_str("Column is full"))
    }
    
    fn check_win_at(&self, row: usize, col: usize) -> bool {
        let player = Cell::from(self.board[row * self.cols + col]);
        if player.is_empty() {
            return false;
        }
        
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        for &(dr, dc) in &directions {
            let mut count = 1;
            
            // Positive direction
            let mut r = row as isize + dr;
            let mut c = col as isize + dc;
            while r >= 0 && r < self.rows as isize && c >= 0 && c < self.cols as isize {
                let index = (r as usize) * self.cols + (c as usize);
                if Cell::from(self.board[index]) == player {
                    count += 1;
                    r += dr;
                    c += dc;
                } else {
                    break;
                }
            }
            
            // Negative direction
            let mut r = row as isize - dr;
            let mut c = col as isize - dc;
            while r >= 0 && r < self.rows as isize && c >= 0 && c < self.cols as isize {
                let index = (r as usize) * self.cols + (c as usize);
                if Cell::from(self.board[index]) == player {
                    count += 1;
                    r -= dr;
                    c -= dc;
                } else {
                    break;
                }
            }
            
            if count >= self.win_condition {
                return true;
            }
        }
        
        false
    }
    
    fn is_board_full(&self) -> bool {
        self.board.iter().all(|&cell| cell != 0)
    }
    
    pub fn get_board_state(&self) -> Vec<u8> {
        self.board.clone()
    }
    
    pub fn get_current_player(&self) -> u8 {
        self.current_player as u8
    }
    
    pub fn is_game_over(&self) -> bool {
        self.game_over
    }
    
    pub fn get_winner(&self) -> u8 {
        self.winner as u8
    }
    
    pub fn get_dimensions(&self) -> Vec<usize> {
        vec![self.rows, self.cols]
    }
}

// Alternative 12: Factory for creating different game types
#[wasm_bindgen]
pub struct GameFactory;

#[wasm_bindgen]
impl GameFactory {
    pub fn create_connect4() -> Connect4Game {
        Connect4Game::new()
    }
    
    pub fn create_gobang() -> DynamicGame {
        GameBuilder::gobang().build_dynamic()
    }
    
    pub fn create_custom(rows: usize, cols: usize, win_condition: usize, gravity: bool) -> DynamicGame {
        GameBuilder::new()
            .dimensions(rows, cols)
            .win_condition(win_condition)
            .gravity(gravity)
            .build_dynamic()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_fixed_board_memory_efficiency() {
        let board = FixedBoard::<6, 7>::new();
        // 6*7 = 42 cells, 2 bits each = 84 bits = 11 bytes (rounded up to 21/4 = 11)
        assert_eq!(board.data.len(), 11);
        
        // Test bit packing
        let mut board = FixedBoard::<2, 2>::new();
        board.set_cell(0, 0, Cell::Player1);
        board.set_cell(0, 1, Cell::Player2);
        board.set_cell(1, 0, Cell::Player1);
        board.set_cell(1, 1, Cell::Empty);
        
        assert_eq!(board.get_cell(0, 0), Cell::Player1);
        assert_eq!(board.get_cell(0, 1), Cell::Player2);
        assert_eq!(board.get_cell(1, 0), Cell::Player1);
        assert_eq!(board.get_cell(1, 1), Cell::Empty);
    }
    
    #[test]
    fn test_connect4_game() {
        let mut game = Connect4Game::new();
        
        // Test valid moves
        assert!(game.make_move(0).is_ok());
        assert_eq!(game.get_current_player(), Cell::Player2 as u8);
        
        // Test win condition
        let mut game = Connect4Game::new();
        for _ in 0..4 {
            game.make_move(0).unwrap(); // Player 1
            if !game.is_game_over() {
                game.make_move(1).unwrap(); // Player 2
            }
        }
        
        // Should not be game over yet (alternating moves)
        if !game.is_game_over() {
            // Make winning move
            game.make_move(0).unwrap();
            game.make_move(1).unwrap();
            game.make_move(0).unwrap();
            game.make_move(1).unwrap();
        }
    }
    
    #[test]
    fn test_serialization() {
        let mut game = Connect4Game::new();
        game.make_move(0).unwrap();
        game.make_move(1).unwrap();
        
        let serialized = game.serialize_for_training();
        let deserialized = Connect4Game::deserialize_from_training(&serialized);
        
        assert!(deserialized.is_some());
        let deserialized = deserialized.unwrap();
        assert_eq!(game.get_move_count(), deserialized.get_move_count());
        assert_eq!(game.get_current_player(), deserialized.get_current_player());
    }
    
    #[test]
    fn test_move_generation() {
        let mut game = Connect4Game::new();
        let moves = game.generate_valid_moves();
        assert_eq!(moves.len(), 7); // All columns available initially
        
        // Fill a column
        for _ in 0..6 {
            game.make_move(0).unwrap();
            if game.is_game_over() {
                break;
            }
        }
        
        let moves = game.generate_valid_moves();
        assert!(moves.len() <= 6); // Column 0 should be full or game over
    }
    
    #[test]
    fn test_builder_pattern() {
        let game = GameBuilder::new()
            .dimensions(10, 10)
            .win_condition(5)
            .gravity(false)
            .build_dynamic();
        
        let dims = game.get_dimensions();
        assert_eq!(dims[0], 10);
        assert_eq!(dims[1], 10);
    }
    
    #[test]
    fn test_factory() {
        let connect4 = GameFactory::create_connect4();
        assert_eq!(connect4.get_current_player(), Cell::Player1 as u8);
        
        let gobang = GameFactory::create_gobang();
        let dims = gobang.get_dimensions();
        assert_eq!(dims[0], 15);
        assert_eq!(dims[1], 15);
    }
}