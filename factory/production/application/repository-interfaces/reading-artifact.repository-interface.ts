export interface ReadingArtifactRepositoryInterface {
  getLanguage(): Promise<{person?: string; project?: string}>;
  readArtifact(path: string): Promise<{fingerprint: string} | null>;
  readingPath(language: string, source: string): string;
  readCopy(path: string): Promise<{fingerprint?: string} | null>;
  recordFingerprint(path: string, fingerprint: string): Promise<void>;
}
