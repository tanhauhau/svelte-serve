import http from "http";
import Koa from "koa";
import chalk from "chalk";
import path from "path";
import modulePlugin from "./modulePlugin";
import servePlugin from "./servePlugin";
import sveltePlugin from "./sveltePlugin";
import htmlPlugin from "./htmlPlugin";
import hmrPlugin from "./hmrPlugin";
import { initialiseWebSocketServer } from "./wss";

export function startDevServer(root: string) {
  root = path.join(process.cwd(), root);

  const app = new Koa();
  modulePlugin({ app, root });
  hmrPlugin({ app, root });
  sveltePlugin({ app, root });
  htmlPlugin({ app, root });
  servePlugin({ app, root });

  const server = http.createServer(app.callback());
  initialiseWebSocketServer(server);

  let port = 3000;

  server.on("error", (error) => {
    // @ts-ignore
    if (error.code === "EADDRINUSE") {
      setTimeout(() => {
        server.close();
        server.listen(++port);
      }, 100);
    } else {
      console.log(chalk.red("server error:"));
      console.error(error);
    }
  });
  server.on("listening", () => {
    console.log(chalk.green("Dev server running at:"));
    console.log(`  > http://localhost:${port}`);
    console.log(" ");
  });
  server.listen(port);
}
