import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { archive as flowarchive } from "../../flow.ts";
const { archive } = flowarchive;
import { consolidated as flowconsolidated } from "../../flow.ts";
const { readConsolidated } = flowconsolidated;
import { evidence as flowevidence } from "../../flow.ts";
const { digestOf, writeEvidence } = flowevidence;
import { schema as repositoryschema } from "../../repository.ts";
const { loadSchema } = repositoryschema;
import { schemaYaml as repositoryschemaYaml } from "../../repository.ts";
const { emitSchema } = repositoryschemaYaml;
import {
  block,
  change,
  scratchProject,
  write,
} from "../../shared/infrastructure/adapters/testing.ts";

/** Change `probe-resources-while-planning`: doctor reads `@keys` from the runbooks, so archiving keeps it. */
describe("an archived access procedure", () => {
  it("keeps @probed and @keys, and the runbook names its keys", async () => {
    const root = scratchProject("archive-keys-");
    write(root, "openspec/config.yaml", "schema: clean-backend\n");
    emitSchema(
      await loadSchema("clean-backend"),
      join(root, "openspec/schemas/clean-backend"),
    );
    const tags = [
      "@adds",
      "@purpose:access",
      "@topic:invoices",
      "@env:sandbox",
      "@probed:2026-11-16",
      "@keys:INVOICES_API_KEY,INVOICES_ACCOUNT",
    ];
    change(root, "add-invoices", {
      parts: {
        phases: [true],
        procedures: [
          block(
            "Procedure",
            "invoices-access",
            tags,
            "**Requires** The two keys in .env.\n\n**Verification** It answers.",
          ),
        ],
      },
    });
    writeEvidence(root, {
      change: "add-invoices",
      verdict: "verified",
      digest: await digestOf(root, "add-invoices"),
      scenarios: [],
      failing: [],
      review: { state: "skipped", warnings: [] },
      procedures: [],
    });

    const [report] = await archive(root, "add-invoices", {
      date: "2026-11-20",
    });

    expect(report!.place, report!.reason).toBe("archived");
    const runbook = readFileSync(
      join(root, "openspec/runbooks/access/invoices.md"),
      "utf8",
    );
    expect(runbook).toContain(
      "@origin:2026-11-20-add-invoices @env:sandbox @probed:2026-11-16 @keys:INVOICES_API_KEY,INVOICES_ACCOUNT",
    );
    expect(
      readConsolidated(root).procedures.get("invoices-access")?.keys,
    ).toEqual(["INVOICES_API_KEY", "INVOICES_ACCOUNT"]);
  });
});
