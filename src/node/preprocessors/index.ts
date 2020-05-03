import path from "path";
import type { TransformConfig, TransformResult } from "./types";
import { promptToInstall } from "./utils/installHelper";
import { broadcast } from "../serve/wss";
import chalk from "chalk";
import { or } from "./utils/or";
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

export function getMissingDependenciesPreprocessor(root: string) {
  return {
    async markup({ content }: { content: string; filename?: string }) {
      let message: Array<string> = [];
      let unformattedMessage: Array<string> = [];
      let dependencies: Array<Array<string>> = [];
      let match;
      const scriptRegex = /<!--[^]*?-->|<script(\s[^]*?)?>([^]*?)<\/script>/gi;
      const styleRegex = /<!--[^]*?-->|<style(\s[^]*?)?>([^]*?)<\/style>/gi;

      function getMissingDependencies(transformer: any, tag: string, lang: any) {
        const deps: string[] = transformer.getMissingDependencies({ root });
        if (!deps) return;
        dependencies.push(deps);
        message.push(`- ${or(deps.map((dep) => chalk.red(`"${dep}"`)))} is required for ${chalk.blue(`<${tag} ${lang.desc}>`)}`);
        unformattedMessage.push(`${or(deps.map((dep) => `"${dep}"`))} is required for <${tag} ${lang.desc}>`);
      }

      while ((match = scriptRegex.exec(content))) {
        const attributes = parse_attributes(match[1] || '');
        const lang = getLang(attributes);
        if (!lang) continue;
        const transformer = await getTransformer(lang.from, "script", lang.desc);
        getMissingDependencies(transformer, "script", lang);
      }

      while ((match = styleRegex.exec(content))) {
        const attributes = parse_attributes(match[1] || '');
        const lang = getLang(attributes);
        if (!lang) continue;
        const transformer = await getTransformer(lang.from, "style", lang.desc);
        getMissingDependencies(transformer, "style", lang);
      }

      if (dependencies.length > 0) {
        console.log("");
        console.log(chalk.red(chalk.bold("Missing Dependencies")));
        console.log("");
        console.log(message.join("\n"));
        console.log("");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        broadcast({ type: "missing_dependencies", dependencies, message: unformattedMessage });
        await promptToInstall(root, dependencies);
        broadcast({ type: "missing_dependencies_done" });
      }

      return { code: content };
    },
  };
}

export function getTransformCodePreprocessor(root: string) {
  return {
    style: getPreprocessor({ root, to: "style" }),
    script: getPreprocessor({ root, to: "script" }),
  };
}

export async function transform(transformConfig: TransformConfig) {
  let { from, to, desc } = transformConfig;
  const transformer = await getTransformer(from, to, desc);
  // @ts-ignore
  return await transformer.default(transformConfig);
}

async function getTransformer(from: string, to: string, desc: string) {
  from = from.toLowerCase();
  from = alias.get(from) || from;
  const transformerName = TRANSFORMER_TARGET.get(`${from}->${to}`);
  if (!transformerName) {
    throw new Error(`<${to} ${desc}> not supported`);
  }

  // cache transformer
  if (!(transformerName in TRANSFORMERS)) {
    TRANSFORMERS[transformerName] = await import(path.join(__dirname, "./transformers/" + transformerName));
  }
  return TRANSFORMERS[transformerName];
}

function getPreprocessor({ root, to }: { root: string; to: string }) {
  return async function ({
    content,
    attributes,
    filename,
  }: {
    content: string;
    attributes: Record<string, string | boolean>;
    filename: string;
  }) {
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

function parse_attributes(str: string) {
  const attrs: Record<string, string | boolean> = {};
  str
    .split(/\s+/)
    .filter(Boolean)
    .forEach((attr) => {
      const p = attr.indexOf("=");
      if (p === -1) {
        attrs[attr] = true;
      } else {
        attrs[attr.slice(0, p)] = `'"`.includes(attr[p + 1]) ? attr.slice(p + 2, -1) : attr.slice(p + 1);
      }
    });
  return attrs;
}
