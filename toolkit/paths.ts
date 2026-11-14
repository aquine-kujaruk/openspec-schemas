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

/** The command's own package: where the workstreams, the review and the schemas live. */
export const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

/** The project the command serves: the folder it runs in. */
export const PROJECT_ROOT = process.cwd();

/** The extension of the command's own modules: TypeScript where it is developed, JavaScript once built. */
export const SOURCE_EXT = extname(fileURLToPath(import.meta.url));

/** The name the command is installed under in a project. */
export const COMMAND = "factory";

/** Where the setup skill keeps the command, and the record of what the package says about itself. */
export const SETUP_ASSETS = "setup/assets";
export const INSTALLED = "manifest.json";

/** The command runs in the repository that develops it, where the layer specs and the example files are sources. */
export const DEVELOPING = PROJECT_ROOT === PACKAGE_ROOT;

/** The layer specs. They exist in the repository that develops the workstreams, not in a project. */
export const ARCHITECTURE_SPECS = "openspec/specs/architecture";

export const hasLayerSpecs = (root = PACKAGE_ROOT): boolean =>
  existsSync(join(root, ARCHITECTURE_SPECS));

/** Why the spec checks are skipped, for test titles. */
export const SKIPPED_WITHOUT_SPECS = `skipped: ${ARCHITECTURE_SPECS} is absent`;

/** The product spec of `useCase` in `module`, from the configured glob (`openspec/specs/*\/*\/spec.md`). */
export const productSpecPath = (glob: string, module: string, useCase: string): string =>
  glob.replace("*", module).replace("*", useCase);

/** Where an active change holds that same spec while it is a delta: any change, the same path under its `specs`. */
export const deltaSpecGlob = (glob: string, module: string, useCase: string): string =>
  productSpecPath(glob, module, useCase).replace(/^openspec\/specs\//, "openspec/changes/*/specs/");

/** Where the command writes the tool configurations it composes for one run, inside the project. */
export const cacheDir = (root = process.cwd()): string => {
  const dir = join(root, "node_modules/.cache/factory");
  mkdirSync(dir, { recursive: true });
  return dir;
};

const require = createRequire(import.meta.url);

/** The executable `name` of the package `pkg`, one of the command's own dependencies. */
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
  throw new Error(`the dependency ${pkg} provides no executable ${name}`);
};

export type Ran = { status: number; stdout: string; stderr: string };

/**
 * Runs a program and returns what it printed. Its output goes through files and not through pipes:
 * the sandbox an agent runs commands in may forbid the pipes a subprocess is usually read through.
 * With `show`, the output goes straight to the terminal instead and is not returned.
 */
export const capture = (
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; input?: string; show?: boolean } = {},
): Ran => {
  const dir = mkdtempSync(join(tmpdir(), `${COMMAND}-run-`));
  const open = (name: string, flags: string) => openSync(join(dir, name), flags);
  try {
    if (options.input !== undefined) writeFileSync(join(dir, "in"), options.input);
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
    const read = (name: string) => (options.show ? "" : readFileSync(join(dir, name), "utf8"));
    return {
      status: r.status ?? 1,
      stdout: read("out"),
      stderr: r.error ? `${read("err")}${r.error.message}` : read("err"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/** Runs an executable of one of the command's dependencies under this Node. */
export const runTool = (
  pkg: string,
  args: string[],
  options: Parameters<typeof capture>[2] & { bin?: string } = {},
): Ran => {
  const { bin, ...rest } = options;
  return capture(process.execPath, [tool(pkg, bin), ...args], rest);
};

/** The JSON object a tool printed, whatever it printed around it. */
export const jsonOf = (stdout: string): any =>
  JSON.parse(stdout.slice(stdout.indexOf("{"), stdout.lastIndexOf("}") + 1));

/** Runs the command itself in the project at `root`, as an agent would; returns its status and the tail of what it printed. */
export const self = (
  root: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): { status: number; output: string } => {
  const cli = join(PACKAGE_ROOT, "toolkit", `cli${SOURCE_EXT}`);
  const r = capture(process.execPath, [cli, ...args], { cwd: root, env });
  const output = `${r.stdout}${r.stderr}`.replace(/\u001b\[[0-9;]*m/g, "").trim();
  return { status: r.status, output: output.split("\n").slice(-60).join("\n") };
};
