import { capture, PROJECT_ROOT } from "../toolkit/paths.ts";
import { architecture } from "../toolkit/project.ts";
import { type DecisionClient, openAiClient } from "./client.ts";
import { loadEnv } from "./env.ts";
import { readRecord, writeRecord } from "./record.ts";
import { DEFAULTS, review } from "./review.ts";
import { readRubric } from "./rubric.ts";

/**
 * `factory review`: the fourth tool. Runs after the deterministic ones (they spend no tokens), is
 * never part of `factory check`, and exits 0 whatever it finds: its output is advice with a
 * probability. Exit 2 when the key variable is not set, 3 when the model cannot be reached.
 */
export type MainOptions = {
  root: string;
  env: Record<string, string | undefined>;
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  /** The rubric file; the command's own by default. */
  rubric?: string;
  /** Builds the client from the key; the real one by default. */
  client?: (key: string) => DecisionClient;
};

const headCommit = (root: string): string | null => {
  const r = capture("git", ["rev-parse", "HEAD"], { cwd: root });
  return r.status === 0 ? r.stdout.trim() : null;
};

export const main = async (o: MainOptions): Promise<number> => {
  const config = architecture.review ?? DEFAULTS;
  const key = o.env[config.keyVariable];
  if (!key) {
    o.stderr(
      `${config.keyVariable} is not set: factory review needs the decision model's key in the environment or in .env`,
    );
    return 2;
  }
  const rows = readRubric(o.root, o.rubric);
  const client =
    o.client?.(key) ??
    openAiClient({ key, model: config.model, onIssue: (i) => o.stderr(`model: ${i}`) });
  try {
    const result = await review({
      root: o.root,
      rows,
      client,
      config,
      record: readRecord(o.root),
      commit: headCommit(o.root),
    });
    writeRecord(o.root, result.record);
    for (const line of result.lines) o.stdout(line);
    return 0;
  } catch (e) {
    o.stderr(e instanceof Error ? e.message : String(e));
    return 3;
  }
};

export const run = (): Promise<number> =>
  main({
    root: PROJECT_ROOT,
    env: loadEnv(PROJECT_ROOT, process.env),
    stdout: console.log,
    stderr: console.error,
  });

export { loadEnv };
