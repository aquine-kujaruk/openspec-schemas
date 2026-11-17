import type { Runner } from "../../shared/domain/config.ts";
import type { HandoffPorts } from "../domain/handoff.ts";

/** Receives the invocation and presents the application's result. */
export const createHandoffCommand =
  ({
    PROJECT_ROOT,
    handoff,
  }: HandoffPorts &
    Omit<
      typeof import("../domain/handoff.ts"),
      "run"
    >): (typeof import("../domain/handoff.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const name = args.find((a) => !a.startsWith("--"));
    if (!name) {
      console.error("Name the change to hand off: factory handoff <change>");
      return 2;
    }
    const { status, said } = await handoff(PROJECT_ROOT, name);
    (status === 0 ? console.log : console.error)(said.join("\n"));
    return status;
  };
