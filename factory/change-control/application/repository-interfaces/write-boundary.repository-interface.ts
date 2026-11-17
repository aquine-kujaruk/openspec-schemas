import type { WriteBoundary } from "../../domain/schemas/write-boundary.schema.ts";

export interface WriteBoundaryRepositoryInterface {
  getBoundary(): Promise<WriteBoundary>;
  findProjectPath(file: string): string | null;
}
