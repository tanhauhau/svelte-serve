import { promises as fs } from "fs";
import chalk from "chalk";
import path from "path";
import inquirer from "inquirer";
import { URLSearchParams } from "url";
import fetch from "node-fetch";
import { init, parse } from "es-module-lexer";
import { executeAsync } from "../utils/execute";
import ora from "ora";

const SVELTE_REPL = /^https:\/\/svelte.dev\/repl\/([0-9a-f]{32})(\?.*)?$/;

export async function initSvelteApp(folderName: string | void) {
  const cwd = process.cwd();
  let templateDirectory = path.join(__dirname, "template");
  let targetDirectory: string;

  if (isSvelteRepl(folderName)) {
    // @ts-ignore
    const [_, replId, queryParams] = folderName.match(SVELTE_REPL);
    const query = new URLSearchParams(queryParams);
    const { files, name: description } = await getReplContent(replId);
    folderName = await askForFolderName(`repl-${replId}`);

    const spinner = ora(`Downloading Svelte REPL`).start();

    targetDirectory = path.join(cwd, folderName);
    await fs.mkdir(targetDirectory);

    const dependencies = new Set();
    for (const { name, source } of files) {
      await fs.writeFile(path.join(targetDirectory, name), source, "utf-8");

      const deps = await getImportStatement(source);
      deps.forEach((dep) => dependencies.add(dep));
    }
    await copyFile("index.html");
    await copyFile("package.json", { "%%packageName%%": folderName, "%%description%%": description });

    dependencies.add(`svelte${query.has("version") ? `@${query.get("version")}` : ""}`);

    spinner.text = "Installing dependencies";

    await executeAsync(targetDirectory, `yarn add ${[...dependencies].join(" ")}`);

    spinner.succeed(`Initialised ${folderName} at ${targetDirectory}!`);
    printWelcome(folderName);
    return;
  }

  let shouldCreateFolder = true;
  if (!folderName) {
    // if the current folder is empty,
    // init the svelte app here and dont create a new folder
    if ((await fs.readdir(cwd)).length === 0) {
      folderName = path.basename(cwd);
      targetDirectory = cwd;
      shouldCreateFolder = false;
    } else {
      folderName = await askForFolderName();
      targetDirectory = path.join(cwd, folderName);
    }
  } else {
    targetDirectory = path.join(cwd, folderName);
  }

  const spinner = ora(`Initialising`).start();

  if (shouldCreateFolder) {
    try {
      await fs.mkdir(targetDirectory);
    } catch (e) {
      return spinner.fail(`Target directory "${folderName}" already exists.`);
    }
  }

  try {
    await copyFile("index.html");
    await copyFile("App.svelte");
    await copyFile("package.json", { "%%packageName%%": folderName, "%%description%%": "svelte-serve template" });

    spinner.succeed(`Initialised ${folderName} at ${targetDirectory}!`);
    printWelcome(folderName);
  } catch (error) {
    return spinner.fail(error.message);
  }

  async function copyFile(filename: string, replacement?: Record<string, string>) {
    let content = await fs.readFile(path.join(templateDirectory, filename), "utf-8");
    if (replacement) {
      for (const key of Object.keys(replacement)) {
        const replacementRegex = new RegExp(key, "g");
        content = content.replace(replacementRegex, replacement[key]);
      }
    }
    await fs.writeFile(path.join(targetDirectory, filename), content, "utf-8");
  }
}

async function askForFolderName(defaultValue: string | void) {
  const { folderName = "svelte-app" } = await inquirer.prompt([
    {
      type: "input",
      name: "folderName",
      message: "Please specify folder name:",
      default: defaultValue,
      validate(str) {
        return !!str;
      },
    },
  ]);
  return folderName;
}

function isSvelteRepl(url: string | void) {
  return !!url && SVELTE_REPL.test(url);
}

async function getReplContent(replId: string): Promise<{ files: Array<{ name: string; source: string }>; name: string; uid: string }> {
  const response = await fetch(`https://svelte.dev/repl/${replId}.json`);
  return await response.json();
}

async function getImportStatement(source: string) {
  await init;

  let dependencies = new Set();
  let match;
  const regex = /<!--[^]*?-->|<script(\s[^]*?)?>([^]*?)<\/script>/gi;
  while ((match = regex.exec(source))) {
    const content = match[2];
    if (content) {
      const [imports] = parse(content);
      for (const { s, e } of imports) {
        const importee = content.substring(s, e);
        if (!(importee === "svelte" || importee.startsWith("svelte/"))) {
          dependencies.add(importee);
        }
      }
    }
  }
  return dependencies;
}

function printWelcome(folderName: string) {
  console.log(``);
  console.log(`To get started, we suggest that you begin by typing:`);
  console.log(``);
  console.log(`  ${chalk.cyan(`cd ${folderName}`)}`);
  console.log(`  ${chalk.cyan(`svelte-serve`)}`);
  console.log(``);
  console.log(`Happy hacking!`);
}
