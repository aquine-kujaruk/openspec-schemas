import type { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import type { Process } from "../../domain/aggregates/process.aggregate.ts";

export interface ProcessRepositoryInterface {
  findProcess(name: ProcessName): Promise<Process | null>;
  listProcesses(): Promise<Process[]>;
}
