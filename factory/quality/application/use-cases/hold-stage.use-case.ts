import { BuildingStageEntity } from "../../domain/entities/building-stage.entity.ts";
import { StageHoldValueObject } from "../../domain/value-objects/stage-hold.value-object.ts";
import type { StageHoldRepositoryInterface } from "../repository-interfaces/stage-hold.repository-interface.ts";

export class HoldStageUseCase {
  private readonly records: StageHoldRepositoryInterface;

  constructor(records: StageHoldRepositoryInterface) {
    this.records = records;
  }

  async execute(helper = false): Promise<StageHoldValueObject> {
    const building = (await this.records.listBuilding()).map((order) => new BuildingStageEntity(order));
    if (!building.length) return new StageHoldValueObject({ held: false, reasons: [] });

    const altered = await this.records.listHarnessFindings();
    const refused: string[] = [];
    const handed: string[] = [];

    for (const order of building) {
      const previous = await this.records.readRecord(order.name);

      if (!altered.length && order.pendingFeedback && !helper) {
        handed.push(order.feedbackNotice);

        continue;
      }

      const findings = altered.length ? altered : await this.inspectStage(order, previous.phase);

      if (findings.length) {
        const outcome = order.failed(previous, findings);
        await this.records.saveRecord(order.name, outcome.record);
        refused.push(...outcome.refused);
        handed.push(...outcome.handed);

        continue;
      }

      if (!helper && !order.nextPhase && await this.records.hasCurrentVerification(order.name)) {
        await this.records.resetRecord(order.name);

        continue;
      }

      await this.records.saveRecord(order.name, { phase: previous.phase, failures: 0, waitingFor: "the agent", findings: [] });
      if (!helper) refused.push(order.continuation(previous.phase));
    }

    return new StageHoldValueObject({ held: refused.length > 0, reasons: refused.length ? refused : handed });
  }

  private async inspectStage(order: BuildingStageEntity, started?: string): Promise<string[]> {
    const phase = order.phaseToInspect(started);
    if (!phase) return [];

    const { checks, kinds } = order.inspectionOf(phase, await this.records.listWorkstreams(order));
    const found: string[] = [];

    for (const id of checks) {
      const checked = await this.records.runCheck(order, id);
      if (checked.status !== 0) found.push(`the check of ${id} fails:\n${checked.output}`);
    }

    for (const kind of kinds) {
      const tested = await this.records.runTests(order, kind);
      if (tested.status !== 0) found.push(`the ${kind} tests fail:\n${tested.output}`);
    }

    return found;
  }
}
