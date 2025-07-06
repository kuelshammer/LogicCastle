// Connect4 AI Implementation
import { CoordUtils } from '../../../assets/js/coord-utils.js';

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
    
    tempBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = currentPlayer;
    
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
        const evaluation = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break; // Alpha-beta pruning
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of validMoves) {
        const evaluation = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
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
    
    tempBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = player;
    
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
        const evaluation = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of validMoves) {
        const evaluation = this.simulateMoveForBoard(tempBoard, move, nextPlayer, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
  
  // Enhanced board evaluation with strategic patterns
  static evaluateBoard(board) {
    let score = 0;
    
    // Evaluate all possible 4-in-a-row combinations
    // Horizontal
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const window = [
          board[CoordUtils.gridToIndex(row, col, 7)],
          board[CoordUtils.gridToIndex(row, col + 1, 7)],
          board[CoordUtils.gridToIndex(row, col + 2, 7)],
          board[CoordUtils.gridToIndex(row, col + 3, 7)]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Vertical
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row < 3; row++) {
        const window = [
          board[CoordUtils.gridToIndex(row, col, 7)],
          board[CoordUtils.gridToIndex(row + 1, col, 7)],
          board[CoordUtils.gridToIndex(row + 2, col, 7)],
          board[CoordUtils.gridToIndex(row + 3, col, 7)]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Diagonal (positive slope)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const window = [
          board[CoordUtils.gridToIndex(row, col, 7)],
          board[CoordUtils.gridToIndex(row + 1, col + 1, 7)],
          board[CoordUtils.gridToIndex(row + 2, col + 2, 7)],
          board[CoordUtils.gridToIndex(row + 3, col + 3, 7)]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Diagonal (negative slope)
    for (let row = 3; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const window = [
          board[CoordUtils.gridToIndex(row, col, 7)],
          board[CoordUtils.gridToIndex(row - 1, col + 1, 7)],
          board[CoordUtils.gridToIndex(row - 2, col + 2, 7)],
          board[CoordUtils.gridToIndex(row - 3, col + 3, 7)]
        ];
        score += this.evaluateWindow(window);
      }
    }
    
    // Enhanced center column control with positional bonuses
    score += this.evaluateCenterControl(board);
    
    // Strategic pattern recognition
    score += this.evaluateStrategicPatterns(board);
    
    // Fork and multiple threat detection
    score += this.evaluateForkOpportunities(board);
    
    // Positional advantages
    score += this.evaluatePositionalAdvantages(board);
    
    return score;
  }
  
  // Enhanced center control evaluation
  static evaluateCenterControl(board) {
    let score = 0;
    const centerCol = 3;
    
    // Higher value for center pieces based on position
    for (let row = 0; row < 6; row++) {
      const cellValue = board[CoordUtils.gridToIndex(row, centerCol, 7)];
      if (cellValue === Player.Red) {
        // Lower pieces in center are more valuable
        score += (6 - row) * 2;
      } else if (cellValue === Player.Yellow) {
        score -= (6 - row) * 2;
      }
    }
    
    // Bonus for center columns (2, 3, 4)
    for (let col = 2; col <= 4; col++) {
      for (let row = 0; row < 6; row++) {
        const cellValue = board[CoordUtils.gridToIndex(row, col, 7)];
        if (cellValue === Player.Red) {
          score += 1;
        } else if (cellValue === Player.Yellow) {
          score -= 1;
        }
      }
    }
    
    return score;
  }
  
  // Evaluate strategic patterns (traps, setups)
  static evaluateStrategicPatterns(board) {
    let score = 0;
    
    // Look for potential trap setups
    score += this.evaluateTrapSetups(board);
    
    // Evaluate connection opportunities
    score += this.evaluateConnections(board);
    
    // Penalize isolated pieces
    score += this.evaluateIsolation(board);
    
    return score;
  }
  
  // Evaluate trap setups (creating multiple threats)
  static evaluateTrapSetups(board) {
    let score = 0;
    
    // Look for positions where AI can create multiple winning threats
    for (let col = 0; col < 7; col++) {
      const dropRow = this.getDropRowForBoard(board, col);
      if (dropRow === -1) continue;
      
      // Simulate AI move
      const tempBoard = [...board];
      tempBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = Player.Red;
      
      // Count threats created by this move
      const threats = this.countThreats(tempBoard, Player.Red);
      if (threats >= 2) {
        score += threats * 25; // High value for multiple threats
      }
      
      // Also check if this prevents opponent traps
      tempBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = Player.Yellow;
      const opponentThreats = this.countThreats(tempBoard, Player.Yellow);
      if (opponentThreats >= 2) {
        score += 20; // Blocking opponent traps is valuable
      }
    }
    
    return score;
  }
  
  // Count immediate threats for a player
  static countThreats(board, player) {
    let threats = 0;
    
    // Check each column for potential winning moves
    for (let col = 0; col < 7; col++) {
      const dropRow = this.getDropRowForBoard(board, col);
      if (dropRow === -1) continue;
      
      const tempBoard = [...board];
      tempBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = player;
      
      if (this.checkWinForBoard(tempBoard, dropRow, col, player) === player) {
        threats++;
      }
    }
    
    return threats;
  }
  
  // Evaluate connections between pieces
  static evaluateConnections(board) {
    let score = 0;
    
    // Look for pieces that support each other
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const piece = board[CoordUtils.gridToIndex(row, col, 7)];
        if (piece === 0) continue;
        
        const connections = this.countConnections(board, row, col, piece);
        if (piece === Player.Red) {
          score += connections;
        } else {
          score -= connections;
        }
      }
    }
    
    return score;
  }
  
  // Count adjacent connections for a piece
  static countConnections(board, row, col, player) {
    let connections = 0;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 7) {
        if (board[CoordUtils.gridToIndex(newRow, newCol, 7)] === player) {
          connections++;
        }
      }
    }
    
    return connections;
  }
  
  // Penalize isolated pieces
  static evaluateIsolation(board) {
    let score = 0;
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const piece = board[CoordUtils.gridToIndex(row, col, 7)];
        if (piece === 0) continue;
        
        const connections = this.countConnections(board, row, col, piece);
        if (connections === 0) {
          // Isolated piece penalty
          if (piece === Player.Red) {
            score -= 2;
          } else {
            score += 2; // Opponent isolation is good
          }
        }
      }
    }
    
    return score;
  }
  
  // Evaluate fork opportunities (multiple winning paths)
  static evaluateForkOpportunities(board) {
    let score = 0;
    
    // Look for positions where a player can create multiple winning threats
    for (let col = 0; col < 7; col++) {
      const dropRow = this.getDropRowForBoard(board, col);
      if (dropRow === -1) continue;
      
      // Test AI move
      const aiBoard = [...board];
      aiBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = Player.Red;
      const aiThreats = this.countImmediateThreats(aiBoard, Player.Red);
      
      if (aiThreats >= 2) {
        score += 50; // Fork opportunity for AI
      }
      
      // Test opponent move prevention
      const humanBoard = [...board];
      humanBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = Player.Yellow;
      const humanThreats = this.countImmediateThreats(humanBoard, Player.Yellow);
      
      if (humanThreats >= 2) {
        score += 40; // Prevent opponent fork
      }
    }
    
    return score;
  }
  
  // Count immediate winning threats
  static countImmediateThreats(board, player) {
    let threats = 0;
    
    for (let col = 0; col < 7; col++) {
      const dropRow = this.getDropRowForBoard(board, col);
      if (dropRow === -1) continue;
      
      const tempBoard = [...board];
      tempBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = player;
      
      if (this.checkWinForBoard(tempBoard, dropRow, col, player) === player) {
        threats++;
      }
    }
    
    return threats;
  }
  
  // Evaluate positional advantages
  static evaluatePositionalAdvantages(board) {
    let score = 0;
    
    // Bonus for controlling bottom rows (foundation)
    for (let col = 0; col < 7; col++) {
      if (board[CoordUtils.gridToIndex(5, col, 7)] === Player.Red) {
        score += 3;
      } else if (board[CoordUtils.gridToIndex(5, col, 7)] === Player.Yellow) {
        score -= 3;
      }
    }
    
    // Bonus for even/odd column strategy in early game
    const piecesOnBoard = board.filter(cell => cell !== 0).length;
    if (piecesOnBoard < 14) { // Early game
      for (let col = 1; col < 7; col += 2) { // Odd columns
        for (let row = 4; row < 6; row++) {
          if (board[CoordUtils.gridToIndex(row, col, 7)] === Player.Red) {
            score += 1;
          }
        }
      }
    }
    
    // Penalize edge column overuse
    const leftEdgeCount = board.slice(0, 6).filter(cell => cell === Player.Red).length;
    const rightEdgeCount = board.slice(36, 42).filter(cell => cell === Player.Red).length;
    
    if (leftEdgeCount > 3 || rightEdgeCount > 3) {
      score -= 5;
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
      if (board[CoordUtils.gridToIndex(row, col, 7)] === 0) {
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
    for (let c = col - 1; c >= 0 && board[CoordUtils.gridToIndex(row, c, 7)] === player; c--) {
      count++;
    }
    
    // Check right
    for (let c = col + 1; c < 7 && board[CoordUtils.gridToIndex(row, c, 7)] === player; c++) {
      count++;
    }
    
    if (count >= 4) return player;
    
    // Check vertical
    count = 1;
    
    // Check down
    for (let r = row + 1; r < 6 && board[CoordUtils.gridToIndex(r, col, 7)] === player; r++) {
      count++;
    }
    
    if (count >= 4) return player;
    
    // Check diagonal (positive slope)
    count = 1;
    
    // Check down-left
    for (let r = row + 1, c = col - 1; r < 6 && c >= 0 && board[CoordUtils.gridToIndex(r, c, 7)] === player; r++, c--) {
      count++;
    }
    
    // Check up-right
    for (let r = row - 1, c = col + 1; r >= 0 && c < 7 && board[CoordUtils.gridToIndex(r, c, 7)] === player; r--, c++) {
      count++;
    }
    
    if (count >= 4) return player;
    
    // Check diagonal (negative slope)
    count = 1;
    
    // Check down-right
    for (let r = row + 1, c = col + 1; r < 6 && c < 7 && board[CoordUtils.gridToIndex(r, c, 7)] === player; r++, c++) {
      count++;
    }
    
    // Check up-left
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[CoordUtils.gridToIndex(r, c, 7)] === player; r--, c--) {
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
    tempBoard[CoordUtils.gridToIndex(dropRow, col, 7)] = player;
    
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
export { Connect4AI };