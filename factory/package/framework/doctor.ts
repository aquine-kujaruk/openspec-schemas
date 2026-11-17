import type { Installed } from "../../shared/domain/types.ts";
import type { DoctorPorts } from "../domain/doctor.ts";

/** Receives the invocation and presents the application's result. */
export const createDoctorCommand =
  ({
    join,
    INSTALLED,
    PROJECT_ROOT,
    SETUP_ASSETS,
    doctor,
  }: DoctorPorts &
    Omit<
      typeof import("../domain/doctor.ts"),
      "run"
    >): (typeof import("../domain/doctor.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const report = await doctor(PROJECT_ROOT, { fix: args.includes("--fix") });
    if (!report) {
      console.error(
        `no installed package found: install one with the agent package manager, so that an agent's skills hold ${join(SETUP_ASSETS, INSTALLED)}`,
      );
      return 2;
    }
    for (const item of report.items)
      console.log(
        `${item.report}: ${item.requirement}${item.agent ? ` for ${item.agent}` : ""} — ${item.detail}`,
      );
    if (!report.items.length) console.log("nothing is lacking");
    for (const note of report.notes) console.log(`note: ${note}`);
    for (const suspect of report.suspects) console.log(`suspect: ${suspect}`);
    return report.status;
  };
