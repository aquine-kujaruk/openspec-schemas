import { createHash } from "node:crypto";
import { join } from "node:path";
import type { Case, Judgement } from "./sample-file-contract.adapter.ts";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";

import type { RubricObservation as Observation } from "../acl/rubric-history.acl.ts";
import { FileRubricHistoryAdapter } from "./file-rubric-history.adapter.ts";
export const expectedRubricVerdict = (name: string): "yes" | "no" =>
  name === "reference" || name.startsWith("reference.") ? "no" : "yes";

const ConfidenceState = { Target: "target", Warning: "warning", Failed: "failed" } as const;

export type ScoreResult = Judgement & {
  expected: "yes" | "no";
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
const reaches = (score: number, expected: "yes" | "no", percent: number) =>
  expected === "yes" ? score >= percent / 100 : score <= (100 - percent) / 100;

export const canRecordRubricScore = (name: string, score: number) =>
  reaches(score, expectedRubricVerdict(name), confidenceBands.minimum);

function compare(observation: Observation, previous: Observation[], fingerprint: string, name: string, replayed: boolean): ScoreResult {
  const { score, model } = observation;
  const expected = expectedRubricVerdict(name);
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
  const recorded = (row: string, name: string) => options.cases.get(row)?.get(name)?.judgement;

  async function judge(row: string, name: string, mode: "test" | "record" | "record-changed" = "test"): Promise<ScoreResult> {
    const sample = options.cases.get(row)?.get(name);
    const question = options.questions.get(row);
    const id = row + "/" + name;
    if (!sample?.files.size || !question) throw new QualityException(`${options.layer} ${id}: missing files or accepted rubric question`, { cause: id });
    const files = [...sample.files.entries()].sort(([a], [b]) => a.localeCompare(b));
    const identity = { model: options.model, question: hash(question), case: hash(JSON.stringify(files)) };
    const fingerprint = hash(JSON.stringify(identity));
    if (mode !== "record") {
      const previous = history.read(id);
      const latest = previous.at(-1);
      const recordedMatch = sample.judgement?.fingerprint === fingerprint;
      const latestMatch = latest && latest.model === identity.model && latest.question === identity.question && latest.case === identity.case;
      if (latestMatch && (recordedMatch || mode === "record-changed"))
        return compare(latest, previous.slice(0, -1), fingerprint, name, true);
      if (recordedMatch) return compare({ ...identity, score: sample.judgement!.score, date: "" }, previous, fingerprint, name, true);
    }
    if (!options.ask)
      throw new QualityException(`${options.layer} ${id}: missing or stale judgement. Configure the model key and run factory expect ${options.layer}.`, { cause: id });
    const state = files.map(([path, code]) => `=== ${path} ===\n${code}`).join("\n\n");
    const score = await options.ask(state, question);
    if (!Number.isFinite(score) || score < 0 || score > 1)
      throw new QualityException(`${options.layer} ${id}: the model returned no valid probability`, { cause: score });
    const observation = { ...identity, score, date: new Date().toISOString() };
    const previous = await history.append(id, observation);
    return compare(observation, previous, fingerprint, name, false);
  }
  return { judge, recorded };
}

export function assertRubricCase(layer: string, row: string, name: string, result: ScoreResult, expected: "yes" | "no") {
  if (result.state === ConfidenceState.Failed || result.verdict !== expected)
    throw new QualityException(`${layer} ${row}/${name}: expected ${expected}, received ${result.verdict} (p=${result.score}, confidence=${result.confidence}, minimum=${confidenceBands.minimum}%). Rerun factory expect ${layer}.`, { cause: result });
}
