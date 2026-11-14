import type { Answers, DecisionClient, Question } from "./client.ts";

export type Call = { state: string; questions: Question[] };

/** A client that judges without a model: `judge` gives P(yes) from the question's excerpt. */
export const fakeClient = (
  judge: (q: Question, state: string) => number | undefined,
): DecisionClient & { calls: Call[] } => {
  const calls: Call[] = [];
  return {
    calls,
    async ask(state, questions) {
      calls.push({ state, questions });
      const answers: Answers = new Map();
      for (const q of questions) {
        const p = judge(q, state);
        if (p !== undefined) answers.set(q.name, p);
      }
      return answers;
    },
  };
};

/** Yes (0.95) on every excerpt that holds the marker, no (0.05) elsewhere. */
export const markerClient = (marker = "SMELL") =>
  fakeClient((q) => (q.excerpt.includes(marker) ? 0.95 : 0.05));

/** The same probability for every question of the row, no answer for other rows. */
export const constantClient = (row: string, p: number) =>
  fakeClient((q) => (q.name.startsWith(`${row}_`) ? p : 0));

/** Stage-1 file paths a client was asked about, without repeats. */
export const filesAsked = (calls: Call[]): string[] => [
  ...new Set(
    calls.flatMap((c) =>
      c.questions.flatMap((q) => /^Consider only the file (\S+)\./.exec(q.instructions)?.[1] ?? []),
    ),
  ),
];
