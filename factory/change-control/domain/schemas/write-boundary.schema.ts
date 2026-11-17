export type WritableLine = {
  name: string;
  folder: string;
  roots: string[];
  acceptance: string;
};
export type WriteBoundary = {
  lines: WritableLine[];
  changes: string;
  decisions: string;
  procedures: string;
};
export type ReleasedWorkOrder = {
  name: string;
  process: string;
  builds: boolean;
  line?: string;
};
