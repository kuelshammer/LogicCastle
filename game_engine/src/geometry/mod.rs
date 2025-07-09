use crate::data::BitPackedBoard;

pub mod quadratic_grid;
pub mod hex_grid;
pub mod tests;

pub use quadratic_grid::{QuadraticGrid, Connect4Grid, GomokuGrid};
pub use hex_grid::{HexGrid, StandardHexGrid, HexEdge};

/// Defines the "shape" and navigation rules of a game board
/// This trait encapsulates all topology and coordinate logic
pub trait BoardGeometry {
    /// Convert a 2D coordinate to a linear index
    fn to_index(&self, coord: (i32, i32)) -> Option<usize>;
    
    /// Convert a linear index back to 2D coordinate
    fn from_index(&self, index: usize) -> Option<(i32, i32)>;
    
    /// Get the direct neighbors of a coordinate
    fn get_neighbors(&self, coord: (i32, i32)) -> Vec<(i32, i32)>;
    
    /// Check if a coordinate is valid on this board
    fn is_valid(&self, coord: (i32, i32)) -> bool;
    
    /// Get the total size for BitPackedBoard allocation
    fn board_size(&self) -> usize;
    
    /// Get the board dimensions
    fn dimensions(&self) -> (usize, usize);
}

/// Pattern provider trait for AI evaluation
/// Geometries that can provide pre-computed patterns for AI
pub trait PatternProvider<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> {
    /// Get all winning lines of specified length
    fn get_winning_lines(&self, length: usize) -> &Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>>;
    
    /// Get center control mask
    fn get_center_mask(&self) -> &BitPackedBoard<ROWS, COLS, BITS_PER_CELL>;
    
    /// Get edge control mask  
    fn get_edge_mask(&self) -> &BitPackedBoard<ROWS, COLS, BITS_PER_CELL>;
    
    /// Regenerate all patterns (called once during initialization)
    fn precompute_patterns(&mut self);
}