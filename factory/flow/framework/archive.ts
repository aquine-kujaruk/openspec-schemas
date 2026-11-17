import type { Block } from "../../shared/domain/plan.ts";
import type { ArchivePorts } from "../domain/archive.ts";

/** Receives the invocation and presents the application's result. */
export const createArchiveCommand =
  ({
    DEVELOPING,
    PROJECT_ROOT,
    self,
    archive,
  }: ArchivePorts &
    Omit<
      typeof import("../domain/archive.ts"),
      "run"
    >): (typeof import("../domain/archive.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const name = args.find((a) => !a.startsWith("--"));
    const report = await archive(PROJECT_ROOT, name);
    for (const r of report)
      console.log(
        r.place === "archived"
          ? `archived: ${r.change} as ${r.as}`
          : `still active: ${r.change} — ${r.reason}`,
      );
    if (!report.length) console.log("no active change");
    if (report.some((r) => r.place === "archived")) {
      // The repository that develops the command is no product: there, only what is generated is checked.
      const checks = self(
        PROJECT_ROOT,
        DEVELOPING ? ["generate", "--check"] : ["check"],
      );
      console.log(
        checks.status === 0
          ? "every check passes"
          : `the checks fail:\n${checks.output}`,
      );
      if (checks.status !== 0) return 1;
    }
    return name && report.some((r) => r.place !== "archived") ? 1 : 0;
  };
