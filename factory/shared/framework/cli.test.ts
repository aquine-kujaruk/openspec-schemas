import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("../../main.ts", import.meta.url));

const factory = (...args: string[]) =>
  spawnSync(process.execPath, [CLI, ...args], {
    cwd: mkdtempSync(join(tmpdir(), "cli-")),
    encoding: "utf8",
  });

describe("help never runs a command", () => {
  it.each([["archive"], ["implement"], ["verify"]])(
    "factory %s --help prints its usage and does nothing else",
    (command) => {
      const r = factory(command, "--help");
      expect(r.status).toBe(0);
      expect(r.stdout.trim()).toMatch(new RegExp(`^factory ${command} `));
      expect(r.stdout.trim().split("\n")).toHaveLength(1);
    },
  );

  it("factory help lists every command", () => {
    const r = factory("help");
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^factory archive \[change\]/m);
    expect(r.stdout.trim().split("\n").length).toBeGreaterThan(15);
  });
});
