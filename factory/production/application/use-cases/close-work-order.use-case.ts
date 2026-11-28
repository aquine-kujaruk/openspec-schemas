import { parsePlan } from "../../domain/schemas/plan-document.schema.ts";
import { StandingRecordsService } from "../../domain/services/standing-records.service.ts";
import { WorkOrderClosingService } from "../../domain/services/work-order-closing.service.ts";
import type { ClosingRepositoryInterface } from "../repository-interfaces/closing.repository-interface.ts";

type Closed = { change: string; place: "archived" | "still active"; as?: string; reason?: string };

export class CloseWorkOrderUseCase {
  private readonly orders: ClosingRepositoryInterface;
  private readonly standing = new StandingRecordsService();
  private readonly closing = new WorkOrderClosingService();

  constructor(orders: ClosingRepositoryInterface) {
    this.orders = orders;
  }

  async execute(name?: string, { date = this.orders.today() }: {date?: string} = {}): Promise<Closed[]> {
    const active = await this.orders.listOrders();

    const names = name ? [name] : this.closing.closingOrder(active);

    const result: Closed[] = [];

    for (const change of names) {
      const order = (await this.orders.listOrders()).find((candidate) => candidate.name === change);

      result.push(order
        ? await this.closeOne(order, date)
        : { change, place: "still active", reason: "no active change has that name" });
    }

    if (result.some(({place}) => place === "archived")) await this.orders.makeGauges();

    return result;
  }

  private async closeOne(order: {name: string; product?: string}, date: string): Promise<Closed> {
    const { name, product } = order;
    const stays = (reason: string): Closed => ({ change: name, place: "still active", reason });
    const unverified = await this.closing.certificateHold(await this.orders.findCertificate(name), () => this.orders.currentDigest(name));
    if (unverified) return stays(unverified);

    const findings = await this.orders.validateWorkOrder(name);
    for (const { block, message } of this.closing.staleTags(findings)) await this.orders.recordFinding(name, block, message);

    const unready = this.closing.validationHold(findings);
    if (unready) return stays(unready);

    const plan = parsePlan(await this.orders.readPlan(name));
    const origin = `${date}-${name}`;
    const {decisions, procedures} = await this.orders.listStanding();
    const read = (path: string) => this.orders.readStandingFile(path);

    const changes = [
      ...await this.standing.revise(plan.decisions, "Decision", origin, decisions, read, product),
      ...await this.standing.revise(plan.procedures, "Procedure", origin, procedures, read),
    ];

    const archived = await this.orders.closeArchive(name, origin, changes);

    return archived.success
      ? { change: name, place: "archived", as: origin }
      : stays(`the specification tool did not archive it:\n${archived.output}`);
  }
}
