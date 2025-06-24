/**
 * Interface Compliance System
 *
 * Automatic analysis and reporting of interface compliance across all modules.
 * Provides migration guidance and compliance tracking for the refactoring process.
 */

import {
    defaultValidator,
    _STANDARDIZED_INTERFACES,
    _generateComplianceReport,
    analyzeAllInterfaces
} from './standardized-interfaces.js';

/**
 * Module Compliance Analyzer
 * Analyzes existing modules for interface compliance and provides migration guidance
 */
export class ModuleComplianceAnalyzer {
    constructor() {
        this.modules = new Map();
        this.complianceHistory = [];
        this.migrationPlans = new Map();
        this.enabled = true;
    }

    /**
     * Register module for compliance monitoring
     * @param {string} name - Module name
     * @param {Object} module - Module instance
     * @param {string} expectedInterface - Expected interface name
     */
    registerModule(name, module, expectedInterface) {
        this.modules.set(name, {
            instance: module,
            expectedInterface,
            registeredAt: new Date().toISOString(),
            lastAnalyzed: null,
            complianceHistory: []
        });

        if (this.enabled) {
            this.analyzeModule(name);
        }

        return this;
    }

    /**
     * Analyze specific module compliance
     * @param {string} moduleName - Module name
     * @returns {Object} Compliance analysis result
     */
    analyzeModule(moduleName) {
        if (!this.enabled) return null;

        const moduleInfo = this.modules.get(moduleName);
        if (!moduleInfo) {
            throw new Error(`Module '${moduleName}' not registered`);
        }

        const { instance, expectedInterface } = moduleInfo;
        const timestamp = new Date().toISOString();

        // Perform compliance analysis
        const complianceResult = defaultValidator.validate(instance, expectedInterface);

        // Find best matching interfaces
        const allMatches = analyzeAllInterfaces(instance);

        // Create comprehensive analysis
        const analysis = {
            moduleName,
            timestamp,
            expectedInterface,
            compliance: complianceResult,
            bestMatches: allMatches.slice(0, 3), // Top 3 matches
            recommendations: this.generateRecommendations(complianceResult, allMatches),
            migrationComplexity: this.assessMigrationComplexity(complianceResult),
            priority: this.calculatePriority(complianceResult)
        };

        // Update module info
        moduleInfo.lastAnalyzed = timestamp;
        moduleInfo.complianceHistory.push({
            timestamp,
            compliance: complianceResult.compliance.percentage,
            errors: complianceResult.errors.length,
            warnings: complianceResult.warnings.length
        });

        // Store in global history
        this.complianceHistory.push(analysis);

        return analysis;
    }

    /**
     * Generate recommendations for improving compliance
     * @param {Object} complianceResult - Compliance validation result
     * @param {Array} allMatches - All interface matches
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(complianceResult, allMatches) {
        const recommendations = [];
        const { missing, extra, errors: _errors, compliance } = complianceResult;

        // High priority recommendations
        if (compliance.percentage < 50) {
            recommendations.push({
                type: 'critical',
                priority: 'high',
                action: 'Consider major refactoring or interface redesign',
                reason: `Only ${compliance.percentage}% compliant`
            });
        }

        // Missing properties recommendations
        if (missing.length > 0) {
            const critical = missing.filter(prop =>
                ['makeMove', 'getBoard', 'getBestMove', 'render'].includes(prop)
            );

            if (critical.length > 0) {
                recommendations.push({
                    type: 'implementation',
                    priority: 'high',
                    action: `Implement critical missing methods: ${critical.join(', ')}`,
                    reason: 'Core functionality missing'
                });
            }

            const nonCritical = missing.filter(prop => !critical.includes(prop));
            if (nonCritical.length > 0) {
                recommendations.push({
                    type: 'implementation',
                    priority: 'medium',
                    action: `Add missing methods: ${nonCritical.join(', ')}`,
                    reason: 'Interface completeness'
                });
            }
        }

        // Extra properties recommendations
        if (extra.length > 5) {
            recommendations.push({
                type: 'cleanup',
                priority: 'low',
                action: `Consider removing or documenting ${extra.length} extra properties`,
                reason: 'Interface bloat'
            });
        }

        // Alternative interface recommendations
        const betterMatch = allMatches.find(
            match => match.compliance > complianceResult.compliance.percentage + 20
        );

        if (betterMatch) {
            recommendations.push({
                type: 'interface',
                priority: 'medium',
                action: `Consider implementing ${betterMatch.interface} instead`,
                reason: `${betterMatch.compliance}% compliance vs current ${complianceResult.compliance.percentage}%`
            });
        }

        // Quick wins
        const quickWins = missing.filter(prop =>
            ['getName', 'getDifficulty', 'getConfig'].includes(prop)
        );

        if (quickWins.length > 0) {
            recommendations.push({
                type: 'quick-win',
                priority: 'low',
                action: `Easy wins: implement ${quickWins.join(', ')}`,
                reason: 'Simple getter methods'
            });
        }

        return recommendations.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
    }

    /**
     * Assess migration complexity
     * @param {Object} complianceResult - Compliance result
     * @returns {Object} Migration complexity assessment
     */
    assessMigrationComplexity(complianceResult) {
        const { missing, compliance, errors: _errors } = complianceResult;

        let complexity = 'low';
        let effort = 1; // 1-5 scale
        let timeEstimate = '1-2 hours';

        if (compliance.percentage < 30) {
            complexity = 'high';
            effort = 5;
            timeEstimate = '1-2 days';
        } else if (compliance.percentage < 60) {
            complexity = 'medium';
            effort = 3;
            timeEstimate = '4-8 hours';
        } else if (missing.length > 5) {
            complexity = 'medium';
            effort = 2;
            timeEstimate = '2-4 hours';
        }

        return {
            level: complexity,
            effort,
            timeEstimate,
            blockers: this.identifyBlockers(complianceResult),
            dependencies: this.identifyDependencies(missing)
        };
    }

    /**
     * Identify potential blockers
     * @param {Object} complianceResult - Compliance result
     * @returns {Array} Array of potential blockers
     */
    identifyBlockers(complianceResult) {
        const blockers = [];
        const { missing, errors } = complianceResult;

        // Check for architectural blockers
        if (missing.includes('on') && missing.includes('emit')) {
            blockers.push('Event system needs to be implemented');
        }

        if (missing.includes('simulateMove') && missing.includes('makeMove')) {
            blockers.push('Core game mechanics need restructuring');
        }

        if (errors.some(error => error.includes('function'))) {
            blockers.push('Type mismatches need resolution');
        }

        return blockers;
    }

    /**
     * Identify dependencies for missing methods
     * @param {Array} missing - Missing method names
     * @returns {Array} Array of dependencies
     */
    identifyDependencies(missing) {
        const dependencies = [];

        if (missing.includes('getConfig') || missing.includes('setConfig')) {
            dependencies.push('Configuration system');
        }

        if (missing.includes('on') || missing.includes('emit')) {
            dependencies.push('Event system');
        }

        if (missing.includes('simulateMove')) {
            dependencies.push('Game state simulation');
        }

        if (missing.includes('getThinkingTime') || missing.includes('getNodesExplored')) {
            dependencies.push('Performance monitoring');
        }

        return dependencies;
    }

    /**
     * Calculate migration priority
     * @param {Object} complianceResult - Compliance result
     * @returns {number} Priority score (1-10)
     */
    calculatePriority(complianceResult) {
        const { compliance, missing } = complianceResult;

        let priority = 5; // Base priority

        // Adjust based on compliance percentage
        if (compliance.percentage > 80) priority -= 2;
        else if (compliance.percentage < 50) priority += 3;
        else if (compliance.percentage < 70) priority += 1;

        // Adjust based on missing critical methods
        const criticalMethods = ['makeMove', 'getBoard', 'getBestMove', 'render'];
        const missingCritical = missing.filter(method => criticalMethods.includes(method));
        priority += missingCritical.length * 2;

        // Adjust based on module importance
        // This would be configurable based on module criticality

        return Math.min(10, Math.max(1, priority));
    }

    /**
     * Generate migration plan
     * @param {string} moduleName - Module name
     * @returns {Object} Migration plan
     */
    generateMigrationPlan(moduleName) {
        const analysis = this.analyzeModule(moduleName);

        const plan = {
            moduleName,
            targetInterface: analysis.expectedInterface,
            currentCompliance: analysis.compliance.compliance.percentage,
            complexity: analysis.migrationComplexity,
            phases: this.createMigrationPhases(analysis),
            timeline: this.estimateTimeline(analysis),
            risks: this.identifyRisks(analysis),
            benefits: this.identifyBenefits(analysis),
            createdAt: new Date().toISOString()
        };

        this.migrationPlans.set(moduleName, plan);
        return plan;
    }

    /**
     * Create migration phases
     * @param {Object} analysis - Module analysis
     * @returns {Array} Migration phases
     */
    createMigrationPhases(analysis) {
        const phases = [];
        const { missing, recommendations } = analysis;

        // Phase 1: Critical implementations
        const critical = recommendations.filter(r => r.priority === 'high');
        if (critical.length > 0) {
            phases.push({
                phase: 1,
                title: 'Critical Implementation',
                tasks: critical.map(r => r.action),
                estimatedHours: critical.length * 2,
                dependencies: []
            });
        }

        // Phase 2: Core functionality
        const core = missing.filter(method =>
            ['makeMove', 'getBoard', 'simulateMove', 'getValidMoves'].includes(method)
        );
        if (core.length > 0) {
            phases.push({
                phase: 2,
                title: 'Core Functionality',
                tasks: core.map(method => `Implement ${method}()`),
                estimatedHours: core.length * 1.5,
                dependencies: phases.length > 0 ? [1] : []
            });
        }

        // Phase 3: Medium priority features
        const medium = recommendations.filter(r => r.priority === 'medium');
        if (medium.length > 0) {
            phases.push({
                phase: 3,
                title: 'Enhanced Features',
                tasks: medium.map(r => r.action),
                estimatedHours: medium.length * 1,
                dependencies: phases.length > 0 ? [phases.length] : []
            });
        }

        // Phase 4: Polish and optimization
        const low = recommendations.filter(r => r.priority === 'low');
        if (low.length > 0) {
            phases.push({
                phase: 4,
                title: 'Polish & Optimization',
                tasks: low.map(r => r.action),
                estimatedHours: low.length * 0.5,
                dependencies: phases.length > 0 ? [phases.length] : []
            });
        }

        return phases;
    }

    /**
     * Estimate migration timeline
     * @param {Object} analysis - Module analysis
     * @returns {Object} Timeline estimation
     */
    estimateTimeline(analysis) {
        const phases = this.createMigrationPhases(analysis);
        const totalHours = phases.reduce((sum, phase) => sum + phase.estimatedHours, 0);

        return {
            totalHours,
            totalDays: Math.ceil(totalHours / 8),
            phases: phases.length,
            canParallelize: phases.filter(p => p.dependencies.length === 0).length > 1
        };
    }

    /**
     * Identify migration risks
     * @param {Object} analysis - Module analysis
     * @returns {Array} Risk assessment
     */
    identifyRisks(analysis) {
        const risks = [];
        const { compliance, migrationComplexity } = analysis;

        if (compliance.compliance.percentage < 30) {
            risks.push({
                type: 'high',
                description: 'Major architectural changes required',
                mitigation: 'Consider incremental migration with adapter pattern'
            });
        }

        if (migrationComplexity.blockers.length > 0) {
            risks.push({
                type: 'medium',
                description: 'Technical blockers identified',
                mitigation: 'Address blockers in separate preparatory phase'
            });
        }

        if (migrationComplexity.dependencies.length > 2) {
            risks.push({
                type: 'medium',
                description: 'Multiple external dependencies',
                mitigation: 'Ensure dependencies are available before migration'
            });
        }

        return risks;
    }

    /**
     * Identify migration benefits
     * @param {Object} analysis - Module analysis
     * @returns {Array} Benefit assessment
     */
    identifyBenefits(analysis) {
        const benefits = [];
        const { compliance } = analysis;

        if (compliance.compliance.percentage < 50) {
            benefits.push('Significant improvement in code standardization');
            benefits.push('Better integration with other modules');
        }

        benefits.push('Improved maintainability and testability');
        benefits.push('Enhanced documentation and type safety');
        benefits.push('Easier future enhancements and debugging');

        return benefits;
    }

    /**
     * Analyze all registered modules
     * @returns {Object} Complete compliance overview
     */
    analyzeAll() {
        const results = {};

        for (const moduleName of this.modules.keys()) {
            results[moduleName] = this.analyzeModule(moduleName);
        }

        return results;
    }

    /**
     * Generate comprehensive compliance report
     * @returns {string} Formatted report
     */
    generateComprehensiveReport() {
        const allResults = this.analyzeAll();
        let report = '\n🔍 MODULE COMPLIANCE ANALYSIS REPORT\n';
        report += `${'═'.repeat(60)}\n`;

        // Overview stats
        const totalModules = Object.keys(allResults).length;
        const compliantModules = Object.values(allResults).filter(r => r.compliance.isValid).length;
        const avgCompliance =
            Object.values(allResults).reduce(
                (sum, r) => sum + r.compliance.compliance.percentage,
                0
            ) / totalModules;

        report += '📊 Overview:\n';
        report += `   Total Modules: ${totalModules}\n`;
        report += `   Fully Compliant: ${compliantModules} (${Math.round((compliantModules / totalModules) * 100)}%)\n`;
        report += `   Average Compliance: ${Math.round(avgCompliance)}%\n\n`;

        // Individual module reports
        const sortedResults = Object.entries(allResults).sort(
            (a, b) => a[1].priority - b[1].priority
        );

        for (const [moduleName, analysis] of sortedResults) {
            report += this.generateModuleReport(moduleName, analysis);
            report += `\n${'-'.repeat(40)}\n`;
        }

        // Migration recommendations
        report += '\n🚀 MIGRATION RECOMMENDATIONS:\n';
        const highPriority = sortedResults.filter(([_, a]) => a.priority >= 7);
        const mediumPriority = sortedResults.filter(([_, a]) => a.priority >= 4 && a.priority < 7);

        if (highPriority.length > 0) {
            report += '\n🔴 High Priority (Immediate Action):\n';
            highPriority.forEach(([name, _]) => (report += `   • ${name}\n`));
        }

        if (mediumPriority.length > 0) {
            report += '\n🟡 Medium Priority (Next Sprint):\n';
            mediumPriority.forEach(([name, _]) => (report += `   • ${name}\n`));
        }

        return report;
    }

    /**
     * Generate report for specific module
     * @param {string} moduleName - Module name
     * @param {Object} analysis - Module analysis
     * @returns {string} Module report
     */
    generateModuleReport(moduleName, analysis) {
        const { compliance, recommendations, migrationComplexity, priority } = analysis;

        let report = `\n📋 ${moduleName.toUpperCase()}\n`;
        report += `   Interface: ${analysis.expectedInterface}\n`;
        report += `   Compliance: ${compliance.compliance.percentage}% `;

        if (compliance.isValid) {
            report += '✅\n';
        } else {
            report += `❌ (${compliance.errors.length} errors)\n`;
        }

        report += `   Priority: ${priority}/10 `;
        if (priority >= 7) report += '🔴\n';
        else if (priority >= 4) report += '🟡\n';
        else report += '🟢\n';

        report += `   Migration: ${migrationComplexity.level} complexity (${migrationComplexity.timeEstimate})\n`;

        if (recommendations.length > 0) {
            report += '   Top Recommendations:\n';
            recommendations.slice(0, 3).forEach(rec => {
                const emoji =
                    rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '💡';
                report += `     ${emoji} ${rec.action}\n`;
            });
        }

        return report;
    }

    /**
     * Enable/disable compliance monitoring
     * @param {boolean} enabled - Whether to enable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Get compliance history
     * @param {string} moduleName - Module name (optional)
     * @returns {Array} Compliance history
     */
    getHistory(moduleName = null) {
        if (moduleName) {
            const moduleInfo = this.modules.get(moduleName);
            return moduleInfo?.complianceHistory || [];
        }
        return this.complianceHistory;
    }

    /**
     * Export compliance data
     * @returns {Object} Exportable compliance data
     */
    exportData() {
        return {
            modules: Object.fromEntries(this.modules),
            history: this.complianceHistory,
            migrationPlans: Object.fromEntries(this.migrationPlans),
            exportedAt: new Date().toISOString()
        };
    }
}

/**
 * Default compliance analyzer instance
 */
export const defaultComplianceAnalyzer = new ModuleComplianceAnalyzer();

/**
 * Convenience functions
 */

/**
 * Register module for compliance monitoring
 * @param {string} name - Module name
 * @param {Object} module - Module instance
 * @param {string} expectedInterface - Expected interface
 */
export const registerModule = (name, module, expectedInterface) => {
    return defaultComplianceAnalyzer.registerModule(name, module, expectedInterface);
};

/**
 * Quick compliance check
 * @param {string} moduleName - Module name
 * @returns {number} Compliance percentage
 */
export const getCompliance = moduleName => {
    const analysis = defaultComplianceAnalyzer.analyzeModule(moduleName);
    return analysis.compliance.compliance.percentage;
};

/**
 * Generate migration plan for module
 * @param {string} moduleName - Module name
 * @returns {Object} Migration plan
 */
export const createMigrationPlan = moduleName => {
    return defaultComplianceAnalyzer.generateMigrationPlan(moduleName);
};

/**
 * Generate full compliance report
 * @returns {string} Compliance report
 */
export const generateFullReport = () => {
    return defaultComplianceAnalyzer.generateComprehensiveReport();
};
