import type { GaugeRunPort } from "../acl/gauge-run.acl.ts";
import type { GaugeRunRepositoryInterface } from "../../application/repository-interfaces/gauge-run.repository-interface.ts";

export class GaugeRunRepositoryImplementation implements GaugeRunRepositoryInterface {
  private readonly run: GaugeRunPort;

  constructor(run: GaugeRunPort) {
    this.run = run;
  }

  runGauges(args: readonly string[]) {
    return this.run(args);
  }
}
