export declare const EVIDENCE = "evidence.md";
export type ScenarioResult = {
  /** The use case, as `<module>/<use-case>`. */
  spec: string;
  requirement: string;
  scenario: string;
  result: "passed" | "failed" | "missing";
  /** Who says so, when no test does: a spec no test is generated from, proved by the person's word. */
  by?: "the person";
};
/** One end-to-end test of a web product, as verify ran it. */
export type E2eResult = {
  test: string;
  result: "passed" | "failed";
  output?: string;
};
/** What verifying a change found, and the state of the project it was found in. */
export type Evidence = {
  change: string;
  verdict: "verified" | "not verified";
  /** What the change and the product were when it was verified: evidence of any other state proves nothing. */
  digest: string;
  scenarios: ScenarioResult[];
  /** The workstreams whose check or tests fail, with what they printed. */
  failing: Array<{
    workstream: string;
    output: string;
  }>;
  review: {
    state: "run" | "skipped";
    warnings: string[];
    note?: string;
  };
  procedures: Array<{
    slug: string;
    env: string;
    treatment: "executed" | "reviewed only" | "not executed" | "declined";
    outcome?: "passed" | "failed";
  }>;
  /** The end-to-end tests of a web product; none for another platform. */
  e2e?: E2eResult[];
};
/** A digest of the change's plan and delta specs and of every file under the roots of its product. */
export declare const digestOf: (
  root: string,
  change: string,
) => Promise<string>;
export declare const writeEvidence: (root: string, evidence: Evidence) => void;
/** What the evidence of `change` says, when it has one. */
export declare const readEvidence: (
  root: string,
  change: string,
) => Pick<Evidence, "verdict" | "digest"> | undefined;

/** Collaborators supplied by the composition root. */
export type EvidencePorts = {
  createHash: (typeof import("node:crypto"))["createHash"];
  existsSync: (typeof import("node:fs"))["existsSync"];
  globSync: (typeof import("node:fs"))["globSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
  parse: (typeof import("yaml"))["parse"];
  stringify: (typeof import("yaml"))["stringify"];
  CHANGES: (typeof import("../../shared/domain/change.ts"))["CHANGES"];
  readChange: (typeof import("../../shared/domain/change.ts"))["readChange"];
  productRoots: (typeof import("../../repository/domain/products.ts"))["productRoots"];
  productOf: (typeof import("../../repository/domain/products.ts"))["productOf"];
};
