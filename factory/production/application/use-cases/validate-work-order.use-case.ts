import { parsePlan } from "../../domain/schemas/plan-document.schema.ts";
import type { WorkOrderValidationRepositoryInterface } from "../repository-interfaces/work-order-validation.repository-interface.ts";

export class ValidateWorkOrderUseCase {
  private readonly records: WorkOrderValidationRepositoryInterface;

  constructor(records: WorkOrderValidationRepositoryInterface) {
    this.records = records;
  }

  async execute(name: string): Promise<{ ready: boolean; findings: { rule: string; message: string }[] }> {
    const document = await this.records.readPlan(name);
    const findings = [...await this.records.listFindings(name)];

    if (document !== null) {
      const plan = parsePlan(document);

      if (!plan.approvedAt && !findings.some(({ rule }) => rule === "plan-approved"))
        findings.push({ rule: "plan-approved", message: "the person has not approved the plan" });

      if (plan.openQuestions.length && !findings.some(({ rule }) => rule.includes("question")))
        findings.push({ rule: "no-open-questions", message: "the plan lists open questions" });
    }

    return { ready: findings.length === 0, findings };
  }
}
