import Koa from "koa";
import _fs from "fs";
import path from "path";
import { init, parse } from "es-module-lexer";
import { compile, preprocess } from "svelte/compiler";
import MagicString from "magic-string";
import { transform } from "./preprocessors";
const fs = _fs.promises;

export default function ({ app, root }: { app: Koa; root: string }) {
  app.use(async (ctx, next) => {
    if (!ctx.resolvedPath) return next();
    if (!ctx.resolvedPath.endsWith(".svelte")) return next();

    await next();
    
    if (ctx.status === 304) {
      // Not modified
      return;
    }

    await init;

    const svelteCode = await fs.readFile(ctx.resolvedPath, "utf-8");

    const { code: preprocessedCode, dependencies } = await preprocess(
      svelteCode,
      {
        style: getPreprocessor({ root, to: "style" }),
        script: getPreprocessor({ root, to: "script" }),
      },
      {
        filename: path.basename(ctx.path),
      }
    );
    const { js } = compile(preprocessedCode, {});

    // TODO: watch these files too
    dependencies;
    // console.log("dependencies", dependencies);

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
      if (!importee.startsWith("./") && !importee.startsWith("../")) {
        magicJsCode.overwrite(s, e, "/@modules/" + importee);
      }
    }
    jsCode = magicJsCode.toString();

    ctx.body = jsCode;
    ctx.set("Content-Type", "text/javascript");
  });
}

function getPreprocessor({ root, to }: { root: string; to: string }) {
  return async function ({ content, attributes, filename }: { content: string; attributes: Record<string, string | boolean>; filename: string }) {
    const lang = getLang(attributes);
    if (!lang) {
      return { code: content };
    }
    return await transform({
      ...lang,
      to,
      content,
      filename,
      root,
    });
  };
}

function getLang(attributes: Record<string, string | boolean>) {
  if (typeof attributes.lang === "string") {
    return {
      from: attributes.lang,
      desc: `lang="${attributes.lang}"`,
    };
  }
  if (typeof attributes.type === "string") {
    const lang = attributes.type.replace(/^(text|application)\/(.*)$/, "$2");
    return {
      from: lang,
      desc: `type="${attributes.type}"`,
    };
  }
}
