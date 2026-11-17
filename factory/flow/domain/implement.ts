export type Started =
  | {
      state: "started";
      phase: string;
      tasks: string[];
    }
  | {
      state: "not ready" | "cannot start";
      findings: string[];
    }
  | {
      state: "nothing to build";
    };
/**
 * Starts the implementation of the change `name`: only when validation reports it ready, on the
 * first phase of its plan that has an unchecked task. The roots are prepared and the tests
 * generated from its delta specs; from then on the change is in implementation.
 */
export declare const start: (root: string, name: string) => Promise<Started>;
/**
 * `factory implement <change>`: starts building the next phase of a ready change. Exit status 0
 * when it is started or has nothing left to build, 1 when it cannot be started, 2 when the change
 * cannot be judged.
 */
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type ImplementPorts = {
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
  activeChanges: (typeof import("../../shared/domain/change.ts"))["activeChanges"];
  CHANGES: (typeof import("../../shared/domain/change.ts"))["CHANGES"];
  GATE: (typeof import("../../shared/domain/change.ts"))["GATE"];
  readChange: (typeof import("../../shared/domain/change.ts"))["readChange"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  self: (typeof import("../../shared/domain/paths.ts"))["self"];
  parsePlan: (typeof import("../../shared/domain/plan.ts"))["parsePlan"];
  loadSchema: (typeof import("../../repository/domain/schema.ts"))["loadSchema"];
  NotValidatable: (typeof import("./validate.ts"))["NotValidatable"];
  validateChange: (typeof import("./validate.ts"))["validateChange"];
};
