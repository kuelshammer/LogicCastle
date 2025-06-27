import init, { Game, Player } from './pkg/rust_logic.js';

async function run() {
    await init();

    console.log("Starting a new Connect4 game...");
    const game = new Game(6, 7, 4, true); // 6 rows, 7 cols, win 4, gravity enabled

    console.log("Initial board:");
    printBoard(game.get_board(), game.rows, game.cols);

    // Simulate a few moves
    console.log("\nMaking moves...");
    try {
        game.make_move_js(0); // Yellow
        printBoard(game.get_board(), game.rows, game.cols);
        game.make_move_js(1); // Red
        printBoard(game.get_board(), game.rows, game.cols);
        game.make_move_js(0); // Yellow
        printBoard(game.get_board(), game.rows, game.cols);
        game.make_move_js(1); // Red
        printBoard(game.get_board(), game.rows, game.cols);
        game.make_move_js(0); // Yellow
        printBoard(game.get_board(), game.rows, game.cols);
        game.make_move_js(1); // Red
        printBoard(game.get_board(), game.rows, game.cols);

        // Try an invalid move
        console.log("\nTrying an invalid move (column out of bounds):");
        game.make_move_js(7); // Should fail
    } catch (e) {
        console.error("Error making move:", e.message);
    }

    console.log("\nFinal board state:");
    printBoard(game.get_board(), game.rows, game.cols);
    console.log("Is game over?", game.is_game_over());
    console.log("Current player:", game.get_current_player() === Player.Yellow ? "Yellow" : "Red");
}

function printBoard(board, rows, cols) {
    for (let r = 0; r < rows; r++) {
        let rowStr = "";
        for (let c = 0; c < cols; c++) {
            const playerVal = board[r * cols + c];
            if (playerVal === Player.Yellow) {
                rowStr += " Y ";
            } else if (playerVal === Player.Red) {
                rowStr += " R ";
            } else {
                rowStr += " . ";
            }
        }
        console.log(rowStr);
    }
}

run();