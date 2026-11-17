import type { AuditRepositoryInterface } from "../../application/repository-interfaces/audit.repository-interface.ts";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import type { AuditPass, AuditQuestion, AuditSource } from "../../domain/schemas/audit-material.schema.ts";
import type { AuditAcl } from "../acl/audit.acl.ts";

export class AuditRepositoryImplementation implements AuditRepositoryInterface {
  private readonly resources: AuditAcl;

  constructor(resources: AuditAcl) {
    this.resources = resources;
  }

  listRubrics(root: string, paths: string[]) {
    return this.read(() => this.resources.listRubrics(root, paths));
  }

  listPackageNames(root: string) {
    return this.read(() => this.resources.listPackageNames(root));
  }

  listCoreFiles(root: string, modules: string, folders: string[]) {
    return this.read(() => this.resources.listCoreFiles(root, modules, folders));
  }

  readPass(root: string) {
    return this.read(() => this.resources.readPass(root));
  }

  savePass(root: string, pass: AuditPass): void {
    this.read(() => this.resources.savePass(root, pass));
  }

  findCommit(root: string) {
    return this.read(() => this.resources.findCommit(root));
  }

  hashContent(content: string) {
    return this.resources.hashContent(content);
  }

  async askQuestions(state: string, questions: AuditQuestion[]) {
    try {
      return await this.resources.askQuestions(state, questions);
    } catch (cause) {
      throw new QualityException(cause instanceof Error ? cause.message : String(cause), { cause });
    }
  }

  outlineSource(source: AuditSource) {
    return this.read(() => this.resources.outlineSource(source));
  }

  private read<T>(request: () => T): T {
    try {
      return request();
    } catch (cause) {
      throw new QualityException(cause instanceof Error ? cause.message : String(cause), { cause });
    }
  }
}
