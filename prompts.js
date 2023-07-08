const fs = require('fs')
const path = require('path')
module.exports = [
  {
    type: 'input',
    name: 'run',
    message: `Which cmd-line will start  development server ?
Make sure the cmd-line is starting your development server program!
`,
    default: 'npx babel-node ./src/index.js',
  },
  {
    type: 'input',
    name: 'port',
    message: `Which port development server run at?
The webpack-dev-server will proxy: "http://127.0.0.1:<port>"
`,
    default: '3000',
  },
  {
    type: 'input',
    name: 'watchDir',
    message: `Where the delelopment server code that will be watched?
The location of your development server code,relative to the root of your project,any changes will trigger restart development server.
**Important remind that it just need watch development server code,the vue code will be watched by vue-cli-service self.
`,
    default: './src/server/**',
  },
  {
    type: 'confirm',
    name: 'installRollupjsConfig',
    message: `Compile development server code with rollupjs (recommended)?`,
    default:true
  },
  {
    type: 'confirm',
    name: 'backupRollupjsConfig',
    message: `It seems that you have configured it yourself rollup.config.js,rename it to rollup.config.js.bak?
**It is strongly recommended to use the same rollupjs configuration, otherwise it may result in inconsistency!
`,
    when: () => {
      return fs.existsSync(path.resolve('./rollup.config.js'))
    },
    default:true
  },
]
