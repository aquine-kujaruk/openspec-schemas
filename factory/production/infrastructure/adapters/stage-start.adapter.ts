import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { StageStartAcl } from "../acl/stage-start.acl.ts";

export class StageStartAdapter implements StageStartAcl {
  private readonly directory: string;
  private readonly gate: string;
  private readonly assess: StageStartAcl["validateWorkOrder"];
  private readonly builds: (name: string) => Promise<{ code: boolean; line?: string }>;
  private readonly run: (args: string[]) => { status: number; output: string };

  constructor(
    directory: string,
    gate: string,
    assess: StageStartAcl["validateWorkOrder"],
    builds: (name: string) => Promise<{ code: boolean; line?: string }>,
    run: (args: string[]) => { status: number; output: string },
  ) {
    this.directory = directory;
    this.gate = gate;
    this.assess = assess;
    this.builds = builds;
    this.run = run;
  }

  validateWorkOrder(name: string) { return this.assess(name); }

  async prepareStage(name: string, phase: string): Promise<{ success: boolean; output: string }> {
    const { code, line } = await this.builds(name);
    const prep = line ? ["prepare", "--product", line] : ["prepare"];
    for (const step of code ? [prep, ["generate"]] : [["generate"]]) {
      const { status, output } = this.run(step);
      if (status !== 0) return { success: false, output };
    }
    writeFileSync(join(this.directory, name, this.gate),
      `${JSON.stringify({ phase, failures: 0, waitingFor: "the agent", findings: [] }, null, 2)}\n`);
    return { success: true, output: "" };
  }
}
