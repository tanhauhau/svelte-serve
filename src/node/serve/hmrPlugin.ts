import Koa from "koa";
import path from "path";

export default function ({ app }: { app: Koa; root: string }) {
  app.use(async (ctx, next) => {
    if (ctx.path === "/@hmr") {
      ctx.resolvedPath = path.join(__dirname, "../client.js");
    }
    return next();
  });
}
