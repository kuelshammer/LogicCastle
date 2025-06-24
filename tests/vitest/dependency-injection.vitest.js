import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Dependency Injection System Tests
 * 
 * Validates the new ServiceContainer, interfaces, and GameFactory
 * implementations for clean architecture patterns.
 */

describe('Dependency Injection System', () => {
    let ServiceContainer, GameFactory, interfaces;
    let container, factory;

    beforeEach(async () => {
        // Dynamic imports to avoid module loading issues
        const containerModule = await import('../../games/connect4/js/shared/service-container.js');
        const factoryModule = await import('../../games/connect4/js/shared/game-factory.js');
        const interfaceModule = await import('../../games/connect4/js/shared/interfaces.js');

        ServiceContainer = containerModule.ServiceContainer;
        GameFactory = factoryModule.GameFactory;
        interfaces = interfaceModule;

        container = new ServiceContainer();
        factory = new GameFactory(container);
    });

    afterEach(() => {
        if (container) {
            container.clear();
        }
    });

    describe('ServiceContainer Core Functionality', () => {
        it('should register and resolve simple services', () => {
            class TestService {
                getValue() { return 'test-value'; }
            }

            container.register('ITestService', TestService);
            const service = container.resolve('ITestService');

            expect(service).toBeInstanceOf(TestService);
            expect(service.getValue()).toBe('test-value');
        });

        it('should support singleton services', () => {
            class SingletonService {
                constructor() {
                    this.id = Math.random();
                }
            }

            container.registerSingleton('ISingleton', SingletonService);
            
            const service1 = container.resolve('ISingleton');
            const service2 = container.resolve('ISingleton');

            expect(service1).toBe(service2);
            expect(service1.id).toBe(service2.id);
        });

        it('should handle factory functions', () => {
            let creationCount = 0;

            container.registerFactory('IFactory', (container) => {
                return (type) => {
                    creationCount++;
                    return { type, count: creationCount };
                };
            });

            const factory = container.resolve('IFactory');
            const instance1 = factory('type1');
            const instance2 = factory('type2');

            expect(instance1.type).toBe('type1');
            expect(instance2.type).toBe('type2');
            expect(instance1.count).toBe(1);
            expect(instance2.count).toBe(2);
        });

        it('should inject dependencies correctly', () => {
            class DatabaseService {
                connect() { return 'connected'; }
            }

            class UserService {
                constructor(database) {
                    this.database = database;
                }
                
                getUser() {
                    return this.database.connect() ? 'user-data' : null;
                }
            }

            container.register('IDatabase', DatabaseService);
            container.register('IUserService', UserService, {
                dependencies: ['IDatabase']
            });

            const userService = container.resolve('IUserService');
            expect(userService.getUser()).toBe('user-data');
        });

        it('should throw error for unregistered services', () => {
            expect(() => {
                container.resolve('IUnknownService');
            }).toThrow('Service \'IUnknownService\' not registered');
        });

        it('should support child containers', () => {
            container.register('IParentService', class Parent { getValue() { return 'parent'; } });
            
            const child = container.createChild();
            child.register('IChildService', class Child { getValue() { return 'child'; } });

            // Child can access parent services
            expect(child.resolve('IParentService').getValue()).toBe('parent');
            
            // Parent cannot access child services
            expect(() => container.resolve('IChildService')).toThrow();
        });
    });

    describe('Interface Validation', () => {
        it('should validate objects against interfaces', () => {
            const mockInterface = {
                method1: 'function',
                method2: 'function',
                property1: 'string'
            };

            const validObject = {
                method1: () => {},
                method2: () => {},
                property1: 'value'
            };

            const invalidObject = {
                method1: () => {},
                // missing method2
                property1: 123 // wrong type
            };

            expect(() => {
                interfaces.validateInterface(validObject, mockInterface, 'ValidObject');
            }).not.toThrow();

            expect(() => {
                interfaces.validateInterface(invalidObject, mockInterface, 'InvalidObject');
            }).toThrow();
        });

        it('should create interface proxies for runtime validation', () => {
            const mockInterface = {
                getValue: 'function'
            };

            const validObject = {
                getValue: () => 'test'
            };

            const proxy = interfaces.createInterfaceProxy(validObject, mockInterface, 'TestObject');
            expect(proxy.getValue()).toBe('test');
        });

        it('should validate known service interfaces', () => {
            const gameEngineInterface = interfaces.SERVICE_INTERFACES.IGameEngine;
            expect(gameEngineInterface).toBeDefined();
            expect(gameEngineInterface.makeMove).toBe('function');
            expect(gameEngineInterface.getBoard).toBe('function');
        });
    });

    describe('GameFactory Configuration', () => {
        it('should configure for testing environment', async () => {
            factory.configure('testing');
            
            const gameSetup = await factory.createGame();
            expect(gameSetup.game).toBeDefined();
            expect(gameSetup.helpers).toBeDefined();
            expect(gameSetup.aiFactory).toBeDefined();

            // Test that it's using mock implementations
            const bot = await gameSetup.aiFactory('easy');
            expect(bot.getBestMove()).toBe(3); // Mock always returns center column
        });

        it('should create bots with different difficulties', async () => {
            factory.configure('testing');
            
            const easyBot = await factory.createBot('easy');
            const mediumBot = await factory.createBot('medium');

            expect(easyBot.getDifficulty()).toBe('easy');
            expect(mediumBot.getDifficulty()).toBe('medium');
        });

        it('should handle configuration errors gracefully', () => {
            expect(() => {
                factory.configure('invalid-environment');
            }).toThrow('Unknown environment: invalid-environment');
        });

        it('should not reconfigure when already configured', () => {
            factory.configure('testing');
            expect(factory.isConfigured).toBe(true);

            // Should not throw or change configuration
            factory.configure('production');
            expect(factory.isConfigured).toBe(true);
        });

        it('should reset configuration properly', () => {
            factory.configure('testing');
            expect(factory.isConfigured).toBe(true);

            factory.reset();
            expect(factory.isConfigured).toBe(false);
        });
    });

    describe('Game Instance Creation', () => {
        it('should create functional game instances', async () => {
            factory.configure('testing');
            
            const gameSetup = await factory.createGame();
            const { game, helpers, aiFactory } = gameSetup;

            // Test basic game functionality
            expect(game.getBoard()).toBeDefined();
            expect(game.getValidMoves()).toContain(3); // Should include center column
            expect(game.getCurrentPlayer()).toBe(1);
            expect(game.isGameOver()).toBe(false);

            // Test move making
            const result = game.makeMove(3);
            expect(result.success).toBe(true);
        });

        it('should create game with UI when DOM element provided', async () => {
            factory.configure('testing');
            
            // Mock DOM element
            const mockGameBoard = {
                appendChild: () => {},
                querySelector: () => null,
                addEventListener: () => {}
            };

            const gameSetup = await factory.createGameWithUI(mockGameBoard, { testing: true });
            expect(gameSetup.game).toBeDefined();
            expect(gameSetup.helpers).toBeDefined();
            // UI should not be created in testing mode
            expect(gameSetup.ui).toBeUndefined();
        });

        it('should validate interfaces when requested', async () => {
            factory.configure('testing');
            
            const gameSetup = await factory.createGame({ validateInterfaces: true });
            
            // Should not throw with valid mock implementations
            expect(gameSetup.game).toBeDefined();
            expect(gameSetup.helpers).toBeDefined();
        });
    });

    describe('Integration with Legacy Code', () => {
        it('should maintain backward compatibility', async () => {
            factory.configure('testing');
            
            const gameSetup = await factory.createGame();
            const { game } = gameSetup;

            // Test that essential game methods exist and work
            expect(typeof game.makeMove).toBe('function');
            expect(typeof game.getBoard).toBe('function');
            expect(typeof game.getValidMoves).toBe('function');
            expect(typeof game.on).toBe('function');
            expect(typeof game.emit).toBe('function');

            // Test event system works
            let eventFired = false;
            game.on('test', () => { eventFired = true; });
            game.emit('test');
            expect(eventFired).toBe(true);
        });

        it('should support asynchronous service resolution', async () => {
            // Register async service using factory
            container.registerFactory('IAsyncService', () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            getValue: () => 'async-value'
                        });
                    }, 10);
                });
            });

            const service = await container.resolve('IAsyncService');
            expect(service.getValue()).toBe('async-value');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle circular dependencies gracefully', () => {
            class ServiceA {
                constructor(serviceB) {
                    this.serviceB = serviceB;
                }
            }

            class ServiceB {
                constructor(serviceA) {
                    this.serviceA = serviceA;
                }
            }

            container.register('IServiceA', ServiceA, { dependencies: ['IServiceB'] });
            container.register('IServiceB', ServiceB, { dependencies: ['IServiceA'] });

            // This should throw or handle gracefully
            expect(() => {
                container.resolve('IServiceA');
            }).toThrow();
        });

        it('should handle malformed service registrations', () => {
            expect(() => {
                container.register(null, class TestService {});
            }).toThrow('Service name cannot be null or undefined');

            expect(() => {
                container.register('ITestService', null);
            }).toThrow('Implementation cannot be null or undefined');
        });

        it('should clear all services properly', () => {
            container.register('IService1', class Service1 {});
            container.register('IService2', class Service2 {});
            container.registerSingleton('ISingleton', class Singleton {});

            expect(container.has('IService1')).toBe(true);
            expect(container.has('ISingleton')).toBe(true);

            container.clear();

            expect(container.has('IService1')).toBe(false);
            expect(container.has('ISingleton')).toBe(false);
        });
    });
});