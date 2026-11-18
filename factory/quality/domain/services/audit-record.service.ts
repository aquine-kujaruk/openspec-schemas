import type { AuditPass, AuditRow, AuditSource } from "../schemas/audit-material.schema.ts";

export class AuditRecordService {
  private readonly hash: (content: string) => string;

  constructor(hash: (content: string) => string) {
    this.hash = hash;
  }

  rubricHash(rows: AuditRow[]): string {
    return this.hash(
      JSON.stringify({
        scope: "named-file-and-line-range",
        rows: rows
          .map((row) => [row.id, row.question, row.folders, row.crossFile])
          .sort((a, b) => (a[0] < b[0] ? -1 : 1)),
      }),
    );
  }

  touched<F extends AuditSource>(files: F[], record: AuditPass, rubric: string): F[] {
    return record.rubric !== rubric
      ? files
      : files.filter((file) => record.files[file.path]?.hash !== this.hash(file.content));
  }

  recordPass(
    record: AuditPass,
    judged: AuditSource[],
    commit: string | null,
    rubric: string,
  ): AuditPass {
    const files = { ...record.files };
    for (const file of judged) {
      files[file.path] = { hash: this.hash(file.content), commit };
    }
    return {
      rubric,
      files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
    };
  }
}
