# vue-cli-plugin-server-dev v2.0.0 - TypeScript 迁移指南

## 🎉 重大更新

版本 2.0.0 是一个重大更新，项目已完全迁移到 TypeScript，并移除了 Babel 和 Rollup 依赖。

### 主要变化

#### ✅ 新增特性
- **TypeScript 支持**: 插件本身使用 TypeScript 编写
- **ts-node-dev 集成**: 推荐使用 ts-node-dev 运行后端代码
- **类型安全**: 完整的类型定义和检查
- **简化的配置**: 移除了复杂的 Babel/Rollup 配置

#### ❌ 移除的特性
- **Babel 相关**: 不再需要 `@babel/core`, `@babel/node` 等
- **Rollup 相关**: 不再需要 `rollup`, `@rollup/plugin-*` 等
- **rollup.config.js**: 不再自动生成 Rollup 配置

## 📦 升级步骤

### 从 v1.x 升级到 v2.0.0

```bash
# 1. 卸载旧版本
npm uninstall vue-cli-plugin-server-dev

# 2. 安装新版本
vue add server-dev

# 3. 或者手动更新
npm install vue-cli-plugin-server-dev@latest
```

### 配置变更

#### 旧配置 (v1.x)
```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    serverDev: {
      run: 'npx babel-node ./src/index.js',  // 使用 babel-node
      watchDir: './src/server/**'
    }
  }
}
```

#### 新配置 (v2.0.0)
```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    serverDev: {
      run: 'npx ts-node-dev --transpile-only ./src/server/index.ts',  // 使用 ts-node-dev
      watchDir: './src/server/**'
    }
  }
}
```

## 🚀 快速开始

### 1. 安装插件

```bash
vue add server-dev
```

安装时会询问：
- **启动命令**: 默认 `npx ts-node-dev --transpile-only ./src/server/index.ts`
- **服务端口**: 默认 `3000`
- **监听目录**: 默认 `./src/server/**`
- **是否安装 TypeScript 支持**: 推荐 `Yes`

### 2. 创建 TypeScript 服务器

如果选择了安装 TypeScript 支持，插件会自动创建：

- 复制 `tsup.config.js` 和 `tsup.share.js` 模板用于生产构建
- 使用 Node.js 内置 `http` 模块创建零依赖示例服务器
- 生成 `tsconfig.server.json` 配置（`outDir: "./dist"`）
- 创建或更新 `vue.config.js`（`outputDir: "dist/public"`）

**输出目录结构**：

```
dist/
├── index.js          # 编译后的服务器代码
├── index.js.map      # 服务器源码映射
└── public/           # Vue 应用构建输出
    ├── index.html
    ├── css/
    └── js/
```

这种分离可以防止服务器和前端构建之间的冲突。

**示例服务器代码（自动生成）**：

```typescript
// src/server/index.ts
import * as http from 'http';
import * as url from 'url';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  
  // 设置 CORS 头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // 简单路由
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

// 优雅关闭
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

**注意**: 此示例仅使用 Node.js 内置模块（无外部依赖）。你可以轻松替换为 Express、Koa、Fastify 或任何其他框架。

以及 TypeScript 配置：

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

### 3. 启动开发服务器

```bash
npm run dev:serve
```

## ⚠️ 重要：构建顺序和配置

使用 TypeScript 支持时，正确的构建顺序**至关重要**：

### vue.config.js 配置

插件会创建或更新 `vue.config.js`：

```javascript
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: 'dist/public', // Vue 应用输出到 dist/public/
})
```

如果 `vue.config.js` 已存在，你需要手动将 `outputDir` 更新为 `'dist/public'`。

### 构建顺序

**务必先构建服务器，再构建 Vue 应用！**

```bash
# 第一步：先构建服务器
npm run build:server    # 将 TypeScript 服务器编译到 dist/

# 第二步：再构建 Vue 应用
npm run build           # 将 Vue 应用编译到 dist/public/
```

**为什么需要这个顺序？** tsup 的构建过程会在构建前清空整个 `dist/` 目录。如果你先运行 `npm run build`（Vue），然后再构建服务器，tsup 会删除 `dist/public/` 中已编译的 Vue 代码！

### 推荐做法：组合构建脚本

插件会自动在 `package.json` 中添加 `build:all` 脚本：

```json
{
  "scripts": {
    "build:all": "npm run build:server && npm run build"
  }
}
```

然后使用：

```bash
npm run build:all    # 按正确顺序构建服务器和 Vue
```

## 💡 使用 JavaScript 而不是 TypeScript

如果你更喜欢使用 JavaScript，可以这样配置：

```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    serverDev: {
      run: 'node ./src/server/index.js',  // 直接使用 node
      watchDir: './src/server/**'
    }
  }
}
```

不需要安装 TypeScript 相关依赖。

## 🔧 高级配置

### 自定义 TypeScript 配置

你可以修改 `tsconfig.server.json` 来满足你的需求：

```json
{
  "compilerOptions": {
    "target": "ES2020",           // 使用更新的 ECMAScript 版本
    "experimentalDecorators": true, // 启用装饰器
    "emitDecoratorMetadata": true
  }
}
```

### 使用其他框架

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

## 📊 对比 v1.x 和 v2.0.0

| 特性 | v1.x | v2.0.0 |
|------|------|--------|
| 语言 | JavaScript | TypeScript |
| 运行时 | babel-node | ts-node-dev / node |
| 构建工具 | Rollup | 无需构建（ts-node-dev 即时编译） |
| 配置文件 | rollup.config.js | tsconfig.server.json |
| 依赖数量 | ~20+ | ~5 |
| 类型支持 | ❌ | ✅ |
| 开发体验 | 需要编译 | 即时运行 |
| 生产部署 | 需要构建 | 可选构建或直接部署 |

## 🎯 优势

### 1. 更简单的配置
- 不再需要复杂的 Rollup 配置
- TypeScript 配置简单明了
- 开箱即用的开发体验

### 2. 更好的开发体验
- ts-node-dev 即时编译，无需预编译
- 完整的类型提示和自动补全
- 编译时错误检查

### 3. 更少的依赖
- 移除了 Babel 和 Rollup 相关依赖
- 减少了 node_modules 体积
- 更快的安装速度

### 4. 类型安全
- 完整的 TypeScript 类型定义
- 编译时捕获错误
- 更好的 IDE 支持

## ⚠️ 注意事项

### 1. 性能考虑

**开发环境**: ts-node-dev 会有轻微的性能开销（即时编译），但对于开发来说完全可以接受。

**生产环境**: 建议预编译 TypeScript 为 JavaScript：

```bash
# 编译
tsc -p tsconfig.server.json

# 运行编译后的代码
node dist-server/index.js
```

### 2. ts-node-dev 注册

确保在项目根目录或 `src/server` 目录有正确的 `tsconfig.json`。

### 3. 模块解析

如果遇到模块解析问题，可以在 `tsconfig.server.json` 中添加：

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

## 🔍 故障排除

### Q: ts-node-dev 找不到模块？

A: 确保安装了必要的类型定义：

```bash
npm install --save-dev @types/express @types/node
```

### Q: 编译错误？

A: 检查 `tsconfig.server.json` 配置，确保 `rootDir` 和 `outDir` 设置正确。

### Q: 想继续使用 Babel？

A: 可以手动配置，但不再推荐。如果需要，可以这样配置：

```javascript
// vue.config.js
pluginOptions: {
  serverDev: {
    run: 'npx babel-node ./src/server/index.js',
    watchDir: './src/server/**'
  }
}
```

然后手动安装 Babel 相关依赖。

### Q: 如何调试 TypeScript 代码？

A: 使用 VS Code 的调试配置：

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

## 📚 资源

- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [ts-node 文档](https://typestrong.org/ts-node/)（ts-node-dev 基于 ts-node 构建）
- [Vue CLI 插件开发](https://cli.vuejs.org/dev-guide/plugin-dev.html)

## 🎊 总结

v2.0.0 带来了更现代化、更简洁的开发体验：

✅ **TypeScript 原生支持**  
✅ **简化的配置**  
✅ **更少的依赖**  
✅ **更好的类型安全**  
✅ **更快的开发迭代**  

立即升级到 v2.0.0，享受更好的开发体验！

---

**更新日期**: 2026-06-20  
**版本**: 2.0.0  
**迁移难度**: ⭐⭐ (简单)
