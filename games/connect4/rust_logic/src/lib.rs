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
}
