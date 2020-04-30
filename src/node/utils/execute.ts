import { exec, execSync } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function executeSync(cwd: string, command: string) {
  return execSync(command, { cwd, encoding: "utf8", stdio: "pipe" });
}

export function executeAsync(cwd: string, command: string) {
  return execAsync(command, { cwd, encoding: "utf8" });
}
