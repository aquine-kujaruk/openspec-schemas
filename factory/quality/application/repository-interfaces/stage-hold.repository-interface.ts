import type { ResourceRun } from "../../domain/schemas/inspect-work-order.schema.ts";
import type { BuildingStage, StageRecord, StageWorkstream } from "../../domain/schemas/stage-hold.schema.ts";

export interface StageHoldRepositoryInterface {
  listBuilding(): Promise<BuildingStage[]>;
  listHarnessFindings(): Promise<string[]>;
  listWorkstreams(stage: BuildingStage): Promise<StageWorkstream[]>;
  readRecord(name: string): Promise<StageRecord>;
  saveRecord(name: string, record: StageRecord): Promise<void>;
  resetRecord(name: string): Promise<void>;
  runCheck(stage: BuildingStage, workstream: string): Promise<ResourceRun>;
  runTests(stage: BuildingStage, kind: "unit" | "integration" | "acceptance"): Promise<ResourceRun>;
}
