import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { CHANGES } from "./change.ts";
import { DECISIONS, PROCEDURES } from "./consolidated.ts";
import { projectConfig } from "./schema.ts";
import type { FactoryConfig } from "./types.ts";
import { changesInImplementation } from "./validate.ts";

/** A write the guard refuses: the path, why, and the part of the harness it belongs to when it is harness. */
export type Refusal = { path: string; part?: string; reason: string };

const under =
  (...folders: string[]) =>
  (path: string) =>
    folders.some((folder) => path === folder || path.startsWith(`${folder}/`));

/**
 * The harness: what an agent never writes, whatever the state of the project. Each part says how
 * the thing it protects does change.
 */
const harness = (
  config: FactoryConfig,
): Array<{ part: string; holds: (path: string) => boolean; changes: string }> => [
  {
    part: "factory configuration",
    holds: (path) => /^factory\.config\.[cm]?[jt]s$/.test(path),
    changes: "the person edits it",
  },
  {
    part: "generated tests",
    holds: (path) => under(config.acceptance)(path) && path.endsWith(".feature.test.ts"),
    changes: "change the spec they come from and run `pnpm exec factory generate`",
  },
  {
    part: "installed schemas",
    holds: under("openspec/schemas"),
    changes: "they change when the package is installed again",
  },
  {
    part: "consolidated specs",
    holds: under("openspec/specs"),
    changes: "write a delta spec in a change; archiving merges it",
  },
  {
    part: "consolidated decisions",
    holds: under(DECISIONS),
    changes: "write an architecture decision in a plan; archiving consolidates it",
  },
  {
    part: "consolidated procedures",
    holds: under(PROCEDURES),
    changes: "write a procedure in a plan; archiving consolidates it",
  },
  {
    part: "archived changes",
    holds: under(`${CHANGES}/archive`),
    changes: "an archived change is history; open a new change",
  },
  {
    part: "agent skills",
    holds: under(".claude/skills", ".agents/skills"),
    changes: "they change when the package is installed again",
  },
  {
    part: "agent guards",
    holds: under(".claude/settings.json", ".claude/settings.local.json", ".codex"),
    changes: "they change when the package is installed again",
  },
  {
    part: "installed command",
    holds: under("node_modules"),
    changes: "it changes when the command is pinned again",
  },
];

/** The folders that hold product code: the module root and the roots of both kinds of test. */
export const productRoots = (config: FactoryConfig): string[] => [
  config.modules.replace(/\/\*$/, ""),
  config.acceptance,
  config.integration,
];

/**
 * Judges a write to each of `paths` (absolute, or relative to `cwd`) in the project at `root`. A
 * path outside the project, or inside it but neither harness nor product, is nobody's business.
 */
export const guard = async (root: string, paths: string[], cwd = root): Promise<Refusal[]> => {
  const config = await projectConfig(root);
  const parts = harness(config);
  const product = under(...productRoots(config));
  let building: boolean | undefined;
  const refusals: Refusal[] = [];
  for (const given of paths) {
    const path = relative(root, resolve(cwd, given)).split("\\").join("/");
    if (path.startsWith("..") || isAbsolute(path)) continue;
    const part = parts.find((p) => p.holds(path));
    if (part)
      refusals.push({
        path,
        part: part.part,
        reason: `${path} belongs to the harness (${part.part}) and an agent never writes it: ${part.changes}`,
      });
    else if (product(path)) {
      building ??= (await changesInImplementation(root)).length > 0;
      if (!building)
        refusals.push({
          path,
          reason: `${path} is product code and no change is in implementation: start with the \`plan\` phase, and write product code through the \`implement\` phase once validation reports the change ready`,
        });
    }
  }
  return refusals;
};

const PATCH_FILE = /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm;

/**
 * The files a tool call is about to write, from what the agent hands a hook: one path, or a patch
 * that names every file it touches.
 */
export const filesOf = (input: unknown): string[] => {
  const tool = ((input ?? {}) as { tool_input?: Record<string, unknown> }).tool_input ?? {};
  const named = [tool.file_path, tool.notebook_path, tool.path].filter(
    (p): p is string => typeof p === "string",
  );
  const command = Array.isArray(tool.command) ? tool.command.join("\n") : tool.command;
  const patched =
    typeof command === "string" ? [...command.matchAll(PATCH_FILE)].map((m) => m[1]!.trim()) : [];
  return [...new Set([...named, ...patched])];
};

/** The project a hook runs for: the nearest folder, from where the agent stands, that holds `openspec`. */
export const projectOf = (cwd: string): string => {
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    if (existsSync(join(dir, "openspec"))) return dir;
    if (dirname(dir) === dir) return resolve(cwd);
  }
};

/** What the agent hands a hook on standard input; nothing when the command is run by hand. */
export const hookInput = (): { cwd?: string } & Record<string, unknown> => {
  if (process.stdin.isTTY) return {};
  const text = readFileSync(0, "utf8").trim();
  return text ? (JSON.parse(text) as { cwd?: string }) : {};
};

/**
 * `factory guard [path…]`: judges the write an agent is about to make, read from the hook's input
 * or from the paths given. Exit status 2 with the reason on standard error refuses it; 0 lets it
 * through.
 */
export const run = async (args: string[]): Promise<number> => {
  const input = args.length ? {} : hookInput();
  const cwd = input.cwd ?? process.cwd();
  const root = projectOf(process.env.CLAUDE_PROJECT_DIR || cwd);
  const refusals = await guard(root, args.length ? args : filesOf(input), cwd);
  for (const refusal of refusals) console.error(refusal.reason);
  return refusals.length ? 2 : 0;
};
