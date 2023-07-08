# vue-cli-plugin-server-dev

Easily start Your development server program and proxy it by Vue App Dev Server!

If you are a full stack engineer, such as using express/koa+vue development, you may need to develop both express/koa and vue code. Using this plugin will make it easy to watch code modifies and automatically restart the development server.



## install

vue add server-dev



## options

Normally, it will be automatically configured during installation.Of course, you can also change the options by modifying vue.config.js

There are two options to pay attention:devServer and pluginOptions:serverDev



### devServer

This options was originally for vue(webpack-dev-server),But you must modify the proxy to point to the development server.

Generally, proxy options will be automatically added:

```javascript
devServer: {
  proxy: 'http://127.0.0.1:3000'
},
```

If you changed the service port of development server,you should change the port `proxy: 'http://127.0.0.1:<port>'`



### pluginOptions:serverDev

Generally, proxy configuration will be automatically added:

```javascript
pluginOptions: {
    serverDev: {
      run: 'npx babel-node ./src/index.js',
      watchDir: './src/server/**'
    }
  }
```

The key of "serverDev" is for vue-cli-plugin-server-dev.There are only two options:

- run :(string) specify the command of start your development

- watchDir:  (string or array of strings) specify the glob patterns with the directory where your server development code is.



## Changelog

- v1.0(july 2023) : Initial release, extracted and modified from vue-cli-plugin-express-dev
