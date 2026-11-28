import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { BuildingStageSchema, type BuildingStage, type StageRecord, type StageWorkstream } from "../schemas/stage-hold.schema.ts";

const ATTEMPTS = 3;

type Phase = BuildingStage["phases"][number];

export class BuildingStageEntity {
  readonly name!: string;
  readonly process!: string;
  readonly line?: string;
  readonly pendingFeedback?: boolean;
  readonly phases!: Phase[];

  constructor(props: BuildingStage) {
    validateSchema(this, BuildingStageSchema, props);
  }

  get nextPhase(): Phase | undefined {
    return this.phases.find(({ tasks }) => tasks.some(({ done }) => !done));
  }

  get feedbackNotice(): string {
    return `${this.name} has pending feedback. Review it with factory feedback ${this.name}.`;
  }

  phaseToInspect(started?: string): Phase | undefined {
    return this.phases.find(({ title }) => title === started) ?? this.nextPhase;
  }

  inspectionOf(phase: Phase, listed: StageWorkstream[]): { checks: string[]; kinds: StageWorkstream["tests"] } {
    const workstreams = new Map(listed.map((item) => [item.id, item]));

    const upstream = (id: string, seen = new Set<string>()): Set<string> => {
      for (const dependency of workstreams.get(id)?.upstream ?? [])
        if (!seen.has(dependency)) upstream(dependency, seen.add(dependency));

      return seen;
    };

    const named = [...new Set(phase.tasks.flatMap(({ workstream }) => workstream ? [workstream] : []))]
      .filter((id) => workstreams.has(id));

    const covered = new Set(named.flatMap((id) => [...upstream(id)]));
    const kinds = new Set([...named, ...covered].flatMap((id) => workstreams.get(id)?.tests ?? []));

    return { checks: named.filter((id) => !covered.has(id)), kinds: [...kinds] };
  }

  continuation(started?: string): string {
    const next = this.nextPhase;
    if (!next) return `${this.name}: verify the change with factory verify ${this.name}`;

    const task = next.tasks.find(({ done }) => !done)?.text;

    return `${this.name}: ${next.title === started || !started ? "continue" : "start"} ${next.title}${task ? ` — ${task}` : ""}`;
  }

  failed(previous: StageRecord, findings: string[]): { record: StageRecord; refused: string[]; handed: string[] } {
    const failures = previous.failures + 1;
    const exhausted = failures >= ATTEMPTS;
    const record: StageRecord = { phase: previous.phase, failures, findings, waitingFor: exhausted ? "the person" : "the agent" };

    if (exhausted) return {
      record, refused: [],
      handed: [`${this.name} failed to finish ${failures} times in a row and now waits for the person: openspec/changes/${this.name}/gate.json holds what was found`],
    };

    return {
      record, handed: [],
      refused: [`${this.name} is in implementation and cannot be left like this (attempt ${failures} of ${ATTEMPTS}):`, ...findings],
    };
  }
}
