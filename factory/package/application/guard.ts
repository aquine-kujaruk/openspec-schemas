import type { Refusal } from "../domain/guard.ts";
import type { Product } from "../../repository/domain/products.ts";
import type { FactoryConfig } from "../../shared/domain/types.ts";
import type { Building } from "../../flow/domain/validate.ts";
import type { GuardPorts } from "../domain/guard.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createGuard = ({
  environment,
  workingDirectory,
  interactive,
  existsSync,
  readFileSync,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  CHANGES,
  DECISIONS,
  PROCEDURES,
  productRoots,
  productHolding,
  projectProducts,
  changesInImplementation,
}: GuardPorts): Omit<typeof import("../domain/guard.ts"), "run"> => {
  /** A write the guard refuses: the path, why, and the part of the harness it belongs to when it is harness. */

  const under =
    (...folders: string[]) =>
    (path: string) =>
      folders.some(
        (folder) => path === folder || path.startsWith(`${folder}/`),
      );

  /**
   * The harness: what an agent never writes, whatever the state of the project. Each part says how
   * the thing it protects does change.
   */
  const harness = (
    acceptance: string[],
  ): Array<{
    part: string;
    holds: (path: string) => boolean;
    changes: string;
  }> => [
    {
      part: "factory configuration",
      holds: (path) => /^factory\.config\.[cm]?[jt]s$/.test(path),
      changes: "the person edits it",
    },
    {
      part: "generated tests",
      holds: (path) =>
        under(...acceptance)(path) && path.endsWith(".feature.test.ts"),
      changes:
        "change the spec they come from and run `pnpm exec factory generate`",
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
      changes:
        "write an architecture decision in a plan; archiving consolidates it",
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
      holds: under(
        ".claude/settings.json",
        ".claude/settings.local.json",
        ".codex",
      ),
      changes: "they change when the package is installed again",
    },
    {
      part: "installed command",
      holds: under("node_modules"),
      changes: "it changes when the command is pinned again",
    },
  ];

  /** Why a write to product code is refused: what is in implementation, and how the write becomes possible. */
  const productRefusal = (
    path: string,
    started: Building[],
    product?: Product,
  ): string => {
    if (!started.length)
      return `${path} is product code and no change is in implementation: start with the \`plan\` phase, and write product code through the \`implement\` phase once validation reports the change ready`;
    const listed = started
      .map(
        (c) =>
          `${c.name}, ${c.product ? `product ${c.product}, ` : ""}${c.schema}`,
      )
      .join("; ");
    if (product)
      return `${path} belongs to the product ${product.name}, and no change of that product is in implementation (${listed}): a product's folder opens only to a change of that product, opened by the \`plan\` phase`;
    return `${path} is product code and the change in implementation (${listed}) was made with a schema that builds none: product code is written through a change of a schema that has workstreams, opened by the \`plan\` phase`;
  };

  /**
   * Judges a write to each of `paths` (absolute, or relative to `cwd`) in the project at `root`. A
   * path outside the project, or inside it but neither harness nor product, is nobody's business. In
   * a project that declares products, a path in a product's folder opens only to a change of that
   * product; otherwise product code opens to a change whose schema builds it.
   */
  const guard = async (
    root: string,
    paths: string[],
    cwd = root,
  ): Promise<Refusal[]> => {
    const products = await projectProducts(root);
    const declared = products.some((p) => p.name !== "");
    const parts = harness(products.map((p) => p.config.acceptance));
    const roots = under(...productRoots(products[0]!.config));
    let started: Building[] | undefined;
    const refusals: Refusal[] = [];
    for (const given of paths) {
      const path = relative(root, resolve(cwd, given)).split("\\").join("/");
      if (path.startsWith("..") || isAbsolute(path)) continue;
      const part = parts.find((p) => p.holds(path));
      if (part) {
        refusals.push({
          path,
          part: part.part,
          reason: `${path} belongs to the harness (${part.part}) and an agent never writes it: ${part.changes}`,
        });
        continue;
      }
      const holder = declared ? productHolding(products, path) : undefined;
      if (declared ? !holder : !roots(path)) continue;
      started ??= await changesInImplementation(root);
      const opens = holder
        ? started.some((change) => change.product === holder.name)
        : started.some((change) => change.builds);
      if (opens) continue;
      refusals.push({ path, reason: productRefusal(path, started, holder) });
    }
    return refusals;
  };

  const PATCH_FILE = /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm;

  /**
   * The files a tool call is about to write, from what the agent hands a hook: one path, or a patch
   * that names every file it touches.
   */
  const filesOf = (input: unknown): string[] => {
    const tool =
      ((input ?? {}) as { tool_input?: Record<string, unknown> }).tool_input ??
      {};
    const named = [tool.file_path, tool.notebook_path, tool.path].filter(
      (p): p is string => typeof p === "string",
    );
    const command = Array.isArray(tool.command)
      ? tool.command.join("\n")
      : tool.command;
    const patched =
      typeof command === "string"
        ? [...command.matchAll(PATCH_FILE)].map((m) => m[1]!.trim())
        : [];
    return [...new Set([...named, ...patched])];
  };

  /** The project a hook runs for: the nearest folder, from where the agent stands, that holds `openspec`. */
  const projectOf = (cwd: string): string => {
    for (let dir = resolve(cwd); ; dir = dirname(dir)) {
      if (existsSync(join(dir, "openspec"))) return dir;
      if (dirname(dir) === dir) return resolve(cwd);
    }
  };

  /** What the agent hands a hook on standard input; nothing when the command is run by hand. */
  const hookInput = (): { cwd?: string } & Record<string, unknown> => {
    if (interactive()) return {};
    const text = readFileSync(0, "utf8").trim();
    return text ? (JSON.parse(text) as { cwd?: string }) : {};
  };
  return { guard, filesOf, projectOf, hookInput };
};
