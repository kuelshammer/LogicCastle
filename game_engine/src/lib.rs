use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;
use rand::Rng;
use rand::thread_rng;

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
use std::collections::HashMap;

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

    pub fn get_cell(&self, row: usize, col: usize) -> Result<i8, String> {
        if row >= self.rows || col >= self.cols {
            return Err("Coordinates out of bounds".to_string());
        }
        let index = row * self.cols + col;
        Ok(self.cells[index])
    }

    pub fn set_cell(&mut self, row: usize, col: usize, value: i8) -> Result<(), String> {
        if row >= self.rows || col >= self.cols {
            return Err("Coordinates out of bounds".to_string());
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
            current_player: Player::Yellow, // Yellow starts
        }
    }

    // This function will be exposed to JS, so we need to convert the String error to JsValue
    pub fn make_move_connect4_js(&mut self, col: usize) -> Result<(), JsValue> {
        self._make_move_connect4(col).map_err(|e| JsValue::from_str(&e))
    }

    pub fn make_move_gobang_js(&mut self, row: usize, col: usize) -> Result<(), JsValue> {
        self._make_move_gobang(row, col).map_err(|e| JsValue::from_str(&e))
    }

    // Internal make_move for Connect4 that returns a Rust String error
    fn _make_move_connect4(&mut self, col: usize) -> Result<(), String> {
        if col >= self.board.cols {
            return Err("Column out of bounds".to_string());
        }

        if self.gravity_enabled {
            // Find the lowest empty spot in the column
            for row in (0..self.board.rows).rev() {
                if self.board.get_cell(row, col).unwrap() == 0 { // Check if empty (0)
                    self.board.set_cell(row, col, self.current_player.into()).unwrap(); // Convert Player to i8
                    self.current_player = match self.current_player {
                        Player::Yellow => Player::Red,
                        Player::Red => Player::Yellow,
                    };
                    return Ok(());
                }
            }
            Err("Column is full".to_string())
        } else {
            Err("Gravity is disabled for this game. Use make_move_gobang_js for precise placement.".to_string())
        }
    }

    // Internal make_move for Gobang that returns a Rust String error
    fn _make_move_gobang(&mut self, row: usize, col: usize) -> Result<(), String> {
        if !self.board.is_within_bounds(row as isize, col as isize) {
            return Err("Row or column out of bounds".to_string());
        }

        if self.board.get_cell(row, col).unwrap() == 0 { // Check if empty (0)
            self.board.set_cell(row, col, self.current_player.into()).unwrap(); // Convert Player to i8
            self.current_player = match self.current_player {
                Player::Yellow => Player::Red,
                Player::Red => Player::Yellow,
            };
            Ok(())
        } else {
            Err("Spot is already occupied".to_string())
        }
    }
        

    pub fn check_win(&self) -> Option<Player> {
        self._check_win_internal()
    }

    // Internal function to check for a win condition
    fn _check_win_internal(&self) -> Option<Player> {
        // Check horizontal wins
        for r in 0..self.board.rows {
            for c in 0..=(self.board.cols - self.win_condition) {
                let cell_value = self.board.get_cell(r, c).unwrap();
                if cell_value != 0 {
                    let player_at_cell = Player::try_from(cell_value).unwrap();
                    if let Some(player) = self._check_direction(r, c, 0, 1, player_at_cell) {
                        return Some(player);
                    }
                }
            }
        }

        // Check vertical wins
        for r in 0..=(self.board.rows - self.win_condition) {
            for c in 0..self.board.cols {
                let cell_value = self.board.get_cell(r, c).unwrap();
                if cell_value != 0 {
                    let player_at_cell = Player::try_from(cell_value).unwrap();
                    if let Some(player) = self._check_direction(r, c, 1, 0, player_at_cell) {
                        return Some(player);
                    }
                }
            }
        }

        // Check diagonal wins (top-left to bottom-right)
        for r in 0..=(self.board.rows - self.win_condition) {
            for c in 0..=(self.board.cols - self.win_condition) {
                let cell_value = self.board.get_cell(r, c).unwrap();
                if cell_value != 0 {
                    let player_at_cell = Player::try_from(cell_value).unwrap();
                    if let Some(player) = self._check_direction(r, c, 1, 1, player_at_cell) {
                        return Some(player);
                    }
                }
            }
        }

        // Check diagonal wins (top-right to bottom-left)
        for r in 0..=(self.board.rows - self.win_condition) {
            for c in (self.win_condition - 1)..self.board.cols {
                let cell_value = self.board.get_cell(r, c).unwrap();
                if cell_value != 0 {
                    let player_at_cell = Player::try_from(cell_value).unwrap();
                    if let Some(player) = self._check_direction(r, c, 1, -1, player_at_cell) {
                        return Some(player);
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

            let cell_value = self.board.get_cell(r as usize, c as usize).unwrap();

            if cell_value == 0 || Player::try_from(cell_value).unwrap() != player_to_check {
                return None; // Empty cell or different player
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
    
    /// Fast clone for AI simulations - essential for minimax/MCTS
    pub fn fast_clone(&self) -> Game {
        Game {
            board: self.board.fast_clone(),
            win_condition: self.win_condition,
            gravity_enabled: self.gravity_enabled,
            current_player: self.current_player,
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
                    board.set_cell(r, c, num as i8).unwrap();
                } else {
                    // This should not happen
                    board.set_cell(r, c, 0).unwrap(); 
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

            let n1 = board.get_cell(r1, c1).unwrap() as f64;
            let n2 = board.get_cell(r2, c2).unwrap() as f64;
            let n3 = board.get_cell(r3, c3).unwrap() as f64;

            let ops: [fn(f64, f64) -> f64; 4] = [|a, b| a + b, |a, b| a - b, |a, b| a * b, |a, b| a / b];
            let op1 = ops.choose(&mut rng).unwrap();
            let op2 = ops.choose(&mut rng).unwrap();

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
        let n1 = self.board.get_cell(r1, c1).unwrap() as f64;
        let n2 = self.board.get_cell(r2, c2).unwrap() as f64;
        let n3 = self.board.get_cell(r3, c3).unwrap() as f64;
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
