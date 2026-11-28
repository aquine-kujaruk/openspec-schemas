import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import type { ProcessRepositoryInterface } from "../../application/repository-interfaces/process.repository-interface.ts";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";
import { ProcessRecordSchema, type ProcessAcl, type ProcessRecord } from "../acl/process.acl.ts";

export class ProcessRepositoryImplementation implements ProcessRepositoryInterface {
  private readonly records: ProcessAcl;

  constructor(records: ProcessAcl) {
    this.records = records;
  }

  async listProcesses(): Promise<ProcessRecord[]> {
    try {
      return ProcessRecordSchema.array().parse(await this.records.listProcesses());
    } catch (cause) {
      throw new EngineeringException("The process definitions could not be loaded", { cause });
    }
  }

  async findProcess(name: ProcessName): Promise<ProcessRecord | null> {
    return (await this.listProcesses()).find((process) => process.name === name) ?? null;
  }
}
