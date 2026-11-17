import type { ClosingRepositoryInterface } from "../../application/repository-interfaces/closing.repository-interface.ts";
import type { ClosingAcl } from "../acl/closing.acl.ts";

export class ClosingRepositoryImplementation implements ClosingRepositoryInterface {
  private readonly resource: ClosingAcl;

  constructor(resource: ClosingAcl) {
    this.resource = resource;
  }

  listOrders(): Promise<{ name: string; created: string; product?: string }[]> {
    return this.resource.listOrders();
  }

  findCertificate(name: string): Promise<{ verdict: string; digest: string } | null> {
    return this.resource.findCertificate(name);
  }

  currentDigest(name: string): Promise<string> {
    return this.resource.currentDigest(name);
  }

  validateWorkOrder(name: string): Promise<{ rule: string; message: string; block?: string }[]> {
    return this.resource.validateWorkOrder(name);
  }

  readPlan(name: string): Promise<string> {
    return this.resource.readPlan(name);
  }

  listStanding(): Promise<{ decisions: Map<string, { file: string }>; procedures: Map<string, { file: string }> }> {
    return this.resource.listStanding();
  }

  readStandingFile(path: string): Promise<string | null> {
    return this.resource.readStandingFile(path);
  }

  recordFinding(name: string, block: string, message: string): Promise<void> {
    return this.resource.recordFinding(name, block, message);
  }

  closeArchive(name: string, origin: string, changes: { path: string; before: string | null; after: string | null }[]): Promise<{ success: boolean; output: string }> {
    return this.resource.closeArchive(name, origin, changes);
  }

  makeGauges(): Promise<void> {
    return this.resource.makeGauges();
  }

  today(): string {
    return this.resource.today();
  }
}
