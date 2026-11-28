import type { Findings } from "./sample-findings.adapter.ts";
export declare const NO_FINDINGS = "(no findings)";
export declare const findingLines: (findings: Findings) => string[];

export declare const parseFindingLines: (
  lines: string[],
  name: string,
  first: number,
) => Findings;
