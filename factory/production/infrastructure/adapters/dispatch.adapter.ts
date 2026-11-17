import { realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { DispatchAcl } from "../acl/dispatch.acl.ts";

export class DispatchAdapter implements DispatchAcl {
  private readonly root: string;
  private readonly assess: DispatchAcl["validateWorkOrder"];
  private readonly runner: DispatchAcl["getRunner"];

  constructor(root: string, assess: DispatchAcl["validateWorkOrder"], runner: DispatchAcl["getRunner"]) {
    this.root = root;
    this.assess = assess;
    this.runner = runner;
  }

  validateWorkOrder(name: string) { return this.assess(name); }
  checkout(path = this.root) { return realpathSync(path); }
  getRunner() { return this.runner(); }
  async runCommand(command: string) {
    return spawnSync("sh", ["-c", command], { cwd: this.root, stdio: "inherit" }).status;
  }
}
