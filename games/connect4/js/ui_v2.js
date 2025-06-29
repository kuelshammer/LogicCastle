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
    
    // Column selection state for two-step move system
    this.selectedColumn = null;
    
    // Analysis cache to prevent infinite loops
    this.analysisCache = null;
  }

  // Initialize UI
  async init() {
    console.log('🎮 Starting Connect4 UI initialization...');
    
    this.bindElements();
    this.setupEventListeners();
    this.setupGameEventListeners();
    
    // Initialize board first (always show game board)
    this.initializeBoard();
    
    // Initialize game engine (WASM)
    const initialized = await this.game.init();
    if (!initialized) {
      console.error('❌ Game engine initialization failed');
      this.showToast('Spiel geladen (ohne WASM-Optimierungen)', 'warning');
      // Continue with fallback mode - UI is still functional
    } else {
      this.showToast('4 Gewinnt geladen!', 'success');
      console.log('✅ Connect4 game ready!');
    }
    
    this.updateUI();
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
    // Clear any existing coordinate indicators from previous games
    this.clearBlockedColumnIndicators();
    
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

  // Handle slot click - Two-step system: select then confirm
  onSlotClick(col) {
    if (this.isAiThinking || this.game.isGameOver()) {
      return;
    }
    
    // Check if it's AI turn in single player mode
    if (this.isAiTurn()) {
      return;
    }
    
    // CRITICAL: Always check if column is blocked by intelligent assistance
    if (this.isColumnBlocked(col)) {
      console.warn(`🚫 Click BLOCKED: Column ${col + 1} is absolutely blocked by assistance system`);
      this.showToast(`Spalte ${col + 1} ist gesperrt! Nur optimale Züge sind erlaubt.`, 'error');
      this.showBlockedColumnFeedback(col);
      this.showBlockedColumnVisualFeedback(col);
      return;
    }
    
    // Two-step mouse interaction
    if (this.isColumnSelected(col)) {
      // Second click in same column: confirm move
      this.makeMove(col);
    } else {
      // First click or different column: select column
      this.selectColumn(col);
    }
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
      
      // Clear column selection after successful move
      this.clearColumnSelection();
      
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
    this.clearColumnSelection(); // Clear selection when AI starts thinking
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
          this.clearColumnSelection();
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
        this.clearColumnSelection();
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
    this.clearColumnSelection();
    // Clear any assistance indicators from previous game
    this.clearBlockedColumnIndicators();
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
    
    // Column selection (1-7) - First step: select column
    if (e.key >= '1' && e.key <= '7') {
      const col = parseInt(e.key) - 1;
      
      // Check if column is valid and not full
      if (this.game.isColumnFull(col)) {
        console.warn(`🔒 Keyboard: Column ${col + 1} is full`);
        this.showToast(`Spalte ${col + 1} ist voll!`, 'error');
        return;
      }
      
      // Check if column is blocked by assistance (for immediate feedback)
      if (this.isColumnBlocked(col)) {
        console.warn(`🚫 Keyboard: Column ${col + 1} is ABSOLUTELY BLOCKED by assistance`);
        this.showToast(`Tastatur: Spalte ${col + 1} gesperrt! Nur grün markierte Züge erlaubt.`, 'error');
        this.showBlockedColumnFeedback(col);
        this.showBlockedColumnVisualFeedback(col);
        return;
      }
      
      // Column is valid - proceed with selection
      this.selectColumn(col);
      return;
    }
    
    // Shortcuts
    switch (e.key) {
      case ' ': // Spacebar - Second step: confirm move in selected column
        e.preventDefault();
        if (this.selectedColumn !== null) {
          // Double-check column is still valid
          if (this.game.isColumnFull(this.selectedColumn)) {
            console.warn(`🔒 Spacebar: Selected column ${this.selectedColumn + 1} is now full`);
            this.showToast(`Spalte ${this.selectedColumn + 1} ist voll!`, 'error');
            this.clearColumnSelection();
            return;
          }
          
          // Double-check column is not blocked by assistance
          if (this.isColumnBlocked(this.selectedColumn)) {
            console.warn(`🚫 Spacebar: Selected column ${this.selectedColumn + 1} is now blocked`);
            this.showBlockedColumnFeedback(this.selectedColumn);
            this.clearColumnSelection();
            return;
          }
          
          // Make the move
          this.makeMove(this.selectedColumn);
        }
        break;
      case 'Escape':
        // Clear column selection first, then handle modals
        if (this.selectedColumn !== null) {
          this.clearColumnSelection();
        } else {
          this.hideHelp();
          this.hideAssistance();
        }
        break;
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
    // Clear column selection when game ends
    this.clearColumnSelection();
    
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
    this.clearColumnSelection();
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

  // Column selection methods for two-step move system with intelligent assistance
  selectColumn(col) {
    // Basic validation
    if (col < 0 || col >= 7) {
      console.warn(`❌ Invalid column: ${col}`);
      return;
    }
    
    if (this.game.isColumnFull(col)) {
      console.warn(`❌ Column ${col + 1} is full`);
      this.showToast(`Spalte ${col + 1} ist bereits voll!`, 'error');
      return;
    }
    
    if (this.game.isGameOver() || this.isAiThinking) {
      console.warn(`❌ Cannot select column - game over: ${this.game.isGameOver()}, AI thinking: ${this.isAiThinking}`);
      return;
    }
    
    // CRITICAL: Check if column is blocked by intelligent assistance
    if (this.isColumnBlocked(col)) {
      console.warn(`🚫 Column ${col + 1} is ABSOLUTELY BLOCKED by assistance system`);
      this.showToast(`Spalte ${col + 1} ist gesperrt! Nur optimale Züge sind erlaubt.`, 'error');
      this.showBlockedColumnFeedback(col);
      this.showBlockedColumnVisualFeedback(col);
      return;
    }
    
    // Clear previous selection
    this.clearColumnSelection();
    
    // Set new selection
    this.selectedColumn = col;
    this.updateColumnVisualState();
    
    console.log(`🎯 Column ${col + 1} selected successfully`);
  }
  
  clearColumnSelection() {
    if (this.selectedColumn !== null) {
      console.log(`🚫 Column selection cleared`);
      this.selectedColumn = null;
      this.updateColumnVisualState();
    }
  }
  
  isColumnSelected(col) {
    return this.selectedColumn === col;
  }
  
  updateColumnVisualState() {
    // Clear all selection states
    delete this.elements.gameBoard.dataset.selectedCol;
    const slots = this.elements.gameBoard.querySelectorAll('.game-slot');
    slots.forEach(slot => slot.classList.remove('selected'));
    
    // Clear blocked column indicators from coordinates
    this.clearBlockedColumnIndicators();
    
    // Apply new selection if any
    if (this.selectedColumn !== null) {
      this.elements.gameBoard.dataset.selectedCol = this.selectedColumn;
      
      // Highlight the column by adding 'selected' class to all slots in that column
      for (let row = 0; row < 6; row++) {
        const slot = this.getSlot(row, this.selectedColumn);
        if (slot) {
          slot.classList.add('selected');
        }
      }
    }
    
    // Show blocked column indicators in coordinates
    this.updateBlockedColumnIndicators();
    
    // Update intelligent assistance visual indicators
    this.updateIntelligentAssistanceIndicators();
  }
  
  // Intelligent assistance methods with caching to prevent infinite loops
  isColumnBlocked(col) {
    const currentPlayer = this.game.getCurrentPlayer();
    const isPlayer1 = currentPlayer === Player.Yellow;
    const playerSettings = isPlayer1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
    
    console.log(`🔍 Checking if column ${col + 1} is blocked for ${isPlayer1 ? 'Player 1 (Yellow)' : 'Player 2 (Red)'}`);
    
    // Use cached analysis if available and fresh
    if (!this.analysisCache || this.analysisCache.moveNumber !== this.game.getMoveCount()) {
      this.updateAnalysisCache();
    }
    
    const { winningMoves, blockingMoves, dangerousMoves } = this.analysisCache;
    
    console.log(`🎯 Game analysis - Winning: [${winningMoves}], Blocking: [${blockingMoves}], Dangerous: [${dangerousMoves}]`);
    
    // Rule 1: If winning moves available and winning assistance enabled, block non-winning moves
    if (playerSettings.winningMoves && winningMoves.length > 0) {
      const isBlocked = !winningMoves.includes(col);
      console.log(`🏆 Rule 1 - Winning moves assistance enabled, ${winningMoves.length} winning moves available`);
      console.log(`🏆 Column ${col + 1} ${isBlocked ? 'BLOCKED' : 'ALLOWED'} (is winning: ${winningMoves.includes(col)})`);
      return isBlocked;
    }
    
    // Rule 2: If blocking required and threat assistance enabled, block non-blocking moves
    if (playerSettings.threats && blockingMoves.length > 0) {
      const isBlocked = !blockingMoves.includes(col);
      console.log(`⚠️ Rule 2 - Threat assistance enabled, ${blockingMoves.length} blocking moves required`);
      console.log(`⚠️ Column ${col + 1} ${isBlocked ? 'BLOCKED' : 'ALLOWED'} (is blocking: ${blockingMoves.includes(col)})`);
      return isBlocked;
    }
    
    // Rule 3: If dangerous moves exist and blocked columns assistance enabled, block dangerous moves
    if (playerSettings.blockedColumns && dangerousMoves.includes(col)) {
      console.log(`🚫 Rule 3 - Blocked columns assistance enabled, column ${col + 1} is dangerous`);
      return true;
    }
    
    console.log(`✅ Column ${col + 1} is NOT blocked - no applicable rules`);
    return false;
  }
  
  // Cache analysis results to prevent infinite loops
  updateAnalysisCache() {
    console.log('🔄 Updating analysis cache...');
    
    try {
      const winningMoves = this.game.getWinningMoves();
      const blockingMoves = this.game.getBlockingMoves();
      // Get dangerous/trap moves (when "Gesperrte Spalten" assistance is enabled)
      const dangerousMoves = this.game.getBlockedColumns();
      
      this.analysisCache = {
        moveNumber: this.game.getMoveCount(),
        winningMoves,
        blockingMoves,
        dangerousMoves,
        timestamp: Date.now()
      };
      
      console.log('✅ Analysis cache updated:', this.analysisCache);
    } catch (error) {
      console.error('❌ Failed to update analysis cache:', error);
      this.analysisCache = {
        moveNumber: this.game.getMoveCount(),
        winningMoves: [],
        blockingMoves: [],
        dangerousMoves: [],
        timestamp: Date.now()
      };
    }
  }
  
  getDangerousMoves() {
    // Get moves that would create winning opportunities for opponent
    const dangerousCols = [];
    const currentPlayer = this.game.getCurrentPlayer();
    const opponentVal = currentPlayer === Player.Yellow ? Player.Red : Player.Yellow;
    
    try {
      for (let col = 0; col < 7; col++) {
        if (!this.game.isColumnFull(col)) {
          // Simulate our move
          const simulated = this.game.wasmGame.simulate_move_connect4_js(col);
          if (simulated) {
            // Check if opponent would have winning moves after our move
            simulated.current_player = opponentVal;
            const opponentWinning = [];
            
            for (let checkCol = 0; checkCol < 7; checkCol++) {
              if (simulated.get_board()[checkCol] === 0) { // Column not full
                try {
                  const opponentSim = simulated.simulate_move_connect4_js(checkCol);
                  if (opponentSim && opponentSim.check_win() === opponentVal) {
                    opponentWinning.push(checkCol);
                  }
                } catch (e) {
                  // Move invalid, skip
                }
              }
            }
            
            // If our move gives opponent multiple winning options, it's dangerous
            if (opponentWinning.length > 1) {
              dangerousCols.push(col);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to analyze dangerous moves:', error);
    }
    
    return dangerousCols;
  }
  
  showBlockedColumnFeedback(col) {
    const currentPlayer = this.game.getCurrentPlayer();
    const isPlayer1 = currentPlayer === Player.Yellow;
    const playerSettings = isPlayer1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
    
    // Use cached analysis
    if (!this.analysisCache || this.analysisCache.moveNumber !== this.game.getMoveCount()) {
      this.updateAnalysisCache();
    }
    
    const { winningMoves, blockingMoves, dangerousMoves } = this.analysisCache;
    
    let reason = '';
    
    if (playerSettings.winningMoves && winningMoves.length > 0) {
      reason = `Du kannst gewinnen! Spiele in Spalte ${winningMoves.map(c => c + 1).join(' oder ')}.`;
    } else if (playerSettings.threats && blockingMoves.length > 0) {
      reason = `Achtung! Blockiere den Gegner in Spalte ${blockingMoves.map(c => c + 1).join(' oder ')}.`;
    } else if (playerSettings.blockedColumns && dangerousMoves.includes(col)) {
      reason = `Gefährlicher Zug! Spalte ${col + 1} gibt dem Gegner zu viele Gewinnchancen.`;
    }
    
    this.showToast(reason, 'error');
    
    // Visual feedback: Only use coordinate indicators now (no game board styling)
    // Game board symbols have been completely removed for clean UX
  }
  
  showBlockedColumnVisualFeedback(col) {
    // Briefly highlight the coordinate indicator to show it's blocked
    [this.elements.topCoords, this.elements.bottomCoords].forEach(coordsEl => {
      const coords = coordsEl.querySelectorAll('.coord');
      const coord = coords[col];
      if (coord) {
        coord.classList.add('blocked-feedback');
        setTimeout(() => {
          coord.classList.remove('blocked-feedback');
        }, 1000);
      }
    });
  }
  
  updateIntelligentAssistanceIndicators() {
    // REMOVED: No more confusing indicators on the game board!
    // All visual assistance is now handled by column coordinates only.
    // This eliminates user confusion about symbols on the playing field.
    
    console.log('🎯 Intelligent assistance indicators: Using column coordinates only (no board symbols)');
    
    // Clear any existing game board indicators (cleanup)
    const slots = this.elements.gameBoard.querySelectorAll('.game-slot');
    slots.forEach(slot => {
      slot.classList.remove('forced-move', 'blocked-move', 'dangerous-move', 'winning-move');
    });
    
    // All visual feedback is now handled by updateBlockedColumnIndicators()
    // which provides clear, intuitive column number styling
  }
  
  // Column blocking indicator management for coordinates
  clearBlockedColumnIndicators() {
    // Clear blocked indicators from top and bottom coordinates
    [this.elements.topCoords, this.elements.bottomCoords].forEach(coordsEl => {
      const coords = coordsEl.querySelectorAll('.coord');
      coords.forEach(coord => {
        coord.classList.remove('blocked-column');
        const blockIndicator = coord.querySelector('.blocked-indicator');
        if (blockIndicator) {
          blockIndicator.remove();
        }
      });
    });
  }
  
  updateBlockedColumnIndicators() {
    if (this.game.isGameOver()) return;
    
    // Clear all column styling first
    [this.elements.topCoords, this.elements.bottomCoords].forEach(coordsEl => {
      const coords = coordsEl.querySelectorAll('.coord');
      coords.forEach(coord => {
        coord.classList.remove('blocked-column', 'winning-column', 'blocking-column');
        // Remove old indicator elements
        const indicator = coord.querySelector('.blocked-indicator');
        if (indicator) {
          indicator.remove();
        }
      });
    });
    
    const currentPlayer = this.game.getCurrentPlayer();
    const isPlayer1 = currentPlayer === Player.Yellow;
    const playerSettings = isPlayer1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
    
    // Only show assistance if enabled
    if (!playerSettings.winningMoves && !playerSettings.threats && !playerSettings.blockedColumns) {
      return;
    }
    
    // Use cached analysis
    if (!this.analysisCache || this.analysisCache.moveNumber !== this.game.getMoveCount()) {
      this.updateAnalysisCache();
    }
    
    const { winningMoves, blockingMoves, dangerousMoves } = this.analysisCache;
    
    console.log(`🔍 Column analysis - Winning: [${winningMoves}], Blocking: [${blockingMoves}], Dangerous: [${dangerousMoves}]`);
    
    // NEW LOGIC: Prioritize winning moves with clear visual distinction
    let priorityColumns = [];
    let blockedColumns = [];
    
    // Rule 1: WINNING MOVES get priority - show as GREEN
    if (playerSettings.winningMoves && winningMoves.length > 0) {
      priorityColumns = winningMoves.filter(col => !this.game.isColumnFull(col));
      // Block ALL other columns
      for (let col = 0; col < 7; col++) {
        if (!this.game.isColumnFull(col) && !winningMoves.includes(col)) {
          blockedColumns.push(col);
        }
      }
      console.log(`🏆 WINNING STRATEGY: Priority columns [${priorityColumns.map(c=>c+1)}], Blocked [${blockedColumns.map(c=>c+1)}]`);
    }
    // Rule 2: BLOCKING MOVES get priority when no winning moves - ORANGE
    else if (playerSettings.threats && blockingMoves.length > 0) {
      priorityColumns = blockingMoves.filter(col => !this.game.isColumnFull(col));
      // Block ALL non-blocking columns (absolute blocking like winning moves)
      for (let col = 0; col < 7; col++) {
        if (!this.game.isColumnFull(col) && !blockingMoves.includes(col)) {
          blockedColumns.push(col);
        }
      }
      console.log(`⚠️ DEFENSIVE STRATEGY: Priority columns [${priorityColumns.map(c=>c+1)}], Blocked [${blockedColumns.map(c=>c+1)}]`);
    }
    
    // Apply visual styling to coordinates
    [this.elements.topCoords, this.elements.bottomCoords].forEach(coordsEl => {
      const coords = coordsEl.querySelectorAll('.coord');
      coords.forEach((coord, index) => {
        if (priorityColumns.includes(index)) {
          // Determine if this is winning (green) or blocking (orange)
          if (playerSettings.winningMoves && winningMoves.includes(index)) {
            coord.classList.add('winning-column');
            coord.title = 'Gewinnzug - führt direkt zum Sieg!';
          } else if (playerSettings.threats && blockingMoves.includes(index)) {
            coord.classList.add('blocking-column');
            coord.title = 'Blockierender Zug - verhindert Niederlage!';
          }
        } else if (blockedColumns.includes(index)) {
          coord.classList.add('blocked-column');
          coord.title = 'Spalte gesperrt - nicht optimal bei aktivierter Hilfe';
        }
      });
    });
    
    if (priorityColumns.length > 0 || blockedColumns.length > 0) {
      console.log(`✅ Applied column indicators - Priority: [${priorityColumns.map(c => c + 1)}], Blocked: [${blockedColumns.map(c => c + 1)}]`);
    }
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
    
    // Update intelligent assistance indicators
    this.updateIntelligentAssistanceIndicators();
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
    
    // All assistance indicators are now handled by column coordinates only
    // Removed all game board indicators to eliminate confusion
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
      console.log('🏆 Winning moves found:', winningMoves);
      
      // DEMO: For testing, add indicator to column 6 if game situation is right
      const board = this.game.getBoard();
      const currentPlayer = this.game.getCurrentPlayer();
      
      // Check if player has 3 in a row in bottom row
      const bottomRow = 5;
      let consecutiveCount = 0;
      let lastCol = -1;
      
      for (let col = 0; col < 7; col++) {
        const cellValue = board[bottomRow * 7 + col];
        if (cellValue === currentPlayer) {
          consecutiveCount++;
          lastCol = col;
        } else if (cellValue === 0 && consecutiveCount === 3) {
          // Found 3 in a row with empty spot - this could be a win!
          console.log(`🎯 Potential win in column ${col} after 3 consecutive in positions ending at ${lastCol}`);
          
          const dropRow = this.game.getDropRow(col);
          if (dropRow !== -1) {
            const slot = this.getSlot(dropRow, col);
            if (slot) {
              slot.classList.add('winning-indicator');
              
              const indicator = document.createElement('div');
              indicator.className = 'assistance-indicator winning-icon';
              indicator.innerHTML = '🏆';
              indicator.title = 'DEMO: Gewinnzug! Hier setzen für den Sieg!';
              slot.appendChild(indicator);
              console.log(`✅ Added DEMO winning indicator to column ${col}`);
            }
          }
        } else {
          consecutiveCount = 0;
        }
      }
      
      // Also process actual WASM results
      winningMoves.forEach(col => {
        const dropRow = this.game.getDropRow(col);
        console.log(`🏆 WASM winning move in column ${col}, drop row: ${dropRow}`);
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
            console.log(`✅ Added WASM winning indicator to column ${col}`);
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

  // Debug and testing functions
  testIntelligentAssistance() {
    console.log('🧪 Testing Intelligent Assistance System');
    console.log('📋 Current player settings:', this.playerAssistance);
    
    const currentPlayer = this.game.getCurrentPlayer();
    const isPlayer1 = currentPlayer === Player.Yellow;
    const playerSettings = isPlayer1 ? this.playerAssistance.player1 : this.playerAssistance.player2;
    
    console.log(`🎮 Current player: ${isPlayer1 ? 'Player 1 (Yellow)' : 'Player 2 (Red)'}`);
    console.log(`🔧 Player assistance settings:`, playerSettings);
    
    // Test WASM functions
    console.log('🔍 Testing WASM analysis functions...');
    const winningMoves = this.game.getWinningMoves();
    const blockingMoves = this.game.getBlockingMoves();
    const dangerousMoves = this.getDangerousMoves();
    
    console.log(`🏆 Winning moves: [${winningMoves.map(c => c + 1).join(', ')}]`);
    console.log(`⚠️ Blocking moves: [${blockingMoves.map(c => c + 1).join(', ')}]`);
    console.log(`🚫 Dangerous moves: [${dangerousMoves.map(c => c + 1).join(', ')}]`);
    
    // Test column blocking
    console.log('🔍 Testing column blocking for each column...');
    for (let col = 0; col < 7; col++) {
      const isBlocked = this.isColumnBlocked(col);
      const isFull = this.game.isColumnFull(col);
      console.log(`📍 Column ${col + 1}: Full=${isFull}, Blocked=${isBlocked}`);
    }
    
    return {
      playerSettings,
      winningMoves,
      blockingMoves,
      dangerousMoves,
      currentPlayer: isPlayer1 ? 'Player 1' : 'Player 2'
    };
  }
  
  // Enable/disable assistance for testing
  enableWinningMovesAssistance(player = 1) {
    if (player === 1) {
      this.playerAssistance.player1.winningMoves = true;
      this.elements.player1WinningMovesCheckbox.checked = true;
    } else {
      this.playerAssistance.player2.winningMoves = true;
      this.elements.player2WinningMovesCheckbox.checked = true;
    }
    this.updateAssistanceUI();
    console.log(`✅ Enabled winning moves assistance for Player ${player}`);
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