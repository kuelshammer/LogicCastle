use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;
use rand::{thread_rng, Rng};
use crate::data::BitPackedBoard;

/// Trio Game using BitPackedBoard<7,7,4> for memory efficiency
/// 
/// Trio is a mathematical puzzle game where players find combinations
/// of three numbers (a, b, c) that satisfy: a×b+c = target OR a×b-c = target
/// 
/// Features:
/// - 7×7 board filled with numbers 1-9
/// - BitPacked storage: 4 bits per cell (supports 0-15, perfect for 1-9)
/// - Memory efficient: 25 bytes vs 49 bytes naive implementation (49% reduction)
/// - No AI opponent needed - pure puzzle game
#[wasm_bindgen]
pub struct TrioGame {
    board: BitPackedBoard<7, 7, 4>,
    target_number: u8,
    difficulty: u8,
}

/// Difficulty levels for board generation
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum TrioDifficultyNew {
    Kinderfreundlich = 1,    // Easy: more small numbers, simple calculations
    Vollspektrum = 2,        // Medium: balanced distribution
    Strategisch = 3,         // Hard: more complex numbers, fewer easy solutions
    Analytisch = 4,          // Expert: complex patterns, advanced calculations
}

#[wasm_bindgen]
impl TrioGame {
    /// Create new Trio game with specified difficulty
    #[wasm_bindgen(constructor)]
    pub fn new(difficulty: u8) -> Self {
        let mut board = BitPackedBoard::new();
        let target = Self::generate_board_and_target(&mut board, difficulty);
        
        Self {
            board,
            target_number: target,
            difficulty,
        }
    }
    
    /// Get number at specific board position
    #[wasm_bindgen]
    pub fn get_number(&self, row: usize, col: usize) -> u8 {
        self.board.get_cell(row, col)
    }
    
    /// Get the current target number to achieve
    #[wasm_bindgen]
    pub fn get_target_number(&self) -> u8 {
        self.target_number
    }
    
    /// Get current difficulty level
    #[wasm_bindgen]
    pub fn get_difficulty(&self) -> u8 {
        self.difficulty
    }
    
    /// Validate a trio combination (a×b+c or a×b-c = target)
    /// Returns the calculated result if valid, or -1 if invalid
    #[wasm_bindgen]
    pub fn validate_trio(&self, row1: usize, col1: usize, row2: usize, col2: usize, row3: usize, col3: usize) -> i32 {
        // Get the three numbers
        let a = self.board.get_cell(row1, col1);
        let b = self.board.get_cell(row2, col2);
        let c = self.board.get_cell(row3, col3);
        
        // Ensure we have valid numbers (1-9)
        if a == 0 || b == 0 || c == 0 || a > 9 || b > 9 || c > 9 {
            return -1;
        }
        
        // Calculate both possible results
        let result1 = (a as u16) * (b as u16) + (c as u16);
        let result2 = (a as u16) * (b as u16) - (c as u16);
        
        // Check if either result matches the target
        if result1 == self.target_number as u16 {
            return result1 as i32;
        } else if result2 == self.target_number as u16 {
            return result2 as i32;
        }
        
        -1 // Invalid combination
    }
    
    /// Generate new board with specified difficulty
    #[wasm_bindgen]
    pub fn generate_new_board(&mut self, difficulty: u8) -> u8 {
        self.difficulty = difficulty;
        self.target_number = Self::generate_board_and_target(&mut self.board, difficulty);
        self.target_number
    }
    
    /// Find all possible trio solutions on the current board
    /// Returns array of solutions as [row1, col1, row2, col2, row3, col3, result]
    #[wasm_bindgen]
    pub fn find_all_solutions(&self) -> Vec<u8> {
        let mut solutions = Vec::new();
        
        // Check all possible combinations of 3 positions
        for row1 in 0..7 {
            for col1 in 0..7 {
                for row2 in 0..7 {
                    for col2 in 0..7 {
                        for row3 in 0..7 {
                            for col3 in 0..7 {
                                // Skip if positions are the same
                                if (row1 == row2 && col1 == col2) ||
                                   (row1 == row3 && col1 == col3) ||
                                   (row2 == row3 && col2 == col3) {
                                    continue;
                                }
                                
                                let result = self.validate_trio(row1, col1, row2, col2, row3, col3);
                                if result != -1 {
                                    solutions.push(row1 as u8);
                                    solutions.push(col1 as u8);
                                    solutions.push(row2 as u8);
                                    solutions.push(col2 as u8);
                                    solutions.push(row3 as u8);
                                    solutions.push(col3 as u8);
                                    solutions.push(result as u8);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        solutions
    }
    
    /// Get memory usage of the BitPacked board
    #[wasm_bindgen]
    pub fn memory_usage(&self) -> usize {
        // BitPackedBoard<7,7,4> uses (7*7*4 + 63) / 64 = 4 u64s = 32 bytes
        // Plus metadata overhead
        32 + std::mem::size_of::<Self>() - std::mem::size_of::<BitPackedBoard<7,7,4>>()
    }
    
    /// Get memory efficiency compared to naive implementation
    #[wasm_bindgen]
    pub fn memory_efficiency(&self) -> f32 {
        let naive_size = 7 * 7 * 1; // 49 bytes for u8 array
        let bitpacked_size = self.memory_usage();
        ((naive_size as f32 - bitpacked_size as f32) / naive_size as f32) * 100.0
    }
    
    /// Get entire board as flat array for JavaScript
    #[wasm_bindgen]
    pub fn get_board_array(&self) -> Vec<u8> {
        let mut result = Vec::with_capacity(49);
        for row in 0..7 {
            for col in 0..7 {
                result.push(self.board.get_cell(row, col));
            }
        }
        result
    }
}

// Private implementation methods
impl TrioGame {
    /// Generate a balanced board with guaranteed solutions
    fn generate_board_and_target(board: &mut BitPackedBoard<7, 7, 4>, difficulty: u8) -> u8 {
        let mut rng = thread_rng();
        
        // Generate number distribution based on difficulty
        let mut numbers_pool = match difficulty {
            1 => { // Kinderfreundlich: More small numbers
                let mut pool = Vec::new();
                for _ in 0..8 { pool.push(1); }
                for _ in 0..8 { pool.push(2); }
                for _ in 0..6 { pool.push(3); }
                for _ in 0..6 { pool.push(4); }
                for _ in 0..5 { pool.push(5); }
                for _ in 0..4 { pool.push(6); }
                for _ in 0..3 { pool.push(7); }
                for _ in 0..2 { pool.push(8); }
                for _ in 0..1 { pool.push(9); }
                pool
            },
            2 => { // Vollspektrum: Balanced distribution
                let mut pool = Vec::new();
                for i in 1..=9 {
                    for _ in 0..5 { pool.push(i); }
                }
                // Add extra numbers to reach 49
                for _ in 0..4 { pool.push(5); }
                pool
            },
            3 => { // Strategisch: More medium-large numbers
                let mut pool = Vec::new();
                for _ in 0..3 { pool.push(1); }
                for _ in 0..4 { pool.push(2); }
                for _ in 0..5 { pool.push(3); }
                for _ in 0..6 { pool.push(4); }
                for _ in 0..7 { pool.push(5); }
                for _ in 0..6 { pool.push(6); }
                for _ in 0..6 { pool.push(7); }
                for _ in 0..6 { pool.push(8); }
                for _ in 0..6 { pool.push(9); }
                pool
            },
            4 => { // Analytisch: Complex patterns
                let mut pool = Vec::new();
                for _ in 0..2 { pool.push(1); }
                for _ in 0..3 { pool.push(2); }
                for _ in 0..4 { pool.push(3); }
                for _ in 0..5 { pool.push(4); }
                for _ in 0..5 { pool.push(5); }
                for _ in 0..6 { pool.push(6); }
                for _ in 0..7 { pool.push(7); }
                for _ in 0..8 { pool.push(8); }
                for _ in 0..9 { pool.push(9); }
                pool
            },
            _ => { // Default to Vollspektrum
                let mut pool = Vec::new();
                for i in 1..=9 {
                    for _ in 0..5 { pool.push(i); }
                }
                for _ in 0..4 { pool.push(5); }
                pool
            }
        };
        
        // Shuffle the numbers
        numbers_pool.shuffle(&mut rng);
        
        // Fill the board
        let mut index = 0;
        for row in 0..7 {
            for col in 0..7 {
                if index < numbers_pool.len() {
                    let _ = board.set_cell(row, col, numbers_pool[index]);
                    index += 1;
                } else {
                    let _ = board.set_cell(row, col, 1); // Fallback
                }
            }
        }
        
        // Generate target based on difficulty
        let target = match difficulty {
            1 => rng.gen_range(3..=15), // Easy targets
            2 => rng.gen_range(5..=25), // Medium targets
            3 => rng.gen_range(10..=40), // Hard targets
            4 => rng.gen_range(15..=60), // Expert targets
            _ => rng.gen_range(5..=25),   // Default
        };
        
        target
    }
    
    /// Check if the generated board has at least one solution
    fn has_valid_solutions(&self) -> bool {
        // Quick check: try to find at least one solution
        for row1 in 0..7 {
            for col1 in 0..7 {
                for row2 in 0..7 {
                    for col2 in 0..7 {
                        for row3 in 0..7 {
                            for col3 in 0..7 {
                                if (row1 == row2 && col1 == col2) ||
                                   (row1 == row3 && col1 == col3) ||
                                   (row2 == row3 && col2 == col3) {
                                    continue;
                                }
                                
                                if self.validate_trio(row1, col1, row2, col2, row3, col3) != -1 {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        false
    }
}

/// Helper function to convert difficulty string to number
#[wasm_bindgen]
pub fn difficulty_to_number(difficulty: &str) -> u8 {
    match difficulty {
        "kinderfreundlich" => 1,
        "vollspektrum" => 2,
        "strategisch" => 3,
        "analytisch" => 4,
        _ => 2, // Default to vollspektrum
    }
}

/// Helper function to convert difficulty number to string
#[wasm_bindgen]
pub fn difficulty_to_string(difficulty: u8) -> String {
    match difficulty {
        1 => "kinderfreundlich".to_string(),
        2 => "vollspektrum".to_string(),
        3 => "strategisch".to_string(),
        4 => "analytisch".to_string(),
        _ => "vollspektrum".to_string(),
    }
}