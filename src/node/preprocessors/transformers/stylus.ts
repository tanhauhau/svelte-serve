import type { TransformConfig } from "../types";
import path from "path";
import { loadLib } from "../utils/loadLib";
import { resolveFrom } from "../utils/resolvedFrom";

let stylus: any;

export function getMissingDependencies({ root }: TransformConfig) {
  if (!resolveFrom(root, "stylus")) {
    return ["stylus"];
  }
}

export default async function ({ desc, to, root, content, filename, options = {} }: TransformConfig) {
  if (!stylus) {
    const stylusLib = await loadLib(["stylus"], {
      errorMessage: `$1 is required for <${to} ${desc}>`,
      root,
    });
    stylus = stylusLib.default;
  }

  return new Promise((resolve, reject) => {
    const style = stylus(content, {
      filename,
      includePaths: [...(options.includePaths || []), "node_modules", path.dirname(filename)],
      ...options,
    }).set("sourcemap", { ...options.sourcemap });

    style.render((err: Error, css: string) => {
      // istanbul ignore next
      if (err) reject(err);

      resolve({
        code: css,
        map: style.sourcemap,
        // .map() necessary for windows compatibility
        dependencies: style.deps(filename).map((filePath: string) => path.resolve(filePath)),
      });
    });
  });
}
