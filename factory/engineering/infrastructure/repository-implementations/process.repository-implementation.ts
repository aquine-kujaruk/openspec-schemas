import { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import type { ProcessRepositoryInterface } from "../../application/repository-interfaces/process.repository-interface.ts";
import { Process } from "../../domain/aggregates/process.aggregate.ts";
import { WorkCenter } from "../../domain/entities/work-center.entity.ts";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";
import { Part } from "../../domain/value-objects/part.value-object.ts";
import { StandardId } from "../../domain/value-objects/standard-id.value-object.ts";
import { Standard } from "../../domain/value-objects/standard.value-object.ts";
import { WorkCenterId } from "../../domain/value-objects/work-center-id.value-object.ts";
import { ProcessRecordSchema, type ProcessAcl } from "../acl/process.acl.ts";

export class ProcessRepositoryImplementation implements ProcessRepositoryInterface {
  private readonly records: ProcessAcl;

  constructor(records: ProcessAcl) {
    this.records = records;
  }

  async listProcesses(): Promise<Process[]> {
    try {
      const records = ProcessRecordSchema.array().parse(await this.records.listProcesses());
      return records.map((record) => new Process({
        name: new ProcessName({ value: record.name }),
        base: record.base ? new ProcessName({ value: record.base }) : undefined,
        description: record.description,
        pilot: record.pilot ? new WorkCenterId({ value: record.pilot }) : undefined,
        workCenters: record.workCenters.map((center) => new WorkCenter({
          id: new WorkCenterId({ value: center.id }),
          waitsFor: center.waitsFor.map((value) => new WorkCenterId({ value })),
          parts: center.parts.map((part) => new Part({
            name: part.name,
            standards: part.standards.map((standard) => new Standard({
              id: new StandardId({ value: standard.id }),
              title: standard.title,
            })),
          })),
        })),
      }));
    } catch (cause) {
      throw new EngineeringException("The process definitions could not be loaded", { cause });
    }
  }

  async findProcess(name: ProcessName): Promise<Process | null> {
    return (await this.listProcesses()).find((process) => process.name.equals(name)) ?? null;
  }
}
