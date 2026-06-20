# vue-cli-plugin-server-dev

轻松启动你的开发服务器程序，并通过 Vue App Dev Server 进行代理！

如果你是一名全栈工程师，比如使用 express/koa + vue 进行开发，你可能需要同时开发 express/koa 和 vue 代码。使用这个插件可以让你轻松地整合前后端代码在一起开发，此插件可以监听代码修改并自动重启开发服务器（你也可以给ts-node-dev添加--respawn参数用ts-node-dev的热重启功能，若如此你需要把watchDir设置为null）。

**v2.0.0 重大更新**: 现已完全迁移到 TypeScript，移除了 Babel 和 Rollup 依赖，提供更简洁的开发体验！

**English Version**: [README.md](README.md)



## 安装

```bash
vue add server-dev
```



## 配置选项

通常，在安装过程中会自动配置。当然，你也可以通过修改配置文件来更改选项。

**同时支持 Vue CLI 和 Vite 项目：**
- **Vue CLI 项目**：使用 `vue.config.js`
- **Vite 项目**：使用 `vite.config.js`

**智能项目类型检测：**
- 插件会自动检测你的项目类型（基于 `package.json` 中的依赖）
- 如果同时安装了 Vite 和 Vue CLI，会优先使用 Vite（通过检查 `build` 脚本是否包含 `vite` 命令）
- 这样可以平滑地从 Vue CLI 迁移到 Vite，无需手动删除 `@vue/cli-service`

有两个需要注意的配置项：devServer 和 pluginOptions:serverDev



### devServer

这个选项原本是为 vue(webpack-dev-server) 设计的，但你必须修改 proxy 指向开发服务器。

通常会自动添加代理配置：

```javascript
devServer: {
  proxy: 'http://127.0.0.1:3000'
},
```

如果你更改了开发服务器的服务端口，应该相应地更改端口 `proxy: 'http://127.0.0.1:<port>'`



### pluginOptions:serverDev

通常会自动添加配置：

```javascript
pluginOptions: {
  serverDev: {
    run: 'npx ts-node-dev --transpile-only ./src/server/index.ts',  // TypeScript（默认）
    // 或: 'node ./src/server/index.js',                            // JavaScript
    watchDir: './src/server/**'
  }
}
```

"serverDev" 键名是供 vue-cli-plugin-server-dev 使用的。只有两个选项：

- **run**: (字符串) 指定启动开发服务器的命令
  - TypeScript 项目: `'npx ts-node-dev --transpile-only ./src/server/index.ts'`（推荐，默认）
    - `ts-node-dev` 比 `ts-node` 提供更快的重启和更好的监听
    - `--transpile-only` 跳过类型检查以获得更快的启动速度（如果需要类型检查则不使用此参数）
  - JavaScript 项目: `'node ./src/server/index.js'`
  - 自定义设置: 任何可以启动你服务器的命令

- **watchDir**: (字符串或字符串数组) 指定你的服务器开发代码所在目录的 glob 模式
  - 该目录中的更改将触发服务器自动重启
  - 示例: `'./src/server/**'` 或 `['./src/server/**', './src/shared/**']`



## 特性

### ✨ 自动服务器重启
- 监听你的服务器代码目录变化
- 当文件改变时自动重启开发服务器
- 智能防抖（500ms）避免频繁重启
- 等待文件写入完成后再重启

### 🔄 优雅的进程管理
- 正确的信号处理（SIGINT, SIGTERM）
- 跨平台支持（Windows, Linux, macOS）
- 优雅关闭，失败时强制终止
- 防止重复的服务器实例

### 📝 TypeScript 支持
- 开箱即用的完整 TypeScript 支持
- 自动为服务器代码生成 `tsconfig.server.json`
- 类型安全的开发体验
- 可选 - 也支持纯 JavaScript

### 🔌 Vue DevServer 集成
- 自动将请求代理到你的后端服务器
- 无缝的全栈开发工作流
- 开发期间无 CORS 问题

## TypeScript 支持

2.0.0+ 版本完全支持 TypeScript！安装时可以选择启用 TypeScript 支持：

- ✅ 自动创建 `tsconfig.server.json`
- ✅ 复制 `tsup.config.js` 和 `tsup.share.js` 模板用于生产构建
- ✅ 使用 Node.js 内置 `http` 模块的示例服务器代码（零依赖）
- ✅ 类型安全的开发体验
- ✅ 可选 - 你可以使用纯 JavaScript
- ✅ 智能输出目录配置（服务器用 `dist/`，Vue 用 `dist/public/`）

### 构建配置

当启用 TypeScript 支持时，插件会配置分离的输出目录：

- **服务器代码**: 编译到 `dist/` 目录
- **Vue 应用**: 编译到 `dist/public/` 目录

这样可以防止服务器和前端构建之间的冲突。

**智能输出目录配置：**
- **Vue CLI 项目**：自动创建/更新 `vue.config.js`，设置 `outputDir: 'dist/public'`
- **Vite 项目**：自动创建/更新 `vite.config.js`，设置 `build.outDir: 'dist/public'`

插件会自动检测你的项目类型并应用正确的配置。

### ⚠️ 重要：构建顺序

**务必先构建服务器，再构建 Vue 应用！**

```bash
# 第一步：先构建服务器
npm run build:server    # 将 TypeScript 服务器编译到 dist/

# 第二步：再构建 Vue 应用
npm run build           # 将 Vue 应用编译到 dist/public/
```

**为什么需要这个顺序？** tsup 的构建过程会在构建前清空 `dist/` 目录。如果你先构建 Vue，然后再构建服务器，tsup 会删除 `dist/public/` 中已编译的 Vue 代码！

**推荐做法**: 插件会自动在 `package.json` 中添加 `build:all` 脚本：

```json
{
  "scripts": {
    "build:all": "npm run build:server && npm run build"
  }
}
```

直接使用：

```bash
npm run build:all    # 按正确顺序构建服务器和 Vue
```

详细的迁移指南请查看 [docs/MIGRATION_TO_TS_CN.md](docs/MIGRATION_TO_TS_CN.md)



## 示例

### 零依赖服务器（自动生成）

当你在安装时选择 TypeScript 支持，会自动创建一个使用 Node.js 内置 `http` 模块的零依赖示例：

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

### 纯 JavaScript（无 TypeScript）

如果你更喜欢 JavaScript，只需配置 run 命令：

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



## 开发

### 构建

```bash
npm run build        # 编译 TypeScript 到 JavaScript
npm run dev          # 开发监视模式
```

### 测试

```bash
npm test             # 运行所有测试
npm run test:watch   # 以监视模式运行测试
npm run test:coverage # 运行测试并生成覆盖率报告
```

测试代码位于 `test/` 目录中，使用 Jest + ts-jest。

### 代码检查

```bash
npm run lint         # 对 TypeScript 文件运行 ESLint
```

## 文档

详细文档请参考：

- [TypeScript 迁移指南](docs/MIGRATION_TO_TS_CN.md) - 从 v1.x 迁移到 v2.0.0 的完整指南
- [TypeScript 迁移总结](docs/TYPESCRIPT_MIGRATION_SUMMARY_CN.md) - 详细的迁移报告和分析

**English Version**:
- [TypeScript Migration Guide](docs/MIGRATION_TO_TS.md)
- [TypeScript Migration Summary](docs/TYPESCRIPT_MIGRATION_SUMMARY.md)

## 更新日志

### v2.0.0 (2026年6月)
- 🎉 **重大更新**: 迁移到 TypeScript
- ✅ 移除 Babel 和 Rollup 依赖
- ✅ 添加 ts-node-dev 支持
- ✅ 简化配置
- ✅ 更好的类型安全
- ✅ 改进的开发体验

### v1.1.0 (2026年6月)
- 修复了 Node.js v18+ 的兼容性问题
- 更新 execa 到 v5.x
- 更新 chokidar 到 v3.6.0
- 改进了进程管理
- 增强了文件监听

### v1.0 (2023年7月)
- 首次发布，从 vue-cli-plugin-express-dev 提取并修改
