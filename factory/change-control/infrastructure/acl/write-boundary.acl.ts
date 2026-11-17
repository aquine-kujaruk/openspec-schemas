import { z } from "zod";

export const WriteBoundaryRecordSchema = z.object({
  lines: z.array(z.object({
    name: z.string(),
    folder: z.string(),
    roots: z.array(z.string()),
    acceptance: z.string(),
  })).min(1),
  changes: z.string(),
  decisions: z.string(),
  procedures: z.string(),
});

export type WriteBoundaryRecord = z.infer<typeof WriteBoundaryRecordSchema>;

export interface WriteBoundaryAcl {
  readConfiguration(): Promise<WriteBoundaryRecord>;
  projectPath(file: string): string | null;
}
