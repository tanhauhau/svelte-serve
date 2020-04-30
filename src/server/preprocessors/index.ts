import path from "path";
import type { TransformConfig, TransformResult } from "./types";
const TRANSFORMERS: {
  [key: string]: (config: TransformConfig) => TransformResult | Promise<TransformResult>;
} = {};
const TRANSFORMER_TARGET = new Map([
  ["sass->style", "sass"],
  ["stylus->style", "stylus"],
  ["less->style", "less"],
  ["coffeescript->script", "coffeescript"],
  ["typescript->script", "typescript"],
]);
const alias = new Map([
  ["scss", "sass"],
  ["scss", "sass"],
  ["styl", "stylus"],
  ["coffee", "coffeescript"],
  ["ts", "typescript"],
]);

export function getTransformCodePreprocessor(root: string) {
  return {
    style: getPreprocessor({ root, to: "style" }),
    script: getPreprocessor({ root, to: "script" }),
  };
}

export async function transform(transformConfig: TransformConfig) {
  let { from, to, desc } = transformConfig;
  from = from.toLowerCase();
  from = alias.get(from) || from;
  const transformerName = TRANSFORMER_TARGET.get(`${from}->${to}`);
  if (!transformerName) {
    throw new Error(`<${to} ${desc}> not supported`);
  }

  // cache transformer
  if (!(transformerName in TRANSFORMERS)) {
    TRANSFORMERS[transformerName] = (await import(path.join(__dirname, "./transformers/" + transformerName))).default;
  }

  return await TRANSFORMERS[transformerName](transformConfig);
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
