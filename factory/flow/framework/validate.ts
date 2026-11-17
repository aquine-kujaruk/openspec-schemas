import type { Change } from "../../shared/domain/change.ts";
import type { Plan } from "../../shared/domain/plan.ts";
import type { Finding } from "../../repository/domain/validation.ts";
import type { ValidatePorts } from "../domain/validate.ts";

/** Receives the invocation and presents the application's result. */
export const createValidateCommand =
  ({
    activeChanges,
    PROJECT_ROOT,
    NotValidatable,
    validateChange,
  }: ValidatePorts &
    Omit<
      typeof import("../domain/validate.ts"),
      "validate"
    >): (typeof import("../domain/validate.ts"))["validate"] =>
  async (args: string[]): Promise<number> => {
    const [name] = args;
    if (!name) {
      console.error(
        `Name the change to validate. Changes: ${activeChanges(PROJECT_ROOT).join(", ") || "none"}`,
      );
      return 2;
    }
    try {
      const verdict = await validateChange(PROJECT_ROOT, name);
      console.log(
        `${verdict.ready ? "ready" : "not ready"}: ${name} (${verdict.schema})`,
      );
      for (const f of verdict.findings)
        console.log(`- [${f.rule}] ${f.message}`);
      return verdict.ready ? 0 : 1;
    } catch (e) {
      if (!(e instanceof NotValidatable)) throw e;
      console.error(e.message);
      return 2;
    }
  };
