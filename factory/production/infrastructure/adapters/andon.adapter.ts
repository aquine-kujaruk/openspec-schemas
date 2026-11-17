import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AndonAcl } from "../acl/andon.acl.ts";

export class AndonAdapter implements AndonAcl {
  private readonly directory: string;
  private readonly gate: string;
  private readonly signals: (name: string) => { source: string }[];

  constructor(directory: string, gate: string, signals: (name: string) => { source: string }[]) {
    this.directory = directory;
    this.gate = gate;
    this.signals = signals;
  }

  async readPlan(name: string) {
    return readFileSync(join(this.directory, name, "plan.md"), "utf8");
  }

  async savePlan(name: string, text: string) {
    writeFileSync(join(this.directory, name, "plan.md"), text, "utf8");
  }

  async closeSignal(name: string, source: string) {
    const left = this.signals(name).filter((report) => report.source !== source);
    const file = join(this.directory, name, "feedback.json");
    if (left.length) writeFileSync(file, `${JSON.stringify(left, null, 2)}\n`);
    else rmSync(file, { force: true });
    rmSync(join(this.directory, name, this.gate), { force: true });
  }
}
