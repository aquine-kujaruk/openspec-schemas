import type { Findings } from "./sample-findings.adapter.ts";
/**
 * The recorded findings of one layer (the `expect` blocks of `<layer>.examples.md`), read once,
 * and the comparison a scenario's outcome step makes: the case must be recorded, what the tools
 * report now must equal the record, and a case that is not `todo.` must break its rule in at least
 * one file.
 */
export declare const expectations: (path: string) => {
  check: (name: string, rule: string, reported: Findings) => void;
};

/** Collaborators supplied by the composition root. */
export type ExpectationsPorts = {
  parseExampleFile: (typeof import("./sample-file-contract.adapter.ts"))["parseExampleFile"];
  findingLines: (typeof import("./sample-expected-contract.adapter.ts"))["findingLines"];
};
