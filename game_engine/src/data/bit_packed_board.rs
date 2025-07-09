// BitPackedBoard is now a pure Rust data structure
// WASM bindings are handled at the game level

/// Memory-efficient board implementation for large games (>100 cells)
/// Uses bit packing to store multiple cell states in single u64 values
/// 
/// Generic parameters:
/// - ROWS: Number of board rows
/// - COLS: Number of board columns  
/// - BITS_PER_CELL: Bits needed per cell (2 for 4 states, 3 for 8 states)
#[derive(Clone, Debug)]
pub struct BitPackedBoard<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> {
    pub data: Vec<u64>,
    cells_per_u64: usize,
    total_cells: usize,
    mask: u64,
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
    /// Create new BitPackedBoard
    pub fn new() -> Self {
        const BITS_PER_U64: usize = 64;
        let cells_per_u64 = BITS_PER_U64 / BITS_PER_CELL;
        let total_cells = ROWS * COLS;
        let data_size = (total_cells + cells_per_u64 - 1) / cells_per_u64;
        let mask = (1u64 << BITS_PER_CELL) - 1;
        
        Self {
            data: vec![0; data_size],
            cells_per_u64,
            total_cells,
            mask,
        }
    }
    
    /// Get cell value at (row, col)
    pub fn get_cell(&self, row: usize, col: usize) -> u8 {
        if row >= ROWS || col >= COLS {
            return 0;
        }
        
        let cell_index = row * COLS + col;
        let u64_index = cell_index / self.cells_per_u64;
        let bit_offset = (cell_index % self.cells_per_u64) * BITS_PER_CELL;
        
        ((self.data[u64_index] >> bit_offset) & self.mask) as u8
    }
    
    /// Set cell value at (row, col)
    pub fn set_cell(&mut self, row: usize, col: usize, value: u8) -> Result<(), String> {
        if row >= ROWS || col >= COLS {
            return Err("Position out of bounds".to_string());
        }
        
        if (value as u64) > self.mask {
            return Err("Value exceeds maximum for cell".to_string());
        }
        
        let cell_index = row * COLS + col;
        let u64_index = cell_index / self.cells_per_u64;
        let bit_offset = (cell_index % self.cells_per_u64) * BITS_PER_CELL;
        
        // Clear existing bits and set new value
        self.data[u64_index] &= !(self.mask << bit_offset);
        self.data[u64_index] |= (value as u64) << bit_offset;
        
        Ok(())
    }
    
    /// Clear all cells
    pub fn clear(&mut self) {
        self.data.fill(0);
    }
    
    /// Clear a specific cell by linear index (for Peeling Algorithm)
    /// This is the core operation for "removing" a piece during state validation
    pub fn clear_index(&mut self, index: usize) {
        if index >= self.total_cells {
            return;
        }
        
        let u64_index = index / self.cells_per_u64;
        let bit_offset = (index % self.cells_per_u64) * BITS_PER_CELL;
        
        // Clear the bits for this cell
        self.data[u64_index] &= !(self.mask << bit_offset);
    }
    
    /// Clear a specific cell by row/col coordinates (for Peeling Algorithm)
    pub fn clear_cell(&mut self, row: usize, col: usize) {
        if let Some(index) = self.coord_to_index(row, col) {
            self.clear_index(index);
        }
    }
    
    /// Get memory usage in bytes
    pub fn memory_usage(&self) -> usize {
        self.data.len() * std::mem::size_of::<u64>()
    }
    
    /// Get board dimensions
    pub fn dimensions(&self) -> (usize, usize) {
        (ROWS, COLS)
    }
    
    /// Get total number of cells
    pub fn total_cells(&self) -> usize {
        self.total_cells
    }
    
    /// Check if position is valid
    pub fn is_valid_position(&self, row: usize, col: usize) -> bool {
        row < ROWS && col < COLS
    }
    
    /// Get all non-empty cells as vector of (row, col, value)
    pub fn get_occupied_cells(&self) -> Vec<(usize, usize, u8)> {
        let mut occupied = Vec::new();
        
        for row in 0..ROWS {
            for col in 0..COLS {
                let value = self.get_cell(row, col);
                if value != 0 {
                    occupied.push((row, col, value));
                }
            }
        }
        
        occupied
    }
    
    /// Count cells with specific value
    pub fn count_cells_with_value(&self, target_value: u8) -> usize {
        let mut count = 0;
        
        for row in 0..ROWS {
            for col in 0..COLS {
                if self.get_cell(row, col) == target_value {
                    count += 1;
                }
            }
        }
        
        count
    }
    
    /// GEMINI ENHANCEMENT: Count how many set bits this board shares with a mask
    /// This is the core operation for AI pattern matching
    /// Extremely performant as it operates directly on u64 primitives
    pub fn count_set_bits_in_mask(&self, mask: &BitPackedBoard<ROWS, COLS, BITS_PER_CELL>) -> u32 {
        let mut count = 0;
        // Iterate over u64 chunks for maximum performance
        for (self_chunk, mask_chunk) in self.data.iter().zip(&mask.data) {
            // Use bitwise AND to find matches, count set bits in result
            count += (self_chunk & mask_chunk).count_ones();
        }
        count
    }
    
    /// Set a bit at the given linear index (for mask creation)
    pub fn set_bit(&mut self, index: usize, value: bool) {
        if index >= self.total_cells {
            return;
        }
        
        let u64_index = index / self.cells_per_u64;
        let bit_offset = (index % self.cells_per_u64) * BITS_PER_CELL;
        
        if value {
            self.data[u64_index] |= 1u64 << bit_offset;
        } else {
            self.data[u64_index] &= !(1u64 << bit_offset);
        }
    }
    
    /// Get a bit at the given linear index
    pub fn get_bit(&self, index: usize) -> bool {
        if index >= self.total_cells {
            return false;
        }
        
        let u64_index = index / self.cells_per_u64;
        let bit_offset = (index % self.cells_per_u64) * BITS_PER_CELL;
        
        (self.data[u64_index] >> bit_offset) & 1 == 1
    }
    
    /// Convert 2D coordinates to linear index
    pub fn coord_to_index(&self, row: usize, col: usize) -> Option<usize> {
        if row < ROWS && col < COLS {
            Some(row * COLS + col)
        } else {
            None
        }
    }
    
    /// Convert linear index to 2D coordinates
    pub fn index_to_coord(&self, index: usize) -> Option<(usize, usize)> {
        if index < self.total_cells {
            Some((index / COLS, index % COLS))
        } else {
            None
        }
    }
    
    /// XOR operation for finding differences between boards
    /// Essential for AI test move extraction
    pub fn xor(&self, other: &BitPackedBoard<ROWS, COLS, BITS_PER_CELL>) -> BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        let mut result = Self::new();
        
        for (i, (self_chunk, other_chunk)) in self.data.iter().zip(&other.data).enumerate() {
            result.data[i] = self_chunk ^ other_chunk;
        }
        
        result
    }
    
    /// Count total set bits in this board
    /// Used for move validation
    pub fn count_set_bits(&self) -> u32 {
        let mut count = 0;
        for chunk in &self.data {
            count += chunk.count_ones();
        }
        count
    }
    
    /// Find the index of the first set bit
    /// Used for extracting move from XOR result
    pub fn first_set_bit_index(&self) -> Option<usize> {
        for (chunk_idx, chunk) in self.data.iter().enumerate() {
            if *chunk != 0 {
                let bit_pos = chunk.trailing_zeros();
                let absolute_index = chunk_idx * self.cells_per_u64 + (bit_pos as usize / BITS_PER_CELL);
                if absolute_index < self.total_cells {
                    return Some(absolute_index);
                }
            }
        }
        None
    }
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> Default for BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_operations() {
        let mut board: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        
        // Test setting and getting
        board.set_cell(0, 0, 1).unwrap();
        assert_eq!(board.get_cell(0, 0), 1);
        
        // Test bounds checking
        assert!(board.set_cell(10, 10, 1).is_err());
        assert_eq!(board.get_cell(10, 10), 0);
    }
    
    #[test]
    fn test_peeling_algorithm_methods() {
        let mut board: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        
        // Set up a test pattern
        board.set_cell(0, 0, 1).unwrap();
        board.set_cell(1, 1, 2).unwrap();
        board.set_cell(2, 2, 1).unwrap();
        
        // Test count_set_bits
        assert_eq!(board.count_set_bits(), 3);
        
        // Test clear_cell
        board.clear_cell(1, 1);
        assert_eq!(board.get_cell(1, 1), 0);
        assert_eq!(board.count_set_bits(), 2);
        
        // Test clear_index
        let index = board.coord_to_index(2, 2).unwrap();
        board.clear_index(index);
        assert_eq!(board.get_cell(2, 2), 0);
        assert_eq!(board.count_set_bits(), 1);
        
        // Test that original cell is still there
        assert_eq!(board.get_cell(0, 0), 1);
    }
    
    #[test]
    fn test_pattern_matching() {
        let mut board1: BitPackedBoard<4, 4, 2> = BitPackedBoard::new();
        let mut board2: BitPackedBoard<4, 4, 2> = BitPackedBoard::new();
        
        // Set some matching positions
        board1.set_cell(0, 0, 1).unwrap();
        board1.set_cell(1, 1, 1).unwrap();
        board2.set_cell(0, 0, 1).unwrap();
        board2.set_cell(1, 1, 1).unwrap();
        board2.set_cell(2, 2, 1).unwrap();
        
        // Should count the 2 matching positions
        assert_eq!(board1.count_set_bits_in_mask(&board2), 2);
    }
    
    #[test]
    fn test_xor_operations() {
        let mut board1: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        let mut board2: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        
        // Set some bits in board1
        board1.set_bit(0, true);  // Position (0,0)
        board1.set_bit(7, true);  // Position (1,0)
        
        // Set some bits in board2 (one overlapping, one different)
        board2.set_bit(0, true);  // Position (0,0) - same as board1
        board2.set_bit(14, true); // Position (2,0) - different from board1
        
        // XOR should show differences
        let xor_result = board1.xor(&board2);
        
        // Should have 2 differences: position 7 and position 14
        assert_eq!(xor_result.count_set_bits(), 2);
        
        // First set bit should be at index 7
        assert_eq!(xor_result.first_set_bit_index(), Some(7));
    }
    
    #[test]
    fn test_move_extraction_scenario() {
        // Simulate a Connect4 move extraction
        let mut before: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        let mut after: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        
        // Before: One piece at (5,3) - bottom center
        before.set_bit(5 * 7 + 3, true);
        
        // After: Same piece plus new piece at (5,4) - next column
        after.set_bit(5 * 7 + 3, true);
        after.set_bit(5 * 7 + 4, true);
        
        // Find the difference
        let diff = before.xor(&after);
        
        // Should have exactly 1 difference
        assert_eq!(diff.count_set_bits(), 1);
        
        // Should point to index 38 (5*7+4)
        assert_eq!(diff.first_set_bit_index(), Some(5 * 7 + 4));
        
        // Convert to column
        let move_index = diff.first_set_bit_index().unwrap();
        let column = move_index % 7;
        assert_eq!(column, 4);
    }
}