import Koa from 'koa';
import _fs from 'fs';
import { init, parse } from 'es-module-lexer';
import { compile, preprocess } from 'svelte/compiler';
import autoPreprocess from 'svelte-preprocess';
import MagicString from 'magic-string';
const fs = _fs.promises;

export default function ({ app }: { app: Koa }) {
  app.use(async (ctx, next) => {
    if (!ctx.resolvedPath) return next();
    if (!ctx.resolvedPath.endsWith('.svelte')) return next();

    await next();

    await init;

    const svelteCode = await fs.readFile(ctx.resolvedPath, 'utf-8');

    const { code: preprocessedCode } = await preprocess(
      svelteCode,
      [autoPreprocess({})],
      {
        filename: 'App.svelte',
      }
    );
    const { js } = compile(preprocessedCode, {});

    // set sourcemap
    // cache.set(req.url + '.map', js.map);
    let jsCode = js.code;
    // jsCode = jsCode + `\n\n//# sourceMappingURL=${req.url}.map`;
    let magicJsCode = new MagicString(jsCode);
    const [imports] = parse(jsCode);
    for (const { s, e, d } of imports) {
      if (d > -1) {
        // TODO: dynamic import
      }
      const importee = jsCode.substring(s, e);
      if (!importee.startsWith('./') && !importee.startsWith('../')) {
        magicJsCode.overwrite(s, e, '/@modules/' + importee);
      }
    }
    jsCode = magicJsCode.toString();

    ctx.body = jsCode;
    ctx.set('Content-Type', 'text/javascript');

    // console.log('v', ctx.body);
  });
}
