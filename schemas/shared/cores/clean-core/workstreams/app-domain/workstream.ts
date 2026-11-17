import type { WorkstreamDeclaration } from "factory/sdk";
import { acceptance } from "./acceptance.rules.ts";
import { application } from "./application.rules.ts";
import { unit } from "./unit.rules.ts";
import { domain } from "./domain.rules.ts";

/** Acceptance and unit tests, application and domain; repositories are faked. */
export default {
  layers: (o) => [acceptance(o), domain(o), application(o), unit(o)],
  tests: ["acceptance", "unit"],
} satisfies WorkstreamDeclaration;
