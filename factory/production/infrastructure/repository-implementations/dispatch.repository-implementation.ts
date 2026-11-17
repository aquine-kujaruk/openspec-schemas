import type { DispatchRepositoryInterface } from "../../application/repository-interfaces/dispatch.repository-interface.ts";
import type { DispatchAcl } from "../acl/dispatch.acl.ts";

export class DispatchRepositoryImplementation implements DispatchRepositoryInterface {
  private readonly resource: DispatchAcl;

  constructor(resource: DispatchAcl) {
    this.resource = resource;
  }

  validateWorkOrder(name: string): Promise<{ready: boolean; findings: {rule: string; message: string}[]}> {
    return this.resource.validateWorkOrder(name);
  }

  getRunner(): Promise<"session" | {command: string}> {
    return this.resource.getRunner();
  }

  runCommand(command: string): Promise<number | null> {
    return this.resource.runCommand(command);
  }
}
