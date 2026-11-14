import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cacheDir, PROJECT_ROOT } from "../core/paths.ts";
import { config } from "./project.ts";

const KINDS = { acceptance: () => config.acceptance, integration: () => config.integration };

/**
 * `factory test <acceptance|integration> [--report <file>]`: the product's tests of one kind, run
 * with the project's own test runner over the configured root of that kind and nothing else.
 * `--report` also writes each test's result to that file, as JSON.
 */
export const test = async (args: string[]): Promise<number> => {
  const [kind] = args;
  if (!kind || !(kind in KINDS)) {
    console.error(`Unknown kind of test: ${kind}. Kinds: ${Object.keys(KINDS).join(", ")}`);
    return 2;
  }
  const runner = join(PROJECT_ROOT, "node_modules/vitest/vitest.mjs");
  if (!existsSync(runner)) {
    console.error("the project has no test runner: add vitest to its development dependencies");
    return 2;
  }
  const root = KINDS[kind as keyof typeof KINDS]();
  const path = join(cacheDir(PROJECT_ROOT), `vitest.${kind}.config.mjs`);
  writeFileSync(
    path,
    `export default ${JSON.stringify({
      root: PROJECT_ROOT,
      test: { include: [`${root}/**/*.test.ts`], environment: "node", passWithNoTests: true },
    })};\n`,
  );
  const report = args.indexOf("--report");
  const reporters =
    report === -1
      ? []
      : ["--reporter=default", "--reporter=json", `--outputFile.json=${args[report + 1]}`];
  const r = spawnSync(process.execPath, [runner, "run", "--config", path, ...reporters], {
    stdio: "inherit",
  });
  return r.status ?? 1;
};
