import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { write } from "../../shared/infrastructure/adapters/testing.ts";

/** Spec: `implementer`, "Checks run over each product alone" and "Each product's specs and acceptance tests live under that product". */
const CLI = fileURLToPath(new URL("../../main.ts", import.meta.url));

const monorepo = () => {
  const root = mkdtempSync(join(tmpdir(), "products-check-"));
  write(
    root,
    "factory.config.ts",
    `export default ${JSON.stringify({
      products: {
        api: { root: "apps/api", schema: "clean-backend" },
        worker: { root: "apps/worker", schema: "clean-backend" },
      },
    })};\n`,
  );
  return root;
};

/** A file in the domain of `product` that breaks a rule of its layer: an entity importing the schema package. */
const breakRule = (root: string, product: string) =>
  write(
    root,
    `apps/${product}/src/orders/domain/entities/order.entity.ts`,
    'import { z } from "zod";\nexport const id = z.string();\n',
  );

const check = (root: string, ...args: string[]) =>
  spawnSync(process.execPath, [CLI, "check", "--layer", "domain", ...args], {
    cwd: root,
    encoding: "utf8",
  });

describe("checks run over each product alone", () => {
  it.each([["api"], ["worker"]])(
    "a rule broken in %s fails only that product",
    (broken) => {
      const root = monorepo();
      breakRule(root, broken);
      const r = check(root);
      expect(r.status).not.toBe(0);
      expect(r.stdout).toContain(`failing products: ${broken}\n`);
    },
    120_000,
  );

  it("--product runs the check of that product only", () => {
    const root = monorepo();
    breakRule(root, "api");
    expect(check(root, "--product", "worker").status).toBe(0);
    expect(check(root, "--product", "api").status).not.toBe(0);
  }, 120_000);
});

const spec = (name: string, rows: number) => `# ${name} Specification

## Purpose

Scratch capability that doubles a number, to check acceptance generation per product.

## Requirements

### Requirement: A thing is done

The system SHALL double the given number.

#### Scenario Outline: doubling \`<input>\` gives \`<output>\`

- **GIVEN** the number \`<input>\` <!-- numberGiven -->
- **WHEN** the thing is done <!-- thingDone -->
- **THEN** the result is \`<output>\` <!-- resultIs -->

##### Examples:

  | input | output |
  | ----- | ------ |
${Array.from({ length: rows }, (_, i) => `  | ${i} | ${i * 2} |`).join("\n")}
`;

describe("each product's specs and acceptance tests live under that product", () => {
  it("factory generate writes each product's tests into its own acceptance root", () => {
    const root = monorepo();
    write(
      root,
      "openspec/specs/api/orders/list/spec.md",
      spec("api/orders/list", 2),
    );
    write(
      root,
      "openspec/specs/worker/billing/charge/spec.md",
      spec("worker/billing/charge", 1),
    );
    const r = spawnSync(process.execPath, [CLI, "generate"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const api = join(
      root,
      "apps/api/test/acceptance/orders/list.feature.test.ts",
    );
    const worker = join(
      root,
      "apps/worker/test/acceptance/billing/charge.feature.test.ts",
    );
    expect(
      (readFileSync(api, "utf8").match(/doubling/g) ?? []).length,
    ).toBeGreaterThanOrEqual(2);
    expect(existsSync(worker)).toBe(true);
    expect(existsSync(join(root, "apps/worker/test/acceptance/orders"))).toBe(
      false,
    );
    expect(existsSync(join(root, "apps/api/test/acceptance/billing"))).toBe(
      false,
    );
  }, 120_000);
});
