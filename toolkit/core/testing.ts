import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** What the step adapters share to set a project up. Nothing the command runs imports this. */
export const write = (root: string, path: string, text: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

/**
 * What a scratch project's `factory.config.ts` says: this repository defines more than one schema
 * that builds product code, so a project names the one its tools are composed from. The scratch
 * projects of the tests build a backend.
 */
export const ONE_SCHEMA = 'export default { schema: "clean-backend" };\n';

/** A scratch project in a fresh temporary folder, its tools composed from `clean-backend`. */
export const scratchProject = (prefix: string): string => {
  const root = mkdtempSync(join(tmpdir(), prefix));
  write(root, "factory.config.ts", ONE_SCHEMA);
  return root;
};

/** A delta spec the specification tool accepts: one new use case, `useCase`, with one scenario. */
export const delta = (useCase = "get-order") => `## Purpose

Getting one order by its identifier, so that whoever serves a customer sees what it holds (${useCase}).

## ADDED Requirements

### Requirement: An order is found by its identifier

The system SHALL return the order that carries the given identifier.

#### Scenario Outline: looking for \`<id>\` finds \`<found>\`

- **GIVEN** an order \`<id>\` <!-- orderExists -->
- **WHEN** the order \`<id>\` is looked for <!-- getOrder -->
- **THEN** the order \`<found>\` is found <!-- orderFound -->

##### Examples:

  | id | found |
  | -- | ----- |
  | A1 | A1    |
`;

/** A durable block of a plan: its heading, its tags and a body of the given paragraphs. */
export const block = (
  kind: "Decision" | "Procedure",
  slug: string,
  tags: string[],
  body = "The system SHALL keep this rule.\n\n**Why** It was agreed.",
) => `### ${kind}: ${slug} · A standing rule\n\n${tags.join(" ")}\n\n${body}`;

/** What a plan is made of, beyond its headings. A phase is `true` when its tasks are done. */
export type PlanParts = {
  decisions?: string[];
  procedures?: string[];
  phases?: boolean[];
  feedback?: string[];
  questions?: string[];
  /** The tasks name no workstream: the plan of a schema that has none. */
  bare?: boolean;
};

export const planText = (name: string, parts: PlanParts = {}): string =>
  [
    `# ${name}`,
    "## Goal\n\nOrders can be listed.",
    "## Decisions",
    ["## Open questions", ...(parts.questions ?? []).map((q) => `- ${q}`)].join("\n\n"),
    ["## Architecture decisions", ...(parts.decisions ?? [])].join("\n\n"),
    ["## Procedures", ...(parts.procedures ?? [])].join("\n\n"),
    "## Phases",
    ...(parts.phases ?? [false]).map((done, i) =>
      [
        `### Phase ${i + 1}: Step ${i + 1} works`,
        `- [${done ? "x" : " "}] ${parts.bare ? "" : "app-domain: "}build step ${i + 1}\n- [${done ? "x" : " "}] ${parts.bare ? "" : "modules: "}verify the phase`,
      ].join("\n\n"),
    ),
    ["## Feedback", (parts.feedback ?? []).map((f) => `- ${f}`).join("\n")].join("\n\n"),
    "## Next step",
  ].join("\n\n");

/**
 * Writes a change of `schema` that validation reports ready unless `parts` say otherwise. Without
 * `deltas` it is marked as changing no behaviour.
 */
export const change = (
  root: string,
  name: string,
  {
    parts = {},
    deltas = { "orders/get-order": delta() },
    created = "2026-11-13",
    schema = "clean-backend",
    product,
  }: {
    parts?: PlanParts;
    deltas?: Record<string, string>;
    created?: string;
    schema?: string;
    /** The product it builds, in a project that declares products. */
    product?: string;
  } = {},
): void => {
  const folder = `openspec/changes/${name}`;
  const marked = Object.keys(deltas).length ? "" : "skip_specs: true\n";
  const builds = product ? `x-product: ${product}\n` : "";
  write(root, `${folder}/.openspec.yaml`, `schema: ${schema}\ncreated: ${created}\n${marked}${builds}`);
  for (const [spec, text] of Object.entries(deltas)) write(root, `${folder}/specs/${spec}/spec.md`, text);
  write(root, `${folder}/plan.md`, planText(name, { bare: schema !== "clean-backend", ...parts }));
};

/** A ready change with one phase, started by the implement phase unless its tasks are `done`: it is in implementation. */
export const readyChange = (
  root: string,
  name: string,
  { done = false, schema = "clean-backend", product }: { done?: boolean; schema?: string; product?: string } = {},
): void => {
  change(root, name, { parts: { phases: [done] }, schema, product });
  if (!done)
    write(
      root,
      `openspec/changes/${name}/gate.json`,
      JSON.stringify({
        phase: "Phase 1: Step 1 works",
        failures: 0,
        waitingFor: "the agent",
        findings: [],
      }),
    );
};

/**
 * The products a scenario names, as `factory.config.ts` declares them: each item is
 * `<name>[ at <root>][ with[ the schema] <schema>]`, its folder `apps/<name>` and its schema
 * `clean-backend` when it says nothing else.
 */
export const productsOf = (text: string): Record<string, { root: string; schema: string }> =>
  Object.fromEntries(
    text.split(",").map((item) => {
      const m = /^(\S+)(?: at (\S+))?(?: with (?:the schema )?(\S+))?$/.exec(item.trim());
      if (!m) throw new Error(`not a product: ${item}`);
      return [m[1]!, { root: m[2] ?? `apps/${m[1]}`, schema: m[3] ?? "clean-backend" }];
    }),
  );

/** Declares the products `text` names in the project at `root` (see `productsOf`). */
export const declareProducts = (root: string, text: string): void =>
  write(root, "factory.config.ts", `export default ${JSON.stringify({ products: productsOf(text) })};\n`);
