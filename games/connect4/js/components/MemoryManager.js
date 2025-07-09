/**
 * MemoryManager - Comprehensive Memory Management for Connect4
 * 
 * ULTRATHINK Refactoring: Prevents memory leaks and ensures proper cleanup
 * of all game resources including WASM instances, event listeners, and DOM references.
 * 
 * Features:
 * - Automatic event listener tracking and cleanup
 * - WASM instance lifecycle management
 * - DOM reference cleanup
 * - Memory usage monitoring
 * - Garbage collection optimization
 * - Resource leak detection
 */

export class MemoryManager {
    constructor() {
        // Resource tracking (correct data structures)
        this.eventListeners = new Set();
        this.wasmInstances = new Set();
        this.components = new Map(); // Named components (key-value)
        this.timers = new Set(); // Combined timeouts/intervals
        this.domObservers = new Set();
        
        // Internal tracking (for implementation)
        this.timeouts = new Set();
        this.intervals = new Set();
        this.componentInstances = new Set(); // For backward compatibility
        
        // Test-compatible metrics
        this.metrics = {
            eventListenersAdded: 0,
            eventListenersRemoved: 0,
            wasmInstancesRegistered: 0,
            componentsRegistered: 0,
            timersCreated: 0,
            memoryOptimizations: 0
        };
        
        // Memory monitoring
        this.memoryMetrics = {
            initialUsage: 0,
            currentUsage: 0,
            peakUsage: 0,
            gcCount: 0,
            leakDetections: []
        };
        
        // Cleanup callbacks
        this.cleanupCallbacks = new Set();
        
        // State
        this.isDestroyed = false;
        this.monitoringEnabled = false;
        
        // Initialize monitoring
        this.initializeMonitoring();
    }
    
    /**
     * Initialize memory monitoring
     * @private
     */
    initializeMonitoring() {
        if (typeof window !== 'undefined' && window.performance?.memory) {
            this.memoryMetrics.initialUsage = window.performance.memory.usedJSHeapSize;
            console.log(`📊 Initial memory usage: ${this.formatBytes(this.memoryMetrics.initialUsage)}`);
        }
    }
    
    /**
     * Start memory monitoring with periodic checks
     */
    startMonitoring(intervalMs = 30000) {
        if (this.monitoringEnabled) return;
        
        this.monitoringEnabled = true;
        
        const monitoringInterval = setInterval(() => {
            this.updateMemoryMetrics();
            this.detectLeaks();
        }, intervalMs);
        
        this.trackInterval(monitoringInterval);
        
        console.log(`📊 Memory monitoring started (checking every ${intervalMs}ms)`);
    }
    
    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        this.monitoringEnabled = false;
        console.log('📊 Memory monitoring stopped');
    }
    
    /**
     * Update memory metrics
     * @private
     */
    updateMemoryMetrics() {
        if (typeof window !== 'undefined' && window.performance?.memory) {
            const memory = window.performance.memory;
            this.memoryMetrics.currentUsage = memory.usedJSHeapSize;
            
            if (this.memoryMetrics.currentUsage > this.memoryMetrics.peakUsage) {
                this.memoryMetrics.peakUsage = this.memoryMetrics.currentUsage;
            }
        }
    }
    
    /**
     * Detect potential memory leaks
     * @private
     */
    detectLeaks() {
        const thresholds = {
            eventListeners: 100,
            timeouts: 50,
            components: 10
        };
        
        const issues = [];
        
        if (this.eventListeners.size > thresholds.eventListeners) {
            issues.push(`Excessive event listeners: ${this.eventListeners.size}`);
        }
        
        if (this.timeouts.size > thresholds.timeouts) {
            issues.push(`Excessive timeouts: ${this.timeouts.size}`);
        }
        
        if (this.componentInstances.size > thresholds.components) {
            issues.push(`Excessive components: ${this.componentInstances.size}`);
        }
        
        if (issues.length > 0) {
            const leak = {
                timestamp: Date.now(),
                issues: issues,
                memoryUsage: this.memoryMetrics.currentUsage
            };
            
            this.memoryMetrics.leakDetections.push(leak);
            console.warn('🚨 Potential memory leaks detected:', issues);
        }
    }
    
    // ==================== EVENT LISTENER MANAGEMENT ====================
    
    /**
     * Track and add event listener with automatic cleanup
     */
    addEventListener(element, event, handler, options = false) {
        if (this.isDestroyed) {
            console.warn('⚠️ Cannot add event listener: MemoryManager is destroyed');
            return;
        }
        
        element.addEventListener(event, handler, options);
        
        const listenerInfo = {
            element,
            event,
            handler,
            options,
            timestamp: Date.now()
        };
        
        this.eventListeners.add(listenerInfo);
        this.metrics.eventListenersAdded++;
        
        return listenerInfo;
    }
    
    /**
     * Remove specific event listener
     * Supports two signatures:
     * 1. removeEventListener(listenerInfo) - using returned object from addEventListener
     * 2. removeEventListener(element, event, handler) - direct element/event/handler
     */
    removeEventListener(elementOrListenerInfo, event = null, handler = null) {
        // Handle listenerInfo object (first signature)
        if (elementOrListenerInfo && typeof elementOrListenerInfo === 'object' && 
            elementOrListenerInfo.element && elementOrListenerInfo.event) {
            const listenerInfo = elementOrListenerInfo;
            if (this.eventListeners.has(listenerInfo)) {
                listenerInfo.element.removeEventListener(
                    listenerInfo.event, 
                    listenerInfo.handler, 
                    listenerInfo.options
                );
                this.eventListeners.delete(listenerInfo);
                this.metrics.eventListenersRemoved++;
            }
            return;
        }
        
        // Handle direct element/event/handler (second signature)
        if (elementOrListenerInfo && event && handler) {
            const element = elementOrListenerInfo;
            
            // Find matching listener in our set
            for (const listenerInfo of this.eventListeners) {
                if (listenerInfo.element === element && 
                    listenerInfo.event === event && 
                    listenerInfo.handler === handler) {
                    
                    element.removeEventListener(event, handler, listenerInfo.options);
                    this.eventListeners.delete(listenerInfo);
                    this.metrics.eventListenersRemoved++;
                    break;
                }
            }
        }
    }
    
    /**
     * Clean up all tracked event listeners
     * @private
     */
    cleanupEventListeners() {
        console.log(`🧹 Cleaning up ${this.eventListeners.size} event listeners`);
        
        for (const listenerInfo of this.eventListeners) {
            try {
                listenerInfo.element.removeEventListener(
                    listenerInfo.event, 
                    listenerInfo.handler, 
                    listenerInfo.options
                );
            } catch (error) {
                console.warn('⚠️ Failed to remove event listener:', error);
            }
        }
        
        this.eventListeners.clear();
    }
    
    // ==================== WASM INSTANCE MANAGEMENT ====================
    
    /**
     * Register a WASM instance for memory tracking and cleanup
     */
    registerWasmInstance(wasmInstance, identifier = 'unnamed') {
        if (this.isDestroyed) {
            console.warn('⚠️ Cannot register WASM instance: MemoryManager is destroyed');
            return;
        }
        
        const wasmInfo = {
            instance: wasmInstance,
            identifier,
            timestamp: Date.now(),
            memorySize: wasmInstance.memory?.buffer?.byteLength || 0
        };
        
        this.wasmInstances.add(wasmInfo);
        console.log(`🦀 Registered WASM instance: ${identifier} (${this.formatBytes(wasmInfo.memorySize)})`);
        
        return wasmInfo;
    }
    
    /**
     * Unregister a specific WASM instance
     */
    unregisterWasmInstance(wasmInfo) {
        if (wasmInfo && this.wasmInstances.has(wasmInfo)) {
            this.wasmInstances.delete(wasmInfo);
            console.log(`🗑️ Unregistered WASM instance: ${wasmInfo.identifier}`);
        }
    }
    
    /**
     * Get comprehensive WASM memory usage (for tests)
     */
    getWasmMemoryUsage() {
        let totalMemoryBytes = 0;
        let totalInstances = 0;
        
        for (const wasmInfo of this.wasmInstances) {
            totalInstances++;
            
            // Try to get current memory usage if available
            if (wasmInfo.instance?.exports?.get_memory_usage) {
                try {
                    totalMemoryBytes += wasmInfo.instance.exports.get_memory_usage();
                } catch (error) {
                    // Fallback to stored memory size
                    totalMemoryBytes += wasmInfo.memorySize || 0;
                }
            } else {
                totalMemoryBytes += wasmInfo.memorySize || 0;
            }
        }
        
        return {
            totalInstances,
            totalMemoryBytes
        };
    }
    
    /**
     * Register a WASM instance for memory tracking and cleanup
     */
    registerWasmInstance(wasmInstance, identifier = 'unnamed') {
        if (this.isDestroyed) {
            console.warn('⚠️ Cannot register WASM instance: MemoryManager is destroyed');
            return;
        }
        
        const wasmInfo = {
            instance: wasmInstance,
            identifier,
            timestamp: Date.now(),
            memorySize: wasmInstance.memory?.buffer?.byteLength || 0
        };
        
        this.wasmInstances.add(wasmInfo);
        this.metrics.wasmInstancesRegistered++;
        console.log(`🦀 Registered WASM instance: ${identifier} (${this.formatBytes(wasmInfo.memorySize)})`);
        
        return wasmInfo;
    }
    
    /**
     * Clean up all tracked WASM instances
     * @private
     */
    cleanupWasmInstances() {
        console.log(`🧹 Cleaning up ${this.wasmInstances.size} WASM instances`);
        
        for (const wasmInfo of this.wasmInstances) {
            try {
                // Call free method if available
                if (wasmInfo.instance?.free) {
                    wasmInfo.instance.free();
                }
                // Call exports.cleanup if available
                if (wasmInfo.instance?.exports?.cleanup) {
                    wasmInfo.instance.exports.cleanup();
                }
            } catch (error) {
                console.warn('⚠️ Failed to destroy WASM instance:', error);
            }
        }
        
        this.wasmInstances.clear();
    }
    
    // ==================== COMPONENT REGISTRATION ====================
    
    /**
     * Register a component for tracking and cleanup
     */
    registerComponent(name, component) {
        if (this.isDestroyed) {
            console.warn('⚠️ Cannot register component: MemoryManager is destroyed');
            return;
        }
        
        this.components.set(name, component);
        this.metrics.componentsRegistered++;
        console.log(`📦 Registered component: ${name}`);
        
        return component;
    }
    
    /**
     * Unregister a component by name
     */
    unregisterComponent(name) {
        if (this.components.has(name)) {
            const component = this.components.get(name);
            this.components.delete(name);
            console.log(`🗑️ Unregistered component: ${name}`);
            return component;
        }
    }
    
    /**
     * Clean up all registered components
     * @private
     */
    cleanupComponents() {
        console.log(`🧹 Cleaning up ${this.components.size} components`);
        
        for (const [name, component] of this.components) {
            try {
                // Call destroy method if available
                if (component?.destroy) {
                    component.destroy();
                }
            } catch (error) {
                console.warn(`⚠️ Failed to cleanup component ${name}:`, error);
            }
        }
        
        this.components.clear();
    }
    
    // ==================== TIMEOUT/INTERVAL MANAGEMENT ====================
    
    /**
     * Track setTimeout with automatic cleanup
     */
    setTimeout(callback, delay, ...args) {
        if (this.isDestroyed) {
            console.warn('⚠️ Cannot set timeout: MemoryManager is destroyed');
            return null;
        }
        
        const timeoutId = setTimeout(() => {
            this.timeouts.delete(timeoutId);
            callback(...args);
        }, delay);
        
        this.timeouts.add(timeoutId);
        return timeoutId;
    }
    
    /**
     * Track setInterval with automatic cleanup
     */
    setInterval(callback, interval, ...args) {
        if (this.isDestroyed) {
            console.warn('⚠️ Cannot set interval: MemoryManager is destroyed');
            return null;
        }
        
        const intervalId = setInterval(callback, interval, ...args);
        this.intervals.add(intervalId);
        return intervalId;
    }
    
    /**
     * Track interval (for external intervals)
     */
    trackInterval(intervalId) {
        this.intervals.add(intervalId);
    }
    
    /**
     * Clear specific timeout
     */
    clearTimeout(timeoutId) {
        clearTimeout(timeoutId);
        this.timeouts.delete(timeoutId);
    }
    
    /**
     * Clear specific interval
     */
    clearInterval(intervalId) {
        clearInterval(intervalId);
        this.intervals.delete(intervalId);
    }
    
    /**
     * Clean up all timeouts and intervals
     * @private
     */
    cleanupTimeouts() {
        console.log(`🧹 Cleaning up ${this.timeouts.size} timeouts and ${this.intervals.size} intervals`);
        
        for (const timeoutId of this.timeouts) {
            clearTimeout(timeoutId);
        }
        this.timeouts.clear();
        
        for (const intervalId of this.intervals) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
    }
    
    // ==================== DOM OBSERVER MANAGEMENT ====================
    
    /**
     * Track DOM observer with automatic cleanup
     */
    trackObserver(observer) {
        this.domObservers.add(observer);
        return observer;
    }
    
    /**
     * Create and track MutationObserver
     */
    createMutationObserver(callback, target, options) {
        const observer = new MutationObserver(callback);
        observer.observe(target, options);
        this.trackObserver(observer);
        return observer;
    }
    
    /**
     * Create and track ResizeObserver
     */
    createResizeObserver(callback, target) {
        if (typeof ResizeObserver === 'undefined') {
            console.warn('⚠️ ResizeObserver not supported');
            return null;
        }
        
        const observer = new ResizeObserver(callback);
        observer.observe(target);
        this.trackObserver(observer);
        return observer;
    }
    
    /**
     * Clean up all DOM observers
     * @private
     */
    cleanupObservers() {
        console.log(`🧹 Cleaning up ${this.domObservers.size} DOM observers`);
        
        for (const observer of this.domObservers) {
            try {
                observer.disconnect();
            } catch (error) {
                console.warn('⚠️ Failed to disconnect observer:', error);
            }
        }
        
        this.domObservers.clear();
    }
    
    // ==================== WASM INSTANCE MANAGEMENT ====================
    
    /**
     * Track WASM instance for cleanup
     */
    trackWasmInstance(instance, destroyMethod = 'free', identifier = 'unnamed') {
        const wasmInfo = {
            instance,
            destroyMethod,
            identifier,
            timestamp: Date.now(),
            memorySize: instance.memory?.buffer?.byteLength || 0
        };
        
        this.wasmInstances.add(wasmInfo);
        console.log(`📦 WASM instance tracked for cleanup: ${identifier} (${this.formatBytes(wasmInfo.memorySize)})`);
        
        return wasmInfo;
    }
    
    /**
     * Clean up all WASM instances
     * @private
     */
    cleanupWasmInstances() {
        console.log(`🧹 Cleaning up ${this.wasmInstances.size} WASM instances`);
        
        for (const wasmInfo of this.wasmInstances) {
            try {
                if (wasmInfo.instance && typeof wasmInfo.instance[wasmInfo.destroyMethod] === 'function') {
                    wasmInfo.instance[wasmInfo.destroyMethod]();
                }
            } catch (error) {
                console.warn('⚠️ Failed to destroy WASM instance:', error);
            }
        }
        
        this.wasmInstances.clear();
    }
    
    // ==================== COMPONENT MANAGEMENT ====================
    
    /**
     * Track component instance for cleanup
     */
    trackComponent(component, destroyMethod = 'destroy', identifier = null) {
        if (this.isDestroyed) {
            console.warn('⚠️ Cannot track component: MemoryManager is destroyed');
            return;
        }
        
        const componentInfo = {
            component,
            destroyMethod,
            name: component.constructor.name,
            identifier: identifier || component.constructor.name,
            timestamp: Date.now()
        };
        
        this.componentInstances.add(componentInfo);
        console.log(`🧩 Component tracked: ${componentInfo.identifier}`);
        
        return componentInfo;
    }
    
    /**
     * Untrack component
     */
    untrackComponent(componentInfo) {
        this.componentInstances.delete(componentInfo);
    }
    
    /**
     * Clean up all tracked components
     * @private
     */
    cleanupComponents() {
        console.log(`🧹 Cleaning up ${this.componentInstances.size} components`);
        
        for (const componentInfo of this.componentInstances) {
            try {
                if (componentInfo.component && typeof componentInfo.component[componentInfo.destroyMethod] === 'function') {
                    componentInfo.component[componentInfo.destroyMethod]();
                }
            } catch (error) {
                console.warn(`⚠️ Failed to destroy component ${componentInfo.name}:`, error);
            }
        }
        
        this.componentInstances.clear();
    }
    
    // ==================== CLEANUP CALLBACKS ====================
    
    /**
     * Add custom cleanup callback
     */
    addCleanupCallback(callback, description = 'custom cleanup') {
        const callbackInfo = {
            callback,
            description,
            timestamp: Date.now()
        };
        
        this.cleanupCallbacks.add(callbackInfo);
        console.log(`🔧 Cleanup callback added: ${description}`);
        
        return callbackInfo;
    }
    
    /**
     * Remove cleanup callback
     */
    removeCleanupCallback(callbackInfo) {
        this.cleanupCallbacks.delete(callbackInfo);
    }
    
    /**
     * Execute all cleanup callbacks
     * @private
     */
    executeCleanupCallbacks() {
        console.log(`🧹 Executing ${this.cleanupCallbacks.size} cleanup callbacks`);
        
        for (const callbackInfo of this.cleanupCallbacks) {
            try {
                callbackInfo.callback();
            } catch (error) {
                console.warn(`⚠️ Cleanup callback failed (${callbackInfo.description}):`, error);
            }
        }
        
        this.cleanupCallbacks.clear();
    }
    
    // ==================== GARBAGE COLLECTION ====================
    
    /**
     * Force garbage collection (if available)
     */
    forceGarbageCollection() {
        if (typeof window !== 'undefined' && window.gc) {
            window.gc();
            this.memoryMetrics.gcCount++;
            console.log('🗑️ Forced garbage collection');
        } else {
            console.log('🗑️ Garbage collection not available (try --expose-gc flag)');
        }
    }
    
    /**
     * Optimize memory by cleaning up and forcing GC
     */
    optimizeMemory() {
        console.log('⚡ Optimizing memory usage...');
        
        const beforeUsage = this.getMemoryUsage();
        
        // Clean up resources
        this.partialCleanup();
        
        // Force GC if available
        this.forceGarbageCollection();
        
        const afterUsage = this.getMemoryUsage();
        const saved = beforeUsage - afterUsage;
        
        if (saved > 0) {
            console.log(`✅ Memory optimized: ${this.formatBytes(saved)} freed`);
        }
        
        return saved;
    }
    
    /**
     * Partial cleanup without destroying the manager
     */
    partialCleanup() {
        // Clean up completed timeouts
        const completedTimeouts = Array.from(this.timeouts).filter(id => {
            // Timeouts that have completed are no longer valid
            return false; // We can't reliably detect completed timeouts
        });
        
        // Clean up dead component references
        const deadComponents = Array.from(this.componentInstances).filter(info => {
            return !info.component || info.component.isDestroyed;
        });
        
        deadComponents.forEach(info => this.componentInstances.delete(info));
        
        console.log('🧹 Partial cleanup completed');
    }
    
    // ==================== MONITORING & REPORTING ====================
    
    /**
     * Get current memory usage
     */
    getMemoryUsage() {
        if (typeof window !== 'undefined' && window.performance?.memory) {
            return window.performance.memory.usedJSHeapSize;
        }
        return 0;
    }
    
    /**
     * Get comprehensive memory report
     */
    getMemoryReport() {
        this.updateMemoryMetrics();
        
        const report = {
            timestamp: Date.now(),
            memory: {
                initial: this.memoryMetrics.initialUsage,
                current: this.memoryMetrics.currentUsage,
                peak: this.memoryMetrics.peakUsage,
                increase: this.memoryMetrics.currentUsage - this.memoryMetrics.initialUsage
            },
            resources: {
                eventListeners: this.eventListeners.size,
                timeouts: this.timeouts.size,
                intervals: this.intervals.size,
                observers: this.domObservers.size,
                wasmInstances: this.wasmInstances.size,
                components: this.componentInstances.size,
                cleanupCallbacks: this.cleanupCallbacks.size
            },
            gcCount: this.memoryMetrics.gcCount,
            leakDetections: this.memoryMetrics.leakDetections.length,
            isDestroyed: this.isDestroyed
        };
        
        return report;
    }
    
    /**
     * Log memory report to console
     */
    logMemoryReport() {
        const report = this.getMemoryReport();
        
        console.log('📊 Memory Manager Report:');
        console.log('═══════════════════════════');
        console.log(`🧠 Memory Usage:`);
        console.log(`   Initial: ${this.formatBytes(report.memory.initial)}`);
        console.log(`   Current: ${this.formatBytes(report.memory.current)}`);
        console.log(`   Peak: ${this.formatBytes(report.memory.peak)}`);
        console.log(`   Increase: ${this.formatBytes(report.memory.increase)}`);
        console.log(`📊 Tracked Resources:`);
        console.log(`   Event Listeners: ${report.resources.eventListeners}`);
        console.log(`   Timeouts: ${report.resources.timeouts}`);
        console.log(`   Intervals: ${report.resources.intervals}`);
        console.log(`   DOM Observers: ${report.resources.observers}`);
        console.log(`   WASM Instances: ${report.resources.wasmInstances}`);
        console.log(`   Components: ${report.resources.components}`);
        console.log(`   Cleanup Callbacks: ${report.resources.cleanupCallbacks}`);
        console.log(`🗑️ GC Count: ${report.gcCount}`);
        console.log(`🚨 Leak Detections: ${report.leakDetections}`);
        console.log('═══════════════════════════');
    }
    
    /**
     * Format bytes for human-readable display
     * @private
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
    
    // ==================== DESTRUCTION ====================
    
    /**
     * Destroy memory manager and clean up all tracked resources
     */
    destroy() {
        if (this.isDestroyed) {
            console.warn('⚠️ MemoryManager already destroyed');
            return;
        }
        
        console.log('🗑️ Destroying MemoryManager and cleaning up all resources...');
        
        const startTime = performance.now();
        
        try {
            // Stop monitoring
            this.stopMonitoring();
            
            // Execute cleanup callbacks first
            this.executeCleanupCallbacks();
            
            // Clean up all tracked resources
            this.cleanupComponents();
            this.cleanupWasmInstances();
            this.cleanupEventListeners();
            this.cleanupTimeouts();
            this.cleanupObservers();
            
            // Force garbage collection
            this.forceGarbageCollection();
            
            // Mark as destroyed
            this.isDestroyed = true;
            
            const cleanupTime = performance.now() - startTime;
            console.log(`✅ MemoryManager destroyed successfully in ${cleanupTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('❌ Error during MemoryManager destruction:', error);
        }
    }
    
    // ==================== TEST API METHODS ====================
    
    /**
     * Get total count of tracked resources (for tests)
     */
    getTrackedResourceCount() {
        return this.eventListeners.size + 
               this.wasmInstances.size + 
               this.components.size + 
               this.timers.size;
    }
    
    /**
     * Check if there are potential memory leaks (for tests)
     */
    hasLeaks() {
        return this.memoryMetrics.leakDetections.length > 0;
    }
    
    /**
     * Unregister specific WASM instance (for tests)
     */
    unregisterWasmInstance(wasmInfo) {
        if (wasmInfo && this.wasmInstances.has(wasmInfo)) {
            // Call cleanup method if available
            try {
                if (wasmInfo.instance?.free) {
                    wasmInfo.instance.free();
                }
                if (wasmInfo.instance?.exports?.cleanup) {
                    wasmInfo.instance.exports.cleanup();
                }
            } catch (error) {
                console.warn('⚠️ Failed to cleanup WASM instance during unregister:', error);
            }
            
            this.wasmInstances.delete(wasmInfo);
            console.log(`🗑️ Unregistered WASM instance: ${wasmInfo.identifier}`);
        }
    }
}