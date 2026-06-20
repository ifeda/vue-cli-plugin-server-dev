# vue-cli-plugin-server-dev v2.0.0 - TypeScript Migration Guide

## 🎉 Major Update

Version 2.0.0 is a major update. The project has been fully migrated to TypeScript, and Babel and Rollup dependencies have been removed.

### Key Changes

#### ✅ New Features
- **TypeScript Support**: The plugin itself is written in TypeScript
- **ts-node-dev Integration**: Recommended to use ts-node-dev for running backend code
- **Type Safety**: Complete type definitions and checking
- **Simplified Configuration**: Removed complex Babel/Rollup configurations

#### ❌ Removed Features
- **Babel Related**: No longer need `@babel/core`, `@babel/node`, etc.
- **Rollup Related**: No longer need `rollup`, `@rollup/plugin-*`, etc.
- **rollup.config.js**: No longer automatically generates Rollup configuration

## 📦 Upgrade Steps

### Upgrading from v1.x to v2.0.0

```bash
# 1. Uninstall old version
npm uninstall vue-cli-plugin-server-dev

# 2. Install new version
vue add server-dev

# 3. Or manually update
npm install vue-cli-plugin-server-dev@latest
```

### Configuration Changes

#### Old Configuration (v1.x)
```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    serverDev: {
      run: 'npx babel-node ./src/index.js',  // Use babel-node
      watchDir: './src/server/**'
    }
  }
}
```

#### New Configuration (v2.0.0)
```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    serverDev: {
      run: 'npx ts-node-dev --transpile-only ./src/server/index.ts',  // Use ts-node-dev
      watchDir: './src/server/**'
    }
  }
}
```

## 🚀 Quick Start

### 1. Install Plugin

```bash
vue add server-dev
```

During installation, you will be asked:
- **Startup command**: Default `npx ts-node-dev --transpile-only ./src/server/index.ts`
- **Server port**: Default `3000`
- **Watch directory**: Default `./src/server/**`
- **Install TypeScript support**: Recommended `Yes`

### 2. Create TypeScript Server

If you choose to install TypeScript support, the plugin will automatically create:

- Copy `tsup.config.js` and `tsup.share.js` templates for production builds
- Create a zero-dependency example server using Node.js built-in `http` module
- Generate `tsconfig.server.json` configuration with `outDir: "./dist"`
- Create or update `vue.config.js` with `outputDir: "dist/public"`

**Output Directory Structure**:

```
dist/
├── index.js          # Compiled server code
├── index.js.map      # Source map for server
└── public/           # Vue app build output
    ├── index.html
    ├── css/
    └── js/
```

This separation prevents conflicts between server and frontend builds.

**Example Server Code (Auto-generated)**:

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

And TypeScript configuration:

```json
// tsconfig.server.json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "lib": ["ES2018"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src/server",
    "sourceMap": true
  },
  "include": ["src/server/**/*"],
  "exclude": ["node_modules"]
}
```

### 3. Start Development Server

```bash
npm run dev:serve
```

## ⚠️ Important: Build Order and Configuration

When using TypeScript support, proper build order is **critical**:

### vue.config.js Configuration

The plugin will create or update `vue.config.js` with:

```javascript
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: 'dist/public', // Vue app outputs to dist/public/
})
```

If `vue.config.js` already exists, you need to manually update the `outputDir` to `'dist/public'`.

### Build Order

**Always build server BEFORE building Vue app!**

```bash
# Step 1: Build server first
npm run build:server    # Compiles TypeScript server to dist/

# Step 2: Then build Vue app
npm run build           # Compiles Vue app to dist/public/
```

**Why this order?** tsup's build process cleans the entire `dist/` directory before building. If you run `npm run build` (Vue) first and then build server, tsup will delete your compiled Vue code from `dist/public/`!

### Recommended: Combined Build Script

The plugin automatically adds a `build:all` script to your `package.json`:

```json
{
  "scripts": {
    "build:all": "npm run build:server && npm run build"
  }
}
```

Then use:

```bash
npm run build:all    # Builds both server and Vue in correct order
```

## 💡 Using JavaScript Instead of TypeScript

If you prefer using JavaScript, you can configure it like this:

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

No need to install TypeScript-related dependencies.

## 🔧 Advanced Configuration

### Custom TypeScript Configuration

You can modify `tsconfig.server.json` to meet your needs:

```json
{
  "compilerOptions": {
    "target": "ES2020",           // Use newer ECMAScript version
    "experimentalDecorators": true, // Enable decorators
    "emitDecoratorMetadata": true
  }
}
```

### Using Other Frameworks

#### Koa + TypeScript

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

#### Fastify + TypeScript

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

## 📊 Comparison: v1.x vs v2.0.0

| Feature | v1.x | v2.0.0 |
|---------|------|--------|
| Language | JavaScript | TypeScript |
| Runtime | babel-node | ts-node-dev / node |
| Build Tool | Rollup | No build required (ts-node-dev JIT compilation) |
| Config File | rollup.config.js | tsconfig.server.json |
| Dependencies | ~20+ | ~5 |
| Type Support | ❌ | ✅ |
| Dev Experience | Requires compilation | Instant run |
| Production Deploy | Requires build | Optional build or direct deploy |

## 🎯 Benefits

### 1. Simpler Configuration
- No more complex Rollup configuration
- TypeScript configuration is clear and simple
- Out-of-the-box development experience

### 2. Better Developer Experience
- ts-node-dev instant compilation, no pre-compilation needed
- Complete type hints and auto-completion
- Compile-time error checking

### 3. Fewer Dependencies
- Removed Babel and Rollup related dependencies
- Reduced node_modules size
- Faster installation speed

### 4. Type Safety
- Complete TypeScript type definitions
- Catch errors at compile time
- Better IDE support

## ⚠️ Important Notes

### 1. Performance Considerations

**Development Environment**: ts-node-dev has slight performance overhead (JIT compilation), but it's acceptable for development.

**Production Environment**: It's recommended to pre-compile TypeScript to JavaScript:

```bash
# Compile
tsc -p tsconfig.server.json

# Run compiled code
node dist-server/index.js
```

### 2. ts-node-dev Registration

Make sure you have the correct `tsconfig.json` in the project root or `src/server` directory.

### 3. Module Resolution

If you encounter module resolution issues, add this to `tsconfig.server.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## 🔍 Troubleshooting

### Q: ts-node-dev cannot find modules?

A: Make sure you've installed necessary type definitions:

```bash
npm install --save-dev @types/express @types/node
```

### Q: Compilation errors?

A: Check `tsconfig.server.json` configuration, ensure `rootDir` and `outDir` are set correctly.

### Q: Want to continue using Babel?

A: You can manually configure it, but it's no longer recommended. If needed, configure like this:

```javascript
// vue.config.js
pluginOptions: {
  serverDev: {
    run: 'npx babel-node ./src/server/index.js',
    watchDir: './src/server/**'
  }
}
```

Then manually install Babel-related dependencies.

### Q: How to debug TypeScript code?

A: Use VS Code debugging configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "runtimeArgs": ["-r", "ts-node-dev/register"],
  "args": ["${workspaceFolder}/src/server/index.ts"],
  "cwd": "${workspaceFolder}",
  "protocol": "inspector"
}
```

## 📚 Resources

- [TypeScript Official Documentation](https://www.typescriptlang.org/)
- [ts-node Documentation](https://typestrong.org/ts-node/) (ts-node-dev is built on top of ts-node)
- [Vue CLI Plugin Development](https://cli.vuejs.org/dev-guide/plugin-dev.html)

## 🎊 Summary

v2.0.0 brings a more modern and streamlined development experience:

✅ **Native TypeScript Support**  
✅ **Simplified Configuration**  
✅ **Fewer Dependencies**  
✅ **Better Type Safety**  
✅ **Faster Development Iteration**  

Upgrade to v2.0.0 now and enjoy a better development experience!

---

**Update Date**: 2026-06-20  
**Version**: 2.0.0  
**Migration Difficulty**: ⭐⭐ (Easy)
