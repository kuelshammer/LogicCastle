/**
 * TrioBoardRenderer - Visual Board Rendering for Trio
 * 
 * Adapted from Connect4/Gomoku BoardRenderer for Trio 7×7 grid.
 * Implements Connect4 Goldstandard Hybrid CSS Pattern: 
 * Tailwind CSS for static UI + inline CSS for dynamic elements.
 * 
 * Features:
 * - Modern Tailwind CSS grid system for 7×7 board
 * - Glassmorphism styling with trio-themed colors
 * - Responsive design with mobile/tablet optimization
 * - Dynamic number rendering with calculation highlighting
 * - Premium visual effects for selections and solutions
 * - Accessibility support with ARIA labels
 */

export class TrioBoardRenderer {
    constructor(gameBoard) {
        this.gameBoard = gameBoard;
        
        // Rendering configuration
        this.cellSize = 60; // Base cell size in pixels
        this.cellGap = 4; // Gap between cells
        this.borderRadius = 8; // Cell border radius
        
        // Color themes for trio numbers and effects
        this.trioTheme = {
            // Number ranges with distinct colors
            range1: { // 1-14
                background: 'rgba(239, 68, 68, 0.15)', // red-500 
                border: '2px solid rgba(239, 68, 68, 0.4)',
                text: '#DC2626', // red-600
                glow: '0 0 8px rgba(239, 68, 68, 0.3)'
            },
            range2: { // 15-28
                background: 'rgba(59, 130, 246, 0.15)', // blue-500
                border: '2px solid rgba(59, 130, 246, 0.4)', 
                text: '#2563EB', // blue-600
                glow: '0 0 8px rgba(59, 130, 246, 0.3)'
            },
            range3: { // 29-42
                background: 'rgba(16, 185, 129, 0.15)', // emerald-500
                border: '2px solid rgba(16, 185, 129, 0.4)',
                text: '#059669', // emerald-600
                glow: '0 0 8px rgba(16, 185, 129, 0.3)'
            },
            range4: { // 43-49
                background: 'rgba(245, 158, 11, 0.15)', // amber-500
                border: '2px solid rgba(245, 158, 11, 0.4)',
                text: '#D97706', // amber-600
                glow: '0 0 8px rgba(245, 158, 11, 0.3)'
            },
            // Special states
            selected: {
                background: 'rgba(139, 69, 19, 0.25)', // brown theme
                border: '3px solid rgba(139, 69, 19, 0.6)',
                text: '#8B4513',
                glow: '0 0 12px rgba(139, 69, 19, 0.5)'
            },
            solution: {
                background: 'rgba(34, 197, 94, 0.3)', // green celebration
                border: '3px solid rgba(34, 197, 94, 0.7)',
                text: '#15803D', // green-700
                glow: '0 0 16px rgba(34, 197, 94, 0.6)'
            }
        };
        
        // Board state
        this.currentBoard = null;
        this.selectedCells = new Set();
        
        // Initialize renderer
        this.initializeBoardRenderer();
        
        console.log('🎨 TrioBoardRenderer initialized');
    }

    /**
     * Initialize board renderer
     * @private
     */
    initializeBoardRenderer() {
        if (!this.gameBoard) {
            console.error('❌ Game board element not found');
            return;
        }
        
        // Apply Tailwind CSS grid styling
        this.gameBoard.style.cssText = `
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            grid-template-rows: repeat(7, 1fr) !important;
            gap: ${this.cellGap}px !important;
            padding: 20px !important;
            margin: 0 auto !important;
            border-radius: 16px !important;
            backdrop-filter: blur(16px) saturate(180%) !important;
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.2), rgba(101, 67, 33, 0.15)) !important;
            border: 2px solid rgba(139, 69, 19, 0.3) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
            max-width: 500px !important;
            aspect-ratio: 1 !important;
            position: relative !important;
        `;
        
        // Add responsive scaling
        this.setupResponsiveDesign();
        
        // Create empty board structure
        this.createEmptyBoard();
    }

    /**
     * Setup responsive design for different screen sizes
     * @private
     */
    setupResponsiveDesign() {
        // Create responsive styles
        const style = document.createElement('style');
        style.id = 'trio-board-responsive';
        style.textContent = `
            /* Mobile optimization */
            @media (max-width: 640px) {
                .trio-game-board {
                    max-width: 350px !important;
                    padding: 15px !important;
                    gap: 3px !important;
                }
                .trio-cell {
                    min-height: 45px !important;
                    font-size: 0.875rem !important;
                }
            }
            
            /* Tablet optimization */
            @media (min-width: 641px) and (max-width: 1024px) {
                .trio-game-board {
                    max-width: 450px !important;
                    padding: 18px !important;
                }
            }
            
            /* Desktop optimization */
            @media (min-width: 1025px) {
                .trio-game-board {
                    max-width: 500px !important;
                    padding: 20px !important;
                }
            }
        `;
        
        // Remove existing responsive styles if present
        const existingStyle = document.getElementById('trio-board-responsive');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }

    /**
     * Create empty 7×7 board structure
     * @private
     */
    createEmptyBoard() {
        // Clear existing board
        this.gameBoard.innerHTML = '';
        
        // Add CSS class for styling
        this.gameBoard.className = 'trio-game-board';
        
        // Create 49 cells (7×7 grid)
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = this.createCell(row, col);
                this.gameBoard.appendChild(cell);
            }
        }
        
        console.log('🎨 Empty 7×7 board created');
    }

    /**
     * Create individual cell element
     * @private
     */
    createCell(row, col) {
        const cell = document.createElement('div');
        
        // Set data attributes for identification
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.cellId = `${row}-${col}`;
        
        // Base cell styling with glassmorphism
        cell.style.cssText = `
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: ${this.cellSize}px !important;
            border-radius: ${this.borderRadius}px !important;
            backdrop-filter: blur(8px) saturate(120%) !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border: 2px solid rgba(255, 255, 255, 0.2) !important;
            cursor: pointer !important;
            font-family: 'SF Pro Display', system-ui, sans-serif !important;
            font-size: 1rem !important;
            font-weight: 600 !important;
            color: #374151 !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            user-select: none !important;
            position: relative !important;
            overflow: hidden !important;
        `;
        
        // Add CSS classes
        cell.className = 'trio-cell';
        
        // Accessibility attributes
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('tabindex', '-1');
        cell.setAttribute('aria-label', `Cell row ${row + 1}, column ${col + 1}`);
        
        // Hover effects
        this.addHoverEffects(cell);
        
        return cell;
    }

    /**
     * Add hover effects to cell
     * @private
     */
    addHoverEffects(cell) {
        cell.addEventListener('mouseenter', () => {
            if (!cell.classList.contains('trio-selected')) {
                cell.style.background = 'rgba(255, 255, 255, 0.2) !important';
                cell.style.borderColor = 'rgba(255, 255, 255, 0.4) !important';
                cell.style.transform = 'scale(1.05) !important';
                cell.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15) !important';
            }
        });
        
        cell.addEventListener('mouseleave', () => {
            if (!cell.classList.contains('trio-selected')) {
                cell.style.background = 'rgba(255, 255, 255, 0.1) !important';
                cell.style.borderColor = 'rgba(255, 255, 255, 0.2) !important';
                cell.style.transform = 'scale(1) !important';
                cell.style.boxShadow = 'none !important';
            }
        });
    }

    /**
     * Render board with numbers from backend
     */
    renderBoard(boardData) {
        if (!boardData || !Array.isArray(boardData)) {
            console.error('❌ Invalid board data provided');
            return;
        }
        
        this.currentBoard = boardData;
        
        // Render each cell with its number
        boardData.forEach((row, rowIndex) => {
            row.forEach((number, colIndex) => {
                const cell = this.getCellAt(rowIndex, colIndex);
                if (cell) {
                    this.updateCellDisplay(cell, number);
                }
            });
        });
        
        console.log('🎨 Board rendered with new numbers');
    }

    /**
     * Update individual cell display
     * @private
     */
    updateCellDisplay(cell, number) {
        // Clear existing content and styles
        cell.textContent = number;
        
        // Get theme based on number range
        const theme = this.getNumberTheme(number);
        
        // Apply number-specific styling
        cell.style.background = theme.background + ' !important';
        cell.style.border = theme.border + ' !important';
        cell.style.color = theme.text + ' !important';
        cell.style.boxShadow = theme.glow + ' !important';
        
        // Update accessibility label
        const row = parseInt(cell.dataset.row) + 1;
        const col = parseInt(cell.dataset.col) + 1;
        cell.setAttribute('aria-label', `Cell row ${row}, column ${col}, number ${number}`);
    }

    /**
     * Get theme for number based on range
     * @private
     */
    getNumberTheme(number) {
        if (number >= 1 && number <= 14) {
            return this.trioTheme.range1;
        } else if (number >= 15 && number <= 28) {
            return this.trioTheme.range2;
        } else if (number >= 29 && number <= 42) {
            return this.trioTheme.range3;
        } else if (number >= 43 && number <= 49) {
            return this.trioTheme.range4;
        }
        
        // Default fallback
        return this.trioTheme.range1;
    }

    /**
     * Highlight cell as selected
     */
    selectCell(row, col, selected = true) {
        const cell = this.getCellAt(row, col);
        if (!cell) return;
        
        if (selected) {
            cell.classList.add('trio-selected');
            this.selectedCells.add(`${row}-${col}`);
            
            // Apply selection styling
            const theme = this.trioTheme.selected;
            cell.style.background = theme.background + ' !important';
            cell.style.border = theme.border + ' !important';
            cell.style.color = theme.text + ' !important';
            cell.style.boxShadow = theme.glow + ' !important';
            cell.style.transform = 'scale(1.1) !important';
        } else {
            cell.classList.remove('trio-selected');
            this.selectedCells.delete(`${row}-${col}`);
            
            // Restore original number styling
            const number = parseInt(cell.textContent);
            const theme = this.getNumberTheme(number);
            cell.style.background = theme.background + ' !important';
            cell.style.border = theme.border + ' !important';
            cell.style.color = theme.text + ' !important';
            cell.style.boxShadow = theme.glow + ' !important';
            cell.style.transform = 'scale(1) !important';
        }
        
        console.log(`🎨 Cell (${row}, ${col}) ${selected ? 'selected' : 'deselected'}`);
    }

    /**
     * Highlight solved trio
     */
    highlightSolution(positions, calculation) {
        if (!positions || positions.length !== 3) return;
        
        positions.forEach((pos, index) => {
            const cell = this.getCellAt(pos.row, pos.col);
            if (cell) {
                // Add solution styling with stagger
                setTimeout(() => {
                    cell.classList.add('trio-solution');
                    
                    const theme = this.trioTheme.solution;
                    cell.style.background = theme.background + ' !important';
                    cell.style.border = theme.border + ' !important';
                    cell.style.color = theme.text + ' !important';
                    cell.style.boxShadow = theme.glow + ' !important';
                    cell.style.transform = 'scale(1.15) !important';
                    
                }, index * 150);
            }
        });
        
        console.log(`🎨 Highlighted solution: ${calculation}`);
    }

    /**
     * Clear all selection highlights
     */
    clearAllSelections() {
        this.selectedCells.forEach(cellId => {
            const [row, col] = cellId.split('-').map(Number);
            this.selectCell(row, col, false);
        });
        
        this.selectedCells.clear();
        console.log('🧹 All selections cleared');
    }

    /**
     * Clear all visual effects
     */
    clearAllEffects() {
        const cells = this.gameBoard.querySelectorAll('.trio-cell');
        
        cells.forEach(cell => {
            // Remove effect classes
            cell.classList.remove('trio-selected', 'trio-solution', 'trio-invalid', 'trio-victory-highlight');
            
            // Restore original styling based on number
            const number = parseInt(cell.textContent);
            if (!isNaN(number)) {
                this.updateCellDisplay(cell, number);
            }
            
            // Reset transform
            cell.style.transform = 'scale(1) !important';
        });
        
        this.selectedCells.clear();
        console.log('🧹 All visual effects cleared');
    }

    /**
     * Get cell element at position
     */
    getCellAt(row, col) {
        return this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Get current board state
     */
    getCurrentBoard() {
        return this.currentBoard;
    }

    /**
     * Get selected cells
     */
    getSelectedCells() {
        return Array.from(this.selectedCells).map(cellId => {
            const [row, col] = cellId.split('-').map(Number);
            return { row, col };
        });
    }

    /**
     * Check if cell is selected
     */
    isCellSelected(row, col) {
        return this.selectedCells.has(`${row}-${col}`);
    }

    /**
     * Update theme colors
     */
    updateTheme(newTheme) {
        Object.assign(this.trioTheme, newTheme);
        
        // Re-render board with new theme
        if (this.currentBoard) {
            this.renderBoard(this.currentBoard);
        }
        
        console.log('🎨 Theme updated');
    }

    /**
     * Set cell size for responsive design
     */
    setCellSize(size) {
        this.cellSize = Math.max(30, Math.min(80, size));
        
        // Update all cells
        const cells = this.gameBoard.querySelectorAll('.trio-cell');
        cells.forEach(cell => {
            cell.style.minHeight = `${this.cellSize}px !important`;
        });
        
        console.log(`🎨 Cell size updated to ${this.cellSize}px`);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Responsive cell sizing based on viewport
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        
        if (vw <= 640) { // Mobile
            this.setCellSize(45);
        } else if (vw <= 1024) { // Tablet  
            this.setCellSize(55);
        } else { // Desktop
            this.setCellSize(60);
        }
    }

    /**
     * Get renderer status
     */
    getStatus() {
        return {
            boardLoaded: !!this.currentBoard,
            selectedCells: this.selectedCells.size,
            cellSize: this.cellSize,
            gridSize: '7x7'
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Clear board
        if (this.gameBoard) {
            this.gameBoard.innerHTML = '';
        }
        
        // Remove responsive styles
        const style = document.getElementById('trio-board-responsive');
        if (style) {
            style.remove();
        }
        
        // Clear state
        this.currentBoard = null;
        this.selectedCells.clear();
        this.gameBoard = null;
        
        console.log('🎨 TrioBoardRenderer destroyed');
    }
}

export default TrioBoardRenderer;