
#[cfg(test)]
mod pattern_performance_tests {
    use std::time::Instant;
    use crate::{Connect4Grid, StandardHexGrid};
    use crate::geometry::{QuadraticGrid, HexGrid, BitPackedBoard, BoardGeometry, PatternProvider};

    #[test]
    fn test_connect4_pattern_generation_performance() {
        let start = Instant::now();
        let grid: Connect4Grid = QuadraticGrid::new();
        let generation_time = start.elapsed();
        
        println!("🎯 Connect4Grid pattern generation took: {:?}", generation_time);
        
        // Should generate patterns quickly (under 100ms)
        assert!(generation_time.as_millis() < 100);
        
        // Should have generated many 4-in-a-row patterns for 6x7 board
        let lines_of_4 = grid.get_winning_lines(4);
        println!("📊 Generated {} lines of 4", lines_of_4.len());
        
        // Connect4 6x7 board should have:
        // Horizontal: 4 * 6 = 24
        // Vertical: 7 * 3 = 21  
        // Diagonal: ~12
        // Total: ~60+ patterns
        assert!(lines_of_4.len() >= 60);
        assert!(lines_of_4.len() < 200); // Reasonable upper bound
    }

    #[test]
    fn test_hex_pattern_generation_performance() {
        let start = Instant::now();
        let grid: StandardHexGrid = HexGrid::new(5);
        let generation_time = start.elapsed();
        
        println!("🔷 HexGrid pattern generation took: {:?}", generation_time);
        
        // Should generate patterns quickly
        assert!(generation_time.as_millis() < 200);
        
        // Should have generated winning paths
        let player1_paths = grid.get_winning_paths(1);
        let player2_paths = grid.get_winning_paths(2);
        
        println!("📊 Generated {} Player1 paths, {} Player2 paths", 
                 player1_paths.len(), player2_paths.len());
        
        assert!(!player1_paths.is_empty());
        assert!(!player2_paths.is_empty());
    }

    #[test]
    fn test_bit_pattern_matching_performance() {
        let grid: Connect4Grid = QuadraticGrid::new();
        let mut test_board: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        
        // Set up a test pattern (horizontal line)
        test_board.set_bit(grid.to_index((0, 0)).unwrap(), true);
        test_board.set_bit(grid.to_index((0, 1)).unwrap(), true);
        test_board.set_bit(grid.to_index((0, 2)).unwrap(), true);
        
        let lines_of_4 = grid.get_winning_lines(4);
        
        // Test performance of pattern matching
        let start = Instant::now();
        let mut match_count = 0;
        
        for _ in 0..1000 { // 1000 iterations
            for pattern in lines_of_4 {
                let matches = test_board.count_set_bits_in_mask(pattern);
                if matches >= 3 {
                    match_count += 1;
                }
            }
        }
        
        let matching_time = start.elapsed();
        println!("⚡ 1000 iterations of pattern matching took: {:?}", matching_time);
        
        // Should be very fast (under 20ms for 1000 iterations)
        assert!(matching_time.as_millis() < 20);
        assert!(match_count > 0); // Should find some matches
    }

    #[test]
    fn test_memory_efficiency() {
        let grid: Connect4Grid = QuadraticGrid::new();
        let board: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        
        // BitPackedBoard should use much less memory than naive approach
        let bit_packed_size = board.memory_usage();
        let naive_size = 6 * 7 * std::mem::size_of::<u8>(); // Naive: 1 byte per cell
        
        println!("📊 Memory usage - BitPacked: {} bytes, Naive: {} bytes", 
                 bit_packed_size, naive_size);
        
        // BitPacked should use significantly less memory
        assert!(bit_packed_size < naive_size);
        
        // For 6x7 board with 2 bits per cell:
        // 42 cells * 2 bits = 84 bits = 11 bytes (rounded up to u64 boundary)
        // Naive approach: 42 bytes
        // Savings should be substantial
        let savings_percent = ((naive_size - bit_packed_size) as f64 / naive_size as f64) * 100.0;
        println!("💾 Memory savings: {:.1}%", savings_percent);
        
        assert!(savings_percent > 50.0); // At least 50% savings
    }

    #[test]
    fn test_coordinate_conversion_accuracy() {
        let grid: Connect4Grid = QuadraticGrid::new();
        
        // Test all valid coordinates can be converted back and forth
        for row in 0..6 {
            for col in 0..7 {
                let coord = (row, col);
                if let Some(index) = grid.to_index(coord) {
                    let converted_back = grid.from_index(index);
                    assert_eq!(converted_back, Some(coord));
                }
            }
        }
        
        // Test invalid coordinates are rejected
        assert_eq!(grid.to_index((6, 0)), None); // Row out of bounds
    }
    
    #[test]
    fn test_peeling_algorithm_coordinate_conversion() {
        let grid: Connect4Grid = QuadraticGrid::new();
        
        // Test the new peeling algorithm specific methods
        assert_eq!(grid.coord_to_linear_index(0, 0), 0);
        assert_eq!(grid.coord_to_linear_index(0, 6), 6);
        assert_eq!(grid.coord_to_linear_index(1, 0), 7);
        assert_eq!(grid.coord_to_linear_index(5, 6), 41);
        
        // Test bounds checking - should return board_size (42) for out of bounds
        assert_eq!(grid.coord_to_linear_index(6, 0), 42); // Out of bounds
        assert_eq!(grid.coord_to_linear_index(0, 7), 42); // Out of bounds
        
        // Test linear_index_to_coord
        assert_eq!(grid.linear_index_to_coord(0), Some((0, 0)));
        assert_eq!(grid.linear_index_to_coord(6), Some((0, 6)));
        assert_eq!(grid.linear_index_to_coord(7), Some((1, 0)));
        assert_eq!(grid.linear_index_to_coord(41), Some((5, 6)));
        
        // Test out of bounds
        assert_eq!(grid.linear_index_to_coord(42), None);
        assert_eq!(grid.linear_index_to_coord(100), None);
        
        // Test round-trip conversion
        for row in 0..6 {
            for col in 0..7 {
                let index = grid.coord_to_linear_index(row, col);
                if index < 42 { // Valid index
                    let (back_row, back_col) = grid.linear_index_to_coord(index).unwrap();
                    assert_eq!((row, col), (back_row, back_col));
                }
            }
        }
    }

    #[test]
    fn test_hex_coordinate_conversion_accuracy() {
        let grid: StandardHexGrid = HexGrid::new(5);
        
        // Test coordinate conversion for hex grid
        let test_coords = [
            (0, 0),   // Origin
            (5, 5),   // Center  
            (10, 10), // Corner
            (-2, 3),  // Negative q
            (3, -1),  // Negative r
        ];
        
        for &coord in &test_coords {
            if let Some(index) = grid.to_index(coord) {
                let converted_back = grid.from_index(index);
                assert_eq!(converted_back, Some(coord), 
                          "Conversion failed for coord {:?}", coord);
            }
        }
    }

    #[test]
    fn test_neighbor_calculation_accuracy() {
        let grid: Connect4Grid = QuadraticGrid::new();
        
        // Test center position (should have 8 neighbors)
        let center_neighbors = grid.get_neighbors((2, 3));
        assert_eq!(center_neighbors.len(), 8);
        
        // Test corner position (should have 3 neighbors)
        let corner_neighbors = grid.get_neighbors((0, 0));
        assert_eq!(corner_neighbors.len(), 3);
        
        // Test edge position (should have 5 neighbors)
        let edge_neighbors = grid.get_neighbors((0, 3));
        assert_eq!(edge_neighbors.len(), 5);
        
        // All neighbors should be valid coordinates
        for neighbor in center_neighbors {
            assert!(grid.is_valid(neighbor));
        }
    }

    #[test]
    fn test_hex_neighbor_calculation() {
        let grid: StandardHexGrid = HexGrid::new(5);
        
        // Test that hex neighbors follow hexagonal geometry
        let center_neighbors = grid.get_neighbors((5, 5));
        
        // Should have 6 neighbors in hexagonal grid
        assert_eq!(center_neighbors.len(), 6);
        
        // All neighbors should be valid
        for neighbor in center_neighbors {
            assert!(grid.is_valid(neighbor));
        }
        
        // Test edge position has fewer neighbors
        let edge_neighbors = grid.get_neighbors((0, 0));
        assert!(edge_neighbors.len() < 6);
    }

    #[test]
    fn test_pattern_uniqueness() {
        let grid: Connect4Grid = QuadraticGrid::new();
        let lines_of_4 = grid.get_winning_lines(4);
        
        // Verify patterns are unique
        for i in 0..lines_of_4.len() {
            for j in (i + 1)..lines_of_4.len() {
                let pattern1 = &lines_of_4[i];
                let pattern2 = &lines_of_4[j];
                
                // Patterns should not be identical
                let differences = (0..grid.board_size())
                    .filter(|&idx| pattern1.get_bit(idx) != pattern2.get_bit(idx))
                    .count();
                
                assert!(differences > 0, "Found duplicate patterns at indices {} and {}", i, j);
            }
        }
    }

    #[test]
    fn test_pattern_validity() {
        let grid: Connect4Grid = QuadraticGrid::new();
        let lines_of_4 = grid.get_winning_lines(4);
        
        // Each pattern should have exactly 4 bits set
        for (i, pattern) in lines_of_4.iter().enumerate() {
            let bit_count = (0..grid.board_size())
                .filter(|&idx| pattern.get_bit(idx))
                .count();
            
            assert_eq!(bit_count, 4, "Pattern {} has {} bits set, expected 4", i, bit_count);
        }
        
        // Test that patterns represent valid winning lines
        for pattern in lines_of_4 {
            let positions: Vec<_> = (0..grid.board_size())
                .filter(|&idx| pattern.get_bit(idx))
                .filter_map(|idx| grid.from_index(idx))
                .collect();
            
            assert_eq!(positions.len(), 4);
            
            // Check if positions form a line (simplified check)
            let (rows, cols): (Vec<_>, Vec<_>) = positions.iter().copied().unzip();
            
            // Should be either all same row, all same col, or diagonal
            let same_row = rows.iter().all(|&r| r == rows[0]);
            let same_col = cols.iter().all(|&c| c == cols[0]);
            let diagonal = is_diagonal(&positions);
            
            assert!(same_row || same_col || diagonal, 
                   "Pattern positions don't form a valid line: {:?}", positions);
        }
    }

    fn is_diagonal(positions: &[(i32, i32)]) -> bool {
        if positions.len() != 4 {
            return false;
        }
        
        let mut sorted = positions.to_vec();
        sorted.sort();
        
        // Check if it's a diagonal (slope 1 or -1)
        let slope_consistent = |expected_dr: i32, expected_dc: i32| {
            sorted.windows(2).all(|window| {
                let dr = window[1].0 - window[0].0;
                let dc = window[1].1 - window[0].1;
                dr == expected_dr && dc == expected_dc
            })
        };
        
        // Check for all possible diagonal directions:
        // - slope 1: (1, 1) - down-right
        // - slope -1: (1, -1) - down-left  
        // But since we sort by (row, col), the sorted positions may have different patterns
        // Let's check for consistent slope between all consecutive pairs
        
        if sorted.len() < 2 {
            return false;
        }
        
        let first_dr = sorted[1].0 - sorted[0].0;
        let first_dc = sorted[1].1 - sorted[0].1;
        
        // Check if all consecutive pairs have the same slope
        for i in 2..sorted.len() {
            let dr = sorted[i].0 - sorted[i-1].0;
            let dc = sorted[i].1 - sorted[i-1].1;
            if dr != first_dr || dc != first_dc {
                return false;
            }
        }
        
        // Check if it's a valid diagonal slope (abs(slope) == 1)
        first_dr.abs() == first_dc.abs() && first_dr != 0 && first_dc != 0
    }

    #[test]
    fn test_center_mask_coverage() {
        let grid: Connect4Grid = QuadraticGrid::new();
        let center_mask = grid.get_center_mask();
        
        // Count center positions
        let center_positions = (0..grid.board_size())
            .filter(|&idx| center_mask.get_bit(idx))
            .count();
        
        println!("🎯 Center mask covers {} positions", center_positions);
        
        // Should cover some positions but not the entire board
        assert!(center_positions > 0);
        assert!(center_positions < grid.board_size());
        
        // For Connect4, center should include middle columns
        assert!(center_positions >= 6); // At least one column
        assert!(center_positions <= 21); // At most 3 columns
    }
}

#[cfg(test)]
mod integration_tests {
    use crate::{Connect4Grid, StandardHexGrid};
    use crate::geometry::{QuadraticGrid, HexGrid, BitPackedBoard, BoardGeometry, PatternProvider};

    #[test]
    fn test_three_layer_integration() {
        // Test that all three layers work together
        let geometry: Connect4Grid = QuadraticGrid::new();
        let mut data_board: BitPackedBoard<6, 7, 2> = BitPackedBoard::new();
        
        // Simulate placing pieces using geometry for coordinates
        let moves = [(0, 3), (1, 3), (2, 3)]; // Three in a row
        
        for &coord in &moves {
            if let Some(index) = geometry.to_index(coord) {
                data_board.set_bit(index, true);
            }
        }
        
        // Use patterns from geometry to evaluate position
        let lines_of_4 = geometry.get_winning_lines(4);
        let mut threat_count = 0;
        
        for pattern in lines_of_4 {
            let matches = data_board.count_set_bits_in_mask(pattern);
            if matches >= 3 {
                threat_count += 1;
            }
        }
        
        // Should detect the threat
        assert!(threat_count > 0, "Failed to detect 3-in-a-row threat");
        
        println!("✅ Three-layer integration test passed: {} threats detected", threat_count);
    }

    #[test]
    fn test_hex_integration() {
        // Test hex geometry integration
        let geometry: StandardHexGrid = HexGrid::new(5);
        let mut data_board: BitPackedBoard<11, 11, 2> = BitPackedBoard::new();
        
        // Place some pieces
        let hex_moves = [(0, 0), (1, 0), (2, 0)]; // Simple line
        
        for &coord in &hex_moves {
            if let Some(index) = geometry.to_index(coord) {
                data_board.set_bit(index, true);
            }
        }
        
        // Test that patterns can evaluate this position
        let player1_paths = geometry.get_winning_paths(1);
        let mut path_matches = 0;
        
        for path in player1_paths {
            let matches = data_board.count_set_bits_in_mask(path);
            if matches > 0 {
                path_matches += 1;
            }
        }
        
        // Should find some path matches
        assert!(path_matches > 0, "Failed to find any path matches in hex integration");
        
        println!("✅ Hex integration test passed: {} path matches found", path_matches);
    }
}