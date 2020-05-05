import Koa from "koa";
import getStream from "get-stream";
// import path from 'path';
// import resolve from 'resolve-from';
// import chalk from 'chalk';

export default function ({ app, root }: { app: Koa; root: string }) {
  app.use(async (ctx, next) => {
    await next();

    if (ctx.status === 304) {
      // Not modified
      return;
    }

    if (ctx.response.header["content-type"]?.indexOf("text/html") > -1) {
      const body = await getStream(ctx.body);
      ctx.body = '<script type="module" src="/@hmr"></script>' + body;
    }
  });
}
