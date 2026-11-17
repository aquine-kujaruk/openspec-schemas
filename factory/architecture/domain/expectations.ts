import type { Findings } from "./findings.ts";
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
  deepStrictEqual: (typeof import("node:assert"))["deepStrictEqual"];
  parseExampleFile: (typeof import("./example-file.ts"))["parseExampleFile"];
  findingLines: (typeof import("./expect-file.ts"))["findingLines"];
};
