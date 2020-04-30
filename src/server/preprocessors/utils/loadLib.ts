import chalk from "chalk";
import { importAny } from "./importAny";
import { promptToInstall } from "./installHelper";

export async function loadLib(libs: string[], { errorMessage, root }: { errorMessage: string; root: string }) {
  let lib = await importAny(root, libs);
  if (lib) return lib;

  console.error(chalk.red(errorMessage.replace("$1", libs.map((lib) => `"${lib}"`).join(", "))));

  // attempt to install
  if (await promptToInstall(root, [libs])) {
    return await importAny(root, libs);
  }

  throw new Error("failed to load lib");
}
