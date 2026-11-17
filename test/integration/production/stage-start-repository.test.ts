import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { self } from "../../../factory/shared/infrastructure/adapters/paths.adapter.ts";
import { change, scratchProject, write } from "../../../factory/shared/infrastructure/adapters/testing.adapter.ts";

const roots: string[] = [];
const productPath = "src/orders/domain/entities/order.entity.ts";
const run = (root: string, ...args: string[]) =>
  self(root, args, { ...process.env, CLAUDE_PROJECT_DIR: root });
const isStarted = (root: string, name: string) =>
  existsSync(join(root, "openspec/changes", name, "gate.json"));

function project() {
  const root = scratchProject("stage-start-repository-");
  roots.push(root);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("stage start repository", () => {
  it("prepares the roots and generates gauges when starting a ready work order, allowing product writes", () => {
    const root = project();
    const name = "add-orders";
    change(root, name, { parts: { phases: [true, false] } });
    expect(isStarted(root, name)).toBe(false);
    expect(run(root, "guard", productPath).status).toBe(2);
    expect(run(root, "gate")).toEqual({ status: 0, output: "" });

    const started = run(root, "implement", name);
    expect(started.status, started.output).toBe(0);
    expect(started.output).toContain("in implementation: add-orders — Phase 2: Step 2 works");
    expect(existsSync(join(root, "src/shared/domain"))).toBe(true);
    expect(readFileSync(join(root, "test/acceptance/orders/get-order.feature.test.ts"), "utf8")).toContain("looking for");
    expect(isStarted(root, name)).toBe(true);
    expect(run(root, "guard", productPath)).toEqual({ status: 0, output: "" });

    change(root, name, { parts: { phases: [true, true] } });
    expect(isStarted(root, name)).toBe(true);
  }, 120_000);

  it("leaves no stage record when readiness fails or there are no tasks left", () => {
    const root = project();
    const name = "add-orders";
    change(root, name, { parts: { questions: ["Which currency?"] } });
    const refused = run(root, "implement", name);
    expect(refused.status).toBe(1);
    expect(refused.output).toContain("no-open-questions");
    expect(isStarted(root, name)).toBe(false);

    change(root, name, { parts: { phases: [true] } });
    const finished = run(root, "implement", name);
    expect(finished).toEqual({ status: 0, output: "every task of add-orders is done: the verify phase is next" });
    expect(isStarted(root, name)).toBe(false);
  }, 120_000);

  it("opens no product paths for a process with no workstreams and lets the builder alone release the stage", () => {
    const root = project();
    const name = "record-outage";
    write(root, "openspec/config.yaml", "schema: spec-plan\n");
    change(root, name, { schema: "spec-plan", deltas: {} });

    const started = run(root, "implement", name);
    expect(started.status, started.output).toBe(0);
    expect(existsSync(join(root, "src"))).toBe(false);
    const refusal = run(root, "guard", productPath);
    expect(refusal.status).toBe(2);
    expect(refusal.output).toContain("spec-plan");
    expect(run(root, "guard", "docs/outage.md")).toEqual({ status: 0, output: "" });

    expect(run(root, "gate", "--helper")).toEqual({ status: 0, output: "" });
    expect(isStarted(root, name)).toBe(true);
    expect(run(root, "gate")).toEqual({ status: 0, output: "" });
    expect(isStarted(root, name)).toBe(false);

    const prepared = run(root, "prepare");
    expect(prepared.status, prepared.output).toBe(0);
    expect(existsSync(join(root, "src/shared/domain"))).toBe(true);
  }, 120_000);
});
