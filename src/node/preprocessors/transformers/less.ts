import type { TransformConfig } from "../types";
import path from "path";
import { loadLib } from "../utils/loadLib";
import { resolveFrom } from "../utils/resolvedFrom";

let less: any;

export function getMissingDependencies({ root }: TransformConfig) {
  if (!resolveFrom(root, "less")) {
    return ["less"];
  }
}

export default async function ({ to, desc, root, content, filename, options = {} }: TransformConfig) {
  if (!less) {
    const lessLib = await loadLib(["less"], {
      errorMessage: `$1 are required for <${to} ${desc}>`,
      root,
    });
    less = lessLib.default;
  }

  const { css: code, map, imports: dependencies } = await less.render(content, {
    sourceMap: {},
    filename,
    paths: [...(options.includePaths || []), "node_modules", path.dirname(filename)],
    ...options,
  });
  return {
    code,
    map,
    dependencies,
  };
}
