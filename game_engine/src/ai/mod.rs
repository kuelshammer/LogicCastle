pub mod connect4_ai;
pub mod pattern_evaluator;
pub mod test_data;
pub mod gemini_test_cases;

pub use connect4_ai::Connect4AI;
pub use pattern_evaluator::PatternEvaluator;
pub use test_data::{AITestCase, parse_board_from_ascii, game_to_ascii, test_ai_case, test_ai_case_xor, parse_ascii_to_boards, extract_move_from_boards};
pub use gemini_test_cases::{get_gemini_test_cases, run_all_gemini_tests};