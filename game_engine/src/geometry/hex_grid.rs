use super::{BoardGeometry, PatternProvider};
use crate::data::BitPackedBoard;

/// Hexagonal grid geometry for Hex game
/// Uses axial coordinate system for efficient hex math
/// Handles hexagonal boards with 6-directional neighbors
#[derive(Debug, Clone)]
pub struct HexGrid<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> {
    radius: i32,
    
    // Pre-computed pattern masks for AI evaluation
    winning_paths_player1: Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>>, // Top-Bottom connections
    winning_paths_player2: Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>>, // Left-Right connections
    edge_masks: [BitPackedBoard<ROWS, COLS, BITS_PER_CELL>; 4], // Top, Bottom, Left, Right
    center_mask: BitPackedBoard<ROWS, COLS, BITS_PER_CELL>,
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> HexGrid<ROWS, COLS, BITS_PER_CELL> {
    pub fn new(radius: i32) -> Self {
        let mut grid = Self {
            radius,
            winning_paths_player1: Vec::new(),
            winning_paths_player2: Vec::new(),
            edge_masks: [
                BitPackedBoard::new(), // Top
                BitPackedBoard::new(), // Bottom  
                BitPackedBoard::new(), // Left
                BitPackedBoard::new(), // Right
            ],
            center_mask: BitPackedBoard::new(),
        };
        grid.precompute_patterns();
        grid
    }
    
    /// Convert axial coordinates to array index
    /// Axial coordinates: (q, r) where q is column, r is row
    fn axial_to_index(&self, q: i32, r: i32) -> Option<usize> {
        // Convert axial to offset coordinates for array indexing
        let col = q + (r - (r & 1)) / 2;
        let row = r;
        
        if self.is_valid_offset(row, col) {
            Some((row as usize) * COLS + (col as usize))
        } else {
            None
        }
    }
    
    /// Convert array index to axial coordinates
    fn index_to_axial(&self, index: usize) -> Option<(i32, i32)> {
        if index >= ROWS * COLS {
            return None;
        }
        
        let row = (index / COLS) as i32;
        let col = (index % COLS) as i32;
        
        // Convert offset to axial coordinates
        let r = row;
        let q = col - (row - (row & 1)) / 2;
        
        Some((q, r))
    }
    
    /// Check if offset coordinates are valid
    fn is_valid_offset(&self, row: i32, col: i32) -> bool {
        row >= 0 && row < ROWS as i32 && col >= 0 && col < COLS as i32
    }
    
    /// Get the 6 hexagonal neighbors in axial coordinates
    fn get_hex_neighbors(&self, q: i32, r: i32) -> Vec<(i32, i32)> {
        let directions = [
            (1, 0),   // East
            (1, -1),  // Northeast  
            (0, -1),  // Northwest
            (-1, 0),  // West
            (-1, 1),  // Southwest
            (0, 1),   // Southeast
        ];
        
        let mut neighbors = Vec::new();
        for (dq, dr) in directions {
            let new_q = q + dq;
            let new_r = r + dr;
            
            if self.axial_to_index(new_q, new_r).is_some() {
                neighbors.push((new_q, new_r));
            }
        }
        
        neighbors
    }
    
    /// Generate edge masks for each side of the hex board
    fn generate_edge_masks(&mut self) {
        // For an 11x11 hex grid, we need to identify the actual hex edges
        // This is simplified - in a real implementation, you'd calculate based on hex geometry
        
        // Top edge (first row)
        for col in 0..COLS {
            if let Some(index) = self.axial_to_index(col as i32, 0) {
                self.edge_masks[0].set_bit(index, true);
            }
        }
        
        // Bottom edge (last row)
        for col in 0..COLS {
            if let Some(index) = self.axial_to_index(col as i32, (ROWS - 1) as i32) {
                self.edge_masks[1].set_bit(index, true);
            }
        }
        
        // Left edge (leftmost valid positions)
        for row in 0..ROWS {
            if let Some(index) = self.axial_to_index(0, row as i32) {
                self.edge_masks[2].set_bit(index, true);
            }
        }
        
        // Right edge (rightmost valid positions)  
        for row in 0..ROWS {
            if let Some(index) = self.axial_to_index((COLS - 1) as i32, row as i32) {
                self.edge_masks[3].set_bit(index, true);
            }
        }
    }
    
    /// Generate center control mask
    fn generate_center_mask(&mut self) {
        let center_q = (COLS / 2) as i32;
        let center_r = (ROWS / 2) as i32;
        
        // Mark center and nearby hexes
        for dq in -2..=2 {
            for dr in -2..=2 {
                let q = center_q + dq;
                let r = center_r + dr;
                
                if let Some(index) = self.axial_to_index(q, r) {
                    self.center_mask.set_bit(index, true);
                }
            }
        }
    }
    
    /// Generate winning path patterns for Player 1 (Top-Bottom connection)
    fn generate_player1_paths(&mut self) -> Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>> {
        let mut paths = Vec::new();
        
        // In Hex, Player 1 needs to connect top to bottom
        // This is a simplified implementation - real Hex would use more sophisticated path detection
        
        // Generate simple vertical connection patterns
        for start_col in 0..COLS {
            let mut path = BitPackedBoard::new();
            
            // Simple vertical path
            for row in 0..ROWS {
                if let Some(index) = self.axial_to_index(start_col as i32, row as i32) {
                    path.set_bit(index, true);
                }
            }
            
            paths.push(path);
        }
        
        paths
    }
    
    /// Generate winning path patterns for Player 2 (Left-Right connection)  
    fn generate_player2_paths(&mut self) -> Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>> {
        let mut paths = Vec::new();
        
        // In Hex, Player 2 needs to connect left to right
        
        // Generate simple horizontal connection patterns
        for start_row in 0..ROWS {
            let mut path = BitPackedBoard::new();
            
            // Simple horizontal path
            for col in 0..COLS {
                if let Some(index) = self.axial_to_index(col as i32, start_row as i32) {
                    path.set_bit(index, true);
                }
            }
            
            paths.push(path);
        }
        
        paths
    }
    
    /// Get winning paths for a specific player
    pub fn get_winning_paths(&self, player: u8) -> &Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>> {
        match player {
            1 => &self.winning_paths_player1, // Top-Bottom
            2 => &self.winning_paths_player2, // Left-Right
            _ => &self.winning_paths_player1, // Default
        }
    }
    
    /// Get specific edge mask
    pub fn get_edge_mask(&self, edge: HexEdge) -> &BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        match edge {
            HexEdge::Top => &self.edge_masks[0],
            HexEdge::Bottom => &self.edge_masks[1],
            HexEdge::Left => &self.edge_masks[2],
            HexEdge::Right => &self.edge_masks[3],
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum HexEdge {
    Top,
    Bottom,
    Left,
    Right,
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> BoardGeometry for HexGrid<ROWS, COLS, BITS_PER_CELL> {
    fn to_index(&self, coord: (i32, i32)) -> Option<usize> {
        let (q, r) = coord;
        self.axial_to_index(q, r)
    }
    
    fn from_index(&self, index: usize) -> Option<(i32, i32)> {
        self.index_to_axial(index)
    }
    
    fn get_neighbors(&self, coord: (i32, i32)) -> Vec<(i32, i32)> {
        let (q, r) = coord;
        self.get_hex_neighbors(q, r)
    }
    
    fn is_valid(&self, coord: (i32, i32)) -> bool {
        let (q, r) = coord;
        self.axial_to_index(q, r).is_some()
    }
    
    fn board_size(&self) -> usize {
        ROWS * COLS
    }
    
    fn dimensions(&self) -> (usize, usize) {
        (ROWS, COLS)
    }
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> PatternProvider<ROWS, COLS, BITS_PER_CELL> for HexGrid<ROWS, COLS, BITS_PER_CELL> {
    fn get_winning_lines(&self, _length: usize) -> &Vec<BitPackedBoard<ROWS, COLS, BITS_PER_CELL>> {
        // Hex doesn't use fixed-length lines, but connection paths
        // Return Player 1 paths as default
        &self.winning_paths_player1
    }
    
    fn get_center_mask(&self) -> &BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        &self.center_mask
    }
    
    fn get_edge_mask(&self) -> &BitPackedBoard<ROWS, COLS, BITS_PER_CELL> {
        // Return combined edge mask
        &self.edge_masks[0] // Simplified - should combine all edges
    }
    
    fn precompute_patterns(&mut self) {
        // Generate all patterns for Hex game
        self.winning_paths_player1 = self.generate_player1_paths();
        self.winning_paths_player2 = self.generate_player2_paths();
        self.generate_edge_masks();
        self.generate_center_mask();
        
        println!("🔷 HexGrid patterns generated: {} Player1 paths, {} Player2 paths", 
            self.winning_paths_player1.len(),
            self.winning_paths_player2.len());
    }
}

impl<const ROWS: usize, const COLS: usize, const BITS_PER_CELL: usize> Default for HexGrid<ROWS, COLS, BITS_PER_CELL> {
    fn default() -> Self {
        Self::new(5) // Default radius
    }
}

// Type alias for standard Hex game (11x11 grid)
pub type StandardHexGrid = HexGrid<11, 11, 2>;

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_axial_coordinate_conversion() {
        let grid: StandardHexGrid = HexGrid::new(5);
        
        // Test basic coordinate conversion
        let (q, r) = (0, 0);
        if let Some(index) = grid.to_index((q, r)) {
            assert_eq!(grid.from_index(index), Some((q, r)));
        }
        
        // Test center coordinate
        let (q, r) = (5, 5);
        if let Some(index) = grid.to_index((q, r)) {
            assert_eq!(grid.from_index(index), Some((q, r)));
        }
    }
    
    #[test]
    fn test_hex_neighbors() {
        let grid: StandardHexGrid = HexGrid::new(5);
        
        // Test center position has 6 neighbors
        let neighbors = grid.get_neighbors((5, 5));
        assert_eq!(neighbors.len(), 6);
        
        // Test corner position has fewer neighbors
        let corner_neighbors = grid.get_neighbors((0, 0));
        assert!(corner_neighbors.len() < 6);
    }
    
    #[test]
    fn test_pattern_generation() {
        let grid: StandardHexGrid = HexGrid::new(5);
        
        // Should have generated winning paths
        assert!(!grid.winning_paths_player1.is_empty());
        assert!(!grid.winning_paths_player2.is_empty());
        
        // Player 1 and Player 2 should have different path counts
        // (depends on implementation, but they should exist)
        assert!(!grid.winning_paths_player1.is_empty());
        assert!(!grid.winning_paths_player2.is_empty());
    }
    
    #[test]
    fn test_edge_detection() {
        let grid: StandardHexGrid = HexGrid::new(5);
        
        // Test that edge masks were generated
        let top_edge = grid.get_edge_mask(HexEdge::Top);
        let bottom_edge = grid.get_edge_mask(HexEdge::Bottom);
        
        // Edges should have at least some positions marked
        let top_positions = (0..grid.board_size())
            .filter(|&i| top_edge.get_bit(i))
            .count();
        let bottom_positions = (0..grid.board_size())
            .filter(|&i| bottom_edge.get_bit(i))
            .count();
            
        assert!(top_positions > 0);
        assert!(bottom_positions > 0);
    }
}