/** Runs the specification tool in the project at `root`. */
export declare const openspec: (
  root: string,
  args: string[],
) => {
  status: number;
  output: string;
};
/**
 * The folder whose `openspec/specs` holds the project's specs as ready changes leave them: a merged
 * copy while a ready change holds deltas (`dispose` removes it), else the project itself.
 */
export declare const specsAsReadyChangesLeaveThem: (root: string) => Promise<{
  base: string;
  dispose: () => void;
}>;
/**
 * The project's specs as they will stand once every ready change is archived: a copy of its
 * `openspec` folder in which the specification tool has archived them, so the merge is the tool's
 * own. Returns the folder of that copy, or nothing when no ready change holds a delta.
 */
export declare const mergedSpecs: (root: string) => Promise<
  | {
      root: string;
      changes: string[];
      dispose: () => void;
    }
  | undefined
>;

/** Collaborators supplied by the composition root. */
export type MergedPorts = {
  environment: () => NodeJS.ProcessEnv;
  cpSync: (typeof import("node:fs"))["cpSync"];
  existsSync: (typeof import("node:fs"))["existsSync"];
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  mkdtempSync: (typeof import("node:fs"))["mkdtempSync"];
  realpathSync: (typeof import("node:fs"))["realpathSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  symlinkSync: (typeof import("node:fs"))["symlinkSync"];
  tmpdir: (typeof import("node:os"))["tmpdir"];
  join: (typeof import("node:path"))["join"];
  activeChanges: (typeof import("../../shared/domain/change.ts"))["activeChanges"];
  CHANGES: (typeof import("../../shared/domain/change.ts"))["CHANGES"];
  readChange: (typeof import("../../shared/domain/change.ts"))["readChange"];
  COMMAND: (typeof import("../../shared/domain/paths.ts"))["COMMAND"];
  runTool: (typeof import("../../shared/domain/paths.ts"))["runTool"];
  NotValidatable: (typeof import("./validate.ts"))["NotValidatable"];
  validateChange: (typeof import("./validate.ts"))["validateChange"];
};
