/** What the step adapters share to set a project up. Nothing the command runs imports this. */
export declare const write: (root: string, path: string, text: string) => void;
/**
 * What a scratch project's `factory.config.ts` says: this repository defines more than one schema
 * that builds product code, so a project names the one its tools are composed from. The scratch
 * projects of the tests build a backend.
 */
export declare const ONE_SCHEMA =
  'export default { schema: "clean-backend" };\n';
/** A scratch project in a fresh temporary folder, its tools composed from `clean-backend`. */
export declare const scratchProject: (prefix: string) => string;
/** A delta spec the specification tool accepts: one new use case, `useCase`, with one scenario. */
export declare const delta: (useCase?: string) => string;
/** A durable block of a plan: its heading, its tags (`@by:agent` unless they say who took it) and a body of the given paragraphs. */
export declare const block: (
  kind: "Decision" | "Procedure",
  slug: string,
  tags: string[],
  body?: string,
) => string;
/** What a plan is made of, beyond its headings. A phase is `true` when its tasks are done. */
export type PlanParts = {
  decisions?: string[];
  procedures?: string[];
  phases?: boolean[];
  feedback?: string[];
  questions?: string[];
  /** The tasks name no workstream: the plan of a schema that has none. */
  bare?: boolean;
  /** The day the person approved the plan; `null` when it is not approved. */
  approved?: string | null;
};
export declare const planText: (name: string, parts?: PlanParts) => string;
/**
 * Writes a change of `schema` that validation reports ready unless `parts` say otherwise. Without
 * `deltas` it is marked as changing no behaviour.
 */
export declare const change: (
  root: string,
  name: string,
  {
    parts,
    deltas,
    created,
    schema,
    product,
  }?: {
    parts?: PlanParts;
    deltas?: Record<string, string>;
    created?: string;
    schema?: string;
    /** The product it builds, in a project that declares products. */
    product?: string;
  },
) => void;
/** A ready change with one phase, started by the implement phase unless its tasks are `done`: it is in implementation. */
export declare const readyChange: (
  root: string,
  name: string,
  {
    done,
    schema,
    product,
  }?: {
    done?: boolean;
    schema?: string;
    product?: string;
  },
) => void;
/**
 * The products a scenario names, as `factory.config.ts` declares them: each item is
 * `<name>[ at <root>][ with[ the schema] <schema>]`, its folder `apps/<name>` and its schema
 * `clean-backend` when it says nothing else.
 */
export declare const productsOf: (text: string) => Record<
  string,
  {
    root: string;
    schema: string;
  }
>;
/** Declares the products `text` names in the project at `root` (see `productsOf`). */
export declare const declareProducts: (root: string, text: string) => void;
