import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exampleFile } from "../../../factory/quality.ts";
import { assertRubricCase, createRubricCases, expectedRubricVerdict, rubricWarnings, type ScoreResult } from "../../../factory/quality/infrastructure/adapters/rubric-case.adapter.ts";

const row = "S17";
const name = "wrapper-id";
const text = [
  "## S17 · wrapper", "", "### wrapper-id", "",
  "```ts src/owner.ts", "export class Owner {}", "```", "",
  "```ts src/caller.ts", "import { Owner } from './owner';", "```", "",
].join("\n");
let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "factory-rubric-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

function samples(source = text, ask?: (state: string, question: string) => Promise<number>, question = "Is this a wrapper?", model = "fixture") {
  return createRubricCases({ layer: "domain", dir, model, cases: exampleFile.parseExampleText(source, "sample").rubric, questions: new Map([[row, question]]), ask });
}
function record(source: string, sample: string, result: ScoreResult) {
  return exampleFile.recordFindings(source, "sample", new Map(), new Map([[row, new Map([[sample, result]])]]));
}
function check(sample: string, result: ScoreResult) {
  assertRubricCase("domain", row, sample, result, expectedRubricVerdict(sample));
}

describe("Rule: A rubric row is verified by counterexample and by reference", () => {
  it.each([
    [name, "0.95", "target"], [name, "0.90", "warning"], [name, "0.8999", "failed"], [name, "0.01", "failed"],
    ["reference", "0.05", "target"], ["reference", "0.10", "warning"], ["reference", "0.1001", "failed"], ["reference", "0.99", "failed"],
  ])("Recording %s at %s produces %s", async (sample, raw, state) => {
    const source = text.replace("### wrapper-id", "### " + sample);
    const ask = vi.fn(async () => Number(raw));
    const result = await samples(source, ask).judge(row, sample, "record");
    const expected = sample === "reference" ? "no" : "yes";
    expect(result).toMatchObject({ state, expected, replayed: false });
    expect(result.confidence).toBeCloseTo(expected === "yes" ? Number(raw) : 1 - Number(raw));
    expect(ask).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("=== src/owner.ts ==="), "Is this a wrapper?");
    expect(ask.mock.calls[0]).toEqual([expect.stringContaining("=== src/caller.ts ==="), "Is this a wrapper?"]);
    const block = samples(record(source, sample, result)).recorded(row, sample);
    if (state === "failed") {
      expect(() => check(sample, result)).toThrow("minimum=90%");
      expect(block).toBeUndefined();
    } else {
      expect(() => check(sample, result)).not.toThrow();
      expect(block).toMatchObject({ verdict: expected, score: Number(raw), model: "fixture", fingerprint: result.fingerprint });
      expect(rubricWarnings(result)).toHaveLength(state === "warning" ? 1 : 0);
    }
  });
});

describe("Rule: A recorded judgement is replayed without the model", () => {
  it.each([
    ["none", "absent", "0"], ["case", "present", "1"], ["question", "present", "1"], ["model", "present", "1"],
    ["case", "absent", "0"], ["question", "absent", "0"], ["model", "absent", "0"],
  ])("Replaying %s with key %s makes %s calls", async (change, key, calls) => {
    const first = await samples(text, async () => 0.97).judge(row, name, "record");
    const output = record(text, name, first);
    const source = change === "case" ? output.replace("class Owner {}", "class Owner { value = 1; }") : output;
    const question = change === "question" ? "Changed question?" : undefined;
    const model = change === "model" ? "other" : undefined;
    const ask = vi.fn(async () => 0.97);
    const score = samples(source, key === "present" ? ask : undefined, question, model).judge(row, name);
    if (change !== "none" && key === "absent") await expect(score).rejects.toThrow(/S17\/wrapper-id.*factory expect domain/);
    else expect(await score).toMatchObject({ replayed: change === "none", changed: change === "none" ? [] : [change], score: 0.97 });
    expect(ask).toHaveBeenCalledTimes(Number(calls));
    const history = JSON.parse(readFileSync(join(dir, "domain.scores.json"), "utf8"));
    expect(history[row + "/" + name]).toHaveLength(1 + Number(calls));
  });
});

describe("Rule: Every judgement joins a history the report reads", () => {
  it.each([
    ["none", "0.95", "target", "absent"], ["0.97 0.96 0.97", "0.95", "target", "absent"],
    ["0.75", "0.95", "target", "present"], ["0.72", "0.91", "warning", "absent"],
    ["0.70", "0.90", "warning", "present"], ["0.92 0.91 0.93", "0.64", "failed", "present"],
  ])("History %s followed by %s yields %s with drift %s", async (values, score, state, drift) => {
    const history = values === "none" ? [] : values.split(" ").map(Number);
    for (const value of history) await samples(text, async () => value).judge(row, name, "record");
    const result = await samples(text, async () => Number(score)).judge(row, name, "record");
    expect(result).toMatchObject({ state, drift: drift === "present", history });
    const saved = JSON.parse(readFileSync(join(dir, "domain.scores.json"), "utf8"));
    expect(saved[row + "/" + name].map((item: { score: number }) => item.score)).toEqual([...history, Number(score)]);
    expect(rubricWarnings(result)).toHaveLength(Number(state === "warning") + Number(drift === "present"));
    if (state === "failed") expect(() => check(name, result)).toThrow("minimum=90%");
    else expect(() => check(name, result)).not.toThrow();
  });
});

it("reuses the latest matching observation for recording and retains the complete history", async () => {
  await samples(text, async () => 0.2).judge(row, name, "record");
  const revised = text.replace("class Owner {}", "class Owner { id = 1; }");
  for (let index = 0; index < 2; index++) await samples(revised, async () => 0.98).judge(row, name, "record");
  const file = join(dir, "domain.scores.json");
  const observations = JSON.parse(readFileSync(file, "utf8"));
  observations[row + "/" + name][1].baseline = { by: "person", reason: "Earlier fixture approval." };
  writeFileSync(file, JSON.stringify(observations));
  await expect(samples(revised).judge(row, name)).rejects.toThrow("factory expect");
  const latest = await samples(revised).judge(row, name, "record-changed");
  expect(latest).toMatchObject({ state: "target", drift: true, replayed: true, history: [0.2, 0.98] });
  expect(latest.delta).toBeCloseTo(0.39);
  expect(samples(record(revised, name, latest)).recorded(row, name)?.score).toBe(0.98);
  for (const stale of [samples(text), samples(revised, undefined, "Changed?"), samples(revised, undefined, undefined, "other")])
    await expect(stale.judge(row, name, "record-changed")).rejects.toThrow("factory expect");
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(observations);
});

it("rechecks a legacy expectation against the fixed confidence minimum", async () => {
  const current = await samples(text, async () => 1).judge(row, name, "record");
  const legacy = record(text, name, current).replace("fixture yes 1", "fixture yes 0.85");
  rmSync(join(dir, "domain.scores.json"));
  const replay = await samples(legacy).judge(row, name);
  expect(replay.replayed).toBe(true);
  expect(() => check(name, replay)).toThrow("minimum=90%");
});

it("preserves a corrupt history when an append fails", async () => {
  const file = join(dir, "domain.scores.json");
  const input = JSON.stringify({ [row + "/" + name]: [{ score: "yes" }] });
  writeFileSync(file, input);
  await expect(samples(text, async () => 1).judge(row, name, "record")).rejects.toThrow("Invalid rubric score history");
  expect(readFileSync(file, "utf8")).toBe(input);
});
