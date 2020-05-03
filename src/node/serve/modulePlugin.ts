import Koa from 'koa';
import path from 'path';
import resolve from 'resolve-from';
import chalk from 'chalk';

export default function ({ app, root }: { app: Koa; root: string }) {
  app.use(async (ctx, next) => {
    let resolvedPath;
    if (ctx.path.startsWith('/@modules/')) {
      const moduleName = ctx.path.replace('/@modules/', '');

      if (!path.extname(moduleName)) {
        try {
          const pkgPath = resolve(root, moduleName + '/package.json');
          const pkg = require(pkgPath);
          const entryPoint = pkg.svelte || pkg.module || pkg.main || 'index.js';
          return ctx.redirect(path.join(ctx.path, entryPoint));
        } catch (error) {
          if (moduleName === 'svelte' || moduleName.startsWith('svelte/')) {
            const pkgPath = resolve(__dirname, moduleName + '/package.json');
            const pkg = require(pkgPath);
            const entryPoint =
              pkg.svelte || pkg.module || pkg.main || 'index.js';
            resolvedPath = path.resolve(path.dirname(pkgPath), entryPoint);
          } else {
            console.log(chalk.red(`Module not found: ${moduleName}`));
          }
        }
      } else {
        resolvedPath = resolve(root, moduleName);
      }
    } else {
      resolvedPath = path.resolve(root, '.' + ctx.path);
    }

    ctx.resolvedPath = resolvedPath;
    return next();
  });
}
