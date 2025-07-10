use wasm_bindgen::prelude::*;
use crate::data::BitPackedBoard;
use crate::geometry::{Connect4Grid, BoardGeometry, PatternProvider};
use crate::ai::{Connect4AI, PatternEvaluator};
use crate::{GamePhase, PositionAnalysis, Player};

/// Connect4 game implementation using the Three-Layer Architecture
/// Composes geometry and data layers for clean separation of concerns
#[wasm_bindgen]
#[derive(Clone)]
pub struct Connect4Game {
    // Composition: Geometry layer handles coordinate logic
    geometry: Connect4Grid,
    
    // Composition: Data layer handles efficient storage
    yellow_board: BitPackedBoard<6, 7, 2>,
    red_board: BitPackedBoard<6, 7, 2>,
    
    // Composition: AI layer for strategic evaluation
    ai: Connect4AI,
    evaluator: PatternEvaluator,
    
    // Game-specific state
    current_player: Player,
    winner: Option<Player>,
    move_count: usize,
    column_heights: [usize; 7], // Track how many pieces in each column
}

#[wasm_bindgen]
impl Connect4Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::new_with_starting_player(Player::Yellow)
    }
    
    /// Create a new Connect4 game with a specific starting player
    /// This is essential for game series where "loser starts next game"
    pub fn new_with_starting_player(starting_player: Player) -> Self {
        Self {
            geometry: Connect4Grid::new(),
            yellow_board: BitPackedBoard::new(),
            red_board: BitPackedBoard::new(),
            ai: Connect4AI::new(),
            evaluator: PatternEvaluator::new(),
            current_player: starting_player,
            winner: None,
            move_count: 0,
            column_heights: [0; 7],
        }
    }
    
    /// Make a move in the specified column
    #[wasm_bindgen]
    pub fn make_move(&mut self, column: usize) -> Result<bool, JsValue> {
        // Validate column
        if column >= 7 {
            return Err(JsValue::from_str("Invalid column"));
        }
        
        // Check if column is full
        if self.column_heights[column] >= 6 {
            return Err(JsValue::from_str("Column is full"));
        }
        
        // Check if game is over
        if self.winner.is_some() {
            return Err(JsValue::from_str("Game is already over"));
        }
        
        // Calculate the row where the piece will land
        let row = 6 - 1 - self.column_heights[column]; // Bottom up
        
        // Use geometry layer to get the index
        let index = self.geometry.to_index((row as i32, column as i32))
            .ok_or_else(|| JsValue::from_str("Invalid position"))?;
        
        // Use data layer to place the piece
        let player_board = self.get_current_player_board_mut();
        player_board.set_bit(index, true);
        
        // Update column height
        self.column_heights[column] += 1;
        self.move_count += 1;
        
        // Check for win condition
        let won = self.check_win_condition();
        
        if !won {
            // Switch players
            self.current_player = self.current_player.opponent();
        }
        
        Ok(won)
    }
    
    /// Check if the current player has won
    fn check_win_condition(&mut self) -> bool {
        let player_board = self.get_current_player_board();
        let winning_lines = self.geometry.get_winning_lines(4);
        
        // Check each winning line pattern
        for line_mask in winning_lines {
            if player_board.count_set_bits_in_mask(line_mask) >= 4 {
                self.winner = Some(self.current_player);
                return true;
            }
        }
        
        false
    }
    
    /// Get the board state for a specific player
    fn get_player_board(&self, player: Player) -> &BitPackedBoard<6, 7, 2> {
        match player {
            Player::Yellow => &self.yellow_board,
            Player::Red => &self.red_board,
            Player::Black | Player::White => {
                // Connect4 doesn't use Black/White players, default to Yellow
                &self.yellow_board
            }
        }
    }
    
    /// Get the mutable board state for current player
    fn get_current_player_board_mut(&mut self) -> &mut BitPackedBoard<6, 7, 2> {
        match self.current_player {
            Player::Yellow => &mut self.yellow_board,
            Player::Red => &mut self.red_board,
            Player::Black | Player::White => {
                // Connect4 doesn't use Black/White players, default to Yellow
                &mut self.yellow_board
            }
        }
    }
    
    /// Get the board state for current player
    fn get_current_player_board(&self) -> &BitPackedBoard<6, 7, 2> {
        match self.current_player {
            Player::Yellow => &self.yellow_board,
            Player::Red => &self.red_board,
            Player::Black | Player::White => {
                // Connect4 doesn't use Black/White players, default to Yellow
                &self.yellow_board
            }
        }
    }
    
    /// Get cell value at position (0 = empty, 1 = yellow, 2 = red)
    #[wasm_bindgen]
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        if row >= 6 || col >= 7 {
            return 0;
        }
        
        let index = self.geometry.to_index((row as i32, col as i32))
            .unwrap_or(0);
        
        if self.yellow_board.get_bit(index) {
            1 // Yellow
        } else if self.red_board.get_bit(index) {
            2 // Red
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
    
    /// Check if column is valid for next move
    #[wasm_bindgen]
    pub fn is_valid_move(&self, column: usize) -> bool {
        column < 7 && self.column_heights[column] < 6 && self.winner.is_none()
    }
    
    /// Get column height
    #[wasm_bindgen]
    pub fn get_column_height(&self, column: usize) -> usize {
        if column < 7 {
            self.column_heights[column]
        } else {
            0
        }
    }
    
    /// Reset game to initial state
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.reset_with_starting_player(Player::Yellow);
    }
    
    /// Reset game with a specific starting player
    pub fn reset_with_starting_player(&mut self, starting_player: Player) {
        self.yellow_board.clear();
        self.red_board.clear();
        self.current_player = starting_player;
        self.winner = None;
        self.move_count = 0;
        self.column_heights = [0; 7];
        
        // Reset AI state
        self.ai = Connect4AI::new();
        self.evaluator = PatternEvaluator::new();
    }
    
    /// Start a new game series with "loser starts" rule (legacy method)
    /// If loser_starts is true, the losing player from the previous game starts the next game
    pub fn start_new_series(&mut self, loser_starts: bool) {
        if loser_starts && self.winner.is_some() {
            // Loser starts next game
            let starting_player = self.winner.unwrap().opponent();
            self.reset_with_starting_player(starting_player);
        } else {
            // Default: Yellow starts or alternating start
            self.reset();
        }
    }
    
    /// Start a new game series with fixed player colors
    /// Players keep their colors throughout the series, only start order changes
    /// This is ideal for tournaments where Player A = always Yellow, Player B = always Red
    #[wasm_bindgen]
    pub fn start_new_series_with_players(&mut self, player_a: Player, player_b: Player, winner: Player) {
        // Validate that we're using Connect4 players
        let (color_a, color_b) = match (player_a, player_b) {
            (Player::Yellow, Player::Red) | (Player::Red, Player::Yellow) => (player_a, player_b),
            _ => {
                // Default to Yellow/Red if invalid players provided
                (Player::Yellow, Player::Red)
            }
        };
        
        // Loser starts next game, but keeps their assigned color
        let starting_player = if winner == color_a { color_b } else { color_a };
        self.reset_with_starting_player(starting_player);
    }
    
    /// Create a hypothetical game state for AI evaluation
    /// This allows the AI to evaluate positions regardless of whose turn it is
    pub fn create_hypothetical_state(&self, hypothetical_player: Player) -> Connect4Game {
        let mut hypothetical_game = self.clone();
        hypothetical_game.current_player = hypothetical_player;
        hypothetical_game
    }
    
    /// Get board state as string for debugging
    #[wasm_bindgen]
    pub fn board_string(&self) -> String {
        let mut result = String::new();
        
        for row in 0..6 {
            for col in 0..7 {
                let cell = self.get_cell(row, col);
                let char = match cell {
                    0 => '.',
                    1 => 'Y',
                    2 => 'R',
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
        self.winner.is_none() && self.move_count >= 42
    }
    
    /// Check if game is over (win or draw)
    #[wasm_bindgen]
    pub fn is_game_over(&self) -> bool {
        self.winner.is_some() || self.is_draw()
    }
    
    /// Get AI move suggestion
    #[wasm_bindgen]
    pub fn get_ai_move(&self) -> Option<usize> {
        self.ai.get_best_move(self)
    }
    
    /// Analyze current position comprehensively
    #[wasm_bindgen]
    pub fn analyze_position(&self) -> PositionAnalysis {
        let current_threats = self.count_threats(self.current_player);
        let opponent_threats = self.count_threats(self.current_player.opponent());
        let connectivity = self.evaluate_connectivity();
        let phase = self.get_game_phase();
        let score = self.evaluate_position_advanced();
        
        PositionAnalysis {
            current_player_threats: current_threats,
            opponent_threats: opponent_threats,
            total_pieces: self.move_count,
            connectivity_score: connectivity,
            game_phase: phase,
            evaluation_score: score,
        }
    }
    
    /// Get current game phase for AI strategy
    #[wasm_bindgen]
    pub fn get_game_phase(&self) -> GamePhase {
        match self.move_count {
            0..=10 => GamePhase::Opening,
            11..=30 => GamePhase::Middle,
            _ => GamePhase::Endgame,
        }
    }
    
    // === MISSING API METHODS FOR FRONTEND COMPATIBILITY ===
    
    /// Get memory usage of the game state (for performance monitoring)
    #[wasm_bindgen]
    pub fn memory_usage(&self) -> usize {
        // Calculate approximate memory usage
        let bitpacked_boards = std::mem::size_of::<BitPackedBoard<6, 7, 2>>() * 2; // yellow + red
        let game_state = std::mem::size_of::<Connect4Game>() - bitpacked_boards;
        let ai_state = std::mem::size_of::<Connect4AI>() + std::mem::size_of::<PatternEvaluator>();
        
        bitpacked_boards + game_state + ai_state
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
    
    /// Get board state as flat array for frontend (6 rows × 7 cols = 42 elements)
    #[wasm_bindgen]
    pub fn get_board(&self) -> Vec<u8> {
        let mut board = vec![0u8; 42];
        for row in 0..6 {
            for col in 0..7 {
                board[row * 7 + col] = self.get_cell(row, col);
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
        
        // Find the column with the highest piece (most recent move)
        let mut highest_col = None;
        let mut highest_row = 0;
        
        for col in 0..7 {
            if self.column_heights[col] > 0 {
                let row = self.column_heights[col] - 1;
                if row >= highest_row {
                    highest_row = row;
                    highest_col = Some(col);
                }
            }
        }
        
        if let Some(col) = highest_col {
            let row = self.column_heights[col] - 1;
            let cell_value = self.get_cell(row, col);
            
            if cell_value != 0 {
                // Remove the piece from the appropriate board
                if cell_value == 1 {
                    self.yellow_board.clear_cell(row, col);
                } else if cell_value == 2 {
                    self.red_board.clear_cell(row, col);
                }
                
                // Update game state
                self.column_heights[col] -= 1;
                self.move_count -= 1;
                self.current_player = self.current_player.opponent();
                self.winner = None; // Reset winner since we undid a move
                
                return true;
            }
        }
        
        false
    }
    
    /// Get AI board representation (for assistance system)
    #[wasm_bindgen]
    pub fn get_ai_board(&self) -> Vec<u8> {
        self.get_board()
    }
    
    /// Get threatening moves for a player
    #[wasm_bindgen]
    pub fn get_threatening_moves(&self, player: Player) -> Vec<usize> {
        let mut threats = Vec::new();
        
        for col in 0..7 {
            if self.is_valid_move(col) {
                // Simulate move
                let mut test_game = self.clone();
                if test_game.make_move(col).is_ok() {
                    // Check if this move creates a threat (wins or sets up a win)
                    if test_game.winner().is_some() || test_game.count_threats(player) > 0 {
                        threats.push(col);
                    }
                }
            }
        }
        
        threats
    }
    
    /// Get winning moves for a player
    #[wasm_bindgen]
    pub fn get_winning_moves(&self, player: Player) -> Vec<usize> {
        let mut winning_moves = Vec::new();
        
        for col in 0..7 {
            if self.is_valid_move(col) {
                // Simulate move
                let mut test_game = self.clone();
                if test_game.make_move(col).is_ok() {
                    if test_game.winner() == Some(player) {
                        winning_moves.push(col);
                    }
                }
            }
        }
        
        winning_moves
    }
    
    /// Get blocking moves (moves that prevent opponent from winning)
    #[wasm_bindgen]
    pub fn get_blocking_moves(&self, player: Player) -> Vec<usize> {
        let opponent = player.opponent();
        let mut blocking_moves = Vec::new();
        
        for col in 0..7 {
            if self.is_valid_move(col) {
                // Simulate opponent move
                let mut test_game = self.create_hypothetical_state(opponent);
                if test_game.make_move(col).is_ok() {
                    if test_game.winner() == Some(opponent) {
                        blocking_moves.push(col);
                    }
                }
            }
        }
        
        blocking_moves
    }
    
    /// Evaluate position for a specific player
    #[wasm_bindgen]
    pub fn evaluate_position_for_player(&self, player: Player) -> i32 {
        let hypothetical_game = self.create_hypothetical_state(player);
        self.ai.evaluate_position(&hypothetical_game)
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
    
    #[wasm_bindgen]
    pub fn getAIMove(&self) -> Option<usize> {
        self.get_ai_move()
    }
}

// Internal implementation for AI access
impl Connect4Game {
    /// Create Connect4Game from existing boards (for testing)
    /// This allows loading arbitrary board states without move validation
    pub fn from_boards(
        yellow_board: BitPackedBoard<6, 7, 2>,
        red_board: BitPackedBoard<6, 7, 2>, 
        current_player: Player
    ) -> Self {
        // Calculate move count and column heights from boards
        let yellow_pieces = yellow_board.count_set_bits() as usize;
        let red_pieces = red_board.count_set_bits() as usize;
        let move_count = yellow_pieces + red_pieces;
        
        // Calculate column heights by counting pieces in each column
        let mut column_heights = [0usize; 7];
        for col in 0..7 {
            for row in 0..6 {
                if yellow_board.get_cell(row, col) != 0 || red_board.get_cell(row, col) != 0 {
                    column_heights[col] += 1;
                }
            }
        }
        
        Self {
            geometry: Connect4Grid::new(),
            yellow_board,
            red_board,
            ai: Connect4AI::new(),
            evaluator: PatternEvaluator::new(),
            current_player,
            winner: None, // Will be determined by check_win_condition if needed
            move_count,
            column_heights,
        }
    }
    
    /// Validate if a Connect4 game state is reachable through legal moves
    /// Uses the "peeling" algorithm to recursively verify move sequences
    pub fn is_valid_state(&self) -> bool {
        self.peel_board_recursively()
    }
    
    /// Recursive implementation of the peeling algorithm
    fn peel_board_recursively(&self) -> bool {
        let yellow_count = self.yellow_board.count_set_bits() as usize;
        let red_count = self.red_board.count_set_bits() as usize;
        
        // Base case: Empty board is always valid
        if yellow_count == 0 && red_count == 0 {
            return true;
        }
        
        // Global counting rule: Yellow starts, so it can have same or one more
        if red_count > yellow_count || yellow_count > red_count + 1 {
            return false;
        }
        
        // Physical validation: Check all pieces respect gravity
        for row in 0..6 {
            for col in 0..7 {
                if (self.yellow_board.get_cell(row, col) != 0 || 
                    self.red_board.get_cell(row, col) != 0) && 
                   !self.respects_gravity(row, col) {
                    return false; // Floating piece found
                }
            }
        }
        
        // Determine who made the last move
        let last_player = if yellow_count > red_count { 
            Player::Yellow 
        } else { 
            Player::Red 
        };
        
        // Find valid last moves (optimization: only check top pieces of last player)
        let valid_last_moves = self.find_valid_last_moves(last_player);
        
        // Try removing each valid last move
        for (row, col) in valid_last_moves {
            // Create previous state by removing this piece
            let mut previous_game = self.clone();
            previous_game.remove_piece_at(row, col);
            
            // Recursively check if this previous state is valid
            if previous_game.peel_board_recursively() {
                return true;
            }
        }
        
        // No valid path found
        false
    }
    
    /// Find valid last moves (optimization: only return top pieces of specified player)
    /// This is the core optimization of the peeling algorithm
    fn find_valid_last_moves(&self, last_player: Player) -> Vec<(usize, usize)> {
        let mut valid_moves = Vec::new();
        
        for col in 0..7 {
            // Find the topmost piece in this column
            for row in 0..6 {
                let is_yellow = self.yellow_board.get_cell(row, col) != 0;
                let is_red = self.red_board.get_cell(row, col) != 0;
                
                if is_yellow && last_player == Player::Yellow {
                    valid_moves.push((row, col));
                    break;
                } else if is_red && last_player == Player::Red {
                    valid_moves.push((row, col));
                    break;
                } else if is_yellow || is_red {
                    // Found a piece of the wrong player - skip this column
                    break;
                }
            }
        }
        
        valid_moves
    }
    
    /// Check if a piece placement respects gravity (no floating pieces)
    fn respects_gravity(&self, row: usize, col: usize) -> bool {
        // Bottom row always respects gravity
        if row == 5 {
            return true;
        }
        
        // Check if there's a piece directly below
        self.yellow_board.get_cell(row + 1, col) != 0 || 
        self.red_board.get_cell(row + 1, col) != 0
    }
    
    /// Remove a piece from the board (for peeling algorithm)
    /// Uses the new BitPackedBoard clear_cell method for efficiency
    fn remove_piece_at(&mut self, row: usize, col: usize) {
        // Use the new clear_cell method instead of set_cell(0) for better performance
        self.yellow_board.clear_cell(row, col);
        self.red_board.clear_cell(row, col);
        
        // Update column heights
        if col < 7 && self.column_heights[col] > 0 {
            self.column_heights[col] -= 1;
        }
        
        // Update move count
        if self.move_count > 0 {
            self.move_count -= 1;
        }
    }
    
    /// Make a move for internal/test use (returns Result<bool, String>)
    pub fn make_move_internal(&mut self, column: usize) -> Result<bool, String> {
        // Validate column
        if column >= 7 {
            return Err("Invalid column".to_string());
        }
        
        // Check if column is full
        if self.column_heights[column] >= 6 {
            return Err("Column is full".to_string());
        }
        
        // Check if game is over
        if self.winner.is_some() {
            return Err("Game is already over".to_string());
        }
        
        // Calculate the row where the piece will land
        let row = 6 - 1 - self.column_heights[column]; // Bottom up
        
        // Use geometry layer to get the index
        let index = self.geometry.to_index((row as i32, column as i32))
            .ok_or_else(|| "Invalid position".to_string())?;
        
        // Use data layer to place the piece
        let player_board = self.get_current_player_board_mut();
        player_board.set_bit(index, true);
        
        // Update column height
        self.column_heights[column] += 1;
        self.move_count += 1;
        
        // Check for win condition
        let won = self.check_win_condition();
        
        if !won {
            // Switch players
            self.current_player = self.current_player.opponent();
        }
        
        Ok(won)
    }
    /// Get board for AI evaluation (internal use)
    pub fn get_board_for_player(&self, player: Player) -> &BitPackedBoard<6, 7, 2> {
        self.get_player_board(player)
    }
    
    /// Get geometry for AI evaluation (internal use)
    pub fn geometry(&self) -> &Connect4Grid {
        &self.geometry
    }
    
    /// Evaluate position for AI (simple heuristic for legacy compatibility)
    pub fn evaluate_position(&self) -> i32 {
        self.evaluate_position_advanced()
    }
    
    /// Advanced position evaluation using Gemini's pattern-based strategy
    pub fn evaluate_position_advanced(&self) -> i32 {
        // Use AI layer for comprehensive evaluation
        self.evaluator.evaluate_position(self, self.current_player)
    }
    
    /// Count immediate threats for a player
    pub fn count_threats(&self, player: Player) -> usize {
        let player_board = self.get_player_board(player);
        let opponent_board = self.get_player_board(player.opponent());
        let winning_lines = self.geometry.get_winning_lines(4);
        
        let mut threats = 0;
        for line_mask in winning_lines {
            let player_pieces = player_board.count_set_bits_in_mask(line_mask);
            let opponent_pieces = opponent_board.count_set_bits_in_mask(line_mask);
            
            // A threat is 3 pieces in a line with no opponent pieces
            if player_pieces == 3 && opponent_pieces == 0 {
                threats += 1;
            }
        }
        
        threats
    }
    
    /// Evaluate connectivity of pieces for strategic assessment
    pub fn evaluate_connectivity(&self) -> i32 {
        let mut connectivity = 0;
        
        // Check 2-piece and 3-piece combinations for both players
        let lines_of_3 = self.geometry.get_winning_lines(3);
        
        for line_mask in lines_of_3 {
            let current_pieces = self.get_current_player_board().count_set_bits_in_mask(line_mask);
            let opponent_pieces = self.get_player_board(self.current_player.opponent()).count_set_bits_in_mask(line_mask);
            
            if current_pieces >= 2 && opponent_pieces == 0 {
                connectivity += current_pieces as i32 * 10;
            } else if opponent_pieces >= 2 && current_pieces == 0 {
                connectivity -= opponent_pieces as i32 * 10;
            }
        }
        
        connectivity
    }
    
    /// Create a copy of the game with a move applied (for AI lookahead)
    pub fn make_move_copy(&self, column: usize) -> Option<Connect4Game> {
        if !self.is_valid_move(column) {
            return None;
        }
        
        let mut game_copy = Self {
            geometry: self.geometry.clone(),
            yellow_board: self.yellow_board.clone(),
            red_board: self.red_board.clone(),
            ai: self.ai.clone(),
            evaluator: self.evaluator.clone(),
            current_player: self.current_player,
            winner: self.winner,
            move_count: self.move_count,
            column_heights: self.column_heights,
        };
        
        if game_copy.make_move(column).is_ok() {
            Some(game_copy)
        } else {
            None
        }
    }
    
    /// Create a copy of the game with a move applied by a specific player
    pub fn make_move_as_player(&self, column: usize, player: Player) -> Option<Connect4Game> {
        if !self.is_valid_move(column) {
            return None;
        }
        
        let mut game_copy = Self {
            geometry: self.geometry.clone(),
            yellow_board: self.yellow_board.clone(),
            red_board: self.red_board.clone(),
            ai: self.ai.clone(),
            evaluator: self.evaluator.clone(),
            current_player: player,  // Set the specific player
            winner: self.winner,
            move_count: self.move_count,
            column_heights: self.column_heights,
        };
        
        if game_copy.make_move(column).is_ok() {
            Some(game_copy)
        } else {
            None
        }
    }
}

impl Default for Connect4Game {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_moves() {
        let mut game = Connect4Game::new();
        
        // Test initial state
        assert_eq!(game.current_player(), Player::Yellow);
        assert_eq!(game.move_count(), 0);
        assert_eq!(game.winner(), None);
        
        // Make a move
        let result = game.make_move_internal(3);
        assert!(result.is_ok());
        assert_eq!(game.current_player(), Player::Red); // Should switch
        assert_eq!(game.get_cell(5, 3), 1); // Yellow piece at bottom
    }
    
    #[test]
    fn test_column_full() {
        let mut game = Connect4Game::new();
        
        // Fill column 0
        for _ in 0..6 {
            let _ = game.make_move_internal(0);
        }
        
        // 7th move should fail
        let result = game.make_move_internal(0);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_win_detection() {
        let mut game = Connect4Game::new();
        
        // Create a horizontal win for Yellow
        for col in 0..4 {
            game.make_move_internal(col).unwrap(); // Yellow
            if col < 3 {
                game.make_move_internal(col).unwrap(); // Red
            }
        }
        
        assert_eq!(game.winner(), Some(Player::Yellow));
    }
    
    #[test]
    fn test_from_boards_constructor() {
        let mut yellow_board = BitPackedBoard::new();
        let mut red_board = BitPackedBoard::new();
        
        // Create a simple board state
        yellow_board.set_cell(5, 3, 1).unwrap(); // Bottom center
        red_board.set_cell(5, 4, 1).unwrap();    // Bottom center+1
        
        let game = Connect4Game::from_boards(yellow_board, red_board, Player::Yellow);
        
        // Check the state was loaded correctly
        assert_eq!(game.get_cell(5, 3), 1); // Yellow piece
        assert_eq!(game.get_cell(5, 4), 2); // Red piece
        assert_eq!(game.move_count(), 2);
        assert_eq!(game.current_player(), Player::Yellow);
    }
    
    #[test]
    fn test_state_validation_simple() {
        let mut yellow_board = BitPackedBoard::new();
        let mut red_board = BitPackedBoard::new();
        
        // Create a valid alternating sequence
        yellow_board.set_cell(5, 3, 1).unwrap(); // Yellow first
        red_board.set_cell(5, 4, 1).unwrap();    // Red second
        yellow_board.set_cell(4, 3, 1).unwrap(); // Yellow third (on top)
        
        let game = Connect4Game::from_boards(yellow_board, red_board, Player::Red);
        
        // This should be a valid state
        assert!(game.is_valid_state());
    }
    
    #[test]
    fn test_state_validation_invalid_floating() {
        let mut yellow_board = BitPackedBoard::new();
        let red_board = BitPackedBoard::new();
        
        // Create an invalid floating piece
        yellow_board.set_cell(3, 3, 1).unwrap(); // Floating piece (nothing below)
        
        let game = Connect4Game::from_boards(yellow_board, red_board, Player::Red);
        
        // This should be invalid
        assert!(!game.is_valid_state());
    }
    
    #[test]
    fn test_peeling_algorithm_comprehensive() {
        // Test empty board (base case)
        let empty_game = Connect4Game::new();
        assert!(empty_game.is_valid_state());
        
        // Test invalid piece count (too many yellow pieces)
        let mut yellow_board = BitPackedBoard::new();
        let red_board = BitPackedBoard::new();
        yellow_board.set_cell(5, 0, 1).unwrap(); // Yellow
        yellow_board.set_cell(5, 1, 1).unwrap(); // Yellow
        yellow_board.set_cell(5, 2, 1).unwrap(); // Yellow (3 yellow, 0 red = invalid)
        
        let invalid_game = Connect4Game::from_boards(yellow_board, red_board, Player::Red);
        assert!(!invalid_game.is_valid_state());
        
        // Test valid alternating sequence
        let mut yellow_board = BitPackedBoard::new();
        let mut red_board = BitPackedBoard::new();
        yellow_board.set_cell(5, 0, 1).unwrap(); // Yellow 1st
        red_board.set_cell(5, 1, 1).unwrap();    // Red 2nd
        yellow_board.set_cell(4, 0, 1).unwrap(); // Yellow 3rd (stacked)
        red_board.set_cell(5, 2, 1).unwrap();    // Red 4th
        
        let valid_game = Connect4Game::from_boards(yellow_board, red_board, Player::Yellow);
        assert!(valid_game.is_valid_state());
        
        // Test your specific logic: board_after -> board_before -> empty
        let mut board_after = BitPackedBoard::new();
        let mut red_after = BitPackedBoard::new();
        board_after.set_cell(5, 0, 1).unwrap();
        red_after.set_cell(5, 1, 1).unwrap();
        board_after.set_cell(4, 0, 1).unwrap();
        
        let game_after = Connect4Game::from_boards(board_after, red_after, Player::Red);
        assert!(game_after.is_valid_state());
        
        // board_before should be reachable by peeling one move
        let mut board_before = BitPackedBoard::new();
        let mut red_before = BitPackedBoard::new();
        board_before.set_cell(5, 0, 1).unwrap();
        red_before.set_cell(5, 1, 1).unwrap();
        
        let game_before = Connect4Game::from_boards(board_before, red_before, Player::Yellow);
        assert!(game_before.is_valid_state());
    }
    
    #[test]
    fn test_find_valid_last_moves() {
        let mut yellow_board = BitPackedBoard::new();
        let mut red_board = BitPackedBoard::new();
        
        // Create a stack in column 0: Yellow at bottom, Red on top
        yellow_board.set_cell(5, 0, 1).unwrap(); // Bottom
        red_board.set_cell(4, 0, 1).unwrap();    // Top
        red_board.set_cell(5, 1, 1).unwrap();    // Another piece in column 1
        
        let game = Connect4Game::from_boards(yellow_board, red_board, Player::Yellow);
        
        // Red was the last to move, so only red pieces at top should be valid
        let valid_moves = game.find_valid_last_moves(Player::Red);
        assert_eq!(valid_moves.len(), 2);
        assert!(valid_moves.contains(&(4, 0))); // Top of column 0
        assert!(valid_moves.contains(&(5, 1))); // Top of column 1
        
        // Yellow moves should only find pieces where Yellow is on top
        let yellow_moves = game.find_valid_last_moves(Player::Yellow);
        assert_eq!(yellow_moves.len(), 0); // No yellow pieces on top
    }
    
    #[test]
    fn test_bidirectional_ai() {
        let mut game = Connect4Game::new();
        
        // Make a few moves to create a position
        game.make_move_internal(3).unwrap(); // Yellow in center
        game.make_move_internal(4).unwrap(); // Red next to it
        
        let ai = Connect4AI::new();
        
        // Test bidirectional AI - should work for both players
        let yellow_move = ai.get_best_move_for_player(&game, Player::Yellow);
        let red_move = ai.get_best_move_for_player(&game, Player::Red);
        
        // Both should return valid moves
        assert!(yellow_move.is_some());
        assert!(red_move.is_some());
        
        // Moves should be different columns (different strategies)
        let yellow_col = yellow_move.unwrap();
        let red_col = red_move.unwrap();
        
        assert!(yellow_col < 7);
        assert!(red_col < 7);
        
        // Test bidirectional AI works regardless of current player
        // The current player after two moves should be Yellow
        assert_eq!(game.current_player(), Player::Yellow);
        
        // Both should work even when not the current player
        let yellow_move_current = ai.get_best_move_for_player(&game, Player::Yellow);
        let red_move_hypothetical = ai.get_best_move_for_player(&game, Player::Red);
        
        assert!(yellow_move_current.is_some());
        assert!(red_move_hypothetical.is_some());
    }
    
    #[test]
    fn test_flexible_starting_player() {
        // Test default constructor (Yellow starts)
        let game_default = Connect4Game::new();
        assert_eq!(game_default.current_player(), Player::Yellow);
        
        // Test with Yellow starting
        let game_yellow = Connect4Game::new_with_starting_player(Player::Yellow);
        assert_eq!(game_yellow.current_player(), Player::Yellow);
        
        // Test with Red starting
        let game_red = Connect4Game::new_with_starting_player(Player::Red);
        assert_eq!(game_red.current_player(), Player::Red);
    }
    
    #[test]
    fn test_game_series_management() {
        let mut game = Connect4Game::new();
        
        // Simulate a game where Yellow wins
        game.yellow_board.set_cell(5, 0, 1).unwrap();
        game.yellow_board.set_cell(5, 1, 1).unwrap();
        game.yellow_board.set_cell(5, 2, 1).unwrap();
        game.yellow_board.set_cell(5, 3, 1).unwrap();
        game.winner = Some(Player::Yellow);
        
        // Start new series with loser starts rule
        game.start_new_series(true);
        
        // Red (loser) should start next game
        assert_eq!(game.current_player(), Player::Red);
        assert!(game.winner.is_none());
        assert_eq!(game.move_count(), 0);
        
        // Test without loser starts rule
        game.winner = Some(Player::Red);
        game.start_new_series(false);
        
        // Yellow should start (default)
        assert_eq!(game.current_player(), Player::Yellow);
        assert!(game.winner.is_none());
    }
    
    #[test]
    fn test_reset_with_starting_player() {
        let mut game = Connect4Game::new();
        
        // Make some moves
        game.make_move_internal(3).unwrap();
        game.make_move_internal(4).unwrap();
        
        // Reset with Red starting
        game.reset_with_starting_player(Player::Red);
        
        // Verify reset state
        assert_eq!(game.current_player(), Player::Red);
        assert_eq!(game.move_count(), 0);
        assert!(game.winner.is_none());
        assert_eq!(game.get_cell(5, 3), 0); // Board cleared
        assert_eq!(game.get_cell(5, 4), 0); // Board cleared
    }
    
    #[test]
    fn test_series_with_fixed_player_colors() {
        let mut game = Connect4Game::new();
        
        // Set up a game where Yellow wins
        game.make_move_internal(3).unwrap(); // Yellow
        game.make_move_internal(4).unwrap(); // Red
        game.make_move_internal(3).unwrap(); // Yellow
        game.make_move_internal(4).unwrap(); // Red
        game.make_move_internal(3).unwrap(); // Yellow
        game.make_move_internal(4).unwrap(); // Red
        game.make_move_internal(3).unwrap(); // Yellow wins (4 in a row vertically)
        
        assert_eq!(game.winner(), Some(Player::Yellow));
        
        // Start new series with fixed colors: Player A = Yellow, Player B = Red
        // Since Yellow won, Red should start the next game
        game.start_new_series_with_players(Player::Yellow, Player::Red, Player::Yellow);
        
        // Verify game is reset
        assert_eq!(game.winner(), None);
        assert_eq!(game.move_count(), 0);
        
        // Verify Red starts (loser starts, but keeps their color)
        assert_eq!(game.current_player(), Player::Red);
        
        // Test the reverse scenario: if Red wins, Yellow should start
        let mut game2 = Connect4Game::new();
        game2.start_new_series_with_players(Player::Yellow, Player::Red, Player::Red);
        assert_eq!(game2.current_player(), Player::Yellow);
    }
}