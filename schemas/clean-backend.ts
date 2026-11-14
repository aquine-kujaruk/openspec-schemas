import { DEFAULTS as review } from "../review/defaults.ts";
import { node } from "../toolkit/platform.ts";
import type { SchemaDefinition, Vetoed } from "../toolkit/types.ts";

const delivery: Vetoed = {
  packages: ["express", "fastify", "koa", "hono", "@nestjs/common", "@nestjs/core"],
  patterns: ["express/*", "fastify/*", "koa/*", "hono/*", "@nestjs/*"],
};

const plan = `
Write the plan from your own decisions before asking the person anything, then update it once per answer. Keep every section of the template, in order; a section with nothing to say keeps its heading.

Write each decision where its scope sends it:

- A user of the product notices it: a delta spec.
- A future change must respect it: an architecture decision.
- It says how the system is set up, reached, diagnosed or operated: a procedure.
- It matters only to this change: one line under Decisions, naming the alternative you discarded.
- It would hold in any project: leave it out of the change and report it as a proposal for the schema's repository.

Architecture decisions and procedures are durable: archiving copies them to \`openspec/adr\` and \`openspec/runbooks\`. Read both trees before writing one, and tag each block, on the line under its heading, with what this change does to them:

- \`@adds\` for a block no tree has.
- \`@modifies:<slug>\`, \`@replaces:<slug>\`, \`@renames:<slug>\` or \`@removes:<slug>\` for a block a tree has, with \`@base:<origin>\` copied from the \`@origin\` of that block.
- A decision also carries \`@area:product\` or \`@area:production\`, \`@topic\`, \`@applies\` (the layers it binds) and \`@enforced\` (the rule, check or review that holds it).
- A procedure also carries \`@purpose\` (\`setup\`, \`access\`, \`diagnose\` or \`operate\`), \`@topic\` and \`@env\` (the environments it runs in). It names where each secret is kept; the secret itself stays out of the plan.

A phase is a part of the change worth having on its own. It declares its seams (the public signatures its workstreams build against, as code), its tests, and its tasks. Only tasks are checkboxes, each one \`<workstream>: <task>\`, and the last task of a phase verifies it. A change that builds nothing has no phase.

A change that changes no behaviour a user notices has no delta spec and says so with \`skip_specs: true\` in its \`.openspec.yaml\`.

The plan is done when \`pnpm exec factory validate <change>\` reports the change ready.
`;

const specs = `
Write one delta spec per use case the change touches, at \`specs/<module>/<use-case>/spec.md\`: what the software does for whoever uses it, in the vocabulary of that use case. Libraries, frameworks and language constructs belong to the plan.

Every requirement states its rule with SHALL or MUST and proves it with Scenario Outlines: bold GIVEN, WHEN and THEN steps over the placeholders of an Examples table of concrete rows. Each step ends with one HTML comment naming its step adapter method; within a spec, one name keeps one role and one set of placeholders. The tests are generated from these specs, so a behaviour with no row has no test.
`;

const apply = `
Build through the implement phase: one run builds the first phase of the plan that has unchecked tasks, ticks each task as it is done, and stops when that phase's verification task passes. A decision the plan does not settle goes back as feedback on the change.
`;

/**
 * Clean Architecture for a backend: the core, its infrastructure and its adapters, with no delivery
 * layer. A project changes the defaults in its root \`factory.config.ts\`: a value it sets replaces
 * the default, a section merges key by key. Nothing here names a product.
 */
export default {
  name: "clean-backend",
  description:
    "Clean Architecture for a backend: delta specs per use case and one plan that carries the decisions, the procedures and the tasks",
  artifacts: [
    {
      id: "plan",
      generates: "plan.md",
      description:
        "Goal, decisions, tagged architecture decisions and procedures, and phases with seams, tests and tasks",
      template: "plan.md",
      instruction: plan,
      requires: [],
      decides: true,
    },
    {
      id: "specs",
      generates: "specs/**/*.md",
      description: "The behaviour a user notices, one delta spec per use case",
      template: "spec.md",
      instruction: specs,
      requires: [],
    },
  ],
  apply: { requires: ["plan"], tracks: "plan.md", instruction: apply },
  workstreams: ["app-domain", "infrastructure", "adapters", "clean-architecture", "integrate"],
  validator: "standard",
  questions: "ask-on-commitment",
  defaults: {
    platform: node,
    modules: "src/*",
    acceptance: "test/acceptance",
    productSpecs: "openspec/specs/*/*/spec.md",
    integration: "test/integration",
    entry: ["src/*.ts"],
    frameworks: { core: delivery, infrastructure: delivery },
    schemaPackage: "zod",
    review,
    ignore: [],
    allowUnmatched: ["*.config.*", "test/e2e/**", "test/*.ts", "test/**/*.md"],
    // Map-reduce: the map workstreams in parallel, two reduce workstreams that integrate them.
    workstreams: {
      "app-domain": { dependsOn: [] },
      infrastructure: { dependsOn: [] },
      adapters: { dependsOn: [] },
      "clean-architecture": { dependsOn: ["app-domain", "infrastructure", "adapters"] },
      integrate: { dependsOn: ["clean-architecture"] },
    },
  },
} satisfies SchemaDefinition;
