import type { WorkstreamDeclaration } from "../../../../../../toolkit/core/types.ts";
import { acceptance } from "./acceptance.rules.ts";
import { application } from "./application.rules.ts";
import { domain } from "./domain.rules.ts";

/** Acceptance tests, application and domain; repositories are faked. */
export default {
  layers: (o) => [acceptance(o), domain(o), application(o)],
  tests: ["acceptance"],
} satisfies WorkstreamDeclaration;
