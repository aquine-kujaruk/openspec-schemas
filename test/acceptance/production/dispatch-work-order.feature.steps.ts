// Synced by feat2test. Matching step implementations are preserved.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DispatchAdapter } from "../../../factory/production/infrastructure/adapters/dispatch.adapter.ts";
import { DispatchRepositoryImplementation } from "../../../factory/production/infrastructure/repository-implementations/dispatch.repository-implementation.ts";
import { expect } from "vitest";
import { DispatchWorkOrderUseCase } from "../../../factory/production/application/use-cases/dispatch-work-order.use-case.ts";
import { InMemoryDispatchRepository } from "./repositories/in-memory-dispatch.repository.ts";

export function createSteps() {
  const repository = new InMemoryDispatchRepository();
  const dispatch = new DispatchWorkOrderUseCase(repository);
  let result: Awaited<ReturnType<DispatchWorkOrderUseCase["execute"]>>;

  let targetLabel: string;
  let sessionLabel: string;
  let target: string;

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
    approvedCheckout(checkout: string): void {
      targetLabel = checkout;
    },
    receivingSessionCheckout(session: string): void {
      sessionLabel = session;
    },

    // Action
    async handOff(change: string): Promise<void> {
      result = await dispatch.execute(change);
    },
    async selectImplementationCheckout(): Promise<void> {
      const scratch = mkdtempSync(join(tmpdir(), "dispatch-"));
      const worktree = join(scratch, "worktree");
      const git = (...args: string[]) => execFileSync("git", args, { cwd: scratch });
      try {
        git("init", "-q");
        git("-c", "user.name=test", "-c", "user.email=test@example.test", "commit", "--allow-empty", "-qm", "plan");
        git("worktree", "add", "-q", "--detach", worktree);
        target = targetLabel === "project root" ? scratch : worktree;
        const session = sessionLabel === "project root" ? scratch : worktree;
        const adapter = new DispatchAdapter(target, async () => ({ ready: true, findings: [] }), async () => "session");
        result = await new DispatchWorkOrderUseCase(new DispatchRepositoryImplementation(adapter)).execute("add-orders", session);
      } finally {
        rmSync(scratch, { recursive: true, force: true });
      }
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
    checkoutHandoffAction(action: string): void {
      expect(result.said).toContain(`Approved checkout: ${target}`);
      const matches = action === "continue in this session";
      expect(result.status).toBe(matches ? 0 : 1);
      expect(result.said.join("\n")).toContain(matches ? "build add-orders in this session" : `Bind the implementation to ${target}`);
    },
  };
}
