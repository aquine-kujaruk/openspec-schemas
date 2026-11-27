import { describe, expect, it } from "vitest";
import { AssessWorkOrderUseCase } from "../../../../../factory/production/application/use-cases/assess-work-order.use-case.ts";
import type {
  Judge,
  WorkOrderAssessmentRepositoryInterface,
} from "../../../../../factory/production/application/repository-interfaces/work-order-assessment.repository-interface.ts";
import type { Candidate, JudgementRequest } from "../../../../../factory/production/domain/services/work-order-assessment.service.ts";

const PLAN = "---\nname: c\napproved_at: 2026-11-27\n---\n\n# C\n\n## Goal\n\n## Decisions\n\n## Open questions\n";

const setup = (judge: Judge | null, requests: JudgementRequest[]) => {
  const recorded = new Map<string, number>();
  const key = (model: string, r: JudgementRequest) => `${model}|${r.block}|${r.instructions}|${r.state}`;
  let seen: Candidate["judged"] | undefined;
  const records: WorkOrderAssessmentRepositoryInterface = {
    findWorkOrder: (_root, name) => ({ name, dir: "/c", schema: "spec-plan", plan: PLAN, noBehaviour: true, deltaSpecs: [], linked: [] }),
    findArchivedWorkOrder: () => undefined,
    listWorkOrders: () => ["c"],
    isWorkOrderStarted: () => false,
    listStanding: () => ({ decisions: new Map(), procedures: new Map() }),
    listProcesses: () => ["spec-plan"],
    loadProcess: async () => ({
      workstreams: [],
      validator: {
        judgements: () => requests,
        ready: (c) => {
          seen = c.judged;
          return [];
        },
      },
    }),
    listProducts: async () => ({}),
    findJudge: async () => judge,
    findJudgement: (_root, _name, model, r) => recorded.get(key(model, r)),
    recordJudgement: (_root, _name, model, r, p) => void recorded.set(key(model, r), p),
  };
  return { use: new AssessWorkOrderUseCase(records), judged: () => seen!, recorded };
};

const request = (state: string): JudgementRequest => ({ block: "money-in-cents", state, instructions: "holds?" });

describe("judging an agent's decisions before validation", () => {
  it("asks once per text and model, then reuses the record", async () => {
    let asked = 0;
    const judge: Judge = { model: "m1", ask: async () => (asked++, 0.97) };
    const { use, judged } = setup(judge, [request("A")]);
    await use.execute("/", "c");
    await use.execute("/", "c");
    expect(asked).toBe(1);
    expect(judged()).toEqual({ configured: true, answers: new Map([["money-in-cents", 0.97]]) });
  });

  it("asks again under another model", async () => {
    let asked = 0;
    const first = setup({ model: "m1", ask: async () => (asked++, 0.97) }, [request("A")]);
    await first.use.execute("/", "c");
    const second = setup({ model: "m2", ask: async () => (asked++, 0.5) }, [request("A")]);
    await second.use.execute("/", "c");
    expect(asked).toBe(2);
  });

  it("hands a failure to ask as the answer and records nothing", async () => {
    const { use, judged, recorded } = setup({ model: "m1", ask: async () => { throw new Error("down"); } }, [request("A")]);
    await use.execute("/", "c");
    expect(judged().answers.get("money-in-cents")).toEqual({ error: "down" });
    expect(recorded.size).toBe(0);
  });

  it("asks nothing without a decision model", async () => {
    const { use, judged } = setup(null, [request("A")]);
    await use.execute("/", "c");
    expect(judged()).toEqual({ configured: false, answers: new Map() });
  });
});
