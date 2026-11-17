import type { Findings } from "./findings.ts";
export declare const NO_FINDINGS = "(no findings)";
/**
 * The lines of a case's `expect` block: one per finding, `- <path> (<tool>[, <tool>])`, sorted,
 * tools in the order the engine runs them; `(no findings)` when there is none.
 */
export declare const findingLines: (findings: Findings) => string[];
/**
 * Reads the lines of one `expect` block. `name` and `first` (the line number, in that file, of the
 * line after the opening fence) only label errors. Any other line, a repeated path or an empty block throws.
 */
export declare const parseFindingLines: (
  lines: string[],
  name: string,
  first: number,
) => Findings;

/** Collaborators supplied by the composition root. */
export type ExpectFilePorts = {};
