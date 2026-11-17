import type { ProcessAcl, ProcessRecord } from "../acl/process.acl.ts";

export class ProcessAdapter implements ProcessAcl {
  private readonly load: () => Promise<ProcessRecord[]>;

  constructor(load: () => Promise<ProcessRecord[]>) {
    this.load = load;
  }

  listProcesses(): Promise<ProcessRecord[]> {
    return this.load();
  }
}
