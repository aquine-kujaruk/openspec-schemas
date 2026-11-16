import { describe, expect, it } from "vitest";
import { type E2eRun, runE2e, testsOf } from "./test.ts";

/** Spec: `implementer`, "The end-to-end tests of a web product run through the command". */
describe("the end-to-end tests of a web product run through the command", () => {
  const report = {
    run: {
      results: [
        { file: "test/e2e/orders/cancel-order.e2e.ts", titlePath: ["the person cancels a pending order"], status: "passed" },
        { file: "test/e2e/orders/list-orders.e2e.ts", titlePath: ["orders", "newest first"], status: "flaky" },
        { file: "test/e2e/orders/pay-order.e2e.ts", titlePath: ["the person pays"], status: "timed-out" },
        { file: "test/e2e/orders/refund.e2e.ts", titlePath: ["later"], status: "skipped" },
      ],
    },
  };

  it.each([
    ["web", 0, 0],
    ["web", 1, 1],
    ["web", 2, 2],
    ["web", 3, 2],
    ["node", 0, 2],
  ])("on a %s product, the tool exiting %i makes the command exit %i", (platform, tool, status) => {
    const asked: Array<Record<string, string | undefined>> = [];
    const run = (_cwd: string, _root: string, env: NodeJS.ProcessEnv): E2eRun => (
      asked.push(env), { status: tool, output: "", report }
    );
    const r = runE2e({ platform, cwd: "/project", root: "test/e2e" }, run);
    expect(r.status).toBe(status);
    if (platform === "web") expect(asked[0]?.E2E_TELEMETRY_DISABLED).toBe("1");
    else expect(asked).toEqual([]);
    if (status === 2) expect(r.output).toMatch(/end-to-end|only a web product/);
  });

  it("reads each test of the report: passed or flaky passes, skipped is left out, any other fails", () => {
    expect(testsOf(report)).toEqual([
      { test: "cancel-order · the person cancels a pending order", result: "passed" },
      { test: "list-orders · newest first", result: "passed" },
      { test: "pay-order · the person pays", result: "failed" },
    ]);
    expect(testsOf(undefined)).toEqual([]);
  });
});
