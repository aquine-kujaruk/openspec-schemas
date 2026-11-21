import type { SchemaVariant, Vetoed } from "factory/sdk";
import { web } from "factory/sdk";
import { artifacts, defaults, planInstruction } from "../spec-plan/schema.ts";

const REACT = ["react", "react-dom", "react-router-dom", "@tanstack/react-query", "zustand"];

/** The core imports no React; infrastructure neither, except `zustand/vanilla`: a session adapter is an adapter without React. */
const core: Vetoed = { packages: REACT, patterns: ["react/*", "react-dom/*", "zustand/*", "@tanstack/*"] };
const infrastructure: Vetoed = {
  packages: REACT,
  patterns: ["react/*", "react-dom/*", "zustand/react*", "@tanstack/*"],
};

const PHASES = `A phase is a part of the change worth having on its own. It declares its seams (the public signatures its workstreams build against, as code), its tests, and its tasks. A phase that replaces the stub controllers signs, as seams, the use cases and the adapter instances the real controllers compose, and lists the react task after the core's; the controller a page destructures is never a seam, since react writes both sides of it. Only tasks are checkboxes, each one \`<workstream>: <task>\`, and the last task of a phase verifies it. A change that builds nothing has no phase.`;

/**
 * A React frontend on the clean core: the core's workstreams, then one framework workstream
 * (react) that builds the screens against stub controllers and later replaces them with the
 * real ones, the glue between what is shown and the API behind the core.
 * A project changes the defaults in its root \`factory.config.ts\`. Nothing here names a product.
 */
export default {
  name: "clean-react",
  extends: "spec-plan",
  description:
    "A React frontend on Clean Architecture: delta specs per use case and one plan that carries the decisions, the procedures and the tasks. Use it for a change to the behaviour or the code of a web application",
  artifacts: artifacts(
    planInstruction(PHASES),
    "Goal, decisions, tagged architecture decisions and procedures, and phases with seams, tests and tasks",
  ),
  core: "clean-core",
  workstreams: ["react"],
  // react builds the approved spikes first, against the stub controllers it writes.
  spike: { workstream: "react" },
  defaults: {
    ...defaults,
    platform: web,
    entry: ["src/*.tsx", "src/*.ts"],
    frameworks: { core, infrastructure },
    allowUnmatched: [...defaults.allowUnmatched, "index.html"],
    // react runs beside the core's map workstreams and replaces its stubs over the core's seams.
    // Nothing joins the two sides: verify proves they work together.
    workstreams: {
      react: { dependsOn: [] },
    },
  },
} satisfies SchemaVariant;
