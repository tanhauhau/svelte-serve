import type { TransformConfig } from "../types";
import { loadLib } from "../utils/loadLib";

let coffeeScript: any;

export default async function ({ to, desc, root, content, filename, options = {} }: TransformConfig) {
  if (!coffeeScript) {
    const coffeeLib = await loadLib(["coffeescript"], {
      errorMessage: `$1 are required for <${to} ${desc}>`,
      root,
    });
    coffeeScript = coffeeLib.default;
  }

  const { js: code, sourceMap: map } = coffeeScript.compile(content, {
    filename,
    sourceMap: true,
    bare: false,
    ...options,
  });

  return {
    code,
    map,
  };
}
