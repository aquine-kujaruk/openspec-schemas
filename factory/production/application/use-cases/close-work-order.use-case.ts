import { parsePlan } from "../../domain/schemas/plan-document.schema.ts";
import { StandingRecordsService } from "../../domain/services/standing-records.service.ts";
import type { ClosingRepositoryInterface } from "../repository-interfaces/closing.repository-interface.ts";

type Closed = { change: string; place: "archived" | "still active"; as?: string; reason?: string };

const TAG_RULES = new Set(["operation-tag-holds", "operation-records-base", "one-operation-tag"]);

export class CloseWorkOrderUseCase {
  private readonly orders: ClosingRepositoryInterface;
  private readonly standing = new StandingRecordsService();

  constructor(orders: ClosingRepositoryInterface) {
    this.orders = orders;
  }

  async execute(name?: string, { date = this.orders.today() }: {date?: string} = {}): Promise<Closed[]> {
    const active = await this.orders.listOrders();

    const names = name ? [name] : [...active]
      .sort((a, b) => a.created.localeCompare(b.created) || a.name.localeCompare(b.name))
      .map((order) => order.name);

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
    const certificate = await this.orders.findCertificate(name);
    if (!certificate) return stays("it has no evidence: verify it first");
    if (certificate.verdict !== "verified") return stays("its evidence reports it not verified");

    if (certificate.digest !== await this.orders.currentDigest(name))
      return stays("the change or the product changed since it was verified: verify it again");

    const findings = await this.orders.validateWorkOrder(name);
    const stale = findings.filter(({rule, block}) => block && TAG_RULES.has(rule));

    for (const {block, message} of stale)
      await this.orders.recordFinding(name, block!, message);

    if (stale.length)
      return stays(`a tag of its plan no longer holds: ${stale.map(({block}) => block).join(", ")}`);

    if (findings.length)
      return stays(findings[0]!.rule === "not-validatable" ? findings[0]!.message : `validation reports it not ready: ${findings[0]!.message}`);

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
