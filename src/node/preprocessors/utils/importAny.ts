import { resolveFrom } from "./resolvedFrom";

export async function importAny(root: string, modules: string[]) {
  for (const mod of modules) {
    const resolvedPath = resolveFrom(root, mod);
    if (resolvedPath) {
      return await import(resolvedPath);
    }
  }
}
