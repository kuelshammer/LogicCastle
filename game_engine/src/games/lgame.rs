use wasm_bindgen::prelude::*;
use crate::data::BitPackedBoard;
use super::super::{Player, GameError};

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

/// L-Game implementation using 3 separate BitPackedBoard<4,4,1>
/// Following Connect4 pattern: separate boards for each piece type
#[wasm_bindgen]
pub struct LGame {
    // Three separate 1-bit boards (Connect4 pattern)
    player1_board: BitPackedBoard<4, 4, 1>,  // Player 1 L-pieces
    player2_board: BitPackedBoard<4, 4, 1>,  // Player 2 L-pieces
    neutral_board: BitPackedBoard<4, 4, 1>,  // Neutral pieces
    
    // Game state
    current_player: Player,
    move_count: u32,
    game_over: bool,
    winner: Option<Player>,
    
    // L-piece positions (for efficient move generation)
    player1_l_position: Option<LPiecePosition>,
    player2_l_position: Option<LPiecePosition>,
}

#[wasm_bindgen]
impl LGame {
    /// Create new L-Game with initial setup
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut game = Self {
            player1_board: BitPackedBoard::new(),
            player2_board: BitPackedBoard::new(),
            neutral_board: BitPackedBoard::new(),
            current_player: Player::Yellow,
            move_count: 0,
            game_over: false,
            winner: None,
            player1_l_position: None,
            player2_l_position: None,
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
    
    /// Reset game to initial state
    pub fn reset(&mut self) {
        self.current_player = Player::Yellow;
        self.move_count = 0;
        self.game_over = false;
        self.winner = None;
        self.setup_initial_position();
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