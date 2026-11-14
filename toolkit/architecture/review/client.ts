/**
 * The decision client: typed yes/no questions over a text state, answered with calibrated
 * probabilities and nothing else (no text, no lines: location comes only from what the command
 * sends). The request shape follows the `decision-tool` skill (`decide.py`): one state, several
 * single-property questions, answers inspected before use. The provider is the OpenAI Decisions
 * API (`POST /v1/decisions`, `predicate` questions).
 */
export type Question = {
  /** Unique within a request; echoed in the answer. */
  name: string;
  /** The whole meaning: the model reads only this and the state. */
  instructions: string;
  /** The text the question is about. The model never sees it apart from the state; a client that judges without a model (tests) reads it. */
  excerpt: string;
};

/** Question name → P(yes). A question with no usable answer is absent, never 0. */
export type Answers = Map<string, number>;

export interface DecisionClient {
  ask(state: string, questions: Question[]): Promise<Answers>;
}

export type Inspection = { answers: Answers; issues: string[]; unreadable: boolean };

type PredicateAnswer = { type?: unknown; name?: unknown; probability?: unknown };

/**
 * Contract validation, as `decide.py` does it: every question answered, each probability in [0,1],
 * a refusal or a missing answer reported as an issue and left out of the answers. When every answer
 * sits at ~0.5 the model could not read the state (`unreadable`).
 */
export const inspect = (questions: Question[], response: unknown): Inspection => {
  const raw = (response as { answers?: unknown })?.answers;
  const list: PredicateAnswer[] = Array.isArray(raw) ? (raw as PredicateAnswer[]) : [];
  const byName = new Map(list.map((a) => [a.name, a] as const));
  const answers: Answers = new Map();
  const issues: string[] = [];
  for (const q of questions) {
    const a = byName.get(q.name);
    if (!a) issues.push(`${q.name}: missing answer`);
    else if (a.type === "refusal") issues.push(`${q.name}: refused`);
    else if (typeof a.probability !== "number" || a.probability < 0 || a.probability > 1)
      issues.push(`${q.name}: probability not in [0,1]`);
    else answers.set(q.name, a.probability);
  }
  const ps = [...answers.values()];
  const unreadable = ps.length >= 2 && ps.every((p) => Math.abs(p - 0.5) < 0.05);
  return { answers, issues, unreadable };
};

export const DECISIONS_ENDPOINT = "https://api.openai.com/v1/decisions";
/** The API takes at most this many questions per request. */
const MAX_QUESTIONS = 400;

export type OpenAiClientOptions = {
  key: string;
  model: string;
  endpoint?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  /** Called with every inspection issue (the command prints them to stderr). */
  onIssue?: (issue: string) => void;
};

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The OpenAI Decisions API. Retries once on 429, 5xx or a transport failure, never on another 4xx;
 * the key is sent in the header and never written anywhere else.
 */
export const openAiClient = (o: OpenAiClientOptions): DecisionClient & { requests: number } => {
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
          o.onIssue?.("every answer at ~0.5: the model could not read the state");
        for (const [k, v] of inspected.answers) answers.set(k, v);
      }
      return answers;
    },
  };
  const post = async (body: string): Promise<unknown> => {
    let last = "";
    for (const attempt of [1, 2]) {
      client.requests++;
      try {
        const r = await doFetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${o.key}`, "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (r.ok) return (await r.json()) as unknown;
        const detail = (await r.text()).slice(0, 500);
        last = `HTTP ${r.status}: ${detail}`;
        if (!(r.status === 429 || r.status >= 500)) break;
      } catch (e) {
        last = `transport failure: ${e instanceof Error ? e.message : String(e)}`;
      }
      if (attempt === 1) await sleep(2000);
    }
    throw new Error(`decision model: ${last}`);
  };
  return client;
};
