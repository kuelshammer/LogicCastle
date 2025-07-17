use crate::games::GomokuGame;
use crate::{Player};
use crate::geometry::BoardGeometry;
use std::cmp;

/// Gomoku AI implementation using pattern-based evaluation
/// Focuses on 5-in-a-row winning patterns and threat detection
#[derive(Clone, Debug)]
pub struct GomokuAI {
    max_depth: usize,
    use_pattern_evaluation: bool,
    threat_weight: i32,
    center_weight: i32,
    opening_book: bool,
}

impl GomokuAI {
    /// Create a new Gomoku AI with default settings
    pub fn new() -> Self {
        Self {
            max_depth: 4,           // 4-move lookahead for good performance
            use_pattern_evaluation: true,
            threat_weight: 1000,    // High weight for threats
            center_weight: 10,      // Moderate center control
            opening_book: true,     // Use opening book for first moves
        }
    }
    
    /// Create AI with custom depth
    pub fn new_with_depth(depth: usize) -> Self {
        let mut ai = Self::new();
        ai.max_depth = depth;
        ai
    }
    
    /// Get the best move for the current player
    pub fn get_best_move(&self, game: &GomokuGame) -> Option<(usize, usize)> {
        self.get_best_move_for_player(game, game.current_player())
    }
    
    /// Get the best move for a specific player (bidirectional AI)
    pub fn get_best_move_for_player(&self, game: &GomokuGame, player: Player) -> Option<(usize, usize)> {
        // Handle opening moves with opening book
        if self.opening_book && game.move_count() < 3 {
            return self.get_opening_move(game);
        }
        
        // Check for immediate winning moves
        if let Some(winning_move) = self.find_winning_move(game, player) {
            return Some(winning_move);
        }
        
        // Check for immediate blocking moves
        let opponent = player.opponent();
        if let Some(blocking_move) = self.find_winning_move(game, opponent) {
            return Some(blocking_move);
        }
        
        // Check for threat moves (4-in-a-row)
        if let Some(threat_move) = self.find_threat_move(game, player) {
            return Some(threat_move);
        }
        
        // Check for blocking opponent threats
        if let Some(block_threat) = self.find_threat_move(game, opponent) {
            return Some(block_threat);
        }
        
        // Use minimax for strategic evaluation
        self.minimax_search(game, player)
    }
    
    /// Opening book for first few moves
    fn get_opening_move(&self, game: &GomokuGame) -> Option<(usize, usize)> {
        match game.move_count() {
            0 => Some((7, 7)),      // Center opening
            1 => {
                // Play near center but not adjacent
                let center_moves = vec![(6, 6), (6, 8), (8, 6), (8, 8), (5, 7), (9, 7), (7, 5), (7, 9)];
                for &(row, col) in &center_moves {
                    if game.is_valid_move(row, col) {
                        return Some((row, col));
                    }
                }
                None
            }
            2 => {
                // Form a line or create space
                let strategic_moves = vec![(6, 7), (8, 7), (7, 6), (7, 8), (5, 5), (9, 9)];
                for &(row, col) in &strategic_moves {
                    if game.is_valid_move(row, col) {
                        return Some((row, col));
                    }
                }
                None
            }
            _ => None
        }
    }
    
    /// Find immediate winning move (5-in-a-row)
    fn find_winning_move(&self, game: &GomokuGame, player: Player) -> Option<(usize, usize)> {
        for row in 0..15 {
            for col in 0..15 {
                if game.is_valid_move(row, col) {
                    // Simulate the move
                    if let Some(test_game) = game.make_move_copy(row, col) {
                        if test_game.winner() == Some(player) {
                            return Some((row, col));
                        }
                    }
                }
            }
        }
        None
    }
    
    /// Find threat moves (4-in-a-row that can become 5)
    fn find_threat_move(&self, game: &GomokuGame, player: Player) -> Option<(usize, usize)> {
        // Find threat moves by checking patterns
        
        // Check for 4-in-a-row patterns that can be extended
        for row in 0..15 {
            for col in 0..15 {
                if game.is_valid_move(row, col) {
                    // Check if this position completes a 4-in-a-row
                    if self.creates_four_in_row(game, player, row, col) {
                        return Some((row, col));
                    }
                }
            }
        }
        
        None
    }
    
    /// Check if a move creates a 4-in-a-row pattern (optimized)
    fn creates_four_in_row(&self, game: &GomokuGame, player: Player, row: usize, col: usize) -> bool {
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)]; // horizontal, vertical, diagonal
        
        // Get direct board access for efficiency
        let player_board = game.get_board_for_player(player);
        let geometry = game.geometry();
        
        for &(dr, dc) in &directions {
            let mut count = 1; // Count the stone we're placing
            
            // Count in positive direction
            for i in 1..5 {
                let r = row as i32 + i * dr;
                let c = col as i32 + i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            count += 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            // Count in negative direction
            for i in 1..5 {
                let r = row as i32 - i * dr;
                let c = col as i32 - i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            count += 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
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
    
    /// Minimax search with alpha-beta pruning
    fn minimax_search(&self, game: &GomokuGame, player: Player) -> Option<(usize, usize)> {
        let mut best_move = None;
        let mut best_score = i32::MIN;
        let alpha = i32::MIN;
        let beta = i32::MAX;
        
        // Generate candidate moves (prioritize center and adjacent moves)
        let candidates = self.generate_candidate_moves(game);
        
        for (row, col) in candidates {
            if game.is_valid_move(row, col) {
                if let Some(test_game) = game.make_move_copy(row, col) {
                    let score = self.minimax(&test_game, self.max_depth - 1, alpha, beta, false, player);
                    
                    if score > best_score {
                        best_score = score;
                        best_move = Some((row, col));
                    }
                }
            }
        }
        
        best_move
    }
    
    /// Minimax algorithm with alpha-beta pruning
    fn minimax(&self, game: &GomokuGame, depth: usize, mut alpha: i32, mut beta: i32, 
               maximizing: bool, original_player: Player) -> i32 {
        
        // Terminal conditions
        if depth == 0 || game.is_game_over() {
            return self.evaluate_position(game, original_player);
        }
        
        if maximizing {
            let mut max_eval = i32::MIN;
            let candidates = self.generate_candidate_moves(game);
            
            for (row, col) in candidates.into_iter().take(20) { // Limit branching factor
                if game.is_valid_move(row, col) {
                    if let Some(test_game) = game.make_move_copy(row, col) {
                        let eval = self.minimax(&test_game, depth - 1, alpha, beta, false, original_player);
                        max_eval = cmp::max(max_eval, eval);
                        alpha = cmp::max(alpha, eval);
                        
                        if beta <= alpha {
                            break; // Alpha-beta pruning
                        }
                    }
                }
            }
            
            max_eval
        } else {
            let mut min_eval = i32::MAX;
            let candidates = self.generate_candidate_moves(game);
            
            for (row, col) in candidates.into_iter().take(20) { // Limit branching factor
                if game.is_valid_move(row, col) {
                    if let Some(test_game) = game.make_move_copy(row, col) {
                        let eval = self.minimax(&test_game, depth - 1, alpha, beta, true, original_player);
                        min_eval = cmp::min(min_eval, eval);
                        beta = cmp::min(beta, eval);
                        
                        if beta <= alpha {
                            break; // Alpha-beta pruning
                        }
                    }
                }
            }
            
            min_eval
        }
    }
    
    /// Generate candidate moves prioritizing important positions
    fn generate_candidate_moves(&self, game: &GomokuGame) -> Vec<(usize, usize)> {
        let mut candidates = Vec::new();
        let mut center_candidates = Vec::new();
        let mut adjacent_candidates = Vec::new();
        let mut other_candidates = Vec::new();
        
        for row in 0..15 {
            for col in 0..15 {
                if game.is_valid_move(row, col) {
                    // Prioritize center positions
                    if self.is_center_position(row, col) {
                        center_candidates.push((row, col));
                    }
                    // Prioritize positions adjacent to existing stones
                    else if self.is_adjacent_to_stone(game, row, col) {
                        adjacent_candidates.push((row, col));
                    }
                    // Other valid positions
                    else {
                        other_candidates.push((row, col));
                    }
                }
            }
        }
        
        // Return prioritized list
        candidates.extend(center_candidates);
        candidates.extend(adjacent_candidates);
        candidates.extend(other_candidates);
        
        candidates
    }
    
    /// Check if position is in center area
    fn is_center_position(&self, row: usize, col: usize) -> bool {
        let center = 7;
        let distance = ((row as i32 - center).abs() + (col as i32 - center).abs()) as usize;
        distance <= 3
    }
    
    /// Check if position is adjacent to existing stones (optimized)
    fn is_adjacent_to_stone(&self, game: &GomokuGame, row: usize, col: usize) -> bool {
        // Get direct board access for both players
        let black_board = game.get_board_for_player(Player::Black);
        let white_board = game.get_board_for_player(Player::White);
        let geometry = game.geometry();
        
        for dr in -1..=1 {
            for dc in -1..=1 {
                if dr == 0 && dc == 0 { continue; }
                
                let r = row as i32 + dr;
                let c = col as i32 + dc;
                
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if black_board.get_bit(index) || white_board.get_bit(index) {
                            return true;
                        }
                    }
                }
            }
        }
        false
    }
    
    /// Evaluate position for a specific player
    pub fn evaluate_position(&self, game: &GomokuGame, player: Player) -> i32 {
        let mut score = 0;
        
        // Check for win condition
        if let Some(winner) = game.winner() {
            if winner == player {
                return 100000; // Large positive score for win
            } else {
                return -100000; // Large negative score for loss
            }
        }
        
        // Evaluate patterns for both players
        score += self.evaluate_patterns(game, player);
        score -= self.evaluate_patterns(game, player.opponent());
        
        // Add center control bonus
        score += self.evaluate_center_control(game, player);
        
        score
    }
    
    /// Evaluate patterns for a specific player (optimized with direct board access)
    fn evaluate_patterns(&self, game: &GomokuGame, player: Player) -> i32 {
        let mut score = 0;
        
        // Get the player's board directly for efficient access
        let player_board = game.get_board_for_player(player);
        
        // Check all positions for patterns using direct board access
        for row in 0..15 {
            for col in 0..15 {
                if let Some(index) = game.geometry().to_index((row as i32, col as i32)) {
                    if player_board.get_bit(index) {
                        score += self.evaluate_patterns_from_position_optimized(game, player, row, col);
                    }
                }
            }
        }
        
        score
    }
    
    /// Evaluate patterns starting from a specific position (optimized version)
    fn evaluate_patterns_from_position_optimized(&self, game: &GomokuGame, player: Player, row: usize, col: usize) -> i32 {
        let mut score = 0;
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        // Get direct board access for efficient lookups
        let player_board = game.get_board_for_player(player);
        let opponent_board = game.get_board_for_player(player.opponent());
        let geometry = game.geometry();
        
        for &(dr, dc) in &directions {
            let mut consecutive = 1; // Count the current stone
            let mut open_ends = 0;
            
            // Count in positive direction
            let mut pos_count = 0;
            for i in 1..5 {
                let r = row as i32 + i * dr;
                let c = col as i32 + i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            pos_count += 1;
                        } else if opponent_board.get_bit(index) {
                            break; // Blocked by opponent
                        } else {
                            open_ends += 1;
                            break; // Empty space
                        }
                    } else {
                        break;
                    }
                } else {
                    break; // Out of bounds
                }
            }
            
            // Count in negative direction
            let mut neg_count = 0;
            for i in 1..5 {
                let r = row as i32 - i * dr;
                let c = col as i32 - i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            neg_count += 1;
                        } else if opponent_board.get_bit(index) {
                            break; // Blocked by opponent
                        } else {
                            open_ends += 1;
                            break; // Empty space
                        }
                    } else {
                        break;
                    }
                } else {
                    break; // Out of bounds
                }
            }
            
            consecutive += pos_count + neg_count;
            
            // Score based on pattern strength
            match consecutive {
                5 => score += 100000,        // Five in a row (win)
                4 => score += if open_ends >= 1 { 10000 } else { 1000 }, // Four in a row
                3 => score += if open_ends >= 2 { 1000 } else { 100 },   // Three in a row
                2 => score += if open_ends >= 2 { 100 } else { 10 },     // Two in a row
                _ => {}
            }
        }
        
        score
    }
    
    /// Legacy method for backwards compatibility (uses get_cell interface)
    fn evaluate_patterns_from_position(&self, game: &GomokuGame, player: Player, row: usize, col: usize) -> i32 {
        // Delegate to optimized version
        self.evaluate_patterns_from_position_optimized(game, player, row, col)
    }
    
    /// Evaluate center control (optimized with direct board access)
    fn evaluate_center_control(&self, game: &GomokuGame, player: Player) -> i32 {
        let mut score = 0;
        let center = 7;
        
        // Get direct board access for efficiency
        let player_board = game.get_board_for_player(player);
        let geometry = game.geometry();
        
        for row in 0..15 {
            for col in 0..15 {
                if let Some(index) = geometry.to_index((row, col)) {
                    if player_board.get_bit(index) {
                        let distance = ((row - center).abs() + (col - center).abs()) as usize;
                        score += match distance {
                            0 => self.center_weight * 4,      // Center position
                            1..=2 => self.center_weight * 2,  // Near center
                            3..=4 => self.center_weight,      // Moderate center
                            _ => 0,                           // Edge positions
                        };
                    }
                }
            }
        }
        
        score
    }
    
    /// Get threat level for a position
    pub fn get_threat_level(&self, game: &GomokuGame, player: Player, row: usize, col: usize) -> u8 {
        if !game.is_valid_move(row, col) {
            return 0;
        }
        
        // Check if this creates a winning move
        if let Some(test_game) = game.make_move_copy(row, col) {
            if test_game.winner() == Some(player) {
                return 5; // Immediate win
            }
        }
        
        // Check if this creates a 4-in-a-row threat
        if self.creates_four_in_row(game, player, row, col) {
            return 4; // Strong threat
        }
        
        // Check for 3-in-a-row patterns
        if self.creates_three_in_row(game, player, row, col) {
            return 3; // Moderate threat
        }
        
        // Check for 2-in-a-row patterns
        if self.creates_two_in_row(game, player, row, col) {
            return 2; // Weak threat
        }
        
        1 // Basic move
    }
    
    /// Check if move creates 3-in-a-row (optimized)
    fn creates_three_in_row(&self, game: &GomokuGame, player: Player, row: usize, col: usize) -> bool {
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        // Get direct board access for efficiency
        let player_board = game.get_board_for_player(player);
        let geometry = game.geometry();
        
        for &(dr, dc) in &directions {
            let mut count = 1; // Count the stone we're placing
            
            // Count in positive direction
            for i in 1..4 {
                let r = row as i32 + i * dr;
                let c = col as i32 + i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            count += 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            // Count in negative direction
            for i in 1..4 {
                let r = row as i32 - i * dr;
                let c = col as i32 - i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            count += 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            if count >= 3 {
                return true;
            }
        }
        
        false
    }
    
    /// Check if move creates 2-in-a-row (optimized)
    fn creates_two_in_row(&self, game: &GomokuGame, player: Player, row: usize, col: usize) -> bool {
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        // Get direct board access for efficiency
        let player_board = game.get_board_for_player(player);
        let geometry = game.geometry();
        
        for &(dr, dc) in &directions {
            let mut count = 1; // Count the stone we're placing
            
            // Count in positive direction
            for i in 1..3 {
                let r = row as i32 + i * dr;
                let c = col as i32 + i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            count += 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            // Count in negative direction
            for i in 1..3 {
                let r = row as i32 - i * dr;
                let c = col as i32 - i * dc;
                if (0..15).contains(&r) && (0..15).contains(&c) {
                    if let Some(index) = geometry.to_index((r, c)) {
                        if player_board.get_bit(index) {
                            count += 1;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            if count >= 2 {
                return true;
            }
        }
        
        false
    }
}

impl Default for GomokuAI {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::games::GomokuGame;
    
    #[test]
    fn test_gomoku_ai_creation() {
        let ai = GomokuAI::new();
        assert_eq!(ai.max_depth, 4);
        assert!(ai.use_pattern_evaluation);
        assert!(ai.opening_book);
    }
    
    #[test]
    fn test_opening_moves() {
        let ai = GomokuAI::new();
        let game = GomokuGame::new();
        
        // First move should be center
        let move1 = ai.get_opening_move(&game);
        assert_eq!(move1, Some((7, 7)));
    }
    
    #[test]
    fn test_winning_move_detection() {
        let ai = GomokuAI::new();
        let mut game = GomokuGame::new();
        
        // Create a 4-in-a-row for Black that can be completed
        game.make_move_internal(7, 5).unwrap();  // Black
        game.make_move_internal(8, 5).unwrap();  // White
        game.make_move_internal(7, 6).unwrap();  // Black
        game.make_move_internal(8, 6).unwrap();  // White
        game.make_move_internal(7, 7).unwrap();  // Black
        game.make_move_internal(8, 7).unwrap();  // White
        game.make_move_internal(7, 8).unwrap();  // Black (now 4-in-a-row: 5,6,7,8)
        game.make_move_internal(8, 8).unwrap();  // White
        
        // Current player is now Black again, should find winning move
        let winning_move = ai.find_winning_move(&game, Player::Black);
        println!("Winning move found: {:?}", winning_move);
        println!("Current board:\n{}", game.board_string());
        assert!(winning_move.is_some());
        
        // The winning move should complete the line at either end
        if let Some((row, col)) = winning_move {
            assert_eq!(row, 7);
            assert!(col == 4 || col == 9); // Either end of the line
        }
    }
    
    #[test]
    fn test_threat_detection() {
        let ai = GomokuAI::new();
        let mut game = GomokuGame::new();
        
        // Create a 2-in-a-row for Black first
        game.make_move_internal(7, 5).unwrap();  // Black
        game.make_move_internal(8, 5).unwrap();  // White
        game.make_move_internal(7, 6).unwrap();  // Black (now 2-in-a-row)
        game.make_move_internal(8, 6).unwrap();  // White
        
        // Check if AI can detect extending this to 3-in-a-row
        let creates_threat = ai.creates_three_in_row(&game, Player::Black, 7, 7);
        println!("Creates 3-in-a-row threat: {}", creates_threat);
        assert!(creates_threat);
    }
    
    #[test]
    fn test_center_position_detection() {
        let ai = GomokuAI::new();
        
        assert!(ai.is_center_position(7, 7));   // Exact center
        assert!(ai.is_center_position(6, 7));   // Near center
        assert!(ai.is_center_position(8, 8));   // Near center
        assert!(!ai.is_center_position(0, 0));  // Corner
        assert!(!ai.is_center_position(14, 14)); // Corner
    }
    
    #[test]
    fn test_pattern_evaluation() {
        let ai = GomokuAI::new();
        let mut game = GomokuGame::new();
        
        // Place some stones to create clear advantage for Black
        game.make_move_internal(7, 7).unwrap();  // Black center
        game.make_move_internal(0, 0).unwrap();  // White corner
        game.make_move_internal(7, 8).unwrap();  // Black adjacent center (forms line)
        game.make_move_internal(0, 1).unwrap();  // White corner area
        
        // Black should have higher evaluation due to center position + line formation
        let black_score = ai.evaluate_position(&game, Player::Black);
        let white_score = ai.evaluate_position(&game, Player::White);
        
        println!("Black score: {}, White score: {}", black_score, white_score);
        assert!(black_score > white_score);
    }
    
    #[test]
    fn test_adjacent_stone_detection() {
        let ai = GomokuAI::new();
        let mut game = GomokuGame::new();
        
        // Place a stone
        game.make_move_internal(7, 7).unwrap();
        
        // Adjacent positions should be detected
        assert!(ai.is_adjacent_to_stone(&game, 6, 7));
        assert!(ai.is_adjacent_to_stone(&game, 8, 7));
        assert!(ai.is_adjacent_to_stone(&game, 7, 6));
        assert!(ai.is_adjacent_to_stone(&game, 7, 8));
        
        // Non-adjacent positions should not be detected
        assert!(!ai.is_adjacent_to_stone(&game, 5, 5));
        assert!(!ai.is_adjacent_to_stone(&game, 0, 0));
    }
}