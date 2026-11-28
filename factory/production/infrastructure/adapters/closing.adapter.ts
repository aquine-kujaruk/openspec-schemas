import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { WorkOrderException } from "../../domain/exceptions/work-order.exceptions.ts";
import type { ClosingAcl } from "../acl/closing.acl.ts";

const day = () => new Date().toISOString().slice(0, 10);
const read = (file: string) => existsSync(file) ? readFileSync(file, "utf8") : null;

const write = (file: string, text: string | null): void => {
  if (text === null) rmSync(file, { force: true });
  else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, "utf8");
  }
};

export class ClosingAdapter implements ClosingAcl {
  private readonly root: string;
  private readonly directory: string;
  private readonly openSpec: (name: string) => { status: number; output: string };
  private readonly projections: Omit<ClosingAcl, "today" | "readPlan" | "readStandingFile" | "closeArchive">;

  constructor(
    root: string,
    directory: string,
    openSpec: (name: string) => { status: number; output: string },
    projections: Omit<ClosingAcl, "today" | "readPlan" | "readStandingFile" | "closeArchive">,
  ) {
    this.root = root;
    this.directory = directory;
    this.openSpec = openSpec;
    this.projections = projections;
  }

  today() { return day(); }
  listOrders() { return this.projections.listOrders(); }
  findCertificate(name: string) { return this.projections.findCertificate(name); }
  currentDigest(name: string) { return this.projections.currentDigest(name); }
  validateWorkOrder(name: string) { return this.projections.validateWorkOrder(name); }
  listStanding() { return this.projections.listStanding(); }
  recordFinding(name: string, block: string, message: string) { return this.projections.recordFinding(name, block, message); }
  makeGauges() { return this.projections.makeGauges(); }

  async readPlan(name: string) { return readFileSync(join(this.directory, name, "plan.md"), "utf8"); }
  async readStandingFile(path: string) { return read(join(this.root, path)); }

  async closeArchive(
    name: string,
    origin: string,
    documents: { path: string; before: string | null; after: string | null }[],
  ) {
    let merged = false;

    try {
      for (const { path, after } of documents) write(join(this.root, path), after);
      const result = this.openSpec(name);
      const moved = join(this.directory, "archive", `${day()}-${name}`);
      merged = result.status === 0 && existsSync(moved);

      if (merged) {
        const target = join(this.directory, "archive", origin);
        if (target !== moved) renameSync(moved, target);

        return { success: true, output: result.output };
      }

      for (const { path, before } of documents) write(join(this.root, path), before);

      return { success: false, output: result.output };
    } catch (cause) {
      if (!merged) for (const { path, before } of documents) write(join(this.root, path), before);

      throw new WorkOrderException(`Could not archive ${name}`, { cause });
    }
  }
}
