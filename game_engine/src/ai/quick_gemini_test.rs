/// Quick test to see which Gemini test cases work
use crate::ai::gemini_gomoku_tests::get_gemini_gomoku_test_cases;
use crate::ai::gomoku_test_data::{parse_gomoku_ascii_to_boards, extract_gomoku_move_from_boards};

#[cfg(test)]
#[test]
fn test_quick_gemini_validation() {
    let test_cases = get_gemini_gomoku_test_cases();
    println!("Testing {} Gemini test cases:", test_cases.len());
    
    for (i, test_case) in test_cases.iter().enumerate() {
        print!("{}. {}: ", i + 1, test_case.name);
        
        // Check basic parsing
        let before_parse = parse_gomoku_ascii_to_boards(test_case.board_before);
        let after_parse = parse_gomoku_ascii_to_boards(test_case.board_after);
        
        if before_parse.is_err() || after_parse.is_err() {
            println!("❌ Parse Error");
            continue;
        }
        
        // Check move extraction
        let move_extraction = extract_gomoku_move_from_boards(
            test_case.board_before,
            test_case.board_after
        );
        
        if move_extraction.is_err() {
            println!("❌ Move Extraction Error");
            continue;
        }
        
        let (before_black, before_white) = before_parse.unwrap();
        let (after_black, after_white) = after_parse.unwrap();
        
        let before_total = before_black.count_set_bits() + before_white.count_set_bits();
        let after_total = after_black.count_set_bits() + after_white.count_set_bits();
        
        if after_total != before_total + 1 {
            println!("❌ Stone Count Error ({} -> {})", before_total, after_total);
            continue;
        }
        
        let (row, col) = move_extraction.unwrap();
        println!("✅ Valid (move at {}, {})", row, col);
    }
}