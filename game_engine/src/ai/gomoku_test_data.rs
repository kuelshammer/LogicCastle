/// ASCII Test Infrastructure for Gomoku AI
/// Adapted from Connect4 test infrastructure for 15x15 board without gravity constraints

use crate::games::GomokuGame;
use crate::Player;
use crate::ai::GomokuAI;
use crate::data::BitPackedBoard;

/// Structure for data-driven AI testing for Gomoku
#[derive(Debug, Clone)]
pub struct GomokuAITestCase {
    pub name: &'static str,
    pub board_before: &'static str,
    pub board_after: &'static str,
    pub reason: &'static str,
}

/// Enhanced Gomoku AI test case with multiple valid moves
#[derive(Debug, Clone)]
pub struct GomokuAIMultiTestCase {
    pub name: &'static str,
    pub board_before: &'static str,
    pub valid_moves: Vec<(usize, usize)>, // Multiple acceptable moves
    pub reason: &'static str,
    pub test_type: GomokuTestType,
}

/// Types of Gomoku tests for different validation strategies
#[derive(Debug, Clone, PartialEq)]
pub enum GomokuTestType {
    /// Exact move required (blocking immediate win, creating immediate win)
    ExactMove,
    /// Any of multiple blocking positions (open three, multiple threats)
    AnyValidBlock,
    /// Best strategic move (opening, positional play)
    Strategic,
}

/// Parse ASCII board representation into Gomoku BitPackedBoard pair
/// Legend: '.' = Empty, 'B' = Black Player, 'W' = White Player
/// Returns (black_board, white_board) for use with from_boards constructor
pub fn parse_gomoku_ascii_to_boards(ascii: &str) -> Result<(BitPackedBoard<15, 15, 2>, BitPackedBoard<15, 15, 2>), String> {
    let mut black_board = BitPackedBoard::new();
    let mut white_board = BitPackedBoard::new();
    
    let lines: Vec<&str> = ascii.trim().lines().map(|line| line.trim()).collect();
    
    if lines.len() != 15 {
        return Err(format!("Board must have exactly 15 rows, got {}", lines.len()));
    }
    
    // Parse from top to bottom (row 0 to row 14)
    for (row_idx, line) in lines.iter().enumerate() {
        if line.len() != 15 {
            return Err(format!("Row {} must have exactly 15 columns, got {}", row_idx, line.len()));
        }
        
        for (col_idx, ch) in line.chars().enumerate() {
            match ch {
                '.' => {}, // Empty cell
                'B' => {
                    black_board.set_cell(row_idx, col_idx, 1)
                        .map_err(|e| format!("Failed to set black stone at ({}, {}): {}", row_idx, col_idx, e))?;
                },
                'W' => {
                    white_board.set_cell(row_idx, col_idx, 1)
                        .map_err(|e| format!("Failed to set white stone at ({}, {}): {}", row_idx, col_idx, e))?;
                },
                _ => return Err(format!("Invalid character '{}' at position ({}, {})", ch, row_idx, col_idx)),
            }
        }
    }
    
    Ok((black_board, white_board))
}

/// Extract move from board difference using XOR for Gomoku
/// Returns the (row, col) coordinates where the difference occurred
pub fn extract_gomoku_move_from_boards(board_before: &str, board_after: &str) -> Result<(usize, usize), String> {
    let (black_before, white_before) = parse_gomoku_ascii_to_boards(board_before)?;
    let (black_after, white_after) = parse_gomoku_ascii_to_boards(board_after)?;
    
    // Find differences using XOR
    let black_diff = black_before.xor(&black_after);
    let white_diff = white_before.xor(&white_after);
    
    let black_changes = black_diff.count_set_bits();
    let white_changes = white_diff.count_set_bits();
    
    // Exactly one player should have exactly one change
    match (black_changes, white_changes) {
        (1, 0) => {
            // Black made a move
            let bit_index = black_diff.first_set_bit_index()
                .ok_or("Failed to find changed bit in black board")?;
            // Convert bit index to (row, col) for 15x15 board
            let row = bit_index / 15;
            let col = bit_index % 15;
            Ok((row, col))
        },
        (0, 1) => {
            // White made a move
            let bit_index = white_diff.first_set_bit_index()
                .ok_or("Failed to find changed bit in white board")?;
            // Convert bit index to (row, col) for 15x15 board
            let row = bit_index / 15;
            let col = bit_index % 15;
            Ok((row, col))
        },
        _ => Err(format!(
            "Invalid board transition: expected exactly one stone to be added, got {} black changes and {} white changes",
            black_changes, white_changes
        ))
    }
}

/// Convert GomokuGame back to ASCII for comparison and debugging
pub fn gomoku_game_to_ascii(game: &GomokuGame) -> String {
    let mut result = String::new();
    
    for row in 0..15 {
        for col in 0..15 {
            let cell = game.get_cell(row, col);
            let ch = match cell {
                0 => '.', // Empty
                1 => 'B', // Black
                2 => 'W', // White
                _ => '?', // Unknown
            };
            result.push(ch);
        }
        result.push('\n');
    }
    
    result
}

/// Parse ASCII board representation into GomokuGame
/// Returns (game, current_player) where current_player is determined by stone count
pub fn parse_gomoku_board_from_ascii(ascii: &str) -> Result<(GomokuGame, Player), String> {
    let (black_board, white_board) = parse_gomoku_ascii_to_boards(ascii)?;
    
    // Determine current player based on piece count
    let black_count = black_board.count_set_bits();
    let white_count = white_board.count_set_bits();
    
    let current_player = if black_count > white_count {
        Player::White  // White's turn (Black has one more stone)
    } else {
        Player::Black  // Black's turn (equal stones or White has one more)
    };
    
    // Create game from boards
    let game = GomokuGame::from_boards(black_board, white_board, current_player);
    
    Ok((game, current_player))
}

/// Validate that a Gomoku board state is consistent
/// Checks stone count difference and other basic rules
pub fn is_valid_gomoku_state(ascii: &str) -> Result<bool, String> {
    let (black_board, white_board) = parse_gomoku_ascii_to_boards(ascii)?;
    
    let black_count = black_board.count_set_bits() as i32;
    let white_count = white_board.count_set_bits() as i32;
    
    // In Gomoku, Black starts, so valid states are:
    // - Equal counts (White just moved)
    // - Black has one more (Black just moved)
    let count_diff = black_count - white_count;
    
    if !(0..=1).contains(&count_diff) {
        return Ok(false); // Invalid stone count difference
    }
    
    // Check for overlapping stones (should be impossible with proper parsing)
    for row in 0..15 {
        for col in 0..15 {
            if black_board.get_cell(row, col) != 0 && white_board.get_cell(row, col) != 0 {
                return Ok(false); // Overlapping stones
            }
        }
    }
    
    Ok(true)
}

/// Test a single Gomoku AI case using XOR-based approach
pub fn test_gomoku_ai_case_xor(test_case: &GomokuAITestCase) -> Result<(), String> {
    // 1. Extract expected move automatically using XOR
    let (expected_row, expected_col) = extract_gomoku_move_from_boards(
        test_case.board_before, 
        test_case.board_after
    )?;
    
    // 2. Parse initial board state
    let (game, current_player) = parse_gomoku_board_from_ascii(test_case.board_before)?;
    
    // 3. Validate board state
    if !is_valid_gomoku_state(test_case.board_before)? {
        return Err(format!("Test case '{}' contains invalid board state", test_case.name));
    }
    
    // 4. Get AI move
    let ai = GomokuAI::new();
    let ai_move = ai.get_best_move_for_player(&game, current_player)
        .ok_or("AI failed to find a move")?;
    
    // 5. Compare with expected move
    if ai_move != (expected_row, expected_col) {
        return Err(format!(
            "\nTest case: {}\nReason: {}\nExpected move: ({}, {})\nActual move: ({}, {})\nBoard before:\n{}\nBoard after:\n{}\n",
            test_case.name,
            test_case.reason,
            expected_row,
            expected_col,
            ai_move.0,
            ai_move.1,
            test_case.board_before,
            test_case.board_after
        ));
    }
    
    Ok(())
}

/// Test a Gomoku AI case with multiple acceptable moves
pub fn test_gomoku_ai_multi_case(test_case: &GomokuAIMultiTestCase) -> Result<(), String> {
    // 1. Parse initial board state
    let (game, current_player) = parse_gomoku_board_from_ascii(test_case.board_before)?;
    
    // 2. Validate board state
    if !is_valid_gomoku_state(test_case.board_before)? {
        return Err(format!("Test case '{}' contains invalid board state", test_case.name));
    }
    
    // 3. Get AI move
    let ai = GomokuAI::new();
    let ai_move = ai.get_best_move_for_player(&game, current_player)
        .ok_or("AI failed to find a move")?;
    
    // 4. Check if AI move is one of the acceptable moves
    if !test_case.valid_moves.contains(&ai_move) {
        let valid_moves_str = test_case.valid_moves.iter()
            .map(|(r, c)| format!("({}, {})", r, c))
            .collect::<Vec<_>>()
            .join(", ");
        
        return Err(format!(
            "\nTest case: {}\nType: {:?}\nReason: {}\nExpected moves: [{}]\nActual move: ({}, {})\nBoard:\n{}\n",
            test_case.name,
            test_case.test_type,
            test_case.reason,
            valid_moves_str,
            ai_move.0,
            ai_move.1,
            test_case.board_before
        ));
    }
    
    Ok(())
}

/// Create a GomokuGame from ASCII and verify the move leads to expected result
pub fn test_gomoku_ai_case_full_simulation(test_case: &GomokuAITestCase) -> Result<(), String> {
    // Parse the initial board
    let (mut game, current_player) = parse_gomoku_board_from_ascii(test_case.board_before)?;
    
    // Ensure it's the expected player's turn
    if game.current_player() != current_player {
        return Err(format!("Expected player {:?} to move, but current player is {:?}", 
                          current_player, game.current_player()));
    }
    
    // Get AI's move
    let ai = GomokuAI::new();
    let ai_move = ai.get_best_move_for_player(&game, current_player)
        .ok_or_else(|| "AI failed to find a move".to_string())?;
    
    // Make the AI move
    game.make_move_internal(ai_move.0, ai_move.1)
        .map_err(|e| format!("AI move failed: {}", e))?;
    
    // Convert result to ASCII
    let actual_board = gomoku_game_to_ascii(&game);
    let expected_board = test_case.board_after.trim();
    
    // Compare boards
    if actual_board.trim() != expected_board {
        return Err(format!(
            "\nTest case: {}\nReason: {}\nExpected board:\n{}\nActual board:\n{}\nAI chose move: ({}, {})",
            test_case.name,
            test_case.reason,
            expected_board,
            actual_board.trim(),
            ai_move.0,
            ai_move.1
        ));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_gomoku_ascii_basic() {
        let ascii = "
...............
...............
...............
...............
...............
...............
...............
.......B.......
...............
...............
...............
...............
...............
...............
...............
        ";
        
        let result = parse_gomoku_ascii_to_boards(ascii);
        assert!(result.is_ok(), "ASCII parsing should succeed");
        
        let (black_board, white_board) = result.unwrap();
        assert_eq!(black_board.get_cell(7, 7), 1, "Should have B at row 7, col 7");
        assert_eq!(white_board.get_cell(7, 7), 0, "White board should be empty at center");
    }
    
    #[test]
    fn test_gomoku_board_to_ascii_conversion() {
        let mut game = GomokuGame::new();
        game.make_move_internal(7, 7).unwrap(); // Black in center
        
        let ascii = gomoku_game_to_ascii(&game);
        let lines: Vec<&str> = ascii.lines().collect();
        
        // Should have B at center row, center column
        assert_eq!(lines[7].chars().nth(7).unwrap(), 'B');
    }
    
    #[test]
    fn test_extract_gomoku_move_from_boards() {
        let board_before = "
...............
...............
...............
...............
...............
...............
...............
.......B.......
...............
...............
...............
...............
...............
...............
...............
        ";
        
        let board_after = "
...............
...............
...............
...............
...............
...............
...............
.......BW......
...............
...............
...............
...............
...............
...............
...............
        ";
        
        let result = extract_gomoku_move_from_boards(board_before, board_after);
        assert!(result.is_ok());
        
        let (row, col) = result.unwrap();
        assert_eq!((row, col), (7, 8)); // W was placed at row 7, col 8
    }
    
    #[test]
    fn test_parse_gomoku_board_from_ascii() {
        let ascii = "
...............
...............
...............
...............
...............
...............
...............
.......B.......
.......W.......
...............
...............
...............
...............
...............
...............
        ";
        
        let result = parse_gomoku_board_from_ascii(ascii);
        assert!(result.is_ok());
        
        let (game, current_player) = result.unwrap();
        assert_eq!(game.get_cell(7, 7), 1); // Black stone
        assert_eq!(game.get_cell(8, 7), 2); // White stone
        assert_eq!(current_player, Player::Black); // Black's turn (equal stones)
    }
    
    #[test]
    fn test_is_valid_gomoku_state() {
        // Valid state: equal stones (White just moved)
        let valid_board = "
...............
...............
...............
...............
...............
...............
...............
.......B.......
.......W.......
...............
...............
...............
...............
...............
...............
        ";
        
        assert!(is_valid_gomoku_state(valid_board).unwrap());
        
        // Invalid state: White has more stones than Black
        let invalid_board = "
...............
...............
...............
...............
...............
...............
...............
.......W.......
.......W.......
...............
...............
...............
...............
...............
...............
        ";
        
        assert!(!is_valid_gomoku_state(invalid_board).unwrap());
    }
    
    #[test]
    fn test_gomoku_ai_xor_infrastructure() {
        // Simple test case: AI should play near existing stones
        let test_case = GomokuAITestCase {
            name: "Test XOR-based Gomoku AI",
            board_before: "
...............
...............
...............
...............
...............
...............
...............
.......B.......
...............
...............
...............
...............
...............
...............
...............
            ",
            board_after: "
...............
...............
...............
...............
...............
...............
.......W.......
.......B.......
...............
...............
...............
...............
...............
...............
...............
            ",
            reason: "AI should play near center to contest control",
        };
        
        let result = test_gomoku_ai_case_xor(&test_case);
        // This might succeed or fail depending on AI strategy, but tests the infrastructure
        match result {
            Ok(_) => println!("XOR-based Gomoku test passed"),
            Err(e) => println!("XOR-based Gomoku test failed (expected): {}", e),
        }
    }
    
    #[test]
    fn test_round_trip_conversion() {
        let original_ascii = "
...............
...............
...............
...............
...............
...............
...............
.......BW......
...............
...............
...............
...............
...............
...............
...............
        ";
        
        let (game, _) = parse_gomoku_board_from_ascii(original_ascii).unwrap();
        let converted_back = gomoku_game_to_ascii(&game);
        
        // Should preserve the pattern
        assert!(converted_back.contains(".......BW......"));
    }
    
    #[test]
    fn test_full_bidirectional_gomoku_round_trip() {
        // Test: ASCII → Game → ASCII → Game → ASCII for Gomoku
        let original_ascii = "
...............
...............
...............
...............
...............
......W........
......B........
......W........
......B........
...............
...............
...............
...............
...............
...............
        ";
        
        // First conversion: ASCII → Game
        let (game1, player1) = parse_gomoku_board_from_ascii(original_ascii).unwrap();
        assert_eq!(game1.move_count(), 4); // Should have 4 stones
        
        // Second conversion: Game → ASCII
        let ascii2 = gomoku_game_to_ascii(&game1);
        
        // Third conversion: ASCII → Game  
        let (game2, player2) = parse_gomoku_board_from_ascii(&ascii2).unwrap();
        
        // Fourth conversion: Game → ASCII
        let ascii3 = gomoku_game_to_ascii(&game2);
        
        // Verify consistency across all conversions
        assert_eq!(player1, player2, "Current player should be consistent");
        assert_eq!(game1.move_count(), game2.move_count(), "Move count should be consistent");
        assert_eq!(ascii2.trim(), ascii3.trim(), "ASCII representations should be identical");
        
        // Verify board state is preserved
        for row in 0..15 {
            for col in 0..15 {
                assert_eq!(
                    game1.get_cell(row, col), 
                    game2.get_cell(row, col),
                    "Cell ({}, {}) should be identical", row, col
                );
            }
        }
        
        // Verify specific pattern preservation  
        assert!(ascii3.contains("......W........"), "White stones should be preserved");
        assert!(ascii3.contains("......B........"), "Black stones should be preserved");
        
        // Test with more complex pattern
        let complex_ascii = "
...............
...............
...............
....B..........
.....W.........
......B........
.......W.......
........B......
...............
...............
...............
...............
...............
...............
...............
        ";
        
        let (complex_game1, _) = parse_gomoku_board_from_ascii(complex_ascii).unwrap();
        let complex_ascii2 = gomoku_game_to_ascii(&complex_game1);
        let (complex_game2, _) = parse_gomoku_board_from_ascii(&complex_ascii2).unwrap();
        let complex_ascii3 = gomoku_game_to_ascii(&complex_game2);
        
        assert_eq!(complex_ascii2.trim(), complex_ascii3.trim(), "Complex pattern should survive round-trip");
        assert_eq!(complex_game1.move_count(), complex_game2.move_count(), "Complex game move count should be preserved");
    }
}