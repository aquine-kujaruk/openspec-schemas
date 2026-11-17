import { type Building } from "../../flow/domain/validate.ts";
/** How many failed attempts in a row hand a change to the person. */
export declare const ATTEMPTS = 3;
/** Where a change stands with the gate: how often finishing failed in a row, and who it waits for. */
export type GateRecord = {
  /** The phase the implement phase started. */
  phase?: string;
  failures: number;
  waitingFor: "the agent" | "the person";
  findings: string[];
};
export type Verdict = {
  allowed: boolean;
  findings: string[];
};
export type GateOptions = {
  /** The agent finishing is a helper of the one that builds: its passing ends nothing. */
  helper?: boolean;
  /** The findings of the checks of the phase `change` is building; the real checks by default. */
  checks?: (root: string, change: Building) => Promise<string[]>;
  /** Runs one of the command's own checks; the real command by default. */
  run?: Runner;
};
type Runner = (
  root: string,
  args: string[],
) => {
  status: number | null;
  output: string;
};
export declare const readGate: (root: string, change: string) => GateRecord;
/**
 * The parts of the harness that differ from what was installed or generated, each as a finding that
 * names its part.
 */
export declare const alteredHarness: (root: string) => string[];
/**
 * The checks of the phase a change is building, which is the one the implement phase started: the
 * rules of the workstreams its tasks name, with those upstream of them, and the product tests those
 * workstreams are proved by. The workstreams are those of the change's own schema, so a change
 * whose schema has none is checked by nothing here; in a project with products, they run over the
 * change's own product only.
 */
export declare const phaseChecks: (
  root: string,
  change: Building,
  run?: Runner,
) => Promise<string[]>;
/**
 * Judges an agent's attempt to finish in the project at `root`. With no change in implementation it
 * holds nobody. Otherwise the harness must be as installed and generated and the checks of the phase
 * must pass; a failure sends the agent back, and the third in a row lets it finish with the change
 * recorded as waiting for the person.
 */
export declare const gate: (
  root: string,
  { run, checks, helper }?: GateOptions,
) => Promise<Verdict>;
/**
 * `factory gate [--helper]`: judges an agent's attempt to finish, read from the hook's input. Exit
 * status 2 with the findings on standard error sends the agent back; 0 lets it finish.
 */
export declare const run: (args: string[]) => Promise<number>;
export {};

/** Collaborators supplied by the composition root. */
export type GatePorts = {
  environment: () => NodeJS.ProcessEnv;
  workingDirectory: () => string;
  createHash: (typeof import("node:crypto"))["createHash"];
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
  parse: (typeof import("yaml"))["parse"];
  CHANGES: (typeof import("../../shared/domain/change.ts"))["CHANGES"];
  GATE: (typeof import("../../shared/domain/change.ts"))["GATE"];
  PLACES: (typeof import("./doctor.ts"))["PLACES"];
  readInstalled: (typeof import("./doctor.ts"))["readInstalled"];
  schemaLinkHolds: (typeof import("./doctor.ts"))["schemaLinkHolds"];
  unwiredGuards: (typeof import("./doctor.ts"))["unwiredGuards"];
  hookInput: (typeof import("./guard.ts"))["hookInput"];
  projectOf: (typeof import("./guard.ts"))["projectOf"];
  capture: (typeof import("../../shared/domain/paths.ts"))["capture"];
  self: (typeof import("../../shared/domain/paths.ts"))["self"];
  loadSchema: (typeof import("../../repository/domain/schema.ts"))["loadSchema"];
  productOf: (typeof import("../../repository/domain/products.ts"))["productOf"];
  changesInImplementation: (typeof import("../../flow/domain/validate.ts"))["changesInImplementation"];
};
