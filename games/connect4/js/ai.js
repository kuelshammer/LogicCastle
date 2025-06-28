// Connect4 AI Implementation
class Connect4AI {
  
  // Get best move for AI player
  static getBestMove(game, difficulty = 3) {
    const validMoves = game.getValidMoves();
    
    if (validMoves.length === 0) {
      return -1;
    }
    
    // For easy difficulty, make more random moves
    if (difficulty === 1) {
      return this.getEasyMove(game, validMoves);
    }
    
    // For medium and hard difficulty, use minimax
    const depth = Math.min(difficulty * 2, 8); // Limit depth for performance
    return this.getBestMoveMinimax(game, depth);
  }
  
  // Easy AI - mix of random and basic strategy
  static getEasyMove(game, validMoves) {
    // 30% chance to make optimal move, 70% random
    if (Math.random() < 0.3) {
      return this.getBestMoveMinimax(game, 2);
    }
    
    // Random move from valid moves
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
  
  // Minimax algorithm implementation
  static getBestMoveMinimax(game, depth) {
    const validMoves = game.getValidMoves();
    let bestScore = -Infinity;
    let bestMove = validMoves[0];
    const isMaximizing = true; // AI is maximizing player
    
    for (const move of validMoves) {
      // Create a copy of the game to simulate move
      const score = this.simulateMove(game, move, depth - 1, -Infinity, Infinity, !isMaximizing);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  // Simulate a move and return its evaluation score
  static simulateMove(game, col, depth, alpha, beta, isMaximizing) {
    // Create temporary game state
    const board = game.getBoard();
    const currentPlayer = game.getCurrentPlayer();
    
    // Simulate the move
    const tempBoard = [...board];
    const dropRow = this.getDropRowForBoard(tempBoard, col);
    
    if (dropRow === -1) {
      return isMaximizing ? -1000 : 1000; // Invalid move penalty
    }
    
    tempBoard[dropRow * 7 + col] = currentPlayer;
    
    // Check if this move wins the game
    const winner = this.checkWinForBoard(tempBoard, dropRow, col, currentPlayer);
    if (winner === Player.Red) { // AI wins
      return 1000 + depth; // Prefer quicker wins
    } else if (winner === Player.Yellow) { // Human wins
      return -1000 - depth; // Avoid quicker losses
    }
    
    // Check if board is full (draw)
    if (!tempBoard.includes(0)) {
      return 0;
    }
    
    // Base case: reached maximum depth
    if (depth === 0) {
      return this.evaluateBoard(tempBoard);
    }
    
    // Recursive minimax with alpha-beta pruning
    const validMoves = this.getValidMovesForBoard(tempBoard);
    const nextPlayer = currentPlayer === Player.Yellow ? Player.Red : Player.Yellow;
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of validMoves) {
        const eval = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of validMoves) {
        const eval = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      return minEval;
    }
  }
  
  // Simulate move for a board array
  static simulateMoveForBoard(board, col, player, depth, alpha, beta, isMaximizing) {
    const tempBoard = [...board];
    const dropRow = this.getDropRowForBoard(tempBoard, col);
    
    if (dropRow === -1) {
      return isMaximizing ? -1000 : 1000;
    }
    
    tempBoard[dropRow * 7 + col] = player;
    
    // Check win condition
    const winner = this.checkWinForBoard(tempBoard, dropRow, col, player);
    if (winner === Player.Red) {
      return 1000 + depth;
    } else if (winner === Player.Yellow) {
      return -1000 - depth;
    }
    
    if (!tempBoard.includes(0) || depth === 0) {
      return this.evaluateBoard(tempBoard);
    }
    
    const validMoves = this.getValidMovesForBoard(tempBoard);
    const nextPlayer = player === Player.Yellow ? Player.Red : Player.Yellow;
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of validMoves) {
        const eval = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of validMoves) {
        const eval = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
  
  // Evaluate board position
  static evaluateBoard(board) {
    let score = 0;
    
    // Evaluate all possible 4-in-a-row combinations
    // Horizontal
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const window = [
          board[row * 7 + col],
          board[row * 7 + col + 1],
          board[row * 7 + col + 2],
          board[row * 7 + col + 3]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Vertical
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row < 3; row++) {
        const window = [
          board[row * 7 + col],
          board[(row + 1) * 7 + col],
          board[(row + 2) * 7 + col],
          board[(row + 3) * 7 + col]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Diagonal (positive slope)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const window = [
          board[row * 7 + col],
          board[(row + 1) * 7 + col + 1],
          board[(row + 2) * 7 + col + 2],
          board[(row + 3) * 7 + col + 3]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Diagonal (negative slope)
    for (let row = 3; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const window = [
          board[row * 7 + col],
          board[(row - 1) * 7 + col + 1],
          board[(row - 2) * 7 + col + 2],
          board[(row - 3) * 7 + col + 3]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Bonus for center column control
    const centerCol = 3;
    for (let row = 0; row < 6; row++) {
      if (board[row * 7 + centerCol] === Player.Red) {
        score += 3;
      } else if (board[row * 7 + centerCol] === Player.Yellow) {
        score -= 3;
      }
    }
    
    return score;
  }
  
  // Evaluate a 4-piece window
  static evaluateWindow(window) {
    let score = 0;
    const aiPieces = window.filter(cell => cell === Player.Red).length;
    const humanPieces = window.filter(cell => cell === Player.Yellow).length;
    const empty = window.filter(cell => cell === 0).length;
    
    // AI scoring
    if (aiPieces === 4) {
      score += 100;
    } else if (aiPieces === 3 && empty === 1) {
      score += 10;
    } else if (aiPieces === 2 && empty === 2) {
      score += 2;
    }
    
    // Human blocking
    if (humanPieces === 4) {
      score -= 100;
    } else if (humanPieces === 3 && empty === 1) {
      score -= 15; // Prioritize blocking human threats
    } else if (humanPieces === 2 && empty === 2) {
      score -= 3;
    }
    
    return score;
  }
  
  // Get valid moves for a board array
  static getValidMovesForBoard(board) {
    const validMoves = [];
    for (let col = 0; col < 7; col++) {
      if (board[col] === 0) { // Top row is empty
        validMoves.push(col);
      }
    }
    return validMoves;
  }
  
  // Get drop row for a board array
  static getDropRowForBoard(board, col) {
    if (col < 0 || col >= 7) return -1;
    
    for (let row = 5; row >= 0; row--) {
      if (board[row * 7 + col] === 0) {
        return row;
      }
    }
    return -1; // Column is full
  }
  
  // Check win condition for a board array
  static checkWinForBoard(board, row, col, player) {
    // Check horizontal
    let count = 1;
    
    // Check left
    for (let c = col - 1; c >= 0 && board[row * 7 + c] === player; c--) {
      count++;
    }
    
    // Check right
    for (let c = col + 1; c < 7 && board[row * 7 + c] === player; c++) {
      count++;
    }
    
    if (count >= 4) return player;
    
    // Check vertical
    count = 1;
    
    // Check down
    for (let r = row + 1; r < 6 && board[r * 7 + col] === player; r++) {
      count++;
    }
    
    if (count >= 4) return player;
    
    // Check diagonal (positive slope)
    count = 1;
    
    // Check down-left
    for (let r = row + 1, c = col - 1; r < 6 && c >= 0 && board[r * 7 + c] === player; r++, c--) {
      count++;
    }
    
    // Check up-right
    for (let r = row - 1, c = col + 1; r >= 0 && c < 7 && board[r * 7 + c] === player; r--, c++) {
      count++;
    }
    
    if (count >= 4) return player;
    
    // Check diagonal (negative slope)
    count = 1;
    
    // Check down-right
    for (let r = row + 1, c = col + 1; r < 6 && c < 7 && board[r * 7 + c] === player; r++, c++) {
      count++;
    }
    
    // Check up-left
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r * 7 + c] === player; r--, c--) {
      count++;
    }
    
    if (count >= 4) return player;
    
    return null; // No win
  }
  
  // Get strategic move priorities
  static getMoveOrder() {
    // Prioritize center columns for better strategic positions
    return [3, 2, 4, 1, 5, 0, 6];
  }
  
  // Check if move creates immediate threat
  static createsThreat(board, col, player) {
    const dropRow = this.getDropRowForBoard(board, col);
    if (dropRow === -1) return false;
    
    const tempBoard = [...board];
    tempBoard[dropRow * 7 + col] = player;
    
    // Check if this creates a winning threat (3 in a row with open space)
    return this.hasThreatsAfterMove(tempBoard, dropRow, col, player);
  }
  
  // Check if position has threats after a move
  static hasThreatsAfterMove(board, row, col, player) {
    // This would implement threat detection logic
    // For now, simplified version
    return false;
  }
  
  // Get threat level of a position
  static getThreatLevel(board, player) {
    let threats = 0;
    
    // Count potential 4-in-a-row opportunities
    // This is a simplified version - full implementation would be more complex
    
    return threats;
  }
}

// Export for use in UI
window.Connect4AI = Connect4AI;