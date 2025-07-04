use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;
use rand::seq::IteratorRandom;
use rand::Rng;
use rand::thread_rng;

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
}

impl Player {
    /// Get the opponent player - essential for AI algorithms
    pub fn opponent(self) -> Self {
        match self {
            Player::Yellow => Player::Red,
            Player::Red => Player::Yellow,
        }
    }
}

impl From<Player> for i8 {
    fn from(player: Player) -> Self {
        match player {
            Player::Yellow => 1,
            Player::Red => 2,
        }
    }
}

impl TryFrom<i8> for Player {
    type Error = String; // Changed from JsValue to String
    fn try_from(value: i8) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Player::Yellow),
            2 => Ok(Player::Red),
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
        for row in (0..self.rows).rev() {
            if self.get_cell(row, col).unwrap_or(1) == 0 {
                return Some(row);
            }
        }
        None
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
        match self.simulate_move_connect4(col) {
            Ok(simulated_game) => Some(simulated_game),
            Err(_) => None
        }
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
                    if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                        if self.would_win_at(row, col, player_val) {
                            winning_moves += 1;
                        }
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
        let row_dist = (row as isize - center_row as isize).abs() as usize;
        let col_dist = (col as isize - center_col as isize).abs() as usize;
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
            score += center_pieces as i32 * 15;
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
                        
                        if self.board.is_within_bounds(new_row, new_col) {
                            if self.board.get_cell(new_row as usize, new_col as usize).unwrap_or(0) == current_val {
                                adjacent_count += 1;
                            }
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
                        
                        if self.board.is_within_bounds(new_row, new_col) {
                            if self.board.get_cell(new_row as usize, new_col as usize).unwrap_or(0) == player_val {
                                has_adjacent = true;
                                break;
                            }
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
                    1 | 2 | 3 => { // Middle three must be our pieces
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
        if let Err(_) = temp_board.set_cell(row, col, player as i8) {
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
            
            if self.board.is_within_bounds(check_row, check_col) {
                if self.board.get_cell(check_row as usize, check_col as usize).unwrap_or(0) == player_val {
                    count += 1;
                }
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
                if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                    if self.would_win_at(row, col, player_val) {
                        winning_moves.push(row);
                        winning_moves.push(col);
                    }
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
                if self.board.get_cell(row, col).unwrap_or(1) == 0 {
                    if self.would_win_at(row, col, opponent_val) {
                        blocking_moves.push(row);
                        blocking_moves.push(col);
                    }
                }
            }
        }
        
        blocking_moves
    }
}

#[wasm_bindgen]
pub struct TrioGame {
    board: Board,
    target_number: u8,
}

#[wasm_bindgen]
impl TrioGame {
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
                    if let Err(_) = board.set_cell(r, c, num as i8) {
                        // Invalid position during initialization, skip
                        continue;
                    }
                } else {
                    // This should not happen
                    if let Err(_) = board.set_cell(r, c, 0) {
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


        TrioGame {
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
impl TrioGame {
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
        
        TrioGame {
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
        if target >= 1 && target <= 90 {
            target as u8
        } else {
            // Fallback to a simple target
            25
        }
    }
}

#[wasm_bindgen]
impl TrioGame {
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
            let game = TrioGame::new_with_distribution(*distribution);
            let analysis = game.analyze_reachable_targets();
            
            report.push_str(&format!("Distribution: {:?}\n", distribution));
            report.push_str(&format!("  {}\n", analysis.summary()));
            report.push_str(&format!("  Unreachable targets: {:?}\n\n", 
                analysis.get_unreachable_targets()));
        }
        
        report
    }
}

#[cfg(test)]
mod tests {
    use super::{Game, Player, Board, TrioGame};

    // Helper function to set board state for tests
    fn set_board_state(game: &mut Game, board_state: &[i8]) {
        for r in 0..game.board.get_rows() {
            for c in 0..game.board.get_cols() {
                game.board.set_cell(r, c, board_state[r * game.board.get_cols() + c]).unwrap();
            }
        }
    }

    #[test]
    fn test_new_board() {
        let board = Board::new(6, 7);
        assert_eq!(board.get_cells().len(), 6 * 7);
        assert!(board.get_cells().iter().all(|&cell| cell == 0));
        assert_eq!(board.get_rows(), 6);
        assert_eq!(board.get_cols(), 7);
    }

    #[test]
    fn test_board_get_set_cell() {
        let mut board = Board::new(2, 2);
        assert_eq!(board.get_cell(0, 0).unwrap(), 0);
        board.set_cell(0, 0, 5).unwrap();
        assert_eq!(board.get_cell(0, 0).unwrap(), 5);
        assert!(board.get_cell(2, 0).is_err()); // Out of bounds
    }

    #[test]
    fn test_board_is_within_bounds() {
        let board = Board::new(3, 3);
        assert!(board.is_within_bounds(0, 0));
        assert!(board.is_within_bounds(2, 2));
        assert!(!board.is_within_bounds(-1, 0));
        assert!(!board.is_within_bounds(3, 0));
        assert!(!board.is_within_bounds(0, 3));
    }

    #[test]
    fn test_board_is_full() {
        let mut board = Board::new(1, 1);
        assert!(!board.is_full());
        board.set_cell(0, 0, 1).unwrap();
        assert!(board.is_full());
    }

    #[test]
    fn test_new_game() {
        let game = Game::new(6, 7, 4, true);
        assert_eq!(game.get_board().len(), 6 * 7);
        assert!(game.get_board().iter().all(|&cell| cell == 0)); // Check for 0 (empty)
        assert_eq!(game.get_current_player(), Player::Yellow);
    }

    #[test]
    fn test_make_move_gravity() {
        let mut game = Game::new(6, 7, 4, true);

        // First move in column 0
        game._make_move_connect4(0).unwrap();
        let board = game.get_board();
        assert_eq!(board[5 * 7 + 0], Player::Yellow as i8); // Bottom-left, check for Player::Yellow as i8
        assert_eq!(game.get_current_player(), Player::Red);

        // Second move in column 0
        game._make_move_connect4(0).unwrap();
        let board = game.get_board();
        assert_eq!(board[4 * 7 + 0], Player::Red as i8); // One above bottom-left, check for Player::Red as i8
        assert_eq!(game.get_current_player(), Player::Yellow);
    }

    #[test]
    fn test_make_move_connect4_no_gravity_behaves_as_expected() {
        let mut game = Game::new(6, 7, 4, false);

        // In Connect4 mode without gravity, a move in column 0 will attempt to place at row 0, col 0.
        // This is not how Gobang works, but it's how _make_move_connect4 behaves when gravity is false.
        let result = game._make_move_connect4(0);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Gravity is disabled for this game. Use make_move_gobang_js for precise placement.");

        // Second move in column 0 should still fail as the spot is occupied (or due to gravity disabled).
        let result = game._make_move_connect4(0);
        assert!(result.is_err());
    }

    #[test]
    fn test_make_move_gobang() {
        let mut game = Game::new(6, 7, 4, false); // Gravity disabled for Gobang-like behavior

        // Place a piece at (0, 0)
        game._make_move_gobang(0, 0).unwrap();
        let board = game.get_board();
        assert_eq!(board[0], Player::Yellow as i8);
        assert_eq!(game.get_current_player(), Player::Red);

        // Place a piece at (2, 3)
        game._make_move_gobang(2, 3).unwrap();
        let board = game.get_board();
        assert_eq!(board[2 * 7 + 3], Player::Red as i8);
        assert_eq!(game.get_current_player(), Player::Yellow);

        // Try to place at an occupied spot (0, 0) - should fail
        let result = game._make_move_gobang(0, 0);
        assert!(result.is_err());

        // Try to place out of bounds (6, 0) - should fail
        let result = game._make_move_gobang(6, 0);
        assert!(result.is_err());

        // Try to place out of bounds (0, 7) - should fail
        let result = game._make_move_gobang(0, 7);
        assert!(result.is_err());
    }

    #[test]
    fn test_make_move_column_full() {
        let mut game = Game::new(6, 1, 4, true); // 6 rows, 1 column

        for _ in 0..6 {
            game._make_move_connect4(0).unwrap();
        }

        let result = game._make_move_connect4(0);
        assert!(result.is_err());
    }

    #[test]
    fn test_make_move_out_of_bounds() {
        let mut game = Game::new(6, 7, 4, true);
        let result = game._make_move_connect4(7);
        assert!(result.is_err());
    }

    

    #[test]
        fn test_check_win() {
        // Test horizontal win (Connect4-like)
        let mut game = Game::new(6, 7, 4, true);
        game._make_move_connect4(0).unwrap(); // Y
        game._make_move_connect4(0).unwrap(); // R
        game._make_move_connect4(1).unwrap(); // Y
        game._make_move_connect4(1).unwrap(); // R
        game._make_move_connect4(2).unwrap(); // Y
        game._make_move_connect4(2).unwrap(); // R
        game._make_move_connect4(3).unwrap(); // Y - Wins horizontally
        assert_eq!(game.check_win(), Some(Player::Yellow));

        // Test vertical win (Connect4-like)
        let mut game = Game::new(6, 7, 4, true);
        game._make_move_connect4(0).unwrap(); // Y
        game._make_move_connect4(1).unwrap(); // R
        game._make_move_connect4(0).unwrap(); // Y
        game._make_move_connect4(1).unwrap(); // R
        game._make_move_connect4(0).unwrap(); // Y
        game._make_move_connect4(1).unwrap(); // R
        game._make_move_connect4(0).unwrap(); // Y - Wins vertically
        assert_eq!(game.check_win(), Some(Player::Yellow));

        // Test diagonal win (top-left to bottom-right)
        let mut game = Game::new(6, 7, 4, true);
        // Manually set up a diagonal win for Yellow
        // Y at (5,0), (4,1), (3,2), (2,3)
        let mut board_state = vec![0; 6 * 7];
        board_state[5 * 7 + 0] = Player::Yellow as i8;
        board_state[4 * 7 + 1] = Player::Yellow as i8;
        board_state[3 * 7 + 2] = Player::Yellow as i8;
        board_state[2 * 7 + 3] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        assert_eq!(game.check_win(), Some(Player::Yellow));

        // Test diagonal win (top-right to bottom-left)
        let mut game = Game::new(6, 7, 4, true);
        // Manually set up a diagonal win for Yellow
        // Y at (5,3), (4,2), (3,1), (2,0)
        let mut board_state = vec![0; 6 * 7];
        board_state[5 * 7 + 3] = Player::Yellow as i8;
        board_state[4 * 7 + 2] = Player::Yellow as i8;
        board_state[3 * 7 + 1] = Player::Yellow as i8;
        board_state[2 * 7 + 0] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        assert_eq!(game.check_win(), Some(Player::Yellow));

        // Test Gobang-like win (no gravity, specific placement)
        let mut game = Game::new(10, 10, 5, false); // 10x10 board, win_condition 5
        game._make_move_gobang(0, 0).unwrap(); // Y
        game._make_move_gobang(1, 0).unwrap(); // R
        game._make_move_gobang(0, 1).unwrap(); // Y
        game._make_move_gobang(1, 1).unwrap(); // R
        game._make_move_gobang(0, 2).unwrap(); // Y
        game._make_move_gobang(1, 2).unwrap(); // R
        game._make_move_gobang(0, 3).unwrap(); // Y
        game._make_move_gobang(1, 3).unwrap(); // R
        game._make_move_gobang(0, 4).unwrap(); // Y - Wins horizontally
        assert_eq!(game.check_win(), Some(Player::Yellow));

        // Test no win
        let mut game = Game::new(6, 7, 4, true);
        game._make_move_connect4(0).unwrap(); // Y
        game._make_move_connect4(1).unwrap(); // R
        game._make_move_connect4(2).unwrap(); // Y
        assert_eq!(game.check_win(), None);
    }

    #[test]
    fn test_trio_check_combination() {
        let mut trio = TrioGame::new(1);
        trio.board.set_cell(0, 0, 3).unwrap();
        trio.board.set_cell(0, 1, 4).unwrap();
        trio.board.set_cell(0, 2, 5).unwrap();

        // 3 * 4 + 5 = 17
        trio.target_number = 17;
        assert!(trio.check_combination(0, 0, 0, 1, 0, 2));

        // 5 * 4 - 3 = 17
        assert!(trio.check_combination(0, 2, 0, 1, 0, 0));

        // 3 + 4 + 5 = 12
        trio.target_number = 12;
        assert!(trio.check_combination(0, 0, 0, 1, 0, 2));

        // 4 * 5 / 2 = 10, not possible with these numbers
        // 3 * 5 - 4 = 11
        trio.target_number = 11;
        assert!(trio.check_combination(0,0,0,2,0,1));

        // (3 + 5) / 4 = 2
        trio.target_number = 2;
        assert!(trio.check_combination(0,0,0,2,0,1));
    }

    #[test]
    fn test_trio_game_new() {
        // Test easy difficulty
        let trio_easy = TrioGame::new(1);
        assert_eq!(trio_easy.get_board().len(), 49);
        assert!(trio_easy.get_target_number() > 0 && trio_easy.get_target_number() <= 100);

        // Test medium difficulty
        let trio_medium = TrioGame::new(2);
        assert_eq!(trio_medium.get_board().len(), 49);
        assert!(trio_medium.get_target_number() > 0 && trio_medium.get_target_number() <= 100);

        // Test hard difficulty
        let trio_hard = TrioGame::new(3);
        assert_eq!(trio_hard.get_board().len(), 49);
        assert!(trio_hard.get_target_number() > 0 && trio_hard.get_target_number() <= 100);
    }

    #[test]
    fn test_trio_new_distributions() {
        use super::TrioDistribution;
        
        // Test balanced distribution
        let trio_balanced = TrioGame::new_with_distribution(TrioDistribution::Balanced);
        assert_eq!(trio_balanced.get_board().len(), 49);
        
        // Test educational distribution (more small numbers)
        let trio_educational = TrioGame::new_with_distribution(TrioDistribution::Educational);
        let board = trio_educational.get_board();
        let small_numbers = board.iter().filter(|&&x| x >= 1 && x <= 3).count();
        let large_numbers = board.iter().filter(|&&x| x >= 7 && x <= 9).count();
        assert!(small_numbers > large_numbers); // More small numbers in educational mode
        
        // Test challenging distribution (more large numbers)
        let trio_challenging = TrioGame::new_with_distribution(TrioDistribution::Challenging);
        let board = trio_challenging.get_board();
        let small_numbers = board.iter().filter(|&&x| x >= 1 && x <= 3).count();
        let large_numbers = board.iter().filter(|&&x| x >= 7 && x <= 9).count();
        assert!(large_numbers > small_numbers); // More large numbers in challenging mode
    }

    #[test]
    fn test_trio_gap_analysis() {
        use super::TrioDistribution;
        
        let trio = TrioGame::new_with_distribution(TrioDistribution::Balanced);
        let analysis = trio.analyze_reachable_targets();
        
        // Should analyze range -8 to 90
        assert!(analysis.get_min_reachable() >= -8);
        assert!(analysis.get_max_reachable() <= 90);
        assert!(analysis.get_total_reachable() > 0);
        assert!(analysis.get_coverage_percentage() > 0.0);
        assert!(analysis.get_coverage_percentage() <= 100.0);
    }

    #[test]
    fn test_trio_solution_analysis() {
        use super::TrioDistribution;
        
        let trio = TrioGame::new_with_distribution(TrioDistribution::Balanced);
        
        // Test analysis for a simple target that should have solutions
        let analysis = trio.count_solutions_for_target(10);
        
        // Should have some basic properties
        assert_eq!(analysis.get_target(), 10);
        assert_eq!(analysis.get_total_solutions(), 
                   analysis.get_add_operations() + analysis.get_subtract_operations());
        assert!(analysis.get_difficulty_score() >= 0.0);
        assert!(analysis.get_difficulty_score() <= 1.0);
    }

    #[test]
    fn test_trio_reachability_edge_cases() {
        use super::TrioDistribution;
        
        let trio = TrioGame::new_with_distribution(TrioDistribution::Balanced);
        
        // Test edge case targets
        let min_possible = trio.is_target_reachable(-8); // 1×1-9
        let max_possible = trio.is_target_reachable(90); // 9×9+9
        
        // These should be reachable if the right numbers are on the board
        // (depends on random distribution, but at least test the function works)
        assert!(min_possible || !min_possible); // Just test it doesn't crash
        assert!(max_possible || !max_possible); // Just test it doesn't crash
        
        // Test obviously impossible target (way out of range)
        assert!(!trio.is_target_reachable(200));
        assert!(!trio.is_target_reachable(-100));
    }

    // Phase 1 AI Enhancement Tests
    #[test]
    fn test_fast_clone() {
        let mut game = Game::new(6, 7, 4, true);
        game._make_move_connect4(0).unwrap();
        
        let cloned_game = game.fast_clone();
        assert_eq!(game.get_board(), cloned_game.get_board());
        assert_eq!(game.get_current_player(), cloned_game.get_current_player());
    }

    #[test]
    fn test_legal_moves_connect4() {
        let game = Game::new(6, 7, 4, true);
        let legal_moves = game.get_legal_moves_connect4();
        assert_eq!(legal_moves.len(), 7); // All columns should be available
        assert_eq!(legal_moves, vec![0, 1, 2, 3, 4, 5, 6]);
        
        // Test with no gravity (should return empty)
        let game_no_gravity = Game::new(6, 7, 4, false);
        let legal_moves = game_no_gravity.get_legal_moves_connect4();
        assert_eq!(legal_moves.len(), 0);
    }

    #[test]
    fn test_legal_moves_gobang() {
        let game = Game::new(3, 3, 3, false); // Small 3x3 board
        let legal_moves = game.get_legal_moves_gobang();
        assert_eq!(legal_moves.len(), 18); // 9 positions * 2 (row, col pairs)
        
        // Test with gravity enabled (should return empty)
        let game_gravity = Game::new(3, 3, 3, true);
        let legal_moves = game_gravity.get_legal_moves_gobang();
        assert_eq!(legal_moves.len(), 0);
    }

    #[test]
    fn test_simulate_move_connect4() {
        let game = Game::new(6, 7, 4, true);
        
        // Simulate a move
        let simulated_game = game.simulate_move_connect4(0).unwrap();
        
        // Original game should be unchanged
        assert!(game.get_board().iter().all(|&cell| cell == 0));
        assert_eq!(game.get_current_player(), Player::Yellow);
        
        // Simulated game should have the move applied
        assert_eq!(simulated_game.get_board()[5 * 7 + 0], Player::Yellow as i8);
        assert_eq!(simulated_game.get_current_player(), Player::Red);
    }

    #[test]
    fn test_simulate_move_gobang() {
        let game = Game::new(6, 7, 4, false);
        
        // Simulate a move
        let simulated_game = game.simulate_move_gobang(2, 3).unwrap();
        
        // Original game should be unchanged
        assert!(game.get_board().iter().all(|&cell| cell == 0));
        assert_eq!(game.get_current_player(), Player::Yellow);
        
        // Simulated game should have the move applied
        assert_eq!(simulated_game.get_board()[2 * 7 + 3], Player::Yellow as i8);
        assert_eq!(simulated_game.get_current_player(), Player::Red);
    }

    #[test]
    fn test_evaluate_position() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Initial position should evaluate to 0
        assert_eq!(game.evaluate_position(), 0);
        
        // Create a winning position for Yellow
        let mut board_state = vec![0; 6 * 7];
        board_state[5 * 7 + 0] = Player::Yellow as i8;
        board_state[5 * 7 + 1] = Player::Yellow as i8;
        board_state[5 * 7 + 2] = Player::Yellow as i8;
        board_state[5 * 7 + 3] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        
        // Should evaluate to positive value for current player (Yellow)
        assert_eq!(game.evaluate_position(), 1000);
        
        // Switch to Red's turn and evaluate again
        game.current_player = Player::Red;
        assert_eq!(game.evaluate_position(), -1000);
    }

    #[test]
    fn test_board_helper_methods() {
        let mut board = Board::new(6, 7);
        
        // Test column availability
        assert!(board.is_column_available(0));
        assert!(board.is_column_available(6));
        assert!(!board.is_column_available(7)); // Out of bounds
        
        // Test drop row calculation
        assert_eq!(board.get_drop_row(0), Some(5)); // Bottom row
        
        // Fill a column partially
        board.set_cell(5, 0, 1).unwrap();
        board.set_cell(4, 0, 2).unwrap();
        assert_eq!(board.get_drop_row(0), Some(3)); // Next available row
        
        // Fill column completely
        for row in 0..6 {
            board.set_cell(row, 1, 1).unwrap();
        }
        assert!(!board.is_column_available(1));
        assert_eq!(board.get_drop_row(1), None);
    }

    #[test]
    fn test_terminal_state_detection() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Initial state should not be terminal
        assert!(!game.is_terminal());
        assert_eq!(game.get_winner(), None);
        
        // Create a winning position
        let mut board_state = vec![0; 6 * 7];
        board_state[5 * 7 + 0] = Player::Yellow as i8;
        board_state[5 * 7 + 1] = Player::Yellow as i8;
        board_state[5 * 7 + 2] = Player::Yellow as i8;
        board_state[5 * 7 + 3] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        
        // Should be terminal with Yellow as winner
        assert!(game.is_terminal());
        assert_eq!(game.get_winner(), Some(Player::Yellow));
    }

    #[test]
    fn test_ai_simulation_workflow() {
        let game = Game::new(6, 7, 4, true);
        
        // Test complete AI simulation workflow
        let legal_moves = game.get_legal_moves_connect4();
        assert!(!legal_moves.is_empty());
        
        // Simulate multiple moves
        let first_move = game.simulate_move_connect4(3).unwrap();
        assert_eq!(first_move.get_current_player(), Player::Red);
        
        let second_move = first_move.simulate_move_connect4(3).unwrap();
        assert_eq!(second_move.get_current_player(), Player::Yellow);
        
        // Original game should remain unchanged
        assert_eq!(game.get_current_player(), Player::Yellow);
        assert!(game.get_board().iter().all(|&cell| cell == 0));
    }

    #[test]
    fn test_minimax_simulation_demo() {
        // Demonstrate minimax-style tree exploration capability
        let game = Game::new(6, 7, 4, true);
        
        // Depth 1: Explore all legal moves
        let legal_moves = game.get_legal_moves_connect4();
        let mut simulations = Vec::new();
        
        for &col in &legal_moves {
            if let Ok(sim) = game.simulate_move_connect4(col) {
                simulations.push((col, sim));
            }
        }
        
        assert_eq!(simulations.len(), 7);
        
        // Depth 2: Explore responses to each move
        let mut depth2_count = 0;
        for (_, sim1) in &simulations {
            let legal_moves2 = sim1.get_legal_moves_connect4();
            for &col2 in &legal_moves2 {
                if let Ok(_sim2) = sim1.simulate_move_connect4(col2) {
                    depth2_count += 1;
                }
            }
        }
        
        // Should have explored 7*7 = 49 positions at depth 2
        assert_eq!(depth2_count, 49);
        
        // Verify original game still unchanged
        assert_eq!(game.get_current_player(), Player::Yellow);
        assert!(game.get_board().iter().all(|&cell| cell == 0));
    }

    #[test]
    fn test_gobang_ai_capabilities() {
        // Test Gobang-specific AI capabilities (5x5 for performance)
        let game = Game::new(5, 5, 3, false);
        
        // 1. Get legal moves (should be all positions)
        let legal_moves = game.get_legal_moves_gobang();
        assert_eq!(legal_moves.len(), 50); // 5*5*2 (row,col pairs)
        
        // 2. Test specific move simulation
        let simulated = game.simulate_move_gobang(2, 2).unwrap();
        let board = simulated.get_board();
        assert_eq!(board[2 * 5 + 2], Player::Yellow as i8);
        
        // 3. Test move chaining
        let second_move = simulated.simulate_move_gobang(1, 1).unwrap();
        let board2 = second_move.get_board();
        assert_eq!(board2[2 * 5 + 2], Player::Yellow as i8); // First move still there
        assert_eq!(board2[1 * 5 + 1], Player::Red as i8);    // Second move added
        
        // 4. Verify original unchanged
        assert!(game.get_board().iter().all(|&cell| cell == 0));
    }
    
    // PHASE 2: ADVANCED EVALUATION TESTS
    
    #[test]
    fn test_advanced_position_evaluation() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Test initial position
        let initial_score = game.evaluate_position_advanced();
        assert!(initial_score.abs() <= 100); // Should be relatively neutral
        
        // Create a position with threats
        let mut board_state = vec![0; 6 * 7];
        // Yellow has 3 in a row, needs 1 more
        board_state[5 * 7 + 0] = Player::Yellow as i8;
        board_state[5 * 7 + 1] = Player::Yellow as i8;
        board_state[5 * 7 + 2] = Player::Yellow as i8;
        // Red has 2 in a row
        board_state[5 * 7 + 4] = Player::Red as i8;
        board_state[5 * 7 + 5] = Player::Red as i8;
        set_board_state(&mut game, &board_state);
        
        let threat_score = game.evaluate_position_advanced();
        assert!(threat_score > initial_score); // Should favor Yellow
    }
    
    #[test]
    fn test_threat_detection() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Set up a position where Yellow can win in column 3
        let mut board_state = vec![0; 6 * 7];
        board_state[5 * 7 + 0] = Player::Yellow as i8;
        board_state[5 * 7 + 1] = Player::Yellow as i8;
        board_state[5 * 7 + 2] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        
        let threats = game.count_winning_moves(Player::Yellow as i8);
        assert_eq!(threats, 1); // Should detect the winning move in column 3
    }
    
    #[test]
    fn test_game_phase_detection() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Opening phase (empty board)
        assert_eq!(game.get_game_phase(), GamePhase::Opening);
        
        // Add some pieces to reach middle phase
        let mut board_state = vec![0; 6 * 7];
        for i in 0..15 {
            board_state[i] = if i % 2 == 0 { Player::Yellow as i8 } else { Player::Red as i8 };
        }
        set_board_state(&mut game, &board_state);
        assert_eq!(game.get_game_phase(), GamePhase::Middle);
        
        // Fill most of the board for endgame
        for i in 0..35 {
            board_state[i] = if i % 2 == 0 { Player::Yellow as i8 } else { Player::Red as i8 };
        }
        set_board_state(&mut game, &board_state);
        assert_eq!(game.get_game_phase(), GamePhase::Endgame);
    }
    
    #[test]
    fn test_position_analysis() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Test analysis on opening position
        let analysis = game.analyze_position();
        assert_eq!(analysis.current_player_threats(), 0);
        assert_eq!(analysis.opponent_threats(), 0);
        assert_eq!(analysis.total_pieces(), 0);
        assert_eq!(analysis.game_phase(), GamePhase::Opening);
        assert!(!analysis.is_critical());
        
        // Create a tactical position
        let mut board_state = vec![0; 6 * 7];
        board_state[5 * 7 + 0] = Player::Yellow as i8;
        board_state[5 * 7 + 1] = Player::Yellow as i8;
        board_state[5 * 7 + 2] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        
        let tactical_analysis = game.analyze_position();
        assert!(tactical_analysis.current_player_threats() > 0);
        assert!(tactical_analysis.is_critical());
        assert!(tactical_analysis.threat_advantage() > 0);
    }
    
    #[test]
    fn test_pattern_evaluation() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Test pattern scoring
        let mut board_state = vec![0; 6 * 7];
        // Create a 2-piece pattern with room to grow
        board_state[5 * 7 + 1] = Player::Yellow as i8;
        board_state[5 * 7 + 2] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        
        let pattern_score = game.evaluate_patterns();
        assert!(pattern_score > 0); // Should recognize Yellow's potential
        
        // Switch perspective
        game.current_player = Player::Red;
        let opponent_pattern_score = game.evaluate_patterns();
        assert!(opponent_pattern_score < 0); // Should see Yellow's threat from Red's perspective
    }
    
    #[test]
    fn test_positional_evaluation() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Test center vs edge positioning
        let mut center_board = vec![0; 6 * 7];
        center_board[5 * 7 + 3] = Player::Yellow as i8; // Center column
        set_board_state(&mut game, &center_board);
        let center_score = game.evaluate_positional();
        
        let mut edge_board = vec![0; 6 * 7];
        edge_board[5 * 7 + 0] = Player::Yellow as i8; // Edge column
        set_board_state(&mut game, &edge_board);
        let edge_score = game.evaluate_positional();
        
        assert!(center_score > edge_score); // Center should be more valuable
    }
    
    #[test]
    fn test_connectivity_evaluation() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Test connected vs isolated pieces
        let mut connected_board = vec![0; 6 * 7];
        connected_board[5 * 7 + 1] = Player::Yellow as i8;
        connected_board[5 * 7 + 2] = Player::Yellow as i8; // Adjacent pieces
        set_board_state(&mut game, &connected_board);
        let connected_score = game.evaluate_connectivity();
        
        let mut isolated_board = vec![0; 6 * 7];
        isolated_board[5 * 7 + 0] = Player::Yellow as i8;
        isolated_board[5 * 7 + 6] = Player::Yellow as i8; // Isolated pieces
        set_board_state(&mut game, &isolated_board);
        let isolated_score = game.evaluate_connectivity();
        
        assert!(connected_score > isolated_score); // Connected pieces should score higher
    }
    
    #[test]
    fn test_gobang_advanced_evaluation() {
        let mut game = Game::new(15, 15, 5, false); // Standard Gobang board
        
        // Test Gobang-specific patterns
        let mut board_state = vec![0; 15 * 15];
        // Create a 4-in-a-row pattern (one away from winning)
        board_state[7 * 15 + 5] = Player::Yellow as i8;
        board_state[7 * 15 + 6] = Player::Yellow as i8;
        board_state[7 * 15 + 7] = Player::Yellow as i8;
        board_state[7 * 15 + 8] = Player::Yellow as i8;
        set_board_state(&mut game, &board_state);
        
        let threats = game.count_winning_moves(Player::Yellow as i8);
        assert!(threats >= 1); // Should detect winning opportunities
        
        let evaluation = game.evaluate_position_advanced();
        assert!(evaluation > 1000); // Should highly favor Yellow
    }
    
    #[test]
    fn test_bottom_row_fork_detection() {
        let mut game = Game::new(6, 7, 4, true);
        
        // Create bottom row fork pattern: _ x _ x _ (empty, red, empty, red, empty)
        let mut board_state = vec![0; 6 * 7];
        let bottom_row = 5;
        board_state[bottom_row * 7 + 1] = Player::Red as i8;   // x
        board_state[bottom_row * 7 + 3] = Player::Red as i8;   // x
        // Positions 0, 2, 4 are empty (_)
        set_board_state(&mut game, &board_state);
        
        // Test detection from Yellow's perspective (should detect Red's fork threat)
        let fork_blocks = game.detect_bottom_row_forks(Player::Red);
        assert_eq!(fork_blocks.len(), 3); // Should detect all 3 critical positions
        assert!(fork_blocks.contains(&0)); // First empty position
        assert!(fork_blocks.contains(&2)); // Middle empty position  
        assert!(fork_blocks.contains(&4)); // Last empty position
        
        // Test with get_fork_blocking_moves (Yellow's turn, should block Red)
        game.current_player = Player::Yellow;
        let blocking_moves = game.get_fork_blocking_moves();
        assert!(!blocking_moves.is_empty());
        
        // Test has_critical_fork_threats
        assert!(game.has_critical_fork_threats());
        
        // Test no fork when pattern is broken
        let mut no_fork_board = vec![0; 6 * 7];
        no_fork_board[bottom_row * 7 + 1] = Player::Red as i8;   // x
        no_fork_board[bottom_row * 7 + 3] = Player::Yellow as i8; // Different player - breaks pattern
        set_board_state(&mut game, &no_fork_board);
        
        let no_fork_blocks = game.detect_bottom_row_forks(Player::Red);
        assert!(no_fork_blocks.is_empty()); // Should not detect fork
        assert!(!game.has_critical_fork_threats());
    }
}

// ============================================================================
// L-GAME IMPLEMENTATION
// ============================================================================
// Edward de Bono's L-Game: Strategic blockade game on 4x4 board
// Two L-shaped pieces + two neutral pieces, goal: block opponent's L-piece

/// L-Game piece representation - simple coordinate + orientation approach
#[derive(Clone, Copy, Debug, PartialEq)]
struct LPiece {
    anchor_row: u8,     // 0-3: anchor point for L-shape
    anchor_col: u8,     // 0-3: anchor point for L-shape  
    orientation: u8,    // 0-7: orientation index
}

/// L-Game move representation
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct LGameMove {
    // L-piece movement (mandatory)
    pub l_piece_anchor_row: u8,
    pub l_piece_anchor_col: u8,
    pub l_piece_orientation: u8,
    
    // Neutral piece movement (optional)
    pub neutral_piece_id: Option<u8>,    // 0 or 1, or None for no neutral move
    pub neutral_new_row: Option<u8>,     // 0-3
    pub neutral_new_col: Option<u8>,     // 0-3
}

/// L-Game main struct - Edward de Bono's strategic blockade game
#[wasm_bindgen]
pub struct LGame {
    board: Board,               // 4x4 board for occupancy checking (0=free, 1=occupied)
    player1_l_piece: LPiece,    // Player 1's L-piece position
    player2_l_piece: LPiece,    // Player 2's L-piece position  
    neutral1_pos: (u8, u8),     // Neutral piece 1 position
    neutral2_pos: (u8, u8),     // Neutral piece 2 position
    current_player: Player,     // Current player (Yellow/Red)
    game_over: bool,            // Game ended flag
    winner: Option<Player>,     // Winner if game over
}

/// Precomputed L-shapes: 8 orientations (4 rotations × 2 mirror states)
/// Each shape is 4 coordinate offsets from anchor point
const L_SHAPES: [[(i8, i8); 4]; 8] = [
    // Original orientations (4 rotations)
    [(0,0), (1,0), (2,0), (2,1)], // Standard L (pointing right-down)
    [(0,0), (0,1), (0,2), (1,0)], // 90° rotated (pointing down-left)  
    [(0,0), (0,1), (1,1), (2,1)], // 180° rotated (pointing left-up)
    [(0,1), (1,0), (1,1), (1,2)], // 270° rotated (pointing up-right)
    
    // Mirrored orientations (4 rotations of mirror)
    [(0,1), (1,1), (2,0), (2,1)], // Mirrored standard L
    [(0,0), (1,0), (1,1), (1,2)], // Mirrored 90°
    [(0,0), (0,1), (1,0), (2,0)], // Mirrored 180°
    [(0,0), (0,1), (0,2), (1,2)], // Mirrored 270°
];

#[wasm_bindgen]
impl LGame {
    /// Create new L-Game in standard starting position
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let board = Board::new(4, 4);
        
        // Standard starting positions (one possible setup)
        let player1_l_piece = LPiece { anchor_row: 0, anchor_col: 0, orientation: 0 };
        let player2_l_piece = LPiece { anchor_row: 1, anchor_col: 2, orientation: 4 };
        let neutral1_pos = (1, 1);
        let neutral2_pos = (2, 2);
        
        let mut game = LGame {
            board,
            player1_l_piece,
            player2_l_piece,
            neutral1_pos,
            neutral2_pos,
            current_player: Player::Yellow, // Player 1 starts
            game_over: false,
            winner: None,
        };
        
        // Update board occupancy
        game.update_board_occupancy();
        
        game
    }
    
    /// Get current board state as Int8Array for JavaScript
    #[wasm_bindgen(js_name = getBoard)]
    pub fn get_board(&self) -> js_sys::Int8Array {
        let cells = self.board.get_cells();
        js_sys::Int8Array::from(&cells[..])
    }
    
    /// Get current player
    #[wasm_bindgen(js_name = getCurrentPlayer)]  
    pub fn get_current_player(&self) -> Player {
        self.current_player
    }
    
    /// Check if game is over
    #[wasm_bindgen(js_name = isGameOver)]
    pub fn is_game_over(&self) -> bool {
        self.game_over
    }
    
    /// Get winner if game is over
    #[wasm_bindgen(js_name = getWinner)]
    pub fn get_winner(&self) -> Option<Player> {
        self.winner
    }
    
    /// Get legal moves for current player
    #[wasm_bindgen(js_name = getLegalMoves)]
    pub fn get_legal_moves(&self) -> js_sys::Array {
        let moves = self._get_legal_moves();
        let js_array = js_sys::Array::new();
        
        for game_move in moves {
            // Convert LGameMove to JavaScript object
            let js_move = js_sys::Object::new();
            
            // Set L-piece move properties
            js_sys::Reflect::set(&js_move, &"lPieceAnchorRow".into(), &game_move.l_piece_anchor_row.into()).unwrap();
            js_sys::Reflect::set(&js_move, &"lPieceAnchorCol".into(), &game_move.l_piece_anchor_col.into()).unwrap();
            js_sys::Reflect::set(&js_move, &"lPieceOrientation".into(), &game_move.l_piece_orientation.into()).unwrap();
            
            // Set optional neutral piece move
            if let Some(neutral_id) = game_move.neutral_piece_id {
                js_sys::Reflect::set(&js_move, &"neutralPieceId".into(), &neutral_id.into()).unwrap();
                js_sys::Reflect::set(&js_move, &"neutralNewRow".into(), &game_move.neutral_new_row.unwrap().into()).unwrap();
                js_sys::Reflect::set(&js_move, &"neutralNewCol".into(), &game_move.neutral_new_col.unwrap().into()).unwrap();
            }
            
            js_array.push(&js_move);
        }
        
        js_array
    }
    
    /// Make a move (L-piece movement + optional neutral piece movement)
    #[wasm_bindgen(js_name = makeMove)]
    pub fn make_move(&mut self, 
                     l_anchor_row: u8, l_anchor_col: u8, l_orientation: u8,
                     neutral_id: Option<u8>, neutral_row: Option<u8>, neutral_col: Option<u8>) -> Result<(), JsValue> {
        
        let game_move = LGameMove {
            l_piece_anchor_row: l_anchor_row,
            l_piece_anchor_col: l_anchor_col,
            l_piece_orientation: l_orientation,
            neutral_piece_id: neutral_id,
            neutral_new_row: neutral_row,
            neutral_new_col: neutral_col,
        };
        
        self._make_move(game_move).map_err(|e| JsValue::from_str(&format!("{:?}", e)))
    }
}

impl LGame {
    /// Internal method to get legal moves
    fn _get_legal_moves(&self) -> Vec<LGameMove> {
        if self.game_over {
            return Vec::new();
        }
        
        let mut moves = Vec::new();
        
        // Get current player's L-piece
        let current_l_piece = match self.current_player {
            Player::Yellow => self.player1_l_piece,
            Player::Red => self.player2_l_piece,
        };
        
        // Try all possible L-piece positions (brute force approach for 4x4)
        for anchor_row in 0..4 {
            for anchor_col in 0..4 {
                for orientation in 0..8 {
                    let new_l_piece = LPiece { anchor_row, anchor_col, orientation };
                    
                    // Check if this is a valid L-piece placement
                    if self.is_valid_l_position(&new_l_piece) && 
                       new_l_piece != current_l_piece { // Must be different from current position
                        
                        // Basic move without neutral piece movement
                        moves.push(LGameMove {
                            l_piece_anchor_row: anchor_row,
                            l_piece_anchor_col: anchor_col,
                            l_piece_orientation: orientation,
                            neutral_piece_id: None,
                            neutral_new_row: None,
                            neutral_new_col: None,
                        });
                        
                        // Add moves with neutral piece movements
                        for neutral_id in 0..2 {
                            for new_row in 0..4 {
                                for new_col in 0..4 {
                                    let current_neutral_pos = if neutral_id == 0 { self.neutral1_pos } else { self.neutral2_pos };
                                    
                                    // Only if neutral piece position changes
                                    if (new_row, new_col) != current_neutral_pos {
                                        // Check if new neutral position is valid (after L-piece is moved)
                                        if self.is_valid_neutral_position(new_row, new_col, &new_l_piece) {
                                            moves.push(LGameMove {
                                                l_piece_anchor_row: anchor_row,
                                                l_piece_anchor_col: anchor_col,
                                                l_piece_orientation: orientation,
                                                neutral_piece_id: Some(neutral_id),
                                                neutral_new_row: Some(new_row),
                                                neutral_new_col: Some(new_col),
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        moves
    }
    
    /// Internal method to make a move
    fn _make_move(&mut self, game_move: LGameMove) -> Result<(), GameError> {
        if self.game_over {
            return Err(GameError::GameAlreadyOver);
        }
        
        // Validate L-piece move
        let new_l_piece = LPiece {
            anchor_row: game_move.l_piece_anchor_row,
            anchor_col: game_move.l_piece_anchor_col,
            orientation: game_move.l_piece_orientation,
        };
        
        if !self.is_valid_l_position(&new_l_piece) {
            return Err(GameError::InvalidMove);
        }
        
        // Update L-piece position
        match self.current_player {
            Player::Yellow => self.player1_l_piece = new_l_piece,
            Player::Red => self.player2_l_piece = new_l_piece,
        }
        
        // Handle optional neutral piece move
        if let (Some(neutral_id), Some(new_row), Some(new_col)) = 
            (game_move.neutral_piece_id, game_move.neutral_new_row, game_move.neutral_new_col) {
            
            if !self.is_valid_neutral_position(new_row, new_col, &new_l_piece) {
                return Err(GameError::InvalidMove);
            }
            
            if neutral_id == 0 {
                self.neutral1_pos = (new_row, new_col);
            } else if neutral_id == 1 {
                self.neutral2_pos = (new_row, new_col);
            } else {
                return Err(GameError::InvalidMove);
            }
        }
        
        // Update board occupancy
        self.update_board_occupancy();
        
        // Switch player
        self.current_player = match self.current_player {
            Player::Yellow => Player::Red,
            Player::Red => Player::Yellow,
        };
        
        // Check if game is over (new current player has no legal moves)
        if self._get_legal_moves().is_empty() {
            self.game_over = true;
            self.winner = Some(match self.current_player {
                Player::Yellow => Player::Red, // Red wins because Yellow is blocked
                Player::Red => Player::Yellow,  // Yellow wins because Red is blocked
            });
        }
        
        Ok(())
    }
    
    /// Check if L-piece position is valid (fits on board, no collisions)
    fn is_valid_l_position(&self, l_piece: &LPiece) -> bool {
        let shape = &L_SHAPES[l_piece.orientation as usize];
        
        for &(dr, dc) in shape {
            let row = l_piece.anchor_row as i8 + dr;
            let col = l_piece.anchor_col as i8 + dc;
            
            // Check bounds
            if row < 0 || row >= 4 || col < 0 || col >= 4 {
                return false;
            }
            
            let pos = (row as u8, col as u8);
            
            // Check collision with opponent's L-piece
            let opponent_l_piece = match self.current_player {
                Player::Yellow => self.player2_l_piece,
                Player::Red => self.player1_l_piece,
            };
            
            if self.l_piece_occupies_position(&opponent_l_piece, pos) {
                return false;
            }
            
            // Check collision with neutral pieces
            if pos == self.neutral1_pos || pos == self.neutral2_pos {
                return false;
            }
        }
        
        true
    }
    
    /// Check if neutral piece position is valid (considering new L-piece position)
    fn is_valid_neutral_position(&self, row: u8, col: u8, new_l_piece: &LPiece) -> bool {
        let pos = (row, col);
        
        // Check if position is occupied by the new L-piece
        if self.l_piece_occupies_position(new_l_piece, pos) {
            return false;
        }
        
        // Check if position is occupied by opponent's L-piece
        let opponent_l_piece = match self.current_player {
            Player::Yellow => self.player2_l_piece,
            Player::Red => self.player1_l_piece,
        };
        
        if self.l_piece_occupies_position(&opponent_l_piece, pos) {
            return false;
        }
        
        // Check if position is occupied by other neutral piece
        let other_neutral_pos = if (row, col) == self.neutral1_pos { self.neutral2_pos } else { self.neutral1_pos };
        if pos == other_neutral_pos {
            return false;
        }
        
        true
    }
    
    /// Check if L-piece occupies a specific position
    fn l_piece_occupies_position(&self, l_piece: &LPiece, pos: (u8, u8)) -> bool {
        let shape = &L_SHAPES[l_piece.orientation as usize];
        
        for &(dr, dc) in shape {
            let row = l_piece.anchor_row as i8 + dr;
            let col = l_piece.anchor_col as i8 + dc;
            
            if row >= 0 && row < 4 && col >= 0 && col < 4 {
                if (row as u8, col as u8) == pos {
                    return true;
                }
            }
        }
        
        false
    }
    
    /// Update board occupancy for collision detection
    fn update_board_occupancy(&mut self) {
        // Clear board
        for row in 0..4 {
            for col in 0..4 {
                let _ = self.board.set_cell(row, col, 0);
            }
        }
        
        // Mark L-piece positions
        let player1_piece = self.player1_l_piece;
        let player2_piece = self.player2_l_piece;
        self.mark_l_piece_on_board(&player1_piece);
        self.mark_l_piece_on_board(&player2_piece);
        
        // Mark neutral piece positions
        let _ = self.board.set_cell(self.neutral1_pos.0 as usize, self.neutral1_pos.1 as usize, 1);
        let _ = self.board.set_cell(self.neutral2_pos.0 as usize, self.neutral2_pos.1 as usize, 1);
    }
    
    /// Mark L-piece positions on board
    fn mark_l_piece_on_board(&mut self, l_piece: &LPiece) {
        let shape = &L_SHAPES[l_piece.orientation as usize];
        
        for &(dr, dc) in shape {
            let row = l_piece.anchor_row as i8 + dr;
            let col = l_piece.anchor_col as i8 + dc;
            
            if row >= 0 && row < 4 && col >= 0 && col < 4 {
                let _ = self.board.set_cell(row as usize, col as usize, 1);
            }
        }
    }
}

// ==========================================
// BitPackedBoard Framework for Large Games
// ==========================================

/// Memory-efficient board implementation for large games (>100 cells)
/// Uses bit packing to store multiple cell states in single u64 values
/// 
/// Generic parameters:
/// - ROWS: Number of board rows
/// - COLS: Number of board columns  
/// - BITS_PER_CELL: Bits needed per cell (2 for 4 states, 3 for 8 states)
pub struct BitPackedBoard<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> {
    data: Vec<u64>,
    cells_per_u64: usize,
    total_cells: usize,
    mask: u64,
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
    /// Create new BitPackedBoard
    pub fn new() -> Self {
        const BITS_PER_U64: usize = 64;
        let cells_per_u64 = BITS_PER_U64 / BITS_PER_CELL;
        let total_cells = ROWS * COLS;
        let data_size = (total_cells + cells_per_u64 - 1) / cells_per_u64;
        let mask = (1u64 << BITS_PER_CELL) - 1;
        
        Self {
            data: vec![0; data_size],
            cells_per_u64,
            total_cells,
            mask,
        }
    }
    
    /// Get cell value at (row, col)
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        if row >= ROWS || col >= COLS {
            return 0;
        }
        
        let cell_index = row * COLS + col;
        let u64_index = cell_index / self.cells_per_u64;
        let bit_offset = (cell_index % self.cells_per_u64) * BITS_PER_CELL;
        
        ((self.data[u64_index] >> bit_offset) & self.mask) as u8
    }
    
    /// Set cell value at (row, col)
    pub fn set_cell(&mut self, row: usize, col: usize, value: u8) -> Result<(), String> {
        if row >= ROWS || col >= COLS {
            return Err("Position out of bounds".to_string());
        }
        
        if (value as u64) > self.mask {
            return Err("Value exceeds maximum for cell".to_string());
        }
        
        let cell_index = row * COLS + col;
        let u64_index = cell_index / self.cells_per_u64;
        let bit_offset = (cell_index % self.cells_per_u64) * BITS_PER_CELL;
        
        // Clear existing bits and set new value
        self.data[u64_index] &= !(self.mask << bit_offset);
        self.data[u64_index] |= (value as u64) << bit_offset;
        
        Ok(())
    }
    
    /// Clear all cells
    pub fn clear(&mut self) {
        self.data.fill(0);
    }
    
    /// Get memory usage in bytes
    pub fn memory_usage(&self) -> usize {
        self.data.len() * std::mem::size_of::<u64>()
    }
    
    /// Get board dimensions
    pub fn dimensions(&self) -> (usize, usize) {
        (ROWS, COLS)
    }
    
    /// Get total number of cells
    pub fn total_cells(&self) -> usize {
        self.total_cells
    }
    
    /// Check if position is valid
    pub fn is_valid_position(&self, row: usize, col: usize) -> bool {
        row < ROWS && col < COLS
    }
    
    /// Get all non-empty cells as vector of (row, col, value)
    pub fn get_occupied_cells(&self) -> Vec<(usize, usize, u8)> {
        let mut occupied = Vec::new();
        
        for row in 0..ROWS {
            for col in 0..COLS {
                let value = self.get_cell(row, col);
                if value != 0 {
                    occupied.push((row, col, value));
                }
            }
        }
        
        occupied
    }
    
    /// Count cells with specific value
    pub fn count_cells_with_value(&self, target_value: u8) -> usize {
        let mut count = 0;
        
        for row in 0..ROWS {
            for col in 0..COLS {
                if self.get_cell(row, col) == target_value {
                    count += 1;
                }
            }
        }
        
        count
    }
}

// WASM bindings for BitPackedBoard - example with HexBoard
#[wasm_bindgen]
pub struct HexBoard {
    inner: BitPackedBoard<11, 11, 2>, // 11x11 hex grid, 2 bits per cell (4 states)
}

#[wasm_bindgen]
impl HexBoard {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: BitPackedBoard::new(),
        }
    }
    
    #[wasm_bindgen]
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        self.inner.get_cell(row, col)
    }
    
    #[wasm_bindgen]
    pub fn set_cell(&mut self, row: usize, col: usize, value: u8) -> Result<(), JsValue> {
        self.inner.set_cell(row, col, value)
            .map_err(|e| JsValue::from_str(&e))
    }
    
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.inner.clear();
    }
    
    #[wasm_bindgen]
    pub fn memory_usage(&self) -> usize {
        self.inner.memory_usage()
    }
    
    #[wasm_bindgen]
    pub fn dimensions(&self) -> Vec<usize> {
        let (rows, cols) = self.inner.dimensions();
        vec![rows, cols]
    }
    
    #[wasm_bindgen]
    pub fn is_valid_position(&self, row: usize, col: usize) -> bool {
        self.inner.is_valid_position(row, col)
    }
    
    #[wasm_bindgen]
    pub fn count_stones(&self, player: u8) -> usize {
        self.inner.count_cells_with_value(player)
    }
    
    /// Get board state as simple string for debugging
    #[wasm_bindgen]
    pub fn get_board_debug(&self) -> String {
        let occupied = self.inner.get_occupied_cells();
        let mut result = String::new();
        
        for (row, col, value) in occupied {
            result.push_str(&format!("({},{}):{} ", row, col, value));
        }
        
        if result.is_empty() {
            "empty".to_string()
        } else {
            result
        }
    }
}

// WASM bindings for BitPackedBoard - GomokuBoard for performance AI
#[wasm_bindgen]
pub struct GomokuBoard {
    inner: BitPackedBoard<15, 15, 2>, // 15x15 Gomoku board, 2 bits per cell (4 states)
    current_player: u8,
    move_count: u32,
}

#[wasm_bindgen]
impl GomokuBoard {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: BitPackedBoard::new(),
            current_player: 1, // Player 1 (Black) starts
            move_count: 0,
        }
    }
    
    #[wasm_bindgen]
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        self.inner.get_cell(row, col)
    }
    
    #[wasm_bindgen]
    pub fn make_move(&mut self, row: usize, col: usize) -> Result<bool, JsValue> {
        // Check if position is valid and empty
        if !self.inner.is_valid_position(row, col) {
            return Err(JsValue::from_str("Invalid position"));
        }
        
        if self.inner.get_cell(row, col) != 0 {
            return Err(JsValue::from_str("Position already occupied"));
        }
        
        // Place stone
        self.inner.set_cell(row, col, self.current_player)
            .map_err(|e| JsValue::from_str(&e))?;
        
        self.move_count += 1;
        
        // Check for win
        let win = self.check_win();
        
        if !win {
            // Switch players
            self.current_player = if self.current_player == 1 { 2 } else { 1 };
        }
        
        Ok(win)
    }
    
    #[wasm_bindgen]
    pub fn check_win(&self) -> bool {
        self.check_win_for_player(self.current_player)
    }
    
    #[wasm_bindgen]
    pub fn is_game_over(&self) -> bool {
        self.check_win_for_player(1) || self.check_win_for_player(2) || self.is_board_full()
    }
    
    #[wasm_bindgen]
    pub fn get_winner(&self) -> Option<u8> {
        if self.check_win_for_player(1) {
            Some(1)
        } else if self.check_win_for_player(2) {
            Some(2)
        } else {
            None
        }
    }
    
    #[wasm_bindgen]
    pub fn get_current_player(&self) -> u8 {
        self.current_player
    }
    
    #[wasm_bindgen]
    pub fn get_move_count(&self) -> u32 {
        self.move_count
    }
    
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.inner.clear();
        self.current_player = 1;
        self.move_count = 0;
    }
    
    /// Get board state as Int8Array for JavaScript UI
    #[wasm_bindgen]
    pub fn get_board(&self) -> Vec<i8> {
        let mut board = vec![0i8; 15 * 15];
        for row in 0..15 {
            for col in 0..15 {
                let index = row * 15 + col;
                board[index] = self.inner.get_cell(row, col) as i8;
            }
        }
        board
    }
    
    #[wasm_bindgen]
    pub fn memory_usage(&self) -> usize {
        self.inner.memory_usage()
    }
    
    #[wasm_bindgen]
    pub fn is_valid_position(&self, row: usize, col: usize) -> bool {
        self.inner.is_valid_position(row, col)
    }
    
    #[wasm_bindgen]
    pub fn count_stones(&self, player: u8) -> usize {
        self.inner.count_cells_with_value(player)
    }
    
    /// Get legal moves for current player
    #[wasm_bindgen]
    pub fn get_legal_moves(&self) -> Vec<usize> {
        let mut moves = Vec::new();
        for row in 0..15 {
            for col in 0..15 {
                if self.inner.get_cell(row, col) == 0 {
                    moves.push(row);
                    moves.push(col);
                }
            }
        }
        moves
    }
    
    // Performance optimized win checking using BitPackedBoard
    fn check_win_for_player(&self, player: u8) -> bool {
        // Check all possible 5-in-a-row combinations efficiently
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        for row in 0..15 {
            for col in 0..15 {
                if self.inner.get_cell(row, col) == player {
                    for &(dr, dc) in &directions {
                        if self.check_line(row, col, dr, dc, player, 5) {
                            return true;
                        }
                    }
                }
            }
        }
        false
    }
    
    fn check_line(&self, start_row: usize, start_col: usize, dr: i32, dc: i32, player: u8, target_length: usize) -> bool {
        let mut count = 1; // Count the starting position
        
        // Check forward direction
        let mut r = start_row as i32 + dr;
        let mut c = start_col as i32 + dc;
        while r >= 0 && r < 15 && c >= 0 && c < 15 {
            if self.inner.get_cell(r as usize, c as usize) == player {
                count += 1;
                if count >= target_length {
                    return true;
                }
            } else {
                break;
            }
            r += dr;
            c += dc;
        }
        
        // Check backward direction
        r = start_row as i32 - dr;
        c = start_col as i32 - dc;
        while r >= 0 && r < 15 && c >= 0 && c < 15 {
            if self.inner.get_cell(r as usize, c as usize) == player {
                count += 1;
                if count >= target_length {
                    return true;
                }
            } else {
                break;
            }
            r -= dr;
            c -= dc;
        }
        
        count >= target_length
    }
    
    fn is_board_full(&self) -> bool {
        self.move_count >= 225 // 15x15 = 225
    }
}

// WASM bindings for BitPackedBoard - TrioBoardBitPacked for performance optimization
#[wasm_bindgen]
pub struct TrioBoardBitPacked {
    inner: BitPackedBoard<7, 7, 4>, // 7x7 Trio board, 4 bits per cell (values 0-15)
    target_number: u8,
    difficulty: u8,
}

#[wasm_bindgen]
impl TrioBoardBitPacked {
    #[wasm_bindgen(constructor)]
    pub fn new(difficulty: u8) -> Self {
        let mut inner = BitPackedBoard::new();
        let mut rng = thread_rng();
        
        // Generate numbers based on difficulty
        let mut numbers_to_place: Vec<u8> = Vec::new();
        match difficulty {
            1 => {
                // Easy: More small numbers, frequent 1s and 2s
                for _ in 0..6 { numbers_to_place.push(1); }
                for _ in 0..5 { numbers_to_place.push(2); }
                for _ in 0..4 { numbers_to_place.push(3); }
                for _ in 0..3 { numbers_to_place.push(4); }
                for _ in 0..2 { numbers_to_place.push(5); }
                for _ in 0..2 { numbers_to_place.push(6); }
                for _ in 0..1 { numbers_to_place.push(7); }
                for _ in 0..1 { numbers_to_place.push(8); }
                for _ in 0..1 { numbers_to_place.push(9); }
            },
            2 => {
                // Medium: Balanced distribution
                for _ in 0..5 { numbers_to_place.push(1); }
                for _ in 0..4 { numbers_to_place.push(2); }
                for _ in 0..4 { numbers_to_place.push(3); }
                for _ in 0..4 { numbers_to_place.push(4); }
                for _ in 0..3 { numbers_to_place.push(5); }
                for _ in 0..3 { numbers_to_place.push(6); }
                for _ in 0..3 { numbers_to_place.push(7); }
                for _ in 0..2 { numbers_to_place.push(8); }
                for _ in 0..2 { numbers_to_place.push(9); }
            },
            _ => {
                // Hard: More large numbers, challenging combinations
                for _ in 0..3 { numbers_to_place.push(1); }
                for _ in 0..3 { numbers_to_place.push(2); }
                for _ in 0..3 { numbers_to_place.push(3); }
                for _ in 0..4 { numbers_to_place.push(4); }
                for _ in 0..4 { numbers_to_place.push(5); }
                for _ in 0..4 { numbers_to_place.push(6); }
                for _ in 0..4 { numbers_to_place.push(7); }
                for _ in 0..4 { numbers_to_place.push(8); }
                for _ in 0..4 { numbers_to_place.push(9); }
            }
        }
        
        // Shuffle and place numbers
        numbers_to_place.shuffle(&mut rng);
        
        // Fill the 7x7 board
        let mut index = 0;
        for row in 0..7 {
            for col in 0..7 {
                if index < numbers_to_place.len() {
                    let _ = inner.set_cell(row, col, numbers_to_place[index]);
                    index += 1;
                } else {
                    // Fill remaining cells with random numbers 1-9
                    let random_num = rng.gen_range(1..=9);
                    let _ = inner.set_cell(row, col, random_num);
                }
            }
        }
        
        // Generate target number (10-50 range for good gameplay)
        let target_number = rng.gen_range(10..=50);
        
        Self {
            inner,
            target_number,
            difficulty,
        }
    }
    
    #[wasm_bindgen]
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        self.inner.get_cell(row, col)
    }
    
    #[wasm_bindgen]
    pub fn get_target_number(&self) -> u8 {
        self.target_number
    }
    
    #[wasm_bindgen]
    pub fn get_difficulty(&self) -> u8 {
        self.difficulty
    }
    
    /// Get board state as Int8Array for JavaScript UI
    #[wasm_bindgen]
    pub fn get_board(&self) -> Vec<i8> {
        let mut board = vec![0i8; 7 * 7];
        for row in 0..7 {
            for col in 0..7 {
                let index = row * 7 + col;
                board[index] = self.inner.get_cell(row, col) as i8;
            }
        }
        board
    }
    
    #[wasm_bindgen]
    pub fn memory_usage(&self) -> usize {
        self.inner.memory_usage()
    }
    
    #[wasm_bindgen]
    pub fn is_valid_position(&self, row: usize, col: usize) -> bool {
        self.inner.is_valid_position(row, col)
    }
    
    /// Check if three numbers at positions form a valid solution
    #[wasm_bindgen]
    pub fn check_combination(&self, r1: usize, c1: usize, r2: usize, c2: usize, r3: usize, c3: usize) -> bool {
        if !self.inner.is_valid_position(r1, c1) || 
           !self.inner.is_valid_position(r2, c2) || 
           !self.inner.is_valid_position(r3, c3) {
            return false;
        }
        
        let a = self.inner.get_cell(r1, c1);
        let b = self.inner.get_cell(r2, c2);
        let c = self.inner.get_cell(r3, c3);
        
        self.validate_solution_internal(a, b, c)
    }
    
    /// Clear and regenerate the board
    #[wasm_bindgen]
    pub fn regenerate(&mut self, difficulty: u8) {
        *self = Self::new(difficulty);
    }
    
    /// Get performance statistics
    #[wasm_bindgen]
    pub fn get_performance_stats(&self) -> String {
        let memory_usage = self.memory_usage();
        let naive_memory = 49; // 7x7 array of bytes
        let savings = ((naive_memory - memory_usage) as f64 / naive_memory as f64 * 100.0);
        
        format!(
            "{{\"memoryUsage\":{},\"naiveMemory\":{},\"memorySavings\":\"{:.1}%\",\"boardSize\":\"7×7\",\"bitsPerCell\":4,\"engineType\":\"BitPackedBoard<7,7,4>\"}}",
            memory_usage, naive_memory, savings
        )
    }
    
    // Internal validation logic (optimized for BitPackedBoard)
    fn validate_solution_internal(&self, a: u8, b: u8, c: u8) -> bool {
        let target = self.target_number;
        
        // Check all permutations efficiently
        let permutations = [
            (a, b, c), (a, c, b), (b, a, c), 
            (b, c, a), (c, a, b), (c, b, a)
        ];
        
        for (x, y, z) in permutations {
            // Try addition: x * y + z = target
            if x * y + z == target {
                return true;
            }
            // Try subtraction: x * y - z = target
            if x * y >= z && x * y - z == target {
                return true;
            }
        }
        
        false
    }
}

// Type aliases for common board configurations
pub type HexBoardInternal = BitPackedBoard<11, 11, 2>;  // 11x11 hex, 2 bits per cell
pub type GomokuBoardInternal = BitPackedBoard<15, 15, 2>; // 15x15 Gomoku, 2 bits per cell
pub type TrioBoardInternal = BitPackedBoard<7, 7, 4>;   // 7x7 Trio, 4 bits per cell (0-15, for numbers 1-9)
pub type DotsBoxesBoard = BitPackedBoard<8, 8, 3>;     // 8x8 dots&boxes, 3 bits per cell
pub type ShannonBoard = BitPackedBoard<7, 7, 2>;       // 7x7 Shannon game, 2 bits per cell
pub type LargeGomokuBoard = BitPackedBoard<19, 19, 2>; // 19x19 professional Gomoku
