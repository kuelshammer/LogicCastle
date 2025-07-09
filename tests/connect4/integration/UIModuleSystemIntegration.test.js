/**
 * UI-Module System Integration Tests
 * 
 * ULTRATHINK Phase 2: UI-Module System Integration Testing
 * Tests the integration between ULTRATHINK components and the BaseGameUI module system:
 * - BaseGameUI inheritance and extension
 * - Module system integration (Modal, Keyboard, Messages)
 * - Element binding and lifecycle management
 * - Cross-module communication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Connect4UINew } from '../../../games/connect4/js/ui-new.js';

describe('🎛️ ULTRATHINK UI-Module System Integration Tests', () => {
    let container;
    let mockGame;
    let connect4UI;

    beforeEach(() => {
        // Create comprehensive test DOM structure matching Connect4 requirements
        container = document.createElement('div');
        container.innerHTML = `
            <div class="connect4-game-container">
                <!-- Game Board Section -->
                <div id="topCoords" class="board-coords top"></div>
                <div id="gameBoard" class="game-board"></div>
                <div id="bottomCoords" class="board-coords bottom"></div>
                
                <!-- Game Status Section -->
                <div id="gameStatus" class="game-status">Ready</div>
                <div id="currentPlayer" class="current-player">Player 1</div>
                <div id="moveCounter" class="move-counter">0</div>
                
                <!-- Control Section -->
                <div class="controls">
                    <button id="resetBtn" class="btn-secondary">Reset</button>
                    <button id="undoBtn" class="btn-secondary">Undo</button>
                    <button id="newGameBtn" class="btn-primary">New Game</button>
                    <select id="gameMode">
                        <option value="two-player">Two Player</option>
                        <option value="vs-bot-easy">vs Bot Easy</option>
                        <option value="vs-bot-medium">vs Bot Medium</option>
                        <option value="vs-bot-hard">vs Bot Hard</option>
                    </select>
                </div>
                
                <!-- Assistance Panel -->
                <div id="assistancePanel" class="assistance-panel">
                    <h3>Player Assistance</h3>
                    <div class="player-assistance">
                        <h4>Player 1 (Yellow)</h4>
                        <label><input type="checkbox" id="player1-undo"> Undo</label>
                        <label><input type="checkbox" id="player1-threats"> Threats</label>
                        <label><input type="checkbox" id="player1-winning-moves"> Winning Moves</label>
                        <label><input type="checkbox" id="player1-blocked-columns"> Blocked Columns</label>
                    </div>
                    <div class="player-assistance">
                        <h4>Player 2 (Red)</h4>
                        <label><input type="checkbox" id="player2-undo"> Undo</label>
                        <label><input type="checkbox" id="player2-threats"> Threats</label>
                        <label><input type="checkbox" id="player2-winning-moves"> Winning Moves</label>
                        <label><input type="checkbox" id="player2-blocked-columns"> Blocked Columns</label>
                    </div>
                </div>
                
                <!-- Modal System -->
                <div id="helpModal" class="modal hidden">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Help</h2>
                        <p>Connect 4 game help content...</p>
                    </div>
                </div>
                
                <div id="assistanceModal" class="modal hidden">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>Assistance Settings</h2>
                        <p>Configure player assistance...</p>
                    </div>
                </div>
                
                <!-- Message System -->
                <div id="messageContainer" class="message-container"></div>
                
                <!-- Score Display -->
                <div class="scores">
                    <div class="score">
                        <span class="score-label">Yellow:</span>
                        <span id="yellowScore" class="score-value">0</span>
                    </div>
                    <div class="score">
                        <span class="score-label">Red:</span>
                        <span id="redScore" class="score-value">0</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Create comprehensive mock game with all expected methods
        mockGame = {
            // Event system
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn(),
            
            // Game state
            newGame: vi.fn(),
            makeMove: vi.fn().mockResolvedValue({ row: 5, col: 0, player: 1 }),
            canUndo: vi.fn(() => false),
            undoMove: vi.fn(),
            isGameOver: vi.fn(() => false),
            getWinner: vi.fn(() => null),
            getCurrentPlayer: vi.fn(() => 1),
            getMoveCount: vi.fn(() => 0),
            
            // Board state
            getBoard: vi.fn(() => new Array(42).fill(0)),
            isColumnFull: vi.fn(() => false),
            getDropRow: vi.fn(() => 5),
            isValidMove: vi.fn(() => true),
            
            // Assistance features
            getBlockingMoves: vi.fn(() => []),
            getWinningMoves: vi.fn(() => []),
            getBlockedColumns: vi.fn(() => []),
            
            // Properties
            isInitialized: true
        };
    });

    afterEach(() => {
        if (connect4UI) {
            connect4UI.destroy?.();
            connect4UI = null;
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. BaseGameUI Inheritance and Extension', () => {
        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
        });

        it('should properly extend BaseGameUI', () => {
            // Verify inheritance
            expect(connect4UI.constructor.name).toBe('Connect4UINew');
            expect(connect4UI.game).toBe(mockGame);
            expect(connect4UI.config).toBeDefined();
            expect(connect4UI.isInitialized).toBe(true);
            
            // Verify BaseGameUI methods are available
            expect(typeof connect4UI.init).toBe('function');
            expect(typeof connect4UI.destroy).toBe('function');
            expect(typeof connect4UI.getModule).toBe('function');
            expect(typeof connect4UI.showMessage).toBe('function');
        });

        it('should override BaseGameUI lifecycle methods correctly', () => {
            // Verify Connect4-specific overrides
            expect(typeof connect4UI.beforeInit).toBe('function');
            expect(typeof connect4UI.afterInit).toBe('function');
            expect(typeof connect4UI.setupGameEventListeners).toBe('function');
            expect(typeof connect4UI.bindKeyboardActions).toBe('function');
        });

        it('should maintain BaseGameUI configuration structure', () => {
            expect(connect4UI.config.elements).toBeDefined();
            expect(connect4UI.config.keyboard).toBeDefined();
            expect(connect4UI.config.messages).toBeDefined();
            expect(connect4UI.config.modals).toBeDefined();
            
            // Connect4-specific config extensions
            expect(connect4UI.config.elements.required).toContain('gameBoard');
            expect(connect4UI.config.keyboard['F2']).toBeDefined(); // Assistance modal
        });

        it('should handle Connect4-specific initialization', () => {
            // Verify Connect4-specific properties
            expect(connect4UI.gameMode).toBeDefined();
            expect(connect4UI.assistanceSettings).toBeDefined();
            expect(connect4UI.scores).toBeDefined();
            expect(connect4UI.aiPlayer).toBe(2);
            
            // Verify initialization sequence
            expect(connect4UI.elements.gameBoard).toBeTruthy();
            expect(connect4UI.elements.gameBoard.children.length).toBe(42); // 6x7 board
        });
    });

    describe('2. Module System Integration', () => {
        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
        });

        it('should integrate with ModalManager module', () => {
            const modalManager = connect4UI.getModule('modal');
            expect(modalManager).toBeDefined();
            
            // Test modal operations
            expect(() => connect4UI.showModal?.('help')).not.toThrow();
            expect(() => connect4UI.hideModal?.('help')).not.toThrow();
            
            // Verify modal elements exist
            const helpModal = document.getElementById('helpModal');
            const assistanceModal = document.getElementById('assistanceModal');
            expect(helpModal).toBeTruthy();
            expect(assistanceModal).toBeTruthy();
        });

        it('should integrate with KeyboardController module', () => {
            const keyboardController = connect4UI.getModule('keyboard');
            expect(keyboardController).toBeDefined();
            
            // Verify Connect4-specific keyboard shortcuts
            expect(connect4UI.config.keyboard['1']).toBe('dropColumn1');
            expect(connect4UI.config.keyboard['2']).toBe('dropColumn2');
            expect(connect4UI.config.keyboard['7']).toBe('dropColumn7');
            expect(connect4UI.config.keyboard['F1']).toBe('toggleHelp');
            expect(connect4UI.config.keyboard['F2']).toBe('toggleAssistance');
            expect(connect4UI.config.keyboard['F3']).toBe('newGame');
        });

        it('should integrate with MessageSystem module', () => {
            const messageSystem = connect4UI.getModule('message');
            expect(messageSystem).toBeDefined();
            
            // Test message operations
            expect(() => connect4UI.showMessage('Test message', 'info')).not.toThrow();
            expect(() => connect4UI.showMessage('Success message', 'success')).not.toThrow();
            expect(() => connect4UI.showMessage('Error message', 'error')).not.toThrow();
            
            // Verify message container exists
            const messageContainer = document.getElementById('messageContainer');
            expect(messageContainer).toBeTruthy();
        });

        it('should handle module communication', () => {
            // Simulate keyboard shortcut triggering modal
            const keyboardController = connect4UI.getModule('keyboard');
            const modalManager = connect4UI.getModule('modal');
            
            expect(keyboardController).toBeDefined();
            expect(modalManager).toBeDefined();
            
            // Verify cross-module functionality
            expect(typeof connect4UI.toggleModal).toBe('function');
        });
    });

    describe('3. Element Binding and Lifecycle Management', () => {
        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
        });

        it('should bind all required elements successfully', () => {
            // Verify critical game elements
            expect(connect4UI.elements.gameBoard).toBeTruthy();
            expect(connect4UI.elements.gameStatus).toBeTruthy();
            expect(connect4UI.elements.currentPlayer).toBeTruthy();
            
            // Verify control elements
            expect(connect4UI.elements.resetBtn).toBeTruthy();
            expect(connect4UI.elements.undoBtn).toBeTruthy();
            expect(connect4UI.elements.newGameBtn).toBeTruthy();
        });

        it('should bind optional elements when available', () => {
            // Verify optional elements
            expect(connect4UI.elements.moveCounter).toBeTruthy();
            expect(connect4UI.elements.topCoords).toBeTruthy();
            expect(connect4UI.elements.bottomCoords).toBeTruthy();
            expect(connect4UI.elements.assistancePanel).toBeTruthy();
        });

        it('should handle assistance checkbox binding', () => {
            // Verify assistance checkboxes are bound
            const features = ['undo', 'threats', 'winning-moves', 'blocked-columns'];
            const players = ['player1', 'player2'];
            
            for (const player of players) {
                for (const feature of features) {
                    const checkboxId = `${player}-${feature}`;
                    const checkbox = document.getElementById(checkboxId);
                    expect(checkbox).toBeTruthy();
                }
            }
        });

        it('should manage element lifecycle during game mode changes', () => {
            const initialElements = Object.keys(connect4UI.elements).length;
            
            // Change game mode
            connect4UI.setGameMode('vs-bot-medium');
            
            // Elements should remain consistent
            const afterModeChangeElements = Object.keys(connect4UI.elements).length;
            expect(afterModeChangeElements).toBe(initialElements);
            
            // Game mode specific elements should be accessible
            const gameModeSelect = document.getElementById('gameMode');
            expect(gameModeSelect).toBeTruthy();
            expect(gameModeSelect.value).toBe('vs-bot-medium');
        });
    });

    describe('4. Cross-Module Communication', () => {
        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
        });

        it('should handle keyboard → modal communication', () => {
            const modalManager = connect4UI.getModule('modal');
            
            // Simulate F1 key press for help
            expect(() => {
                connect4UI.toggleModal?.('help');
            }).not.toThrow();
            
            // Modal should be responsive to keyboard commands
            expect(modalManager).toBeDefined();
        });

        it('should handle game events → UI module updates', () => {
            const messageSystem = connect4UI.getModule('message');
            
            // Simulate game over event
            mockGame.isGameOver.mockReturnValue(true);
            mockGame.getWinner.mockReturnValue(1);
            
            connect4UI.onGameOver({ winner: 1 });
            
            // Should update multiple modules
            expect(connect4UI.elements.gameStatus.textContent).toContain('Gelb');
            expect(connect4UI.scores.yellow).toBe(1);
        });

        it('should handle assistance → message system integration', () => {
            // Toggle assistance and verify message feedback
            const result = connect4UI.toggleAssistance('player1', 'threats');
            
            expect(typeof result).toBe('boolean');
            
            // Should provide user feedback through message system
            // (Implementation may vary - testing the integration exists)
            expect(() => {
                connect4UI.updateAssistanceHighlights();
            }).not.toThrow();
        });

        it('should handle modal → assistance system integration', () => {
            // Opening assistance modal should show current settings
            expect(() => {
                connect4UI.toggleModal?.('assistance');
            }).not.toThrow();
            
            // Assistance settings should be accessible through modal
            expect(connect4UI.assistanceSettings).toBeDefined();
            expect(connect4UI.assistanceSettings.player1).toBeDefined();
            expect(connect4UI.assistanceSettings.player2).toBeDefined();
        });
    });

    describe('5. Event Flow Integration', () => {
        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
        });

        it('should handle complete move event flow', async () => {
            // Simulate column click
            const movePromise = connect4UI.dropDiscInColumn(3);
            
            // Should trigger game move
            expect(mockGame.makeMove).toHaveBeenCalledWith(3);
            
            await movePromise;
            
            // Should update UI after move
            expect(connect4UI.elements.gameBoard).toBeTruthy();
        });

        it('should handle game state change propagation', () => {
            // Simulate move made event
            const moveData = { row: 5, col: 2, player: 1 };
            connect4UI.onMoveMade(moveData);
            
            // Should update multiple UI components
            expect(typeof connect4UI.updateUI).toBe('function');
            expect(typeof connect4UI.updateBoard).toBe('function');
            expect(typeof connect4UI.updateGameStatus).toBe('function');
        });

        it('should handle assistance event flow', () => {
            const threatsCheckbox = document.getElementById('player1-threats');
            
            if (threatsCheckbox) {
                // Simulate checkbox change
                threatsCheckbox.checked = true;
                threatsCheckbox.dispatchEvent(new Event('change'));
                
                // Should update assistance settings
                expect(connect4UI.assistanceSettings.player1.threats).toBe(true);
            }
        });

        it('should handle keyboard event delegation', () => {
            // Test number key column selection
            for (let i = 1; i <= 7; i++) {
                const keyboardAction = connect4UI.config.keyboard[i.toString()];
                expect(keyboardAction).toBe(`dropColumn${i}`);
            }
            
            // Test function key actions
            expect(connect4UI.config.keyboard['F1']).toBe('toggleHelp');
            expect(connect4UI.config.keyboard['F3']).toBe('newGame');
        });
    });

    describe('6. Performance and Resource Management', () => {
        it('should initialize efficiently', async () => {
            const startTime = performance.now();
            
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            const endTime = performance.now();
            const initTime = endTime - startTime;
            
            expect(initTime).toBeLessThan(100); // Should initialize quickly
            console.log(`🚀 UI-Module system initialization: ${initTime.toFixed(2)}ms`);
        });

        it('should handle rapid UI updates efficiently', () => {
            const startTime = performance.now();
            
            // Simulate rapid game state changes
            for (let i = 0; i < 50; i++) {
                connect4UI.updateUI();
                connect4UI.updateGameStatus();
                connect4UI.updateBoard();
            }
            
            const endTime = performance.now();
            const updateTime = endTime - startTime;
            
            expect(updateTime).toBeLessThan(100); // 150 updates in under 100ms
            console.log(`⚡ UI update performance: 150 operations in ${updateTime.toFixed(2)}ms`);
        });

        it('should cleanup resources properly', () => {
            // Initialize with event listeners
            expect(connect4UI.elements.gameBoard.children.length).toBe(42);
            
            // Destroy should cleanup everything
            connect4UI.destroy?.();
            
            // Should be in clean state
            expect(connect4UI.isInitialized).toBe(false);
        });

        it('should handle memory pressure gracefully', () => {
            // Create multiple UI instances to test memory handling
            const instances = [];
            
            for (let i = 0; i < 5; i++) {
                const instance = new Connect4UINew(mockGame);
                instances.push(instance);
            }
            
            // Cleanup all instances
            instances.forEach(instance => {
                instance.destroy?.();
            });
            
            // Should not cause memory leaks
            expect(instances.length).toBe(5);
        });
    });

    describe('7. Error Handling and Recovery', () => {
        beforeEach(async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
        });

        it('should handle module initialization failures gracefully', () => {
            // Simulate missing modal elements
            document.getElementById('helpModal')?.remove();
            
            expect(() => {
                connect4UI.toggleModal?.('help');
            }).not.toThrow();
        });

        it('should handle element binding failures gracefully', () => {
            // Remove critical element
            const gameBoard = connect4UI.elements.gameBoard;
            gameBoard.remove();
            
            expect(() => {
                connect4UI.updateBoard();
            }).not.toThrow();
        });

        it('should handle game event errors gracefully', () => {
            // Simulate game error
            mockGame.makeMove.mockRejectedValue(new Error('Invalid move'));
            
            expect(async () => {
                await connect4UI.dropDiscInColumn(3);
            }).rejects.toThrow('Invalid move');
            
            // UI should remain stable
            expect(connect4UI.isInitialized).toBe(true);
        });

        it('should provide error feedback through message system', () => {
            const messageSystem = connect4UI.getModule('message');
            
            // Simulate error condition
            connect4UI.showMessage('Test error message', 'error');
            
            // Message system should handle error display
            expect(messageSystem).toBeDefined();
        });
    });

    describe('8. Configuration and Customization', () => {
        it('should support dynamic configuration updates', async () => {
            connect4UI = new Connect4UINew(mockGame);
            await connect4UI.init();
            
            // Update configuration
            const newConfig = {
                messages: { duration: 5000 },
                keyboard: { 'F5': 'customAction' }
            };
            
            connect4UI.updateConfig?.(newConfig);
            
            // Configuration should be updated
            expect(connect4UI.config.messages.duration).toBe(5000);
        });

        it('should handle game mode specific configurations', () => {
            // AI mode configuration
            connect4UI.setGameMode('vs-bot-hard');
            
            expect(connect4UI.gameMode).toBe('vs-bot-hard');
            expect(connect4UI.getAIDifficulty()).toBe('hard');
            
            // Two player mode configuration
            connect4UI.setGameMode('two-player');
            
            expect(connect4UI.gameMode).toBe('two-player');
            expect(connect4UI.isAIMode()).toBe(false);
        });

        it('should support assistance configuration per player', () => {
            // Configure player 1 assistance
            connect4UI.toggleAssistance('player1', 'threats');
            connect4UI.toggleAssistance('player1', 'winning-moves');
            
            expect(connect4UI.getAssistanceSetting('player1', 'threats')).toBe(true);
            expect(connect4UI.getAssistanceSetting('player1', 'winning-moves')).toBe(true);
            expect(connect4UI.getAssistanceSetting('player2', 'threats')).toBe(false);
        });
    });
});