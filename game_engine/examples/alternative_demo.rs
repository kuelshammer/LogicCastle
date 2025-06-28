// Demo showcasing the alternative implementation features
// Run with: cargo run --example alternative_demo

use game_engine_alternative::*;

fn main() {
    println!("=== Alternative Game Engine Demo ===\n");
    
    // Demo 1: Memory efficiency
    demo_memory_efficiency();
    
    // Demo 2: Builder pattern
    demo_builder_pattern();
    
    // Demo 3: Specialized Connect4
    demo_connect4_game();
    
    // Demo 4: Serialization
    demo_serialization();
    
    // Demo 5: Move generation
    demo_move_generation();
}

fn demo_memory_efficiency() {
    println!("1. Memory Efficiency Demo");
    println!("========================");
    
    let board = FixedBoard::<6, 7>::new();
    println!("Connect4 board (6x7):");
    println!("- Cells: 42");
    println!("- Bits needed: 84 (2 bits per cell)");
    println!("- Bytes used: {} (packed)", board.get_raw_data().len());
    println!("- Memory savings: ~75% vs 42-byte Vec<i8>\n");
    
    // Demo bit packing
    let mut small_board = FixedBoard::<2, 2>::new();
    small_board.set_cell(0, 0, Cell::Player1);
    small_board.set_cell(0, 1, Cell::Player2);
    small_board.set_cell(1, 0, Cell::Player1);
    
    println!("2x2 board state:");
    println!("{}", small_board);
    println!("Raw data: {:?} (1 byte for 4 cells)\n", small_board.get_raw_data());
}

fn demo_builder_pattern() {
    println!("2. Builder Pattern Demo");
    println!("======================");
    
    // Connect4 configuration
    let connect4 = GameBuilder::connect4().build_dynamic();
    println!("Connect4: {}x{}, win={}, gravity={}", 
        connect4.get_dimensions()[0], 
        connect4.get_dimensions()[1], 
        4, true);
    
    // Gobang configuration  
    let gobang = GameBuilder::gobang().build_dynamic();
    println!("Gobang: {}x{}, win={}, gravity={}", 
        gobang.get_dimensions()[0], 
        gobang.get_dimensions()[1], 
        5, false);
    
    // Custom configuration
    let custom = GameBuilder::new()
        .dimensions(10, 8)
        .win_condition(3)
        .gravity(false)
        .build_dynamic();
    
    println!("Custom: {}x{}, win={}, gravity={}\n", 
        custom.get_dimensions()[0], 
        custom.get_dimensions()[1], 
        3, false);
}

fn demo_connect4_game() {
    println!("3. Specialized Connect4 Demo");
    println!("============================");
    
    let mut game = Connect4Game::new();
    println!("Initial state: Player {}", game.get_current_player());
    
    // Make some moves
    let moves = [3, 3, 2, 4, 1, 5, 0]; // Try to set up a win
    for (i, &col) in moves.iter().enumerate() {
        match game.make_move(col) {
            Ok(()) => println!("Move {}: Column {} - Player {}", 
                i+1, col, if i % 2 == 0 { 1 } else { 2 }),
            Err(e) => println!("Move {} failed: {:?}", i+1, e),
        }
        
        if game.is_game_over() {
            println!("Game Over! Winner: Player {}", game.get_winner());
            break;
        }
    }
    
    println!("Final move count: {}\n", game.get_move_count());
}

fn demo_serialization() {
    println!("4. Compact Serialization Demo");
    println!("=============================");
    
    let mut game = Connect4Game::new();
    game.make_move(3).unwrap();
    game.make_move(3).unwrap();
    game.make_move(2).unwrap();
    
    let serialized = game.serialize_for_training();
    println!("Game state serialized to {} bytes", serialized.len());
    println!("Data: {:?}", &serialized[..std::cmp::min(20, serialized.len())]);
    
    // Test round-trip
    if let Some(restored) = Connect4Game::deserialize_from_training(&serialized) {
        println!("Deserialization successful!");
        println!("Move count matches: {}", 
            game.get_move_count() == restored.get_move_count());
        println!("Current player matches: {}", 
            game.get_current_player() == restored.get_current_player());
    }
    println!();
}

fn demo_move_generation() {
    println!("5. Move Generation Demo");
    println!("======================");
    
    let mut game = Connect4Game::new();
    
    println!("Initial valid moves: {:?}", game.generate_valid_moves());
    
    // Fill up column 0
    for i in 0..6 {
        if game.make_move(0).is_ok() {
            println!("Move {}: Filled column 0", i + 1);
            if game.is_game_over() {
                break;
            }
        }
    }
    
    println!("Valid moves after filling column 0: {:?}", game.generate_valid_moves());
    
    // Show game over state
    if game.is_game_over() {
        println!("Game ended - Winner: Player {}", game.get_winner());
    }
    println!();
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_memory_savings() {
        let board = FixedBoard::<6, 7>::new();
        assert!(board.get_raw_data().len() <= 11); // Significant memory savings
    }
    
    #[test]
    fn test_builder_flexibility() {
        let game = GameBuilder::new()
            .dimensions(8, 8)
            .win_condition(4)
            .gravity(false)
            .build_dynamic();
        
        let dims = game.get_dimensions();
        assert_eq!(dims[0], 8);
        assert_eq!(dims[1], 8);
    }
    
    #[test]
    fn test_serialization_efficiency() {
        let mut game = Connect4Game::new();
        game.make_move(3).unwrap();
        
        let serialized = game.serialize_for_training();
        
        // Should be much smaller than naive serialization
        assert!(serialized.len() < 50); // Original would be ~45+ bytes
        
        let restored = Connect4Game::deserialize_from_training(&serialized);
        assert!(restored.is_some());
    }
}