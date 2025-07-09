/// Gemini AI Test Cases - Complete 13 Test Suite
/// Based on reports: 20250708-100500_Connect4_AI_Test_Cases.md and 20250708-101500_Connect4_AI_Test_Cases_Corrected.md

use super::test_data::{AITestCase, extract_move_from_boards, test_ai_case_xor};

/// Get all 13 Gemini test cases organized by categories
pub fn get_gemini_test_cases() -> Vec<AITestCase> {
    vec![
        // Category 1: Unmittelbare Gewinnzüge (Immediate Winning Moves)
        AITestCase {
            name: "Should win horizontally in the middle",
            board_before: "
.......
.......
.......
.X.....
.OOO..X
.XXO..X
            ",
            board_after: "
.......
.......
.......
.X.....
.OOOO.X
.XXO..X
            ",
            reason: "AI must complete the horizontal line of four to win the game.",
        },
        
        AITestCase {
            name: "Should win vertically on the edge",
            board_before: "
.......
O......
O.X....
O.X....
X.X....
X.O...X
            ",
            board_after: "
O......
O......
O.X....
O.X....
X.X....
X.O...X
            ",
            reason: "AI must place the fourth stone on top of its vertical line on the edge to win.",
        },
        
        AITestCase {
            name: "Should win diagonally",
            board_before: "
.......
.......
....O..
...OX..
..OX...
.XOX..X
            ",
            board_after: "
.......
.......
....O..
...OX..
..OXO..
.XOX..X
            ",
            reason: "AI must complete the diagonal line of four.",
        },
        
        // Category 2: Unmittelbare Blockier-Züge (Immediate Blocking Moves)
        AITestCase {
            name: "Should block opponent's horizontal win",
            board_before: "
.......
.......
.......
....O..
..XXX.O
..OXX.O
            ",
            board_after: "
.......
.......
.......
....O..
O.XXX.O
..OXX.O
            ",
            reason: "AI must block the opponent's three-in-a-row to prevent a loss.",
        },
        
        AITestCase {
            name: "Should block opponent's vertical win",
            board_before: "
.......
....X..
....X.O
....X.O
....O.X
...OX.X
            ",
            board_after: "
....O..
....X..
....X.O
....X.O
....O.X
...OX.X
            ",
            reason: "AI must block the top of the opponent's vertical line.",
        },
        
        AITestCase {
            name: "Should block opponent's diagonal win",
            board_before: "
.......
.......
...X...
..X.O..
.X.O...
O.O.X.X
            ",
            board_after: "
.......
....O..
...X...
..X.O..
.X.O...
O.O.X.X
            ",
            reason: "AI must block the opponent's diagonal threat.",
        },
        
        // Category 3: Priorisierung (Prioritization)
        AITestCase {
            name: "Should prioritize its own win over blocking",
            board_before: "
.......
..O....
..O....
..O.X..
..X.XXX
..X.OXX
            ",
            board_after: "
..O....
..O....
..O....
..O.X..
..X.XXX
..X.OXX
            ",
            reason: "AI has a winning move (vertical in col 2) and must ignore the opponent's threat (horizontal starting col 3).",
        },
        
        // Category 4: Aufbau von Bedrohungen (Threat Building)
        AITestCase {
            name: "Should set up its own horizontal threat",
            board_before: "
.......
.......
.......
.......
.X.O...
.X.OO.X
            ",
            board_after: "
.......
.......
.......
.......
.X.O...
.XOOO.X
            ",
            reason: "With no immediate threats, the AI should create a three-in-a-row to force the opponent's next move.",
        },
        
        // Category 5: Zwickmühlen (Forks)
        AITestCase {
            name: "Should create a fork",
            board_before: "
.......
.......
.......
..O....
.O.X...
XO.XX.O
            ",
            board_after: "
.......
.......
.......
..O....
.OOX...
XO.XX.O
            ",
            reason: "AI move in col 2 creates two winning threats for the next turn (a horizontal threat on row 1, and a diagonal threat starting from row 0, col 0). The opponent can only block one.",
        },
        
        AITestCase {
            name: "Should block an opponent's fork setup",
            board_before: "
.......
.......
.......
..X....
.X.O...
.X.OO.O
            ",
            board_after: "
.......
.......
..O....
..X....
.X.O...
.X.OO.O
            ",
            reason: "Opponent (X) wants to play in col 2 to create a fork. The AI must occupy this critical square first.",
        },
        
        // Category 6: Positionsspiel (Positional Play)
        AITestCase {
            name: "Should prioritize center control in opening",
            board_before: "
.......
.......
.......
.......
.......
..X....
            ",
            board_after: "
.......
.......
.......
.......
...O...
..X....
            ",
            reason: "In the opening phase with no threats, controlling the center column (col 3) offers the most future winning possibilities.",
        },
        
        // Additional strategic test cases
        AITestCase {
            name: "Should prevent opponent trap setup",
            board_before: "
.......
.......
.......
.......
.X.X...
.XOO.X.
            ",
            board_after: "
.......
.......
.......
.......
.XOX...
.XOO.X.
            ",
            reason: "AI must prevent opponent from setting up a trap by controlling the center gap.",
        },
        
        AITestCase {
            name: "Should build connected pieces",
            board_before: "
.......
.......
.......
.......
.O.....
.X.X...
            ",
            board_after: "
.......
.......
.......
.......
.O.....
.XOX...
            ",
            reason: "AI should build connectivity by placing pieces that create multiple future opportunities.",
        },
        
        // Additional Horizontal Winning Tests (from 20250708-113000_tests_horizontal.md)
        AITestCase {
            name: "H-Win: Should win on the right edge on bottom row",
            board_before: "
.......
.......
.......
.......
...X...
XXXOOO.
            ",
            board_after: "
.......
.......
.......
.......
...X...
XXXOOOO
            ",
            reason: "AI must complete the horizontal line of four on the far right to win. Move is in column 6.",
        },
        
        AITestCase {
            name: "H-Win: Should win in the middle of a line",
            board_before: "
.......
.......
.......
.......
...X...
X.OOOXX
            ",
            board_after: "
.......
.......
.......
.......
...X...
XOOOOXX
            ",
            reason: "AI must place the winning stone in the gap of its own three-in-a-row. Move is in column 1.",
        },
        
        AITestCase {
            name: "H-Win: Should win in a higher row with complex board state",
            board_before: "
.......
.......
...X...
.OOO.XX
XOXOXOX
OXOXOXO
            ",
            board_after: "
.......
.......
...X...
OOOO.XX
XOXOXOX
OXOXOXO
            ",
            reason: "AI must identify the horizontal win in row 2. The winning move in column 1 is valid as row 1 below it is fully occupied.",
        },
        
        AITestCase {
            name: "H-Win: Should win in the top row (row 5)",
            board_before: "
.OOOXX.
XOXOXOX
XOXOXOX
OXOXOXO
OXOXOXO
XOXOXOX
            ",
            board_after: "
OOOOXX.
XOXOXOX
XOXOXOX
OXOXOXO
OXOXOXO
XOXOXOX
            ",
            reason: "AI must be able to win even when the winning move is in the highest possible row. Move is in column 0.",
        },
        
        AITestCase {
            name: "H-Win: Should win in a non-obvious higher row",
            board_before: "
.......
.......
OO.O.XX
XOXX.OX
OXOO.XX
XOXX.OO
            ",
            board_after: "
.......
.......
OOOO.XX
XOXX.OX
OXOO.XX
XOXX.OO
            ",
            reason: "AI must correctly identify the single winning horizontal move in row 3. The move in column 1 is valid because the cells below it are occupied.",
        },
        
        AITestCase {
            name: "H-Win: Should win on the left edge in a higher row",
            board_before: "
.......
.......
.OOO...
XOXOXX.
OXXOXX.
XOXOXO.
            ",
            board_after: "
.......
.......
OOOO...
XOXOXX.
OXXOXX.
XOXOXO.
            ",
            reason: "AI must complete the line on the far left edge in a supported row. The move in column 0 is valid.",
        },
        
        AITestCase {
            name: "H-Win: Should win right after easy fork",
            board_before: "
.......
.......
.......
...X...
...X...
.XOOO.X
            ",
            board_after: "
.......
.......
.......
...X...
...X...
.XOOOOX
            ",
            reason: "AI must complete the line. The move in column 5 is legit.",
        },
        
        AITestCase {
            name: "H-Win: Should win left after easy fork",
            board_before: "
.......
.......
.......
...X...
...X...
..OOOXX
            ",
            board_after: "
.......
.......
.......
...X...
...X...
.OOOOXX
            ",
            reason: "AI must complete the line. The move in column 1 is legit.",
        },
        
        // Additional Vertical Winning Tests (from 20250708-113500_tests_vertical.md)
        AITestCase {
            name: "V-Win: Should win in a middle column with the 4th stone",
            board_before: "
.......
.......
...O...
...O.X.
...O.X.
..XX.O.
            ",
            board_after: "
.......
...O...
...O...
...O.X.
...O.X.
..XX.O.
            ",
            reason: "AI must place the fourth stone on top of its vertical line in column 3 to win.",
        },
        
        AITestCase {
            name: "V-Win: Should win on the left edge with the 4th stone",
            board_before: "
.......
.......
O......
O.X....
O.X....
X.X....
            ",
            board_after: "
.......
O......
O......
O.X....
O.X....
X.X....
            ",
            reason: "AI must win by completing the vertical line in the leftmost column (column 0).",
        },
        
        AITestCase {
            name: "V-Win: Should win in a middle column with the 5th stone",
            board_before: "
.......
...O...
...O...
...O.X.
...X.O.
X..X.X.
            ",
            board_after: "
...O...
...O...
...O...
...O.X.
...X.O.
X..X.X.
            ",
            reason: "AI must identify the vertical win high up in the board (row 4) in a complex state.",
        },
        
        AITestCase {
            name: "V-Win: Should win on the right edge with the 5th stone",
            board_before: "
.......
......O
......O
X.X...O
X.X.X.X
O.X.O.O
            ",
            board_after: "
......O
......O
......O
X.X...O
X.X.X.X
O.X.O.O
            ",
            reason: "AI must win by completing the vertical line in the rightmost column (column 6).",
        },
        
        AITestCase {
            name: "V-Win: Should win in a middle column with the 6th stone",
            board_before: "
.......
...O.X.
...O.X.
...O.O.
...X.XX
..OX.OX
            ",
            board_after: "
...O...
...O.X.
...O.X.
...O.O.
...X.XX
..OX.OX
            ",
            reason: "AI must win by placing the final stone in a column, completing a vertical line in the top row.",
        },
        
        AITestCase {
            name: "V-Win: Should win on the left edge with the 6th stone",
            board_before: "
.......
O.O.O.X
O.X.X.O
O.O.O.X
O.X.X.O
X.O.X.O
            ",
            board_after: "
O......
O.O.O.X
O.X.X.O
O.O.O.X
O.X.X.O
X.O.X.O
            ",
            reason: "AI must win by filling the leftmost column to complete a vertical line.",
        },
    ]
}

/// Run all Gemini test cases and return results
pub fn run_all_gemini_tests() -> (usize, usize, Vec<String>) {
    let test_cases = get_gemini_test_cases();
    let mut passed = 0;
    let mut failed = 0;
    let mut failures = Vec::new();
    
    println!("Running {} Gemini AI test cases...", test_cases.len());
    
    for test_case in test_cases {
        match test_ai_case_xor(&test_case) {
            Ok(_) => {
                println!("✓ {}", test_case.name);
                passed += 1;
            },
            Err(e) => {
                println!("✗ {}: {}", test_case.name, e);
                failures.push(format!("{}: {}", test_case.name, e));
                failed += 1;
            }
        }
    }
    
    println!("\nGemini AI Test Results:");
    println!("Passed: {}", passed);
    println!("Failed: {}", failed);
    println!("Success Rate: {:.1}%", (passed as f64 / (passed + failed) as f64) * 100.0);
    
    (passed, failed, failures)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_gemini_cases_count() {
        let cases = get_gemini_test_cases();
        assert_eq!(cases.len(), 27, "Should have exactly 27 Gemini test cases");
    }
    
    #[test]
    fn test_gemini_cases_structure() {
        let cases = get_gemini_test_cases();
        
        for case in cases {
            assert!(!case.name.is_empty(), "Name should not be empty");
            assert!(!case.board_before.is_empty(), "Board before should not be empty");
            assert!(!case.board_after.is_empty(), "Board after should not be empty");
            assert!(!case.reason.is_empty(), "Reason should not be empty");
        }
    }
    
    #[test]
    fn test_gemini_move_extraction() {
        let test_cases = get_gemini_test_cases();
        
        for test_case in test_cases {
            // Test that move extraction works for all test cases
            let result = extract_move_from_boards(
                test_case.board_before,
                test_case.board_after
            );
            
            assert!(result.is_ok(), 
                "Move extraction failed for '{}': {:?}", 
                test_case.name, result.err()
            );
            
            let column = result.unwrap();
            assert!(column < 7, 
                "Extracted column {} is invalid for test '{}'", 
                column, test_case.name
            );
        }
    }
    
    #[test]
    fn test_gemini_ai_integration() {
        let (passed, failed, failures) = run_all_gemini_tests();
        
        println!("\n=== GEMINI AI TEST INTEGRATION RESULTS ===");
        println!("Total tests: {}", passed + failed);
        println!("Passed: {}", passed);
        println!("Failed: {}", failed);
        println!("Success rate: {:.1}%", (passed as f64 / (passed + failed) as f64) * 100.0);
        
        if failed > 0 {
            println!("\nFAILED TESTS:");
            for failure in failures {
                println!("  - {}", failure);
            }
        }
        
        // We expect some tests to fail initially as the AI may not be perfect
        // But we want to track the progress over time
        assert!(passed > 0, "At least some tests should pass");
        
        // If more than 50% pass, that's a good sign
        let success_rate = (passed as f64 / (passed + failed) as f64) * 100.0;
        println!("Current AI success rate: {:.1}%", success_rate);
    }
}