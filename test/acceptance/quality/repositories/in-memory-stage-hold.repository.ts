import type { StageHoldRepositoryInterface } from "../../../../factory/quality/application/repository-interfaces/stage-hold.repository-interface.ts";
import type { ResourceRun } from "../../../../factory/quality/domain/schemas/inspect-work-order.schema.ts";
import type { BuildingStage, StageRecord, StageWorkstream } from "../../../../factory/quality/domain/schemas/stage-hold.schema.ts";

type Seed = {
  stages: BuildingStage[];
  workstreams: StageWorkstream[];
  harnessFindings: string[];
  records: Map<string, StageRecord>;
  failedLines: Set<string>;
};
const fresh = (): StageRecord => ({ failures: 0, waitingFor: "the agent", findings: [] });

export class InMemoryStageHoldRepository implements StageHoldRepositoryInterface {
  private data: Seed = {
    stages: [], workstreams: [], harnessFindings: [], records: new Map(), failedLines: new Set(),
  };
  readonly runs: Array<{ line?: string; target: string }> = [];

  seed(data: Seed): void {
    this.data = data;
  }

  async listBuilding(): Promise<BuildingStage[]> {
    return this.data.stages;
  }

  async listHarnessFindings(): Promise<string[]> {
    return this.data.harnessFindings;
  }

  async listWorkstreams(): Promise<StageWorkstream[]> {
    return this.data.workstreams;
  }

  async readRecord(name: string): Promise<StageRecord> {
    return this.data.records.get(name) ?? fresh();
  }

  async saveRecord(name: string, record: StageRecord): Promise<void> {
    this.data.records.set(name, record);
  }

  async resetRecord(name: string): Promise<void> {
    this.data.records.delete(name);
  }

  private measure(stage: BuildingStage, target: string): ResourceRun {
    this.runs.push({ line: stage.line, target });
    return this.data.failedLines.has(stage.line ?? "")
      ? { status: 1, output: "a rule is broken" }
      : { status: 0, output: "" };
  }

  async runCheck(stage: BuildingStage, workstream: string): Promise<ResourceRun> {
    return this.measure(stage, workstream);
  }

  async runTests(stage: BuildingStage, kind: "unit" | "integration" | "acceptance"): Promise<ResourceRun> {
    return this.measure(stage, kind);
  }
}
