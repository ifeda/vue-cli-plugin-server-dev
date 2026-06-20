# vue-cli-plugin-server-dev

Easily start Your development server program and proxy it by Vue App Dev Server!

If you are a full stack engineer, such as using express/koa+vue development, you may need to develop both express/koa and vue code. Using this plugin will make it easy to integrate frontend and backend code for development. This plugin can watch code changes and automatically restart the development server (you can also add the --respawn parameter to ts-node-dev to use its hot-restart feature, in which case you should set watchDir to null).

**v2.0.0 Major Update**: Now fully migrated to TypeScript, removed Babel and Rollup dependencies, providing a simpler development experience!

**中文版请查看**: [README_CN.md](README_CN.md)



## Install

```bash
vue add server-dev
```



## Options

Normally, it will be automatically configured during installation. Of course, you can also change the options by modifying the configuration file.

**Supports both Vue CLI and Vite projects:**
- **Vue CLI projects**: Uses `vue.config.js`
- **Vite projects**: Uses `vite.config.js`

**Smart project type detection:**
- The plugin automatically detects your project type (based on dependencies in `package.json`)
- If both Vite and Vue CLI are installed, it prefers Vite (by checking if the `build` script contains `vite` command)
- This allows smooth migration from Vue CLI to Vite without manually removing `@vue/cli-service`

There are two options to pay attention: devServer and pluginOptions:serverDev



### devServer

This options was originally for vue(webpack-dev-server), But you must modify the proxy to point to the development server.

Generally, proxy options will be automatically added:

```javascript
devServer: {
  proxy: 'http://127.0.0.1:3000'
},
```

If you changed the service port of development server, you should change the port `proxy: 'http://127.0.0.1:<port>'`



### pluginOptions:serverDev

Generally, configuration will be automatically added:

```javascript
pluginOptions: {
  serverDev: {
    run: 'npx ts-node-dev --transpile-only ./src/server/index.ts',  // TypeScript (default)
    // or: 'node ./src/server/index.js',                            // JavaScript
    watchDir: './src/server/**'
  }
}
```

The key of "serverDev" is for vue-cli-plugin-server-dev. There are only two options:

- **run**: (string) specify the command to start your development server
  - For TypeScript: `'npx ts-node-dev --transpile-only ./src/server/index.ts'` (recommended, default)
    - `ts-node-dev` provides faster restarts and better watching than `ts-node`
    - `--transpile-only` skips type checking for faster startup (use without it if you want type checking)
  - For JavaScript: `'node ./src/server/index.js'`
  - For custom setup: Any command that starts your server

- **watchDir**: (string or array of strings) specify the glob patterns with the directory where your server development code is.
  - Changes in this directory will trigger automatic server restart
  - Example: `'./src/server/**'` or `['./src/server/**', './src/shared/**']`



## Features

### ✨ Automatic Server Restart
- Watches your server code directory for changes
- Automatically restarts the development server when files change
- Smart debouncing (500ms) to avoid frequent restarts
- Waits for file writes to complete before restarting

### 🔄 Graceful Process Management
- Proper signal handling (SIGINT, SIGTERM)
- Cross-platform support (Windows, Linux, macOS)
- Graceful shutdown with fallback to force kill
- Prevents duplicate server instances

### 📝 TypeScript Support
- Full TypeScript support out of the box
- Auto-generates `tsconfig.server.json` for server code
- Type-safe development experience
- Optional - works with plain JavaScript too

### 🔌 Vue DevServer Integration
- Automatically proxies requests to your backend server
- Seamless full-stack development workflow
- No CORS issues during development

## TypeScript Support

Version 2.0.0+ fully supports TypeScript! When installing, you can choose to enable TypeScript support:

- ✅ Automatic creation of `tsconfig.server.json`
- ✅ Copy `tsup.config.js` and `tsup.share.js` templates for production builds
- ✅ Example TypeScript server code using Node.js built-in `http` module (zero dependencies)
- ✅ Type-safe development experience
- ✅ Optional - you can use plain JavaScript instead
- ✅ Smart output directory configuration (`dist/` for server, `dist/public/` for Vue)

### Build Configuration

When TypeScript support is enabled, the plugin configures separate output directories:

- **Server code**: Compiles to `dist/` directory
- **Vue app**: Compiles to `dist/public/` directory

This prevents conflicts between server and frontend builds.

**Smart output directory configuration:**
- For **Vue CLI projects**: Automatically creates/updates `vue.config.js` with `outputDir: 'dist/public'`
- For **Vite projects**: Automatically creates/updates `vite.config.js` with `build.outDir: 'dist/public'`

The plugin detects your project type and applies the correct configuration automatically.

### ⚠️ Important: Build Order

**Always build server BEFORE building Vue app!**

```bash
# Step 1: Build server first
npm run build:server    # Compiles TypeScript server to dist/

# Step 2: Then build Vue app
npm run build           # Compiles Vue app to dist/public/
```

**Why this order?** tsup's build process cleans the `dist/` directory before building. If you build Vue first and then build server, tsup will delete your compiled Vue code from `dist/public/`!

**Recommended**: The plugin automatically adds a `build:all` script to your `package.json`:

```json
{
  "scripts": {
    "build:all": "npm run build:server && npm run build"
  }
}
```

Simply use:

```bash
npm run build:all    # Builds both server and Vue in correct order
```

For detailed migration guide, see [docs/MIGRATION_TO_TS.md](docs/MIGRATION_TO_TS.md)



## Examples

### Zero-Dependency Server (Auto-generated)

When you choose TypeScript support during installation, a zero-dependency example is created automatically using Node.js built-in `http` module:

```typescript
// src/server/index.ts
import * as http from 'http';
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Hello API: http://localhost:${PORT}/api/hello`);
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
```

**Note**: This example uses only Node.js built-in modules (no external dependencies). You can easily replace it with Express, Koa, Fastify, or any other framework.

### Express + TypeScript 

```typescript
// src/server/index.ts
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from TypeScript backend!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Koa + TypeScript

```typescript
// src/server/index.ts
import Koa from 'koa';
import Router from '@koa/router';

const app = new Koa();
const router = new Router();

router.get('/api/hello', (ctx) => {
  ctx.body = { message: 'Hello from Koa!' };
});

app.use(router.routes());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Koa server running on port ${PORT}`);
});
```

### Fastify + TypeScript

```typescript
// src/server/index.ts
import Fastify from 'fastify';

const fastify = Fastify();

fastify.get('/api/hello', async (request, reply) => {
  return { message: 'Hello from Fastify!' };
});

const PORT = process.env.PORT || 3000;
fastify.listen({ port: PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Fastify server running on port ${PORT}`);
});
```

### Plain JavaScript (No TypeScript)

If you prefer JavaScript, just configure the run command:

```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    serverDev: {
      run: 'node ./src/server/index.js',  // Use node directly
      watchDir: './src/server/**'
    }
  }
}
```

```javascript
// src/server/index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from JavaScript!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```



## Development

### Build

```bash
npm run build        # Compile TypeScript to JavaScript
npm run dev          # Watch mode for development
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

Tests are located in the `test/` directory and use Jest + ts-jest.

### Linting

```bash
npm run lint         # Run ESLint on TypeScript files
```

## Documentation

For detailed documentation, please refer to:

- [TypeScript Migration Guide](docs/MIGRATION_TO_TS.md) - Complete guide for migrating from v1.x to v2.0.0
- [TypeScript Migration Summary](docs/TYPESCRIPT_MIGRATION_SUMMARY.md) - Detailed migration report and analysis

**Chinese Version (中文版)**:
- [TypeScript 迁移指南](docs/MIGRATION_TO_TS_CN.md)
- [TypeScript 迁移总结](docs/TYPESCRIPT_MIGRATION_SUMMARY_CN.md)

## Changelog

### v2.0.0 (June 2026)
- 🎉 **Major Update**: Migrated to TypeScript
- ✅ Removed Babel and Rollup dependencies
- ✅ Added ts-node-dev support
- ✅ Simplified configuration
- ✅ Better type safety
- ✅ Improved developer experience

### v1.1.0 (June 2026)
- Fixed compatibility issues with Node.js v18+
- Updated execa to v5.x
- Updated chokidar to v3.6.0
- Improved process management
- Enhanced file watching

### v1.0 (July 2023)
- Initial release, extracted and modified from vue-cli-plugin-express-dev
