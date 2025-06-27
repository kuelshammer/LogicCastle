use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;
use rand::Rng;
use rand::thread_rng;

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
    
    /// Check if game is in terminal state (win/draw)
    pub fn is_terminal(&self) -> bool {
        self.check_win().is_some() || self.board.is_full()
    }
    
    /// Evaluate position for AI (simple heuristic)
    /// Returns: +1000 for current player win, -1000 for opponent win, 0 otherwise
    pub fn evaluate_position(&self) -> i32 {
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
                    // Simple material evaluation (could be enhanced)
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
}
