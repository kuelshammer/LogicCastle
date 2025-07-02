// Connect4 UI Controller
import { Player } from './game.js';
import { CoordUtils } from '../../../assets/js/coord-utils.js';

class Connect4UI {
  constructor(game) {
    this.game = game;
    this.currentGameMode = 'two-player';
    this.isAiThinking = false;
    this.aiPlayer = Player.Red; // AI plays as red by default
    this.scores = { yellow: 0, red: 0 };
    
    // DOM elements
    this.elements = {};
    
    // Animation settings
    this.animationDuration = 400;
  }

  // Initialize UI
  async init() {
    console.log('🎮 Starting Connect4 UI initialization...');
    
    this.bindElements();
    this.setupEventListeners();
    this.setupGameEventListeners();
    
    // Initialize game engine
    const initialized = await this.game.init();
    if (!initialized) {
      console.error('❌ Game engine initialization failed');
      this.showToast('Fehler beim Laden des Spiels', 'error');
      return;
    }
    
    this.initializeBoard();
    this.updateUI();
    this.showToast('4 Gewinnt geladen!', 'success');
    console.log('✅ Connect4 game ready!');
  }

  // Bind DOM elements
  bindElements() {
    this.elements = {
      // Board and game elements
      gameBoard: document.getElementById('gameBoard'),
      topCoords: document.getElementById('topCoords'),
      bottomCoords: document.getElementById('bottomCoords'),
      
      // Game info
      currentPlayerIndicator: document.getElementById('currentPlayerIndicator'),
      gameStatus: document.getElementById('gameStatus'),
      moveCounter: document.getElementById('moveCounter'),
      yellowScore: document.getElementById('yellowScore'),
      redScore: document.getElementById('redScore'),
      
      // Controls
      newGameBtn: document.getElementById('newGameBtn'),
      resetScoreBtn: document.getElementById('resetScoreBtn'),
      undoBtn: document.getElementById('undoBtn'),
      helpBtn: document.getElementById('helpBtn'),
      gameModeSelect: document.getElementById('gameMode'),
      
      // Modals
      helpModal: document.getElementById('helpModal'),
      closeHelpBtn: document.getElementById('closeHelpBtn')
    };
  }

  // Setup event listeners
  setupEventListeners() {
    // Control buttons
    this.elements.newGameBtn.addEventListener('click', () => this.newGame());
    this.elements.resetScoreBtn.addEventListener('click', () => this.resetScore());
    this.elements.undoBtn.addEventListener('click', () => this.undoMove());
    this.elements.helpBtn.addEventListener('click', () => this.toggleHelp());
    this.elements.closeHelpBtn.addEventListener('click', () => this.hideHelp());
    
    // Game mode selector
    this.elements.gameModeSelect.addEventListener('change', (e) => {
      this.currentGameMode = e.target.value;
      this.newGame();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Modal click outside to close
    this.elements.helpModal.addEventListener('click', (e) => {
      if (e.target === this.elements.helpModal) {
        this.hideHelp();
      }
    });
  }

  // Setup game event listeners
  setupGameEventListeners() {
    this.game.on('move', (data) => this.onMove(data));
    this.game.on('gameOver', (data) => this.onGameOver(data));
    this.game.on('newGame', (data) => this.onNewGame(data));
    this.game.on('undo', (data) => this.onUndo(data));
    this.game.on('error', (data) => this.onError(data));
  }

  // Initialize board
  initializeBoard() {
    this.createBoardCoordinates();
    this.createGameBoard();
  }

  // Create coordinate labels
  createBoardCoordinates() {
    // Top and bottom coordinates (1-7)
    [this.elements.topCoords, this.elements.bottomCoords].forEach(coordsEl => {
      coordsEl.innerHTML = '';
      for (let col = 1; col <= 7; col++) {
        const coord = document.createElement('div');
        coord.className = 'coord';
        coord.textContent = col;
        coordsEl.appendChild(coord);
      }
    });
  }

  // Create game board
  createGameBoard() {
    if (!this.elements.gameBoard) {
      console.error('❌ gameBoard element not found!');
      return;
    }
    
    this.elements.gameBoard.innerHTML = '';
    
    // Create 6x7 grid (42 slots)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const slot = document.createElement('div');
        slot.className = 'game-slot';
        slot.dataset.row = row;
        slot.dataset.col = col;
        
        // COMPLETELY remove any debug styles - UPDATED VERSION
        slot.removeAttribute('style');
        slot.style.cssText = '';
        slot.style.border = '2px solid #1976D2'; // Set correct border explicitly
        
        // Add click event
        slot.addEventListener('click', () => this.onSlotClick(col));
        
        // Add hover events for column preview
        slot.addEventListener('mouseenter', () => this.onColumnHover(col));
        slot.addEventListener('mouseleave', () => this.onColumnLeave());
        
        this.elements.gameBoard.appendChild(slot);
      }
    }
    
    console.log('✅ Game board created without debug styling - VERSION 2025-06-28 14:11');
  }

  // Handle slot click
  onSlotClick(col) {
    if (this.isAiThinking || this.game.isGameOver()) {
      return;
    }
    
    // Check if it's AI turn in single player mode
    if (this.isAiTurn()) {
      return;
    }
    
    this.makeMove(col);
  }

  // Handle column hover
  onColumnHover(col) {
    if (this.game.isGameOver() || this.isAiThinking) return;
    
    if (!this.game.isColumnFull(col)) {
      this.elements.gameBoard.dataset.hoverCol = col;
    }
  }

  // Handle column leave
  onColumnLeave() {
    delete this.elements.gameBoard.dataset.hoverCol;
  }

  // Make a move
  async makeMove(col) {
    try {
      console.log(`🎯 Attempting move in column ${col}`);
      console.log(`📋 Board state:`, this.game.getBoard());
      console.log(`🎮 Current player:`, this.game.getCurrentPlayer());
      
      const moveData = this.game.makeMove(col);
      console.log(`✅ Move successful:`, moveData);
      
      // If AI mode and game not over, make AI move
      if (!this.game.isGameOver() && this.isAiMode() && this.isAiTurn()) {
        await this.makeAiMove();
      }
    } catch (error) {
      console.error(`❌ Move failed in column ${col}:`, error);
      this.showToast(error.message, 'error');
    }
  }

  // Make AI move
  async makeAiMove() {
    if (!window.Connect4AI) {
      this.showToast('KI nicht verfügbar', 'error');
      return;
    }
    
    this.isAiThinking = true;
    this.updateUI();
    
    // Add small delay for better UX
    await this.delay(500);
    
    try {
      const aiDifficulty = this.getAiDifficulty();
      const bestMove = window.Connect4AI.getBestMove(this.game, aiDifficulty);
      
      if (bestMove !== -1) {
        this.game.makeMove(bestMove);
      }
    } catch (error) {
      console.error('AI move error:', error);
      this.showToast('KI-Fehler', 'error');
    } finally {
      this.isAiThinking = false;
      this.updateUI();
    }
  }

  // Undo move
  undoMove() {
    try {
      // In AI mode, undo two moves (player + AI)
      if (this.isAiMode() && this.game.getMoveCount() >= 2) {
        this.game.undoMove(); // Undo AI move
        this.game.undoMove(); // Undo player move
      } else if (!this.isAiMode()) {
        this.game.undoMove();
      }
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  // Start new game
  newGame() {
    this.game.newGame();
  }

  // Reset score
  resetScore() {
    this.scores = { yellow: 0, red: 0 };
    // Reset scores in game engine too
    if (this.game && this.game.resetScores) {
      this.game.resetScores();
    }
    this.updateScoreDisplay();
    this.updateUI(); // Update to refresh starter indication
    this.showToast('Score zurückgesetzt', 'info');
  }

  // Handle keyboard input
  handleKeyboard(e) {
    // Prevent action if modal is open
    if (this.elements.helpModal.classList.contains('show')) {
      if (e.key === 'Escape' || e.key === 'F1') {
        this.hideHelp();
      }
      return;
    }
    
    // Column moves (1-7)
    if (e.key >= '1' && e.key <= '7') {
      const col = parseInt(e.key) - 1;
      if (!this.game.isColumnFull(col)) {
        this.makeMove(col);
      }
    }
    
    // Shortcuts
    switch (e.key) {
      case 'n':
      case 'N':
        this.newGame();
        break;
      case 'u':
      case 'U':
        if (this.game.canUndo()) {
          this.undoMove();
        }
        break;
      case 'F1':
        e.preventDefault();
        this.toggleHelp();
        break;
      case 'F3':
        e.preventDefault();
        this.resetScore();
        break;
      case 'Escape':
        this.hideHelp();
        break;
    }
    
    // Ctrl combinations
    if (e.ctrlKey) {
      switch (e.key) {
        case 'r':
        case 'R':
          e.preventDefault();
          this.newGame();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          if (this.game.canUndo()) {
            this.undoMove();
          }
          break;
      }
    }
  }

  // Game event handlers
  onMove(data) {
    this.animatePieceDrop(data.col, data.player);
    this.updateUI();
  }

  onGameOver(data) {
    if (data.winner) {
      // Use scores from game engine (already updated there)
      if (data.scores) {
        this.scores = data.scores;
      } else {
        // Fallback: update score manually
        const winnerColor = data.winner === Player.Yellow ? 'yellow' : 'red';
        this.scores[winnerColor]++;
      }
      
      this.highlightWinningPieces();
      this.showToast(`${this.getPlayerName(data.winner)} gewinnt!`, 'success');
    } else {
      this.showToast('Unentschieden!', 'info');
    }
    
    this.updateUI();
  }

  onNewGame(data) {
    this.clearBoard();
    this.updateUI();
  }

  onUndo(data) {
    this.updateBoardDisplay();
    this.updateUI();
  }

  onError(data) {
    this.showToast(data.message, 'error');
  }

  // Animate piece drop
  animatePieceDrop(col, player) {
    const dropRow = this.game.getDropRow(col);
    if (dropRow === -1) return;
    
    const slot = this.getSlot(dropRow, col);
    if (!slot) return;
    
    // Create piece element
    const piece = document.createElement('div');
    piece.className = `game-piece ${player === Player.Yellow ? 'yellow' : 'red'} dropping`;
    
    slot.appendChild(piece);
    slot.classList.add('has-piece');
    
    // Remove dropping animation after completion
    setTimeout(() => {
      piece.classList.remove('dropping');
      piece.classList.add('placed');
    }, this.animationDuration);
  }

  // Highlight winning pieces
  highlightWinningPieces() {
    // This would need the winning line information from the game engine
    // For now, just add a general winning state
    const pieces = this.elements.gameBoard.querySelectorAll('.game-piece.placed');
    pieces.forEach(piece => {
      if (Math.random() < 0.2) { // Placeholder - should be actual winning pieces
        piece.classList.add('winning');
      }
    });
  }

  // Update UI
  updateUI() {
    this.updatePlayerIndicator();
    this.updateGameStatus();
    this.updateMoveCounter();
    this.updateScoreDisplay();
    this.updateControls();
    this.updateBoardDisplay();
  }

  // Update player indicator
  updatePlayerIndicator() {
    const currentPlayer = this.game.getCurrentPlayer();
    const indicator = this.elements.currentPlayerIndicator;
    
    const disc = indicator.querySelector('.player-disc');
    const name = indicator.querySelector('.player-name');
    
    if (this.game.isGameOver()) {
      const winner = this.game.getWinner();
      if (winner) {
        disc.className = `player-disc ${winner === Player.Yellow ? 'yellow' : 'red'}`;
        name.textContent = `${this.getPlayerName(winner)} gewinnt!`;
      } else {
        name.textContent = 'Unentschieden!';
      }
    } else if (this.isAiThinking) {
      disc.className = `player-disc ${currentPlayer === Player.Yellow ? 'yellow' : 'red'}`;
      name.innerHTML = `${this.getPlayerName(currentPlayer)} <span class="loading-spinner"></span>`;
    } else {
      disc.className = `player-disc ${currentPlayer === Player.Yellow ? 'yellow' : 'red'}`;
      name.textContent = this.getPlayerName(currentPlayer);
    }
  }

  // Update game status
  updateGameStatus() {
    let status = '';
    
    if (this.game.isGameOver()) {
      const winner = this.game.getWinner();
      if (winner) {
        status = `${this.getPlayerName(winner)} hat gewonnen!`;
        // Show next starter info
        const nextStarter = this.game.getNextStarter();
        status += ` | Nächster Start: ${this.getPlayerNameFromString(nextStarter)}`;
      } else {
        status = 'Spiel beendet - Unentschieden!';
        const nextStarter = this.game.getNextStarter();
        status += ` | Nächster Start: ${this.getPlayerNameFromString(nextStarter)}`;
      }
    } else if (this.isAiThinking) {
      status = 'KI denkt nach...';
    } else {
      status = `${this.getPlayerName(this.game.getCurrentPlayer())} ist am Zug`;
      // Show starting player for current game
      const startingPlayer = this.game.getStartingPlayer();
      status += ` | Starter: ${this.getPlayerNameFromString(startingPlayer)}`;
    }
    
    this.elements.gameStatus.textContent = status;
  }

  // Update move counter
  updateMoveCounter() {
    this.elements.moveCounter.textContent = this.game.getMoveCount();
  }

  // Update score display
  updateScoreDisplay() {
    this.elements.yellowScore.textContent = this.scores.yellow;
    this.elements.redScore.textContent = this.scores.red;
  }

  // Update controls
  updateControls() {
    this.elements.undoBtn.disabled = !this.game.canUndo() || this.isAiThinking;
    this.elements.newGameBtn.disabled = this.isAiThinking;
    this.elements.gameModeSelect.disabled = this.isAiThinking;
  }

  // Update board display
  updateBoardDisplay() {
    this.clearBoard();
    
    const board = this.game.getBoard();
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cellValue = board[CoordUtils.gridToIndex(row, col, 7)];
        if (cellValue !== 0) {
          const slot = this.getSlot(row, col);
          if (slot) {
            const piece = document.createElement('div');
            piece.className = `game-piece ${cellValue === Player.Yellow ? 'yellow' : 'red'} placed`;
            slot.appendChild(piece);
            slot.classList.add('has-piece');
          }
        }
      }
    }
  }

  // Clear board display
  clearBoard() {
    const slots = this.elements.gameBoard.querySelectorAll('.game-slot');
    slots.forEach(slot => {
      slot.innerHTML = '';
      slot.classList.remove('has-piece');
    });
    delete this.elements.gameBoard.dataset.hoverCol;
  }

  // Get slot element
  getSlot(row, col) {
    return this.elements.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  // Utility functions
  getPlayerName(player) {
    if (this.isAiMode()) {
      if (player === this.aiPlayer) {
        return 'KI';
      } else {
        return 'Spieler';
      }
    }
    return player === Player.Yellow ? 'Spieler 1' : 'Spieler 2';
  }

  // Get player name from string (for starter rotation display)
  getPlayerNameFromString(playerString) {
    if (this.isAiMode()) {
      if ((playerString === 'yellow' && this.aiPlayer === Player.Red) || 
          (playerString === 'red' && this.aiPlayer === Player.Yellow)) {
        return 'Spieler';
      } else {
        return 'KI';
      }
    }
    return playerString === 'yellow' ? 'Spieler 1' : 'Spieler 2';
  }

  isAiMode() {
    return this.currentGameMode.startsWith('vs-bot');
  }

  isAiTurn() {
    return this.isAiMode() && this.game.getCurrentPlayer() === this.aiPlayer;
  }

  getAiDifficulty() {
    switch (this.currentGameMode) {
      case 'vs-bot-easy': return 1;
      case 'vs-bot-medium': return 3;
      case 'vs-bot-hard': return 5;
      default: return 3;
    }
  }

  // Modal functions
  toggleHelp() {
    if (this.elements.helpModal.classList.contains('show')) {
      this.hideHelp();
    } else {
      this.showHelp();
    }
  }

  showHelp() {
    this.elements.helpModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  hideHelp() {
    this.elements.helpModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Toast notifications
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyboard);
    
    // Clear UI
    if (this.elements.gameBoard) {
      this.elements.gameBoard.innerHTML = '';
    }
  }
}

// Export for use in HTML
window.Connect4UI = Connect4UI;
export { Connect4UI };