/**
 * Quick Monte Carlo Test - just a simple bot vs bot game
 */

// Copy the relevant classes from real-bot-matrix-runner.js
class RealConnect4Game {
  constructor() {
    this.ROWS = 6;
    this.COLS = 7;
    this.EMPTY = 0;
    this.PLAYER1 = 1;
    this.PLAYER2 = 2;
    this.board = this.createEmptyBoard();
    this.currentPlayer = this.PLAYER1;
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.winningCells = [];
  }

  createEmptyBoard() {
    const board = [];
    for (let row = 0; row < this.ROWS; row++) {
      board[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        board[row][col] = this.EMPTY;
      }
    }
    return board;
  }

  getValidMoves() {
    const validMoves = [];
    for (let col = 0; col < this.COLS; col++) {
      if (this.board[0][col] === this.EMPTY) {
        validMoves.push(col);
      }
    }
    return validMoves;
  }

  makeMove(col) {
    if (col < 0 || col >= this.COLS || this.board[0][col] !== this.EMPTY) {
      return { success: false, winner: null };
    }

    let row = this.ROWS - 1;
    while (row >= 0 && this.board[row][col] !== this.EMPTY) {
      row--;
    }

    this.board[row][col] = this.currentPlayer;
    this.moveHistory.push({ row, col, player: this.currentPlayer });

    if (this.checkWin(row, col)) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      return { success: true, winner: this.currentPlayer };
    }

    if (this.getValidMoves().length === 0) {
      this.gameOver = true;
      this.winner = null;
      return { success: true, winner: null };
    }

    this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
    return { success: true, winner: null };
  }

  checkWin(row, col) {
    const player = this.board[row][col];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [deltaRow, deltaCol] of directions) {
      let count = 1;

      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + i * deltaRow;
        const c = col + i * deltaCol;
        if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
          count++;
        } else {
          break;
        }
      }

      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - i * deltaRow;
        const c = col - i * deltaCol;
        if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 4) {
        return true;
      }
    }

    return false;
  }
}

// Simple Monte Carlo implementation
class QuickConnect4AI {
  constructor(difficulty) {
    this.difficulty = difficulty;
  }

  getBestMove(game) {
    const validMoves = game.getValidMoves();
    if (validMoves.length === 0) return null;

    if (this.difficulty === 'monte-carlo') {
      return this.getMonteCarloMove(game);
    }
    return this.getDefensiveMove(game);

  }

  getMonteCarloMove(game) {
    const validMoves = game.getValidMoves();
    console.log(`🎯 Monte Carlo evaluating ${validMoves.length} columns: [${validMoves.map(c => c + 1).join(', ')}]`);

    const results = {};
    const simulationsPerColumn = 50;

    for (const col of validMoves) {
      results[col] = { wins: 0, total: 0 };

      for (let i = 0; i < simulationsPerColumn; i++) {
        const result = this.simulateGame(game, col);
        results[col].total++;
        if (result === 'win') {
          results[col].wins++;
        }
      }
    }

    // Select best column
    let bestCol = validMoves[0];
    let bestWinRate = 0;

    for (const col of validMoves) {
      const winRate = results[col].wins / results[col].total;
      console.log(`   Column ${col + 1}: ${Math.round(winRate * 100)}% (${results[col].wins}/${results[col].total})`);

      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestCol = col;
      }
    }

    console.log(`🎯 Monte Carlo selects Column ${bestCol + 1} (${Math.round(bestWinRate * 100)}% win rate)`);
    return bestCol;
  }

  simulateGame(originalGame, startCol) {
    // Create game copy
    const sim = new RealConnect4Game();
    sim.board = originalGame.board.map(row => [...row]);
    sim.currentPlayer = originalGame.currentPlayer;
    sim.gameOver = originalGame.gameOver;
    sim.winner = originalGame.winner;
    sim.moveHistory = [...originalGame.moveHistory];

    // Make first move
    const firstResult = sim.makeMove(startCol);
    if (!firstResult.success) return 'draw';

    const ourPlayer = originalGame.currentPlayer;
    let moves = 1;

    // Continue with random moves
    while (!sim.gameOver && moves < 42) {
      const validMoves = sim.getValidMoves();
      if (validMoves.length === 0) break;

      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      const result = sim.makeMove(randomMove);
      if (!result.success) break;

      moves++;
    }

    if (sim.gameOver && sim.winner === ourPlayer) {
      return 'win';
    }
    return 'loss';

  }

  getDefensiveMove(game) {
    const validMoves = game.getValidMoves();
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
}

// Test Monte Carlo vs Random
console.log('🎯 Quick Monte Carlo Test');
console.log('========================\n');

const game = new RealConnect4Game();
const monteCarlo = new QuickConnect4AI('monte-carlo');
const defensive = new QuickConnect4AI('defensive');

let moveCount = 0;

while (!game.gameOver && moveCount < 20) {
  const currentBot = game.currentPlayer === game.PLAYER1 ? monteCarlo : defensive;
  const botName = game.currentPlayer === game.PLAYER1 ? 'Monte Carlo' : 'Random';

  console.log(`\n${botName} turn:`);
  const move = currentBot.getBestMove(game);

  if (move === null) break;

  const result = game.makeMove(move);
  if (!result.success) break;

  console.log(`${botName} plays Column ${move + 1}`);
  moveCount++;
}

console.log('\n🏆 Game Result:');
if (game.gameOver && game.winner) {
  const winnerName = game.winner === game.PLAYER1 ? 'Monte Carlo' : 'Random';
  console.log(`${winnerName} WINS!`);
} else {
  console.log('DRAW or game incomplete');
}

console.log('\n✅ Monte Carlo integration test complete!');
