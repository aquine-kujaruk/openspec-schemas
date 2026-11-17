import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { doctor } from "../../package.ts";

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((r) => rmSync(r, { recursive: true, force: true })));

const project = (version: string): string => {
  const root = mkdtempSync(join(tmpdir(), "pinned-"));
  roots.push(root);
  const tarball = "file:.claude/skills/setup/assets/factory-0.14.0.tgz";
  writeFileSync(join(root, "package.json"), JSON.stringify({ devDependencies: { factory: tarball } }));
  writeFileSync(
    join(root, "pnpm-lock.yaml"),
    [
      "importers:",
      "  .:",
      "    devDependencies:",
      "      factory:",
      `        specifier: ${tarball}`,
      `        version: ${version}`,
      "packages:",
      `  factory@${tarball}:`,
      "    version: 0.14.0",
      "",
    ].join("\n"),
  );
  return root;
};

test("the pinned version is read whether or not pnpm records the peers it resolved", () => {
  const tarball = "file:.claude/skills/setup/assets/factory-0.14.0.tgz";
  expect(doctor.pinnedVersion(project(tarball))).toBe("0.14.0");
  expect(doctor.pinnedVersion(project(`${tarball}(@types/node@26.6.5)`))).toBe("0.14.0");
});
