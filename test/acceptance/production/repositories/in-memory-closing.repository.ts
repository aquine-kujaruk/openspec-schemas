import type { ClosingRepositoryInterface } from "../../../../factory/production/application/repository-interfaces/closing.repository-interface.ts";

type Order = Awaited<ReturnType<ClosingRepositoryInterface["listOrders"]>>[number];
type Certificate = NonNullable<Awaited<ReturnType<ClosingRepositoryInterface["findCertificate"]>>>;
type Finding = Awaited<ReturnType<ClosingRepositoryInterface["validateWorkOrder"]>>[number];
type Standing = Awaited<ReturnType<ClosingRepositoryInterface["listStanding"]>>;
type StandingChange = Parameters<ClosingRepositoryInterface["closeArchive"]>[2][number];
export type ClosingOrderFixture = Order & {
  plan: string;
  verdict?: string;
  findings: Finding[];
  drawings: Record<string, string>;
};

export class InMemoryClosingRepository implements ClosingRepositoryInterface {
  private readonly orders = new Map<string, ClosingOrderFixture>();
  private readonly standingFiles = new Map<string, string>();
  private readonly closedOrders = new Map<string, string>();
  private readonly drawings = new Map<string, string>();
  private readonly gauges = new Map<string, string>();
  readonly recordedFindings: Array<{ name: string; block: string; message: string }> = [];

  seed(workOrders: ClosingOrderFixture[]): void {
    for (const order of workOrders) this.orders.set(order.name, order);
  }

  seedStanding(path: string, text: string): void {
    this.standingFiles.set(path, text);
  }

  async listOrders(): Promise<Order[]> {
    return [...this.orders.values()].reverse().map(({ name, created, product }) => ({
      name, created, product,
    }));
  }

  async findCertificate(name: string): Promise<Certificate | null> {
    const verdict = this.orders.get(name)?.verdict;
    return verdict === undefined ? null : { verdict, digest: await this.currentDigest(name) };
  }

  async currentDigest(name: string): Promise<string> {
    return this.orders.get(name)?.plan ?? "";
  }

  async validateWorkOrder(name: string): Promise<Finding[]> {
    return this.orders.get(name)?.findings ?? [];
  }

  async readPlan(name: string): Promise<string> {
    return this.orders.get(name)?.plan ?? "";
  }

  async listStanding(): Promise<Standing> {
    const decisions: Standing["decisions"] = new Map();
    const procedures: Standing["procedures"] = new Map();
    for (const [file, content] of this.standingFiles) {
      for (const match of content.matchAll(/^### (Decision|Procedure): (\S+)/gm)) {
        const output = match[1] === "Decision" ? decisions : procedures;
        output.set(match[2]!, { file });
      }
    }
    return { decisions, procedures };
  }

  async readStandingFile(path: string): Promise<string | null> {
    return this.standingFiles.get(path) ?? null;
  }

  async recordFinding(name: string, block: string, message: string): Promise<void> {
    this.recordedFindings.push({ name, block, message });
  }

  async closeArchive(
    name: string, origin: string, changes: StandingChange[],
  ): Promise<{ success: boolean; output: string }> {
    const order = this.orders.get(name);
    if (!order) return { success: false, output: `Unknown work order ${name}` };
    for (const { path, after } of changes) {
      if (after === null) this.standingFiles.delete(path);
      else this.standingFiles.set(path, after);
    }
    this.closedOrders.set(origin, order.plan);
    for (const [path, text] of Object.entries(order.drawings)) this.drawings.set(path, text);
    this.orders.delete(name);
    return { success: true, output: "" };
  }

  async makeGauges(): Promise<void> {
    for (const [path, revision] of this.drawings) this.gauges.set(path, revision);
  }

  today(): string {
    return "2026-11-17";
  }

  readClosedPlan(origin: string): string | undefined {
    return this.closedOrders.get(origin);
  }

  readDrawing(path: string): string | undefined {
    return this.drawings.get(path);
  }

  drawingCount(): number {
    return this.drawings.size;
  }

  gaugeCount(): number {
    return this.gauges.size;
  }

  staleGaugeCount(): number {
    return [...this.drawings].filter(([path, revision]) => this.gauges.get(path) !== revision).length;
  }
}
