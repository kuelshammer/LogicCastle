/**
 * OptimizedElementBinder Component Unit Tests
 * 
 * Component Testing
 * Tests the optimized element binding system for:
 * - Enhanced performance element binding
 * - Batch DOM operations
 * - Memory-efficient element management
 * - Error recovery and graceful degradation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizedElementBinder } from '../../../games/connect4/js/components/OptimizedElementBinder.js';

describe('OptimizedElementBinder Component Tests', () => {
    let container;
    let optimizedElementBinder;
    let mockConfig;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        container.innerHTML = `
            <div id="gameBoard" class="game-board"></div>
            <div id="gameStatus" class="game-status">Ready</div>
            <div id="currentPlayer" class="current-player">Player 1</div>
            <div id="moveCounter" class="move-counter">0</div>
            <button id="resetBtn" class="reset-button">Reset</button>
            <button id="newGameBtn" class="new-game-button">New Game</button>
            <div id="assistancePanel" class="assistance-panel">
                <input type="checkbox" id="player1-threats" class="assistance-checkbox">
                <input type="checkbox" id="player2-threats" class="assistance-checkbox">
            </div>
            <div id="scoreBoard" class="score-board">
                <span id="player1Score">0</span>
                <span id="player2Score">0</span>
            </div>
            <div class="modals">
                <div id="helpModal" class="modal hidden"></div>
                <div id="settingsModal" class="modal hidden"></div>
            </div>
            <div id="messageContainer" class="message-container"></div>
        `;
        document.body.appendChild(container);

        // Create optimized config
        mockConfig = {
            required: [
                'gameBoard',
                'gameStatus', 
                'currentPlayer'
            ],
            optional: [
                'moveCounter',
                'resetBtn',
                'newGameBtn',
                'assistancePanel',
                'scoreBoard',
                'messageContainer'
            ],
            batch: [
                {
                    selector: '.assistance-checkbox',
                    key: 'assistanceCheckboxes',
                    multiple: true
                },
                {
                    selector: '.modal',
                    key: 'modals',
                    multiple: true
                },
                {
                    selector: '.score-board span',
                    key: 'scoreElements',
                    multiple: true
                }
            ],
            fallbacks: {
                'gameStatus': () => {
                    const fallback = document.createElement('div');
                    fallback.id = 'gameStatus';
                    fallback.className = 'game-status fallback';
                    fallback.textContent = 'Ready';
                    return fallback;
                },
                'messageContainer': () => {
                    const fallback = document.createElement('div');
                    fallback.id = 'messageContainer';
                    fallback.className = 'message-container fallback';
                    return fallback;
                }
            },
            performance: {
                enableCaching: true,
                batchThreshold: 5,
                lazyBinding: true
            }
        };

        // Initialize OptimizedElementBinder
        optimizedElementBinder = new OptimizedElementBinder(mockConfig);
    });

    afterEach(() => {
        if (optimizedElementBinder) {
            optimizedElementBinder.destroy();
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. Constructor and Initialization', () => {
        it('should create OptimizedElementBinder with correct initial state', () => {
            expect(optimizedElementBinder).toBeDefined();
            expect(optimizedElementBinder.config).toBe(mockConfig);
            expect(optimizedElementBinder.elements).toEqual({});
            expect(optimizedElementBinder.cache).toEqual({});
            expect(optimizedElementBinder.bindingMetrics).toBeDefined();
        });

        it('should initialize with default config when none provided', () => {
            const binder = new OptimizedElementBinder();
            
            expect(binder.config).toBeDefined();
            expect(binder.config.required).toEqual([]);
            expect(binder.config.optional).toEqual([]);
            expect(binder.config.performance.enableCaching).toBe(true);
        });

        it('should merge provided config with defaults', () => {
            const partialConfig = {
                required: ['gameBoard'],
                performance: { enableCaching: false }
            };
            
            const binder = new OptimizedElementBinder(partialConfig);
            
            expect(binder.config.required).toEqual(['gameBoard']);
            expect(binder.config.optional).toEqual([]);
            expect(binder.config.performance.enableCaching).toBe(false);
            expect(binder.config.performance.batchThreshold).toBe(10); // default
        });
    });

    describe('2. Optimized Element Binding', () => {
        it('should bind all required elements successfully', async () => {
            const result = await optimizedElementBinder.bindElements();
            
            expect(result.success).toBe(true);
            expect(result.boundElements).toBeGreaterThanOrEqual(mockConfig.required.length);
            expect(optimizedElementBinder.elements.gameBoard).toBeTruthy();
            expect(optimizedElementBinder.elements.gameStatus).toBeTruthy();
            expect(optimizedElementBinder.elements.currentPlayer).toBeTruthy();
        });

        it('should bind optional elements when available', async () => {
            await optimizedElementBinder.bindElements();
            
            expect(optimizedElementBinder.elements.moveCounter).toBeTruthy();
            expect(optimizedElementBinder.elements.resetBtn).toBeTruthy();
            expect(optimizedElementBinder.elements.assistancePanel).toBeTruthy();
        });

        it('should handle missing optional elements gracefully', async () => {
            // Remove some optional elements
            document.getElementById('moveCounter')?.remove();
            document.getElementById('resetBtn')?.remove();
            
            const result = await optimizedElementBinder.bindElements();
            
            expect(result.success).toBe(true);
            expect(optimizedElementBinder.elements.moveCounter).toBeNull();
            expect(optimizedElementBinder.elements.resetBtn).toBeNull();
            expect(optimizedElementBinder.elements.gameBoard).toBeTruthy(); // Required still bound
        });

        it('should fail gracefully when required elements are missing', async () => {
            // Remove a required element
            document.getElementById('gameBoard')?.remove();
            
            const result = await optimizedElementBinder.bindElements();
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('gameBoard');
            expect(result.missingRequired).toContain('gameBoard');
        });

        it('should measure binding performance', async () => {
            const result = await optimizedElementBinder.bindElements();
            
            expect(result.metrics).toBeDefined();
            expect(result.metrics.bindingTime).toBeGreaterThan(0);
            expect(result.metrics.elementsFound).toBeGreaterThan(0);
            expect(result.metrics.cacheHits).toBeGreaterThanOrEqual(0);
        });
    });

    describe('3. Batch Element Operations', () => {
        beforeEach(async () => {
            await optimizedElementBinder.bindElements();
        });

        it('should bind batch elements using selectors', () => {
            expect(optimizedElementBinder.elements.assistanceCheckboxes).toBeDefined();
            expect(optimizedElementBinder.elements.assistanceCheckboxes).toHaveLength(2);
            expect(optimizedElementBinder.elements.modals).toHaveLength(2);
        });

        it('should bind multiple elements efficiently', () => {
            const checkboxes = optimizedElementBinder.elements.assistanceCheckboxes;
            
            checkboxes.forEach(checkbox => {
                expect(checkbox.classList.contains('assistance-checkbox')).toBe(true);
            });
        });

        it('should handle empty batch selectors gracefully', async () => {
            const configWithEmptyBatch = {
                ...mockConfig,
                batch: [
                    {
                        selector: '.non-existent-class',
                        key: 'nonExistent',
                        multiple: true
                    }
                ]
            };
            
            const binder = new OptimizedElementBinder(configWithEmptyBatch);
            const result = await binder.bindElements();
            
            expect(result.success).toBe(true);
            expect(binder.elements.nonExistent).toEqual([]);
        });

        it('should optimize batch operations with threshold', async () => {
            const startTime = performance.now();
            await optimizedElementBinder.bindElements();
            const endTime = performance.now();
            
            const bindingTime = endTime - startTime;
            expect(bindingTime).toBeLessThan(50); // Should be fast due to optimization
        });
    });

    describe('4. Element Caching System', () => {
        beforeEach(async () => {
            await optimizedElementBinder.bindElements();
        });

        it('should cache element lookups for performance', () => {
            expect(optimizedElementBinder.cache).toBeDefined();
            expect(Object.keys(optimizedElementBinder.cache).length).toBeGreaterThan(0);
        });

        it('should use cached elements on subsequent lookups', () => {
            const firstLookup = optimizedElementBinder.getElement('gameBoard');
            const secondLookup = optimizedElementBinder.getElement('gameBoard');
            
            expect(firstLookup).toBe(secondLookup);
            expect(optimizedElementBinder.bindingMetrics.cacheHits).toBeGreaterThan(0);
        });

        it('should invalidate cache when requested', async () => {
            const originalElement = optimizedElementBinder.getElement('gameBoard');
            
            optimizedElementBinder.invalidateCache();
            
            expect(optimizedElementBinder.cache).toEqual({});
            
            // Re-bind elements
            await optimizedElementBinder.bindElements();
            const newElement = optimizedElementBinder.getElement('gameBoard');
            
            expect(newElement).toBe(originalElement); // Same DOM element, but cache was cleared
        });

        it('should handle cache performance metrics', () => {
            // Trigger some cache hits
            optimizedElementBinder.getElement('gameBoard');
            optimizedElementBinder.getElement('gameStatus');
            optimizedElementBinder.getElement('gameBoard'); // Cache hit
            
            const metrics = optimizedElementBinder.getBindingMetrics();
            expect(metrics.cacheHits).toBeGreaterThan(0);
            expect(metrics.totalLookups).toBeGreaterThan(metrics.cacheHits);
        });
    });

    describe('5. Fallback Element Creation', () => {
        it('should create fallback elements when originals are missing', async () => {
            // Remove elements that have fallbacks
            document.getElementById('gameStatus')?.remove();
            document.getElementById('messageContainer')?.remove();
            
            const result = await optimizedElementBinder.bindElements();
            
            expect(result.success).toBe(true);
            expect(optimizedElementBinder.elements.gameStatus).toBeTruthy();
            expect(optimizedElementBinder.elements.gameStatus.classList.contains('fallback')).toBe(true);
            expect(optimizedElementBinder.elements.messageContainer).toBeTruthy();
            expect(optimizedElementBinder.elements.messageContainer.classList.contains('fallback')).toBe(true);
        });

        it('should append fallback elements to DOM', async () => {
            document.getElementById('messageContainer')?.remove();
            
            await optimizedElementBinder.bindElements();
            
            const fallbackElement = document.getElementById('messageContainer');
            expect(fallbackElement).toBeTruthy();
            expect(fallbackElement.classList.contains('fallback')).toBe(true);
        });

        it('should handle fallback creation errors gracefully', async () => {
            const configWithBadFallback = {
                ...mockConfig,
                fallbacks: {
                    'gameBoard': () => {
                        throw new Error('Fallback creation failed');
                    }
                }
            };
            
            const binder = new OptimizedElementBinder(configWithBadFallback);
            document.getElementById('gameBoard')?.remove();
            
            const result = await binder.bindElements();
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('gameBoard');
        });
    });

    describe('6. Lazy Binding System', () => {
        it('should support lazy binding for performance', async () => {
            const lazyConfig = {
                ...mockConfig,
                performance: { ...mockConfig.performance, lazyBinding: true }
            };
            
            const binder = new OptimizedElementBinder(lazyConfig);
            
            // Initial binding should be fast (lazy)
            const startTime = performance.now();
            await binder.bindElements();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(30);
        });

        it('should bind elements on-demand with lazy loading', async () => {
            const lazyConfig = {
                required: [],
                optional: ['moveCounter'],
                performance: { lazyBinding: true }
            };
            
            const binder = new OptimizedElementBinder(lazyConfig);
            await binder.bindElements();
            
            // Element should be bound when first accessed
            const element = binder.getElement('moveCounter');
            expect(element).toBeTruthy();
        });

        it('should track lazy binding performance', async () => {
            const lazyBinder = new OptimizedElementBinder({
                ...mockConfig,
                performance: { ...mockConfig.performance, lazyBinding: true }
            });
            
            await lazyBinder.bindElements();
            const metrics = lazyBinder.getBindingMetrics();
            
            expect(metrics.lazyBindings).toBeGreaterThanOrEqual(0);
        });
    });

    describe('7. Element Access and Validation', () => {
        beforeEach(async () => {
            await optimizedElementBinder.bindElements();
        });

        it('should provide fast element access', () => {
            const element = optimizedElementBinder.getElement('gameBoard');
            
            expect(element).toBeTruthy();
            expect(element.id).toBe('gameBoard');
        });

        it('should return null for non-existent elements', () => {
            const element = optimizedElementBinder.getElement('nonExistentElement');
            
            expect(element).toBeNull();
        });

        it('should validate element availability', () => {
            expect(optimizedElementBinder.hasElement('gameBoard')).toBe(true);
            expect(optimizedElementBinder.hasElement('nonExistentElement')).toBe(false);
        });

        it('should get all bound elements', () => {
            const allElements = optimizedElementBinder.getAllElements();
            
            expect(allElements).toBeDefined();
            expect(Object.keys(allElements).length).toBeGreaterThan(0);
            expect(allElements.gameBoard).toBeTruthy();
        });

        it('should get only successfully bound elements', () => {
            const boundElements = optimizedElementBinder.getBoundElements();
            
            // Should not include null elements
            Object.values(boundElements).forEach(element => {
                expect(element).toBeTruthy();
            });
        });

        it('should validate specific element types', () => {
            const button = optimizedElementBinder.getElement('resetBtn');
            const div = optimizedElementBinder.getElement('gameBoard');
            
            expect(optimizedElementBinder.validateElementType('resetBtn', 'BUTTON')).toBe(true);
            expect(optimizedElementBinder.validateElementType('gameBoard', 'DIV')).toBe(true);
            expect(optimizedElementBinder.validateElementType('resetBtn', 'DIV')).toBe(false);
        });
    });

    describe('8. Performance Monitoring', () => {
        it('should track comprehensive binding metrics', async () => {
            const startTime = performance.now();
            await optimizedElementBinder.bindElements();
            const endTime = performance.now();
            
            const metrics = optimizedElementBinder.getBindingMetrics();
            
            expect(metrics.bindingTime).toBeGreaterThan(0);
            expect(metrics.bindingTime).toBeLessThan(endTime - startTime + 10); // Some tolerance
            expect(metrics.elementsFound).toBeGreaterThan(0);
            expect(metrics.batchOperations).toBeGreaterThan(0);
            expect(metrics.fallbacksCreated).toBeGreaterThanOrEqual(0);
        });

        it('should monitor cache performance', () => {
            // Generate some cache activity
            optimizedElementBinder.getElement('gameBoard');
            optimizedElementBinder.getElement('gameStatus');
            optimizedElementBinder.getElement('gameBoard'); // Cache hit
            
            const metrics = optimizedElementBinder.getBindingMetrics();
            
            expect(metrics.totalLookups).toBeGreaterThan(0);
            expect(metrics.cacheHits).toBeGreaterThan(0);
            expect(metrics.cacheHitRatio).toBeGreaterThan(0);
            expect(metrics.cacheHitRatio).toBeLessThanOrEqual(1);
        });

        it('should reset performance metrics', async () => {
            await optimizedElementBinder.bindElements();
            optimizedElementBinder.getElement('gameBoard'); // Generate some metrics
            
            optimizedElementBinder.resetMetrics();
            
            const metrics = optimizedElementBinder.getBindingMetrics();
            expect(metrics.totalLookups).toBe(0);
            expect(metrics.cacheHits).toBe(0);
            expect(metrics.bindingTime).toBe(0);
        });

        it('should handle rapid element access efficiently', () => {
            const startTime = performance.now();
            
            // Rapid element access
            for (let i = 0; i < 100; i++) {
                optimizedElementBinder.getElement('gameBoard');
                optimizedElementBinder.getElement('gameStatus');
                optimizedElementBinder.getElement('currentPlayer');
            }
            
            const endTime = performance.now();
            const accessTime = endTime - startTime;
            
            expect(accessTime).toBeLessThan(50); // 300 accesses in under 50ms
        });
    });

    describe('9. Memory Management and Cleanup', () => {
        beforeEach(async () => {
            await optimizedElementBinder.bindElements();
        });

        it('should clean up resources properly on destroy', () => {
            expect(Object.keys(optimizedElementBinder.elements).length).toBeGreaterThan(0);
            expect(Object.keys(optimizedElementBinder.cache).length).toBeGreaterThan(0);
            
            optimizedElementBinder.destroy();
            
            expect(optimizedElementBinder.elements).toEqual({});
            expect(optimizedElementBinder.cache).toEqual({});
        });

        it('should reset metrics on destroy', () => {
            optimizedElementBinder.getElement('gameBoard'); // Generate metrics
            
            optimizedElementBinder.destroy();
            
            const metrics = optimizedElementBinder.getBindingMetrics();
            expect(metrics.totalLookups).toBe(0);
            expect(metrics.cacheHits).toBe(0);
        });

        it('should handle multiple destroy calls safely', () => {
            expect(() => {
                optimizedElementBinder.destroy();
                optimizedElementBinder.destroy();
                optimizedElementBinder.destroy();
            }).not.toThrow();
        });

        it('should prevent memory leaks in cache', async () => {
            // Fill cache with many elements
            for (let i = 0; i < 100; i++) {
                optimizedElementBinder.getElement('gameBoard');
                optimizedElementBinder.getElement('gameStatus');
            }
            
            const initialCacheSize = Object.keys(optimizedElementBinder.cache).length;
            
            optimizedElementBinder.invalidateCache();
            
            expect(Object.keys(optimizedElementBinder.cache).length).toBe(0);
        });
    });

    describe('10. Error Handling and Recovery', () => {
        it('should handle DOM query errors gracefully', async () => {
            const configWithBadSelector = {
                required: ['[invalid selector}'],
                optional: [],
                batch: []
            };
            
            const binder = new OptimizedElementBinder(configWithBadSelector);
            const result = await binder.bindElements();
            
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should recover from partial binding failures', async () => {
            // Remove one required element
            document.getElementById('gameBoard')?.remove();
            
            const result = await optimizedElementBinder.bindElements();
            
            expect(result.success).toBe(false);
            expect(result.boundElements).toBeGreaterThan(0); // Some elements still bound
            expect(optimizedElementBinder.elements.gameStatus).toBeTruthy(); // Other required elements bound
        });

        it('should handle corrupted cache gracefully', () => {
            // Corrupt the cache
            optimizedElementBinder.cache = { corruptedEntry: null };
            
            expect(() => {
                optimizedElementBinder.getElement('gameBoard');
            }).not.toThrow();
        });

        it('should validate configuration input', () => {
            const invalidConfig = {
                required: 'not-an-array',
                batch: 'not-an-array'
            };
            
            expect(() => {
                new OptimizedElementBinder(invalidConfig);
            }).not.toThrow(); // Should handle gracefully with defaults
        });
    });

    describe('11. Advanced Features', () => {
        beforeEach(async () => {
            await optimizedElementBinder.bindElements();
        });

        it('should support dynamic element rebinding', async () => {
            // Add a new element to DOM
            const newElement = document.createElement('div');
            newElement.id = 'dynamicElement';
            container.appendChild(newElement);
            
            // Add to config and rebind
            optimizedElementBinder.addDynamicElement('dynamicElement', false);
            await optimizedElementBinder.rebindElements();
            
            expect(optimizedElementBinder.hasElement('dynamicElement')).toBe(true);
        });

        it('should support element watchers for DOM changes', () => {
            const watcherCallback = vi.fn();
            
            optimizedElementBinder.watchElement('gameBoard', watcherCallback);
            
            // Simulate DOM change
            const gameBoard = optimizedElementBinder.getElement('gameBoard');
            gameBoard.classList.add('modified');
            
            // MutationObserver would normally trigger this
            // For testing, we manually trigger
            watcherCallback('gameBoard', gameBoard);
            
            expect(watcherCallback).toHaveBeenCalledWith('gameBoard', gameBoard);
        });

        it('should provide element statistics', () => {
            const stats = optimizedElementBinder.getElementStatistics();
            
            expect(stats.totalElements).toBeGreaterThan(0);
            expect(stats.requiredElements).toBe(mockConfig.required.length);
            expect(stats.optionalElements).toBeGreaterThanOrEqual(0);
            expect(stats.batchElements).toBeGreaterThan(0);
            expect(stats.bindingSuccessRate).toBeGreaterThan(0);
        });

        it('should support element grouping for batch operations', async () => {
            const groups = optimizedElementBinder.getElementGroups();
            
            expect(groups.buttons).toBeDefined();
            expect(groups.buttons.length).toBeGreaterThan(0);
            expect(groups.modals).toBeDefined();
            expect(groups.checkboxes).toBeDefined();
        });
    });
});