import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CliHost, Commands } from "./cli-contract.adapter.ts";

export const cleanTestEnvironment = (): void => {
  delete process.env.VITEST;
};

export const argumentsOf = (): string[] => process.argv.slice(2);
export const exit = (status: number): never => process.exit(status);

export const createHost = (
  root: string,
  project: string,
  extension: string,
  products: CliHost["products"],
  capture: (
    command: string,
    args: string[],
    options: { cwd: string; env: NodeJS.ProcessEnv; show: boolean },
  ) => { status: number },
): CliHost => ({
  version: () =>
    (
      JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
        version: string;
      }
    ).version,
  extraCommands: async () => {
    const file = join(root, `tools/commands${extension}`);

    return existsSync(file)
      ? ((await import(pathToFileURL(file).href)) as { commands: Commands })
          .commands
      : {};
  },
  selectedProduct: () => process.env.FACTORY_PRODUCT,
  selectProduct: (name) => {
    process.env.FACTORY_PRODUCT = name;
  },
  products,
  runForProduct: (name, command, args) =>
    capture(
      process.execPath,
      [join(root, `factory/main${extension}`), command, ...args],
      {
        cwd: project,
        env: { ...process.env, FACTORY_PRODUCT: name },
        show: true,
      },
    ).status,
  say: console.log,
  warn: console.error,
});
