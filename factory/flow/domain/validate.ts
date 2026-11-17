import { type Plan } from "../../shared/domain/plan.ts";
import type { Finding } from "../../repository/domain/validation.ts";
export type Verdict = {
  change: string;
  schema: string;
  ready: boolean;
  findings: Finding[];
};
/** A change that cannot be judged: it does not exist, or no schema of this package made it. */
export declare class NotValidatable extends Error {}
/**
 * Whether the change `name` of the project at `root` is ready, by the validator of the schema it
 * was made with. A change with no plan is not ready and nothing else is said about it.
 */
export declare const validateChange: (
  root: string,
  name: string,
) => Promise<Verdict>;
/**
 * A change in implementation, with the schema it was made with, whether that schema builds product
 * code, and the product it builds in a project that declares products.
 */
export type Building = {
  name: string;
  plan: Plan;
  schema: string;
  builds: boolean;
  product?: string;
};
/** The changes in implementation: those the implement phase started and whose plan is still ready. */
export declare const changesInImplementation: (
  root: string,
) => Promise<Building[]>;
/**
 * `factory validate <change>`: says whether the change is ready and, when it is not, every reason.
 * Exit status 0 when ready, 1 when not ready, 2 when the change cannot be judged.
 */
export declare const validate: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type ValidatePorts = {
  activeChanges: (typeof import("../../shared/domain/change.ts"))["activeChanges"];
  isStarted: (typeof import("../../shared/domain/change.ts"))["isStarted"];
  readArchivedChange: (typeof import("../../shared/domain/change.ts"))["readArchivedChange"];
  readChange: (typeof import("../../shared/domain/change.ts"))["readChange"];
  readConsolidated: (typeof import("../../shared/domain/consolidated.ts"))["readConsolidated"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  parsePlan: (typeof import("../../shared/domain/plan.ts"))["parsePlan"];
  loadSchema: (typeof import("../../repository/domain/schema.ts"))["loadSchema"];
  schemaNames: (typeof import("../../repository/domain/schema.ts"))["schemaNames"];
  readProjectConfig: (typeof import("../../repository/domain/products.ts"))["readProjectConfig"];
};
