import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runTool } from "../core/paths.ts";
import { loadSchema } from "./schema.ts";
import { emitSchema, schemaFiles } from "./schema-yaml.ts";

/** A project whose only schema is the emitted `clean-backend`, set as its default. */
const project = async () => {
  const root = mkdtempSync(join(tmpdir(), "schema-"));
  const schema = await loadSchema("clean-backend");
  emitSchema(schema, join(root, "openspec/schemas/clean-backend"));
  mkdirSync(join(root, "openspec/specs"), { recursive: true });
  writeFileSync(join(root, "openspec/config.yaml"), "schema: clean-backend\n");
  return { root, schema };
};

const openspec = (cwd: string, ...args: string[]) => {
  const r = runTool("@fission-ai/openspec", [...args, "--json"], {
    bin: "openspec",
    cwd,
    env: { ...process.env, OPENSPEC_TELEMETRY: "0", DO_NOT_TRACK: "1" },
  });
  return JSON.parse(String(r.stdout)) as Record<string, any>;
};

describe("the schema the specification tool sees", () => {
  it("is valid and resolves from the project", async () => {
    const { root } = await project();
    expect(openspec(root, "schema", "validate", "clean-backend")).toMatchObject({
      valid: true,
      issues: [],
    });
    expect(openspec(root, "schema", "which", "clean-backend")).toMatchObject({
      source: "project",
    });
  });

  it("hands a new change the plan's template and an instruction that ends with the question policy", async () => {
    const { root, schema } = await project();
    expect(openspec(root, "new", "change", "add-orders")).toMatchObject({
      change: { schema: "clean-backend" },
    });
    const plan = openspec(root, "instructions", "plan", "--change", "add-orders");
    expect(plan.template).toBe(schema.templates["plan.md"]);
    expect(plan.instruction).toContain(
      "Workstreams a task may name: `app-domain`, `infrastructure`, `adapters`, `clean-architecture`, `integrate`.",
    );
    expect(plan.instruction.trim().endsWith(schema.questions.trim())).toBe(true);
    expect(plan.dependencies).toEqual([]);
    const specs = openspec(root, "instructions", "specs", "--change", "add-orders");
    expect(specs.template).toBe(schema.templates["spec.md"]);
    expect(specs.instruction).not.toContain("Workstreams a task may name");
  });

  it("is applied through its plan alone", async () => {
    const { root } = await project();
    openspec(root, "new", "change", "add-orders");
    expect(openspec(root, "status", "--change", "add-orders")).toMatchObject({
      applyRequires: ["plan"],
    });
  });

  it("is emitted the same every time", async () => {
    const { root, schema } = await project();
    const files = schemaFiles(schema);
    for (const [path, text] of Object.entries(files))
      expect(readFileSync(join(root, "openspec/schemas/clean-backend", path), "utf8")).toBe(text);
    expect(schemaFiles(await loadSchema("clean-backend"))).toEqual(files);
  });
});
