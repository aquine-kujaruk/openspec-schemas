import type { Process } from "../../domain/aggregates/process.aggregate.ts";
import type { ProcessRepositoryInterface } from "../repository-interfaces/process.repository-interface.ts";

export class ListProcessesUseCase {
  private readonly processes: ProcessRepositoryInterface;

  constructor(processes: ProcessRepositoryInterface) {
    this.processes = processes;
  }

  execute(): Promise<Process[]> {
    return this.processes.listProcesses();
  }
}
