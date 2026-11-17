import { NotValidatable } from "../../domain/exceptions/work-order.exceptions.ts";
import { parsePlan } from "../../domain/schemas/plan-document.schema.ts";
import { WorkOrderAssessmentService, type Building, type Verdict } from "../../domain/services/work-order-assessment.service.ts";
import type { WorkOrderAssessmentRepositoryInterface } from "../repository-interfaces/work-order-assessment.repository-interface.ts";

export class AssessWorkOrderUseCase {
  private readonly policy = new WorkOrderAssessmentService();
  private readonly records: WorkOrderAssessmentRepositoryInterface;

  constructor(records: WorkOrderAssessmentRepositoryInterface) {
    this.records = records;
  }

  /**
   * Whether the change `name` of the project at `root` is ready, by the validator of the schema it
   * was made with. A change with no plan is not ready and nothing else is said about it.
   */
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
        : schema.validator.ready({
            change,
            plan: parsePlan(change.plan),
            consolidated: this.records.listStanding(root),
            workstreams: schema.workstreams,
            spike: schema.spike,
          });
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

  /** The changes in implementation: those the implement phase started and whose plan is still ready. */
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
