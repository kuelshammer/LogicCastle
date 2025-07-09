/* tslint:disable */
/* eslint-disable */
export function main(): void;
/**
 * AI Difficulty levels with corresponding search depths
 * Based on memory analysis: Easy=2, Medium=4, Hard=6
 */
export enum AIDifficulty {
  Easy = 2,
  Medium = 4,
  Hard = 6,
}
export enum GameError {
  OutOfBounds = 0,
  PositionOccupied = 1,
  GameAlreadyOver = 2,
  InvalidPlayer = 3,
  BoardError = 4,
  InvalidMove = 5,
}
/**
 * Game phase enumeration for strategic evaluation
 */
export enum GamePhase {
  Opening = 0,
  Middle = 1,
  Endgame = 2,
}
export enum Player {
  Yellow = 1,
  Red = 2,
}
export enum TrioDifficulty {
  Impossible = 0,
  Hard = 1,
  Medium = 2,
  Easy = 3,
  VeryEasy = 4,
}
export enum TrioDistribution {
  Balanced = 0,
  Educational = 1,
  Challenging = 2,
  Official = 3,
}
export class Board {
  free(): void;
  constructor(rows: number, cols: number);
  get_rows(): number;
  get_cols(): number;
  get_cells(): Int8Array;
  get_cell(row: number, col: number): number;
  set_cell(row: number, col: number, value: number): void;
  is_within_bounds(row: number, col: number): boolean;
  is_full(): boolean;
  /**
   * Check if a column is full (Connect4) - memory efficient check
   */
  is_column_full(col: number): boolean;
  /**
   * Get column height (Connect4) - essential for AI move generation
   */
  column_height(col: number): number;
  /**
   * Fast clone for AI simulations - reuses memory layout
   */
  fast_clone(): Board;
  /**
   * Check if a specific column has available space (for Connect4)
   */
  is_column_available(col: number): boolean;
  /**
   * Get the row where a piece would land in a column (for Connect4)
   */
  get_drop_row(col: number): number | undefined;
}
/**
 * Connect4 AI implementation using Gemini's pattern-based evaluation
 * Implements the "Stratege" layer of the Three-Layer Architecture
 */
export class Connect4AI {
  free(): void;
  constructor();
  /**
   * Create AI with specific difficulty level
   */
  static with_difficulty(difficulty: AIDifficulty): Connect4AI;
  /**
   * Set the AI player (default: Red)
   */
  set_ai_player(player: Player): void;
  /**
   * Set search depth (higher = stronger but slower)
   */
  set_difficulty(depth: number): void;
  /**
   * Set AI difficulty level (Easy/Medium/Hard)
   * This is the preferred way to set AI strength
   */
  set_difficulty_level(difficulty: AIDifficulty): void;
  /**
   * Get current difficulty level
   */
  get_difficulty_level(): AIDifficulty;
  /**
   * Get the best move for the current position
   */
  get_best_move(game: Connect4Game): number | undefined;
  /**
   * Get the best move for a specific player (bidirectional AI)
   * This allows the AI to predict moves for both players
   * Unlike get_best_move, this works regardless of whose turn it is
   */
  get_best_move_for_player(game: Connect4Game, player: Player): number | undefined;
  /**
   * Get the evaluation score for the current position
   */
  evaluate_position(game: Connect4Game): number;
  /**
   * Get a quick move for time-constrained situations
   */
  get_quick_move(game: Connect4Game): number | undefined;
}
/**
 * Connect4 game implementation using the Three-Layer Architecture
 * Composes geometry and data layers for clean separation of concerns
 */
export class Connect4Game {
  free(): void;
  constructor();
  /**
   * Create a new Connect4 game with a specific starting player
   * This is essential for game series where "loser starts next game"
   */
  static new_with_starting_player(starting_player: Player): Connect4Game;
  /**
   * Make a move in the specified column
   */
  make_move(column: number): boolean;
  /**
   * Get cell value at position (0 = empty, 1 = yellow, 2 = red)
   */
  get_cell(row: number, col: number): number;
  /**
   * Get current player
   */
  current_player(): Player;
  /**
   * Get winner (if any)
   */
  winner(): Player | undefined;
  /**
   * Get move count
   */
  move_count(): number;
  /**
   * Check if column is valid for next move
   */
  is_valid_move(column: number): boolean;
  /**
   * Get column height
   */
  get_column_height(column: number): number;
  /**
   * Reset game to initial state
   */
  reset(): void;
  /**
   * Reset game with a specific starting player
   */
  reset_with_starting_player(starting_player: Player): void;
  /**
   * Start a new game series with "loser starts" rule
   * If loser_starts is true, the losing player from the previous game starts the next game
   */
  start_new_series(loser_starts: boolean): void;
  /**
   * Create a hypothetical game state for AI evaluation
   * This allows the AI to evaluate positions regardless of whose turn it is
   */
  create_hypothetical_state(hypothetical_player: Player): Connect4Game;
  /**
   * Get board state as string for debugging
   */
  board_string(): string;
  /**
   * Check if game is draw (board full, no winner)
   */
  is_draw(): boolean;
  /**
   * Check if game is over (win or draw)
   */
  is_game_over(): boolean;
  /**
   * Get AI move suggestion
   */
  get_ai_move(): number | undefined;
  /**
   * Analyze current position comprehensively
   */
  analyze_position(): PositionAnalysis;
  /**
   * Get current game phase for AI strategy
   */
  get_game_phase(): GamePhase;
}
export class Game {
  free(): void;
  constructor(rows: number, cols: number, win_condition: number, gravity_enabled: boolean);
  make_move_connect4_js(col: number): void;
  make_move_gobang_js(row: number, col: number): void;
  check_win(): Player | undefined;
  is_game_over(): boolean;
  get_board(): Int8Array;
  get_current_player(): Player;
  /**
   * Get the starting player for this game
   */
  get_starting_player(): Player;
  /**
   * Set the starting player (for rotation logic)
   */
  set_starting_player(player: Player): void;
  /**
   * Reset game to starting state with optional new starting player
   */
  reset_game(): void;
  /**
   * Reset game with a specific starting player
   */
  reset_game_with_starter(starter: Player): void;
  /**
   * Fast clone for AI simulations - essential for minimax/MCTS
   */
  fast_clone(): Game;
  /**
   * Get legal moves for Connect4 (WASM-friendly, memory efficient)
   */
  get_legal_moves_connect4(): Uint32Array;
  /**
   * Count legal moves efficiently (for quick AI evaluation)
   */
  legal_move_count_connect4(): number;
  /**
   * Simulate a move efficiently (for AI tree search)
   */
  simulate_move_connect4(col: number): Game;
  /**
   * Simulate a move efficiently (WASM-compatible version)
   */
  simulate_move_connect4_js(col: number): Game | undefined;
  /**
   * Check if game is in terminal state (win/draw)
   */
  is_terminal(): boolean;
  /**
   * Advanced position evaluation with strategic scoring
   * Returns: +10000 for current player win, -10000 for opponent win, strategic score otherwise
   */
  evaluate_position(): number;
  /**
   * Simple evaluation for backward compatibility
   */
  evaluate_position_simple(): number;
  /**
   * Advanced evaluation combining multiple strategic factors
   */
  evaluate_position_advanced(): number;
  /**
   * Count immediate threats for a player (winning moves available)
   */
  count_threats(player: Player): number;
  /**
   * Get legal moves for Gobang (returns available positions as (row, col) tuples)
   * Returns a flattened vector where each pair of consecutive elements represents (row, col)
   */
  get_legal_moves_gobang(): Uint32Array;
  /**
   * Simulate a Gobang move without mutating the current game state
   */
  simulate_move_gobang(row: number, col: number): Game;
  /**
   * Get the winner if the game is over, None if it's a draw or ongoing
   */
  get_winner(): Player | undefined;
  /**
   * Get game phase as enum for external use
   */
  get_game_phase(): GamePhase;
  /**
   * Analyze position for threats and opportunities
   */
  analyze_position(): PositionAnalysis;
  /**
   * Detect simple fork threats in bottom row: pattern _ x _ x _ 
   * Returns columns that must be played to prevent opponent fork
   */
  detect_bottom_row_forks(opponent: Player): Uint32Array;
  /**
   * Get fork-blocking moves for current player (prevent opponent forks)
   */
  get_fork_blocking_moves(): Uint32Array;
  /**
   * Check if opponent has dangerous fork patterns that require immediate attention
   */
  has_critical_fork_threats(): boolean;
  /**
   * Detect open three patterns: _ X X X _ (both sides open)
   * Returns flattened positions where placing a piece would create an open three
   * Each pair of consecutive elements represents (row, col)
   */
  detect_open_three(player: Player): Uint32Array;
  /**
   * Detect closed four patterns: O X X X X _ or _ X X X X O (one side blocked)
   * Returns flattened positions where placing a piece would create a closed four
   * Each pair of consecutive elements represents (row, col)
   */
  detect_closed_four(player: Player): Uint32Array;
  /**
   * Detect double three fork patterns (two open threes intersecting)
   * Returns flattened positions that would create a double three fork
   * Each pair of consecutive elements represents (row, col)
   */
  detect_double_three_forks(player: Player): Uint32Array;
  /**
   * Get threat level (0-5) for a potential move
   * 5 = Immediate win, 4 = Must block, 3 = Strong threat, 2 = Medium, 1 = Weak, 0 = None
   */
  get_threat_level(row: number, col: number, player: Player): number;
  /**
   * Get dangerous moves for Gobang (moves that give opponent opportunities)
   * Returns flattened positions - each pair represents (row, col)
   */
  get_dangerous_moves_gobang(): Uint32Array;
  /**
   * Get winning moves for Gobang (immediate 5-in-a-row)
   * Returns flattened positions - each pair represents (row, col)
   */
  get_winning_moves_gobang(): Uint32Array;
  /**
   * Get blocking moves for Gobang (block opponent wins)
   * Returns flattened positions - each pair represents (row, col)
   */
  get_blocking_moves_gobang(): Uint32Array;
}
/**
 * Position analysis structure for AI decision making
 */
export class PositionAnalysis {
  private constructor();
  free(): void;
  /**
   * Get threat advantage (positive = current player has more threats)
   */
  threat_advantage(): number;
  /**
   * Check if position is tactically critical
   */
  is_critical(): boolean;
  /**
   * Get position summary as string for debugging
   */
  summary(): string;
  current_player_threats: number;
  opponent_threats: number;
  total_pieces: number;
  connectivity_score: number;
  game_phase: GamePhase;
  evaluation_score: number;
  readonly get_current_player_threats: number;
  readonly get_opponent_threats: number;
  readonly get_total_pieces: number;
  readonly get_connectivity_score: number;
  readonly get_game_phase: GamePhase;
  readonly get_evaluation_score: number;
}
export class ReachabilityAnalysis {
  private constructor();
  free(): void;
  summary(): string;
  readonly get_reachable_targets: Int16Array;
  readonly get_unreachable_targets: Int16Array;
  readonly get_total_reachable: number;
  readonly get_coverage_percentage: number;
  readonly get_min_reachable: number;
  readonly get_max_reachable: number;
}
export class SolutionAnalysis {
  private constructor();
  free(): void;
  summary(): string;
  readonly get_target: number;
  readonly get_total_solutions: number;
  readonly get_unique_formulas: string[];
  readonly get_add_operations: number;
  readonly get_subtract_operations: number;
  readonly get_difficulty_score: number;
}
export class TrioGame {
  free(): void;
  constructor(difficulty: number);
  get_board(): Int8Array;
  get_target_number(): number;
  check_combination(r1: number, c1: number, r2: number, c2: number, r3: number, c3: number): boolean;
  /**
   * Create new game with specific distribution (WASM-exposed)
   */
  static new_with_distribution_wasm(distribution: TrioDistribution): TrioGame;
  /**
   * Analyze reachable targets (WASM-exposed)
   */
  analyze_reachable_targets_wasm(): ReachabilityAnalysis;
  /**
   * Count solutions for target (WASM-exposed)
   */
  count_solutions_for_target_wasm(target: number): SolutionAnalysis;
  /**
   * Get difficulty category (WASM-exposed)
   */
  categorize_target_difficulty_wasm(target: number): TrioDifficulty;
  /**
   * Perform comprehensive gap analysis for all distributions
   */
  static comprehensive_gap_analysis(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_connect4game_free: (a: number, b: number) => void;
  readonly connect4game_new: () => number;
  readonly connect4game_new_with_starting_player: (a: number) => number;
  readonly connect4game_make_move: (a: number, b: number, c: number) => void;
  readonly connect4game_get_cell: (a: number, b: number, c: number) => number;
  readonly connect4game_current_player: (a: number) => number;
  readonly connect4game_winner: (a: number) => number;
  readonly connect4game_move_count: (a: number) => number;
  readonly connect4game_is_valid_move: (a: number, b: number) => number;
  readonly connect4game_get_column_height: (a: number, b: number) => number;
  readonly connect4game_reset: (a: number) => void;
  readonly connect4game_reset_with_starting_player: (a: number, b: number) => void;
  readonly connect4game_start_new_series: (a: number, b: number) => void;
  readonly connect4game_create_hypothetical_state: (a: number, b: number) => number;
  readonly connect4game_board_string: (a: number, b: number) => void;
  readonly connect4game_is_draw: (a: number) => number;
  readonly connect4game_is_game_over: (a: number) => number;
  readonly connect4game_get_ai_move: (a: number) => number;
  readonly connect4game_analyze_position: (a: number) => number;
  readonly connect4game_get_game_phase: (a: number) => number;
  readonly __wbg_connect4ai_free: (a: number, b: number) => void;
  readonly connect4ai_new: () => number;
  readonly connect4ai_with_difficulty: (a: number) => number;
  readonly connect4ai_set_ai_player: (a: number, b: number) => void;
  readonly connect4ai_set_difficulty: (a: number, b: number) => void;
  readonly connect4ai_set_difficulty_level: (a: number, b: number) => void;
  readonly connect4ai_get_difficulty_level: (a: number) => number;
  readonly connect4ai_get_best_move: (a: number, b: number) => number;
  readonly connect4ai_get_best_move_for_player: (a: number, b: number, c: number) => number;
  readonly connect4ai_evaluate_position: (a: number, b: number) => number;
  readonly connect4ai_get_quick_move: (a: number, b: number) => number;
  readonly main: () => void;
  readonly __wbg_positionanalysis_free: (a: number, b: number) => void;
  readonly __wbg_get_positionanalysis_current_player_threats: (a: number) => number;
  readonly __wbg_set_positionanalysis_current_player_threats: (a: number, b: number) => void;
  readonly __wbg_get_positionanalysis_opponent_threats: (a: number) => number;
  readonly __wbg_set_positionanalysis_opponent_threats: (a: number, b: number) => void;
  readonly __wbg_get_positionanalysis_total_pieces: (a: number) => number;
  readonly __wbg_set_positionanalysis_total_pieces: (a: number, b: number) => void;
  readonly __wbg_get_positionanalysis_connectivity_score: (a: number) => number;
  readonly __wbg_set_positionanalysis_connectivity_score: (a: number, b: number) => void;
  readonly __wbg_get_positionanalysis_game_phase: (a: number) => number;
  readonly __wbg_set_positionanalysis_game_phase: (a: number, b: number) => void;
  readonly __wbg_get_positionanalysis_evaluation_score: (a: number) => number;
  readonly __wbg_set_positionanalysis_evaluation_score: (a: number, b: number) => void;
  readonly positionanalysis_get_current_player_threats: (a: number) => number;
  readonly positionanalysis_get_opponent_threats: (a: number) => number;
  readonly positionanalysis_get_total_pieces: (a: number) => number;
  readonly positionanalysis_get_connectivity_score: (a: number) => number;
  readonly positionanalysis_get_game_phase: (a: number) => number;
  readonly positionanalysis_get_evaluation_score: (a: number) => number;
  readonly positionanalysis_threat_advantage: (a: number) => number;
  readonly positionanalysis_is_critical: (a: number) => number;
  readonly positionanalysis_summary: (a: number, b: number) => void;
  readonly __wbg_board_free: (a: number, b: number) => void;
  readonly board_new: (a: number, b: number) => number;
  readonly board_get_rows: (a: number) => number;
  readonly board_get_cols: (a: number) => number;
  readonly board_get_cells: (a: number, b: number) => void;
  readonly board_get_cell: (a: number, b: number, c: number, d: number) => void;
  readonly board_set_cell: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly board_is_within_bounds: (a: number, b: number, c: number) => number;
  readonly board_is_full: (a: number) => number;
  readonly board_is_column_full: (a: number, b: number) => number;
  readonly board_column_height: (a: number, b: number) => number;
  readonly board_fast_clone: (a: number) => number;
  readonly board_is_column_available: (a: number, b: number) => number;
  readonly board_get_drop_row: (a: number, b: number) => number;
  readonly __wbg_game_free: (a: number, b: number) => void;
  readonly game_new: (a: number, b: number, c: number, d: number) => number;
  readonly game_make_move_connect4_js: (a: number, b: number, c: number) => void;
  readonly game_make_move_gobang_js: (a: number, b: number, c: number, d: number) => void;
  readonly game_check_win: (a: number) => number;
  readonly game_is_game_over: (a: number) => number;
  readonly game_get_board: (a: number, b: number) => void;
  readonly game_get_current_player: (a: number) => number;
  readonly game_get_starting_player: (a: number) => number;
  readonly game_set_starting_player: (a: number, b: number) => void;
  readonly game_reset_game: (a: number) => void;
  readonly game_reset_game_with_starter: (a: number, b: number) => void;
  readonly game_fast_clone: (a: number) => number;
  readonly game_get_legal_moves_connect4: (a: number, b: number) => void;
  readonly game_legal_move_count_connect4: (a: number) => number;
  readonly game_simulate_move_connect4: (a: number, b: number, c: number) => void;
  readonly game_simulate_move_connect4_js: (a: number, b: number) => number;
  readonly game_evaluate_position: (a: number) => number;
  readonly game_evaluate_position_simple: (a: number) => number;
  readonly game_evaluate_position_advanced: (a: number) => number;
  readonly game_count_threats: (a: number, b: number) => number;
  readonly game_get_legal_moves_gobang: (a: number, b: number) => void;
  readonly game_simulate_move_gobang: (a: number, b: number, c: number, d: number) => void;
  readonly game_get_winner: (a: number) => number;
  readonly game_get_game_phase: (a: number) => number;
  readonly game_analyze_position: (a: number) => number;
  readonly game_detect_bottom_row_forks: (a: number, b: number, c: number) => void;
  readonly game_get_fork_blocking_moves: (a: number, b: number) => void;
  readonly game_has_critical_fork_threats: (a: number) => number;
  readonly game_detect_open_three: (a: number, b: number, c: number) => void;
  readonly game_detect_closed_four: (a: number, b: number, c: number) => void;
  readonly game_detect_double_three_forks: (a: number, b: number, c: number) => void;
  readonly game_get_threat_level: (a: number, b: number, c: number, d: number) => number;
  readonly game_get_dangerous_moves_gobang: (a: number, b: number) => void;
  readonly game_get_winning_moves_gobang: (a: number, b: number) => void;
  readonly game_get_blocking_moves_gobang: (a: number, b: number) => void;
  readonly __wbg_triogame_free: (a: number, b: number) => void;
  readonly triogame_new: (a: number) => number;
  readonly triogame_get_board: (a: number, b: number) => void;
  readonly triogame_get_target_number: (a: number) => number;
  readonly triogame_check_combination: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly __wbg_reachabilityanalysis_free: (a: number, b: number) => void;
  readonly reachabilityanalysis_get_reachable_targets: (a: number, b: number) => void;
  readonly reachabilityanalysis_get_unreachable_targets: (a: number, b: number) => void;
  readonly reachabilityanalysis_get_total_reachable: (a: number) => number;
  readonly reachabilityanalysis_get_coverage_percentage: (a: number) => number;
  readonly reachabilityanalysis_get_min_reachable: (a: number) => number;
  readonly reachabilityanalysis_get_max_reachable: (a: number) => number;
  readonly reachabilityanalysis_summary: (a: number, b: number) => void;
  readonly __wbg_solutionanalysis_free: (a: number, b: number) => void;
  readonly solutionanalysis_get_target: (a: number) => number;
  readonly solutionanalysis_get_total_solutions: (a: number) => number;
  readonly solutionanalysis_get_unique_formulas: (a: number, b: number) => void;
  readonly solutionanalysis_get_add_operations: (a: number) => number;
  readonly solutionanalysis_get_subtract_operations: (a: number) => number;
  readonly solutionanalysis_get_difficulty_score: (a: number) => number;
  readonly solutionanalysis_summary: (a: number, b: number) => void;
  readonly triogame_new_with_distribution_wasm: (a: number) => number;
  readonly triogame_analyze_reachable_targets_wasm: (a: number) => number;
  readonly triogame_count_solutions_for_target_wasm: (a: number, b: number) => number;
  readonly triogame_categorize_target_difficulty_wasm: (a: number, b: number) => number;
  readonly triogame_comprehensive_gap_analysis: (a: number) => void;
  readonly game_is_terminal: (a: number) => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
