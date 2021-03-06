import Koa from "koa";
import send from "koa-send";

export default function ({ app, root }: { app: Koa; root: string }) {
  app.use(require("koa-conditional-get")());
  app.use(require("koa-etag")());
  app.use((ctx) => {
    if (ctx.resolvedPath) {
      return send(ctx, ctx.resolvedPath, {
        root: "/",
        index: "index.html",
        // when installed in global, path will contain hidden files
        hidden: true,
      });
    }
    ctx.status = 404;
  });
}
