import { type Layout } from "../../repository/domain/generated.ts";
import {
  type E2eResult,
  type Evidence,
  type ScenarioResult,
} from "./evidence.ts";
/** The environments a procedure is executed in while verifying; in any other it is only reviewed. */
export declare const SAFE: string[];
type Failing = Evidence["failing"];
export type VerifyOptions = {
  env?: Record<string, string | undefined>;
  /** The result of each scenario of the change; by default, its generated acceptance tests are run. */
  scenarios?: (root: string, specs: string[]) => Promise<ScenarioResult[]>;
  /** The workstreams whose check or tests fail; by default, the real checks. */
  checks?: (root: string) => Promise<Failing>;
  /** What each failing whole-product check printed; by default, `factory check --whole`. */
  whole?: (root: string) => Promise<string[]>;
  /** The result of each end-to-end test of a web product; by default, `factory test e2e`. */
  e2e?: (root: string) => Promise<E2eResult[]>;
  /** The warnings of the rubric review, given its key; by default, the real review. */
  review?: (root: string, key: string) => Promise<string[]>;
  /** How each procedure went where it was executed, by `<slug>@<environment>`. */
  procedures?: Record<string, "passed" | "failed">;
  /** The specs the person states are proved. It counts only for a spec no test is generated from. */
  proved?: string[];
  /** Where generated tests are written; the layout of the project at `root` by default. */
  layout?: Layout;
  /** Runs the generated tests `files` and reports each; the project's own test runner by default. */
  tests?: (root: string, files: string[]) => Promise<TestReport["testResults"]>;
};
type TestReport = {
  testResults: Array<{
    name: string;
    assertionResults: Array<{
      ancestorTitles: string[];
      title: string;
      status: string;
    }>;
  }>;
};
/**
 * Verifies the change `name` of the project at `root` and writes its evidence: every scenario
 * matched to its test, every check, the review when its key is configured, and each procedure in
 * the environments where executing it is safe. What fails is raised as feedback; nothing is fixed.
 */
export declare const verify: (
  root: string,
  name: string,
  options?: VerifyOptions,
) => Promise<Evidence>;
/**
 * `factory verify <change> [--procedure <slug>@<environment>=<passed|failed>]… [--proved <spec>]…`:
 * verifies the change and writes its evidence. `--proved` is the person's word for a spec no test
 * is generated from, which only the repository the command is developed in has. Exit status 0 when it is verified, 1 when it is not, 2 when the
 * change does not exist.
 */
export declare const run: (args: string[]) => Promise<number>;
export {};

/** Collaborators supplied by the composition root. */
export type VerifyPorts = {
  environment: () => NodeJS.ProcessEnv;
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  join: (typeof import("node:path"))["join"];
  matchesGlob: (typeof import("node:path"))["matchesGlob"];
  layoutOf: (typeof import("../../repository/domain/generated.ts"))["layoutOf"];
  testOf: (typeof import("../../repository/domain/generated.ts"))["testOf"];
  loadEnv: (typeof import("../../shared/domain/env.ts"))["loadEnv"];
  activeChanges: (typeof import("../../shared/domain/change.ts"))["activeChanges"];
  readChange: (typeof import("../../shared/domain/change.ts"))["readChange"];
  digestOf: (typeof import("./evidence.ts"))["digestOf"];
  writeEvidence: (typeof import("./evidence.ts"))["writeEvidence"];
  raise: (typeof import("./feedback.ts"))["raise"];
  cacheDir: (typeof import("../../shared/domain/paths.ts"))["cacheDir"];
  capture: (typeof import("../../shared/domain/paths.ts"))["capture"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  self: (typeof import("../../shared/domain/paths.ts"))["self"];
  parsePlan: (typeof import("../../shared/domain/plan.ts"))["parsePlan"];
  tagOf: (typeof import("../../shared/domain/plan.ts"))["tagOf"];
  loadSchema: (typeof import("../../repository/domain/schema.ts"))["loadSchema"];
  schemaNames: (typeof import("../../repository/domain/schema.ts"))["schemaNames"];
  productOf: (typeof import("../../repository/domain/products.ts"))["productOf"];
};
