import path from 'path'
import builtinModules from 'builtin-modules'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'
import generatePackageJson from 'rollup-plugin-generate-package-json'
import es6template from 'rollup-plugin-es6template'
import { string } from 'rollup-plugin-string'
import { terser } from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy'
const {
  info,
  done,
  warn,
  error
} = require('@vue/cli-shared-utils')

function notice(){
  return  {
    name: 'notice',
    buildStart() {
      info('Start building ...');
    },
    writeBundle() {
      done('Build completed!')
      warn('Don\'t forget to run "npm install" in dist folder after deployed.');
    }
  };
}

export default {
  input: './src/index.js',
  external:builtinModules,
  output: {
    dir: path.resolve('./dist'),
    format: 'cjs',
    entryFileNames: 'index.js',
    chunkFileNames: 'libs/[name].js',//动态import()的内容打包到这里
    exports: 'named', // 保留exports，不自动加default
    compact: false,
    preferConst: true,
    plugins: [
      terser() // 压缩混淆代码
    ]
  },
  // 没有用的代码去掉，节约空间
  treeshake: {
    moduleSideEffects: false
  },
  onwarn (warning, warn) {
    // skip certain warnings
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
    // throw on others
    if (warning.code === 'NON_EXISTENT_EXPORT') error(warning.message);
    // Use default for everything else
    warn(warning);
  },
  plugins: [
    json(),
    babel({
      presets: [
        [
          '@babel/preset-env',
          {
            useBuiltIns: 'entry',
          },
        ],
      ],
      exclude:['@babel/plugin-transform-runtime'],
      babelHelpers: 'bundled',
      configFile: false,
      babelrc: false,
    }),
    commonjs(),
    //在dist目录创建package.json文件，自动包含使用的依赖
    generatePackageJson({
      baseContents: (pkg) => ({
        name: pkg.name,
        title: pkg.title,
        version: pkg.version,
        description: pkg.description,
        author: pkg.author,
        license:pkg.license,
        main: 'index.js',
        dependencies: {},
        pm2:pkg.pm2
      })
    }),
    // 用于快速格式化模板
    es6template({
      include: ['**/*.html', '**/*.htm']
    }),
    // 直接把内容包含进来
    string({
      include: ['**/*.pem','**/*.txt']
    }),
    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    //拷贝相关文件到发布目录，如果没有会忽略
    copy({
      targets: [
        { src: 'README.md', dest: 'dist' },
        { src: 'install.cmd', dest: 'dist' },
        { src: 'install.sh', dest: 'dist' },
        { src: 'pm2.config.js', dest: 'dist' }
      ]
    })
    notice()
  ],
}