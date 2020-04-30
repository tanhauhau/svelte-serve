import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { executeAsync } from "../../utils/execute";

type ModuleOption = string | string[];
export async function promptToInstall(root: string, modules: ModuleOption[]) {
  console.log(`To fix this, you need to install the following module${modules.length > 0 ? "s" : ""}:`);
  modules.forEach((mod) => {
    console.log("-", or(mod));
  });
  console.log("");
  const { install } = await inquirer.prompt([{ type: "confirm", name: "install", default: true, message: "Do you want to install them now?" }]);
  console.log("install", install);
  if (install) {
    const modsToInstall = [];
    for (const mod of modules) {
      if (!Array.isArray(mod)) {
        modsToInstall.push(mod);
      } else if (mod.length === 1) {
        modsToInstall.push(mod[0]);
      } else {
        const { chosen } = await inquirer.prompt([{ type: "rawlist", name: "chosen", choices: mod, default: 0, message: "Which one would you like to install?" }]);
        modsToInstall.push(chosen);
      }
    }
    console.log("modsToInstall", modsToInstall);
    const spinner = ora(`Installing ${modsToInstall.join(", ")}`).start();
    await executeAsync(root, `yarn add --dev ${modsToInstall.join(" ")}`);
    spinner.stop();

    return true;
  }
}

function or(modules: ModuleOption) {
  if (!Array.isArray(modules)) {
    return bold(modules);
  }
  if (modules.length <= 2) {
    return modules.map((mod) => bold(mod)).join(" or ");
  }
  return `${modules
    .slice(0, -1)
    .map((mod) => bold(mod))
    .join(", ")} or ${bold(modules[modules.length - 1])}`;
}

function bold(str: string) {
  return chalk.bold('"' + str + '"');
}
