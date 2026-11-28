import type {
  AuditAnswers,
  AuditFile,
  AuditPass,
  AuditQuestion,
  AuditRubric,
  AuditSource,
  AuditSpan,
} from "../../domain/schemas/audit-material.schema.ts";

export interface AuditAcl {
  listRubrics(root: string, paths: string[]): AuditRubric[];
  listPackageNames(root: string): string[];
  listCoreFiles(root: string, modules: string, folders: string[]): AuditFile[];
  readPass(root: string): AuditPass;
  savePass(root: string, pass: AuditPass): void;
  findCommit(root: string): string | null;
  hashContent(content: string): string;
  askQuestions(state: string, questions: AuditQuestion[]): Promise<AuditAnswers>;
  outlineSource(source: AuditSource): AuditSpan[];
}
