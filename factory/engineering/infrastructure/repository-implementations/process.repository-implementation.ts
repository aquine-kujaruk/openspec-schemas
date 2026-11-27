import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import type { ProcessRepositoryInterface } from "../../application/repository-interfaces/process.repository-interface.ts";
import { ProcessAggregate } from "../../domain/aggregates/process.aggregate.ts";
import { WorkCenterEntity } from "../../domain/entities/work-center.entity.ts";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";
import { PartValueObject } from "../../domain/value-objects/part.value-object.ts";

import { StandardValueObject } from "../../domain/value-objects/standard.value-object.ts";

import { ProcessRecordSchema, type ProcessAcl } from "../acl/process.acl.ts";

export class ProcessRepositoryImplementation implements ProcessRepositoryInterface {
  private readonly records: ProcessAcl;

  constructor(records: ProcessAcl) {
    this.records = records;
  }

  async listProcesses(): Promise<ProcessAggregate[]> {
    try {
      const records = ProcessRecordSchema.array().parse(await this.records.listProcesses());
      return records.map((record) => new ProcessAggregate({
        name: record.name,
        base: record.base ? record.base : undefined,
        description: record.description,
        pilot: record.pilot ? record.pilot : undefined,
        workCenters: record.workCenters.map((center) => new WorkCenterEntity({
          id: center.id,
          waitsFor: center.waitsFor,
          parts: center.parts.map((part) => new PartValueObject({
            name: part.name,
            standards: part.standards.map((standard) => new StandardValueObject({
              id: standard.id,
              title: standard.title,
            })),
          })),
        })),
      }));
    } catch (cause) {
      throw new EngineeringException("The process definitions could not be loaded", { cause });
    }
  }

  async findProcess(name: ProcessName): Promise<ProcessAggregate | null> {
    return (await this.listProcesses()).find((process) => process.name === name) ?? null;
  }
}
