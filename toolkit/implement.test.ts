import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isStarted } from "./change.ts";
import { gate } from "./gate.ts";
import { guard } from "./guard.ts";
import { start } from "./implement.ts";
import { change } from "./testing.ts";
import { changesInImplementation } from "./validate.ts";

/** Spec: `flow/implement`, "Only a ready change is implemented"; `package/write-guard`, what in implementation means. */
const project = () => mkdtempSync(join(tmpdir(), "implement-"));
const PRODUCT = "src/orders/domain/entities/order.entity.ts";

describe("the implement phase starts a change", () => {
  it("a ready change is not in implementation until it is started", async () => {
    const root = project();
    change(root, "add-orders");
    expect(await changesInImplementation(root)).toEqual([]);
    expect(await guard(root, [PRODUCT])).toHaveLength(1);
    expect((await gate(root)).allowed).toBe(true);
  });

  it("starting a ready change prepares the roots, generates its tests and puts it in implementation", async () => {
    const root = project();
    change(root, "add-orders", { parts: { phases: [true, false] } });
    const started = await start(root, "add-orders");
    expect(started).toMatchObject({ state: "started", phase: "Phase 2: Step 2 works" });
    expect(existsSync(join(root, "src/shared/domain"))).toBe(true);
    expect(readFileSync(join(root, "test/acceptance/orders/get-order.feature.test.ts"), "utf8")).toContain(
      "looking for",
    );
    expect((await changesInImplementation(root)).map((c) => c.name)).toEqual(["add-orders"]);
    expect(await guard(root, [PRODUCT])).toEqual([]);
  });

  it("a change that is not ready is not started and says what validation found", async () => {
    const root = project();
    change(root, "add-orders", { parts: { questions: ["Which currency?"] } });
    const started = await start(root, "add-orders");
    expect(started).toMatchObject({ state: "not ready" });
    expect(JSON.stringify(started)).toContain("no-open-questions");
    expect(isStarted(root, "add-orders")).toBe(false);
  });

  it("a change with every task done has nothing to build", async () => {
    const root = project();
    change(root, "add-orders", { parts: { phases: [true] } });
    expect(await start(root, "add-orders")).toEqual({ state: "nothing to build" });
    expect(isStarted(root, "add-orders")).toBe(false);
  });

  it("a started change stays in implementation when its last task is ticked, until its checks pass", async () => {
    const root = project();
    change(root, "add-orders");
    await start(root, "add-orders");
    change(root, "add-orders", { parts: { phases: [true] } });
    expect((await changesInImplementation(root)).map((c) => c.name)).toEqual(["add-orders"]);
    const held = await gate(root, { checks: async () => ["the check of app-domain fails"] });
    expect(held.allowed).toBe(false);
    expect((await gate(root, { checks: async () => [] })).allowed).toBe(true);
    expect(isStarted(root, "add-orders")).toBe(false);
  });

  it("the builder's pass ends the implementation; a helper's pass does not", async () => {
    const root = project();
    change(root, "add-orders");
    await start(root, "add-orders");
    expect((await gate(root, { helper: true, checks: async () => [] })).allowed).toBe(true);
    expect(isStarted(root, "add-orders")).toBe(true);
    expect((await gate(root, { checks: async () => [] })).allowed).toBe(true);
    expect(isStarted(root, "add-orders")).toBe(false);
  });
});
