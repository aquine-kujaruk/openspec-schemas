// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { DispatchWorkOrderUseCase } from "../../../factory/production/application/use-cases/dispatch-work-order.use-case.ts";
import { InMemoryDispatchRepository } from "./repositories/in-memory-dispatch.repository.ts";

export function createSteps() {
  const repository = new InMemoryDispatchRepository();
  const dispatch = new DispatchWorkOrderUseCase(repository);
  let result: Awaited<ReturnType<DispatchWorkOrderUseCase["execute"]>>;

  return {
    // Context
    projectRunner(runner: string): void {
      if (runner === "none" || runner === "session") return;
      const command = /^command `(.+)`$/.exec(runner)?.[1];
      expect(command, runner).toBeDefined();
      const status = /; exit (\d+)$/.exec(command!)?.[1];
      repository.configureRunner({ command: command! }, status ? Number(status) : 0);
    },
    readyChange(change: string): void {
      repository.seed(change, { ready: true, findings: [] });
    },
    changeInState(change: string, state: string): void {
      if (state === "ready") {
        repository.seed(change, { ready: true, findings: [] });
        return;
      }
      expect(["not approved", "listing an open question"]).toContain(state);
      repository.seed(change, {
        ready: false,
        findings: [{ rule: "work-order-not-ready", message: state }],
      });
    },

    // Action
    async handOff(change: string): Promise<void> {
      result = await dispatch.execute(change);
    },

    // Outcome
    handoffGives(outcome: string): void {
      if (outcome.startsWith("build ")) {
        expect(result.said.join("\n")).toContain(outcome);
        expect(repository.commands).toEqual([]);
        return;
      }
      const received = /^the command received (\S+)$/.exec(outcome)?.[1];
      expect(received, outcome).toBeDefined();
      expect(repository.commands).toHaveLength(1);
      expect(repository.commands[0]?.split(";")[0]).toBe(`remote ${received}`);
    },
    handoffExitStatus(status: string): void {
      expect(result.status, result.said.join("\n")).toBe(Number(status));
    },
    runnerReceived(handed: string): void {
      expect(repository.commands).toEqual(handed === "nothing" ? [] : [`remote ${handed}`]);
    },
  };
}
