import type { Findings } from "./sample-findings.adapter.ts";

export declare const expectations: (path: string) => {
  check: (name: string, rule: string, reported: Findings) => void;
};

export type ExpectationsPorts = {
  parseExampleFile: (typeof import("./sample-file-contract.adapter.ts"))["parseExampleFile"];
  findingLines: (typeof import("./sample-expected-contract.adapter.ts"))["findingLines"];
};
