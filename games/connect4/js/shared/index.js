/**
 * Connect4 Shared Utilities - Main exports
 *
 * Central export point for all shared utilities and clean architecture components
 */

// Export all constants
export * from './constants.js';

// Export all board utilities
export * from './board-utils.js';

// Export all event utilities
export * from './event-utils.js';

// Export all performance utilities
export * from './performance-utils.js';

// Export dependency injection system
export * from './service-container.js';

// Export interfaces and validation
export * from './interfaces.js';

// Export game factory
export * from './game-factory.js';

// Export clean architecture system
export * from './clean-architecture.js';

// Export architecture adapters
export * from './architecture-adapters.js';

// Export integration bridge
export * from './integration-bridge.js';

// Export standardized interfaces system
export * from './standardized-interfaces.js';

// Export interface compliance system
export * from './interface-compliance.js';

// Export auto-adapter system
export * from './auto-adapter.js';

// Re-export commonly used items for convenience
export { GAME_CONFIG, PLAYERS, ALL_DIRECTIONS, GAME_EVENTS, HINT_EVENTS } from './constants.js';

export {
  createEmptyBoard,
  copyBoard,
  simulateMove,
  getValidMoves,
  checkWinAtPosition,
  getOpponent
} from './board-utils.js';

export { EventEmitter, GameEventDispatcher } from './event-utils.js';

export { PerformanceTimer, createTimeout, profileFunction } from './performance-utils.js';

export {
  ServiceContainer,
  globalContainer,
  configureConnect4Services,
  createTestContainer
} from './service-container.js';

export { validateInterface, createInterfaceProxy, SERVICE_INTERFACES } from './interfaces.js';

export {
  GameFactory,
  defaultGameFactory,
  createGame,
  createTestGame,
  createDevGame,
  GAME_CONFIGURATIONS
} from './game-factory.js';

export {
  CleanArchitecture,
  defaultCleanArchitecture,
  execute as executeCleanArchitecture
} from './clean-architecture.js';

export {
  ArchitectureBridge,
  defaultArchitectureBridge,
  createAdapters,
  executeAction
} from './architecture-adapters.js';

export {
  IntegrationBridge,
  defaultIntegrationBridge,
  integrateComponents,
  executeIntegrated
} from './integration-bridge.js';

export {
  STANDARDIZED_INTERFACES,
  InterfaceValidator,
  InterfaceFactory,
  defaultValidator as standardizedValidator,
  defaultFactory as interfaceFactory,
  isValid as isInterfaceValid,
  validateOrThrow,
  getCompliance as getInterfaceCompliance,
  analyzeAllInterfaces
} from './standardized-interfaces.js';

export {
  ModuleComplianceAnalyzer,
  defaultComplianceAnalyzer,
  registerModule as registerForCompliance,
  getCompliance as getModuleCompliance,
  createMigrationPlan,
  generateFullReport as generateComplianceReport
} from './interface-compliance.js';

export {
  AutoAdapterGenerator,
  BatchAdapterManager,
  defaultAdapterGenerator,
  defaultBatchManager,
  adaptModule,
  autoAdapt,
  generateCode as generateAdapterCode,
  batchAdapt
} from './auto-adapter.js';

// Global access for backward compatibility
if (typeof window !== 'undefined') {
  // Import everything into global namespace
  import('./constants.js').then(constants => {
    Object.assign(window, constants);
  });

  import('./board-utils.js').then(boardUtils => {
    Object.assign(window, boardUtils);
  });

  import('./event-utils.js').then(eventUtils => {
    Object.assign(window, eventUtils);
  });

  import('./performance-utils.js').then(perfUtils => {
    Object.assign(window, perfUtils);
  });

  // Make clean architecture available globally
  import('./service-container.js').then(di => {
    window.ServiceContainer = di.ServiceContainer;
    window.globalContainer = di.globalContainer;
  });

  import('./game-factory.js').then(factory => {
    window.GameFactory = factory.GameFactory;
    window.defaultGameFactory = factory.defaultGameFactory;
  });

  import('./clean-architecture.js').then(cleanArch => {
    window.CleanArchitecture = cleanArch.CleanArchitecture;
    window.defaultCleanArchitecture = cleanArch.defaultCleanArchitecture;
  });

  import('./integration-bridge.js').then(bridge => {
    window.IntegrationBridge = bridge.IntegrationBridge;
    window.defaultIntegrationBridge = bridge.defaultIntegrationBridge;
  });
}
