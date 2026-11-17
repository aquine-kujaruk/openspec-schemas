import type { Change } from "./change.ts";
import type { Consolidated } from "./consolidated.ts";
import type { Plan } from "./plan.ts";

/** One reason a change is not ready, by the rule that found it; `block` and `tag` name what it is about. */
export type Finding = { rule: string; message: string; block?: string; tag?: string };

/** What a validator judges: the change as it is on disk, its plan read, and what it is checked against. */
export type Candidate = {
  change: Change;
  plan: Plan;
  consolidated: Consolidated;
  /** The workstreams of the change's schema. */
  workstreams: string[];
  /** The workstream that builds the change's approved spikes first, when its schema has one. */
  spike?: string;
};

/** What "ready" means for the schemas that pick this validator: no finding. */
export type Validator = { ready: (candidate: Candidate) => Finding[] };
