import { cpSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { COMMAND, runTool } from "../../../shared/infrastructure/adapters/paths.adapter.ts";
import { WorkOrderException } from "../../domain/exceptions/work-order.exceptions.ts";
import type { DrawingProjectionAcl } from "../acl/drawing-projection.acl.ts";
import { CHANGES } from "./work-order-record.adapter.ts";

const TELEMETRY_OFF = { OPENSPEC_TELEMETRY: "0", DO_NOT_TRACK: "1" };

export class DrawingProjectionAdapter implements DrawingProjectionAcl {
  /** Runs the specification tool in the project at `root`. */
  openspec(root: string, args: string[]) {
    const r = runTool("@fission-ai/openspec", args, {
      bin: "openspec",
      cwd: root,
      env: { ...process.env, ...TELEMETRY_OFF },
    });
    return { status: r.status, output: `${r.stdout}${r.stderr}`.trim() };
  }

  mergeDrawings(root: string, changes: string[]) {
    const copy = mkdtempSync(join(tmpdir(), `${COMMAND}-merged-`));
    const dispose = () => rmSync(copy, { recursive: true, force: true });
    try {
      mkdirSync(join(copy, CHANGES), { recursive: true });
      for (const part of ["openspec/specs", "openspec/config.yaml"])
        if (existsSync(join(root, part)))
          cpSync(join(root, part), join(copy, part), { recursive: true });
      if (existsSync(join(root, "openspec/schemas")))
        symlinkSync(
          realpathSync(join(root, "openspec/schemas")),
          join(copy, "openspec/schemas"),
        );
      for (const name of changes) {
        cpSync(join(root, CHANGES, name), join(copy, CHANGES, name), {
          recursive: true,
        });
        const merged = this.openspec(copy, ["archive", name, "-y"]);
        if (merged.status !== 0)
          throw new WorkOrderException(
            `the delta specs of ${name} do not merge:\n${merged.output}`,
            { cause: merged },
          );
      }
      return { root: copy, changes, dispose };
    } catch (e) {
      dispose();
      throw e;
    }
  }
}
