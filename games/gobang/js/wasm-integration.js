/**
 * WASM Integration for Enhanced Gobang UI
 * Provides advanced analysis features using Rust/WASM engine
 */

class WasmGobangIntegration {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.wasmGame = null;
        this.isWasmEnabled = false;
        this.isInitialized = false;
        
        // Feature flags
        this.features = {
            moveAnalysis: true,
            threatLevels: false,
            patternHighlights: false,
            openThreeDetection: false,
            closedFourDetection: false,
            doubleThreeForks: false,
            threatLevelAnalysis: false
        };
        
        // Performance tracking
        this.performanceMetrics = {
            lastAnalysisTime: 0,
            averageAnalysisTime: 0,
            analysisCount: 0
        };
        
        this.initializeUI();
    }

    /**
     * Initialize UI components and event listeners
     */
    initializeUI() {
        this.setupDashboardControls();
        this.setupFeatureToggles();
        this.setupPerformanceIndicator();
        
        // Try to initialize WASM engine
        this.initializeWasmEngine();
    }

    /**
     * Setup dashboard controls
     */
    setupDashboardControls() {
        const toggleBtn = document.getElementById('toggleDashboard');
        const dashboardContent = document.getElementById('dashboardContent');
        
        if (toggleBtn && dashboardContent) {
            toggleBtn.addEventListener('click', () => {
                const isCollapsed = dashboardContent.classList.contains('collapsed');
                
                if (isCollapsed) {
                    dashboardContent.classList.remove('collapsed');
                    toggleBtn.textContent = '▼';
                } else {
                    dashboardContent.classList.add('collapsed');
                    toggleBtn.textContent = '▶';
                }
            });
        }

        // Analysis toggle controls
        const enableAnalysis = document.getElementById('enableMoveAnalysis');
        const showThreatLevels = document.getElementById('showThreatLevels');
        const highlightPatterns = document.getElementById('highlightPatterns');

        if (enableAnalysis) {
            enableAnalysis.addEventListener('change', (e) => {
                this.features.moveAnalysis = e.target.checked;
                if (this.features.moveAnalysis) {
                    this.updateAnalysisDashboard();
                } else {
                    this.clearAnalysisDashboard();
                }
            });
        }

        if (showThreatLevels) {
            showThreatLevels.addEventListener('change', (e) => {
                this.features.threatLevels = e.target.checked;
                this.updateThreatLevelVisualization();
            });
        }

        if (highlightPatterns) {
            highlightPatterns.addEventListener('change', (e) => {
                this.features.patternHighlights = e.target.checked;
                this.updatePatternHighlights();
            });
        }

        // Performance test button
        const wasmTestBtn = document.getElementById('wasmTestBtn');
        if (wasmTestBtn) {
            wasmTestBtn.addEventListener('click', () => {
                window.open('./simple-performance-test.html', '_blank');
            });
        }

        // System status debugging
        console.log('🔧 WASM Integration Status:');
        console.log('- Features:', this.features);
        console.log('- Performance Metrics:', this.performanceMetrics);
    }

    /**
     * Setup WASM feature toggles
     */
    setupFeatureToggles() {
        const enableWasm = document.getElementById('enableWasmEngine');
        const advancedFeatures = document.getElementById('advancedFeatures');

        if (enableWasm) {
            enableWasm.addEventListener('change', async (e) => {
                this.isWasmEnabled = e.target.checked;
                
                if (this.isWasmEnabled) {
                    await this.initializeWasmEngine();
                    if (advancedFeatures) {
                        advancedFeatures.style.display = 'block';
                    }
                } else {
                    this.disableWasmEngine();
                    if (advancedFeatures) {
                        advancedFeatures.style.display = 'none';
                    }
                }
                
                this.updatePerformanceIndicator();
            });
        }

        // Advanced feature toggles
        const featureToggles = [
            'enableOpenThreeDetection',
            'enableClosedFourDetection', 
            'enableDoubleThreeForks',
            'enableThreatLevelAnalysis'
        ];

        featureToggles.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const featureName = id.replace('enable', '').toLowerCase();
                    this.features[featureName.replace('detection', 'Detection')] = e.target.checked;
                    this.updateAnalysisDashboard();
                });
            }
        });
    }

    /**
     * Setup performance indicator
     */
    setupPerformanceIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'performance-indicator';
        indicator.id = 'performanceIndicator';
        document.querySelector('.game-container').appendChild(indicator);
        
        this.updatePerformanceIndicator();
    }

    /**
     * Initialize WASM engine
     */
    async initializeWasmEngine() {
        if (this.isInitialized) return true;

        try {
            console.log('🦀 Initializing WASM engine...');
            
            // Check if GobangGame with WASM capabilities is available
            if (typeof window.GobangGame === 'undefined') {
                throw new Error('GobangGame not available');
            }

            // Try to create WASM-enabled game instance
            this.wasmGame = new window.GobangGame();
            
            // Check if init method exists (WASM version)
            if (typeof this.wasmGame.init === 'function') {
                await this.wasmGame.init();
                this.isInitialized = true;
                console.log('✅ WASM engine initialized successfully');
                
                // Enable WASM checkbox if available
                const enableWasm = document.getElementById('enableWasmEngine');
                if (enableWasm && !enableWasm.checked) {
                    enableWasm.checked = true;
                    this.isWasmEnabled = true;
                }
                
                this.updatePerformanceIndicator();
                return true;
            } else {
                console.log('⚠️ WASM features not available, using JavaScript fallback');
                this.wasmGame = null;
                return false;
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize WASM engine:', error);
            this.wasmGame = null;
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Disable WASM engine
     */
    disableWasmEngine() {
        this.isWasmEnabled = false;
        if (this.wasmGame && typeof this.wasmGame.destroy === 'function') {
            this.wasmGame.destroy();
        }
        this.wasmGame = null;
        this.clearAnalysisDashboard();
        this.updatePerformanceIndicator();
    }

    /**
     * Update analysis dashboard with current game state
     */
    async updateAnalysisDashboard() {
        if (!this.features.moveAnalysis || !this.isWasmEnabled || !this.wasmGame) {
            return;
        }

        const startTime = performance.now();

        try {
            // Sync WASM game state with current UI game state
            await this.syncGameState();

            // Get move analysis from WASM
            const analysis = await this.getMoveAnalysis();
            
            // Update UI elements
            this.updateMoveLists(analysis);
            this.updateThreatPatterns(analysis);
            
            // Update performance metrics
            const analysisTime = performance.now() - startTime;
            this.updatePerformanceMetrics(analysisTime);
            
        } catch (error) {
            console.error('❌ Analysis update failed:', error);
        }
    }

    /**
     * Sync WASM game state with UI game state
     */
    async syncGameState() {
        if (!this.wasmGame || !this.gameUI.game) return;

        // Reset WASM game
        this.wasmGame.newGame();

        // Replay moves from UI game
        const moveHistory = this.gameUI.game.moveHistory || [];
        for (const move of moveHistory) {
            if (this.wasmGame.isEmpty(move.row, move.col)) {
                try {
                    this.wasmGame.makeMove(move.row, move.col);
                } catch (e) {
                    console.warn('Failed to sync move:', move, e);
                }
            }
        }
    }

    /**
     * Get comprehensive move analysis from WASM
     */
    async getMoveAnalysis() {
        if (!this.wasmGame) return {};

        try {
            const analysis = {
                winning: this.wasmGame.getWinningMoves(),
                blocking: this.wasmGame.getBlockingMoves(), 
                dangerous: this.wasmGame.getDangerousMoves(),
                openThree: [],
                closedFour: [],
                doubleForks: []
            };

            // Get advanced features if enabled
            if (this.features.openthreedetection || this.features.openThreeDetection) {
                analysis.openThree = this.wasmGame.getOpenThreeMoves();
            }

            if (this.features.closedFourDetection) {
                analysis.closedFour = this.wasmGame.getClosedFourMoves();
            }

            if (this.features.doubleThreeForks) {
                analysis.doubleForks = this.wasmGame.getDoubleThreeForks();
            }

            return analysis;
            
        } catch (error) {
            console.error('❌ Move analysis failed:', error);
            return {};
        }
    }

    /**
     * Update move lists in dashboard
     */
    updateMoveLists(analysis) {
        const sections = [
            { key: 'winning', listId: 'winningMovesList', countId: 'winningMovesCount', className: 'winning' },
            { key: 'blocking', listId: 'blockingMovesList', countId: 'blockingMovesCount', className: 'blocking' },
            { key: 'dangerous', listId: 'dangerousMovesList', countId: 'dangerousMovesCount', className: 'dangerous' }
        ];

        sections.forEach(section => {
            const moves = analysis[section.key] || [];
            const listElement = document.getElementById(section.listId);
            const countElement = document.getElementById(section.countId);

            if (listElement) {
                if (moves.length > 0) {
                    listElement.innerHTML = moves.map(move => 
                        `<span class="move-chip ${section.className}" data-row="${move.row}" data-col="${move.col}">
                            ${this.positionToNotation(move.row, move.col)}
                        </span>`
                    ).join('');

                    // Add click handlers for move chips
                    listElement.querySelectorAll('.move-chip').forEach(chip => {
                        chip.addEventListener('click', (e) => {
                            const row = parseInt(e.target.dataset.row);
                            const col = parseInt(e.target.dataset.col);
                            this.highlightPosition(row, col);
                        });
                    });
                } else {
                    listElement.textContent = 'Keine verfügbar';
                }
            }

            if (countElement) {
                countElement.textContent = moves.length;
            }
        });
    }

    /**
     * Update threat patterns display
     */
    updateThreatPatterns(analysis) {
        const patterns = [
            { key: 'openThree', countId: 'openThreeCount' },
            { key: 'closedFour', countId: 'closedFourCount' },
            { key: 'doubleForks', countId: 'doubleForksCount' }
        ];

        patterns.forEach(pattern => {
            const moves = analysis[pattern.key] || [];
            const countElement = document.getElementById(pattern.countId);
            
            if (countElement) {
                countElement.textContent = moves.length;
            }
        });
    }

    /**
     * Update threat level visualization on board
     */
    updateThreatLevelVisualization() {
        if (!this.features.threatLevels || !this.wasmGame) {
            this.clearThreatLevels();
            return;
        }

        const board = document.getElementById('gameBoard');
        if (!board) return;

        // Check threat levels for all empty positions
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (this.wasmGame.isEmpty(row, col)) {
                    try {
                        const threatLevel = this.wasmGame.getThreatLevel(row, col);
                        const intersection = board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        
                        if (intersection) {
                            // Clear existing threat level classes
                            intersection.className = intersection.className.replace(/threat-level-\d+/g, '');
                            
                            // Add new threat level class
                            if (threatLevel > 0) {
                                intersection.classList.add(`threat-level-${threatLevel}`);
                            }
                        }
                    } catch (e) {
                        // Skip if threat level analysis fails
                    }
                }
            }
        }
    }

    /**
     * Update pattern highlights on board
     */
    updatePatternHighlights() {
        if (!this.features.patternHighlights) {
            this.clearPatternHighlights();
            return;
        }

        // Implementation for pattern highlights
        // This would highlight specific patterns like open threes, closed fours, etc.
    }

    /**
     * Clear analysis dashboard
     */
    clearAnalysisDashboard() {
        const lists = ['winningMovesList', 'blockingMovesList', 'dangerousMovesList'];
        const counts = ['winningMovesCount', 'blockingMovesCount', 'dangerousMovesCount', 
                       'openThreeCount', 'closedFourCount', 'doubleForksCount'];

        lists.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = 'Keine verfügbar';
        });

        counts.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    }

    /**
     * Clear threat level visualization
     */
    clearThreatLevels() {
        const board = document.getElementById('gameBoard');
        if (board) {
            board.querySelectorAll('.intersection').forEach(intersection => {
                intersection.className = intersection.className.replace(/threat-level-\d+/g, '');
            });
        }
    }

    /**
     * Clear pattern highlights
     */
    clearPatternHighlights() {
        const board = document.getElementById('gameBoard');
        if (board) {
            board.querySelectorAll('.intersection').forEach(intersection => {
                intersection.classList.remove('pattern-open-three', 'pattern-closed-four', 'pattern-double-fork');
            });
        }
    }

    /**
     * Update performance indicator
     */
    updatePerformanceIndicator() {
        const indicator = document.getElementById('performanceIndicator');
        if (!indicator) return;

        if (this.isWasmEnabled && this.isInitialized) {
            indicator.textContent = `🦀 WASM Engine (${this.performanceMetrics.averageAnalysisTime.toFixed(1)}ms)`;
            indicator.className = 'performance-indicator wasm-active';
        } else {
            indicator.textContent = '📝 JavaScript Engine';
            indicator.className = 'performance-indicator js-active';
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(analysisTime) {
        this.performanceMetrics.lastAnalysisTime = analysisTime;
        this.performanceMetrics.analysisCount++;
        
        // Calculate rolling average
        const alpha = 0.1; // Smoothing factor
        if (this.performanceMetrics.averageAnalysisTime === 0) {
            this.performanceMetrics.averageAnalysisTime = analysisTime;
        } else {
            this.performanceMetrics.averageAnalysisTime = 
                (1 - alpha) * this.performanceMetrics.averageAnalysisTime + alpha * analysisTime;
        }
        
        this.updatePerformanceIndicator();
    }

    /**
     * Highlight a specific position on the board
     */
    highlightPosition(row, col) {
        const board = document.getElementById('gameBoard');
        if (!board) return;

        // Clear existing highlights
        board.querySelectorAll('.intersection.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });

        // Highlight selected position
        const intersection = board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (intersection) {
            intersection.classList.add('highlighted');
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
                intersection.classList.remove('highlighted');
            }, 2000);
        }
    }

    /**
     * Convert position to board notation (A1-O15)
     */
    positionToNotation(row, col) {
        const colLetter = String.fromCharCode(65 + col); // A-O
        const rowNumber = 15 - row; // 15-1
        return `${colLetter}${rowNumber}`;
    }

    /**
     * Handle game events
     */
    onGameEvent(eventType, data) {
        switch (eventType) {
            case 'moveMade':
            case 'moveUndone':
            case 'gameReset':
                if (this.features.moveAnalysis) {
                    // Delay analysis slightly to ensure UI is updated
                    setTimeout(() => this.updateAnalysisDashboard(), 100);
                }
                break;
        }
    }

    /**
     * Get current engine status
     */
    getEngineStatus() {
        return {
            isWasmEnabled: this.isWasmEnabled,
            isInitialized: this.isInitialized,
            features: this.features,
            performanceMetrics: this.performanceMetrics
        };
    }
}

// Export for use in other modules
window.WasmGobangIntegration = WasmGobangIntegration;