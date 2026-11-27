import { DEFAULTS as review } from "factory/sdk";
import { node } from "factory/sdk";
import type {
  ArtifactDefinition,
  FactoryConfig,
  SchemaDefinition,
  Vetoed,
} from "factory/sdk";

/** What a plan says about its phases when its tasks name no workstream. */
const PHASES = `A phase is a part of the change worth having on its own. It declares its tests and its tasks. Only tasks are checkboxes, and the last task of a phase verifies it. A change that builds nothing has no phase.`;

/** The instruction of the plan, around the paragraph on phases a schema writes for itself. */
export const planInstruction = (phases = PHASES): string => `
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
- An access procedure also carries \`@probed\`: the date its probe answered while planning, or \`declined\` when the person chose not to configure it. When it reads environment variables, it lists them under \`@keys\` (\`@keys:INVOICES_API_KEY\`), so that setup can say when one is missing.

Every decision says who took it, \`@by:person\` or \`@by:agent\`: at the end of each line under Decisions, on the tag line of each architecture decision, procedure and screen, and, in a delta spec, as a backticked line (\`\` \`@by:person\` \`\`) that is the first line of each requirement's text. A decision the person took, by answering an open question or by asking for it, is \`@by:person\`; one you took alone is \`@by:agent\`.

The last open question is always the person's approval of the plan, with a link to \`plan.md\`, to each delta spec and to each spike, so the person reads the artifacts and not a summary. When the person approves, record \`approved_at: <YYYY-MM-DD>\` in the plan's front matter and remove the question, unless an answer given with the approval picked another option than the plan proposed: then update the artifacts and ask for the approval again. Validation reports the change not ready until the plan records it.

Before approval, exercise each unproven tool assumption that could block starting, closing or verifying a phase. Reuse representative results. Record the command, relevant input and observed result. When a probe must wait, record why and the earliest phase that can run it. For each affected spec, name the evidence and any personal attestation needed at verification.

What the probes observed (what a log says, what is deployed, what the repository holds) goes under Findings, one fact per line with its source and the date it was seen.

When the schema has a spike workstream, each screen the change adds or changes is a block under Screens: \`### Screen: <slug> · <title>\`, tagged \`@approved\` (the date it was approved, or \`declined\` when the person chose not to see it), \`@page\` (the page the implementation will build) and \`@spike\` (its spike, a throwaway HTML file under the change's \`spikes/\` folder), followed by the journeys through it, one numbered list of plain-language steps each. A screen is a visual decision: the agent approves one a convention or a standing screen settles, and says so under Decisions; the person approves the others, as open questions, with the spike open. Validation reports the change not ready while a screen lacks \`@approved\` or names no spike the change holds, or while the plan has tasks of the spike workstream and lists no screen.

${phases}

A change that changes no behaviour a user notices has no delta spec and says so with \`skip_specs: true\` in its \`.openspec.yaml\`.

The plan is done when \`pnpm exec factory validate <change>\` reports the change ready.
`;

const specs = `
Write one delta spec per use case the change touches, at \`specs/<module>/<use-case>/spec.md\`: what the software does for whoever uses it, in the vocabulary of that use case. Libraries, frameworks and language constructs belong to the plan.

The first line of each requirement's text says who decided it, backticked: \`\` \`@by:person\` \`\` or \`\` \`@by:agent\` \`\`.

Every requirement states its rule with SHALL or MUST and proves it with Scenario Outlines: bold GIVEN, WHEN and THEN steps over the placeholders of an Examples table of concrete rows. Each step ends with one HTML comment naming its step adapter method; within a spec, one name keeps one role and one set of placeholders. The tests are generated from these specs, so a behaviour with no row has no test.
`;

const apply = `
Build through the implement phase, once the person approved the plan: one run builds every phase of the plan that has unchecked tasks, in order, ticks each task as it is done, closes each phase with its verification task, and verifies the change once no task is left. A decision the plan does not settle goes back as feedback on the change.
`;

/** The two artifacts of a change: its plan, written with `instruction`, and its delta specs. */
export const artifacts = (instruction: string, planDescription: string): ArtifactDefinition[] => [
  {
    id: "plan",
    generates: "plan.md",
    description: planDescription,
    template: "plan.md",
    instruction,
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
];

const nothing: Vetoed = { packages: [], patterns: [] };

/** Where a project keeps its code, tests and specs when it says nothing else. No workstream waits for another. */
export const defaults: FactoryConfig = {
  platform: node,
  modules: "src/*",
  acceptance: "test/acceptance",
  productSpecs: "openspec/specs/*/*/spec.md",
  integration: "test/integration",
  unit: "test/unit",
  e2e: "test/e2e",
  entry: ["src/*.ts"],
  frameworks: { core: nothing, infrastructure: nothing },
  schemaPackage: "zod",
  review,
  ignore: [],
  allowUnmatched: ["*.config.*", "test/e2e/**", "test/*.ts", "test/**/*.md", "openspec/**"],
  workstreams: {},
};

/**
 * A plan and delta specs, with no architecture: the change says what it decides, how the system is
 * operated and what it builds, and nothing checks where the code lands. The schemas that build a
 * product extend it.
 */
export default {
  name: "spec-plan",
  description:
    "A plan and delta specs with no architecture. Use it for a change no other schema of the project covers: a procedure, a decision, tooling, documents",
  artifacts: artifacts(
    planInstruction(),
    "Goal, decisions, tagged architecture decisions and procedures, and phases with tests and tasks",
  ),
  apply: { requires: ["plan"], tracks: "plan.md", instruction: apply },
  workstreams: [],
  validator: "standard",
  questions: "ask-on-commitment",
  defaults,
} satisfies SchemaDefinition;
