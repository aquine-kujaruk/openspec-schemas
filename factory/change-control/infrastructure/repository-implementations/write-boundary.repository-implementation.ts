import type { WriteBoundaryRepositoryInterface } from "../../application/repository-interfaces/write-boundary.repository-interface.ts";
import { ChangeControlException } from "../../domain/exceptions/change-control.exceptions.ts";
import { WriteBoundaryRecordSchema, type WriteBoundaryAcl } from "../acl/write-boundary.acl.ts";

export class WriteBoundaryRepositoryImplementation implements WriteBoundaryRepositoryInterface {
  private readonly files: WriteBoundaryAcl;

  constructor(files: WriteBoundaryAcl) {
    this.files = files;
  }

  async getBoundary() {
    try {
      return WriteBoundaryRecordSchema.parse(await this.files.readConfiguration());
    } catch (cause) {
      throw new ChangeControlException("Unable to read the project's write boundaries", { cause });
    }
  }

  findProjectPath(file: string): string | null {
    return this.files.projectPath(file);
  }
}
