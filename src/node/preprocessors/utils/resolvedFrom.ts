import { executeSync } from "../../utils/execute";

export function resolveFrom(fromDirectory: string, moduleId: string) {
  try {
    // require.resolve has cache that has no API to clear them
    // once it failed to resolve, it will always fail to resolve
    // this HACKERY allow us to install deps and resolve them again
    return executeSync(fromDirectory, `node -e "console.log(require.resolve('${moduleId}'))"`).trim();
  } catch {
    return undefined;
  }
}
