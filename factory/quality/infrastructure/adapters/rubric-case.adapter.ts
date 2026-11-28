import { createHash } from "node:crypto";
import { join } from "node:path";
import type { Case, RubricVerdict } from "./sample-file-contract.adapter.ts";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";

import type { RubricObservation as Observation } from "../acl/rubric-history.acl.ts";
import { FileRubricHistoryAdapter } from "./file-rubric-history.adapter.ts";

export type Judgement = {
  verdict: RubricVerdict | "ambiguous";
  score: number;
  model: string;
  fingerprint: string;
};

const ConfidenceState = { Target: "target", Warning: "warning", Failed: "failed" } as const;

export type ScoreResult = Judgement & {
  expected: RubricVerdict;
  confidence: number;
  state: (typeof ConfidenceState)[keyof typeof ConfidenceState];
  history: number[];
  delta?: number;
  drift: boolean;
  changed: string[];
  replayed: boolean;
};

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const confidenceBands = { target: 95, minimum: 90, drift: 20 } as const;

const reaches = (score: number, expected: RubricVerdict, percent: number) =>
  expected === "yes" ? score >= percent / 100 : score <= (100 - percent) / 100;

function compare(observation: Observation, previous: Observation[], fingerprint: string, expected: RubricVerdict, replayed: boolean): ScoreResult {
  const { score, model } = observation;
  const confidence = expected === "yes" ? score : 1 - score;

  const state = reaches(score, expected, confidenceBands.target) ? ConfidenceState.Target
    : reaches(score, expected, confidenceBands.minimum) ? ConfidenceState.Warning : ConfidenceState.Failed;

  const verdict = reaches(score, "yes", confidenceBands.minimum) ? "yes"
    : reaches(score, "no", confidenceBands.minimum) ? "no" : "ambiguous";

  const history = previous.map(item => item.score);
  const mean = history.length ? history.reduce((sum, value) => sum + value, 0) / history.length : undefined;
  const delta = mean === undefined ? undefined : score - mean;
  const drift = delta !== undefined && Math.abs(delta) + Number.EPSILON >= confidenceBands.drift / 100;
  const fields = ["model", "question", "case"] as const;
  const lastVersion = previous.findLast(item => fields.some(field => observation[field] !== item[field]));
  const changed = fields.filter(field => lastVersion && observation[field] !== lastVersion[field]);

  return { score, model, fingerprint, verdict, expected, confidence, state, history, delta, drift, changed, replayed };
}

export function rubricWarnings(result: ScoreResult): string[] {
  const warnings: string[] = [];
  if (result.state === ConfidenceState.Warning) warnings.push(`confidence below ${confidenceBands.target}% target`);
  if (result.drift) warnings.push(`historical shift of at least ${confidenceBands.drift} points`);

  return warnings;
}

export function createRubricCases(options: {
  layer: string; dir: string; model: string;
  cases: Map<string, Map<string, Case>>;
  questions: Map<string, string>;
  ask?: (state: string, question: string) => Promise<number>;
}) {
  const history = new FileRubricHistoryAdapter(join(options.dir, options.layer + ".scores.json"));

  async function judge(row: string, name: string, mode: "test" | "record" | "record-changed" = "test"): Promise<ScoreResult> {
    const sample = options.cases.get(row)?.get(name);
    const question = options.questions.get(row);
    const id = row + "/" + name;

    if (!sample?.files.size || !sample.expectedVerdict || !question)
      throw new QualityException(`${options.layer} ${id}: missing files, expected verdict or accepted rubric question`, { cause: id });

    const expected = sample.expectedVerdict;
    const files = [...sample.files.entries()].sort(([a], [b]) => a.localeCompare(b));
    const identity = { model: options.model, question: hash(question), case: hash(JSON.stringify(files)) };
    const fingerprint = hash(JSON.stringify(identity));

    if (mode !== "record") {
      const previous = history.read(id);

      const index = previous.findLastIndex(item =>
        item.model === identity.model && item.question === identity.question && item.case === identity.case);

      if (index >= 0) return compare(previous[index]!, previous.slice(0, index), fingerprint, expected, true);
    }

    if (!options.ask)
      throw new QualityException(`${options.layer} ${id}: no matching judgement for ${options.model}. Configure the model key and run factory expect ${options.layer}.`, { cause: id });

    const state = files.map(([path, code]) => `=== ${path} ===\n${code}`).join("\n\n");
    const score = await options.ask(state, question);

    if (!Number.isFinite(score) || score < 0 || score > 1)
      throw new QualityException(`${options.layer} ${id}: the model returned no valid probability`, { cause: score });

    const observation = { ...identity, score, date: new Date().toISOString() };
    const previous = await history.append(id, observation);

    return compare(observation, previous, fingerprint, expected, false);
  }

  return { judge };
}

export function assertRubricCase(layer: string, row: string, name: string, result: ScoreResult, expected: RubricVerdict) {
  if (result.state === ConfidenceState.Failed || result.verdict !== expected)
    throw new QualityException(`${layer} ${row}/${name}: expected ${expected}, received ${result.verdict} (p=${result.score}, confidence=${result.confidence}, minimum=${confidenceBands.minimum}%). Rerun factory expect ${layer}.`, { cause: result });
}
