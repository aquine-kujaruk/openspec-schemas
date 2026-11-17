import type { Findings } from "./sample-findings.adapter.ts";
/** Files of one case or of a reference section: repository path → content. */
export type Files = Map<string, string>;
/** A case: its files, and the findings its `expect` block records (`undefined` without one). */
export type Case = {
  files: Files;
  expected: Findings | undefined;
};
/**
 * A `<layer>.examples.md`: its `## reference` files, its `## scaffolds` (destination pattern →
 * template, the pattern naming `<module>` and `<name>` where they vary) and, per `## <rule>`, its
 * `### <case>` cases.
 */
export type ExampleFile = {
  reference: Files;
  scaffolds: Files;
  rules: Map<string, Map<string, Case>>;
};
/** Findings to record, per `## <rule>`, per `### <case>`. */
export type Recorded = Map<string, Map<string, Findings>>;
/** Reads an example file from its text; `name` only labels errors. */
export declare const parseExampleText: (
  text: string,
  name: string,
) => ExampleFile;
export declare const parseExampleFile: (path: string) => ExampleFile;
/**
 * Writes the recorded findings into an example file's text: the lines between a case's `expect`
 * fences are replaced, and a case without a block gets a blank line and one after its last
 * non-blank line. Every other line is kept as is; a text that does not parse throws.
 */
export declare const recordFindings: (
  text: string,
  name: string,
  recorded: Recorded,
) => string;

/** Collaborators supplied by the composition root. */
export type ExampleFilePorts = {
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  findingLines: (typeof import("./sample-expected-contract.adapter.ts"))["findingLines"];
  parseFindingLines: (typeof import("./sample-expected-contract.adapter.ts"))["parseFindingLines"];
};
