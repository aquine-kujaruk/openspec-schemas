import { Drawing } from "../../domain/entities/drawing.entity.ts";
import { Gauge } from "../../domain/value-objects/gauge.value-object.ts";
import type { Scenario } from "../../domain/schemas/drawing.schema.ts";
import type { DrawingAcl } from "../acl/drawing.acl.ts";
import type { DrawingRepositoryInterface } from "../../application/repository-interfaces/drawing.repository-interface.ts";

export class DrawingRepositoryImplementation implements DrawingRepositoryInterface {
  private readonly tool: DrawingAcl;

  constructor(tool: DrawingAcl) {
    this.tool = tool;
  }

  async makeGauges(args: readonly string[]) {
    const { exitStatus, drawings } = await this.tool.makeGauges(args);
    return {
      exitStatus,
      drawings: drawings.map(({ path, gherkin }) => new Drawing({ path, scenarios: this.scenarios(gherkin) })),
      gauges: drawings.map(({ path, file }) => new Gauge({ drawing: path, file })),
    };
  }

  private scenarios(gherkin: string): Scenario[] {
    const scenarios: Scenario[] = [];
    let requirement = "Feature";
    for (const line of gherkin.split("\n")) {
      const rule = /^\s*Rule:\s+(.+)\s*$/.exec(line);
      if (rule) requirement = rule[1]!.trim();
      const scenario = /^\s*Scenario(?: Outline)?:\s+(.+)\s*$/.exec(line);
      if (scenario) scenarios.push({ title: scenario[1]!.trim(), requirement });
    }
    return scenarios;
  }
}
