import http from 'http';
import Koa from 'koa';
import chalk from 'chalk';

export function startDevServer(root) {
  const app = new Koa();
  
  const server = http.createServer(app.callback());
  let port = 3000;

  server.on('error', (error) => {
    // @ts-ignore
    if (error.code === 'EADDRINUSE') {
      setTimeout(() => {
        server.close();
        server.listen(++port);
      }, 100);
    } else {
      console.log(chalk.red('server error:'));
      console.error(error);
    }
  });
  server.on('listening', () => {
    console.log(chalk.green('Dev server running at:'));
    console.log(`  > http://localhost:${port}`);
    console.log(' ');
  });
  server.listen(port);
}


// import http from 'http';
// const http = require('http');
// const app = require('./server');

// let port = 8080;

// const server = http.createServer(app);
