import type { GaugeRunRepositoryInterface } from "../repository-interfaces/gauge-run.repository-interface.ts";

export class RunGaugesUseCase {
  private readonly repository: GaugeRunRepositoryInterface;

  constructor(repository: GaugeRunRepositoryInterface) {
    this.repository = repository;
  }

  execute(args: readonly string[]): Promise<number> {
    return this.repository.runGauges(args);
  }
}
