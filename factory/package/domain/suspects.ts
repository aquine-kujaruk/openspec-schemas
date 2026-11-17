import type { Standing } from "../../shared/domain/consolidated.ts";
/** What a runbook's command needs from the project for it to still run. */
export type Need =
  | {
      kind: "script";
      name: string;
    }
  | {
      kind: "binary";
      name: string;
    }
  | {
      kind: "file";
      path: string;
    };
/** A command a runbook runs, as written, with what it needs from the project. */
export type Run = {
  command: string;
  need: Need;
};
/** The code of a procedure's body: each line of its fenced blocks and each inline code span. */
export declare const codeOf: (body: string) => string[];
/** The commands a procedure's body runs that doctor can judge. */
export declare const runsOf: (body: string) => Run[];
/** What the project has where a runbook may look: the scripts, binaries and files of its roots. */
export type Holdings = {
  scripts: Set<string>;
  binaries: (name: string) => boolean;
  file: (path: string) => boolean;
};
/** The holdings of the repository at `root` and of every product folder in `roots`. */
export declare const holdingsOf: (root: string, roots: string[]) => Holdings;
/** One line per command of a consolidated procedure that runs what the project no longer has. */
export declare const suspectsOf: (
  procedures: Map<string, Standing>,
  has: Holdings,
) => string[];

/** Collaborators supplied by the composition root. */
export type SuspectsPorts = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  join: (typeof import("node:path"))["join"];
};
