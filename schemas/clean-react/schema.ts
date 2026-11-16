import type { SchemaVariant, Vetoed } from "../../toolkit/core/types.ts";
import { web } from "../../toolkit/core/platform.ts";
import { artifacts, defaults, planInstruction } from "../spec-plan/schema.ts";

const REACT = ["react", "react-dom", "react-router-dom", "@tanstack/react-query", "zustand"];

/** The core imports no React; infrastructure neither, except `zustand/vanilla`: a session adapter is an adapter without React. */
const core: Vetoed = { packages: REACT, patterns: ["react/*", "react-dom/*", "zustand/*", "@tanstack/*"] };
const infrastructure: Vetoed = {
  packages: REACT,
  patterns: ["react/*", "react-dom/*", "zustand/react*", "@tanstack/*"],
};

const PHASES = `A phase is a part of the change worth having on its own. It declares its seams (the public signatures its workstreams build against, as code; the controller each page destructures is one), its tests, and its tasks. Only tasks are checkboxes, each one \`<workstream>: <task>\`, and the last task of a phase verifies it. A change that builds nothing has no phase.`;

/**
 * A React frontend on the clean core: the core's workstreams, then the JSX (react-ui) and the
 * framework without it (react-hooks), the glue between what is shown and the API behind the core.
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
  workstreams: ["react-ui", "react-hooks"],
  // The plan builds react-ui as the spike, against the stub controllers it writes.
  spike: { workstream: "react-ui", fakes: (o) => [`${o.modules}/framework/controllers/*.controller.ts`] },
  defaults: {
    ...defaults,
    platform: web,
    entry: ["src/*.tsx", "src/*.ts"],
    frameworks: { core, infrastructure },
    allowUnmatched: [...defaults.allowUnmatched, "index.html"],
    // react-ui runs beside the core's map workstreams; react-hooks replaces its stub controllers.
    // Nothing joins the two sides: verify proves they work together.
    workstreams: {
      "react-ui": { dependsOn: [] },
      "react-hooks": { dependsOn: ["react-ui"] },
    },
  },
} satisfies SchemaVariant;
