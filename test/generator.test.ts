/**
 * Generator tests
 */

const fs = require('fs');
const path = require('path');

describe('Generator', () => {
  let generator: any;
  let mockApi: any;
  let mockOptions: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    generator = require('../generator');
    
    mockApi = {
      resolve: jest.fn((p) => path.join('/mock/project', p)),
      extendPackage: jest.fn(),
      render: jest.fn()
    };

    mockOptions = {
      port: '3000',
      run: 'npx tsx watch --tsconfig tsconfig.server.json ./src/server/index.ts',
      watchDir: './tsconfig.server.json',
      installTypeScript: true
    };

    // Mock fs.readFileSync to return a valid package.json
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      scripts: {}
    }));

    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    
    // Mock console methods to avoid JSON parsing errors in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should be a function', () => {
      expect(typeof generator).toBe('function');
    });

    it('should call api.extendPackage', () => {
      generator(mockApi, mockOptions);
      expect(mockApi.extendPackage).toHaveBeenCalled();
    });

    it('should add dev:serve script', () => {
      generator(mockApi, mockOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.scripts['dev:serve']).toContain('vue-cli-service dev:serve');
    });
  });

  describe('TypeScript support', () => {
    it('should add TypeScript dependencies when installTypeScript is true', () => {
      generator(mockApi, mockOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.devDependencies).toBeDefined();
      expect(callArgs.devDependencies.typescript).toBeDefined();
      expect(callArgs.devDependencies.tsx).toBeDefined();
      expect(callArgs.devDependencies.tsup).toBeDefined();
    });

    it('should not add TypeScript dependencies when installTypeScript is false', () => {
      const optionsWithoutTS = { ...mockOptions, installTypeScript: false };
      generator(mockApi, optionsWithoutTS);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.devDependencies).toEqual({});
    });

    it('should call api.render when TypeScript is enabled', () => {
      generator(mockApi, mockOptions);
      expect(mockApi.render).toHaveBeenCalledWith('./templates');
    });

    it('should add build:server script when TypeScript is enabled', () => {
      generator(mockApi, mockOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.scripts['build:server']).toContain('tsup');
    });
  });

  describe('Configuration', () => {
    it('should configure devServer proxy with correct port', () => {
      generator(mockApi, mockOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.vue.devServer.proxy).toBe('http://127.0.0.1:3000');
    });

    it('should configure pluginOptions.serverDev', () => {
      generator(mockApi, mockOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.vue.pluginOptions.serverDev).toEqual({
        run: mockOptions.run,
        watchDir: mockOptions.watchDir
      });
    });

    it('should use custom port from options', () => {
      const customOptions = { ...mockOptions, port: '8080' };
      generator(mockApi, customOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.vue.devServer.proxy).toBe('http://127.0.0.1:8080');
    });
  });

  describe('Script merging', () => {
    it('should append to existing script if it exists', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          'dev:serve': 'existing-command'
        }
      }));

      generator(mockApi, mockOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      expect(callArgs.scripts['dev:serve']).toContain('existing-command');
      expect(callArgs.scripts['dev:serve']).toContain('vue-cli-service dev:serve');
    });

    it('should not duplicate existing command', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          'dev:serve': 'vue-cli-service dev:serve'
        }
      }));

      generator(mockApi, mockOptions);
      
      const callArgs = mockApi.extendPackage.mock.calls[0][0];
      // Should not add && vue-cli-service dev:serve again
      expect(callArgs.scripts['dev:serve']).toBe('vue-cli-service dev:serve');
    });
  });
});
