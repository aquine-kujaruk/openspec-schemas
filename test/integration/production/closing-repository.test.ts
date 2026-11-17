import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { consolidated } from "../../../factory/production.ts";
import { QualityCertificateFileAdapter } from "../../../factory/quality/infrastructure/adapters/quality-certificate-file.adapter.ts";
import { capture, self } from "../../../factory/shared/infrastructure/adapters/paths.adapter.ts";
import { block, change, scratchProject, write } from "../../../factory/shared/infrastructure/adapters/testing.adapter.ts";

const roots: string[] = [];
function project(schema: string) {
  const root = scratchProject("closing-repository-");
  roots.push(root);
  write(root, "openspec/config.yaml", `schema: ${schema}\n`);
  const module = new URL("../../../factory/engineering.ts", import.meta.url).href;
  const install = capture(process.execPath, ["--input-type=module", "-e", `
    const { schema, schemaYaml } = await import(process.argv[1]);
    schemaYaml.emitSchema(await schema.loadSchema(process.argv[2]), process.argv[3]);
  `, module, schema, join(root, "openspec/schemas", schema)], {
    cwd: root,
    env: { ...process.env, VITEST: "" },
  });
  expect(install.status, install.stderr).toBe(0);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("closing repository", () => {
  it("archives a work order and preserves the access procedure's probe and credential names", async () => {
    const root = project("clean-backend");
    const name = "add-invoices";
    change(root, name, {
      parts: {
        phases: [true],
        procedures: [
          block(
            "Procedure",
            "invoices-access",
            [
              "@adds", "@purpose:access", "@topic:invoices", "@env:sandbox",
              "@probed:2026-11-16", "@keys:INVOICES_API_KEY,INVOICES_ACCOUNT",
            ],
            "**Requires** The two keys in .env.\n\n**Verification** It answers.",
          ),
        ],
      },
    });
    const files = new QualityCertificateFileAdapter(root, "openspec/changes", async () => []);
    files.writeEvidence({
      change: name,
      verdict: "verified",
      digest: await files.digestOf(name),
      scenarios: [],
      failing: [],
      review: { state: "skipped", warnings: [] },
      procedures: [],
    });

    const { output } = self(root, ["archive", name]);
    const archive = /^archived: add-invoices as (\d{4}-\d{2}-\d{2}-add-invoices)$/m.exec(output)?.[1];
    expect(archive, output).toBeDefined();
    expect(existsSync(join(root, "openspec/changes/archive", archive!, "plan.md"))).toBe(true);
    expect(existsSync(join(root, "openspec/specs/orders/get-order/spec.md"))).toBe(true);
    const runbook = readFileSync(join(root, "openspec/runbooks/access/invoices.md"), "utf8");
    expect(runbook).toContain(
      `@origin:${archive} @env:sandbox @probed:2026-11-16 @keys:INVOICES_API_KEY,INVOICES_ACCOUNT`,
    );
    expect(consolidated.readConsolidated(root).procedures.get("invoices-access")?.keys)
      .toEqual(["INVOICES_API_KEY", "INVOICES_ACCOUNT"]);
  }, 120_000);

  it("uses the same command to archive a work order whose process has no workstreams", async () => {
    const root = project("spec-plan");
    const name = "record-outage";
    change(root, name, { schema: "spec-plan", deltas: {}, parts: { phases: [true] } });
    write(root, "factory.config.ts", 'export default { schema: "clean-backend", review: { keyVariable: "FACTORY_TEST_UNUSED_AUDIT_KEY" } };\n');
    const verified = self(root, ["verify", name]);
    expect(verified.status, verified.output).toBe(0);
    expect(verified.output).toContain("verified: record-outage");
    expect(verified.output).toContain("- review: skipped");

    const { output } = self(root, ["archive", name]);
    const archive = /^archived: record-outage as (\d{4}-\d{2}-\d{2}-record-outage)$/m.exec(output)?.[1];
    expect(archive, output).toBeDefined();
    expect(existsSync(join(root, "openspec/changes/archive", archive!, "plan.md"))).toBe(true);
  }, 120_000);
});
