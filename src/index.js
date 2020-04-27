#!/usr/bin/env node

const chalk = require('chalk');
const http = require('http');
const app = require('./server');

let port = 8080;

const server = http.createServer(app);
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    setTimeout(() => {
      server.close();
      server.listen(++port);
    }, 100);
  } else {
    console.log(chalk.red('server error:'));
    console.error(e);
  }
});
server.on('listening', () => {
  console.log(chalk.green('Dev server running at:'));
  console.log(`  > http://localhost:${port}`);
  console.log(' ');
});

server.listen(port);
