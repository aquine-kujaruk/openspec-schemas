import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import {
  change as writeChange,
  scratchProject,
  write,
} from "../shared/infrastructure/adapters/testing.ts";
import type { HandedOff } from "./domain/handoff.ts";
import { handoff as flowhandoff } from "../flow.ts";
const { handoff } = flowhandoff;

/**
 * Each scenario hands a change of a scratch project off. A runner the scenario writes as
 * `command \`remote …\`` becomes a shell command that appends the name it received to a file of
 * the project, so the scenario reads what the runner was handed.
 */
const RECEIVED = "received.txt";

export function createSteps() {
  const root = scratchProject("handoff-");
  let result: HandedOff | undefined;

  const runnerConfig = (runner: string): string => {
    if (runner === "none")
      return 'export default { schema: "clean-backend" };\n';
    if (runner === "session")
      return 'export default { schema: "clean-backend", implement: { runner: "session" } };\n';
    const command = /^command `remote (.*)`$/.exec(runner)?.[1];
    if (command === undefined) throw new Error(`unknown runner: ${runner}`);
    const shell = `printf '%s\\n' ${command.replace(/;.*/, "")} >> ${RECEIVED}${command.includes(";") ? command.slice(command.indexOf(";")) : ""}`;
    return `export default { schema: "clean-backend", implement: { runner: { command: ${JSON.stringify(shell)} } } };\n`;
  };

  return {
    // Context
    async projectRunner(runner: string): Promise<void> {
      write(root, "factory.config.ts", runnerConfig(runner));
    },
    async readyChange(change: string): Promise<void> {
      writeChange(root, change);
    },
    async changeInState(change: string, state: string): Promise<void> {
      if (state === "ready") writeChange(root, change);
      else if (state === "not approved")
        writeChange(root, change, { parts: { approved: null } });
      else if (state === "listing an open question")
        writeChange(root, change, {
          parts: { questions: ["Which currency?"] },
        });
      else throw new Error(`unknown state: ${state}`);
    },

    // Action
    async handOff(change: string): Promise<void> {
      result = await handoff(root, change);
    },

    // Outcome
    async handoffGives(outcome: string): Promise<void> {
      const session = /^build (\S+) in this session$/.exec(outcome);
      if (session)
        return expect(result!.said.join("\n")).toContain(
          `build ${session[1]} in this session`,
        );
      const received = /^the command received (\S+)$/.exec(outcome);
      if (!received) throw new Error(`unknown outcome: ${outcome}`);
      expect(
        readFileSync(join(root, RECEIVED), "utf8").trim().split("\n"),
      ).toEqual([received[1]]);
    },
    async handoffExitStatus(status: string): Promise<void> {
      expect(result!.status, result!.said.join("\n")).toBe(Number(status));
    },
    async runnerReceived(handed: string): Promise<void> {
      const file = join(root, RECEIVED);
      if (handed === "nothing") return expect(existsSync(file)).toBe(false);
      expect(readFileSync(file, "utf8").trim().split("\n")).toEqual([handed]);
    },
  };
}
