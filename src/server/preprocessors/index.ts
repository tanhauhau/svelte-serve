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
