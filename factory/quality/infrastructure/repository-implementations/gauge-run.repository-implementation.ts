import type { GaugeRunAcl } from "../acl/gauge-run.acl.ts";
import type { GaugeRunRepositoryInterface } from "../../application/repository-interfaces/gauge-run.repository-interface.ts";

export class GaugeRunRepositoryImplementation implements GaugeRunRepositoryInterface {
  private readonly tool: GaugeRunAcl;

  constructor(tool: GaugeRunAcl) {
    this.tool = tool;
  }

  runGauges(args: readonly string[]) {
    return this.tool.runGauges(args);
  }
}
