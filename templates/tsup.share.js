import { defaultsDeep } from "lodash";
import path from "path";
import { copyFile, writeFileSync } from "fs";
import { defineConfig } from "tsup";

const copy = [];
let timer = null;
function buildEnd(pkg, options) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    for (const file of copy) {
      const src = path.resolve(file);
      const dest = path.resolve(options.outDir, path.basename(file));
      copyFile(src, dest, (err) => {
        if (err) console.error("[copy] failed:", src, "=>", dest, err);
        else console.debug("[copy] success:", src, "=>", dest);
      });
    }
    delete pkg.scripts;
    delete pkg.devDependencies;
    (pkg.files = ["*"]),
      writeFileSync(
        path.resolve(options.outDir, "package.json"),
        JSON.stringify(pkg, null, 2)
      );
  }, 2000);
}

export function createConfig(pkg, options) {
  // 如果有多个createConfig，那么copy可能会执行多次，所以要过滤一下
  if (Array.isArray(options.copy)) {
    options.copy.forEach((file) => {
      if (!copy.includes(file)) copy.push(file);
    });
  }
  delete options.copy;
  
  // Note: tsconfig should be specified via CLI argument (--tsconfig)
  // or in tsup.config.js, not here to avoid conflicts
  
  defaultsDeep(options, {
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["cjs", "esm"],
    globalName: undefined,
    dts: true,
    clean: true,
    bundle: true,
    minify: "terser",
    splitting: false,
    sourcemap: false,
    treeshake: true,
    target: "node18",
    platform: "node",
    skipNodeModulesBundle: true, // Skip node_modules bundling
    replaceNodeEnv: true,
    keepNames: true,
    loader: {
      ".json": "json",
      ".pem": "text",
      ".crt": "text",
      ".key": "text",
      ".txt": "text",
      ".md": "text",
      ".html": "text",
      ".htm": "text",
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".jpeg": "dataurl",
      ".gif": "dataurl",
      ".svg": "dataurl",
      ".webp": "dataurl",
      ".ico": "dataurl",
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "product"),
      __package_version: JSON.stringify(pkg.version),
    },
    terserOptions: {
      format: {
        comments: /Copyright/,
        preamble: `/* ${pkg.name} version:${pkg.version} 
        Copyright (c) ${new Date().getFullYear()}. ${pkg.author} All rights reserved.  */`,
      },
    },
  });

  const plugins = options.plugins || [];
  delete options.plugins;
  return defineConfig({
    ...options,
    esbuildOptions: (opts) => {
      opts.external = options.external; //fix option.external has no effect, may be a tsup's bug
    },
    esbuildPlugins: [
      ...plugins,
      {
        name: "custom",
        setup: (build) => {
          const format = build.initialOptions.define.TSUP_FORMAT,
            distFileName =
              path.basename(
                build.initialOptions.entryPoints[0],
                path.extname(build.initialOptions.entryPoints[0])
              ) + build.initialOptions.outExtension[".js"];
          if (format === '"cjs"') {
            pkg.main = distFileName;
          }
          if (format === '"esm"') {
            pkg.module = distFileName;
          }
          if (format === '"iife"') {
            pkg.browser = distFileName;
          }
          build.onEnd(() => buildEnd(pkg, options));
        },
      },
    ],
  });
}
