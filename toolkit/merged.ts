import { cpSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { activeChanges, CHANGES, readChange } from "./change.ts";
import { COMMAND, runTool } from "./paths.ts";
import { NotValidatable, validateChange } from "./validate.ts";

const TELEMETRY_OFF = { OPENSPEC_TELEMETRY: "0", DO_NOT_TRACK: "1" };

/** Runs the specification tool in the project at `root`. */
export const openspec = (root: string, args: string[]) => {
  const r = runTool("@fission-ai/openspec", args, {
    bin: "openspec",
    cwd: root,
    env: { ...process.env, ...TELEMETRY_OFF },
  });
  return { status: r.status, output: `${r.stdout}${r.stderr}`.trim() };
};

/** The active changes that validation reports ready and that hold delta specs, oldest first. */
const readyWithDeltas = async (root: string): Promise<string[]> => {
  const found: Array<{ name: string; created: string }> = [];
  for (const name of activeChanges(root)) {
    const change = readChange(root, name);
    if (!change?.deltaSpecs.length) continue;
    try {
      if ((await validateChange(root, name)).ready)
        found.push({ name, created: change.created ?? "" });
    } catch (e) {
      if (!(e instanceof NotValidatable)) throw e;
    }
  }
  return found
    .sort((a, b) => a.created.localeCompare(b.created) || a.name.localeCompare(b.name))
    .map((c) => c.name);
};

/**
 * The project's specs as they will stand once every ready change is archived: a copy of its
 * `openspec` folder in which the specification tool has archived them, so the merge is the tool's
 * own. Returns the folder of that copy, or nothing when no ready change holds a delta.
 */
export const mergedSpecs = async (
  root: string,
): Promise<{ root: string; changes: string[]; dispose: () => void } | undefined> => {
  const changes = await readyWithDeltas(root);
  if (!changes.length) return undefined;
  const copy = mkdtempSync(join(tmpdir(), `${COMMAND}-merged-`));
  const dispose = () => rmSync(copy, { recursive: true, force: true });
  try {
    mkdirSync(join(copy, CHANGES), { recursive: true });
    for (const part of ["openspec/specs", "openspec/config.yaml"])
      if (existsSync(join(root, part))) cpSync(join(root, part), join(copy, part), { recursive: true });
    if (existsSync(join(root, "openspec/schemas")))
      symlinkSync(realpathSync(join(root, "openspec/schemas")), join(copy, "openspec/schemas"));
    for (const name of changes) {
      cpSync(join(root, CHANGES, name), join(copy, CHANGES, name), { recursive: true });
      const merged = openspec(copy, ["archive", name, "-y"]);
      if (merged.status !== 0)
        throw new Error(`the delta specs of ${name} do not merge:\n${merged.output}`);
    }
    return { root: copy, changes, dispose };
  } catch (e) {
    dispose();
    throw e;
  }
};
