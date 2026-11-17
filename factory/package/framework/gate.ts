import type { Building } from "../../flow/domain/validate.ts";
import type { GatePorts } from "../domain/gate.ts";

/** Receives the invocation and presents the application's result. */
export const createGateCommand =
  ({
    environment,
    workingDirectory,
    hookInput,
    projectOf,
    gate,
  }: GatePorts &
    Omit<
      typeof import("../domain/gate.ts"),
      "run"
    >): (typeof import("../domain/gate.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const cwd = hookInput().cwd ?? workingDirectory();
    const verdict = await gate(
      projectOf(environment().CLAUDE_PROJECT_DIR || cwd),
      {
        helper: args.includes("--helper"),
      },
    );
    for (const finding of verdict.findings) console.error(finding);
    return verdict.allowed ? 0 : 2;
  };
