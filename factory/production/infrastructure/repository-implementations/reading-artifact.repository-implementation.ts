import type { ReadingArtifactRepositoryInterface } from "../../application/repository-interfaces/reading-artifact.repository-interface.ts";
import type { ReadingArtifactAcl } from "../acl/reading-artifact.acl.ts";

export class ReadingArtifactRepositoryImplementation implements ReadingArtifactRepositoryInterface {
  private readonly resource: ReadingArtifactAcl;

  constructor(resource: ReadingArtifactAcl) {
    this.resource = resource;
  }

  getLanguage(): Promise<{person?: string; project?: string}> {
    return this.resource.getLanguage();
  }

  readArtifact(path: string): Promise<{fingerprint: string} | null> {
    return this.resource.readArtifact(path);
  }

  readingPath(language: string, source: string): string {
    return this.resource.readingPath(language, source);
  }

  readCopy(path: string): Promise<{fingerprint?: string} | null> {
    return this.resource.readCopy(path);
  }

  recordFingerprint(path: string, fingerprint: string): Promise<void> {
    return this.resource.recordFingerprint(path, fingerprint);
  }
}
