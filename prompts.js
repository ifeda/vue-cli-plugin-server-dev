module.exports = [
  {
    type: 'input',
    name: 'run',
    message: `Which cmd-line will start development server?
Make sure the cmd-line is starting your development server program!
For TypeScript, recommended: "npx ts-node-dev --transpile-only ./src/server/index.ts"
For JavaScript, recommended: "node ./src/server/index.js"
`,
    default: 'npx ts-node-dev --transpile-only ./src/server/index.ts',
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
    message: `Where the development server code that will be watched?
The location of your development server code, relative to the root of your project.
Any changes will trigger restart development server.
If you are using --respawn, then you should set false here
**Important: It just needs to watch development server code, the vue code will be watched by vue-cli-service itself.
`,
    default: './src/server/**',
  },
  {
    type: 'confirm',
    name: 'installTypeScript',
    message: `Install TypeScript support for your server code (recommended)?`,
    default: true
  }
]
