import type { AndonRepositoryInterface } from "../../application/repository-interfaces/andon.repository-interface.ts";
import type { AndonAcl } from "../acl/andon.acl.ts";

export class AndonRepositoryImplementation implements AndonRepositoryInterface {
  private readonly resource: AndonAcl;

  constructor(resource: AndonAcl) {
    this.resource = resource;
  }

  readPlan(name: string): Promise<string> {
    return this.resource.readPlan(name);
  }

  savePlan(name: string, text: string): Promise<void> {
    return this.resource.savePlan(name, text);
  }

  closeSignal(name: string, source: string): Promise<void> {
    return this.resource.closeSignal(name, source);
  }
}
