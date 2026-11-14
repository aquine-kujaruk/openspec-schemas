import { describe, expect, it } from "vitest";
import { inspect, openAiClient, type Question } from "./client.ts";

const q = (name: string): Question => ({ name, instructions: `Is ${name} present?`, excerpt: "" });

/** A response as the Decisions API returns it, recorded once. */
const RECORDED = {
  id: "dec_01",
  model: "gpt-6-luna",
  answers: [
    { type: "predicate", name: "S09_f0", probability: 0.93 },
    { type: "predicate", name: "S09_f1", probability: 0.07 },
    { type: "refusal", name: "S09_f2" },
    { type: "predicate", name: "S09_f3", probability: 1.4 },
  ],
  usage: { input_tokens: 476, input_tokens_details: { cached_tokens: 0 } },
};

describe("decision client", () => {
  it("parses the probabilities of a recorded response and reports the rest as issues", () => {
    const { answers, issues, unreadable } = inspect(
      ["S09_f0", "S09_f1", "S09_f2", "S09_f3", "S09_f4"].map(q),
      RECORDED,
    );
    expect([...answers]).toEqual([
      ["S09_f0", 0.93],
      ["S09_f1", 0.07],
    ]);
    expect(issues).toEqual([
      "S09_f2: refused",
      "S09_f3: probability not in [0,1]",
      "S09_f4: missing answer",
    ]);
    expect(unreadable).toBe(false);
  });
  it("reports a missing answer as no answer, never as zero", () => {
    const { answers } = inspect([q("a")], { answers: [] });
    expect(answers.has("a")).toBe(false);
    expect(answers.get("a")).toBeUndefined();
  });
  it("flags a state the model could not read: every answer at ~0.5", () => {
    const { unreadable } = inspect([q("a"), q("b")], {
      answers: [
        { type: "predicate", name: "a", probability: 0.49 },
        { type: "predicate", name: "b", probability: 0.52 },
      ],
    });
    expect(unreadable).toBe(true);
  });
  it("posts predicate questions with the key in the header and retries once on 5xx", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    let n = 0;
    const fetchFake: typeof fetch = async (url, init) => {
      requests.push({ url: url instanceof Request ? url.url : url.toString(), init: init! });
      n++;
      return n === 1
        ? new Response("boom", { status: 503 })
        : new Response(JSON.stringify(RECORDED), { status: 200 });
    };
    const issues: string[] = [];
    const client = openAiClient({
      key: "sk-test",
      model: "gpt-6-luna",
      fetch: fetchFake,
      onIssue: (i) => issues.push(i),
    });
    const answers = await client.ask("the state", [q("S09_f0"), q("S09_f2")]);
    expect(answers.get("S09_f0")).toBe(0.93);
    expect(issues).toEqual(["S09_f2: refused"]);
    expect(client.requests).toBe(2);
    expect(requests[0].url).toBe("https://api.openai.com/v1/decisions");
    expect((requests[0].init.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk-test",
    );
    expect(JSON.parse(requests[1].init.body as string)).toEqual({
      model: "gpt-6-luna",
      input: "the state",
      questions: [
        { type: "predicate", name: "S09_f0", instructions: "Is S09_f0 present?" },
        { type: "predicate", name: "S09_f2", instructions: "Is S09_f2 present?" },
      ],
    });
  }, 10_000);
  it("fails without retrying on another 4xx and never leaks the key", async () => {
    const fetchFake: typeof fetch = async () => new Response("bad request", { status: 400 });
    const client = openAiClient({ key: "sk-secret", model: "gpt-6-luna", fetch: fetchFake });
    await expect(client.ask("s", [q("a")])).rejects.toThrow("HTTP 400: bad request");
    await expect(client.ask("s", [q("a")])).rejects.not.toThrow("sk-secret");
    expect(client.requests).toBe(2);
  });
});
