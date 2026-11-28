import { NotValidatable } from "../exceptions/work-order.exceptions.ts";
import type { Plan } from "../schemas/plan-document.schema.ts";
import type { Consolidated } from "./standing-records.service.ts";

export type Change = {
  name: string;
  dir: string;
  schema?: string;
  created?: string;
  noBehaviour: boolean;
  plan?: string;
  deltaSpecs: string[];
  product?: string;
  linked: string[];
};

export type Finding = {
  rule: string;
  message: string;
  block?: string;
  tag?: string;
};

export type Candidate = {
  change: Change;
  plan: Plan;
  consolidated: Consolidated;
  workstreams: string[];
  spike?: string;
  judged: Judged;
};

export type JudgementRequest = { block: string; state: string; instructions: string };

export type Judged = { configured: boolean; answers: Map<string, number | { error: string }> };

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

export type Building = {
  name: string;
  plan: Plan;
  schema: string;
  builds: boolean;
  product?: string;
};

export class WorkOrderAssessmentService {
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

  knownSchema(change: Change, schemas: string[]): string {
    if (change.schema && schemas.includes(change.schema)) return change.schema;

    throw new NotValidatable(
      `the change ${change.name} was made with the schema ${change.schema ?? "(none)"}, which this package does not define; schemas: ${schemas.join(", ")}`,
    );
  }

  planFindings(change: Change): Finding[] {
    return change.plan === undefined ? [{ rule: "has-a-plan", message: "the change has no plan.md: every change has a plan" }] : [];
  }

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
