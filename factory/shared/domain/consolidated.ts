export declare const DECISIONS = "openspec/adr";
export declare const PROCEDURES = "openspec/runbooks";
/** A consolidated block: where it lives and the change that last wrote it. */
export type Standing = {
  file: string;
  origin?: string;
  keys?: string[];
  body: string;
};
/** The consolidated decisions and procedures, by slug. A slug is unique within its tree. */
export type Consolidated = {
  decisions: Map<string, Standing>;
  procedures: Map<string, Standing>;
};
export declare const readConsolidated: (root: string) => Consolidated;

/** Collaborators supplied by the composition root. */
export type ConsolidatedPorts = {
  globSync: (typeof import("node:fs"))["globSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  join: (typeof import("node:path"))["join"];
  tagsOf: (typeof import("./plan.ts"))["tagsOf"];
};
