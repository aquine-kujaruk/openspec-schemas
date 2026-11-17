/** Who raises feedback about a change. */
export declare const SOURCES: readonly [
  "the person",
  "the completion gate",
  "the verify phase",
  "the archive",
  "the implement phase",
];
/** Feedback a phase or a guard raised and the feedback phase has not taken in yet. */
export type Raised = {
  source: string;
  names: string;
  findings: string[];
};
/** Feedback as it is taken in: what it says, the phase it invalidates, and what only the person can decide. */
export type Taken = {
  source: string;
  says: string;
  phase?: number;
  questions?: string[];
};
export declare const raised: (root: string, change: string) => Raised[];
/** Records feedback about `change` for the feedback phase to take in. */
export declare const raise: (
  root: string,
  change: string,
  feedback: Raised,
) => void;
/**
 * Takes feedback into the plan of `change`: one entry under Feedback, the tasks of the phase it
 * names and of every later phase unchecked, and one open question per decision only the person can
 * take. What was raised from that source is settled, and the change is back with the agent.
 */
export declare const takeIn: (
  root: string,
  change: string,
  feedback: Taken,
) => void;
/**
 * `factory feedback <change>` lists what was raised about the change and is not taken in yet.
 * `factory feedback <change> raise --from <source> --names <what> --says <text>` raises feedback.
 * `factory feedback <change> take --from <source> --says <text> [--phase <n>] [--ask <question>]…`
 * takes it into the plan.
 */
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type FeedbackPorts = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
  activeChanges: (typeof import("../../shared/domain/change.ts"))["activeChanges"];
  CHANGES: (typeof import("../../shared/domain/change.ts"))["CHANGES"];
  GATE: (typeof import("../../shared/domain/change.ts"))["GATE"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
};
