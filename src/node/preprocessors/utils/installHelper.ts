import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { executeAsync } from "../../utils/execute";
import { or } from "./or";

type ModuleOption = string[];
export async function promptToInstall(root: string, modules: ModuleOption[]) {
  console.log(`To fix this, you need to install the following module${modules.length > 0 ? "s" : ""}:`);
  modules.forEach((mod) => {
    console.log("-", or(mod.map((m) => bold(m))));
  });
  console.log("");
  const { install } = await prompt([{ type: "confirm", name: "install", default: true, message: "Do you want to install them now?" }]);
  if (install) {
    const modsToInstall = [];
    for (const mod of modules) {
      if (!Array.isArray(mod)) {
        modsToInstall.push(mod);
      } else if (mod.length === 1) {
        modsToInstall.push(mod[0]);
      } else {
        const { chosen } = await prompt([
          { type: "rawlist", name: "chosen", choices: mod, default: 0, message: "Which one would you like to install?" },
        ]);
        modsToInstall.push(chosen);
      }
    }

    const spinner = ora(`Installing ${modsToInstall.join(", ")}`).start();
    await executeAsync(root, `yarn add --dev ${modsToInstall.join(" ")}`);
    spinner.succeed(`Installed ${modsToInstall.join(", ")}`);

    return true;
  }
}

function bold(str: string) {
  return chalk.bold('"' + str + '"');
}

let close: Function;
function prompt(questions: any): any {
  // cleanup previous inquirer
  if (typeof close === "function") {
    close();
  }
  let promise = inquirer.prompt(questions);
  // @ts-ignore
  close = promise.ui.close.bind(promise.ui);
  return promise;
}
