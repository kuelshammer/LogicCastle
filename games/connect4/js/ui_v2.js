// Connect4 UI Controller
import { Player } from './game.js';

class Connect4UI {
  constructor(game) {
    this.game = game;
    this.currentGameMode = 'two-player';
    this.isAiThinking = false;
    this.aiPlayer = Player.Red; // AI plays as red by default
    this.scores = { yellow: 0, red: 0 };
    
    // Player assistance settings
    this.playerAssistance = {
      player1: {
        undo: false,
        threats: false,
        winningMoves: false,
        blockedColumns: false
      },
      player2: {
        undo: false,
        threats: false,
        winningMoves: false,
        blockedColumns: false
      }
    };
    
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
      assistanceBtn: document.getElementById('assistanceBtn'),
      helpBtn: document.getElementById('helpBtn'),
      gameModeSelect: document.getElementById('gameMode'),
      
      // Modals
      helpModal: document.getElementById('helpModal'),
      closeHelpBtn: document.getElementById('closeHelpBtn'),
      assistanceModal: document.getElementById('assistanceModal'),
      closeAssistanceBtn: document.getElementById('closeAssistanceBtn'),
      
      // Assistance checkboxes
      player1UndoCheckbox: document.getElementById('player1-undo'),
      player2UndoCheckbox: document.getElementById('player2-undo'),
      player1ThreatsCheckbox: document.getElementById('player1-threats'),
      player2ThreatsCheckbox: document.getElementById('player2-threats'),
      player1WinningMovesCheckbox: document.getElementById('player1-winning-moves'),
      player2WinningMovesCheckbox: document.getElementById('player2-winning-moves'),
      player1BlockedColumnsCheckbox: document.getElementById('player1-blocked-columns'),
      player2BlockedColumnsCheckbox: document.getElementById('player2-blocked-columns')
    };
  }

  // Setup event listeners
  setupEventListeners() {
    // Control buttons
    this.elements.newGameBtn.addEventListener('click', () => this.newGame());
    this.elements.resetScoreBtn.addEventListener('click', () => this.resetScore());
    this.elements.undoBtn.addEventListener('click', () => this.undoMove());
    this.elements.assistanceBtn.addEventListener('click', () => this.toggleAssistance());
    this.elements.helpBtn.addEventListener('click', () => this.toggleHelp());
    this.elements.closeHelpBtn.addEventListener('click', () => this.hideHelp());
    this.elements.closeAssistanceBtn.addEventListener('click', () => this.hideAssistance());
    
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
    
    this.elements.assistanceModal.addEventListener('click', (e) => {
      if (e.target === this.elements.assistanceModal) {
        this.hideAssistance();
      }
    });
    
    // Assistance checkbox listeners
    this.elements.player1UndoCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player1.undo = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 1 undo assistance: ${e.target.checked}`);
    });
    
    this.elements.player2UndoCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player2.undo = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 2 undo assistance: ${e.target.checked}`);
    });
    
    this.elements.player1ThreatsCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player1.threats = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 1 threats assistance: ${e.target.checked}`);
    });
    
    this.elements.player2ThreatsCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player2.threats = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 2 threats assistance: ${e.target.checked}`);
    });
    
    this.elements.player1WinningMovesCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player1.winningMoves = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 1 winning moves assistance: ${e.target.checked}`);
    });
    
    this.elements.player2WinningMovesCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player2.winningMoves = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 2 winning moves assistance: ${e.target.checked}`);
    });
    
    this.elements.player1BlockedColumnsCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player1.blockedColumns = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 1 blocked columns assistance: ${e.target.checked}`);
    });
    
    this.elements.player2BlockedColumnsCheckbox.addEventListener('change', (e) => {
      this.playerAssistance.player2.blockedColumns = e.target.checked;
      this.updateAssistanceUI();
      console.log(`Player 2 blocked columns assistance: ${e.target.checked}`);
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

  // Undo move with player assistance check
  undoMove() {
    try {
      // Check if current player has undo assistance enabled
      const currentPlayer = this.game.getCurrentPlayer();
      const isPlayer1 = currentPlayer === Player.Yellow;
      const isPlayer2 = currentPlayer === Player.Red;
      
      // In AI mode, always allow undo for human player
      if (this.isAiMode()) {
        if (this.game.getMoveCount() >= 2) {
          this.game.undoMove(); // Undo AI move
          this.game.undoMove(); // Undo player move
          this.showToast('Zug rückgängig gemacht', 'info');
        }
        return;
      }
      
      // In two-player mode, check assistance settings
      const hasUndoAssistance = (isPlayer1 && this.playerAssistance.player1.undo) || 
                               (isPlayer2 && this.playerAssistance.player2.undo);
      
      if (!hasUndoAssistance) {
        const playerName = isPlayer1 ? 'Spieler 1 (Gelb)' : 'Spieler 2 (Rot)';
        this.showToast(`${playerName} hat keine Rückgängig-Berechtigung. Aktiviere Spielerhilfen (F2).`, 'error');
        return;
      }
      
      if (this.game.canUndo()) {
        this.game.undoMove();
        const playerName = isPlayer1 ? 'Spieler 1 (Gelb)' : 'Spieler 2 (Rot)';
        this.showToast(`${playerName}: Zug rückgängig gemacht`, 'success');
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
    this.updateScoreDisplay();
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
    
    if (this.elements.assistanceModal.classList.contains('show')) {
      if (e.key === 'Escape' || e.key === 'F2') {
        this.hideAssistance();
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
      case 'F2':
        e.preventDefault();
        this.toggleAssistance();
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
    // Force assistance update after move
    setTimeout(() => this.updateAssistanceUI(), 100);
  }

  onGameOver(data) {
    if (data.winner) {
      // Update score
      const winnerColor = data.winner === Player.Yellow ? 'yellow' : 'red';
      this.scores[winnerColor]++;
      
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
    this.updateAssistanceUI();
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
      } else {
        status = 'Spiel beendet - Unentschieden!';
      }
    } else if (this.isAiThinking) {
      status = 'KI denkt nach...';
    } else {
      status = `${this.getPlayerName(this.game.getCurrentPlayer())} ist am Zug`;
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
        const cellValue = board[row * 7 + col];
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

  // Assistance modal functions
  toggleAssistance() {
    if (this.elements.assistanceModal.classList.contains('show')) {
      this.hideAssistance();
    } else {
      this.showAssistance();
    }
  }

  showAssistance() {
    this.elements.assistanceModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.syncAssistanceCheckboxes();
  }

  hideAssistance() {
    this.elements.assistanceModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Sync checkbox states with current settings
  syncAssistanceCheckboxes() {
    this.elements.player1UndoCheckbox.checked = this.playerAssistance.player1.undo;
    this.elements.player2UndoCheckbox.checked = this.playerAssistance.player2.undo;
    this.elements.player1ThreatsCheckbox.checked = this.playerAssistance.player1.threats;
    this.elements.player2ThreatsCheckbox.checked = this.playerAssistance.player2.threats;
    this.elements.player1WinningMovesCheckbox.checked = this.playerAssistance.player1.winningMoves;
    this.elements.player2WinningMovesCheckbox.checked = this.playerAssistance.player2.winningMoves;
    this.elements.player1BlockedColumnsCheckbox.checked = this.playerAssistance.player1.blockedColumns;
    this.elements.player2BlockedColumnsCheckbox.checked = this.playerAssistance.player2.blockedColumns;
  }

  // Update UI based on assistance settings
  updateAssistanceUI() {
    // Update undo button state based on current player and assistance
    this.updateControls();
    
    // Show visual indicator when assistance is active
    const currentPlayer = this.game.getCurrentPlayer();
    const isPlayer1 = currentPlayer === Player.Yellow;
    const isPlayer2 = currentPlayer === Player.Red;
    
    const hasUndoAssistance = (isPlayer1 && this.playerAssistance.player1.undo) || 
                             (isPlayer2 && this.playerAssistance.player2.undo);
    
    // Add visual indicator to undo button when assistance is available
    if (hasUndoAssistance && this.game.canUndo()) {
      this.elements.undoBtn.style.background = 'linear-gradient(145deg, #00b894, #00a085)';
      this.elements.undoBtn.title = 'Rückgängig-Hilfe ist aktiviert';
    } else {
      this.elements.undoBtn.style.background = '';
      this.elements.undoBtn.title = '';
    }
    
    // Update visual assistance indicators on the board
    this.updateBoardAssistanceIndicators();
  }
  
  // Update visual assistance indicators on the game board
  updateBoardAssistanceIndicators() {
    if (this.game.isGameOver()) {
      console.log('🎮 Game is over, skipping assistance indicators');
      return;
    }
    
    // Clear existing indicators
    this.clearAssistanceIndicators();
    
    const currentPlayer = this.game.getCurrentPlayer();
    const isPlayer1 = currentPlayer === Player.Yellow;
    const isPlayer2 = currentPlayer === Player.Red;
    
    const playerSettings = isPlayer1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
    
    console.log(`🎯 Updating assistance for ${isPlayer1 ? 'Player 1 (Yellow)' : 'Player 2 (Red)'}`);
    console.log('🔧 Player settings:', playerSettings);
    
    // Show threat indicators
    if (playerSettings.threats) {
      console.log('⚠️ Showing threat indicators...');
      this.showThreatIndicators();
    }
    
    // Show winning move indicators
    if (playerSettings.winningMoves) {
      console.log('🏆 Showing winning move indicators...');
      this.showWinningMoveIndicators();
    }
    
    // Show blocked column indicators
    if (playerSettings.blockedColumns) {
      console.log('🚫 Showing blocked column indicators...');
      this.showBlockedColumnIndicators();
    }
  }
  
  // Clear all assistance indicators from the board
  clearAssistanceIndicators() {
    const slots = this.elements.gameBoard.querySelectorAll('.game-slot');
    slots.forEach(slot => {
      slot.classList.remove('threat-indicator', 'winning-indicator', 'blocked-indicator');
      const indicators = slot.querySelectorAll('.assistance-indicator');
      indicators.forEach(indicator => indicator.remove());
    });
  }
  
  // Show threat indicators (opponent winning moves that need blocking)
  showThreatIndicators() {
    try {
      const blockingMoves = this.game.getBlockingMoves();
      console.log('🔍 Blocking moves found:', blockingMoves);
      
      blockingMoves.forEach(col => {
        const dropRow = this.game.getDropRow(col);
        console.log(`📍 Threat in column ${col}, drop row: ${dropRow}`);
        if (dropRow !== -1) {
          const slot = this.getSlot(dropRow, col);
          if (slot) {
            slot.classList.add('threat-indicator');
            
            // Add visual threat indicator
            const indicator = document.createElement('div');
            indicator.className = 'assistance-indicator threat-icon';
            indicator.innerHTML = '⚠️';
            indicator.title = 'Gegner-Bedrohung! Hier blockieren!';
            slot.appendChild(indicator);
            console.log(`✅ Added threat indicator to column ${col}`);
          } else {
            console.warn(`❌ Could not find slot for row ${dropRow}, col ${col}`);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to show threat indicators:', error);
    }
  }
  
  // Show winning move indicators (direct winning moves for current player)
  showWinningMoveIndicators() {
    try {
      const winningMoves = this.game.getWinningMoves();
      
      winningMoves.forEach(col => {
        const dropRow = this.game.getDropRow(col);
        if (dropRow !== -1) {
          const slot = this.getSlot(dropRow, col);
          if (slot) {
            slot.classList.add('winning-indicator');
            
            // Add visual winning indicator
            const indicator = document.createElement('div');
            indicator.className = 'assistance-indicator winning-icon';
            indicator.innerHTML = '🏆';
            indicator.title = 'Gewinnzug! Hier setzen für den Sieg!';
            slot.appendChild(indicator);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to show winning move indicators:', error);
    }
  }
  
  // Show blocked column indicators (strategically bad moves)
  showBlockedColumnIndicators() {
    try {
      const blockedColumns = this.game.getBlockedColumns();
      
      blockedColumns.forEach(col => {
        const dropRow = this.game.getDropRow(col);
        if (dropRow !== -1) {
          const slot = this.getSlot(dropRow, col);
          if (slot) {
            slot.classList.add('blocked-indicator');
            
            // Add visual blocked indicator
            const indicator = document.createElement('div');
            indicator.className = 'assistance-indicator blocked-icon';
            indicator.innerHTML = '🚫';
            indicator.title = 'Strategisch ungünstig! Besser andere Spalte wählen.';
            slot.appendChild(indicator);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to show blocked column indicators:', error);
    }
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