use wasm_bindgen::prelude::*;
use crate::data::BitPackedBoard;
use crate::geometry::QuadraticGrid;
use crate::{Player, GameError, GamePhase, PositionAnalysis};

/// L-Piece position and orientation
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct LPiecePosition {
    pub row: usize,
    pub col: usize,
    pub orientation: u8, // 0-7 for 8 possible orientations
}

/// L-Game move consisting of L-piece move and optional neutral piece move
#[derive(Clone, Debug)]
pub struct LGameMove {
    pub l_piece_from: LPiecePosition,
    pub l_piece_to: LPiecePosition,
    pub neutral_from: Option<(usize, usize)>,
    pub neutral_to: Option<(usize, usize)>,
}

/// L-Game implementation using the Three-Layer Architecture
/// Composes geometry and data layers for clean separation of concerns
#[wasm_bindgen]
#[derive(Clone)]
pub struct LGame {
    // Composition: Geometry layer handles coordinate logic
    geometry: QuadraticGrid<4, 4, 1>,
    
    // Composition: Data layer handles efficient storage (3 separate boards)
    player1_board: BitPackedBoard<4, 4, 1>,  // Player 1 L-pieces (Yellow/Blue)
    player2_board: BitPackedBoard<4, 4, 1>,  // Player 2 L-pieces (Red/Green)
    neutral_board: BitPackedBoard<4, 4, 1>,  // Neutral pieces
    
    // Game-specific state
    current_player: Player,
    move_count: u32,
    game_over: bool,
    winner: Option<Player>,
    
    // L-piece positions (for efficient move generation and validation)
    player1_l_position: Option<LPiecePosition>,
    player2_l_position: Option<LPiecePosition>,
    
    // Move history for undo functionality
    move_history: Vec<LGameMove>,
}

#[wasm_bindgen]
impl LGame {
    /// Create new L-Game with initial setup
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::new_with_starting_player(Player::Yellow)
    }
    
    /// Create a new L-Game with a specific starting player
    /// This is essential for game series where "loser starts next game"
    pub fn new_with_starting_player(starting_player: Player) -> Self {
        let mut game = Self {
            geometry: QuadraticGrid::new(),
            player1_board: BitPackedBoard::new(),
            player2_board: BitPackedBoard::new(),
            neutral_board: BitPackedBoard::new(),
            current_player: starting_player,
            move_count: 0,
            game_over: false,
            winner: None,
            player1_l_position: None,
            player2_l_position: None,
            move_history: Vec::new(),
        };
        
        game.setup_initial_position();
        game
    }
    
    /// Setup initial L-Game position
    fn setup_initial_position(&mut self) {
        // Clear all boards
        self.player1_board.clear();
        self.player2_board.clear();
        self.neutral_board.clear();
        
        // Place Player 1 L-piece (top-left, orientation 0)
        // L-shape: covers (0,0), (1,0), (2,0), (2,1)
        self.player1_board.set_cell(0, 0, 1).unwrap();
        self.player1_board.set_cell(1, 0, 1).unwrap();
        self.player1_board.set_cell(2, 0, 1).unwrap();
        self.player1_board.set_cell(2, 1, 1).unwrap();
        self.player1_l_position = Some(LPiecePosition { row: 0, col: 0, orientation: 0 });
        
        // Place Player 2 L-piece (bottom-right, orientation 4 - flipped)
        // L-shape: covers (1,2), (1,3), (2,3), (3,3)
        self.player2_board.set_cell(1, 2, 1).unwrap();
        self.player2_board.set_cell(1, 3, 1).unwrap();
        self.player2_board.set_cell(2, 3, 1).unwrap();
        self.player2_board.set_cell(3, 3, 1).unwrap();
        self.player2_l_position = Some(LPiecePosition { row: 1, col: 2, orientation: 4 });
        
        // Place neutral pieces at (0,3) and (3,0)
        self.neutral_board.set_cell(0, 3, 1).unwrap();
        self.neutral_board.set_cell(3, 0, 1).unwrap();
    }
    
    /// Get current player
    #[wasm_bindgen(getter)]
    pub fn current_player(&self) -> Player {
        self.current_player
    }
    
    /// Get move count
    #[wasm_bindgen(getter)]
    pub fn move_count(&self) -> u32 {
        self.move_count
    }
    
    /// Check if game is over
    #[wasm_bindgen(getter)]
    pub fn game_over(&self) -> bool {
        self.game_over
    }
    
    /// Get winner (if any)
    #[wasm_bindgen(getter)]
    pub fn winner(&self) -> Option<Player> {
        self.winner
    }
    
    
    /// Get cell value at position (for JavaScript interface)
    /// Returns: 0=empty, 1=player1, 2=player2, 3=neutral
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        if row >= 4 || col >= 4 {
            return 0;
        }
        
        if self.player1_board.get_cell(row, col) == 1 {
            return 1;
        }
        if self.player2_board.get_cell(row, col) == 1 {
            return 2;
        }
        if self.neutral_board.get_cell(row, col) == 1 {
            return 3;
        }
        0
    }
    
    /// Get complete board state as flat array (for JavaScript)
    pub fn get_board_state(&self) -> Vec<u8> {
        let mut board = vec![0u8; 16];
        
        for row in 0..4 {
            for col in 0..4 {
                let index = row * 4 + col;
                board[index] = self.get_cell(row, col);
            }
        }
        
        board
    }
    
    /// Check if position is occupied by any piece
    fn is_occupied(&self, row: usize, col: usize) -> bool {
        if row >= 4 || col >= 4 {
            return true; // Out of bounds = occupied
        }
        
        self.player1_board.get_cell(row, col) == 1 ||
        self.player2_board.get_cell(row, col) == 1 ||
        self.neutral_board.get_cell(row, col) == 1
    }
    
    /// Get L-piece shape coordinates for given position and orientation
    fn get_l_piece_coordinates(&self, pos: LPiecePosition) -> Vec<(usize, usize)> {
        let base_row = pos.row;
        let base_col = pos.col;
        
        // 8 orientations of L-piece (4 rotations × 2 reflections)
        match pos.orientation {
            0 => vec![(base_row, base_col), (base_row + 1, base_col), (base_row + 2, base_col), (base_row + 2, base_col + 1)],
            1 => vec![(base_row, base_col), (base_row, base_col + 1), (base_row, base_col + 2), (base_row + 1, base_col)],
            2 => vec![(base_row, base_col), (base_row, base_col + 1), (base_row + 1, base_col + 1), (base_row + 2, base_col + 1)],
            3 => vec![(base_row, base_col + 2), (base_row + 1, base_col), (base_row + 1, base_col + 1), (base_row + 1, base_col + 2)],
            4 => vec![(base_row, base_col + 1), (base_row + 1, base_col + 1), (base_row + 2, base_col), (base_row + 2, base_col + 1)],
            5 => vec![(base_row, base_col), (base_row + 1, base_col), (base_row + 1, base_col + 1), (base_row + 1, base_col + 2)],
            6 => vec![(base_row, base_col), (base_row, base_col + 1), (base_row + 1, base_col), (base_row + 2, base_col)],
            7 => vec![(base_row, base_col), (base_row, base_col + 1), (base_row, base_col + 2), (base_row + 1, base_col + 2)],
            _ => vec![], // Invalid orientation
        }
    }
    
    /// Check if L-piece can be placed at given position
    fn can_place_l_piece(&self, pos: LPiecePosition, ignore_player: Option<Player>) -> bool {
        let coordinates = self.get_l_piece_coordinates(pos);
        
        // Check all coordinates are valid and unoccupied (except by the piece being moved)
        for (row, col) in coordinates {
            if row >= 4 || col >= 4 {
                return false; // Out of bounds
            }
            
            // Check occupation, ignoring the current player's piece if specified
            let player1_occupied = self.player1_board.get_cell(row, col) == 1;
            let player2_occupied = self.player2_board.get_cell(row, col) == 1;
            let neutral_occupied = self.neutral_board.get_cell(row, col) == 1;
            
            let occupied = match ignore_player {
                Some(Player::Yellow) => player2_occupied || neutral_occupied,
                Some(Player::Red) => player1_occupied || neutral_occupied,
                _ => player1_occupied || player2_occupied || neutral_occupied,
            };
            
            if occupied {
                return false;
            }
        }
        
        true
    }
    
    /// Generate all valid L-piece positions for current player (internal use)
    fn get_valid_l_moves(&self) -> Vec<LPiecePosition> {
        let mut valid_moves = Vec::new();
        
        // Try all positions and orientations
        for row in 0..4 {
            for col in 0..4 {
                for orientation in 0..8 {
                    let pos = LPiecePosition { row, col, orientation };
                    
                    // Skip current position
                    let current_pos = match self.current_player {
                        Player::Yellow => self.player1_l_position,
                        Player::Red => self.player2_l_position,
                        _ => None,
                    };
                    
                    if Some(pos) == current_pos {
                        continue;
                    }
                    
                    // Check if position is valid
                    if self.can_place_l_piece(pos, Some(self.current_player)) {
                        valid_moves.push(pos);
                    }
                }
            }
        }
        
        valid_moves
    }
    
    /// Get valid moves count (for JavaScript interface)
    pub fn get_valid_moves_count(&self) -> usize {
        self.get_valid_l_moves().len()
    }
    
    /// Check if current player is blocked (cannot move L-piece)
    pub fn is_current_player_blocked(&self) -> bool {
        self.get_valid_l_moves().is_empty()
    }
    
    /// Make a move (L-piece move is mandatory, neutral move is optional)
    pub fn make_move(&mut self, l_to_row: usize, l_to_col: usize, l_to_orientation: u8) -> Result<(), GameError> {
        if self.game_over {
            return Err(GameError::GameAlreadyOver);
        }
        
        let new_l_pos = LPiecePosition {
            row: l_to_row,
            col: l_to_col,
            orientation: l_to_orientation,
        };
        
        // Validate L-piece move
        if !self.can_place_l_piece(new_l_pos, Some(self.current_player)) {
            return Err(GameError::InvalidMove);
        }
        
        // Get coordinates before mutable borrows
        let current_pos = match self.current_player {
            Player::Yellow => self.player1_l_position.unwrap(),
            Player::Red => self.player2_l_position.unwrap(),
            _ => return Err(GameError::InvalidMove),
        };
        
        // Record move in history for undo functionality
        let game_move = LGameMove {
            l_piece_from: current_pos,
            l_piece_to: new_l_pos,
            neutral_from: None,
            neutral_to: None,
        };
        
        let old_coordinates = self.get_l_piece_coordinates(current_pos);
        let new_coordinates = self.get_l_piece_coordinates(new_l_pos);
        
        // Clear current L-piece position
        let current_board = match self.current_player {
            Player::Yellow => &mut self.player1_board,
            Player::Red => &mut self.player2_board,
            _ => return Err(GameError::InvalidMove),
        };
        
        // Remove old L-piece
        for (row, col) in old_coordinates {
            current_board.set_cell(row, col, 0).unwrap();
        }
        
        // Place new L-piece
        for (row, col) in new_coordinates {
            current_board.set_cell(row, col, 1).unwrap();
        }
        
        // Update position
        match self.current_player {
            Player::Yellow => self.player1_l_position = Some(new_l_pos),
            Player::Red => self.player2_l_position = Some(new_l_pos),
            _ => return Err(GameError::InvalidMove),
        }
        
        // Store move in history
        self.move_history.push(game_move);
        
        // Check for win condition (opponent blocked)
        self.current_player = match self.current_player {
            Player::Yellow => Player::Red,
            Player::Red => Player::Yellow,
            _ => return Err(GameError::InvalidMove),
        };
        
        if self.is_current_player_blocked() {
            self.game_over = true;
            self.winner = Some(match self.current_player {
                Player::Yellow => Player::Red, // Opponent wins
                Player::Red => Player::Yellow,
                _ => return Err(GameError::InvalidMove),
            });
        }
        
        self.move_count += 1;
        Ok(())
    }
    
    /// Move neutral piece (optional part of move)
    pub fn move_neutral_piece(&mut self, from_row: usize, from_col: usize, to_row: usize, to_col: usize) -> Result<(), GameError> {
        if self.game_over {
            return Err(GameError::GameAlreadyOver);
        }
        
        // Validate from position has neutral piece
        if self.neutral_board.get_cell(from_row, from_col) != 1 {
            return Err(GameError::InvalidMove);
        }
        
        // Validate to position is empty
        if self.is_occupied(to_row, to_col) {
            return Err(GameError::InvalidMove);
        }
        
        // Move neutral piece
        self.neutral_board.set_cell(from_row, from_col, 0).unwrap();
        self.neutral_board.set_cell(to_row, to_col, 1).unwrap();
        
        Ok(())
    }
    
    /// Get game status summary for debugging
    pub fn get_status_summary(&self) -> String {
        format!(
            "L-Game: Player={:?}, Moves={}, Over={}, Winner={:?}, ValidMoves={}",
            self.current_player,
            self.move_count,
            self.game_over,
            self.winner,
            self.get_valid_moves_count()
        )
    }
    
    // === MISSING API METHODS FOR FRONTEND COMPATIBILITY ===
    
    /// Get memory usage of the game state (for performance monitoring)
    #[wasm_bindgen]
    pub fn memory_usage(&self) -> usize {
        // Calculate approximate memory usage
        let bitpacked_boards = std::mem::size_of::<BitPackedBoard<4, 4, 1>>() * 3; // 3 boards
        let game_state = std::mem::size_of::<LGame>() - bitpacked_boards;
        let move_history = self.move_history.len() * std::mem::size_of::<LGameMove>();
        
        bitpacked_boards + game_state + move_history
    }
    
    /// Get current player (frontend naming convention)
    #[wasm_bindgen]
    pub fn get_current_player(&self) -> Player {
        self.current_player()
    }
    
    /// Get move count (frontend naming convention)
    #[wasm_bindgen]
    pub fn get_move_count(&self) -> u32 {
        self.move_count()
    }
    
    /// Get winner (frontend naming convention)
    #[wasm_bindgen]
    pub fn get_winner(&self) -> Option<Player> {
        self.winner()
    }
    
    /// Check if game is over (frontend naming convention)
    #[wasm_bindgen]
    pub fn is_game_over(&self) -> bool {
        self.game_over()
    }
    
    /// Get board state as flat array for frontend (4 rows × 4 cols = 16 elements)
    /// Returns: 0=empty, 1=player1, 2=player2, 3=neutral
    #[wasm_bindgen]
    pub fn get_board(&self) -> Vec<u8> {
        self.get_board_state()
    }
    
    /// Check if undo is possible
    #[wasm_bindgen]
    pub fn can_undo(&self) -> bool {
        !self.move_history.is_empty() && !self.is_game_over()
    }
    
    /// Undo the last move
    #[wasm_bindgen]
    pub fn undo_move(&mut self) -> bool {
        if !self.can_undo() {
            return false;
        }
        
        if let Some(last_move) = self.move_history.pop() {
            // Reverse the L-piece move
            self.reverse_l_piece_move(&last_move);
            
            // Reverse neutral piece move if it happened
            if let (Some(neutral_from), Some(neutral_to)) = (last_move.neutral_from, last_move.neutral_to) {
                self.neutral_board.set_cell(neutral_to.0, neutral_to.1, 0).unwrap();
                self.neutral_board.set_cell(neutral_from.0, neutral_from.1, 1).unwrap();
            }
            
            // Update game state
            self.move_count -= 1;
            self.current_player = match self.current_player {
                Player::Yellow => Player::Red,
                Player::Red => Player::Yellow,
                _ => self.current_player,
            };
            self.game_over = false;
            self.winner = None;
            
            true
        } else {
            false
        }
    }
    
    /// Helper method to reverse L-piece move
    fn reverse_l_piece_move(&mut self, game_move: &LGameMove) {
        // Get coordinates before mutable borrows
        let new_coords = self.get_l_piece_coordinates(game_move.l_piece_to);
        let old_coords = self.get_l_piece_coordinates(game_move.l_piece_from);
        
        // Clear current position and restore old position
        match self.current_player {
            Player::Yellow => {
                // Opposite because we switch back
                for (row, col) in new_coords {
                    self.player2_board.set_cell(row, col, 0).unwrap();
                }
                for (row, col) in old_coords {
                    self.player2_board.set_cell(row, col, 1).unwrap();
                }
                self.player2_l_position = Some(game_move.l_piece_from);
            },
            Player::Red => {
                for (row, col) in new_coords {
                    self.player1_board.set_cell(row, col, 0).unwrap();
                }
                for (row, col) in old_coords {
                    self.player1_board.set_cell(row, col, 1).unwrap();
                }
                self.player1_l_position = Some(game_move.l_piece_from);
            },
            _ => return,
        }
    }
    
    /// Analyze current position comprehensively
    #[wasm_bindgen]
    pub fn analyze_position(&self) -> PositionAnalysis {
        let current_moves = self.get_valid_moves_count();
        let opponent_moves = self.get_opponent_moves_count();
        let mobility_score = current_moves as i32 - opponent_moves as i32;
        let phase = self.get_game_phase();
        
        PositionAnalysis {
            current_player_threats: if current_moves == 0 { 0 } else { 1 },
            opponent_threats: if opponent_moves == 0 { 1 } else { 0 },
            total_pieces: 6, // Always 6 pieces in L-Game
            connectivity_score: mobility_score,
            game_phase: phase,
            evaluation_score: mobility_score * 10,
        }
    }
    
    /// Get opponent moves count (for position analysis)
    fn get_opponent_moves_count(&self) -> usize {
        // Temporarily switch to opponent
        let opponent = match self.current_player {
            Player::Yellow => Player::Red,
            Player::Red => Player::Yellow,
            _ => return 0,
        };
        
        // Create a temporary copy to check opponent moves
        let mut temp_game = self.clone();
        temp_game.current_player = opponent;
        
        temp_game.get_valid_moves_count()
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
    
    
    /// Reset game with a specific starting player
    pub fn reset_with_starting_player(&mut self, starting_player: Player) {
        self.player1_board.clear();
        self.player2_board.clear();
        self.neutral_board.clear();
        self.current_player = starting_player;
        self.move_count = 0;
        self.game_over = false;
        self.winner = None;
        self.player1_l_position = None;
        self.player2_l_position = None;
        self.move_history.clear();
        
        self.setup_initial_position();
    }
    
    /// Reset game to initial state
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.reset_with_starting_player(Player::Yellow);
    }
    
    /// Frontend-friendly method aliases (Connect4 compatibility)
    #[wasm_bindgen]
    pub fn newGame(&mut self) {
        self.reset();
    }
    
    #[wasm_bindgen]
    pub fn undoMove(&mut self) -> bool {
        self.undo_move()
    }
    
    /// Get valid L-piece moves for current player (for frontend)
    #[wasm_bindgen]
    pub fn get_valid_l_moves_json(&self) -> String {
        let moves = self.get_valid_l_moves();
        let mut json = String::from("[");
        
        for (i, mov) in moves.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(
                "{{\"row\":{},\"col\":{},\"orientation\":{}}}",
                mov.row, mov.col, mov.orientation
            ));
        }
        
        json.push(']');
        json
    }
    
    /// Check if a specific L-piece move is valid
    #[wasm_bindgen]
    pub fn is_valid_l_move(&self, row: usize, col: usize, orientation: u8) -> bool {
        let pos = LPiecePosition { row, col, orientation };
        self.can_place_l_piece(pos, Some(self.current_player))
    }
    
    /// Get neutral piece positions
    #[wasm_bindgen]
    pub fn get_neutral_positions(&self) -> Vec<u8> {
        let mut positions = Vec::new();
        for row in 0..4 {
            for col in 0..4 {
                if self.neutral_board.get_cell(row, col) == 1 {
                    positions.push(row as u8);
                    positions.push(col as u8);
                }
            }
        }
        positions
    }
    
    /// Get L-piece position for a specific player
    #[wasm_bindgen]
    pub fn get_l_piece_position(&self, player: Player) -> Vec<u8> {
        let position = match player {
            Player::Yellow => self.player1_l_position,
            Player::Red => self.player2_l_position,
            _ => None,
        };
        
        if let Some(pos) = position {
            vec![pos.row as u8, pos.col as u8, pos.orientation]
        } else {
            vec![]
        }
    }
}

// Internal implementation for AI access and optimization
impl LGame {
    /// Create LGame from existing boards (for testing and AI)
    /// This allows loading arbitrary board states without move validation
    pub fn from_boards(
        player1_board: BitPackedBoard<4, 4, 1>,
        player2_board: BitPackedBoard<4, 4, 1>,
        neutral_board: BitPackedBoard<4, 4, 1>,
        current_player: Player
    ) -> Self {
        let mut game = Self {
            geometry: QuadraticGrid::new(),
            player1_board,
            player2_board,
            neutral_board,
            current_player,
            move_count: 0,
            game_over: false,
            winner: None,
            player1_l_position: None,
            player2_l_position: None,
            move_history: Vec::new(),
        };
        
        // Detect L-piece positions from board state
        game.detect_l_piece_positions();
        game
    }
    
    /// Detect L-piece positions from current board state
    fn detect_l_piece_positions(&mut self) {
        // This is a complex algorithm to reverse-engineer L-piece positions
        // For now, we'll implement a simple detection for the most common positions
        
        // Try to find Player 1 L-piece
        for row in 0..4 {
            for col in 0..4 {
                for orientation in 0..8 {
                    let pos = LPiecePosition { row, col, orientation };
                    let coords = self.get_l_piece_coordinates(pos);
                    
                    if coords.len() == 4 && coords.iter().all(|(r, c)| {
                        *r < 4 && *c < 4 && self.player1_board.get_cell(*r, *c) == 1
                    }) {
                        // Check if exactly these 4 cells match the L-piece
                        let mut matches = true;
                        for test_row in 0..4 {
                            for test_col in 0..4 {
                                let should_be_occupied = coords.contains(&(test_row, test_col));
                                let is_occupied = self.player1_board.get_cell(test_row, test_col) == 1;
                                if should_be_occupied != is_occupied {
                                    matches = false;
                                    break;
                                }
                            }
                            if !matches { break; }
                        }
                        
                        if matches {
                            self.player1_l_position = Some(pos);
                            break;
                        }
                    }
                }
            }
        }
        
        // Try to find Player 2 L-piece (similar logic)
        for row in 0..4 {
            for col in 0..4 {
                for orientation in 0..8 {
                    let pos = LPiecePosition { row, col, orientation };
                    let coords = self.get_l_piece_coordinates(pos);
                    
                    if coords.len() == 4 && coords.iter().all(|(r, c)| {
                        *r < 4 && *c < 4 && self.player2_board.get_cell(*r, *c) == 1
                    }) {
                        // Check if exactly these 4 cells match the L-piece
                        let mut matches = true;
                        for test_row in 0..4 {
                            for test_col in 0..4 {
                                let should_be_occupied = coords.contains(&(test_row, test_col));
                                let is_occupied = self.player2_board.get_cell(test_row, test_col) == 1;
                                if should_be_occupied != is_occupied {
                                    matches = false;
                                    break;
                                }
                            }
                            if !matches { break; }
                        }
                        
                        if matches {
                            self.player2_l_position = Some(pos);
                            break;
                        }
                    }
                }
            }
        }
    }
    
    /// Make a move for internal/test use (returns Result<bool, String>)
    pub fn make_move_internal(&mut self, l_to_row: usize, l_to_col: usize, l_to_orientation: u8) -> Result<bool, String> {
        match self.make_move(l_to_row, l_to_col, l_to_orientation) {
            Ok(_) => Ok(self.game_over),
            Err(GameError::GameAlreadyOver) => Err("Game is already over".to_string()),
            Err(GameError::InvalidMove) => Err("Invalid move".to_string()),
            Err(_) => Err("Unknown error".to_string()),
        }
    }
    
    /// Get board for AI evaluation (internal use)
    pub fn get_board_for_player(&self, player: Player) -> &BitPackedBoard<4, 4, 1> {
        match player {
            Player::Yellow => &self.player1_board,
            Player::Red => &self.player2_board,
            _ => &self.player1_board, // Default fallback
        }
    }
    
    /// Get geometry for AI evaluation (internal use)
    pub fn geometry(&self) -> &QuadraticGrid<4, 4, 1> {
        &self.geometry
    }
    
    /// Evaluate position for AI (mobility-based heuristic)
    pub fn evaluate_position(&self) -> i32 {
        let current_moves = self.get_valid_moves_count() as i32;
        let opponent_moves = self.get_opponent_moves_count() as i32;
        
        // High mobility difference = good position
        let mobility_score = (current_moves - opponent_moves) * 10;
        
        // Bonus for controlling center
        let center_control_score = self.evaluate_center_control();
        
        // Penalty if close to being blocked
        let blocking_penalty = if current_moves <= 1 { -50 } else { 0 };
        
        mobility_score + center_control_score + blocking_penalty
    }
    
    /// Evaluate center control for positional assessment
    fn evaluate_center_control(&self) -> i32 {
        let mut score = 0;
        
        // Center cells (1,1), (1,2), (2,1), (2,2) are valuable
        let center_cells = [(1, 1), (1, 2), (2, 1), (2, 2)];
        
        for (row, col) in center_cells {
            if self.player1_board.get_cell(row, col) == 1 {
                score += if self.current_player == Player::Yellow { 5 } else { -5 };
            }
            if self.player2_board.get_cell(row, col) == 1 {
                score += if self.current_player == Player::Red { 5 } else { -5 };
            }
        }
        
        score
    }
    
    /// Create a copy of the game with a move applied (for AI lookahead)
    pub fn make_move_copy(&self, l_to_row: usize, l_to_col: usize, l_to_orientation: u8) -> Option<LGame> {
        let mut game_copy = self.clone();
        
        if game_copy.make_move(l_to_row, l_to_col, l_to_orientation).is_ok() {
            Some(game_copy)
        } else {
            None
        }
    }
    
    /// Check if the L-game state is valid (for testing)
    pub fn is_valid_state(&self) -> bool {
        // Check that each player has exactly one L-piece (4 cells each)
        let player1_pieces = self.player1_board.count_set_bits();
        let player2_pieces = self.player2_board.count_set_bits();
        let neutral_pieces = self.neutral_board.count_set_bits();
        
        // L-game should have exactly 4 + 4 + 2 = 10 pieces
        if player1_pieces != 4 || player2_pieces != 4 || neutral_pieces != 2 {
            return false;
        }
        
        // Check that no cells overlap
        for row in 0..4 {
            for col in 0..4 {
                let occupied_count = 
                    (if self.player1_board.get_cell(row, col) == 1 { 1 } else { 0 }) +
                    (if self.player2_board.get_cell(row, col) == 1 { 1 } else { 0 }) +
                    (if self.neutral_board.get_cell(row, col) == 1 { 1 } else { 0 });
                
                if occupied_count > 1 {
                    return false; // Overlapping pieces
                }
            }
        }
        
        // Check that L-piece positions are valid
        if let Some(pos1) = self.player1_l_position {
            let coords1 = self.get_l_piece_coordinates(pos1);
            if coords1.len() != 4 || !coords1.iter().all(|(r, c)| {
                *r < 4 && *c < 4 && self.player1_board.get_cell(*r, *c) == 1
            }) {
                return false;
            }
        }
        
        if let Some(pos2) = self.player2_l_position {
            let coords2 = self.get_l_piece_coordinates(pos2);
            if coords2.len() != 4 || !coords2.iter().all(|(r, c)| {
                *r < 4 && *c < 4 && self.player2_board.get_cell(*r, *c) == 1
            }) {
                return false;
            }
        }
        
        true
    }
    
    /// Get all valid moves as a structured format (for AI)
    pub fn get_all_valid_moves(&self) -> Vec<(usize, usize, u8)> {
        let l_moves = self.get_valid_l_moves();
        l_moves.into_iter()
            .map(|pos| (pos.row, pos.col, pos.orientation))
            .collect()
    }
    
    /// Calculate move complexity (for AI difficulty adjustment)
    pub fn get_move_complexity(&self) -> usize {
        self.get_valid_moves_count()
    }
    
    /// Get compact game state for caching (performance optimization)
    pub fn get_compact_state(&self) -> u64 {
        // Use bit manipulation to create a compact state representation
        let mut state = 0u64;
        
        // Pack current player (1 bit)
        state |= if self.current_player == Player::Yellow { 0 } else { 1 };
        
        // Pack game over status (1 bit)
        state |= if self.game_over { 1 } else { 0 } << 1;
        
        // Pack move count (8 bits, max 255)
        state |= (self.move_count as u64 & 0xFF) << 2;
        
        // Pack board hash (remaining bits)
        let board_hash = self.calculate_board_hash();
        state |= (board_hash & 0xFFFFFFFFFFFF) << 10; // 54 bits for board
        
        state
    }
    
    /// Calculate hash of board state for quick comparisons
    fn calculate_board_hash(&self) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        
        // Hash all three boards
        for row in 0..4 {
            for col in 0..4 {
                let cell_state = (
                    self.player1_board.get_cell(row, col),
                    self.player2_board.get_cell(row, col),
                    self.neutral_board.get_cell(row, col)
                );
                cell_state.hash(&mut hasher);
            }
        }
        
        hasher.finish()
    }
}

impl Default for LGame {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_initial_setup() {
        let game = LGame::new();
        
        // Check initial positions
        assert_eq!(game.current_player, Player::Yellow);
        assert_eq!(game.move_count, 0);
        assert!(!game.game_over);
        assert!(game.winner.is_none());
        
        // Check Player 1 L-piece at (0,0) orientation 0
        assert_eq!(game.get_cell(0, 0), 1);
        assert_eq!(game.get_cell(1, 0), 1);
        assert_eq!(game.get_cell(2, 0), 1);
        assert_eq!(game.get_cell(2, 1), 1);
        
        // Check Player 2 L-piece at (1,2) orientation 4
        assert_eq!(game.get_cell(1, 2), 2);
        assert_eq!(game.get_cell(1, 3), 2);
        assert_eq!(game.get_cell(2, 3), 2);
        assert_eq!(game.get_cell(3, 3), 2);
        
        // Check neutral pieces
        assert_eq!(game.get_cell(0, 3), 3);
        assert_eq!(game.get_cell(3, 0), 3);
    }
    
    #[test]
    fn test_l_piece_coordinates() {
        let game = LGame::new();
        
        // Test orientation 0 at (0,0)
        let coords = game.get_l_piece_coordinates(LPiecePosition { row: 0, col: 0, orientation: 0 });
        assert_eq!(coords, vec![(0, 0), (1, 0), (2, 0), (2, 1)]);
        
        // Test orientation 1 at (0,0)
        let coords = game.get_l_piece_coordinates(LPiecePosition { row: 0, col: 0, orientation: 1 });
        assert_eq!(coords, vec![(0, 0), (0, 1), (0, 2), (1, 0)]);
    }
    
    #[test]
    fn test_valid_moves_generation() {
        let game = LGame::new();
        let valid_moves = game.get_valid_l_moves();
        
        // Should have some valid moves for Yellow player
        assert!(!valid_moves.is_empty());
        
        // All moves should be different from current position
        let current_pos = game.player1_l_position.unwrap();
        for move_pos in valid_moves {
            assert_ne!(move_pos, current_pos);
        }
    }
    
    #[test]
    fn test_board_state_consistency() {
        let game = LGame::new();
        let board_state = game.get_board_state();
        
        assert_eq!(board_state.len(), 16);
        
        // Check that board state matches individual cell queries
        for row in 0..4 {
            for col in 0..4 {
                let index = row * 4 + col;
                assert_eq!(board_state[index], game.get_cell(row, col));
            }
        }
    }
}