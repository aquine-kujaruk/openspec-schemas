import type { HandedOff } from "../domain/handoff.ts";
import type { Runner } from "../../shared/domain/config.ts";
import type { HandoffPorts } from "../domain/handoff.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createHandoff = ({
  spawnSync,
  PROJECT_ROOT,
  readProjectConfig,
  NotValidatable,
  validateChange,
}: HandoffPorts): Omit<typeof import("../domain/handoff.ts"), "run"> => {
  /** What a handoff did: its exit status and what it says the agent does next. */

  /**
   * Hands the change `name` of the project at `root` to the runner the project configures, once
   * validation reports it ready (the person approved it among the rest). With no runner, or
   * `session`, it is built in this session; with a command, the command runs with the change's name
   * in place of `{change}` and its status is the handoff's.
   */
  const handoff = async (root: string, name: string): Promise<HandedOff> => {
    let verdict;
    try {
      verdict = await validateChange(root, name);
    } catch (e) {
      if (e instanceof NotValidatable) return { status: 1, said: [e.message] };
      throw e;
    }
    if (!verdict.ready)
      return {
        status: 1,
        said: [
          `${name} is not ready to hand off:`,
          ...verdict.findings.map((f) => `- [${f.rule}] ${f.message}`),
        ],
      };
    const runner: Runner =
      (await readProjectConfig(root))?.implement?.runner ?? "session";
    if (runner === "session")
      return {
        status: 0,
        said: [
          `build ${name} in this session: follow the implement skill, starting with pnpm exec factory implement ${name}`,
        ],
      };
    const command = runner.command.replaceAll("{change}", name);
    const ran = spawnSync("sh", ["-c", command], {
      cwd: root,
      stdio: "inherit",
    });
    return {
      status: ran.status ?? 1,
      said: [
        ran.status === 0
          ? `handed ${name} to: ${command}. Tell the person where it is being built and stop.`
          : `the runner failed (status ${ran.status ?? "killed"}): ${command}. Tell the person.`,
      ],
    };
  };
  return { handoff };
};
