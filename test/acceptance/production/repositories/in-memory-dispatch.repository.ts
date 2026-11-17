import type { DispatchRepositoryInterface } from "../../../../factory/production/application/repository-interfaces/dispatch.repository-interface.ts";

type Runner = Awaited<ReturnType<DispatchRepositoryInterface["getRunner"]>>;
type Readiness = Awaited<ReturnType<DispatchRepositoryInterface["validateWorkOrder"]>>;

export class InMemoryDispatchRepository implements DispatchRepositoryInterface {
  private readonly workOrders = new Map<string, Readiness>();
  private runner: Runner = "session";
  private exitStatus: number | null = 0;
  readonly commands: string[] = [];

  seed(name: string, verdict: Readiness): void {
    this.workOrders.set(name, verdict);
  }

  configureRunner(runner: Runner, exitStatus: number | null = 0): void {
    this.runner = runner;
    this.exitStatus = exitStatus;
  }

  async validateWorkOrder(name: string): Promise<Readiness> {
    return this.workOrders.get(name) ?? {
      ready: false,
      findings: [{ rule: "work-order-exists", message: `No work order ${name}` }],
    };
  }

  async getRunner(): Promise<Runner> {
    return this.runner;
  }

  async runCommand(command: string): Promise<number | null> {
    this.commands.push(command);
    return this.exitStatus;
  }
}
