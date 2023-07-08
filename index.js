const path = require('path');
const chokidar = require('chokidar');
const execa = require('execa');
const kill = require('tree-kill');
const {
  done,
  info,
  warn,
  error
} = require('@vue/cli-shared-utils')

var serve=null;

module.exports = (api, options) => {
  const opts = (options.pluginOptions && options.pluginOptions.serverDev) || {};
  const run= opts.run || 'npx babel-node ./src/index.js';
  const watchDir= opts.watchDir || './src/**';
  api.registerCommand(
    'dev:serve',
    {
      description: 'start your development server and serve vue app on live',
      usage: 'vue-cli-service dev:serve',
      details: 'Will start your development server and proxy by vue webpack-dev-server'
    },
    async (args, rawArgs) => {

      function start() {
        serve=execa(opts.run, { stdio: 'inherit'});
        return Promise.resolve();
      }

      function stop() {
        return new Promise((resolve,reject)=>{
          if (serve && serve.pid) {
            kill(serve.pid,function (err){
              if(err) warn(err)
              resolve();
            });
          }
        });
      }

      // Handle Ctrl+C on Windows
      if (process.platform === 'win32') {
        process.on('SIGINT', stop).on('exit',stop);
      }else{
        process.on('SIGTERM', stop).on('exit',stop);
      }

      return api.service.run('serve', {// Run the serve command
        _: [],
        // Use dashboard if called from ui
        dashboard: args.dashboard,
        https: args.https
      })
      .then(start)
      .then(()=>{
        // watch file changes
        chokidar
          .watch(api.resolve(watchDir))
          .on('change', (file,stats) => {
            info(`Detect ${file} changed, restarting development server...`);
            stop().then(start).then(()=>{
            done(`Success restarted development server!`);
            });
          });
      }).catch(error);
    }
  );
};

module.exports.defaultModes = {
  'dev:build': 'production',
  'dev:serve': 'development'
}