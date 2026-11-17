import type { WorkOrderValidationRepositoryInterface } from "../../../../factory/production/application/repository-interfaces/work-order-validation.repository-interface.ts";

export class InMemoryWorkOrderValidationRepository implements WorkOrderValidationRepositoryInterface {
  private read: (name: string) => Promise<string | null> = async () => null;

  seed(read: (name: string) => Promise<string | null>): void {
    this.read = read;
  }

  readPlan(name: string): Promise<string | null> {
    return this.read(name);
  }

  async listFindings(): Promise<{ rule: string; message: string }[]> {
    return [];
  }
}
