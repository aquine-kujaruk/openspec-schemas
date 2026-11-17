import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { WorkOrderAcl, WorkOrderRecord } from "../acl/work-order.acl.ts";

export class WorkOrderAdapter implements WorkOrderAcl {
  private readonly directory: string;
  private readonly inventory: WorkOrderAcl["listOrders"];
  private readonly read: WorkOrderAcl["readOrder"];

  constructor(directory: string, inventory: WorkOrderAcl["listOrders"], read: WorkOrderAcl["readOrder"]) {
    this.directory = directory;
    this.inventory = inventory;
    this.read = read;
  }

  listOrders() { return this.inventory(); }
  readOrder(name: string): Promise<WorkOrderRecord | null> { return this.read(name); }

  async writeRelease(name: string, day: string | undefined): Promise<void> {
    const file = join(this.directory, name, "plan.md");
    const text = readFileSync(file, "utf8");
    const updated = text.replace(/^---\r?\n([\s\S]*?)^---\s*$/m, (_, front: string) => {
      const body = front.replace(/^approved_at:[^\r\n]*(?:\r?\n)?/m, "");
      return `---\n${body}${day ? `approved_at: ${day}\n` : ""}---`;
    });
    if (text !== updated) writeFileSync(file, updated, "utf8");
  }
}
