import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { filesOf, projectOf } from "./guard.ts";
import { readyChange } from "../core/testing.ts";

const CLI = fileURLToPath(new URL("../cli.ts", import.meta.url));
const PATCH = [
  "*** Begin Patch",
  "*** Add File: src/orders/domain/order.entity.ts",
  "+export class OrderEntity {}",
  "*** Update File: README.md",
  "*** Move to: docs/README.md",
  "@@",
  "-old",
  "+new",
  "*** Delete File: factory.config.ts",
  "*** End Patch",
].join("\n");

/** Design V3: what each agent hands the hook before a file write. */
describe("the files a tool call is about to write", () => {
  it.each([
    ["a file tool's path", { file_path: "/p/src/a.ts", content: "x" }, ["/p/src/a.ts"]],
    ["a notebook's path", { notebook_path: "/p/n.ipynb" }, ["/p/n.ipynb"]],
    [
      "every file of a patch",
      { command: PATCH },
      ["src/orders/domain/order.entity.ts", "README.md", "docs/README.md", "factory.config.ts"],
    ],
    ["a patch handed as arguments", { command: ["apply_patch", PATCH] }, 4],
    ["a shell command that is no patch", { command: "ls -la src" }, []],
  ])("%s", (_what, tool_input, expected) => {
    const files = filesOf({ tool_name: "any", tool_input });
    if (typeof expected === "number") expect(files).toHaveLength(expected);
    else expect(files).toEqual(expected);
  });

  it("is none when the hook hands nothing to judge", () => {
    expect(filesOf({})).toEqual([]);
    expect(filesOf(undefined)).toEqual([]);
  });
});

describe("the command as an agent's hook", () => {
  const project = () => {
    const root = mkdtempSync(join(tmpdir(), "hook-"));
    mkdirSync(join(root, "openspec"));
    mkdirSync(join(root, "src/orders"), { recursive: true });
    return root;
  };
  const hook = (command: string, cwd: string, input: unknown) =>
    spawnSync(process.execPath, [CLI, command], {
      cwd,
      encoding: "utf8",
      input: JSON.stringify(input),
      env: { ...process.env, CLAUDE_PROJECT_DIR: "" },
    });

  it("finds the project from a folder inside it", () => {
    const root = project();
    expect(projectOf(join(root, "src/orders"))).toBe(root);
  });

  it("refuses a path with exit status 2 and the reason on standard error", () => {
    const root = project();
    const r = hook("guard", join(root, "src/orders"), {
      cwd: join(root, "src/orders"),
      tool_name: "Write",
      tool_input: { file_path: join(root, "src/orders/order.entity.ts") },
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("src/orders/order.entity.ts is product code");
    expect(r.stdout).toBe("");
  });

  it("refuses a patch when one of its files is harness, and lets the same patch through without it", () => {
    const root = project();
    readyChange(root, "add-orders");
    const refused = hook("guard", root, { cwd: root, tool_input: { command: PATCH } });
    expect(refused.status).toBe(2);
    expect(refused.stderr).toContain("factory configuration");
    const allowed = hook("guard", root, {
      cwd: root,
      tool_input: { command: PATCH.replace("*** Delete File: factory.config.ts\n", "") },
    });
    expect([allowed.status, allowed.stdout, allowed.stderr]).toEqual([0, "", ""]);
  });

  it("lets an agent finish, saying nothing, when no change is in implementation", () => {
    const root = project();
    const r = hook("gate", root, { cwd: root, hook_event_name: "Stop", stop_hook_active: false });
    expect([r.status, r.stdout, r.stderr]).toEqual([0, "", ""]);
  });
});
