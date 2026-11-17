import type { DecisionClient } from "../domain/review-client.ts";
import type { ReviewCliPorts } from "../domain/review-cli.ts";

/** Receives the invocation and presents the application's result. */
export const createReviewCliCommand =
  ({
    environment,
    PROJECT_ROOT,
    loadEnv,
    main,
  }: ReviewCliPorts &
    Omit<
      typeof import("../domain/review-cli.ts"),
      "run"
    >): (typeof import("../domain/review-cli.ts"))["run"] =>
  (): Promise<number> =>
    main({
      root: PROJECT_ROOT,
      env: loadEnv(PROJECT_ROOT, environment()),
      stdout: console.log,
      stderr: console.error,
    });
