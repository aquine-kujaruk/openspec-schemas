import type { SchemaVariant, Vetoed } from "factory/sdk";
import { artifacts, defaults, planInstruction } from "../spec-plan/schema.ts";

const delivery: Vetoed = {
  packages: ["express", "fastify", "koa", "hono", "@nestjs/common", "@nestjs/core"],
  patterns: ["express/*", "fastify/*", "koa/*", "hono/*", "@nestjs/*"],
};

const PHASES = `A phase is a part of the change worth having on its own. It declares its seams (the public signatures its workstreams build against, as code), its tests, and its tasks. Only tasks are checkboxes, each one \`<workstream>: <task>\`, and the last task of a phase verifies it. A change that builds nothing has no phase.`;

/**
 * Clean Architecture for a backend: the clean core and an optional delivery layer, the controllers. A project changes the
 * defaults in its root \`factory.config.ts\`: a value it sets replaces the default, a section merges
 * key by key. Nothing here names a product.
 */
export default {
  name: "clean-backend",
  extends: "spec-plan",
  description:
    "Clean Architecture for a backend: delta specs per use case and one plan that carries the decisions, the procedures and the tasks. Use it for a change to the behaviour or the code of the product",
  artifacts: artifacts(
    planInstruction(PHASES),
    "Goal, decisions, tagged architecture decisions and procedures, and phases with seams, tests and tasks",
  ),
  core: "clean-core",
  workstreams: ["controllers"],
  defaults: {
    ...defaults,
    frameworks: { core: delivery, infrastructure: delivery },
    workstreams: {
      controllers: { dependsOn: [] },
    },
  },
} satisfies SchemaVariant;
