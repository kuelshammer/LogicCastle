use super::{BoardGeometry, PatternProvider};
use crate::data::BitPackedBoard;

/// Quadratic grid geometry for games like Connect4, Gomoku
/// Handles rectangular boards with standard horizontal/vertical/diagonal neighbors
#[derive(Debug, Clone)]
pub struct QuadraticGrid<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> {
    
    // Pre-computed pattern masks for AI evaluation
    lines_of_4: Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>>,
    lines_of_5: Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>>,
    lines_of_3: Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>>,
    empty_lines: Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>>, // SAFE: Empty vec for unsupported lengths
    center_mask: BitPackedBoard<ROWS, COLS, BITS_PER_CELL>,
    edge_mask: BitPackedBoard<ROWS, COLS, BITS_PER_CELL>,
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> QuadraticGrid<ROWS, COLS, BITS_PER_CELL> {
    pub fn new() -> Self {
        let mut grid = Self {
            lines_of_4: Vec::new(),
            lines_of_5: Vec::new(),
            lines_of_3: Vec::new(),
            empty_lines: Vec::new(), // SAFE: Always empty for unsupported pattern lengths
            center_mask: BitPackedBoard::new(),
            edge_mask: BitPackedBoard::new(),
        };
        grid.precompute_patterns();
        grid
    }
    
    /// Generate all lines of specified length in all directions
    fn generate_all_lines_of_length(&self, length: usize) -> Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>> {
        let mut patterns = Vec::new();
        
        // Direction vectors: horizontal, vertical, diagonal /, diagonal \
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        
        for start_row in 0..ROWS {
            for start_col in 0..COLS {
                for &(dr, dc) in &directions {
                    let mut pattern = BitPackedBoard::new();
                    let mut valid_line = true;
                    
                    // Check if we can fit the full line starting from this position
                    for i in 0..length {
                        let r = start_row as i32 + i as i32 * dr;
                        let c = start_col as i32 + i as i32 * dc;
                        
                        if r < 0 || r >= ROWS as i32 || c < 0 || c >= COLS as i32 {
                            valid_line = false;
                            break;
                        }
                        
                        // Set the bit for this position in the pattern
                        if let Some(index) = pattern.coord_to_index(r as usize, c as usize) {
                            pattern.set_bit(index, true);
                        }
                    }
                    
                    if valid_line {
                        patterns.push(pattern);
                    }
                }
            }
        }
        
        patterns
    }
    
    /// Generate center control mask (middle columns/rows get higher weight)
    fn generate_center_mask(&mut self) -> BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        let mut mask = BitPackedBoard::new();
        
        let center_col = COLS / 2;
        let center_row = ROWS / 2;
        
        for row in 0..ROWS {
            for col in 0..COLS {
                // Distance from center (Manhattan distance)
                let distance = ((row as i32 - center_row as i32).abs() + 
                              (col as i32 - center_col as i32).abs()) as usize;
                
                // Center positions are more valuable
                if distance <= 2 {
                    if let Some(index) = mask.coord_to_index(row, col) {
                        mask.set_bit(index, true);
                    }
                }
            }
        }
        
        mask
    }
    
    /// Generate edge control mask
    fn generate_edge_mask(&mut self) -> BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        let mut mask = BitPackedBoard::new();
        
        for row in 0..ROWS {
            for col in 0..COLS {
                // Edge positions
                if row == 0 || row == ROWS - 1 || col == 0 || col == COLS - 1 {
                    if let Some(index) = mask.coord_to_index(row, col) {
                        mask.set_bit(index, true);
                    }
                }
            }
        }
        
        mask
    }
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> BoardGeometry for QuadraticGrid<ROWS, COLS, BITS_PER_CELL> {
    fn to_index(&self, coord: (i32, i32)) -> Option<usize> {
        let (row, col) = coord;
        if row >= 0 && row < ROWS as i32 && col >= 0 && col < COLS as i32 {
            Some((row as usize) * COLS + (col as usize))
        } else {
            None
        }
    }
    
    fn from_index(&self, index: usize) -> Option<(i32, i32)> {
        if index < ROWS * COLS {
            Some(((index / COLS) as i32, (index % COLS) as i32))
        } else {
            None
        }
    }
    
    fn get_neighbors(&self, coord: (i32, i32)) -> Vec<(i32, i32)> {
        let (row, col) = coord;
        let mut neighbors = Vec::new();
        
        // 8-directional neighbors (including diagonals)
        for dr in -1..=1 {
            for dc in -1..=1 {
                if dr == 0 && dc == 0 {
                    continue; // Skip self
                }
                
                let new_row = row + dr;
                let new_col = col + dc;
                
                if self.is_valid((new_row, new_col)) {
                    neighbors.push((new_row, new_col));
                }
            }
        }
        
        neighbors
    }
    
    fn is_valid(&self, coord: (i32, i32)) -> bool {
        let (row, col) = coord;
        row >= 0 && row < ROWS as i32 && col >= 0 && col < COLS as i32
    }
    
    fn board_size(&self) -> usize {
        ROWS * COLS
    }
    
    fn dimensions(&self) -> (usize, usize) {
        (ROWS, COLS)
    }
}

// Peeling Algorithm specific methods (separate from BoardGeometry trait)
impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> QuadraticGrid<ROWS, COLS, BITS_PER_CELL> {
    /// Convert 2D coordinates to linear index (for Peeling Algorithm)
    /// This is a convenience method for the peeling algorithm implementation
    pub fn coord_to_linear_index(&self, row: usize, col: usize) -> usize {
        if row < ROWS && col < COLS {
            row * COLS + col
        } else {
            // Return invalid index for out of bounds
            ROWS * COLS
        }
    }
    
    /// Convert linear index to 2D coordinates (for Peeling Algorithm)
    /// This is a convenience method for the peeling algorithm implementation
    pub fn linear_index_to_coord(&self, index: usize) -> Option<(usize, usize)> {
        if index < ROWS * COLS {
            Some((index / COLS, index % COLS))
        } else {
            None
        }
    }
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> PatternProvider<ROWS, COLS, BITS_PER_CELL> for QuadraticGrid<ROWS, COLS, BITS_PER_CELL> {
    fn get_winning_lines(&self, length: usize) -> &Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>> {
        match length {
            3 => &self.lines_of_3,
            4 => &self.lines_of_4,
            5 => &self.lines_of_5,
            _ => {
                // SAFE: Return reference to empty vector for unsupported lengths
                &self.empty_lines
            }
        }
    }
    
    fn get_center_mask(&self) -> &BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        &self.center_mask
    }
    
    fn get_edge_mask(&self) -> &BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        &self.edge_mask
    }
    
    fn precompute_patterns(&mut self) {
        // Generate winning line patterns for different lengths
        self.lines_of_3 = self.generate_all_lines_of_length(3);
        self.lines_of_4 = self.generate_all_lines_of_length(4);
        self.lines_of_5 = self.generate_all_lines_of_length(5);
        
        // Generate positional masks
        self.center_mask = self.generate_center_mask();
        self.edge_mask = self.generate_edge_mask();
        
        println!("🎯 QuadraticGrid patterns generated: {} lines of 4, {} lines of 5", 
            self.lines_of_4.len(),
            self.lines_of_5.len());
    }
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> Default for QuadraticGrid<ROWS, COLS, BITS_PER_CELL> {
    fn default() -> Self {
        Self::new()
    }
}

// Type aliases for common board sizes
pub type Connect4Grid = QuadraticGrid<6, 7, 2>;
pub type GomokuGrid = QuadraticGrid<15, 15, 2>;

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_coordinate_conversion() {
        let grid: Connect4Grid = QuadraticGrid::new();
        
        // Test coordinate to index conversion
        assert_eq!(grid.to_index((0, 0)), Some(0));
        assert_eq!(grid.to_index((0, 6)), Some(6));
        assert_eq!(grid.to_index((1, 0)), Some(7));
        assert_eq!(grid.to_index((5, 6)), Some(41));
        
        // Test out of bounds
        assert_eq!(grid.to_index((6, 0)), None);
        assert_eq!(grid.to_index((0, 7)), None);
        
        // Test index to coordinate conversion
        assert_eq!(grid.from_index(0), Some((0, 0)));
        assert_eq!(grid.from_index(6), Some((0, 6)));
        assert_eq!(grid.from_index(7), Some((1, 0)));
        assert_eq!(grid.from_index(41), Some((5, 6)));
    }
    
    #[test]
    fn test_neighbors() {
        let grid: Connect4Grid = QuadraticGrid::new();
        
        // Test corner neighbors
        let corner_neighbors = grid.get_neighbors((0, 0));
        assert_eq!(corner_neighbors.len(), 3); // Only 3 valid neighbors for corner
        
        // Test center neighbors  
        let center_neighbors = grid.get_neighbors((2, 3));
        assert_eq!(center_neighbors.len(), 8); // All 8 neighbors valid for center
    }
    
    #[test]
    fn test_pattern_generation() {
        let grid: Connect4Grid = QuadraticGrid::new();
        
        // Should have generated patterns
        assert!(!grid.lines_of_4.is_empty());
        assert!(!grid.lines_of_3.is_empty());
        
        // Connect4 should have many possible 4-in-a-row lines
        assert!(grid.lines_of_4.len() > 60); // Rough estimate for 6x7 board
    }
}