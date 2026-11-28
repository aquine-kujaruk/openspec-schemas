import { PlantException } from "../../domain/exceptions/plant.exceptions.ts";
import { spawnSync } from "node:child_process";

import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_ROOT: string = fileURLToPath(
  new URL("../../../..", import.meta.url),
).replace(/\/$/, "");

export const PROJECT_ROOT: string = process.cwd();

export const SOURCE_EXT: string = extname(fileURLToPath(import.meta.url));

export const COMMAND = "factory";

export const SETUP_ASSETS = "setup/assets";
export const INSTALLED = "manifest.json";

export const DEVELOPING = PROJECT_ROOT === PACKAGE_ROOT;

export const ARCHITECTURE_SPECS = "openspec/specs/architecture";

export const hasLayerSpecs = (root = PACKAGE_ROOT): boolean =>
  existsSync(join(root, ARCHITECTURE_SPECS));

export const SKIPPED_WITHOUT_SPECS = `skipped: ${ARCHITECTURE_SPECS} is absent`;

export const productSpecPath = (
  glob: string,
  module: string,
  useCase: string,
): string => glob.replace("*", module).replace("*", useCase);

export const deltaSpecGlob = (
  glob: string,
  module: string,
  useCase: string,
): string =>
  productSpecPath(glob, module, useCase).replace(
    /^openspec\/specs\//,
    "openspec/changes/*/specs/",
  );

export const cacheDir = (root = process.cwd()): string => {
  const dir = join(root, "node_modules/.cache/factory");
  mkdirSync(dir, { recursive: true });

  return dir;
};

const require = createRequire(import.meta.url);

export const tool = (pkg: string, name = pkg): string => {
  for (const base of require.resolve.paths(pkg) ?? []) {
    const manifest = join(base, pkg, "package.json");
    if (!existsSync(manifest)) continue;

    const { bin } = JSON.parse(readFileSync(manifest, "utf8")) as {
      bin?: string | Record<string, string>;
    };

    const path = typeof bin === "string" ? bin : bin?.[name];
    if (path) return join(base, pkg, path);
  }

  throw new PlantException(`the dependency ${pkg} provides no executable ${name}`, { cause: `the dependency ${pkg} provides no executable ${name}` });
};

export type Ran = { status: number; stdout: string; stderr: string };

export const capture = (
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    input?: string;
    show?: boolean;
  } = {},
): Ran => {
  const dir = mkdtempSync(join(tmpdir(), `${COMMAND}-run-`));

  const open = (name: string, flags: string) =>
    openSync(join(dir, name), flags);

  try {
    if (options.input !== undefined)
      writeFileSync(join(dir, "in"), options.input);

    const fds = [
      options.input === undefined ? undefined : open("in", "r"),
      options.show ? undefined : open("out", "w"),
      options.show ? undefined : open("err", "w"),
    ];

    const r = spawnSync(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: process.platform === "win32",
      stdio: [fds[0] ?? "ignore", fds[1] ?? "inherit", fds[2] ?? "inherit"],
    });

    for (const fd of fds) if (fd !== undefined) closeSync(fd);

    const read = (name: string) =>
      options.show ? "" : readFileSync(join(dir, name), "utf8");

    return {
      status: r.status ?? 1,
      stdout: read("out"),
      stderr: r.error ? `${read("err")}${r.error.message}` : read("err"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

export const runTool = (
  pkg: string,
  args: string[],
  options: Parameters<typeof capture>[2] & { bin?: string } = {},
): Ran => {
  const { bin, ...rest } = options;

  return capture(process.execPath, [tool(pkg, bin), ...args], rest);
};

export const jsonOf = (stdout: string): any =>
  JSON.parse(stdout.slice(stdout.indexOf("{"), stdout.lastIndexOf("}") + 1));

export const self = (
  root: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): { status: number; output: string } => {
  const cli = join(PACKAGE_ROOT, "factory", `main${SOURCE_EXT}`);
  const r = capture(process.execPath, [cli, ...args], { cwd: root, env });

  const output = `${r.stdout}${r.stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "")
    .trim();

  return { status: r.status, output: output.split("\n").slice(-60).join("\n") };
};
