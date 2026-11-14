import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isStarted } from "./change.ts";
import { gate } from "../package/gate.ts";
import { guard } from "../package/guard.ts";
import { start } from "./implement.ts";
import { archive } from "./archive.ts";
import { loadSchema, projectSchemaName } from "../repository/schema.ts";
import { emitSchema } from "../repository/schema-yaml.ts";
import { change, write } from "../core/testing.ts";
import { changesInImplementation } from "./validate.ts";
import { verify } from "./verify.ts";

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

/** Spec: `package/write-guard` and `package/completion-gate`, a change is judged by its own schema; design D7 to D9. */
describe("a change made with a schema that has no workstreams", () => {
  const bare = (root: string, name = "record-outage") =>
    change(root, name, { schema: "spec-plan", deltas: {} });

  it("starts without laying the product's roots and opens no product path", async () => {
    const root = project();
    bare(root);
    expect(await start(root, "record-outage")).toMatchObject({ state: "started" });
    expect(existsSync(join(root, "src"))).toBe(false);
    expect(await changesInImplementation(root)).toMatchObject([
      { name: "record-outage", schema: "spec-plan", builds: false },
    ]);
    const [refusal] = await guard(root, [PRODUCT]);
    expect(refusal!.reason).toContain("spec-plan");
    expect(await guard(root, ["docs/outage.md"])).toEqual([]);
  });

  it("is held by nothing but the harness, whatever the product's checks say", async () => {
    const root = project();
    bare(root);
    await start(root, "record-outage");
    const asked: string[][] = [];
    const verdict = await gate(root, {
      run: (_, args) => (asked.push(args), { status: 1, output: "a rule is broken" }),
    });
    expect(verdict.allowed).toBe(true);
    expect(asked).toEqual([]);
  });

  it("is verified with no review when the project has no schema with a rubric to answer for", async () => {
    const root = project();
    bare(root);
    const evidence = await verify(root, "record-outage", {
      env: {},
      scenarios: async () => [],
      checks: async () => [],
    });
    expect(evidence).toMatchObject({ verdict: "verified", review: { state: "skipped" } });
  });

  it("is archived by the same command", async () => {
    const root = project();
    write(root, "openspec/config.yaml", "schema: spec-plan\n");
    emitSchema(await loadSchema("spec-plan"), join(root, "openspec/schemas/spec-plan"));
    change(root, "record-outage", { schema: "spec-plan", deltas: {}, parts: { phases: [true] } });
    await verify(root, "record-outage", { env: {}, scenarios: async () => [], checks: async () => [] });
    const [archived] = await archive(root, "record-outage", { date: "2026-11-14" });
    expect(archived).toMatchObject({ change: "record-outage" });
    expect(existsSync(join(root, "openspec/changes/archive/2026-11-14-record-outage/plan.md"))).toBe(true);
  });

  it("the project's tools stay composed from the schema that builds, whatever the default schema is", async () => {
    const root = project();
    write(root, "openspec/config.yaml", "schema: spec-plan\n");
    expect(await projectSchemaName(root)).toBe("clean-backend");
  });
});
