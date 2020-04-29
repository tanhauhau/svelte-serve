import http from 'http';
import Koa from 'koa';
import chalk from 'chalk';
import path from 'path';
import modulePlugin from './modulePlugin';
import servePlugin from './servePlugin';
import sveltePlugin from './sveltePlugin';

export function startDevServer(root: string) {

  root = path.join(process.cwd(), root);

  const app = new Koa();

  modulePlugin({ app, root });
  sveltePlugin({ app });
  servePlugin({ app, root });

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
