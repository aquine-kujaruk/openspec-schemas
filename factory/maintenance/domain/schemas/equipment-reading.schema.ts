import type { MaintenanceItemProps } from "./maintenance-item.schema.ts";

export const RepairKind = {
  Pin: "pin",
  Link: "link",
  Default: "default",
  Roots: "roots",
  Instruction: "instruction",
} as const;

export type EquipmentRepair =
  | { kind: typeof RepairKind.Pin; hadPin: boolean }
  | { kind: typeof RepairKind.Link; schema: string }
  | { kind: typeof RepairKind.Default }
  | { kind: typeof RepairKind.Roots; paths: string[] }
  | { kind: typeof RepairKind.Instruction; file: string; before?: string };

export type EquipmentFinding = MaintenanceItemProps & { repair?: EquipmentRepair };

export type AgentReading = {
  name: string;
  skills?: string;
  missingSkills?: string[];
  rules?: string;
  missingRules?: string[];
  instructionFile?: string;
  instructionText?: string;
  unwiredGuards?: string[];
  hooks?: string;
};

export type EquipmentReading = {
  pinned?: string;
  links: Array<{ schema: string; path: string; holds: boolean; ownFolder: boolean }>;
  hasDefault: boolean;
  missingRoots: string[];
  declared: Record<string, string>;
  web: boolean;
  node: string;
  agents: AgentReading[];
};

export type EquipmentNotes = {
  missingKeys: Array<{ name: string; slug: string; file: string }>;
  packageManagerVersion?: string;
  pendingApprovals: boolean;
  typeCheckerVersion?: string;
};

export type EquipmentPlace = {
  skills: string;
  instruction: { rules: string } | { file: string };
  hooks: string;
};
