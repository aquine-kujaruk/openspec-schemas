import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import type { ProcessRecord } from "../../domain/schemas/process.schema.ts";

export interface ProcessRepositoryInterface {
  findProcess(name: ProcessName): Promise<ProcessRecord | null>;
  listProcesses(): Promise<ProcessRecord[]>;
}
