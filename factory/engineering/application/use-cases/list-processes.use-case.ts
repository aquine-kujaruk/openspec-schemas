import type { ProcessAggregate } from "../../domain/aggregates/process.aggregate.ts";
import type { ProcessRepositoryInterface } from "../repository-interfaces/process.repository-interface.ts";

export class ListProcessesUseCase {
  private readonly processes: ProcessRepositoryInterface;

  constructor(processes: ProcessRepositoryInterface) {
    this.processes = processes;
  }

  execute(): Promise<ProcessAggregate[]> {
    return this.processes.listProcesses();
  }
}
