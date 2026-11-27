import type { Plan } from "../schemas/plan-document.schema.ts";
import type { Consolidated } from "./standing-records.service.ts";

/** A change as it is on disk. */
export type Change = {
  name: string;
  dir: string;
  /** The schema the change was made with, as the specification tool recorded it. */
  schema?: string;
  /** The day it was created, as the specification tool recorded it. */
  created?: string;
  /** The change is marked as changing no behaviour a user notices. */
  noBehaviour: boolean;
  /** The text of its plan, when it has one. */
  plan?: string;
  /** Its delta specs, relative to `dir`. */
  deltaSpecs: string[];
  /** The product it builds, in a project that declares products (`x-product`). */
  product?: string;
  /** The other changes of its intention (`x-linked`). */
  linked: string[];
};

/** One reason a change is not ready, by the rule that found it; `block` and `tag` name what it is about. */
export type Finding = {
  rule: string;
  message: string;
  block?: string;
  tag?: string;
};

/** What a validator judges: the change as it is on disk, its plan read, and what it is checked against. */
export type Candidate = {
  change: Change;
  plan: Plan;
  consolidated: Consolidated;
  /** The workstreams of the change's schema. */
  workstreams: string[];
  /** The workstream that builds the change's approved spikes first, when its schema has one. */
  spike?: string;
  /** What the decision model answered to the validator's questions. */
  judged: Judged;
};

/** A question to the decision model about one block. */
export type JudgementRequest = { block: string; state: string; instructions: string };

/** By block, the probability the decision model gave, or why it could not be asked. */
export type Judged = { configured: boolean; answers: Map<string, number | { error: string }> };

/** What "ready" means for the schemas that pick this validator: no finding. */
export type Validator = {
  ready: (candidate: Candidate) => Finding[];
  judgements?: (candidate: Omit<Candidate, "judged">) => JudgementRequest[];
};

export type Verdict = {
  change: string;
  schema: string;
  ready: boolean;
  findings: Finding[];
};

/**
 * A change in implementation, with the schema it was made with, whether that schema builds product
 * code, and the product it builds in a project that declares products.
 */
export type Building = {
  name: string;
  plan: Plan;
  schema: string;
  builds: boolean;
  product?: string;
};

export class WorkOrderAssessmentService {
  /**
   * In a project that declares products: the change names one of them (`x-product`), made with the
   * schema that product is declared with.
   */
  productFindings(change: Change, products: Record<string, { schema: string }>): Finding[] {
    const names = Object.keys(products);
    if (!names.length) return [];
    const rule = "names-a-product";
    if (!change.product)
      return [
        {
          rule,
          message: `the project declares the products ${names.join(", ")}: write the one this change builds as \`x-product\` in its .openspec.yaml`,
        },
      ];
    const product = products[change.product];
    if (!product)
      return [
        {
          rule,
          message: `the change names the product ${change.product}, which the project does not declare; products: ${names.join(", ")}`,
        },
      ];
    if (product.schema !== change.schema)
      return [
        {
          rule,
          message: `the product ${change.product} is built with the schema ${product.schema}, and this change was made with ${change.schema}: open the change with the product's schema, or name a product of ${change.schema}`,
        },
      ];
    return [];
  }

  /** Every change this one links (`x-linked`) exists, active or archived, and links it back. */
  linkFindings(change: Change, lookup: (name: string) => Change | undefined): Finding[] {
    return change.linked.flatMap((name) => {
      const other = lookup(name);
      if (!other)
        return [
          {
            rule: "links-hold",
            message: `the change links ${name}, which is no change of this project, active or archived`,
          },
        ];
      if (!other.linked.includes(change.name))
        return [
          {
            rule: "links-hold",
            message: `the change links ${name}, which does not link it back: add ${change.name} to \`x-linked\` in ${name}'s .openspec.yaml`,
          },
        ];
      return [];
    });
  }
}
