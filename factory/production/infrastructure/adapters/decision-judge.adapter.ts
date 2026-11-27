import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Judge } from "../../application/repository-interfaces/work-order-assessment.repository-interface.ts";
import type { JudgementRequest } from "../../domain/services/work-order-assessment.service.ts";
import type { DecisionJudgeAcl } from "../acl/decision-judge.acl.ts";
import { DECISIONS_ENDPOINT, decisionModelClient } from "../../../shared/infrastructure/adapters/decision-model.adapter.ts";
import { CHANGES } from "./work-order-record.adapter.ts";
import { JudgementUnanswered } from "../../domain/exceptions/work-order.exceptions.ts";

/** The file of a change that records the decision model's answers. */
export const JUDGEMENTS = "judgements.json";
const QUESTION = "basis-holds";

const RecordSchema = z.array(
  z.object({ block: z.string(), model: z.string(), fingerprint: z.string(), probability: z.number() }),
);

type Settings = {
  /** The decision model the product configures: the `.env` variable of its key and the model. */
  reviewOf(root: string, product?: string): Promise<{ keyVariable: string; model: string }>;
  /** The project's `.env` under the process environment. */
  environment(root: string): Record<string, string | undefined>;
};

export class DecisionJudgeAdapter implements DecisionJudgeAcl {
  private readonly settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  async judgeOf(root: string, product?: string): Promise<Judge | null> {
    let review: { keyVariable: string; model: string };
    try {
      review = await this.settings.reviewOf(root, product);
    } catch {
      return null;
    }
    const env = this.settings.environment(root);
    const key = env[review.keyVariable];
    if (!key) return null;
    const client = decisionModelClient({
      key,
      model: review.model,
      endpoint: env.FACTORY_DECISIONS_ENDPOINT || DECISIONS_ENDPOINT,
      timeoutMs: 30_000,
    });
    return {
      model: review.model,
      async ask(request) {
        const answers = await client.ask(request.state, [{ name: QUESTION, instructions: request.instructions }]);
        const probability = answers.get(QUESTION);
        if (probability === undefined)
          throw new JudgementUnanswered("decision model: no answer to the basis question", { cause: answers });
        return probability;
      },
    };
  }

  recorded(root: string, name: string, model: string, request: JudgementRequest) {
    const fingerprint = this.fingerprint(request);
    return this.read(root, name).find((r) => r.block === request.block && r.model === model && r.fingerprint === fingerprint)
      ?.probability;
  }

  record(root: string, name: string, model: string, request: JudgementRequest, probability: number) {
    const fingerprint = this.fingerprint(request);
    const kept = this.read(root, name).filter((r) => !(r.block === request.block && r.model === model));
    kept.push({ block: request.block, model, fingerprint, probability });
    writeFileSync(this.file(root, name), `${JSON.stringify(kept, null, 2)}\n`);
  }

  private file(root: string, name: string) {
    return join(root, CHANGES, name, JUDGEMENTS);
  }

  private read(root: string, name: string) {
    const file = this.file(root, name);
    if (!existsSync(file)) return [];
    const parsed = RecordSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
    return parsed.success ? parsed.data : [];
  }

  private fingerprint(request: JudgementRequest) {
    return createHash("sha256").update(`${request.instructions}\n${request.state}`).digest("hex");
  }
}
