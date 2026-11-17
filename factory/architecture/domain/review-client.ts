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
export type Inspection = {
  answers: Answers;
  issues: string[];
  unreadable: boolean;
};
/**
 * Contract validation, as `decide.py` does it: every question answered, each probability in [0,1],
 * a refusal or a missing answer reported as an issue and left out of the answers. When every answer
 * sits at ~0.5 the model could not read the state (`unreadable`).
 */
export declare const inspect: (
  questions: Question[],
  response: unknown,
) => Inspection;
export declare const DECISIONS_ENDPOINT = "https://api.openai.com/v1/decisions";
export type OpenAiClientOptions = {
  key: string;
  model: string;
  endpoint?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  /** Called with every inspection issue (the command prints them to stderr). */
  onIssue?: (issue: string) => void;
};
/**
 * The OpenAI Decisions API. Retries once on 429, 5xx or a transport failure, never on another 4xx;
 * the key is sent in the header and never written anywhere else.
 */
export declare const openAiClient: (
  o: OpenAiClientOptions,
) => DecisionClient & {
  requests: number;
};
