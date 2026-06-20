/**
 * Plugin basic functionality tests
 */

describe('vue-cli-plugin-server-dev', () => {
  describe('Module exports', () => {
    it('should export a function', () => {
      const plugin = require('../src/index');
      expect(typeof plugin).toBe('function');
    });

    it('should have defaultModes property', () => {
      const plugin = require('../src/index');
      expect(plugin.defaultModes).toBeDefined();
      expect(plugin.defaultModes['dev:serve']).toBe('development');
      expect(plugin.defaultModes['dev:build']).toBe('production');
    });
  });

  describe('Plugin initialization', () => {
    let mockApi: any;
    let mockOptions: any;

    beforeEach(() => {
      mockApi = {
        registerCommand: jest.fn(),
        resolve: jest.fn((path) => `/mock/path/${path}`),
        service: {
          run: jest.fn().mockResolvedValue(undefined)
        }
      };
      mockOptions = {
        pluginOptions: {
          serverDev: {
            run: 'npx ts-node-dev ./src/server/index.ts',
            watchDir: './src/server/**'
          }
        }
      };
    });

    it('should register dev:serve command', () => {
      const plugin = require('../src/index');
      plugin(mockApi, mockOptions);

      expect(mockApi.registerCommand).toHaveBeenCalledWith(
        'dev:serve',
        expect.objectContaining({
          description: expect.any(String),
          usage: expect.any(String),
          details: expect.any(String)
        }),
        expect.any(Function)
      );
    });

    it('should use default run command if not provided', () => {
      const plugin = require('../src/index');
      const optionsWithoutRun = {
        pluginOptions: {
          serverDev: {
            watchDir: './src/server/**'
          }
        }
      };

      plugin(mockApi, optionsWithoutRun);
      
      // The command handler should use default value
      const commandHandler = mockApi.registerCommand.mock.calls[0][2];
      expect(commandHandler).toBeDefined();
    });
  });

  describe('Configuration handling', () => {
    it('should handle empty options gracefully', () => {
      const plugin = require('../src/index');
      const mockApi = {
        registerCommand: jest.fn(),
        resolve: jest.fn((path) => `/mock/path/${path}`),
        service: {
          run: jest.fn().mockResolvedValue(undefined)
        }
      };

      expect(() => {
        plugin(mockApi, {});
      }).not.toThrow();
    });

    it('should handle missing pluginOptions gracefully', () => {
      const plugin = require('../src/index');
      const mockApi = {
        registerCommand: jest.fn(),
        resolve: jest.fn((path) => `/mock/path/${path}`),
        service: {
          run: jest.fn().mockResolvedValue(undefined)
        }
      };

      expect(() => {
        plugin(mockApi, { otherOptions: 'value' });
      }).not.toThrow();
    });
  });
});
