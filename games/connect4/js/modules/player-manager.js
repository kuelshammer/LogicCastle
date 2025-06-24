/**
 * PlayerManager - Player configuration and utilities
 *
 * Manages player information, turn order, and player-related game logic.
 * Provides clean separation between player management and core game mechanics.
 */
class PlayerManager {
  constructor(gameConstants) {
    this.PLAYER1 = gameConstants.PLAYER1 || 1;
    this.PLAYER2 = gameConstants.PLAYER2 || 2;

    // Player configuration
    this.playerConfig = {
      redPlayer: '🔴', // Player name for red pieces
      yellowPlayer: '🟡', // Player name for yellow pieces
      lastWinner: null, // Who won the last game
      startingPlayer: this.PLAYER1 // Who starts the current game
    };

    this.currentPlayer = this.PLAYER1;
  }

  /**
     * Set player names/identifiers
     * @param {string} redPlayer - Red player identifier
     * @param {string} yellowPlayer - Yellow player identifier
     */
  setPlayerNames(redPlayer, yellowPlayer) {
    this.playerConfig.redPlayer = redPlayer;
    this.playerConfig.yellowPlayer = yellowPlayer;
  }

  /**
     * Get current player
     * @returns {number} Current player (1 or 2)
     */
  getCurrentPlayer() {
    return this.currentPlayer;
  }

  /**
     * Switch to next player
     * @returns {number} New current player
     */
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
    return this.currentPlayer;
  }

  /**
     * Reset current player to starting player
     */
  resetToStartingPlayer() {
    this.currentPlayer = this.playerConfig.startingPlayer;
  }

  /**
     * Set who starts the next game (loser starts logic)
     * @param {number|null} lastWinner - Winner of the last game
     */
  setNextGameStarter(lastWinner) {
    this.playerConfig.lastWinner = lastWinner;

    if (lastWinner === null) {
      // Draw - keep the same starting player (no change needed)
    } else {
      // Loser starts next game
      this.playerConfig.startingPlayer =
                lastWinner === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
    }

    this.currentPlayer = this.playerConfig.startingPlayer;
  }

  /**
     * Get player color name
     * @param {number} player - Player number (1 or 2)
     * @returns {string} Player color ('red' or 'yellow')
     */
  getPlayerColor(player) {
    return player === this.PLAYER1 ? 'red' : 'yellow';
  }

  /**
     * Get player display name
     * @param {number} player - Player number (1 or 2)
     * @returns {string} Player display name
     */
  getPlayerDisplayName(player) {
    return player === this.PLAYER1
      ? this.playerConfig.redPlayer
      : this.playerConfig.yellowPlayer;
  }

  /**
     * Get opposite player
     * @param {number} player - Player number (1 or 2)
     * @returns {number} Opposite player number
     */
  getOpposite(player) {
    return player === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
  }

  /**
     * Check if player is valid
     * @param {number} player - Player number to validate
     * @returns {boolean} True if player is valid
     */
  isValidPlayer(player) {
    return player === this.PLAYER1 || player === this.PLAYER2;
  }

  /**
     * Get player configuration object
     * @returns {Object} Player configuration
     */
  getPlayerConfig() {
    return { ...this.playerConfig };
  }

  /**
     * Set starting player for current game
     * @param {number} player - Player who should start (1 or 2)
     */
  setStartingPlayer(player) {
    if (this.isValidPlayer(player)) {
      this.playerConfig.startingPlayer = player;
      this.currentPlayer = player;
    }
  }

  /**
     * Get who should start the next game based on last winner
     * @returns {number} Player who should start next game
     */
  getNextGameStarter() {
    return this.playerConfig.startingPlayer;
  }

  /**
     * Check if current player is player 1 (red)
     * @returns {boolean} True if current player is player 1
     */
  isCurrentPlayerRed() {
    return this.currentPlayer === this.PLAYER1;
  }

  /**
     * Check if current player is player 2 (yellow)
     * @returns {boolean} True if current player is player 2
     */
  isCurrentPlayerYellow() {
    return this.currentPlayer === this.PLAYER2;
  }

  /**
     * Get current player color
     * @returns {string} Current player color ('red' or 'yellow')
     */
  getCurrentPlayerColor() {
    return this.getPlayerColor(this.currentPlayer);
  }

  /**
     * Get current player display name
     * @returns {string} Current player display name
     */
  getCurrentPlayerDisplayName() {
    return this.getPlayerDisplayName(this.currentPlayer);
  }

  /**
     * Reset player manager to initial state
     */
  reset() {
    this.currentPlayer = this.PLAYER1;
    this.playerConfig.lastWinner = null;
    this.playerConfig.startingPlayer = this.PLAYER1;
  }

  /**
     * Create state snapshot for serialization
     * @returns {Object} Player manager state
     */
  getState() {
    return {
      currentPlayer: this.currentPlayer,
      playerConfig: { ...this.playerConfig }
    };
  }

  /**
     * Restore state from snapshot
     * @param {Object} state - Player manager state
     */
  setState(state) {
    if (state.currentPlayer && this.isValidPlayer(state.currentPlayer)) {
      this.currentPlayer = state.currentPlayer;
    }
    if (state.playerConfig) {
      this.playerConfig = { ...this.playerConfig, ...state.playerConfig };
    }
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlayerManager;
} else if (typeof window !== 'undefined') {
  window.PlayerManager = PlayerManager;
}
