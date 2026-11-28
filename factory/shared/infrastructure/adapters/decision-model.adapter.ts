import { DecisionModelUnavailable } from "../../domain/exceptions/decision-model.exceptions.ts";

export { DecisionModelUnavailable };
export type DecisionQuestion = { name: string; instructions: string; excerpt?: string };
export type DecisionAnswers = Map<string, number>;
type Question = DecisionQuestion;
type Answers = DecisionAnswers;

export interface DecisionClient {
  ask(state: string, questions: Question[]): Promise<Answers>;
}

export type Inspection = {
  answers: Answers;
  issues: string[];
  unreadable: boolean;
};

type PredicateAnswer = {
  type?: unknown;
  name?: unknown;
  probability?: unknown;
};

const REFUSAL = "refusal";

export const inspect = (
  questions: Question[],
  response: unknown,
): Inspection => {
  const raw = (response as { answers?: unknown })?.answers;

  const list: PredicateAnswer[] = Array.isArray(raw)
    ? (raw as PredicateAnswer[])
    : [];

  const byName = new Map(list.map((a) => [a.name, a] as const));
  const answers: Answers = new Map();
  const issues: string[] = [];

  for (const q of questions) {
    const a = byName.get(q.name);

    if (!a) issues.push(`${q.name}: missing answer`);
    else if (a.type === REFUSAL) issues.push(`${q.name}: refused`);
    else if (
      typeof a.probability !== "number" ||
      a.probability < 0 ||
      a.probability > 1
    )
      issues.push(`${q.name}: probability not in [0,1]`);
    else answers.set(q.name, a.probability);
  }

  const ps = [...answers.values()];

  const unreadable =
    ps.length >= 2 && ps.every((p) => Math.abs(p - 0.5) < 0.05);

  return { answers, issues, unreadable };
};

/** The OpenAI Decisions API; `FACTORY_DECISIONS_ENDPOINT` points another provider with the same contract. */
export const DECISIONS_ENDPOINT = "https://api.openai.com/v1/decisions";
const MAX_QUESTIONS = 400;

export type DecisionModelOptions = {
  key: string;
  model: string;
  endpoint?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  onIssue?: (issue: string) => void;
};

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const decisionModelClient = (
  o: DecisionModelOptions,
): DecisionClient & { requests: number } => {
  const doFetch = o.fetch ?? fetch;
  const endpoint = o.endpoint ?? DECISIONS_ENDPOINT;
  const timeoutMs = o.timeoutMs ?? 60_000;

  const client = {
    requests: 0,
    async ask(state: string, questions: Question[]): Promise<Answers> {
      const answers: Answers = new Map();

      for (const group of chunk(questions, MAX_QUESTIONS)) {
        const body = JSON.stringify({
          model: o.model,
          input: state,
          questions: group.map((q) => ({
            type: "predicate",
            name: q.name,
            instructions: q.instructions,
          })),
        });

        const response = await post(body);
        const inspected = inspect(group, response);
        for (const issue of inspected.issues) o.onIssue?.(issue);

        if (inspected.unreadable)
          o.onIssue?.(
            "every answer at ~0.5: the model could not read the state",
          );

        for (const [k, v] of inspected.answers) answers.set(k, v);
      }

      return answers;
    },
  };

  const post = async (body: string): Promise<unknown> => {
    let last = "";
    let cause: unknown;

    for (const attempt of [1, 2]) {
      client.requests++;

      try {
        const r = await doFetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${o.key}`,
            "Content-Type": "application/json",
          },
          body,
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (r.ok) return (await r.json()) as unknown;
        const detail = (await r.text()).slice(0, 500);
        last = `HTTP ${r.status}: ${detail}`;
        cause = r.status;
        if (!(r.status === 429 || r.status >= 500)) break;
      } catch (e) {
        cause = e;
        last = `transport failure: ${e instanceof Error ? e.message : String(e)}`;
      }

      if (attempt === 1) await sleep(2000);
    }

    throw new DecisionModelUnavailable(`decision model: ${last}`, { cause });
  };

  return client;
};
