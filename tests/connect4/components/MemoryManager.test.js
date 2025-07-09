/**
 * MemoryManager Component Unit Tests
 * 
 * Component Testing
 * Tests the comprehensive memory management system for:
 * - Event listener tracking and cleanup
 * - WASM instance memory management
 * - Component lifecycle management
 * - Memory leak prevention and detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryManager } from '../../../games/connect4/js/components/MemoryManager.js';

describe('MemoryManager Component Tests', () => {
    let container;
    let memoryManager;
    let mockWasmInstance;
    let mockComponent;

    beforeEach(() => {
        // Create test DOM structure
        container = document.createElement('div');
        container.innerHTML = `
            <div id="testContainer">
                <button id="testBtn1">Button 1</button>
                <button id="testBtn2">Button 2</button>
                <div id="testDiv">Test Div</div>
                <input id="testInput" type="text">
                <canvas id="testCanvas"></canvas>
            </div>
        `;
        document.body.appendChild(container);

        // Create mock WASM instance
        mockWasmInstance = {
            free: vi.fn(),
            memory: {
                buffer: new ArrayBuffer(1024)
            },
            exports: {
                cleanup: vi.fn(),
                get_memory_usage: vi.fn(() => 512)
            }
        };

        // Create mock component
        mockComponent = {
            destroy: vi.fn(),
            cleanup: vi.fn(),
            name: 'TestComponent',
            isDestroyed: false
        };

        // Initialize MemoryManager
        memoryManager = new MemoryManager();
    });

    afterEach(() => {
        if (memoryManager) {
            memoryManager.destroy();
        }
        document.body.removeChild(container);
        vi.clearAllMocks();
    });

    describe('1. Constructor and Initialization', () => {
        it('should create MemoryManager with correct initial state', () => {
            expect(memoryManager).toBeDefined();
            expect(memoryManager.eventListeners).toEqual(new Set());
            expect(memoryManager.wasmInstances).toEqual(new Set());
            expect(memoryManager.components).toEqual(new Map());
            expect(memoryManager.timers).toEqual(new Set());
            expect(memoryManager.isDestroyed).toBe(false);
        });

        it('should initialize memory tracking metrics', () => {
            expect(memoryManager.metrics).toBeDefined();
            expect(memoryManager.metrics.eventListenersAdded).toBe(0);
            expect(memoryManager.metrics.eventListenersRemoved).toBe(0);
            expect(memoryManager.metrics.wasmInstancesRegistered).toBe(0);
            expect(memoryManager.metrics.componentsRegistered).toBe(0);
        });

        it('should start with clean state', () => {
            expect(memoryManager.getTrackedResourceCount()).toBe(0);
            expect(memoryManager.hasLeaks()).toBe(false);
        });
    });

    describe('2. Event Listener Management', () => {
        let testButton;
        let testHandler;

        beforeEach(() => {
            testButton = document.getElementById('testBtn1');
            testHandler = vi.fn();
        });

        it('should add and track event listeners', () => {
            memoryManager.addEventListener(testButton, 'click', testHandler);
            
            expect(memoryManager.eventListeners.size).toBe(1);
            expect(memoryManager.metrics.eventListenersAdded).toBe(1);
        });

        it('should trigger event handlers correctly', () => {
            memoryManager.addEventListener(testButton, 'click', testHandler);
            
            testButton.click();
            
            expect(testHandler).toHaveBeenCalledTimes(1);
        });

        it('should handle event listener options', () => {
            const options = { once: true, passive: true };
            
            memoryManager.addEventListener(testButton, 'click', testHandler, options);
            
            testButton.click();
            testButton.click(); // Should only trigger once
            
            expect(testHandler).toHaveBeenCalledTimes(1);
        });

        it('should remove specific event listeners', () => {
            memoryManager.addEventListener(testButton, 'click', testHandler);
            expect(memoryManager.eventListeners.size).toBe(1);
            
            memoryManager.removeEventListener(testButton, 'click', testHandler);
            
            expect(memoryManager.eventListeners.size).toBe(0);
            expect(memoryManager.metrics.eventListenersRemoved).toBe(1);
        });

        it('should add multiple event listeners on same element', () => {
            const handler2 = vi.fn();
            
            memoryManager.addEventListener(testButton, 'click', testHandler);
            memoryManager.addEventListener(testButton, 'mouseover', handler2);
            
            expect(memoryManager.eventListeners.size).toBe(2);
            
            testButton.click();
            testButton.dispatchEvent(new MouseEvent('mouseover'));
            
            expect(testHandler).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should clean up all event listeners', () => {
            const testInput = document.getElementById('testInput');
            
            memoryManager.addEventListener(testButton, 'click', testHandler);
            memoryManager.addEventListener(testInput, 'input', testHandler);
            
            expect(memoryManager.eventListeners.size).toBe(2);
            
            memoryManager.cleanupEventListeners();
            
            expect(memoryManager.eventListeners.size).toBe(0);
        });

        it('should handle cleanup of removed DOM elements', () => {
            memoryManager.addEventListener(testButton, 'click', testHandler);
            
            // Remove button from DOM
            testButton.remove();
            
            // Cleanup should handle removed elements gracefully
            expect(() => memoryManager.cleanupEventListeners()).not.toThrow();
            expect(memoryManager.eventListeners.size).toBe(0);
        });
    });

    describe('3. WASM Instance Management', () => {
        it('should register and track WASM instances', () => {
            memoryManager.registerWasmInstance(mockWasmInstance);
            
            expect(memoryManager.wasmInstances.size).toBe(1);
            expect(memoryManager.metrics.wasmInstancesRegistered).toBe(1);
        });

        it('should get WASM memory usage', () => {
            memoryManager.registerWasmInstance(mockWasmInstance);
            
            const usage = memoryManager.getWasmMemoryUsage();
            
            expect(usage.totalInstances).toBe(1);
            expect(usage.totalMemoryBytes).toBe(512);
            expect(mockWasmInstance.exports.get_memory_usage).toHaveBeenCalled();
        });

        it('should clean up WASM instances', () => {
            memoryManager.registerWasmInstance(mockWasmInstance);
            
            memoryManager.cleanupWasmInstances();
            
            expect(mockWasmInstance.free).toHaveBeenCalled();
            expect(mockWasmInstance.exports.cleanup).toHaveBeenCalled();
            expect(memoryManager.wasmInstances.size).toBe(0);
        });

        it('should handle WASM instances without cleanup methods', () => {
            const simpleWasm = {
                free: vi.fn(),
                memory: { buffer: new ArrayBuffer(256) }
                // No exports.cleanup
            };
            
            memoryManager.registerWasmInstance(simpleWasm);
            
            expect(() => memoryManager.cleanupWasmInstances()).not.toThrow();
            expect(simpleWasm.free).toHaveBeenCalled();
        });

        it('should handle WASM cleanup errors gracefully', () => {
            mockWasmInstance.free.mockImplementation(() => {
                throw new Error('WASM cleanup failed');
            });
            
            memoryManager.registerWasmInstance(mockWasmInstance);
            
            expect(() => memoryManager.cleanupWasmInstances()).not.toThrow();
        });

        it('should unregister specific WASM instances', () => {
            const wasm2 = { ...mockWasmInstance, id: 'wasm2' };
            
            memoryManager.registerWasmInstance(mockWasmInstance);
            memoryManager.registerWasmInstance(wasm2);
            
            expect(memoryManager.wasmInstances.size).toBe(2);
            
            memoryManager.unregisterWasmInstance(mockWasmInstance);
            
            expect(memoryManager.wasmInstances.size).toBe(1);
            expect(mockWasmInstance.free).toHaveBeenCalled();
        });
    });

    describe('4. Component Lifecycle Management', () => {
        it('should register and track components', () => {
            memoryManager.registerComponent('testComponent', mockComponent);
            
            expect(memoryManager.components.size).toBe(1);
            expect(memoryManager.metrics.componentsRegistered).toBe(1);
            expect(memoryManager.components.get('testComponent')).toBe(mockComponent);
        });

        it('should clean up all registered components', () => {
            const component2 = { ...mockComponent, name: 'TestComponent2', destroy: vi.fn() };
            
            memoryManager.registerComponent('comp1', mockComponent);
            memoryManager.registerComponent('comp2', component2);
            
            memoryManager.cleanupComponents();
            
            expect(mockComponent.destroy).toHaveBeenCalled();
            expect(component2.destroy).toHaveBeenCalled();
            expect(memoryManager.components.size).toBe(0);
        });

        it('should unregister specific components', () => {
            memoryManager.registerComponent('testComponent', mockComponent);
            
            memoryManager.unregisterComponent('testComponent');
            
            expect(mockComponent.destroy).toHaveBeenCalled();
            expect(memoryManager.components.size).toBe(0);
        });

        it('should handle components without destroy method', () => {
            const componentWithoutDestroy = {
                name: 'SimpleComponent',
                cleanup: vi.fn()
            };
            
            memoryManager.registerComponent('simple', componentWithoutDestroy);
            
            expect(() => memoryManager.cleanupComponents()).not.toThrow();
            expect(componentWithoutDestroy.cleanup).toHaveBeenCalled();
        });

        it('should handle component cleanup errors gracefully', () => {
            mockComponent.destroy.mockImplementation(() => {
                throw new Error('Component destroy failed');
            });
            
            memoryManager.registerComponent('testComponent', mockComponent);
            
            expect(() => memoryManager.cleanupComponents()).not.toThrow();
        });

        it('should get component status information', () => {
            memoryManager.registerComponent('testComponent', mockComponent);
            
            const status = memoryManager.getComponentStatus();
            
            expect(status.totalComponents).toBe(1);
            expect(status.activeComponents).toBe(1);
            expect(status.components).toHaveProperty('testComponent');
        });
    });

    describe('5. Timer and Interval Management', () => {
        it('should track setTimeout timers', () => {
            const timerId = memoryManager.setTimeout(() => {}, 1000);
            
            expect(memoryManager.timers.size).toBe(1);
            expect(typeof timerId).toBe('number');
        });

        it('should track setInterval timers', () => {
            const intervalId = memoryManager.setInterval(() => {}, 100);
            
            expect(memoryManager.timers.size).toBe(1);
            expect(typeof intervalId).toBe('number');
        });

        it('should clear specific timers', () => {
            const timerId = memoryManager.setTimeout(() => {}, 1000);
            
            memoryManager.clearTimeout(timerId);
            
            expect(memoryManager.timers.size).toBe(0);
        });

        it('should clear specific intervals', () => {
            const intervalId = memoryManager.setInterval(() => {}, 100);
            
            memoryManager.clearInterval(intervalId);
            
            expect(memoryManager.timers.size).toBe(0);
        });

        it('should clean up all timers', () => {
            memoryManager.setTimeout(() => {}, 1000);
            memoryManager.setInterval(() => {}, 100);
            
            expect(memoryManager.timers.size).toBe(2);
            
            memoryManager.cleanupTimers();
            
            expect(memoryManager.timers.size).toBe(0);
        });

        it('should execute setTimeout callbacks correctly', (done) => {
            const callback = vi.fn(() => {
                expect(callback).toHaveBeenCalled();
                done();
            });
            
            memoryManager.setTimeout(callback, 10);
        });
    });

    describe('6. Memory Leak Detection', () => {
        beforeEach(() => {
            // Add some resources to simulate memory usage
            memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            memoryManager.registerWasmInstance(mockWasmInstance);
            memoryManager.registerComponent('testComponent', mockComponent);
            memoryManager.setTimeout(() => {}, 1000);
        });

        it('should detect potential memory leaks', () => {
            const leaks = memoryManager.detectMemoryLeaks();
            
            expect(leaks.hasLeaks).toBe(true);
            expect(leaks.eventListeners).toBe(1);
            expect(leaks.wasmInstances).toBe(1);
            expect(leaks.components).toBe(1);
            expect(leaks.timers).toBe(1);
        });

        it('should provide detailed leak analysis', () => {
            const analysis = memoryManager.getLeakAnalysis();
            
            expect(analysis.severity).toBe('medium'); // or 'low', 'high' based on thresholds
            expect(analysis.recommendations).toContain('event listeners');
            expect(analysis.totalResources).toBe(4);
        });

        it('should calculate memory pressure', () => {
            // Add more resources to increase pressure
            for (let i = 0; i < 10; i++) {
                memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            }
            
            const pressure = memoryManager.getMemoryPressure();
            
            expect(pressure.level).toBeDefined();
            expect(pressure.score).toBeGreaterThan(0);
            expect(pressure.score).toBeLessThanOrEqual(100);
        });

        it('should track resource allocation over time', () => {
            const initialSnapshot = memoryManager.getMemorySnapshot();
            
            // Add more resources
            memoryManager.addEventListener(document.getElementById('testBtn2'), 'click', vi.fn());
            memoryManager.setTimeout(() => {}, 500);
            
            const secondSnapshot = memoryManager.getMemorySnapshot();
            
            expect(secondSnapshot.eventListeners).toBeGreaterThan(initialSnapshot.eventListeners);
            expect(secondSnapshot.timers).toBeGreaterThan(initialSnapshot.timers);
        });
    });

    describe('7. Performance Monitoring', () => {
        it('should track cleanup performance', () => {
            // Add multiple resources
            for (let i = 0; i < 50; i++) {
                memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            }
            
            const startTime = performance.now();
            memoryManager.cleanupEventListeners();
            const endTime = performance.now();
            
            const cleanupTime = endTime - startTime;
            expect(cleanupTime).toBeLessThan(50); // Should cleanup quickly
        });

        it('should provide comprehensive performance metrics', () => {
            memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            memoryManager.registerWasmInstance(mockWasmInstance);
            
            const metrics = memoryManager.getPerformanceMetrics();
            
            expect(metrics.eventListenersAdded).toBe(1);
            expect(metrics.wasmInstancesRegistered).toBe(1);
            expect(metrics.totalCleanupOperations).toBeGreaterThanOrEqual(0);
            expect(metrics.averageCleanupTime).toBeGreaterThanOrEqual(0);
        });

        it('should measure resource allocation efficiency', () => {
            const startTime = performance.now();
            
            // Rapid resource allocation
            for (let i = 0; i < 100; i++) {
                memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            }
            
            const endTime = performance.now();
            const allocationTime = endTime - startTime;
            
            expect(allocationTime).toBeLessThan(100); // 100 allocations in under 100ms
        });
    });

    describe('8. Comprehensive Cleanup', () => {
        beforeEach(() => {
            // Set up various resources
            memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            memoryManager.addEventListener(document.getElementById('testInput'), 'input', vi.fn());
            memoryManager.registerWasmInstance(mockWasmInstance);
            memoryManager.registerComponent('comp1', mockComponent);
            memoryManager.setTimeout(() => {}, 1000);
            memoryManager.setInterval(() => {}, 500);
        });

        it('should perform complete cleanup of all resources', () => {
            expect(memoryManager.getTrackedResourceCount()).toBe(6);
            
            memoryManager.cleanupAll();
            
            expect(memoryManager.eventListeners.size).toBe(0);
            expect(memoryManager.wasmInstances.size).toBe(0);
            expect(memoryManager.components.size).toBe(0);
            expect(memoryManager.timers.size).toBe(0);
        });

        it('should verify complete cleanup', () => {
            memoryManager.cleanupAll();
            
            const verificationResult = memoryManager.verifyCleanup();
            
            expect(verificationResult.isClean).toBe(true);
            expect(verificationResult.remainingResources).toBe(0);
            expect(verificationResult.leaks).toEqual([]);
        });

        it('should handle cleanup errors gracefully', () => {
            mockComponent.destroy.mockImplementation(() => {
                throw new Error('Cleanup failed');
            });
            
            expect(() => memoryManager.cleanupAll()).not.toThrow();
        });

        it('should reset metrics after cleanup', () => {
            memoryManager.cleanupAll();
            memoryManager.resetMetrics();
            
            const metrics = memoryManager.getPerformanceMetrics();
            expect(metrics.eventListenersAdded).toBe(0);
            expect(metrics.wasmInstancesRegistered).toBe(0);
            expect(metrics.componentsRegistered).toBe(0);
        });
    });

    describe('9. Error Handling and Recovery', () => {
        it('should handle null element event listener addition', () => {
            expect(() => {
                memoryManager.addEventListener(null, 'click', vi.fn());
            }).not.toThrow();
        });

        it('should handle invalid event types gracefully', () => {
            const testButton = document.getElementById('testBtn1');
            
            expect(() => {
                memoryManager.addEventListener(testButton, null, vi.fn());
            }).not.toThrow();
        });

        it('should handle corrupted resource tracking', () => {
            // Corrupt the Set
            memoryManager.eventListeners.add(null);
            memoryManager.eventListeners.add(undefined);
            
            expect(() => memoryManager.cleanupEventListeners()).not.toThrow();
        });

        it('should recover from component registration errors', () => {
            const malformedComponent = null;
            
            expect(() => {
                memoryManager.registerComponent('malformed', malformedComponent);
            }).not.toThrow();
        });

        it('should handle WASM instance registration errors', () => {
            const invalidWasm = { invalid: 'object' };
            
            expect(() => {
                memoryManager.registerWasmInstance(invalidWasm);
            }).not.toThrow();
        });
    });

    describe('10. Advanced Memory Management Features', () => {
        it('should support memory usage thresholds', () => {
            memoryManager.setMemoryThreshold(1000); // 1KB threshold
            
            // Add resources to exceed threshold
            for (let i = 0; i < 100; i++) {
                memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            }
            
            const isOverThreshold = memoryManager.isOverMemoryThreshold();
            expect(typeof isOverThreshold).toBe('boolean');
        });

        it('should support automatic cleanup policies', () => {
            memoryManager.enableAutoCleanup({
                maxEventListeners: 5,
                maxComponents: 3,
                maxTimers: 2
            });
            
            // Add resources beyond limits
            for (let i = 0; i < 10; i++) {
                memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            }
            
            // Auto cleanup should have triggered
            expect(memoryManager.eventListeners.size).toBeLessThanOrEqual(5);
        });

        it('should generate memory usage reports', () => {
            memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            memoryManager.registerWasmInstance(mockWasmInstance);
            
            const report = memoryManager.generateMemoryReport();
            
            expect(report.summary).toBeDefined();
            expect(report.breakdown).toBeDefined();
            expect(report.recommendations).toBeDefined();
            expect(report.timestamp).toBeDefined();
        });

        it('should support memory usage callbacks', () => {
            const callback = vi.fn();
            
            memoryManager.onMemoryThresholdExceeded(callback);
            
            // Simulate threshold exceeded
            memoryManager.setMemoryThreshold(1);
            memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            
            // Should trigger callback
            memoryManager.checkMemoryThreshold();
            expect(callback).toHaveBeenCalled();
        });
    });

    describe('11. Integration and Lifecycle', () => {
        it('should integrate with component lifecycle', () => {
            const componentWithResources = {
                name: 'ResourceComponent',
                destroy: vi.fn(),
                getEventListeners: () => [
                    { element: document.getElementById('testBtn1'), event: 'click', handler: vi.fn() }
                ]
            };
            
            memoryManager.registerComponent('resourceComp', componentWithResources);
            
            // Component cleanup should also cleanup its resources
            memoryManager.cleanupComponents();
            
            expect(componentWithResources.destroy).toHaveBeenCalled();
        });

        it('should handle destroy sequence correctly', () => {
            memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            memoryManager.registerWasmInstance(mockWasmInstance);
            memoryManager.registerComponent('testComponent', mockComponent);
            
            expect(memoryManager.isDestroyed).toBe(false);
            
            memoryManager.destroy();
            
            expect(memoryManager.isDestroyed).toBe(true);
            expect(memoryManager.getTrackedResourceCount()).toBe(0);
        });

        it('should prevent operations after destruction', () => {
            memoryManager.destroy();
            
            expect(() => {
                memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            }).not.toThrow(); // Should handle gracefully, not add listener
            
            expect(memoryManager.eventListeners.size).toBe(0);
        });

        it('should provide destruction verification', () => {
            memoryManager.addEventListener(document.getElementById('testBtn1'), 'click', vi.fn());
            memoryManager.destroy();
            
            const verification = memoryManager.verifyDestruction();
            
            expect(verification.isDestroyed).toBe(true);
            expect(verification.hasLeaks).toBe(false);
            expect(verification.cleanupSuccess).toBe(true);
        });
    });
});