import type { BuildingStage } from "../../domain/schemas/stage-hold.schema.ts";
import { StageHold } from "../../domain/value-objects/stage-hold.value-object.ts";
import type { StageHoldRepositoryInterface } from "../repository-interfaces/stage-hold.repository-interface.ts";

const ATTEMPTS = 3;

export class HoldStageUseCase {
  private readonly records: StageHoldRepositoryInterface;

  constructor(records: StageHoldRepositoryInterface) {
    this.records = records;
  }

  async execute(helper = false): Promise<StageHold> {
    const building = await this.records.listBuilding();
    if (!building.length) return new StageHold({ held: false, reasons: [] });
    const altered = await this.records.listHarnessFindings();
    const refused: string[] = [];
    const handed: string[] = [];
    for (const order of building) {
      const previous = await this.records.readRecord(order.name);
      const phase = previous.phase;
      if (!altered.length && order.pendingFeedback && !helper) {
        handed.push(`${order.name} has pending feedback. Review it with factory feedback ${order.name}.`);
        continue;
      }
      const findings = altered.length ? altered : await this.inspectStage(order, phase);
      if (!findings.length) {
        const next = order.phases.find(({ tasks }) => tasks.some(({ done }) => !done));
        if (!helper && !next && await this.records.hasCurrentVerification(order.name)) {
          await this.records.resetRecord(order.name);
          continue;
        }
        await this.records.saveRecord(order.name, { phase, failures: 0, waitingFor: "the agent", findings: [] });
        if (!helper) {
          const task = next?.tasks.find(({ done }) => !done)?.text;
          const action = task ? ` — ${task}` : "";
          refused.push(next
            ? `${order.name}: ${next.title === phase || !phase ? "continue" : "start"} ${next.title}${action}`
            : `${order.name}: verify the change with factory verify ${order.name}`);
        }
        continue;
      }

      const failures = previous.failures + 1;
      await this.records.saveRecord(order.name, {
        phase, failures, findings, waitingFor: failures >= ATTEMPTS ? "the person" : "the agent",
      });
      if (failures >= ATTEMPTS) {
        handed.push(
          `${order.name} failed to finish ${failures} times in a row and now waits for the person: openspec/changes/${order.name}/gate.json holds what was found`,
        );
      } else {
        refused.push(
          `${order.name} is in implementation and cannot be left like this (attempt ${failures} of ${ATTEMPTS}):`,
          ...findings,
        );
      }
    }
    return new StageHold({ held: refused.length > 0, reasons: refused.length ? refused : handed });
  }

  private async inspectStage(order: BuildingStage, started?: string): Promise<string[]> {
    const phase = order.phases.find(({ title }) => title === started) ??
      order.phases.find(({ tasks }) => tasks.some(({ done }) => !done));
    if (!phase) return [];
    const workstreams = new Map((await this.records.listWorkstreams(order)).map((item) => [item.id, item]));
    const upstream = (id: string, seen = new Set<string>()): Set<string> => {
      for (const dependency of workstreams.get(id)?.upstream ?? [])
        if (!seen.has(dependency)) upstream(dependency, seen.add(dependency));
      return seen;
    };
    const named = [...new Set(phase.tasks.flatMap(({ workstream }) => workstream ? [workstream] : []))]
      .filter((id) => workstreams.has(id));
    const covered = new Set(named.flatMap((id) => [...upstream(id)]));
    const found: string[] = [];
    for (const id of named.filter((id) => !covered.has(id))) {
      const checked = await this.records.runCheck(order, id);
      if (checked.status !== 0) found.push(`the check of ${id} fails:\n${checked.output}`);
    }
    const kinds = new Set([...new Set([...named, ...covered])]
      .flatMap((id) => workstreams.get(id)?.tests ?? []));
    for (const kind of kinds) {
      const tested = await this.records.runTests(order, kind);
      if (tested.status !== 0) found.push(`the ${kind} tests fail:\n${tested.output}`);
    }
    return found;
  }
}
