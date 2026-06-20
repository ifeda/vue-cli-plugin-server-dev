const fs = require('fs')
const path = require('path')
const { warn, done, info } = require('@vue/cli-shared-utils')

module.exports = (api, options = {}) => {
  let devDependencies = {}, pkg = fs.readFileSync(api.resolve('./package.json'), 'utf8')
  pkg = JSON.parse(pkg)
  const scripts = {}
  const addScript = (name, command) => {
    // Add on to existing script if it exists
    if (pkg.scripts && pkg.scripts[name]) {
      // Don't re-add script
      if (!pkg.scripts[name].match(command)) {
        // add command to existing script
        scripts[name] = pkg.scripts[name] + ` && ${command}`
      } else {
        // command already exists, don't change it
        scripts[name] = pkg.scripts[name]
      }
    } else {
      // Create new postinstall script
      scripts[name] = command
    }
  }
  addScript('dev:serve', 'vue-cli-service dev:serve')

  // Detect project type by checking package.json dependencies
  const vueConfigPath = api.resolve('./vue.config.js')
  const viteConfigPath = api.resolve('./vite.config.js')
  
  // Check if project uses Vite by looking for vite in devDependencies or scripts
  const hasVite = pkg.devDependencies?.vite || 
                  pkg.dependencies?.vite || 
                  (pkg.scripts && Object.values(pkg.scripts).some(cmd => cmd.includes('vite')))
  
  // Check if project uses Vue CLI by looking for @vue/cli-service
  const hasVueCLI = pkg.devDependencies?.['@vue/cli-service'] ||
                    pkg.dependencies?.['@vue/cli-service']
  
  // Determine project type: Vite takes precedence if both exist
  const isViteProject = hasVite && !hasVueCLI
  const configFile = isViteProject ? viteConfigPath : vueConfigPath
  const configFileName = isViteProject ? 'vite.config.js' : 'vue.config.js'
  const configExists = fs.existsSync(configFile)
  
  if (!configExists) {
    // Create default configuration file
    const configContent = isViteProject 
      ? `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist/public', // Server code outputs to dist/, Vue outputs to dist/public/
  }
})
`
      : `const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: 'dist/public', // Server code outputs to dist/, Vue outputs to dist/public/
})
`
    fs.writeFileSync(configFile, configContent)
    done(`Created ${configFileName} with output directory set to dist/public`)
  }
  
  // Add TypeScript support if requested
  if (options.installTypeScript) {
    addScript('build:server', 'tsup --tsconfig tsconfig.server.json')
    addScript('build:all', 'npm run build:server && npm run build')
    
    devDependencies = {
      "typescript": "^5.3.3",
      "ts-node-dev": "^1.2.3",
      "tsup": "^8.0.0",
      "terser": "^5.27.0",
      "@types/node": "^20.11.0"
    }
    
    // Render template files using api.render
    // Templates are plain JS files (no EJS syntax needed)
    api.render('./templates')
    done('Copied tsup configuration templates')
    
    // Create tsconfig.json for server code
    const tsConfigPath = api.resolve('./tsconfig.server.json')
    if (!fs.existsSync(tsConfigPath)) {
      const tsConfig = {
        compilerOptions: {
          target: "ES2018",
          module: "commonjs",
          lib: ["ES2018"],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          outDir: "./dist",
          rootDir: "./src/server",
          sourceMap: true
        },
        include: ["src/server/**/*"],
        exclude: ["node_modules"]
      }
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2))
      done('Created tsconfig.server.json for your server code')
    }
    
    // Create example server file
    const serverDir = api.resolve('./src/server')
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true })
      const exampleServer = `import * as http from 'http';
import * as url from 'url';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  
  // Set CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Simple routing
  if (parsedUrl.pathname === '/api/hello' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Hello from TypeScript backend!',
      timestamp: new Date().toISOString()
    }));
  } else if (parsedUrl.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      path: parsedUrl.pathname
    }));
  }
});

server.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`Health check: http://localhost:\${PORT}/api/health\`);
  console.log(\`Hello API: http://localhost:\${PORT}/api/hello\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
`
      fs.writeFileSync(path.join(serverDir, 'index.ts'), exampleServer)
      done('Created example server at src/server/index.ts')
    }
  }

  api.extendPackage({
    scripts,
    devDependencies,
    vue: {
      devServer: {
        proxy: 'http://127.0.0.1:' + options.port
      },
      pluginOptions: {
        serverDev: {
          run: options.run,
          watchDir: options.watchDir,
        },
      },
    },
  })

  // Show important warnings and instructions after installation
  if (options.installTypeScript) {
    console.log('')
    info('⚠️  IMPORTANT: Build Order and Configuration')
    console.log('')
    
    if (!configExists) {
      info(`✓ ${configFileName} has been created with output directory set to "dist/public"`)
    } else {
      warn(`⚠️  Please update your ${configFileName}:`)
      const configKey = isViteProject ? 'build.outDir' : 'outputDir'
      console.log(`   Change ${configKey} to: "dist/public"`)
      console.log('   This ensures server code (dist/) and Vue code (dist/public/) are separated')
      console.log('')
    }
    
    warn('⚠️  CRITICAL: Always build server BEFORE building Vue app!')
    console.log('')
    console.log('   Correct build order:')
    console.log('   1. npm run build:server    # Compiles server to dist/')
    console.log('   2. npm run build           # Compiles Vue to dist/public/')
    console.log('')
    console.log('   ⚠️  If you run "npm run build" (Vue) first, tsup will clean the dist/')
    console.log('       directory when building server and delete your compiled Vue code!')
    console.log('')
    console.log('   ✓ Added "build:all" script to package.json:')
    console.log('     npm run build:all    # Builds both server and Vue in correct order')
    console.log('')
  }

  done(`Install completed. You can change options by the configure file "${configFileName}".`)
}
