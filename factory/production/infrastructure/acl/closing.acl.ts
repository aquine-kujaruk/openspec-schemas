export interface ClosingAcl {
  listOrders(): Promise<{ name: string; created: string; product?: string }[]>;
  findCertificate(name: string): Promise<{ verdict: string; digest: string } | null>;
  currentDigest(name: string): Promise<string>;
  validateWorkOrder(name: string): Promise<{ rule: string; message: string; block?: string }[]>;
  readPlan(name: string): Promise<string>;
  listStanding(): Promise<{ decisions: Map<string, { file: string }>; procedures: Map<string, { file: string }> }>;
  readStandingFile(path: string): Promise<string | null>;
  recordFinding(name: string, block: string, message: string): Promise<void>;
  closeArchive(name: string, origin: string, changes: { path: string; before: string | null; after: string | null }[]): Promise<{ success: boolean; output: string }>;
  makeGauges(): Promise<void>;
  today(): string;
}
