import { activeChanges, type Change, isStarted, readArchivedChange, readChange } from "./change.ts";
import { readConsolidated } from "./consolidated.ts";
import { PROJECT_ROOT } from "../core/paths.ts";
import { parsePlan, type Plan } from "./plan.ts";
import { loadSchema, schemaNames } from "../repository/schema.ts";
import { readProjectConfig } from "../repository/products.ts";
import type { Finding } from "./validation.ts";

export type Verdict = { change: string; schema: string; ready: boolean; findings: Finding[] };

/** A change that cannot be judged: it does not exist, or no schema of this package made it. */
export class NotValidatable extends Error {}

/**
 * Whether the change `name` of the project at `root` is ready, by the validator of the schema it
 * was made with. A change with no plan is not ready and nothing else is said about it.
 */
export const validateChange = async (root: string, name: string): Promise<Verdict> => {
  const change = readChange(root, name);
  if (!change)
    throw new NotValidatable(
      `no active change is called ${name}; changes: ${activeChanges(root).join(", ") || "none"}`,
    );
  if (!change.schema || !schemaNames().includes(change.schema))
    throw new NotValidatable(
      `the change ${name} was made with the schema ${change.schema ?? "(none)"}, which this package does not define; schemas: ${schemaNames().join(", ")}`,
    );
  const schema = await loadSchema(change.schema);
  const findings =
    change.plan === undefined
      ? [{ rule: "has-a-plan", message: "the change has no plan.md: every change has a plan" }]
      : schema.validator.ready({
          change,
          plan: parsePlan(change.plan),
          consolidated: readConsolidated(root),
          workstreams: schema.definition.workstreams,
          spike: schema.definition.spike?.workstream,
        });
  findings.push(...(await productFindings(root, change)), ...linkFindings(root, change));
  return { change: name, schema: change.schema, ready: findings.length === 0, findings };
};

/**
 * In a project that declares products: the change names one of them (`x-product`), made with the
 * schema that product is declared with.
 */
const productFindings = async (root: string, change: Change): Promise<Finding[]> => {
  const products = (await readProjectConfig(root))?.products ?? {};
  const names = Object.keys(products);
  if (!names.length) return [];
  const rule = "names-a-product";
  if (!change.product)
    return [{ rule, message: `the project declares the products ${names.join(", ")}: write the one this change builds as \`x-product\` in its .openspec.yaml` }];
  const product = products[change.product];
  if (!product)
    return [{ rule, message: `the change names the product ${change.product}, which the project does not declare; products: ${names.join(", ")}` }];
  if (product.schema !== change.schema)
    return [{ rule, message: `the product ${change.product} is built with the schema ${product.schema}, and this change was made with ${change.schema}: open the change with the product's schema, or name a product of ${change.schema}` }];
  return [];
};

/** Every change this one links (`x-linked`) exists, active or archived, and links it back. */
const linkFindings = (root: string, change: Change): Finding[] =>
  change.linked.flatMap((name) => {
    const other = readChange(root, name) ?? readArchivedChange(root, name);
    if (!other)
      return [{ rule: "links-hold", message: `the change links ${name}, which is no change of this project, active or archived` }];
    if (!other.linked.includes(change.name))
      return [{ rule: "links-hold", message: `the change links ${name}, which does not link it back: add ${change.name} to \`x-linked\` in ${name}'s .openspec.yaml` }];
    return [];
  });

/**
 * A change in implementation, with the schema it was made with, whether that schema builds product
 * code, and the product it builds in a project that declares products.
 */
export type Building = { name: string; plan: Plan; schema: string; builds: boolean; product?: string };

/** The changes in implementation: those the implement phase started and whose plan is still ready. */
export const changesInImplementation = async (root: string): Promise<Building[]> => {
  const found: Building[] = [];
  for (const name of activeChanges(root)) {
    const text = readChange(root, name)?.plan;
    if (text === undefined || !isStarted(root, name)) continue;
    try {
      const verdict = await validateChange(root, name);
      if (verdict.ready)
        found.push({
          name,
          plan: parsePlan(text),
          schema: verdict.schema,
          builds: (await loadSchema(verdict.schema)).definition.workstreams.length > 0,
          product: readChange(root, name)?.product,
        });
    } catch (e) {
      if (!(e instanceof NotValidatable)) throw e;
    }
  }
  return found;
};

/**
 * `factory validate <change>`: says whether the change is ready and, when it is not, every reason.
 * Exit status 0 when ready, 1 when not ready, 2 when the change cannot be judged.
 */
export const validate = async (args: string[]): Promise<number> => {
  const [name] = args;
  if (!name) {
    console.error(
      `Name the change to validate. Changes: ${activeChanges(PROJECT_ROOT).join(", ") || "none"}`,
    );
    return 2;
  }
  try {
    const verdict = await validateChange(PROJECT_ROOT, name);
    console.log(`${verdict.ready ? "ready" : "not ready"}: ${name} (${verdict.schema})`);
    for (const f of verdict.findings) console.log(`- [${f.rule}] ${f.message}`);
    return verdict.ready ? 0 : 1;
  } catch (e) {
    if (!(e instanceof NotValidatable)) throw e;
    console.error(e.message);
    return 2;
  }
};
