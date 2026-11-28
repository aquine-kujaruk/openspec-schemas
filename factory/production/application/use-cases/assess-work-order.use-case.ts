import { NotValidatable } from "../../domain/exceptions/work-order.exceptions.ts";
import { parsePlan } from "../../domain/schemas/plan-document.schema.ts";
import { WorkOrderAssessmentService, type Building, type Change, type Judged, type JudgementRequest, type Verdict } from "../../domain/services/work-order-assessment.service.ts";
import type { WorkOrderAssessmentRepositoryInterface } from "../repository-interfaces/work-order-assessment.repository-interface.ts";

export class AssessWorkOrderUseCase {
  private readonly policy = new WorkOrderAssessmentService();
  private readonly records: WorkOrderAssessmentRepositoryInterface;

  constructor(records: WorkOrderAssessmentRepositoryInterface) {
    this.records = records;
  }

  async execute(root: string, name: string): Promise<Verdict> {
    const change = this.records.findWorkOrder(root, name);

    if (!change)
      throw new NotValidatable(
        `no active change is called ${name}; changes: ${this.records.listWorkOrders(root).join(", ") || "none"}`,
      );

    if (!change.schema || !this.records.listProcesses().includes(change.schema))
      throw new NotValidatable(
        `the change ${name} was made with the schema ${change.schema ?? "(none)"}, which this package does not define; schemas: ${this.records.listProcesses().join(", ")}`,
      );

    const schema = await this.records.loadProcess(change.schema);

    const findings =
      change.plan === undefined
        ? [
            {
              rule: "has-a-plan",
              message: "the change has no plan.md: every change has a plan",
            },
          ]
        : await this.judgeAndValidate(root, change, change.plan, schema);

    findings.push(
      ...this.policy.productFindings(change, await this.records.listProducts(root)),
      ...this.policy.linkFindings(change, (name) => this.records.findWorkOrder(root, name) ?? this.records.findArchivedWorkOrder(root, name)),
    );

    return {
      change: name,
      schema: change.schema,
      ready: findings.length === 0,
      findings,
    };
  }

  private async judgeAndValidate(root: string, change: Change, plan: string, schema: Awaited<ReturnType<WorkOrderAssessmentRepositoryInterface["loadProcess"]>>) {
    const candidate = {
      change,
      plan: parsePlan(plan),
      consolidated: this.records.listStanding(root),
      workstreams: schema.workstreams,
      spike: schema.spike,
    };

    const judged = await this.judge(root, change, schema.validator.judgements?.(candidate) ?? []);

    return schema.validator.ready({ ...candidate, judged });
  }

  private async judge(root: string, change: Change, requests: JudgementRequest[]): Promise<Judged> {
    const answers: Judged["answers"] = new Map();
    if (!requests.length) return { configured: false, answers };
    const judge = await this.records.findJudge(root, change.product);
    if (!judge) return { configured: false, answers };

    for (const request of requests) {
      const recorded = this.records.findJudgement(root, change.name, judge.model, request);

      if (recorded !== undefined) {
        answers.set(request.block, recorded);
        continue;
      }

      try {
        const probability = await judge.ask(request);
        this.records.recordJudgement(root, change.name, judge.model, request, probability);
        answers.set(request.block, probability);
      } catch (e) {
        answers.set(request.block, { error: e instanceof Error ? e.message : String(e) });
      }
    }

    return { configured: true, answers };
  }

  async changesInImplementation(root: string): Promise<Building[]> {
    const found: Building[] = [];

    for (const name of this.records.listWorkOrders(root)) {
      const order = this.records.findWorkOrder(root, name);
      const text = order?.plan;
      if (text === undefined || !this.records.isWorkOrderStarted(root, name)) continue;

      try {
        const verdict = await this.execute(root, name);

        if (verdict.ready)
          found.push({
            name,
            plan: parsePlan(text),
            schema: verdict.schema,
            builds:
              (await this.records.loadProcess(verdict.schema)).workstreams.length >
              0,
            product: order?.product,
          });
      } catch (e) {
        if (!(e instanceof NotValidatable)) throw e;
      }
    }

    return found;
  }
}
