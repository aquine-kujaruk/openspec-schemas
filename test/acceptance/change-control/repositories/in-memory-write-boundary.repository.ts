import type { WriteBoundaryRepositoryInterface } from "../../../../factory/change-control/application/repository-interfaces/write-boundary.repository-interface.ts";
import type { WriteBoundary } from "../../../../factory/change-control/domain/schemas/write-boundary.schema.ts";

export class InMemoryWriteBoundaryRepository implements WriteBoundaryRepositoryInterface {
  private boundary!: WriteBoundary;

  seed(boundary: WriteBoundary): void {
    this.boundary = boundary;
  }

  async getBoundary(): Promise<WriteBoundary> {
    return this.boundary;
  }

  findProjectPath(file: string): string | null {
    return file.startsWith("/") || file.startsWith("..") ? null : file;
  }
}
