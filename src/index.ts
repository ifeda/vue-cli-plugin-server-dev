import * as path from 'path';
import * as chokidar from 'chokidar';
import execa from 'execa';
import kill from 'tree-kill';
const debounce = require('lodash/debounce');

const {
  done,
  info,
  warn,
  error
} = require('@vue/cli-shared-utils');

interface ServerDevOptions {
  run?: string;
  watchDir?: string | string[];
}

interface PluginOptions {
  pluginOptions?: {
    serverDev?: ServerDevOptions;
  };
}

let serve: execa.ExecaChildProcess | null = null;
let isShuttingDown = false;

function asyncWaitUntil(predicate: () => boolean, ms = 50): Promise<void> {
  if (typeof predicate !== 'function') {
    throw new Error('predicate 必须是函数');
  }
  
  return new Promise(resolve => {
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
      }
    }, ms);
  });
}

module.exports = (api: any, options: PluginOptions) => {
  const opts: ServerDevOptions = (options.pluginOptions && options.pluginOptions.serverDev) || {};
  const run: string = opts.run || 'npx ts-node-dev --transpile-only ./src/server/index.ts';
  const watchDir: string | string[] | undefined = opts.watchDir;

  // Detect project type (with error handling for test environments)
  let isViteProject = false;
  try {
    const fs = require('fs');
    const pkgPath = api.resolve('./package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    const hasVite = pkg.devDependencies?.vite || 
                    pkg.dependencies?.vite || 
                    (pkg.scripts && Object.values(pkg.scripts).some((cmd: unknown) => typeof cmd === 'string' && cmd.includes('vite')));
    
    const hasVueCLI = pkg.devDependencies?.['@vue/cli-service'] ||
                      pkg.dependencies?.['@vue/cli-service'];
    
    // Priority: Vite > Vue CLI (if both exist, prefer Vite)
    // Also check if build script uses vite
    const buildScriptUsesVite = pkg.scripts?.build && typeof pkg.scripts.build === 'string' && pkg.scripts.build.includes('vite');
    isViteProject = (hasVite && !hasVueCLI) || (hasVite && hasVueCLI && buildScriptUsesVite);
  } catch (err) {
    // In test environment or if package.json doesn't exist, default to Vue CLI
    isViteProject = false;
  }

  api.registerCommand(
    'dev:serve',
    {
      description: 'start your development server and serve vue app on live',
      usage: 'vue-cli-service dev:serve',
      details: 'Will start your development server and proxy by vue webpack-dev-server'
    },
    async (args: any, rawArgs: any) => {
      function start(): Promise<void> {
        if (serve && !serve.killed) {
          warn('Server is already running');
          return Promise.resolve();
        }
        
        // Parse command and arguments
        const [cmd, ...cmdArgs] = run.split(/\s+/);
        
        serve = execa(cmd, cmdArgs, {
          stdio: 'inherit',
          shell: true,
          cleanup: true
        }) as execa.ExecaChildProcess;
        
        serve.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
          if (!isShuttingDown && !(serve as any).stoping) {
            warn(`Server process exited with code ${code} and signal ${signal}`);
          }
        });
        
        serve.on('error', (err: Error) => {
          error(`Failed to start server: ${err.message}`);
        });
        
        return new Promise((resolve) => {
          // Give the process a moment to start
          setTimeout(resolve, 100);
        });
      }

      function stop(): Promise<void> {
        return new Promise((resolve, reject) => {
          if (serve && serve.pid && !serve.killed) {
            const currentServe = serve; // Capture reference
            (currentServe as any).stoping = true;
            info('Stopping development server...');
            
            // Try graceful shutdown first
            try {
              if (process.platform === 'win32') {
                // On Windows, use taskkill
                execa('taskkill', ['/F', '/T', '/PID', currentServe.pid!.toString()], {
                  stdio: 'ignore'
                }).catch(() => {
                  // Fallback to tree-kill
                  kill(currentServe.pid!, 'SIGKILL', (err?: Error) => {
                    if (err) warn(err.message);
                    serve = null;
                    resolve();
                  });
                }).then(() => {
                  serve = null;
                  resolve();
                });
              } else {
                // On Unix-like systems, use tree-kill
                kill(currentServe.pid!, 'SIGTERM', (err?: Error) => {
                  if (err) {
                    warn(`Error during graceful shutdown: ${err.message}`);
                    // Force kill if graceful shutdown fails
                    kill(currentServe.pid!, 'SIGKILL', (forceErr?: Error) => {
                      if (forceErr) warn(forceErr.message);
                      serve = null;
                      resolve();
                    });
                  } else {
                    serve = null;
                    resolve();
                  }
                });
              }
            } catch (err: any) {
              warn(`Error stopping server: ${err.message}`);
              serve = null;
              resolve();
            }
          } else {
            serve = null;
            resolve();
          }
        });
      }

      // Handle process termination signals
      const handleShutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        
        info(`Received ${signal}, shutting down...`);
        await stop();
        process.exit(0);
      };
      
      process.on('SIGINT', () => handleShutdown('SIGINT'));
      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (err: Error) => {
        error(`Uncaught Exception: ${err.message}`);
        handleShutdown('uncaughtException');
      });
      
      process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
      });

      // Start frontend dev server based on project type
      let frontendServer: execa.ExecaChildProcess | null = null;
      
      if (isViteProject) {
        // For Vite projects, start vite dev server directly
        info('Starting Vite development server...');
        const [viteCmd, ...viteArgs] = 'vite'.split(/\s+/);
        
        frontendServer = execa(viteCmd, viteArgs, {
          stdio: 'inherit',
          shell: true,
          cleanup: true
        }) as execa.ExecaChildProcess;
        
        frontendServer.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
          if (!isShuttingDown) {
            warn(`Vite process exited with code ${code} and signal ${signal}`);
          }
        });
        
        frontendServer.on('error', (err: Error) => {
          error(`Failed to start Vite: ${err.message}`);
        });
        
        // Wait for Vite to start, then start backend server
        setTimeout(() => {
          start().then(() => {
            setupWatcher();
          }).catch(error);
        }, 2000);
      } else {
        // For Vue CLI projects, use the original approach
        return api.service.run('serve', {
          _: [],
          dashboard: args.dashboard,
          https: args.https
        })
          .then(start)
          .then(() => {
            setupWatcher();
          }).catch(error);
      }
      
      function setupWatcher() {
        if (watchDir) {
          // watch file changes
          const watcher = chokidar.watch(watchDir, {
            ignored: /node_modules|\.git/,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
              stabilityThreshold: 300,
              pollInterval: 100
            },
            depth: 99
          });
          
          watcher.on('ready', () => {
            info(`Watching for changes in: ${watchDir}`);
          });
          
          watcher.on('change', debounce((filePath: string) => {
            if (isShuttingDown || (serve && (serve as any).stoping)) {
              return;
            }
            
            info(`Detect ${filePath} changed, restarting development server...`);
            
            (async () => {
              try {
                await stop();
                await start();
                done('Success restarted development server!');
              } catch (err: any) {
                error(`Failed to restart server: ${err.message}`);
              }
            })();
          }, 500));
          
          watcher.on('error', (err: Error) => {
            error(`Watcher error: ${err.message}`);
          });
          
          // Store watcher reference for cleanup
          if (isViteProject) {
            (frontendServer as any).__serverDevWatcher = watcher;
          } else {
            api.service.__serverDevWatcher = watcher;
          }
        }
      }
    }
  );
};

module.exports.defaultModes = {
  'dev:build': 'production',
  'dev:serve': 'development'
};
