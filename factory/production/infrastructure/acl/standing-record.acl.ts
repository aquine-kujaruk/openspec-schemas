export const DECISIONS = "openspec/adr";
export const PROCEDURES = "openspec/runbooks";

export interface StandingRecordAcl {
  readDocuments(root: string, directory: string): { file: string; document: string }[];
}
