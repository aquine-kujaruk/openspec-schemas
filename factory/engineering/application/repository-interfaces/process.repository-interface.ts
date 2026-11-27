import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import type { ProcessAggregate } from "../../domain/aggregates/process.aggregate.ts";

export interface ProcessRepositoryInterface {
  findProcess(name: ProcessName): Promise<ProcessAggregate | null>;
  listProcesses(): Promise<ProcessAggregate[]>;
}
