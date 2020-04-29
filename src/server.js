// const express = require('express');
// const path = require('path');
// const fresh = require('fresh');
// const send = require('send');
// const fs = require('fs').promises;
// const svelte = require('svelte/compiler');
// const LRU = require('lru-cache');
// const MagicString = require('magic-string');
// const app = express();
// const { init, parse } = require('es-module-lexer');
// const resolveFrom = require('resolve-from');

// const root = process.cwd();

// const CACHE_MAX_AGE = 60 * 60 * 24 * 365 * 1000;

// const cache = new LRU(50);

// app.use((req, res, next) => {
//   if (req.method !== 'GET') return next();

//   let absolutePath;
//   if (req.url.startsWith('/@modules/')) {
//     const moduleName = req.url.replace('/@modules/', '');

//     if (!path.extname(moduleName)) {
//       const pkgPath = resolveFrom(root, moduleName + '/package.json');
//       const pkg = require(pkgPath);
//       const entryPoint = pkg.svelte || pkg.module || pkg.main || 'index.js';
//       return res.redirect(path.join(req.url, entryPoint));
//     }
//     absolutePath = resolveFrom(root, moduleName);
//   } else if (req.url.endsWith('.js') || req.url.endsWith('.svelte')) {
//     absolutePath = path.resolve(root, '.' + req.url);
//   }

//   res.locals.resolvedUrl = absolutePath;
//   next();
// });

// app.use(async (req, res, next) => {
//   const absolutePath = res.locals.resolvedUrl;
//   if (!absolutePath) return next();
//   if (!absolutePath.endsWith('.svelte')) return next();

//   // handle etag manually here
//   const stat = await fs.stat(absolutePath);
//   // prettier-ignore
//   const etag = `"${stat.mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;
//   if (
//     fresh(req.headers, {
//       etag,
//       'last-modified': stat.mtime.toUTCString(),
//     })
//   ) {
//     res.statusCode = 304;
//     return res.end();
//   }

//   res.set('ETag', etag);
//   res.set('Last-Modified', stat.mtime.toUTCString());
//   res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);

//   await init;

//   const svelteCode = await fs.readFile(absolutePath, 'utf-8');
//   const { js, css } = svelte.compile(svelteCode);

//   // set sourcemap
//   // cache.set(req.url + '.map', js.map);
//   let jsCode = js.code;
//   // jsCode = jsCode + `\n\n//# sourceMappingURL=${req.url}.map`;
//   let magicJsCode = new MagicString(jsCode);
//   const [imports] = parse(jsCode);
//   for (const { s, e, d } of imports) {
//     if (d > -1) {
//       // TODO: dynamic import
//     }
//     const importee = jsCode.substring(s, e);
//     if (!importee.startsWith('./') && !importee.startsWith('../')) {
//       magicJsCode.overwrite(s, e, '/@modules/' + importee);
//     }
//   }
//   jsCode = magicJsCode.toString();

//   res.set('Content-Length', jsCode.length);
//   res.set('Content-Type', 'text/javascript');
//   res.end(jsCode);
// });

// app.use(async (req, res, next) => {
//   const absolutePath = res.locals.resolvedUrl;
//   if (!absolutePath) return next();
//   send(req, absolutePath).pipe(res);
// });

// app.use(express.static(root));

// module.exports = app;
