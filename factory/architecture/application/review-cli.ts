import type { MainOptions } from "../domain/review-cli.ts";
import type { DecisionClient } from "../domain/review-client.ts";
import type { ReviewCliPorts } from "../domain/review-cli.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createReviewCli = ({
  environment,
  capture,
  PROJECT_ROOT,
  architecture,
  RUBRICS,
  openAiClient,
  loadEnv,
  readRecord,
  writeRecord,
  DEFAULTS,
  review,
  readRubric,
}: ReviewCliPorts): Omit<typeof import("../domain/review-cli.ts"), "run"> => {
  /**
   * `factory review`: the fourth tool. Runs after the deterministic ones (they spend no tokens), is
   * never part of `factory check`, and exits 0 whatever it finds: its output is advice with a
   * probability. Exit 2 when the key variable is not set, 3 when the model cannot be reached.
   */

  const headCommit = (root: string): string | null => {
    const r = capture("git", ["rev-parse", "HEAD"], { cwd: root });
    return r.status === 0 ? r.stdout.trim() : null;
  };

  const main = async (o: MainOptions): Promise<number> => {
    const config = architecture.review ?? DEFAULTS;
    const key = o.env[config.keyVariable];
    if (!key) {
      o.stderr(
        `${config.keyVariable} is not set: factory review needs the decision model's key in the environment or in .env`,
      );
      return 2;
    }
    const rubric = o.rubric ?? RUBRICS;
    if (![rubric].flat().length) {
      o.stderr(
        "the schema this project is checked with has no rubric: there is nothing to review",
      );
      return 2;
    }
    const rows = readRubric(o.root, rubric);
    const client =
      o.client?.(key) ??
      openAiClient({
        key,
        model: config.model,
        onIssue: (i) => o.stderr(`model: ${i}`),
      });
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
  return { main, loadEnv };
};
