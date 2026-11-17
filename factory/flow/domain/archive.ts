export type Archived = {
  change: string;
  place: "archived" | "still active";
  /** The name it is archived under. */
  as?: string;
  /** Why it stays active. */
  reason?: string;
};
/**
 * Archives the change `name`, or every active change when none is named, oldest first: a change
 * whose evidence reports it verified has its plan's tags applied to the consolidated decisions and
 * procedures, its delta specs merged by the specification tool, and its folder moved to the archive.
 * Any other stays active. The generated tests are then written again from the merged specs.
 */
export declare const archive: (
  root: string,
  name?: string,
  {
    date,
  }?: {
    date?: string;
  },
) => Promise<Archived[]>;
/**
 * `factory archive [change]`: archives the change, or every verified change when none is named, and
 * says where each one stands. Exit status 1 when a change that was named stays active.
 */
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type ArchivePorts = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  renameSync: (typeof import("node:fs"))["renameSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  dirname: (typeof import("node:path"))["dirname"];
  join: (typeof import("node:path"))["join"];
  activeChanges: (typeof import("../../shared/domain/change.ts"))["activeChanges"];
  CHANGES: (typeof import("../../shared/domain/change.ts"))["CHANGES"];
  readChange: (typeof import("../../shared/domain/change.ts"))["readChange"];
  DECISIONS: (typeof import("../../shared/domain/consolidated.ts"))["DECISIONS"];
  PROCEDURES: (typeof import("../../shared/domain/consolidated.ts"))["PROCEDURES"];
  readConsolidated: (typeof import("../../shared/domain/consolidated.ts"))["readConsolidated"];
  digestOf: (typeof import("./evidence.ts"))["digestOf"];
  readEvidence: (typeof import("./evidence.ts"))["readEvidence"];
  raise: (typeof import("./feedback.ts"))["raise"];
  openspec: (typeof import("./merged.ts"))["openspec"];
  DEVELOPING: (typeof import("../../shared/domain/paths.ts"))["DEVELOPING"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  self: (typeof import("../../shared/domain/paths.ts"))["self"];
  operationsOf: (typeof import("../../shared/domain/plan.ts"))["operationsOf"];
  parsePlan: (typeof import("../../shared/domain/plan.ts"))["parsePlan"];
  tagOf: (typeof import("../../shared/domain/plan.ts"))["tagOf"];
  NotValidatable: (typeof import("./validate.ts"))["NotValidatable"];
  validateChange: (typeof import("./validate.ts"))["validateChange"];
};
