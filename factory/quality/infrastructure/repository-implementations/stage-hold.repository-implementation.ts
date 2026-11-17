import type { StageHoldRepositoryInterface } from "../../application/repository-interfaces/stage-hold.repository-interface.ts";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import type { BuildingStage, StageRecord } from "../../domain/schemas/stage-hold.schema.ts";
import { GateRecordSchema, type StageHoldAcl } from "../acl/stage-hold.acl.ts";

export class StageHoldRepositoryImplementation implements StageHoldRepositoryInterface {
  private readonly records: StageHoldAcl;

  constructor(records: StageHoldAcl) {
    this.records = records;
  }

  listBuilding() {
    return this.records.buildingRecords();
  }

  listHarnessFindings() {
    return this.records.harnessFindings();
  }

  listWorkstreams(stage: BuildingStage) {
    return this.records.workstreams(stage);
  }

  async readRecord(name: string) {
    try {
      return GateRecordSchema.parse(await this.records.readRecord(name) ?? {
        failures: 0, waitingFor: "the agent", findings: [],
      });
    } catch (cause) {
      throw new QualityException(`Unable to read the stage hold for ${name}`, { cause });
    }
  }

  saveRecord(name: string, record: StageRecord) {
    return this.records.writeRecord(name, record);
  }

  resetRecord(name: string) {
    return this.records.removeRecord(name);
  }

  runCheck(stage: BuildingStage, workstream: string) {
    return this.records.run(stage, ["check", "--workstream", workstream]);
  }

  runTests(stage: BuildingStage, kind: "unit" | "integration" | "acceptance") {
    return this.records.run(stage, ["test", kind]);
  }
}
