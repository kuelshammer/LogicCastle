
# LogicCastle Rust Engine Analysis

This document outlines the structure and design of the Rust-based game engine in the `LogicCastle` project. The engine is designed to support multiple logic games, including Connect4, Gobang, and Trio.

There are two distinct implementations available in the `game_engine/src/` directory:

1.  `lib.rs`: The main, flexible implementation.
2.  `lib_alternative.rs`: A highly optimized, memory-efficient alternative implementation.

## Main Implementation (`lib.rs`)

This implementation prioritizes flexibility and ease of use.

### Key Structs:

*   **`Game`**: A unified struct to manage the state of any game. It's configured at runtime with parameters like board size, win condition, and gravity.
*   **`Board`**: Represents the game board using a `Vec<i8>`, where `0` is empty, `1` is Player 1, and `2` is Player 2.
*   **`Player`**: An enum representing the two players (`Yellow` and `Red`).
*   **`TrioGame`**: A dedicated struct for the game Trio, handling its unique number-based logic.

### Features:

*   **Dynamic Configuration**: Game rules and board dimensions can be set dynamically when creating a `Game` instance.
*   **Gravity Support**: A `gravity_enabled` flag to handle games like Connect4.
*   **WASM-Friendly API**: Functions are exposed to JavaScript using `#[wasm_bindgen]`, with clear error handling.
*   **AI-Ready**: Includes functions for game state evaluation (`evaluate_position`), move simulation (`simulate_move_connect4`), and legal move generation, which are essential for building AI opponents.

## Alternative Implementation (`lib_alternative.rs`)

This implementation prioritizes performance and memory efficiency, making it suitable for AI training and resource-constrained environments.

### Key Concepts & Structs:

*   **Bit-Packing (`FixedBoard`)**: The game board is stored in a bit-packed array, using only 2 bits per cell. This dramatically reduces memory usage.
*   **Const Generics**: Board dimensions are set at compile time using `const generics` (`FixedBoard<const ROWS: usize, const COLS: usize>`), which allows for significant compiler optimizations and zero-cost abstractions.
*   **Specialized Structs**:
    *   `Connect4Game`: A specialized, highly optimized implementation for Connect4.
    *   `DynamicGame`: A more flexible fallback for other games like Gobang.
*   **Builder Pattern (`GameBuilder`)**: Provides a safe and readable way to construct game instances with different configurations.
*   **Optimized Win Detection**: Win checking is performed only around the last move, making it much faster than a full board scan.
*   **Zero-Allocation**: Many operations, like move validation, are designed to avoid memory allocations.
*   **Serialization**: Includes compact serialization and deserialization functions, ideal for saving game states for AI training.
*   **`GameFactory`**: A factory pattern to easily create instances of different game types.

## Game-Specific Logic

### Connect4

*   **`lib.rs`**: Handled by the `Game` struct with `gravity_enabled = true`.
*   **`lib_alternative.rs`**: Handled by the specialized `Connect4Game` struct for maximum performance.

### Gobang

*   **`lib.rs`**: Handled by the `Game` struct with `gravity_enabled = false` and a larger board size.
*   **`lib_alternative.rs`**: Handled by the `DynamicGame` struct, configured via the `GameBuilder`.

### Trio

*   **`lib.rs`**: Has a dedicated `TrioGame` struct that manages the number grid and combination checking.
*   **`lib_alternative.rs`**: Does not have a specific implementation for Trio. The `DynamicGame` could potentially be adapted, but it's not a direct fit for Trio's number-based mechanics.

## Summary

The `LogicCastle` project contains two distinct Rust game engine implementations, each with different trade-offs:

*   Use **`lib.rs`** for flexibility, rapid prototyping, and when a single, unified game object is desirable.
*   Use **`lib_alternative.rs`** for performance-critical applications, especially AI development, where memory and speed are paramount.

The presence of both implementations suggests a development process that started with a flexible prototype and later evolved to include a highly optimized version for more demanding use cases.
