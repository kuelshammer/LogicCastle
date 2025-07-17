use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;
use rand::seq::IteratorRandom;
use rand::Rng;
use rand::thread_rng;

// Three-Layer Architecture modules
pub mod data;
pub mod geometry;
pub mod games;
pub mod ai;

// Re-export key types for public API
pub use geometry::{BoardGeometry, PatternProvider, QuadraticGrid, Connect4Grid, GomokuGrid, HexGrid, StandardHexGrid, HexEdge};
pub use games::{Connect4Game, GomokuGame, LGame, TrioGame};
pub use ai::{Connect4AI, GomokuAI, PatternEvaluator};

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
#[cfg(feature = "web_sys")]
macro_rules! console_log {
    ($($t:tt)*) => {
        web_sys::console::log_1(&format_args!($($t)*).to_string().into());
    }
}

// When the `console_error_panic_hook` feature is enabled, we can call the
// `set_panic_hook` function at least once during initialization, and then
// we will get better error messages if our code ever panics.
//
// For more details see
// https://github.com/rustwasm/console_error_panic_hook#readme
#[cfg(feature = "console_error_panic_hook")]
extern crate console_error_panic_hook;

#[wasm_bindgen(start)]
pub fn main() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    
    #[cfg(feature = "web_sys")]
    console_log!("🦀 WASM Game Engine initialized with debug support!");
}

/// Game phase enumeration for strategic evaluation
#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum GamePhase {
    Opening,
    Middle,
    Endgame,
}

/// Position analysis structure for AI decision making
#[wasm_bindgen]
pub struct PositionAnalysis {
    pub current_player_threats: usize,
    pub opponent_threats: usize,
    pub total_pieces: usize,
    pub connectivity_score: i32,
    pub game_phase: GamePhase,
    pub evaluation_score: i32,
}

#[wasm_bindgen]
impl PositionAnalysis {
    #[wasm_bindgen(getter)]
    pub fn get_current_player_threats(&self) -> usize { self.current_player_threats }
    
    #[wasm_bindgen(getter)]
    pub fn get_opponent_threats(&self) -> usize { self.opponent_threats }
    
    #[wasm_bindgen(getter)]
    pub fn get_total_pieces(&self) -> usize { self.total_pieces }
    
    #[wasm_bindgen(getter)]
    pub fn get_connectivity_score(&self) -> i32 { self.connectivity_score }
    
    #[wasm_bindgen(getter)]
    pub fn get_game_phase(&self) -> GamePhase { self.game_phase }
    
    #[wasm_bindgen(getter)]
    pub fn get_evaluation_score(&self) -> i32 { self.evaluation_score }
    
    /// Get threat advantage (positive = current player has more threats)
    pub fn threat_advantage(&self) -> i32 {
        self.current_player_threats as i32 - self.opponent_threats as i32
    }
    
    /// Check if position is tactically critical
    pub fn is_critical(&self) -> bool {
        self.current_player_threats > 0 || self.opponent_threats > 0
    }
    
    /// Get position summary as string for debugging
    pub fn summary(&self) -> String {
        format!(
            "Phase: {:?}, Threats: {}/{}, Pieces: {}, Score: {}, Critical: {}",
            self.game_phase,
            self.current_player_threats,
            self.opponent_threats,
            self.total_pieces,
            self.evaluation_score,
            self.is_critical()
        )
    }
}
// Custom error types for robust error handling instead of String errors
#[derive(Debug, Clone)]
#[wasm_bindgen]
pub enum GameError {
    OutOfBounds,
    PositionOccupied, 
    GameAlreadyOver,
    InvalidPlayer,
    BoardError,
    InvalidMove,
}

impl std::fmt::Display for GameError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            GameError::OutOfBounds => write!(f, "Position out of bounds"),
            GameError::PositionOccupied => write!(f, "Position already occupied"),
            GameError::GameAlreadyOver => write!(f, "Game is already over"),
            GameError::InvalidPlayer => write!(f, "Invalid player"),
            GameError::BoardError => write!(f, "Board operation failed"),
            GameError::InvalidMove => write!(f, "Invalid move"),
        }
    }
}

impl std::error::Error for GameError {}

impl From<GameError> for String {
    fn from(error: GameError) -> Self {
        error.to_string()
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq, Debug)] // Added Debug trait
pub enum Player {
    Yellow = 1, // Assign integer values for easier conversion
    Red = 2,
    Black = 3,  // For Gomoku/Gobang
    White = 4,  // For Gomoku/Gobang
}

impl Player {
    /// Get the opponent player - essential for AI algorithms
    pub fn opponent(self) -> Self {
        match self {
            Player::Yellow => Player::Red,
            Player::Red => Player::Yellow,
            Player::Black => Player::White,
            Player::White => Player::Black,
        }
    }
}

impl From<Player> for i8 {
    fn from(player: Player) -> Self {
        match player {
            Player::Yellow => 1,
            Player::Red => 2,
            Player::Black => 3,
            Player::White => 4,
        }
    }
}

impl TryFrom<i8> for Player {
    type Error = String; // Changed from JsValue to String
    fn try_from(value: i8) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Player::Yellow),
            2 => Ok(Player::Red),
            3 => Ok(Player::Black),
            4 => Ok(Player::White),
            _ => Err("Invalid player value".to_string()), // Convert to String
        }
    }
}

// New Board structure
#[wasm_bindgen]
pub struct Board {
    rows: usize,
    cols: usize,
    cells: Vec<i8>, // Renamed from 'board' to 'cells' for clarity
}

#[wasm_bindgen]
impl Board {
    #[wasm_bindgen(constructor)]
    pub fn new(rows: usize, cols: usize) -> Self {
        let board_size = rows * cols;
        let cells = vec![0; board_size]; // 0 for empty
        Board { rows, cols, cells }
    }

    pub fn get_rows(&self) -> usize {
        self.rows
    }

    pub fn get_cols(&self) -> usize {
        self.cols
    }

    pub fn get_cells(&self) -> Vec<i8> {
        self.cells.clone()
    }

    pub fn get_cell(&self, row: usize, col: usize) -> Result<i8, GameError> {
        if row >= self.rows || col >= self.cols {
            return Err(GameError::OutOfBounds);
        }
        let index = row * self.cols + col;
        Ok(self.cells[index])
    }

    pub fn set_cell(&mut self, row: usize, col: usize, value: i8) -> Result<(), GameError> {
        if row >= self.rows || col >= self.cols {
            return Err(GameError::OutOfBounds);
        }
        let index = row * self.cols + col;
        self.cells[index] = value;
        Ok(())
    }

    pub fn is_within_bounds(&self, row: isize, col: isize) -> bool {
        row >= 0 && row < (self.rows as isize) && col >= 0 && col < (self.cols as isize)
    }

    pub fn is_full(&self) -> bool {
        self.cells.iter().all(|&cell| cell != 0)
    }
    
    /// Check if a column is full (Connect4) - memory efficient check
    pub fn is_column_full(&self, col: usize) -> bool {
        if col >= self.cols {
            return true;
        }
        self.get_cell(0, col).unwrap_or(1) != 0
    }
    
    /// Get column height (Connect4) - essential for AI move generation
    pub fn column_height(&self, col: usize) -> usize {
        if col >= self.cols {
            return self.rows;
        }
        
        for row in 0..self.rows {
            if self.get_cell(row, col).unwrap_or(1) == 0 {
                return row;
            }
        }
        self.rows
    }
    
    /// Fast clone for AI simulations - reuses memory layout
    pub fn fast_clone(&self) -> Board {
        Board {
            rows: self.rows,
            cols: self.cols,
            cells: self.cells.clone(),
        }
    }

    /// Check if a specific column has available space (for Connect4)
    pub fn is_column_available(&self, col: usize) -> bool {
        if col >= self.cols {
            return false;
        }
        self.get_cell(0, col).unwrap_or(1) == 0
    }

    /// Get the row where a piece would land in a column (for Connect4)
    pub fn get_drop_row(&self, col: usize) -> Option<usize> {
        if col >= self.cols {
            return None;
        }
        (0..self.rows).rev().find(|&row| self.get_cell(row, col).unwrap_or(1) == 0)
    }
}

#[wasm_bindgen]
pub struct Game {
    board: Board, // Use the new Board structure
    win_condition: usize,
    gravity_enabled: bool,
    current_player: Player,
    starting_player: Player, // Track who should start the game
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new(rows: usize, cols: usize, win_condition: usize, gravity_enabled: bool) -> Self {
        let board = Board::new(rows, cols);
        Game {
            board,
            win_condition,
            gravity_enabled,
            current_player: Player::Yellow, // Yellow starts by default
            starting_player: Player::Yellow, // Default starter
        }
    }

    // This function will be exposed to JS, so we need to convert the String error to JsValue
    pub fn make_move_connect4_js(&mut self, col: usize) -> Result<(), JsValue> {
        self._make_move_connect4(col).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn make_move_gobang_js(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        self._make_move_gobang(row, col).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    // Internal make_move for Connect4 that returns a GameError
    fn _make_move_connect4(&mut self, col: usize) -> Result<(), GameError> {
        if col >= self.board.cols {
            return Err(GameError::OutOfBounds);
        }

        if self.gravity_enabled {
            // Find the lowest empty spot in the column
            for row in (0..self.board.rows).rev() {
                match self.board.get_cell(row, col) {
                    Ok(0) => { // Check if empty (0)
                        self.board.set_cell(row, col, self.current_player.into())?;
                        self.current_player = match self.current_player {
                            Player::Yellow => Player::Red,
                            Player::Red => Player::Yellow,
                            Player::Black => Player::White,
                            Player::White => Player::Black,
                        };
                        return Ok(());
                    },
                    Ok(_) => continue, // Cell is occupied, try next row
                    Err(e) => return Err(e)
                }
            }
            Err(GameError::InvalidMove) // Column is full
        } else {
            Err(GameError::InvalidMove) // Gravity disabled
        }
    }

    // Internal make_move for Gobang that returns a GameError
    fn _make_move_gobang(&mut self, row: usize, col: usize) -> Result<(), GameError> {
        if !self.board.is_within_bounds(row as isize, col as isize) {
            return Err(GameError::OutOfBounds);
        }

        match self.board.get_cell(row, col) {
            Ok(0) => {}, // Empty cell, continue
            Ok(_) => return Err(GameError::PositionOccupied),
            Err(e) => return Err(e)
        }

        // Gobang Rule: Second stone of starting player cannot touch first stone
        let total_pieces = self.count_total_pieces();
        if total_pieces == 1 && self.current_player == self.starting_player {
            if let Some((first_row, first_col)) = self.find_first_stone() {
                if self.is_adjacent(row, col, first_row, first_col) {
                    return Err(GameError::InvalidMove);
                }
            }
        }

        // Place the stone
        self.board.set_cell(row, col, self.current_player.into())?;
        self.current_player = match self.current_player {
            Player::Yellow => Player::Red,
            Player::Red => Player::Yellow,
            Player::Black => Player::White,
            Player::White => Player::Black,
        };
        Ok(())
    }

    /// Find the position of the first stone placed (for Gobang adjacency rule)
    fn find_first_stone(&self) -> Option<(usize, usize)> {
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                match self.board.get_cell(row, col) {
                    Ok(value) if value != 0 => return Some((row, col)),
                    Ok(_) => continue, // Empty cell
                    Err(_) => continue // Skip invalid cells
                }
            }
        }
        None
    }

    /// Check if two positions are adjacent (8-directional)
    fn is_adjacent(&self, row1: usize, col1: usize, row2: usize, col2: usize) -> bool {
        let row_diff = (row1 as i32 - row2 as i32).abs();
        let col_diff = (col1 as i32 - col2 as i32).abs();
        row_diff <= 1 && col_diff <= 1 && (row_diff != 0 || col_diff != 0)
    }
        

    pub fn check_win(&self) -> Option<Player> {
        self._check_win_internal()
    }

    // Internal function to check for a win condition
    fn _check_win_internal(&self) -> Option<Player> {
        // Check horizontal wins
        for r in 0..self.board.rows {
            for c in 0..=(self.board.cols - self.win_condition) {
                if let Ok(cell_value) = self.board.get_cell(r, c) {
                    if cell_value != 0 {
                        if let Ok(player_at_cell) = Player::try_from(cell_value) {
                            if let Some(player) = self._check_direction(r, c, 0, 1, player_at_cell) {
                                return Some(player);
                            }
                        }
                    }
                }
            }
        }

        // Check vertical wins
        for r in 0..=(self.board.rows - self.win_condition) {
            for c in 0..self.board.cols {
                if let Ok(cell_value) = self.board.get_cell(r, c) {
                    if cell_value != 0 {
                        if let Ok(player_at_cell) = Player::try_from(cell_value) {
                            if let Some(player) = self._check_direction(r, c, 1, 0, player_at_cell) {
                                return Some(player);
                            }
                        }
                    }
                }
            }
        }

        // Check diagonal wins (top-left to bottom-right)
        for r in 0..=(self.board.rows - self.win_condition) {
            for c in 0..=(self.board.cols - self.win_condition) {
                if let Ok(cell_value) = self.board.get_cell(r, c) {
                    if cell_value != 0 {
                        if let Ok(player_at_cell) = Player::try_from(cell_value) {
                            if let Some(player) = self._check_direction(r, c, 1, 1, player_at_cell) {
                                return Some(player);
                            }
                        }
                    }
                }
            }
        }

        // Check diagonal wins (top-right to bottom-left)
        for r in 0..=(self.board.rows - self.win_condition) {
            for c in (self.win_condition - 1)..self.board.cols {
                if let Ok(cell_value) = self.board.get_cell(r, c) {
                    if cell_value != 0 {
                        if let Ok(player_at_cell) = Player::try_from(cell_value) {
                            if let Some(player) = self._check_direction(r, c, 1, -1, player_at_cell) {
                                return Some(player);
                            }
                        }
                    }
                }
            }
        }

        None
    }

    // Helper function to check a line in a specific direction for a given player
    fn _check_direction(&self, start_row: usize, start_col: usize, dr: isize, dc: isize, player_to_check: Player) -> Option<Player> {
        for i in 0..self.win_condition {
            let r = (start_row as isize) + dr * (i as isize);
            let c = (start_col as isize) + dc * (i as isize);

            if !self.board.is_within_bounds(r, c) {
                return None; // Out of bounds
            }

            let cell_value = match self.board.get_cell(r as usize, c as usize) {
                Ok(value) => value,
                Err(_) => return None // Failed to get cell
            };

            match Player::try_from(cell_value) {
                Ok(player) if player == player_to_check => continue,
                _ => return None // Empty cell, invalid player, or different player
            }
        }
        Some(player_to_check) // Win condition met for this player
    }

    pub fn is_game_over(&self) -> bool {
        self.check_win().is_some() || self.board.is_full()
    }

    pub fn get_board(&self) -> Vec<i8> { // Return Vec<i8>
        self.board.get_cells()
    }

    pub fn get_current_player(&self) -> Player {
        self.current_player
    }

    /// Get the starting player for this game
    pub fn get_starting_player(&self) -> Player {
        self.starting_player
    }

    /// Set the starting player (for rotation logic)
    pub fn set_starting_player(&mut self, player: Player) {
        self.starting_player = player;
    }

    /// Reset game to starting state with optional new starting player
    pub fn reset_game(&mut self) {
        self.board = Board::new(self.board.rows, self.board.cols);
        self.current_player = self.starting_player;
    }

    /// Reset game with a specific starting player
    pub fn reset_game_with_starter(&mut self, starter: Player) {
        self.set_starting_player(starter);
        self.reset_game();
    }
    
    /// Fast clone for AI simulations - essential for minimax/MCTS
    pub fn fast_clone(&self) -> Game {
        Game {
            board: self.board.fast_clone(),
            win_condition: self.win_condition,
            gravity_enabled: self.gravity_enabled,
            current_player: self.current_player,
            starting_player: self.starting_player,
        }
    }
    
    /// Get legal moves for Connect4 (WASM-friendly, memory efficient)
    pub fn get_legal_moves_connect4(&self) -> Vec<usize> {
        if !self.gravity_enabled {
            return Vec::new();
        }
        
        let mut moves = Vec::with_capacity(self.board.cols);
        for col in 0..self.board.cols {
            if !self.board.is_column_full(col) {
                moves.push(col);
            }
        }
        moves
    }
    
    /// Count legal moves efficiently (for quick AI evaluation)
    pub fn legal_move_count_connect4(&self) -> usize {
        if !self.gravity_enabled {
            return 0;
        }
        
        (0..self.board.cols)
            .filter(|&col| !self.board.is_column_full(col))
            .count()
    }
    
    /// Simulate a move efficiently (for AI tree search)
    pub fn simulate_move_connect4(&self, col: usize) -> Result<Game, String> {
        let mut cloned = self.fast_clone();
        cloned._make_move_connect4(col)?;
        Ok(cloned)
    }
    
    /// Simulate a move efficiently (WASM-compatible version)
    #[wasm_bindgen]
    pub fn simulate_move_connect4_js(&self, col: usize) -> Option<Game> {
        self.simulate_move_connect4(col).ok()
    }
    
    /// Check if game is in terminal state (win/draw)
    pub fn is_terminal(&self) -> bool {
        self.check_win().is_some() || self.board.is_full()
    }
    
    /// Advanced position evaluation with strategic scoring
    /// Returns: +10000 for current player win, -10000 for opponent win, strategic score otherwise
    pub fn evaluate_position(&self) -> i32 {
        self.evaluate_position_advanced()
    }
    
    /// Simple evaluation for backward compatibility
    pub fn evaluate_position_simple(&self) -> i32 {
        match self.check_win() {
            Some(winner) => {
                if winner == self.current_player {
                    1000  // Current player wins
                } else {
                    -1000 // Opponent wins
                }
            }
            None => {
                if self.board.is_full() {
                    0  // Draw
                } else {
                    // Simple material evaluation
                    let mut score = 0;
                    for &cell in &self.board.cells {
                        match cell {
                            1 if self.current_player == Player::Yellow => score += 1,
                            1 => score -= 1,
                            2 if self.current_player == Player::Red => score += 1,
                            2 => score -= 1,
                            _ => {}
                        }
                    }
                    score
                }
            }
        }
    }
    
    /// Advanced evaluation combining multiple strategic factors
    pub fn evaluate_position_advanced(&self) -> i32 {
        // Terminal position evaluation
        match self.check_win() {
            Some(winner) => {
                return if winner == self.current_player {
                    10000  // Current player wins
                } else {
                    -10000 // Opponent wins
                }
            }
            None => {
                if self.board.is_full() {
                    return 0;  // Draw
                }
            }
        }
        
        let mut total_score = 0;
        
        // 1. Threat Analysis (immediate winning/blocking opportunities)
        total_score += self.evaluate_threats();
        
        // 2. Strategic Pattern Analysis
        total_score += self.evaluate_patterns();
        
        // 3. Positional Control (center control, board structure)
        total_score += self.evaluate_positional();
        
        // 4. Game Phase Considerations
        total_score += self.evaluate_game_phase();
        
        total_score
    }
    
    /// Count immediate threats for a player (winning moves available)
    pub fn count_threats(&self, player: Player) -> usize {
        let player_val = player as i8;
        let mut threats = 0;
        
        for col in 0..self.board.cols {
            if !self.board.is_column_full(col) {
                let drop_row = self.board.column_height(col);
                if drop_row < self.board.rows && self.would_win_at(drop_row, col, player_val) {
                    threats += 1;
                }
            }
        }
        threats
    }
    
    /// Check if placing a piece at position would create a win (helper)
    fn would_win_at(&self, row: usize, col: usize, player_val: i8) -> bool {
        // Check horizontal
        let mut count = 1;
        // Check left
        for c in (0..col).rev() {
            if self.board.get_cell(row, c).unwrap_or(0) == player_val {
                count += 1;
            } else {
                break;
            }
        }
        // Check right  
        for c in (col + 1)..self.board.cols {
            if self.board.get_cell(row, c).unwrap_or(0) == player_val {
                count += 1;
            } else {
                break;
            }
        }
        if count >= self.win_condition {
            return true;
        }
        
        // Check vertical (only downward for Connect4)
        count = 1;
        for r in (row + 1)..self.board.rows {
            if self.board.get_cell(r, col).unwrap_or(0) == player_val {
                count += 1;
            } else {
                break;
            }
        }
        if count >= self.win_condition {
            return true;
        }
        
        // Check diagonal (top-left to bottom-right)
        count = 1;
        let mut r = row;
        let mut c = col;
        while r > 0 && c > 0 {
            r -= 1;
            c -= 1;
            if self.board.get_cell(r, c).unwrap_or(0) == player_val {
                count += 1;
            } else {
                break;
            }
        }
        r = row;
        c = col;
        while r + 1 < self.board.rows && c + 1 < self.board.cols {
            r += 1;
            c += 1;
            if self.board.get_cell(r, c).unwrap_or(0) == player_val {
                count += 1;
            } else {
                break;
            }
        }
        if count >= self.win_condition {
            return true;
        }
        
        // Check diagonal (top-right to bottom-left)
        count = 1;
        r = row;
        c = col;
        while r > 0 && c + 1 < self.board.cols {
            r -= 1;
            c += 1;
            if self.board.get_cell(r, c).unwrap_or(0) == player_val {
                count += 1;
            } else {
                break;
            }
        }
        r = row;
        c = col;
        while r + 1 < self.board.rows && c > 0 {
            r += 1;
            c -= 1;
            if self.board.get_cell(r, c).unwrap_or(0) == player_val {
                count += 1;
            } else {
                break;
            }
        }
        if count >= self.win_condition {
            return true;
        }
        
        false
    }

    /// Get legal moves for Gobang (returns available positions as (row, col) tuples)
    /// Returns a flattened vector where each pair of consecutive elements represents (row, col)
    pub fn get_legal_moves_gobang(&self) -> Vec<usize> {
        if self.gravity_enabled {
            return Vec::new(); // Gobang doesn't use gravity
        }
        
        let mut legal_moves = Vec::new();
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                    legal_moves.push(row);
                    legal_moves.push(col);
                }
            }
        }
        legal_moves
    }

    /// Simulate a Gobang move without mutating the current game state
    pub fn simulate_move_gobang(&self, row: usize, col: usize) -> Result<Game, String> {
        let mut cloned_game = self.fast_clone();
        cloned_game._make_move_gobang(row, col)?;
        Ok(cloned_game)
    }

    /// Get the winner if the game is over, None if it's a draw or ongoing
    pub fn get_winner(&self) -> Option<Player> {
        self.check_win()
    }
    
    // PHASE 2: ADVANCED EVALUATION FUNCTIONS
    
    /// Evaluate immediate threats and defensive needs
    fn evaluate_threats(&self) -> i32 {
        let mut score = 0;
        let current_val = self.current_player as i8;
        let opponent_val = self.current_player.opponent() as i8;
        
        // Weight immediate threats heavily
        let winning_moves = self.count_winning_moves(current_val);
        let blocking_needed = self.count_winning_moves(opponent_val);
        
        // Multiple winning moves = very strong position
        score += winning_moves as i32 * 500;
        
        // Need to block opponent threats
        score -= blocking_needed as i32 * 400;
        
        // Penalize positions where opponent has more threats
        if blocking_needed > winning_moves {
            score -= 200;
        }
        
        score
    }
    
    /// Count winning moves available for a player
    fn count_winning_moves(&self, player_val: i8) -> usize {
        let mut winning_moves = 0;
        
        if self.gravity_enabled {
            // Connect4-style: check each column
            for col in 0..self.board.cols {
                if let Some(row) = self.board.get_drop_row(col) {
                    if self.would_win_at(row, col, player_val) {
                        winning_moves += 1;
                    }
                }
            }
        } else {
            // Gobang-style: check all empty positions
            for row in 0..self.board.rows {
                for col in 0..self.board.cols {
                    if self.board.get_cell(row, col).unwrap_or(1) == 0 && self.would_win_at(row, col, player_val) {
                        winning_moves += 1;
                    }
                }
            }
        }
        
        winning_moves
    }
    
    /// Evaluate strategic patterns (sequences close to winning)
    fn evaluate_patterns(&self) -> i32 {
        let mut score = 0;
        let current_val = self.current_player as i8;
        let opponent_val = self.current_player.opponent() as i8;
        
        // Evaluate all directions for pattern strength
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                for &(dr, dc) in &directions {
                    // Evaluate pattern strength for current player
                    score += self.evaluate_line_pattern(row, col, dr, dc, current_val);
                    // Subtract opponent's pattern strength
                    score -= self.evaluate_line_pattern(row, col, dr, dc, opponent_val);
                }
            }
        }
        
        score
    }
    
    /// Evaluate a single line pattern for strategic value
    fn evaluate_line_pattern(&self, start_row: usize, start_col: usize, dr: isize, dc: isize, player_val: i8) -> i32 {
        let mut player_count = 0;
        let mut empty_count = 0;
        let mut blocked = false;
        
        // Check a line segment of win_condition length
        for i in 0..self.win_condition {
            let r = start_row as isize + dr * i as isize;
            let c = start_col as isize + dc * i as isize;
            
            if !self.board.is_within_bounds(r, c) {
                blocked = true;
                break;
            }
            
            let cell_val = self.board.get_cell(r as usize, c as usize).unwrap_or(0);
            
            if cell_val == player_val {
                player_count += 1;
            } else if cell_val == 0 {
                empty_count += 1;
            } else {
                blocked = true;
                break;
            }
        }
        
        // Score based on pattern strength
        if blocked || empty_count == 0 {
            return 0;
        }
        
        match player_count {
            0 => 0,  // No pieces in line
            1 => if empty_count == self.win_condition - 1 { 10 } else { 0 },  // Single piece with room
            2 => if empty_count >= self.win_condition - 2 { 50 } else { 0 },   // Two pieces
            3 => if empty_count >= self.win_condition - 3 { 200 } else { 0 },  // Three pieces - strong
            _ => 0,  // Should not happen in valid patterns
        }
    }
    
    /// Evaluate positional factors (center control, structure)
    fn evaluate_positional(&self) -> i32 {
        let mut score = 0;
        let current_val = self.current_player as i8;
        let opponent_val = self.current_player.opponent() as i8;
        
        let center_col = self.board.cols / 2;
        let center_row = self.board.rows / 2;
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                let cell_val = self.board.get_cell(row, col).unwrap_or(0);
                
                if cell_val != 0 {
                    let position_value = self.calculate_position_value(row, col, center_row, center_col);
                    
                    if cell_val == current_val {
                        score += position_value;
                    } else if cell_val == opponent_val {
                        score -= position_value;
                    }
                }
            }
        }
        
        score
    }
    
    /// Calculate positional value of a square
    fn calculate_position_value(&self, row: usize, col: usize, center_row: usize, center_col: usize) -> i32 {
        // Distance from center (closer = better)
        let row_dist = (row as isize - center_row as isize).unsigned_abs();
        let col_dist = (col as isize - center_col as isize).unsigned_abs();
        let total_dist = row_dist + col_dist;
        
        // Base positional value (center is worth more)
        let base_value = match total_dist {
            0 => 20,      // Center
            1 => 15,      // Near center
            2 => 10,      // Moderate distance
            3 => 5,       // Further out
            _ => 2,       // Edge positions
        };
        
        // Connect4 specific: bottom rows more valuable due to gravity
        let gravity_bonus = if self.gravity_enabled {
            let from_bottom = self.board.rows - 1 - row;
            match from_bottom {
                0 => 5,   // Bottom row
                1 => 3,   // Second from bottom
                2 => 1,   // Third from bottom
                _ => 0,   // Upper rows
            }
        } else {
            0
        };
        
        base_value + gravity_bonus
    }
    
    /// Evaluate game phase considerations
    fn evaluate_game_phase(&self) -> i32 {
        let total_pieces = self.count_total_pieces();
        let board_size = self.board.rows * self.board.cols;
        let fill_ratio = total_pieces as f32 / board_size as f32;
        
        match fill_ratio {
            r if r < 0.25 => self.evaluate_opening_phase(),
            r if r < 0.75 => self.evaluate_middle_phase(),
            _ => self.evaluate_endgame_phase()
        }
    }
    
    /// Count total pieces on board
    fn count_total_pieces(&self) -> usize {
        self.board.cells.iter().filter(|&&cell| cell != 0).count()
    }
    
    /// Opening phase evaluation (focus on center control)
    fn evaluate_opening_phase(&self) -> i32 {
        let mut score = 0;
        let current_val = self.current_player as i8;
        let center_col = self.board.cols / 2;
        
        // Bonus for center column control in opening
        if self.gravity_enabled {
            let mut center_pieces = 0;
            for row in 0..self.board.rows {
                if self.board.get_cell(row, center_col).unwrap_or(0) == current_val {
                    center_pieces += 1;
                }
            }
            score += center_pieces * 15;
        }
        
        // Penalty for edge play too early
        let edge_pieces = self.count_edge_pieces(current_val);
        score -= edge_pieces as i32 * 5;
        
        score
    }
    
    /// Middle phase evaluation (focus on pattern building)
    fn evaluate_middle_phase(&self) -> i32 {
        let mut score = 0;
        
        // Focus on building connected structures
        score += self.evaluate_connectivity() * 2;
        
        // Penalize isolated pieces
        score -= self.count_isolated_pieces(self.current_player as i8) as i32 * 10;
        
        score
    }
    
    /// Endgame evaluation (focus on forcing moves)
    fn evaluate_endgame_phase(&self) -> i32 {
        let mut score = 0;
        
        // In endgame, threats become more critical
        let current_threats = self.count_winning_moves(self.current_player as i8);
        let opponent_threats = self.count_winning_moves(self.current_player.opponent() as i8);
        
        // Heavy weighting for threat advantage in endgame
        score += (current_threats as i32 - opponent_threats as i32) * 300;
        
        // Bonus for maintaining tempo
        if current_threats > 0 && opponent_threats == 0 {
            score += 150;  // Winning initiative
        }
        
        score
    }
    
    /// Count pieces on board edges
    fn count_edge_pieces(&self, player_val: i8) -> usize {
        let mut count = 0;
        
        // Top and bottom edges
        for col in 0..self.board.cols {
            if self.board.get_cell(0, col).unwrap_or(0) == player_val {
                count += 1;
            }
            if self.board.get_cell(self.board.rows - 1, col).unwrap_or(0) == player_val {
                count += 1;
            }
        }
        
        // Left and right edges (excluding corners already counted)
        for row in 1..self.board.rows - 1 {
            if self.board.get_cell(row, 0).unwrap_or(0) == player_val {
                count += 1;
            }
            if self.board.get_cell(row, self.board.cols - 1).unwrap_or(0) == player_val {
                count += 1;
            }
        }
        
        count
    }
    
    /// Evaluate piece connectivity (adjacent friendly pieces)
    fn evaluate_connectivity(&self) -> i32 {
        let mut score = 0;
        let current_val = self.current_player as i8;
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1), (-1, 0), (0, -1), (-1, -1), (-1, 1)];
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(0) == current_val {
                    let mut adjacent_count = 0;
                    
                    for &(dr, dc) in &directions {
                        let new_row = row as isize + dr;
                        let new_col = col as isize + dc;
                        
                        if self.board.is_within_bounds(new_row, new_col) && self.board.get_cell(new_row as usize, new_col as usize).unwrap_or(0) == current_val {
                            adjacent_count += 1;
                        }
                    }
                    
                    // More adjacent pieces = better connectivity
                    score += adjacent_count * 5;
                }
            }
        }
        
        score
    }
    
    /// Count isolated pieces (no adjacent friendly pieces)
    fn count_isolated_pieces(&self, player_val: i8) -> usize {
        let mut isolated_count = 0;
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1), (-1, 0), (0, -1), (-1, -1), (-1, 1)];
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(0) == player_val {
                    let mut has_adjacent = false;
                    
                    for &(dr, dc) in &directions {
                        let new_row = row as isize + dr;
                        let new_col = col as isize + dc;
                        
                        if self.board.is_within_bounds(new_row, new_col) && self.board.get_cell(new_row as usize, new_col as usize).unwrap_or(0) == player_val {
                            has_adjacent = true;
                            break;
                        }
                    }
                    
                    if !has_adjacent {
                        isolated_count += 1;
                    }
                }
            }
        }
        
        isolated_count
    }
    
    /// Get game phase as enum for external use
    pub fn get_game_phase(&self) -> GamePhase {
        let total_pieces = self.count_total_pieces();
        let board_size = self.board.rows * self.board.cols;
        let fill_ratio = total_pieces as f32 / board_size as f32;
        
        match fill_ratio {
            r if r < 0.25 => GamePhase::Opening,
            r if r < 0.75 => GamePhase::Middle,
            _ => GamePhase::Endgame
        }
    }
    
    /// Analyze position for threats and opportunities
    pub fn analyze_position(&self) -> PositionAnalysis {
        let current_threats = self.count_winning_moves(self.current_player as i8);
        let opponent_threats = self.count_winning_moves(self.current_player.opponent() as i8);
        let total_pieces = self.count_total_pieces();
        let connectivity = self.evaluate_connectivity();
        let phase = self.get_game_phase();
        
        PositionAnalysis {
            current_player_threats: current_threats,
            opponent_threats,
            total_pieces,
            connectivity_score: connectivity,
            game_phase: phase,
            evaluation_score: self.evaluate_position_advanced(),
        }
    }
    
    /// Detect simple fork threats in bottom row: pattern _ x _ x _ 
    /// Returns columns that must be played to prevent opponent fork
    pub fn detect_bottom_row_forks(&self, opponent: Player) -> Vec<usize> {
        let mut fork_columns = Vec::new();
        let opponent_val = opponent as i8;
        let bottom_row = self.board.rows - 1;
        
        // Check for pattern _ x _ x _ (5 consecutive positions needed)
        for start_col in 0..=(self.board.cols.saturating_sub(5)) {
            let pattern = (0..5)
                .map(|i| self.board.get_cell(bottom_row, start_col + i).unwrap_or(0))
                .collect::<Vec<_>>();
            
            // Check if pattern matches _ x _ x _ where x = opponent
            if pattern.len() == 5 
                && pattern[0] == 0 
                && pattern[1] == opponent_val 
                && pattern[2] == 0 
                && pattern[3] == opponent_val 
                && pattern[4] == 0 
            {
                // All three empty positions are critical to block the fork
                let critical_cols = vec![start_col, start_col + 2, start_col + 4];
                for &col in &critical_cols {
                    if !self.board.is_column_full(col) && !fork_columns.contains(&col) {
                        fork_columns.push(col);
                    }
                }
            }
        }
        
        fork_columns
    }
    
    /// Get fork-blocking moves for current player (prevent opponent forks)
    pub fn get_fork_blocking_moves(&self) -> Vec<usize> {
        let opponent = match self.current_player {
            Player::Yellow => Player::Red,
            Player::Red => Player::Yellow,
            Player::Black => Player::White,
            Player::White => Player::Black,
        };
        
        self.detect_bottom_row_forks(opponent)
    }
    
    /// Check if opponent has dangerous fork patterns that require immediate attention
    pub fn has_critical_fork_threats(&self) -> bool {
        let fork_blocks = self.get_fork_blocking_moves();
        !fork_blocks.is_empty()
    }
    
    // GOBANG-SPECIFIC HELPER FUNCTIONS
    
    /// Detect open three patterns: _ X X X _ (both sides open)
    /// Returns flattened positions where placing a piece would create an open three
    /// Each pair of consecutive elements represents (row, col)
    pub fn detect_open_three(&self, player: Player) -> Vec<usize> {
        let mut open_threes = Vec::new();
        let player_val = player as i8;
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)]; // H, V, D/, D\
        
        // Check all empty positions
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                    // Check if placing here creates an open three
                    for &(dr, dc) in &directions {
                        if self.would_create_open_three(row, col, dr, dc, player_val) {
                            open_threes.push(row);
                            open_threes.push(col);
                            break; // No need to check other directions for this position
                        }
                    }
                }
            }
        }
        
        open_threes
    }
    
    /// Helper: Check if placing a piece would create an open three in a direction
    fn would_create_open_three(&self, row: usize, col: usize, dr: isize, dc: isize, player_val: i8) -> bool {
        // Pattern: _ X X X _ (place at any of the 5 positions)
        for start_offset in -2..=2i8 {
            let start_row = row as isize + dr * start_offset as isize;
            let start_col = col as isize + dc * start_offset as isize;
            
            if !self.board.is_within_bounds(start_row, start_col) {
                continue;
            }
            
            // Check if we have pattern _ X X X _ starting here
            let mut pattern_valid = true;
            let mut our_piece_count = 0;
            
            for i in 0..5 {
                let check_row = start_row + dr * i;
                let check_col = start_col + dc * i;
                
                if !self.board.is_within_bounds(check_row, check_col) {
                    pattern_valid = false;
                    break;
                }
                
                let cell_val = if check_row == row as isize && check_col == col as isize {
                    player_val // Simulate placing our piece
                } else {
                    self.board.get_cell(check_row as usize, check_col as usize).unwrap_or(1)
                };
                
                match i {
                    0 | 4 => { // First and last must be empty
                        if cell_val != 0 {
                            pattern_valid = false;
                            break;
                        }
                    }
                    1..=3 => { // Middle three must be our pieces
                        if cell_val == player_val {
                            our_piece_count += 1;
                        } else if cell_val != 0 {
                            pattern_valid = false;
                            break;
                        }
                    }
                    _ => {}
                }
            }
            
            if pattern_valid && our_piece_count == 3 {
                return true;
            }
        }
        
        false
    }
    
    /// Detect closed four patterns: O X X X X _ or _ X X X X O (one side blocked)
    /// Returns flattened positions where placing a piece would create a closed four
    /// Each pair of consecutive elements represents (row, col)
    pub fn detect_closed_four(&self, player: Player) -> Vec<usize> {
        let mut closed_fours = Vec::new();
        let player_val = player as i8;
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                    for &(dr, dc) in &directions {
                        if self.would_create_closed_four(row, col, dr, dc, player_val) {
                            closed_fours.push(row);
                            closed_fours.push(col);
                            break;
                        }
                    }
                }
            }
        }
        
        closed_fours
    }
    
    /// Helper: Check if placing a piece would create a closed four
    fn would_create_closed_four(&self, row: usize, col: usize, dr: isize, dc: isize, player_val: i8) -> bool {
        // Check both patterns: O X X X X _ and _ X X X X O
        for pattern_start in -1..=1isize {
            let start_row = row as isize + dr * pattern_start;
            let start_col = col as isize + dc * pattern_start;
            
            // Pattern 1: O X X X X _ (blocked at start)
            if self.check_closed_four_pattern(row, col, start_row, start_col, dr, dc, player_val, true) {
                return true;
            }
            
            // Pattern 2: _ X X X X O (blocked at end)  
            if self.check_closed_four_pattern(row, col, start_row, start_col, dr, dc, player_val, false) {
                return true;
            }
        }
        
        false
    }
    
    /// Helper: Check specific closed four pattern
    fn check_closed_four_pattern(&self, piece_row: usize, piece_col: usize, start_row: isize, start_col: isize, dr: isize, dc: isize, player_val: i8, blocked_at_start: bool) -> bool {
        // Check bounds
        for i in 0..6 {
            let check_row = start_row + dr * i;
            let check_col = start_col + dc * i;
            if !self.board.is_within_bounds(check_row, check_col) {
                return false;
            }
        }
        
        let mut our_pieces = 0;
        let mut empty_count = 0;
        
        for i in 0..6 {
            let check_row = start_row + dr * i;
            let check_col = start_col + dc * i;
            
            let cell_val = if check_row == piece_row as isize && check_col == piece_col as isize {
                player_val
            } else {
                self.board.get_cell(check_row as usize, check_col as usize).unwrap_or(1)
            };
            
            match i {
                0 => { // First position
                    if blocked_at_start && cell_val == 0 { return false; }
                    if !blocked_at_start && cell_val != 0 { return false; }
                }
                1..=4 => { // Four consecutive pieces
                    if cell_val == player_val {
                        our_pieces += 1;
                    } else if cell_val == 0 {
                        empty_count += 1;
                    } else {
                        return false; // Opponent piece
                    }
                }
                5 => { // Last position
                    if !blocked_at_start && cell_val == 0 { return false; }
                    if blocked_at_start && cell_val != 0 { return false; }
                }
                _ => {}
            }
        }
        
        our_pieces == 4 && empty_count == 0
    }
    
    /// Detect double three fork patterns (two open threes intersecting)
    /// Returns flattened positions that would create a double three fork
    /// Each pair of consecutive elements represents (row, col)
    pub fn detect_double_three_forks(&self, player: Player) -> Vec<usize> {
        let mut fork_positions = Vec::new();
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                    // Simulate placing piece here
                    if self.would_create_double_three_fork(row, col, player) {
                        fork_positions.push(row);
                        fork_positions.push(col);
                    }
                }
            }
        }
        
        fork_positions
    }
    
    /// Helper: Check if placing a piece creates a double three fork
    fn would_create_double_three_fork(&self, row: usize, col: usize, player: Player) -> bool {
        let player_val = player as i8;
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        let mut open_three_count = 0;
        
        // Count how many open threes this move would create
        for &(dr, dc) in &directions {
            if self.would_create_open_three(row, col, dr, dc, player_val) {
                open_three_count += 1;
            }
        }
        
        // Double three fork = at least 2 open threes
        open_three_count >= 2
    }
    
    /// Get threat level (0-5) for a potential move
    /// 5 = Immediate win, 4 = Must block, 3 = Strong threat, 2 = Medium, 1 = Weak, 0 = None
    pub fn get_threat_level(&self, row: usize, col: usize, player: Player) -> u8 {
        if row >= self.board.rows || col >= self.board.cols {
            return 0;
        }
        
        if self.board.get_cell(row, col).unwrap_or(1) != 0 {
            return 0; // Position occupied
        }
        
        // Check if this move wins immediately
        let mut temp_board = self.board.fast_clone();
        if temp_board.set_cell(row, col, player as i8).is_err() {
            return 0; // Invalid position, no threat
        }
        if self.would_win_at(row, col, player as i8) {
            return 5; // Immediate win
        }
        
        // Check threat patterns
        let player_val = player as i8;
        
        // Check for closed four (level 4)
        if self.would_create_closed_four(row, col, 0, 1, player_val) ||
           self.would_create_closed_four(row, col, 1, 0, player_val) ||
           self.would_create_closed_four(row, col, 1, 1, player_val) ||
           self.would_create_closed_four(row, col, 1, -1, player_val) {
            return 4;
        }
        
        // Check for double three fork (level 4)
        if self.would_create_double_three_fork(row, col, player) {
            return 4;
        }
        
        // Check for open three (level 3)
        if self.would_create_open_three(row, col, 0, 1, player_val) ||
           self.would_create_open_three(row, col, 1, 0, player_val) ||
           self.would_create_open_three(row, col, 1, 1, player_val) ||
           self.would_create_open_three(row, col, 1, -1, player_val) {
            return 3;
        }
        
        // Basic connectivity check (levels 1-2)
        let connectivity = self.count_adjacent_pieces(row, col, player_val);
        match connectivity {
            3..=usize::MAX => 2, // Strong connectivity
            1..=2 => 1,          // Weak connectivity
            _ => 0,              // No connectivity
        }
    }
    
    /// Count adjacent pieces of the same player
    fn count_adjacent_pieces(&self, row: usize, col: usize, player_val: i8) -> usize {
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1), (0, -1), (-1, 0), (-1, -1), (-1, 1)];
        let mut count = 0;
        
        for &(dr, dc) in &directions {
            let check_row = row as isize + dr;
            let check_col = col as isize + dc;
            
            if self.board.is_within_bounds(check_row, check_col) && self.board.get_cell(check_row as usize, check_col as usize).unwrap_or(0) == player_val {
                count += 1;
            }
        }
        
        count
    }
    
    /// Get dangerous moves for Gobang (moves that give opponent opportunities)
    /// Returns flattened positions - each pair represents (row, col)
    pub fn get_dangerous_moves_gobang(&self) -> Vec<usize> {
        let mut dangerous_moves = Vec::new();
        let opponent = self.current_player.opponent();
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                    // Check if this move gives opponent high threat opportunities
                    let threat_level = self.get_threat_level(row, col, opponent);
                    if threat_level >= 3 { // Strong threats or above
                        dangerous_moves.push(row);
                        dangerous_moves.push(col);
                    }
                }
            }
        }
        
        dangerous_moves
    }
    
    /// Get winning moves for Gobang (immediate 5-in-a-row)
    /// Returns flattened positions - each pair represents (row, col)
    pub fn get_winning_moves_gobang(&self) -> Vec<usize> {
        let mut winning_moves = Vec::new();
        let player_val = self.current_player as i8;
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(1) == 0 && self.would_win_at(row, col, player_val) {
                    winning_moves.push(row);
                    winning_moves.push(col);
                }
            }
        }
        
        winning_moves
    }
    
    /// Get blocking moves for Gobang (block opponent wins)
    /// Returns flattened positions - each pair represents (row, col)
    pub fn get_blocking_moves_gobang(&self) -> Vec<usize> {
        let mut blocking_moves = Vec::new();
        let opponent_val = self.current_player.opponent() as i8;
        
        for row in 0..self.board.rows {
            for col in 0..self.board.cols {
                if self.board.get_cell(row, col).unwrap_or(1) == 0 && self.would_win_at(row, col, opponent_val) {
                    blocking_moves.push(row);
                    blocking_moves.push(col);
                }
            }
        }
        
        blocking_moves
    }
}

#[wasm_bindgen]
pub struct TrioGameLegacy {
    board: Board,
    target_number: u8,
}

#[wasm_bindgen]
impl TrioGameLegacy {
    #[wasm_bindgen(constructor)]
    pub fn new(difficulty: u8) -> Self {
        let mut board = Board::new(7, 7);
        let mut rng = thread_rng();

        let mut numbers_to_place: Vec<u8> = Vec::new();
        match difficulty {
            1 => {
                // Easy: More small numbers, frequent 1s and 2s
                for _ in 0..6 { numbers_to_place.push(1); }
                for _ in 0..5 { numbers_to_place.push(2); }
                for _ in 0..4 { numbers_to_place.push(3); }
                for _ in 0..3 { numbers_to_place.push(4); }
                for _ in 0..2 { numbers_to_place.push(5); }
                for _ in 0..1 { numbers_to_place.push(6); numbers_to_place.push(7); numbers_to_place.push(8); numbers_to_place.push(9); }
            }
            2 => {
                // Medium: Balanced distribution
                for _ in 0..4 { numbers_to_place.push(1); numbers_to_place.push(9); }
                for _ in 0..4 { numbers_to_place.push(2); numbers_to_place.push(8); }
                for _ in 0..4 { numbers_to_place.push(3); numbers_to_place.push(7); }
                for _ in 0..4 { numbers_to_place.push(4); numbers_to_place.push(6); }
                for _ in 0..5 { numbers_to_place.push(5); }
            }
            _ => {
                // Hard: More large numbers, frequent 8s and 9s
                for _ in 0..1 { numbers_to_place.push(1); numbers_to_place.push(2); numbers_to_place.push(3); }
                for _ in 0..2 { numbers_to_place.push(4); }
                for _ in 0..3 { numbers_to_place.push(5); }
                for _ in 0..4 { numbers_to_place.push(6); }
                for _ in 0..5 { numbers_to_place.push(7); }
                for _ in 0..6 { numbers_to_place.push(8); numbers_to_place.push(9); }
            }
        }

        // Ensure we have enough numbers to fill the board
        while numbers_to_place.len() < 49 {
            numbers_to_place.push(rng.gen_range(1..=9));
        }

        numbers_to_place.shuffle(&mut rng);

        // Fill the board with numbers
        let mut cell_idx = 0;
        for r in 0..7 {
            for c in 0..7 {
                if let Some(&num) = numbers_to_place.get(cell_idx) {
                    if board.set_cell(r, c, num as i8).is_err() {
                        // Invalid position during initialization, skip
                        continue;
                    }
                } else {
                    // This should not happen
                    if board.set_cell(r, c, 0).is_err() {
                        // Invalid position during initialization, skip
                        continue;
                    }
                }
                cell_idx += 1;
            }
        }

        // Generate a solvable target number
        let mut target_number = 0;
        'generation: loop {
            let r1 = rng.gen_range(0..7);
            let c1 = rng.gen_range(0..7);
            let r2 = rng.gen_range(0..7);
            let c2 = rng.gen_range(0..7);
            let r3 = rng.gen_range(0..7);
            let c3 = rng.gen_range(0..7);

            // Ensure distinct cells
            if (r1, c1) == (r2, c2) || (r1, c1) == (r3, c3) || (r2, c2) == (r3, c3) {
                continue;
            }

            let n1 = match board.get_cell(r1, c1) {
                Ok(val) => val as f64,
                Err(_) => continue, // Invalid position, try again
            };
            let n2 = match board.get_cell(r2, c2) {
                Ok(val) => val as f64,
                Err(_) => continue, // Invalid position, try again
            };
            let n3 = match board.get_cell(r3, c3) {
                Ok(val) => val as f64,
                Err(_) => continue, // Invalid position, try again
            };

            let ops: [fn(f64, f64) -> f64; 4] = [|a, b| a + b, |a, b| a - b, |a, b| a * b, |a, b| a / b];
            let op1 = match ops.choose(&mut rng) {
                Some(op) => op,
                None => continue, // No operations available, try again
            };
            let op2 = match ops.choose(&mut rng) {
                Some(op) => op,
                None => continue, // No operations available, try again
            };

            let result = op2(op1(n1, n2), n3);

            if result.is_finite() && result > 0.0 && result.fract() == 0.0 && result <= 100.0 {
                target_number = result as u8;
                break 'generation;
            }
        }


        TrioGameLegacy {
            board,
            target_number,
        }
    }

    pub fn get_board(&self) -> Vec<i8> {
        self.board.get_cells()
    }

    pub fn get_target_number(&self) -> u8 {
        self.target_number
    }

    pub fn check_combination(&self, r1: usize, c1: usize, r2: usize, c2: usize, r3: usize, c3: usize) -> bool {
        let n1 = match self.board.get_cell(r1, c1) {
            Ok(val) => val as f64,
            Err(_) => return false, // Invalid position
        };
        let n2 = match self.board.get_cell(r2, c2) {
            Ok(val) => val as f64,
            Err(_) => return false, // Invalid position
        };
        let n3 = match self.board.get_cell(r3, c3) {
            Ok(val) => val as f64,
            Err(_) => return false, // Invalid position
        };
        let target = self.target_number as f64;

        let numbers = [n1, n2, n3];
        let ops: [fn(f64, f64) -> f64; 4] = [|a, b| a + b, |a, b| a - b, |a, b| a * b, |a, b| a / b];

        let permutations = [
            [numbers[0], numbers[1], numbers[2]],
            [numbers[0], numbers[2], numbers[1]],
            [numbers[1], numbers[0], numbers[2]],
            [numbers[1], numbers[2], numbers[0]],
            [numbers[2], numbers[0], numbers[1]],
            [numbers[2], numbers[1], numbers[0]],
        ];

        for p in &permutations {
            let a = p[0];
            let b = p[1];
            let c = p[2];

            for &op1 in &ops {
                for &op2 in &ops {
                    // (a op1 b) op2 c
                    let mut result = op1(a, b);
                    if result.is_infinite() || result.is_nan() { continue; }
                    result = op2(result, c);
                    if (result - target).abs() < 1e-9 { return true; }

                    // a op1 (b op2 c)
                    let mut result = op2(b, c);
                    if result.is_infinite() || result.is_nan() { continue; }
                    result = op1(a, result);
                    if (result - target).abs() < 1e-9 { return true; }
                }
            }
        }

        false
    }
}

// Trio Gap Analysis and Reachability Structures
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct ReachabilityAnalysis {
    reachable_targets: Vec<i16>,
    unreachable_targets: Vec<i16>,
    total_reachable: usize,
    coverage_percentage: f32,
    min_reachable: i16,
    max_reachable: i16,
}

#[wasm_bindgen]
impl ReachabilityAnalysis {
    #[wasm_bindgen(getter)]
    pub fn get_reachable_targets(&self) -> Vec<i16> {
        self.reachable_targets.clone()
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_unreachable_targets(&self) -> Vec<i16> {
        self.unreachable_targets.clone()
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_total_reachable(&self) -> usize {
        self.total_reachable
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_coverage_percentage(&self) -> f32 {
        self.coverage_percentage
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_min_reachable(&self) -> i16 {
        self.min_reachable
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_max_reachable(&self) -> i16 {
        self.max_reachable
    }
    
    pub fn summary(&self) -> String {
        format!(
            "Reachable: {}/{} targets ({:.1}%), Range: {} to {}, Gaps: {}",
            self.total_reachable,
            self.reachable_targets.len() + self.unreachable_targets.len(),
            self.coverage_percentage,
            self.min_reachable,
            self.max_reachable,
            self.unreachable_targets.len()
        )
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct SolutionAnalysis {
    target: i16,
    total_solutions: usize,
    unique_formulas: Vec<String>,
    add_operations: usize,
    subtract_operations: usize,
    difficulty_score: f32,
}

#[wasm_bindgen]
impl SolutionAnalysis {
    #[wasm_bindgen(getter)]
    pub fn get_target(&self) -> i16 {
        self.target
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_total_solutions(&self) -> usize {
        self.total_solutions
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_unique_formulas(&self) -> Vec<String> {
        self.unique_formulas.clone()
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_add_operations(&self) -> usize {
        self.add_operations
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_subtract_operations(&self) -> usize {
        self.subtract_operations
    }
    
    #[wasm_bindgen(getter)]
    pub fn get_difficulty_score(&self) -> f32 {
        self.difficulty_score
    }
    
    pub fn summary(&self) -> String {
        format!(
            "Target {}: {} solutions ({} add, {} subtract), Difficulty: {:.2}",
            self.target,
            self.total_solutions,
            self.add_operations,
            self.subtract_operations,
            self.difficulty_score
        )
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum TrioDifficulty {
    Impossible,  // 0 solutions
    Hard,        // 1 solution  
    Medium,      // 2-4 solutions
    Easy,        // 5-10 solutions
    VeryEasy,    // 11+ solutions
}

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum TrioDistribution {
    Balanced,    // Equal distribution 1-9
    Educational, // More small numbers for children
    Challenging, // More large numbers for experts
    Official,    // Official Ravensburger rules (when known)
}

// Extended TrioGame with gap analysis capabilities
impl TrioGameLegacy {
    /// Analyze which targets are reachable with current board distribution
    pub fn analyze_reachable_targets(&self) -> ReachabilityAnalysis {
        let mut reachable = Vec::new();
        let mut unreachable = Vec::new();
        
        // Test all possible targets from -8 to 90
        // -8 = 1×1-9, 90 = 9×9+9
        for target in -8..=90 {
            if self.is_target_reachable(target) {
                reachable.push(target);
            } else {
                unreachable.push(target);
            }
        }
        
        let total_possible = 99; // -8 to 90 inclusive
        let total_reachable = reachable.len();
        let coverage_percentage = (total_reachable as f32 / total_possible as f32) * 100.0;
        
        let min_reachable = reachable.iter().min().copied().unwrap_or(0);
        let max_reachable = reachable.iter().max().copied().unwrap_or(0);
        
        ReachabilityAnalysis {
            reachable_targets: reachable,
            unreachable_targets: unreachable,
            total_reachable,
            coverage_percentage,
            min_reachable,
            max_reachable,
        }
    }
    
    /// Check if a specific target is reachable with current board
    pub fn is_target_reachable(&self, target: i16) -> bool {
        let board = self.get_board();
        
        // Check all possible combinations of three numbers
        for i in 0..49 {
            for j in 0..49 {
                for k in 0..49 {
                    if i == j || i == k || j == k {
                        continue; // Skip same positions
                    }
                    
                    let a = board[i] as i16;
                    let b = board[j] as i16;
                    let c = board[k] as i16;
                    
                    // Check a×b+c = target
                    if a * b + c == target {
                        return true;
                    }
                    
                    // Check a×b-c = target
                    if a * b - c == target {
                        return true;
                    }
                }
            }
        }
        
        false
    }
    
    /// Count all solutions for a specific target
    pub fn count_solutions_for_target(&self, target: i16) -> SolutionAnalysis {
        let board = self.get_board();
        let mut unique_formulas = Vec::new();
        let mut add_operations = 0;
        let mut subtract_operations = 0;
        
        // Check all possible combinations of three numbers
        for i in 0..49 {
            for j in 0..49 {
                for k in 0..49 {
                    if i == j || i == k || j == k {
                        continue; // Skip same positions
                    }
                    
                    let a = board[i] as i16;
                    let b = board[j] as i16;
                    let c = board[k] as i16;
                    
                    // Check a×b+c = target
                    if a * b + c == target {
                        let formula = format!("{}×{}+{}", a, b, c);
                        if !unique_formulas.contains(&formula) {
                            unique_formulas.push(formula);
                            add_operations += 1;
                        }
                    }
                    
                    // Check a×b-c = target
                    if a * b - c == target {
                        let formula = format!("{}×{}-{}", a, b, c);
                        if !unique_formulas.contains(&formula) {
                            unique_formulas.push(formula);
                            subtract_operations += 1;
                        }
                    }
                }
            }
        }
        
        let total_solutions = add_operations + subtract_operations;
        
        // Calculate difficulty score (0.0 = impossible, 1.0 = very easy)
        let difficulty_score = match total_solutions {
            0 => 0.0,
            1 => 0.2,
            2..=4 => 0.4,
            5..=10 => 0.7,
            _ => 1.0,
        };
        
        SolutionAnalysis {
            target,
            total_solutions,
            unique_formulas,
            add_operations,
            subtract_operations,
            difficulty_score,
        }
    }
    
    /// Get difficulty category for a target
    pub fn categorize_target_difficulty(&self, target: i16) -> TrioDifficulty {
        let analysis = self.count_solutions_for_target(target);
        match analysis.total_solutions {
            0 => TrioDifficulty::Impossible,
            1 => TrioDifficulty::Hard,
            2..=4 => TrioDifficulty::Medium,
            5..=10 => TrioDifficulty::Easy,
            _ => TrioDifficulty::VeryEasy,
        }
    }
    
    /// Create a new TrioGame with specific distribution
    pub fn new_with_distribution(distribution: TrioDistribution) -> Self {
        let mut board = Board::new(7, 7);
        let mut rng = thread_rng();
        
        let numbers_to_place: Vec<u8> = match distribution {
            TrioDistribution::Balanced => {
                // Equal distribution: roughly 5-6 of each number 1-9
                let mut nums = Vec::new();
                for num in 1..=9 {
                    for _ in 0..5 {
                        nums.push(num);
                    }
                }
                // Add 4 more random numbers to reach 49
                for _ in 0..4 {
                    nums.push(rng.gen_range(1..=9));
                }
                nums
            },
            TrioDistribution::Educational => {
                // More small numbers for children
                let mut nums = Vec::new();
                for _ in 0..8 { nums.push(1); }
                for _ in 0..7 { nums.push(2); }
                for _ in 0..6 { nums.push(3); }
                for _ in 0..5 { nums.push(4); }
                for _ in 0..4 { nums.push(5); }
                for _ in 0..3 { nums.push(6); }
                for _ in 0..2 { nums.push(7); }
                for _ in 0..2 { nums.push(8); }
                for _ in 0..2 { nums.push(9); }
                nums
            },
            TrioDistribution::Challenging => {
                // More large numbers for experts
                let mut nums = Vec::new();
                for _ in 0..2 { nums.push(1); }
                for _ in 0..2 { nums.push(2); }
                for _ in 0..3 { nums.push(3); }
                for _ in 0..4 { nums.push(4); }
                for _ in 0..5 { nums.push(5); }
                for _ in 0..6 { nums.push(6); }
                for _ in 0..7 { nums.push(7); }
                for _ in 0..8 { nums.push(8); }
                for _ in 0..12 { nums.push(9); }
                nums
            },
            TrioDistribution::Official => {
                // TODO: Implement when official rules are known
                // For now, use balanced
                let mut nums = Vec::new();
                for num in 1..=9 {
                    for _ in 0..5 {
                        nums.push(num);
                    }
                }
                for _ in 0..4 {
                    nums.push(rng.gen_range(1..=9));
                }
                nums
            },
        };
        
        let mut shuffled_numbers = numbers_to_place;
        shuffled_numbers.shuffle(&mut rng);
        
        // Fill the board
        for i in 0..49 {
            let row = i / 7;
            let col = i % 7;
            let number = shuffled_numbers.get(i).copied().unwrap_or(1);
            let _ = board.set_cell(row, col, number as i8);
        }
        
        // Generate a guaranteed reachable target
        let target_number = Self::generate_guaranteed_target(&board);
        
        TrioGameLegacy {
            board,
            target_number,
        }
    }
    
    /// Generate a target that is guaranteed to be reachable
    fn generate_guaranteed_target(board: &Board) -> u8 {
        let mut rng = thread_rng();
        let cells = board.get_cells();
        
        // Pick three random positions
        let positions: Vec<usize> = (0..49).choose_multiple(&mut rng, 3).into_iter().collect();
        let a = cells[positions[0]] as i16;
        let b = cells[positions[1]] as i16;
        let c = cells[positions[2]] as i16;
        
        // Choose random operation
        let target = if rng.gen_bool(0.5) {
            a * b + c  // addition
        } else {
            a * b - c  // subtraction
        };
        
        // Ensure target is in reasonable range
        if (1..=90).contains(&target) {
            target as u8
        } else {
            // Fallback to a simple target
            25
        }
    }
}

#[wasm_bindgen]
impl TrioGameLegacy {
    /// Create new game with specific distribution (WASM-exposed)
    pub fn new_with_distribution_wasm(distribution: TrioDistribution) -> Self {
        Self::new_with_distribution(distribution)
    }
    
    /// Analyze reachable targets (WASM-exposed)
    pub fn analyze_reachable_targets_wasm(&self) -> ReachabilityAnalysis {
        self.analyze_reachable_targets()
    }
    
    /// Count solutions for target (WASM-exposed)
    pub fn count_solutions_for_target_wasm(&self, target: i16) -> SolutionAnalysis {
        self.count_solutions_for_target(target)
    }
    
    /// Get difficulty category (WASM-exposed)
    pub fn categorize_target_difficulty_wasm(&self, target: i16) -> TrioDifficulty {
        self.categorize_target_difficulty(target)
    }
    
    /// Perform comprehensive gap analysis for all distributions
    pub fn comprehensive_gap_analysis() -> String {
        let mut report = String::new();
        report.push_str("=== TRIO COMPREHENSIVE GAP ANALYSIS ===\n\n");
        
        let distributions = [
            TrioDistribution::Balanced,
            TrioDistribution::Educational,
            TrioDistribution::Challenging,
            TrioDistribution::Official,
        ];
        
        for distribution in distributions.iter() {
            let game = TrioGameLegacy::new_with_distribution(*distribution);
            let analysis = game.analyze_reachable_targets();
            
            report.push_str(&format!("Distribution: {:?}\n", distribution));
            report.push_str(&format!("  {}\n", analysis.summary()));
            report.push_str(&format!("  Unreachable targets: {:?}\n\n", 
                analysis.get_unreachable_targets()));
        }
        
        report
    }
}
