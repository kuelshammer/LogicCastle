use crate::data::BitPackedBoard;
use crate::geometry::{Connect4Grid, PatternProvider, BoardGeometry};
use crate::games::connect4::Connect4Game;
use crate::Player;

use std::cell::RefCell;
use std::collections::HashMap;

/// Pattern-based position evaluator using Gemini's Three-Layer Architecture
/// This provides the "Stratege" layer for AI decision making
/// OPTIMIZED: Added caching for pattern evaluation performance with RefCell for interior mutability
#[derive(Clone)]
pub struct PatternEvaluator {
    // Pattern weights for different tactical situations
    pub win_score: i32,
    pub loss_score: i32,
    pub threat_3_score: i32,
    pub potential_2_score: i32,
    pub center_bonus: i32,
    pub block_threat_bonus: i32,
    
    // PERFORMANCE: Cache for position evaluations (interior mutability)
    position_cache: RefCell<HashMap<u64, i32>>,
    fork_cache: RefCell<HashMap<u64, i32>>,
}

impl PatternEvaluator {
    pub fn new() -> Self {
        Self {
            win_score: 10000,
            loss_score: -10000,
            threat_3_score: 100,
            potential_2_score: 10,
            center_bonus: 5,
            block_threat_bonus: 200,
            position_cache: RefCell::new(HashMap::new()),
            fork_cache: RefCell::new(HashMap::new()),
        }
    }
    
    /// Clear the evaluation cache (call when game resets)
    pub fn clear_cache(&self) {
        self.position_cache.borrow_mut().clear();
        self.fork_cache.borrow_mut().clear();
    }
    
    /// Generate a hash key for board position (optimized with direct board access)
    fn generate_position_hash(&self, game: &Connect4Game, player: Player) -> u64 {
        let mut hash = 0u64;
        
        // Get direct board access for efficient hashing
        let yellow_board = game.get_board_for_player(Player::Yellow);
        let red_board = game.get_board_for_player(Player::Red);
        
        // Hash board state using direct bit operations
        // This is much faster than 42 get_cell() calls (6x7)
        for row in 0..6 {
            for col in 0..7 {
                if let Some(index) = game.geometry().to_index((row as i32, col as i32)) {
                    let cell_value = if yellow_board.get_bit(index) {
                        1u64 // Yellow
                    } else if red_board.get_bit(index) {
                        2u64 // Red  
                    } else {
                        0u64 // Empty
                    };
                    hash = hash.wrapping_mul(3).wrapping_add(cell_value);
                }
            }
        }
        
        // Include player in hash
        hash = hash.wrapping_mul(2).wrapping_add(player as u64);
        
        hash
    }
    
    /// Evaluate position using pre-computed patterns (Gemini's recommended approach)
    /// This function demonstrates the power of the Three-Layer Architecture
    /// OPTIMIZED: Added caching for repeated position evaluations using RefCell
    pub fn evaluate_position(&self, game: &Connect4Game, ai_player: Player) -> i32 {
        // Check cache first
        let position_hash = self.generate_position_hash(game, ai_player);
        if let Some(&cached_score) = self.position_cache.borrow().get(&position_hash) {
            return cached_score;
        }
        let mut score = 0;
        
        // Get the boards from the data layer
        let ai_board = game.get_board_for_player(ai_player);
        let opponent_board = game.get_board_for_player(ai_player.opponent());
        
        // Get pre-computed patterns from the geometry layer
        let geometry = game.geometry();
        let winning_lines = geometry.get_winning_lines(4);
        
        // Check for immediate wins/losses
        if let Some(winner) = game.winner() {
            return if winner == ai_player {
                self.win_score
            } else {
                self.loss_score
            };
        }
        
        // Evaluate all winning line patterns
        for line_mask in winning_lines {
            let ai_pieces = ai_board.count_set_bits_in_mask(line_mask);
            let opponent_pieces = opponent_board.count_set_bits_in_mask(line_mask);
            
            // Only evaluate lines that aren't blocked by opponent
            if ai_pieces > 0 && opponent_pieces == 0 {
                score += self.evaluate_line_value(ai_pieces);
            } else if opponent_pieces > 0 && ai_pieces == 0 {
                score -= self.evaluate_opponent_line_value(opponent_pieces);
            }
        }
        
        // Add positional bonuses using pre-computed masks
        score += self.evaluate_positional_bonus(ai_board, opponent_board, geometry);
        
        // Cache the result
        self.position_cache.borrow_mut().insert(position_hash, score);
        
        score
    }
    
    /// Evaluate the value of AI's line based on piece count
    fn evaluate_line_value(&self, piece_count: u32) -> i32 {
        match piece_count {
            4 => self.win_score,      // Impossible (game would be over)
            3 => self.threat_3_score, // Strong threat
            2 => self.potential_2_score, // Building potential
            1 => 1,                   // Basic presence
            _ => 0,
        }
    }
    
    /// Evaluate the threat level of opponent's line
    fn evaluate_opponent_line_value(&self, piece_count: u32) -> i32 {
        match piece_count {
            4 => -self.loss_score,    // Impossible (game would be over)
            3 => self.block_threat_bonus, // Must block this!
            2 => self.potential_2_score * 2, // Significant threat
            1 => 2,                   // Minor threat
            _ => 0,
        }
    }
    
    /// Evaluate positional advantages using pre-computed masks
    fn evaluate_positional_bonus(
        &self,
        ai_board: &BitPackedBoard<6, 7, 2>,
        opponent_board: &BitPackedBoard<6, 7, 2>,
        geometry: &Connect4Grid,
    ) -> i32 {
        let mut bonus = 0;
        
        // Center control (Connect4 strategy: center column is powerful)
        let center_mask = geometry.get_center_mask();
        let ai_center = ai_board.count_set_bits_in_mask(center_mask) as i32;
        let opponent_center = opponent_board.count_set_bits_in_mask(center_mask) as i32;
        bonus += (ai_center - opponent_center) * self.center_bonus;
        
        bonus
    }
    
    /// Advanced tactical evaluation for fork detection
    /// OPTIMIZED: Added caching for fork evaluation using RefCell
    pub fn evaluate_forks(&self, game: &Connect4Game, ai_player: Player) -> i32 {
        // Check cache first
        let position_hash = self.generate_position_hash(game, ai_player);
        if let Some(&cached_score) = self.fork_cache.borrow().get(&position_hash) {
            return cached_score;
        }
        let ai_board = game.get_board_for_player(ai_player);
        let opponent_board = game.get_board_for_player(ai_player.opponent());
        let geometry = game.geometry();
        let winning_lines = geometry.get_winning_lines(4);
        
        let mut ai_threats = 0;
        let mut opponent_threats = 0;
        
        // Count open 3-in-a-row lines (threats)
        for line_mask in winning_lines {
            let ai_pieces = ai_board.count_set_bits_in_mask(line_mask);
            let opponent_pieces = opponent_board.count_set_bits_in_mask(line_mask);
            
            if ai_pieces == 3 && opponent_pieces == 0 {
                ai_threats += 1;
            } else if opponent_pieces == 3 && ai_pieces == 0 {
                opponent_threats += 1;
            }
        }
        
        // Fork evaluation: multiple threats are exponentially valuable
        let mut fork_score = 0;
        if ai_threats >= 2 {
            fork_score += ai_threats * ai_threats * 50; // Exponential bonus
        }
        if opponent_threats >= 2 {
            fork_score -= opponent_threats * opponent_threats * 75; // Higher penalty
        }
        
        // Cache the result
        self.fork_cache.borrow_mut().insert(position_hash, fork_score);
        
        fork_score
    }
    
    /// Game phase awareness for strategic adaptation
    pub fn get_game_phase(&self, game: &Connect4Game) -> GamePhase {
        let move_count = game.move_count();
        
        if move_count < 10 {
            GamePhase::Opening
        } else if move_count < 30 {
            GamePhase::Middle
        } else {
            GamePhase::Endgame
        }
    }
    
    /// Phase-aware evaluation that adapts strategy based on game progression
    /// OPTIMIZED: Uses cached evaluation methods with RefCell
    pub fn evaluate_with_phase(&self, game: &Connect4Game, ai_player: Player) -> i32 {
        let base_score = self.evaluate_position(game, ai_player);
        let phase = self.get_game_phase(game);
        
        match phase {
            GamePhase::Opening => {
                // In opening, prioritize center control
                base_score + self.evaluate_opening_strategy(game, ai_player)
            }
            GamePhase::Middle => {
                // In middle game, add fork evaluation
                base_score + self.evaluate_forks(game, ai_player)
            }
            GamePhase::Endgame => {
                // In endgame, focus on immediate threats
                base_score // Base evaluation is sufficient for endgame
            }
        }
    }
    
    /// Opening-specific strategy evaluation
    fn evaluate_opening_strategy(&self, game: &Connect4Game, ai_player: Player) -> i32 {
        let ai_board = game.get_board_for_player(ai_player);
        let geometry = game.geometry();
        let center_mask = geometry.get_center_mask();
        
        // Extra bonus for center control in opening
        ai_board.count_set_bits_in_mask(center_mask) as i32 * 10
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum GamePhase {
    Opening,
    Middle,
    Endgame,
}

impl Default for PatternEvaluator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_evaluation() {
        let game = Connect4Game::new();
        let evaluator = PatternEvaluator::new();
        
        // Empty board should have neutral score
        let score = evaluator.evaluate_position(&game, Player::Red);
        assert_eq!(score, 0);
    }
    
    #[test]
    fn test_center_bonus() {
        let mut game = Connect4Game::new();
        let evaluator = PatternEvaluator::new();
        
        // Place piece in center
        game.make_move(3).unwrap(); // Yellow in center
        game.make_move(0).unwrap(); // Red on edge
        
        let yellow_score = evaluator.evaluate_position(&game, Player::Yellow);
        let red_score = evaluator.evaluate_position(&game, Player::Red);
        
        // Yellow should have higher score due to center control
        assert!(yellow_score > red_score);
    }
}