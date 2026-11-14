import { existsSync, globSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export const CHANGES = "openspec/changes";

/** The record of where a change stands with the completion gate. It exists from the moment the implement phase starts the change. */
export const GATE = "gate.json";

/** The implement phase started the change and nothing has ended that yet. */
export const isStarted = (root: string, name: string): boolean =>
  existsSync(join(root, CHANGES, name, GATE));

/** A change as it is on disk. */
export type Change = {
  name: string;
  dir: string;
  /** The schema the change was made with, as the specification tool recorded it. */
  schema?: string;
  /** The day it was created, as the specification tool recorded it. */
  created?: string;
  /** The change is marked as changing no behaviour a user notices. */
  noBehaviour: boolean;
  /** The text of its plan, when it has one. */
  plan?: string;
  /** Its delta specs, relative to `dir`. */
  deltaSpecs: string[];
};

export const readChange = (root: string, name: string): Change | undefined => {
  const dir = join(root, CHANGES, name);
  if (!existsSync(dir)) return undefined;
  const meta = join(dir, ".openspec.yaml");
  const { schema, skip_specs, created } = (
    existsSync(meta) ? (parse(readFileSync(meta, "utf8")) ?? {}) : {}
  ) as { schema?: unknown; skip_specs?: unknown; created?: unknown };
  const plan = join(dir, "plan.md");
  return {
    name,
    dir,
    schema: typeof schema === "string" ? schema : undefined,
    created: created === undefined ? undefined : String(created).slice(0, 10),
    noBehaviour: skip_specs === true,
    plan: existsSync(plan) ? readFileSync(plan, "utf8") : undefined,
    deltaSpecs: globSync("specs/**/*.md", { cwd: dir }).sort(),
  };
};

/** The changes that are not archived, by name. */
export const activeChanges = (root: string): string[] => {
  const dir = join(root, CHANGES);
  return existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name !== "archive")
        .map((d) => d.name)
        .sort()
    : [];
};
