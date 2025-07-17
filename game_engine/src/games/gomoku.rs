use wasm_bindgen::prelude::*;
use crate::data::BitPackedBoard;
use crate::geometry::{GomokuGrid, BoardGeometry, PatternProvider};
use crate::ai::GomokuAI;
use crate::{GamePhase, Player};

/// A struct to represent an AI move for wasm-bindgen.
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct AiMove {
    pub row: usize,
    pub col: usize,
}

/// Gomoku/Gobang game implementation using the Three-Layer Architecture
/// Composes geometry and data layers for clean separation of concerns
#[wasm_bindgen]
#[derive(Clone)]
pub struct GomokuGame {
    // Composition: Geometry layer handles coordinate logic
    geometry: GomokuGrid,
    
    // Composition: Data layer handles efficient storage (15x15 board)
    black_board: BitPackedBoard<15, 15, 2>,
    white_board: BitPackedBoard<15, 15, 2>,
    
    // Composition: AI layer for strategic evaluation
    ai: GomokuAI,
    
    // Game-specific state
    current_player: Player,
    winner: Option<Player>,
    move_count: usize,
    move_history: Vec<(usize, usize)>, // Store move positions for undo functionality
}

#[wasm_bindgen]
impl GomokuGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::new_with_starting_player(Player::Black)
    }
    
    /// Create a new Gomoku game with a specific starting player
    /// This is essential for game series where "loser starts next game"
    pub fn new_with_starting_player(starting_player: Player) -> Self {
        Self {
            geometry: GomokuGrid::new(),
            black_board: BitPackedBoard::new(),
            white_board: BitPackedBoard::new(),
            ai: GomokuAI::new(),
            current_player: starting_player,
            winner: None,
            move_count: 0,
            move_history: Vec::new(),
        }
    }
    
    /// Make a move at the specified position (row, col)
    /// Gomoku allows free placement anywhere on the board
    #[wasm_bindgen]
    pub fn make_move(&mut self, row: usize, col: usize) -> Result<bool, JsValue> {
        // Validate coordinates
        if row >= 15 || col >= 15 {
            return Err(JsValue::from_str("Invalid coordinates"));
        }
        
        // Check if position is already occupied
        if self.get_cell(row, col) != 0 {
            return Err(JsValue::from_str("Position already occupied"));
        }
        
        // Check if game is over
        if self.winner.is_some() {
            return Err(JsValue::from_str("Game is already over"));
        }
        
        // Use geometry layer to get the index
        let index = self.geometry.to_index((row as i32, col as i32))
            .ok_or_else(|| JsValue::from_str("Invalid position"))?;
        
        // Use data layer to place the stone
        let player_board = self.get_current_player_board_mut();
        player_board.set_bit(index, true);
        
        // Update move history
        self.move_history.push((row, col));
        self.move_count += 1;
        
        // Check for win condition (5 in a row)
        let won = self.check_win_condition();
        
        if !won {
            // Switch players
            self.current_player = self.current_player.opponent();
        }
        
        Ok(won)
    }
    
    /// Check if the current player has won (5 stones in a row)
    fn check_win_condition(&mut self) -> bool {
        let player_board = self.get_current_player_board();
        let winning_lines = self.geometry.get_winning_lines(5);
        
        // Check each winning line pattern
        for line_mask in winning_lines {
            if player_board.count_set_bits_in_mask(line_mask) >= 5 {
                self.winner = Some(self.current_player);
                return true;
            }
        }
        
        false
    }
    
    /// Get the board state for a specific player
    fn get_player_board(&self, player: Player) -> &BitPackedBoard<15, 15, 2> {
        match player {
            Player::Black => &self.black_board,
            Player::White => &self.white_board,
            // Handle other player variants if they exist
            _ => &self.black_board, // Default fallback
        }
    }
    
    /// Get the mutable board state for current player
    fn get_current_player_board_mut(&mut self) -> &mut BitPackedBoard<15, 15, 2> {
        match self.current_player {
            Player::Black => &mut self.black_board,
            Player::White => &mut self.white_board,
            _ => &mut self.black_board, // Default fallback
        }
    }
    
    /// Get the board state for current player
    fn get_current_player_board(&self) -> &BitPackedBoard<15, 15, 2> {
        match self.current_player {
            Player::Black => &self.black_board,
            Player::White => &self.white_board,
            _ => &self.black_board, // Default fallback
        }
    }
    
    /// Get cell value at position (0 = empty, 1 = black, 2 = white)
    #[wasm_bindgen]
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        if row >= 15 || col >= 15 {
            return 0;
        }
        
        let index = self.geometry.to_index((row as i32, col as i32))
            .unwrap_or(0);
        
        if self.black_board.get_bit(index) {
            1 // Black
        } else if self.white_board.get_bit(index) {
            2 // White
        } else {
            0 // Empty
        }
    }
    
    /// Get current player
    #[wasm_bindgen]
    pub fn current_player(&self) -> Player {
        self.current_player
    }
    
    /// Get winner (if any)
    #[wasm_bindgen]
    pub fn winner(&self) -> Option<Player> {
        self.winner
    }
    
    /// Get move count
    #[wasm_bindgen]
    pub fn move_count(&self) -> usize {
        self.move_count
    }
    
    /// Check if position is valid for next move
    #[wasm_bindgen]
    pub fn is_valid_move(&self, row: usize, col: usize) -> bool {
        row < 15 && col < 15 && self.get_cell(row, col) == 0 && self.winner.is_none()
    }
    
    /// Reset game to initial state
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.reset_with_starting_player(Player::Black);
    }
    
    /// Reset game with a specific starting player
    pub fn reset_with_starting_player(&mut self, starting_player: Player) {
        self.black_board.clear();
        self.white_board.clear();
        self.ai = GomokuAI::new();
        self.current_player = starting_player;
        self.winner = None;
        self.move_count = 0;
        self.move_history.clear();
    }
    
    /// Start a new game series with "loser starts" rule (legacy method)
    /// If loser_starts is true, the losing player from the previous game starts the next game
    pub fn start_new_series(&mut self, loser_starts: bool) {
        if loser_starts && self.winner.is_some() {
            // Loser starts next game
            let starting_player = self.winner.unwrap().opponent();
            self.reset_with_starting_player(starting_player);
        } else {
            // Default: Black starts
            self.reset();
        }
    }
    
    /// Start a new game series with fixed player colors
    /// Players keep their colors throughout the series, only start order changes
    /// This is ideal for tournaments where Player A = always Black, Player B = always White
    #[wasm_bindgen]
    pub fn start_new_series_with_players(&mut self, player_a: Player, player_b: Player, winner: Player) {
        // Validate that we're using Gomoku players
        let (color_a, color_b) = match (player_a, player_b) {
            (Player::Black, Player::White) | (Player::White, Player::Black) => (player_a, player_b),
            _ => {
                // Default to Black/White if invalid players provided
                (Player::Black, Player::White)
            }
        };
        
        // Loser starts next game, but keeps their assigned color
        let starting_player = if winner == color_a { color_b } else { color_a };
        self.reset_with_starting_player(starting_player);
    }
    
    /// Get board state as string for debugging
    #[wasm_bindgen]
    pub fn board_string(&self) -> String {
        let mut result = String::new();
        
        for row in 0..15 {
            for col in 0..15 {
                let cell = self.get_cell(row, col);
                let char = match cell {
                    0 => '.',
                    1 => 'B',
                    2 => 'W',
                    _ => '?',
                };
                result.push(char);
            }
            result.push('\n');
        }
        
        result
    }
    
    /// Check if game is draw (board full, no winner)
    #[wasm_bindgen]
    pub fn is_draw(&self) -> bool {
        self.winner.is_none() && self.move_count >= 225 // 15x15 = 225
    }
    
    /// Check if game is over (win or draw)
    #[wasm_bindgen]
    pub fn is_game_over(&self) -> bool {
        self.winner.is_some() || self.is_draw()
    }
    
    /// Get current game phase for AI strategy
    #[wasm_bindgen]
    pub fn get_game_phase(&self) -> GamePhase {
        match self.move_count {
            0..=20 => GamePhase::Opening,
            21..=120 => GamePhase::Middle,
            _ => GamePhase::Endgame,
        }
    }
    
    // === FRONTEND COMPATIBILITY API ===
    
    /// Get memory usage of the game state (for performance monitoring)
    #[wasm_bindgen]
    pub fn memory_usage(&self) -> usize {
        // Calculate approximate memory usage
        let bitpacked_boards = std::mem::size_of::<BitPackedBoard<15, 15, 2>>() * 2; // black + white
        let game_state = std::mem::size_of::<GomokuGame>() - bitpacked_boards;
        let move_history = self.move_history.len() * std::mem::size_of::<(usize, usize)>();
        
        bitpacked_boards + game_state + move_history
    }
    
    /// Get current player (frontend naming convention)
    #[wasm_bindgen]
    pub fn get_current_player(&self) -> Player {
        self.current_player()
    }
    
    /// Get move count (frontend naming convention)
    #[wasm_bindgen]
    pub fn get_move_count(&self) -> usize {
        self.move_count()
    }
    
    /// Get winner (frontend naming convention)
    #[wasm_bindgen]
    pub fn get_winner(&self) -> Option<Player> {
        self.winner()
    }
    
    /// Get board state as flat array for frontend (15 rows × 15 cols = 225 elements)
    #[wasm_bindgen]
    pub fn get_board(&self) -> Vec<u8> {
        let mut board = vec![0u8; 225];
        for row in 0..15 {
            for col in 0..15 {
                board[row * 15 + col] = self.get_cell(row, col);
            }
        }
        board
    }
    
    /// Check if undo is possible
    #[wasm_bindgen]
    pub fn can_undo(&self) -> bool {
        self.move_count > 0 && !self.is_game_over()
    }
    
    /// Undo the last move
    #[wasm_bindgen]
    pub fn undo_move(&mut self) -> bool {
        if !self.can_undo() {
            return false;
        }
        
        // Get the last move from history
        if let Some((row, col)) = self.move_history.pop() {
            let cell_value = self.get_cell(row, col);
            
            if cell_value != 0 {
                // Remove the stone from the appropriate board
                if cell_value == 1 {
                    self.black_board.clear_cell(row, col);
                } else if cell_value == 2 {
                    self.white_board.clear_cell(row, col);
                }
                
                // Update game state
                self.move_count -= 1;
                self.current_player = self.current_player.opponent();
                self.winner = None; // Reset winner since we undid a move
                
                return true;
            }
        }
        
        false
    }
    
    /// Frontend-friendly method aliases
    #[wasm_bindgen]
    pub fn newGame(&mut self) {
        self.reset();
    }
    
    #[wasm_bindgen]
    pub fn undoMove(&mut self) -> bool {
        self.undo_move()
    }
    
    /// Get AI move suggestion (modern API with Option return type)
    #[wasm_bindgen]
    pub fn get_ai_move(&self) -> Vec<usize> {
        if let Some((row, col)) = self.ai.get_best_move(self) {
            vec![row, col]
        } else {
            vec![] // Return empty vector if no move found
        }
    }
    
    /// Get AI move suggestion (internal API with proper Option type)
    pub fn get_ai_move_option(&self) -> Option<AiMove> {
        self.ai.get_best_move(self).map(|(row, col)| AiMove { row, col })
    }
    
    /// Get AI move suggestion for specific player
    pub fn get_ai_move_for_player(&self, player: Player) -> Vec<usize> {
        if let Some((row, col)) = self.ai.get_best_move_for_player(self, player) {
            vec![row, col]
        } else {
            vec![]
        }
    }
    
    /// Evaluate position for current player
    #[wasm_bindgen]
    pub fn evaluate_position(&self) -> i32 {
        self.ai.evaluate_position(self, self.current_player)
    }
    
    /// Evaluate position for specific player
    pub fn evaluate_position_for_player(&self, player: Player) -> i32 {
        self.ai.evaluate_position(self, player)
    }
    
    /// Get threat level for a position and player
    #[wasm_bindgen]
    pub fn get_threat_level(&self, row: usize, col: usize, player: Player) -> u8 {
        self.ai.get_threat_level(self, player, row, col)
    }
    
    /// Get winning moves for current player
    #[wasm_bindgen]
    pub fn get_winning_moves(&self) -> Vec<usize> {
        let mut moves = Vec::new();
        for row in 0..15 {
            for col in 0..15 {
                if self.is_valid_move(row, col) {
                    if let Some(test_game) = self.make_move_copy(row, col) {
                        if test_game.winner() == Some(self.current_player) {
                            moves.push(row);
                            moves.push(col);
                        }
                    }
                }
            }
        }
        moves
    }
    
    /// Get blocking moves (prevent opponent from winning)
    #[wasm_bindgen]
    pub fn get_blocking_moves(&self) -> Vec<usize> {
        let opponent = self.current_player.opponent();
        let mut moves = Vec::new();
        for row in 0..15 {
            for col in 0..15 {
                if self.is_valid_move(row, col) {
                    if let Some(test_game) = self.make_move_copy(row, col) {
                        // Check if this move prevents opponent from winning on next turn
                        if self.ai.get_threat_level(&test_game, opponent, row, col) >= 4 {
                            moves.push(row);
                            moves.push(col);
                        }
                    }
                }
            }
        }
        moves
    }
    
    /// Analyze position (Connect4-compatible API)
    #[wasm_bindgen]
    pub fn analyze_position(&self) -> String {
        let evaluation = self.ai.evaluate_position(self, self.current_player);
        let threatening_moves = self.get_threatening_moves();
        let winning_moves = self.get_winning_moves();
        let blocking_moves = self.get_blocking_moves();
        
        format!(
            "Position Analysis:\n\
            Evaluation: {}\n\
            Threatening moves: {}\n\
            Winning moves: {}\n\
            Blocking moves: {}",
            evaluation,
            threatening_moves.len() / 2,
            winning_moves.len() / 2,
            blocking_moves.len() / 2
        )
    }
    
    /// Get threatening moves for current player
    #[wasm_bindgen]
    pub fn get_threatening_moves(&self) -> Vec<usize> {
        let mut moves = Vec::new();
        for row in 0..15 {
            for col in 0..15 {
                if self.is_valid_move(row, col) {
                    let threat_level = self.ai.get_threat_level(self, self.current_player, row, col);
                    if threat_level >= 3 { // Significant threat
                        moves.push(row);
                        moves.push(col);
                    }
                }
            }
        }
        moves
    }
    
    /// Create hypothetical state for AI evaluation
    pub fn create_hypothetical_state(&self, hypothetical_player: Player) -> Option<GomokuGame> {
        let mut hypothetical_game = self.clone();
        hypothetical_game.current_player = hypothetical_player;
        hypothetical_game.winner = None; // Reset winner for evaluation
        Some(hypothetical_game)
    }
}

// Internal implementation for future AI access
impl GomokuGame {
    /// Create GomokuGame from existing boards (for testing)
    /// This allows loading arbitrary board states without move validation
    pub fn from_boards(
        black_board: BitPackedBoard<15, 15, 2>,
        white_board: BitPackedBoard<15, 15, 2>, 
        current_player: Player
    ) -> Self {
        // Calculate move count from boards
        let black_pieces = black_board.count_set_bits() as usize;
        let white_pieces = white_board.count_set_bits() as usize;
        let move_count = black_pieces + white_pieces;
        
        // Reconstruct move history (simplified - we lose the actual sequence)
        let mut move_history = Vec::new();
        for row in 0..15 {
            for col in 0..15 {
                if black_board.get_cell(row, col) != 0 || white_board.get_cell(row, col) != 0 {
                    move_history.push((row, col));
                }
            }
        }
        
        Self {
            geometry: GomokuGrid::new(),
            black_board,
            white_board,
            ai: GomokuAI::new(),
            current_player,
            winner: None, // Will be determined by check_win_condition if needed
            move_count,
            move_history,
        }
    }
    
    /// Make a move for internal/test use (returns Result<bool, String>)
    pub fn make_move_internal(&mut self, row: usize, col: usize) -> Result<bool, String> {
        // Validate coordinates
        if row >= 15 || col >= 15 {
            return Err("Invalid coordinates".to_string());
        }
        
        // Check if position is already occupied
        if self.get_cell(row, col) != 0 {
            return Err("Position already occupied".to_string());
        }
        
        // Check if game is over
        if self.winner.is_some() {
            return Err("Game is already over".to_string());
        }
        
        // Use geometry layer to get the index
        let index = self.geometry.to_index((row as i32, col as i32))
            .ok_or_else(|| "Invalid position".to_string())?;
        
        // Use data layer to place the stone
        let player_board = self.get_current_player_board_mut();
        player_board.set_bit(index, true);
        
        // Update move history and count
        self.move_history.push((row, col));
        self.move_count += 1;
        
        // Check for win condition
        let won = self.check_win_condition();
        
        if !won {
            // Switch players
            self.current_player = self.current_player.opponent();
        }
        
        Ok(won)
    }
    
    /// Get board for player evaluation (internal use)
    pub fn get_board_for_player(&self, player: Player) -> &BitPackedBoard<15, 15, 2> {
        self.get_player_board(player)
    }
    
    /// Get geometry for evaluation (internal use)
    pub fn geometry(&self) -> &GomokuGrid {
        &self.geometry
    }
    
    /// Create a copy of the game with a move applied (for AI lookahead)
    pub fn make_move_copy(&self, row: usize, col: usize) -> Option<GomokuGame> {
        if !self.is_valid_move(row, col) {
            return None;
        }
        
        let mut game_copy = Self {
            geometry: self.geometry.clone(),
            black_board: self.black_board.clone(),
            white_board: self.white_board.clone(),
            ai: self.ai.clone(),
            current_player: self.current_player,
            winner: self.winner,
            move_count: self.move_count,
            move_history: self.move_history.clone(),
        };
        
        if game_copy.make_move(row, col).is_ok() {
            Some(game_copy)
        } else {
            None
        }
    }
}

impl Default for GomokuGame {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_moves() {
        let mut game = GomokuGame::new();
        
        // Test initial state
        assert_eq!(game.current_player(), Player::Black);
        assert_eq!(game.move_count(), 0);
        assert_eq!(game.winner(), None);
        
        // Make a move
        let result = game.make_move_internal(7, 7); // Center position
        assert!(result.is_ok());
        assert_eq!(game.current_player(), Player::White); // Should switch
        assert_eq!(game.get_cell(7, 7), 1); // Black stone at center
    }
    
    #[test]
    fn test_position_occupied() {
        let mut game = GomokuGame::new();
        
        // Place first stone
        game.make_move_internal(7, 7).unwrap();
        
        // Try to place another stone at same position
        let result = game.make_move_internal(7, 7);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_win_detection() {
        let mut game = GomokuGame::new();
        
        // Create a horizontal win for Black
        for col in 0..5 {
            game.make_move_internal(7, col).unwrap(); // Black
            if col < 4 {
                game.make_move_internal(8, col).unwrap(); // White
            }
        }
        
        assert_eq!(game.winner(), Some(Player::Black));
    }
    
    #[test]
    fn test_from_boards_constructor() {
        let mut black_board = BitPackedBoard::new();
        let mut white_board = BitPackedBoard::new();
        
        // Create a simple board state
        black_board.set_cell(7, 7, 1).unwrap(); // Center
        white_board.set_cell(7, 8, 1).unwrap(); // Next to it
        
        let game = GomokuGame::from_boards(black_board, white_board, Player::Black);
        
        // Check the state was loaded correctly
        assert_eq!(game.get_cell(7, 7), 1); // Black stone
        assert_eq!(game.get_cell(7, 8), 2); // White stone
        assert_eq!(game.move_count(), 2);
        assert_eq!(game.current_player(), Player::Black);
    }
    
    #[test]
    fn test_undo_move() {
        let mut game = GomokuGame::new();
        
        // Make some moves
        game.make_move_internal(7, 7).unwrap(); // Black
        game.make_move_internal(7, 8).unwrap(); // White
        game.make_move_internal(8, 7).unwrap(); // Black
        
        assert_eq!(game.move_count(), 3);
        assert_eq!(game.current_player(), Player::White);
        
        // Undo last move
        let result = game.undo_move();
        assert!(result);
        assert_eq!(game.move_count(), 2);
        assert_eq!(game.current_player(), Player::Black);
        assert_eq!(game.get_cell(8, 7), 0); // Stone removed
    }
    
    #[test]
    fn test_flexible_starting_player() {
        // Test default constructor (Black starts)
        let game_default = GomokuGame::new();
        assert_eq!(game_default.current_player(), Player::Black);
        
        // Test with Black starting
        let game_black = GomokuGame::new_with_starting_player(Player::Black);
        assert_eq!(game_black.current_player(), Player::Black);
        
        // Test with White starting
        let game_white = GomokuGame::new_with_starting_player(Player::White);
        assert_eq!(game_white.current_player(), Player::White);
    }
    
    #[test]
    fn test_board_bounds() {
        let game = GomokuGame::new();
        
        // Test valid moves
        assert!(game.is_valid_move(0, 0));
        assert!(game.is_valid_move(14, 14));
        assert!(game.is_valid_move(7, 7));
        
        // Test invalid moves (out of bounds)
        assert!(!game.is_valid_move(15, 0));
        assert!(!game.is_valid_move(0, 15));
        assert!(!game.is_valid_move(15, 15));
    }
    
    #[test]
    fn test_memory_usage() {
        let game = GomokuGame::new();
        let memory = game.memory_usage();
        
        // Should be reasonable for a 15x15 board
        assert!(memory > 0);
        assert!(memory < 10000); // Should be well under 10KB
    }
    
    #[test]
    fn test_series_with_fixed_player_colors() {
        let mut game = GomokuGame::new();
        
        // Set up a game where Black wins (5 in a row horizontally)
        for col in 0..5 {
            game.make_move_internal(7, col).unwrap(); // Black
            if col < 4 {
                game.make_move_internal(8, col).unwrap(); // White
            }
        }
        
        assert_eq!(game.winner(), Some(Player::Black));
        
        // Start new series with fixed colors: Player A = Black, Player B = White
        // Since Black won, White should start the next game
        game.start_new_series_with_players(Player::Black, Player::White, Player::Black);
        
        // Verify game is reset
        assert_eq!(game.winner(), None);
        assert_eq!(game.move_count(), 0);
        
        // Verify White starts (loser starts, but keeps their color)
        assert_eq!(game.current_player(), Player::White);
        
        // Test the reverse scenario: if White wins, Black should start
        let mut game2 = GomokuGame::new();
        game2.start_new_series_with_players(Player::Black, Player::White, Player::White);
        assert_eq!(game2.current_player(), Player::Black);
    }
}