export const NeedKind = { Script: "script", Binary: "binary", File: "file" } as const;

export type ProcedureNeed =
  | { kind: typeof NeedKind.Script; name: string }
  | { kind: typeof NeedKind.Binary; name: string }
  | { kind: typeof NeedKind.File; path: string };

export type ProcedureRun = { command: string; need: ProcedureNeed };
export type EquipmentProcedure = { file: string; body: string; keys?: string[] };
export type EquipmentHoldings = {
  scripts: Set<string>;
  binaries: (name: string) => boolean;
  file: (path: string) => boolean;
};
