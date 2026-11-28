import type { Findings } from "./sample-findings.adapter.ts";
export type Files = Map<string, string>;

export type Case = {
  files: Files;
  expected: Findings | undefined;
  expectedVerdict?: RubricVerdict;
};

export type RubricVerdict = "yes" | "no";

export type ExampleFile = {
  reference: Files;
  scaffolds: Files;
  rules: Map<string, Map<string, Case>>;
  rubric: Map<string, Map<string, Case>>;
};

export type Recorded = Map<string, Map<string, Findings>>;

export declare const parseExampleText: (
  text: string,
  name: string,
) => ExampleFile;

export declare const parseExampleFile: (path: string) => ExampleFile;

export declare const recordFindings: (
  text: string,
  name: string,
  recorded: Recorded,
) => string;

export type ExampleFilePorts = {
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  findingLines: (typeof import("./sample-expected-contract.adapter.ts"))["findingLines"];
  parseFindingLines: (typeof import("./sample-expected-contract.adapter.ts"))["parseFindingLines"];
};
