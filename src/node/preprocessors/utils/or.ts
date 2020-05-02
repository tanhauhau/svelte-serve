export function or(modules: string[]) {
  if (!Array.isArray(modules)) {
    return modules;
  }
  if (modules.length <= 2) {
    return modules.map((mod) => mod).join(" or ");
  }
  return `${modules
    .slice(0, -1)
    .map((mod) => mod)
    .join(", ")} or ${modules[modules.length - 1]}`;
}
