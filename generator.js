const fs = require('fs')
const path = require('path')
const { warn,done } = require('@vue/cli-shared-utils')

module.exports = (api, options = {}) => {
  let devDependencies={},pkg = fs.readFileSync(api.resolve('./package.json'), 'utf8')
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

  if(options.installRollupjsConfig){
    devDependencies={
      "@babel/core": "^7.22.5",
      "@babel/node": "^7.16.8",
      "@babel/plugin-proposal-class-properties": "^7.10.4",
      "@babel/plugin-proposal-export-namespace-from": "^7.10.4",
      "@babel/plugin-proposal-throw-expressions": "^7.10.4",
      "@babel/plugin-syntax-dynamic-import": "^7.8.3",
      "@babel/plugin-transform-runtime": "^7.11.5",
      "@babel/preset-env": "^7.11.5",
      "@rollup/plugin-babel": "^5.3.1",
      "@rollup/plugin-commonjs": "^15.0.0",
      "@rollup/plugin-json": "^4.1.0",
      "@rollup/plugin-replace": "^2.3.3",
      "builtin-modules": "^3.1.0",
      "rollup": "^2.26.10",
      "rollup-plugin-es6template": "^1.0.6",
      "rollup-plugin-generate-package-json": "^3.2.0",
      "rollup-plugin-string": "^3.0.0",
      "rollup-plugin-terser": "^7.0.2",
    }
    addScript('dev:build', 'rollup -c && vue-cli-service build')
    if(options.backupRollupjsConfig!==false){
      if (fs.existsSync(api.resolve('./rollup.config.js'))) {
        fs.renameSync(api.resolve('./rollup.config.js'), api.resolve('./rollup.config.js.bak'));
      }
      api.render({'./rollup.config.js':'./templates/rollup.config.js'});
    }
  }

  api.extendPackage({
    scripts,
    devDependencies,
    vue: {
      devServer: {
        proxy: 'http://127.0.0.1:'+options.port
      },
      pluginOptions: {
        serverDev: {
          run: options.run,
          watchDir: options.watchDir,
        },
      },
    },
  })

  done(`Install completed.You can change options by the vue configure file "vue.config.js".`)
}
