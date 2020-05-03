import Koa from "koa";
import path from "path";
import resolve from "resolve-from";
import chalk from "chalk";
import getStream from "get-stream";
import MagicString from "magic-string";
import { init, parse } from "es-module-lexer";

export default function ({ app, root }: { app: Koa; root: string }) {
  app.use(async (ctx, next) => {
    let resolvedPath;
    if (ctx.path.startsWith("/@modules/")) {
      const moduleName = ctx.path.replace("/@modules/", "");

      if (!path.extname(moduleName)) {
        try {
          const pkgPath = resolve(root, moduleName + "/package.json");
          const pkg = require(pkgPath);
          const entryPoint = pkg.svelte || pkg.module || pkg.main || "index.js";
          return ctx.redirect(path.join(ctx.path, entryPoint));
        } catch (error) {
          if (moduleName === "svelte" || moduleName.startsWith("svelte/")) {
            const pkgPath = resolve(__dirname, moduleName + "/package.json");
            const pkg = require(pkgPath);
            const entryPoint = pkg.svelte || pkg.module || pkg.main || "index.js";
            resolvedPath = path.resolve(path.dirname(pkgPath), entryPoint);
          } else {
            console.log(chalk.red(`Module not found: ${moduleName}`));
          }
        }
      } else {
        resolvedPath = resolve(root, moduleName);
      }
    } else {
      resolvedPath = path.resolve(root, "." + ctx.path);
    }

    ctx.resolvedPath = resolvedPath;
    await next();

    if (ctx.status === 304) {
      // Not modified
      return;
    }

    if (/\.(js|ts|mjs|svelte)$/.test(ctx.path)) {
      // console.log(typeof ctx.body);
      let jsCode = typeof ctx.body === "string" ? ctx.body : await getStream(ctx.body);
      await init;

      // jsCode = jsCode + `\n\n//# sourceMappingURL=${req.url}.map`;
      let magicJsCode = new MagicString(jsCode);
      const [imports] = parse(jsCode);
      for (const { s, e, d } of imports) {
        if (d > -1) {
          // TODO: dynamic import
        }
        const importee = jsCode.substring(s, e);
        if (!importee.startsWith("./") && !importee.startsWith("../")) {
          magicJsCode.overwrite(s, e, "/@modules/" + importee);
        }
      }
      ctx.body = magicJsCode.toString();
    }
  });
}
