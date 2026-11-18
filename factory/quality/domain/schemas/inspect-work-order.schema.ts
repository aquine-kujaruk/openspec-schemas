export type InspectionDrawings = {
  spec: string;
  text: string;
  gauge?: string;
  expected?: { requirement: string; scenario: string }[];
}[];

export type Finding = { source: string; names: string; findings: string[] };
export type Procedure = { slug: string; environments: string[]; declined: boolean };
export type Workstream = { id: string; upstream: string[]; tests: ("unit" | "integration" | "acceptance")[] };
export type ResourceRun = { status: number | null; output: string };
export type GaugeReport = {
  name: string;
  assertions: { requirement: string; scenario: string; passed: boolean }[];
}[];

export type FinalInspection = {
  name: string;
  repository: boolean;
  drawings: InspectionDrawings;
  workstreams: Workstream[];
  procedures: Procedure[];
  platform: string;
  review: { hasRubric: boolean; keyVariable: string; configured: boolean };
};
