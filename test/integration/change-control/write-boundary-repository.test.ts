import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { projectOf } from "../../../factory/change-control.ts";
import { WriteBoundaryAdapter } from "../../../factory/change-control/infrastructure/adapters/write-boundary.adapter.ts";
import { WriteBoundaryRepositoryImplementation } from "../../../factory/change-control/infrastructure/repository-implementations/write-boundary.repository-implementation.ts";
import { readyChange, scratchProject } from "../../../factory/shared/infrastructure/adapters/testing.adapter.ts";

const CLI = fileURLToPath(new URL("../../../factory/main.ts", import.meta.url));
const temporaryRoots: string[] = [];
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

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

describe("the command as an agent's hook", () => {
  const project = () => {
    const root = scratchProject("hook-");
    temporaryRoots.push(root);
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
  }, 60_000);

  it("refuses a patch when one of its files is harness, and lets the same patch through without it", () => {
    const root = project();
    readyChange(root, "add-orders");
    const refused = hook("guard", root, {
      cwd: root,
      tool_input: { command: PATCH },
    });
    expect(refused.status).toBe(2);
    expect(refused.stderr).toContain("factory configuration");
    const allowed = hook("guard", root, {
      cwd: root,
      tool_input: {
        command: PATCH.replace("*** Delete File: factory.config.ts\n", ""),
      },
    });
    expect([allowed.status, allowed.stdout, allowed.stderr]).toEqual([
      0,
      "",
      "",
    ]);
  }, 60_000);

  it("lets an agent finish, saying nothing, when no change is in implementation", () => {
    const root = project();
    const r = hook("gate", root, {
      cwd: root,
      hook_event_name: "Stop",
      stop_hook_active: false,
    });
    expect([r.status, r.stdout, r.stderr]).toEqual([0, "", ""]);
  }, 60_000);
});

describe("the project write boundary repository", () => {
  it("keeps paths in the configured project root and preserves the actual configured line", async () => {
    const root = mkdtempSync(join(tmpdir(), "write-boundary-"));
    temporaryRoots.push(root);
    const config = {
      lines: [{
        name: "api", folder: "apps/api", roots: ["apps/api/src"], acceptance: "apps/api/test/acceptance",
      }],
      changes: "openspec/changes", decisions: "openspec/adr", procedures: "openspec/runbooks",
    };
    const boundary = new WriteBoundaryRepositoryImplementation(
      new WriteBoundaryAdapter(root, join(root, "apps/api"), async () => config),
    );

    expect(await boundary.getBoundary()).toEqual(config);
    expect(boundary.findProjectPath("src/order.ts")).toBe("apps/api/src/order.ts");
    expect(boundary.findProjectPath(join(root, "factory.config.ts"))).toBe("factory.config.ts");
    expect(boundary.findProjectPath("../../../other-project/file.ts")).toBeNull();
  });
});
