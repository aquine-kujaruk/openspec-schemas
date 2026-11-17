export type Raised = { source: string; names: string; findings: string[] };

export interface AndonSignalAcl {
  raised(root: string, change: string): Raised[];
  raise(root: string, change: string, feedback: Raised): void;
}
