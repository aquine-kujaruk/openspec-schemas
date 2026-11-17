import type { Product } from "../../repository/domain/products.ts";
import type { FactoryConfig } from "../../shared/domain/types.ts";
import type { Building } from "../../flow/domain/validate.ts";
import type { GuardPorts } from "../domain/guard.ts";

/** Receives the invocation and presents the application's result. */
export const createGuardCommand =
  ({
    environment,
    workingDirectory,
    guard,
    filesOf,
    projectOf,
    hookInput,
  }: GuardPorts &
    Omit<
      typeof import("../domain/guard.ts"),
      "run"
    >): (typeof import("../domain/guard.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const input = args.length ? {} : hookInput();
    const cwd = input.cwd ?? workingDirectory();
    const root = projectOf(environment().CLAUDE_PROJECT_DIR || cwd);
    const refusals = await guard(
      root,
      args.length ? args : filesOf(input),
      cwd,
    );
    for (const refusal of refusals) console.error(refusal.reason);
    return refusals.length ? 2 : 0;
  };
