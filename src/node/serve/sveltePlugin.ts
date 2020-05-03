import Koa from "koa";
import path from "path";
import { compile, preprocess } from "svelte/compiler";
import getStream from "get-stream";
import { getMissingDependenciesPreprocessor, getTransformCodePreprocessor } from "../preprocessors";

export default function ({ app, root }: { app: Koa; root: string }) {
  app.use(async (ctx, next) => {
    if (!ctx.resolvedPath) return next();
    if (!ctx.resolvedPath.endsWith(".svelte")) return next();

    await next();

    if (ctx.status === 304) {
      // Not modified
      return;
    }

    const svelteCode = await getStream(ctx.body);

    const { code: preprocessedCode, dependencies } = await preprocess(
      svelteCode,
      [getMissingDependenciesPreprocessor(root), getTransformCodePreprocessor(root)],
      {
        filename: path.basename(ctx.path),
      }
    );
    const { js } = compile(preprocessedCode, {});

    // TODO: watch these files too
    dependencies;

    // set sourcemap
    // cache.set(req.url + '.map', js.map);
    // jsCode = jsCode + `\n\n//# sourceMappingURL=${req.url}.map`;

    ctx.body = js.code;
    ctx.set("Content-Type", "text/javascript");
  });
}
