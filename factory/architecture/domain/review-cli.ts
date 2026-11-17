import { type DecisionClient } from "./review-client.ts";
import { loadEnv } from "../../shared/domain/env.ts";
/**
 * `factory review`: the fourth tool. Runs after the deterministic ones (they spend no tokens), is
 * never part of `factory check`, and exits 0 whatever it finds: its output is advice with a
 * probability. Exit 2 when the key variable is not set, 3 when the model cannot be reached.
 */
export type MainOptions = {
  root: string;
  env: Record<string, string | undefined>;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  /** The rubric files, asked in order; by default, those of the schema the project's tools are composed from. */
  rubric?: string | string[];
  /** Builds the client from the key; the real one by default. */
  client?: (key: string) => DecisionClient;
};
export declare const main: (o: MainOptions) => Promise<number>;
export declare const run: () => Promise<number>;
export { loadEnv };

/** Collaborators supplied by the composition root. */
export type ReviewCliPorts = {
  environment: () => NodeJS.ProcessEnv;
  capture: (typeof import("../../shared/domain/paths.ts"))["capture"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  architecture: (typeof import("./project.ts"))["architecture"];
  RUBRICS: (typeof import("./project.ts"))["RUBRICS"];
  openAiClient: (typeof import("./review-client.ts"))["openAiClient"];
  loadEnv: (typeof import("../../shared/domain/env.ts"))["loadEnv"];
  readRecord: (typeof import("./review-record.ts"))["readRecord"];
  writeRecord: (typeof import("./review-record.ts"))["writeRecord"];
  DEFAULTS: (typeof import("./review-review.ts"))["DEFAULTS"];
  review: (typeof import("./review-review.ts"))["review"];
  readRubric: (typeof import("./review-rubric.ts"))["readRubric"];
};
