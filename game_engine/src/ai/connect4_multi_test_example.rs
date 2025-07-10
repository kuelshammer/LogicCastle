/// Connect4 Multi-Move Test Example
/// Demonstrates the .X.X. scenario in bottom row

use crate::ai::test_data::AITestCase;

/// Example of Connect4 scenario with multiple valid blocking moves
pub fn get_connect4_bottom_row_multi_example() -> Vec<(String, Vec<usize>)> {
    vec![
        (
            "Bottom Row .X.X. - Multiple blocks".to_string(),
            vec![0, 2, 4] // Columns 0, 2, 4 all block equally
        )
    ]
}

/// The classic .X.X. scenario board
pub fn get_bottom_row_dotted_board() -> &'static str {
    "
.......
.......
.......
.......
.......
.X.X...
"
}

/// Test case showing all three valid blocking positions
pub fn get_connect4_multi_test_cases() -> Vec<AITestCase> {
    vec![
        // Option 1: Block left
        AITestCase {
            name: "Bottom Row Block Left",
            board_before: "
.......
.......
.......
.......
.......
.X.X...
            ",
            board_after: "
.......
.......
.......
.......
.......
OX.X...
            ",
            reason: "Block horizontal threat by filling leftmost gap",
        },
        
        // Option 2: Block middle  
        AITestCase {
            name: "Bottom Row Block Middle",
            board_before: "
.......
.......
.......
.......
.......
.X.X...
            ",
            board_after: "
.......
.......
.......
.......
.......
.XOX...
            ",
            reason: "Block horizontal threat by filling middle gap",
        },
        
        // Option 3: Block right
        AITestCase {
            name: "Bottom Row Block Right", 
            board_before: "
.......
.......
.......
.......
.......
.X.X...
            ",
            board_after: "
.......
.......
.......
.......
.......
.X.XO..
            ",
            reason: "Block horizontal threat by filling rightmost gap",
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::test_data::{parse_board_from_ascii, extract_move_from_boards};
    use crate::ai::Connect4AI;
    
    #[test] 
    fn test_connect4_actual_dotted_scenario() {
        // Create a true .X.X. scenario (yellow stones with gaps)
        let board_before = "
.......
.......
.......
.......
.......
.O.O...
        ";
        
        // Parse the board and debug the state
        let (game, current_player) = parse_board_from_ascii(board_before).unwrap();
        
        println!("Current player: {:?}", current_player);
        
        // Print the actual board state for debugging
        for row in 0..6 {
            for col in 0..7 {
                let cell = game.get_cell(row, col);
                match cell {
                    0 => print!("."),
                    1 => print!("X"), // Yellow/Human
                    2 => print!("O"), // Red/AI  
                    _ => print!("?"),
                }
            }
            println!();
        }
        
        // Get AI move
        let ai = Connect4AI::new();
        let ai_move = ai.get_best_move(&game).unwrap();
        
        println!("AI chose column: {}", ai_move);
        
        // The board should show .O.O... (Red stones at 1,3 with gaps at 0,2,4)
        // Current player should be Yellow (Human), so we expect:
        // - Red stones at (5,1) and (5,3) 
        // - Valid blocking moves: columns 0, 2, 4
        
        assert_eq!(game.get_cell(5, 0), 0, "Position (5,0) should be empty");
        assert_eq!(game.get_cell(5, 1), 2, "Position (5,1) has Red stone");
        assert_eq!(game.get_cell(5, 2), 0, "Position (5,2) should be empty");
        assert_eq!(game.get_cell(5, 3), 2, "Position (5,3) has Red stone");
        assert_eq!(game.get_cell(5, 4), 0, "Position (5,4) should be empty");
        
        // Valid blocking moves for Yellow: columns 0, 2, 4
        let valid_columns = vec![0, 2, 4];
        assert!(
            valid_columns.contains(&ai_move),
            "AI should choose column 0, 2, or 4 to block .O.O., but chose {}",
            ai_move
        );
        
        println!("✓ Connect4 AI successfully blocked .O.O. pattern with column {}", ai_move);
    }
    
    #[test]
    fn test_all_three_blocking_positions() {
        let test_cases = get_connect4_multi_test_cases();
        
        for test_case in &test_cases {
            // Verify each test case extracts the correct move
            let move_result = extract_move_from_boards(
                test_case.board_before,
                test_case.board_after
            );
            
            assert!(move_result.is_ok(), "Should extract move for {}", test_case.name);
            let column = move_result.unwrap();
            
            match test_case.name {
                "Bottom Row Block Left" => assert_eq!(column, 0),
                "Bottom Row Block Middle" => assert_eq!(column, 2), 
                "Bottom Row Block Right" => assert_eq!(column, 4),
                _ => panic!("Unexpected test case name"),
            }
            
            println!("✓ {}: Column {}", test_case.name, column);
        }
    }
}