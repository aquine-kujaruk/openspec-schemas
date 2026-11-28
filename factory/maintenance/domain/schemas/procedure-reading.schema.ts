import { z } from "zod";

export const NeedKind = { Script: "script", Binary: "binary", File: "file" } as const;

export const ProcedureNeedSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal(NeedKind.Script), name: z.string() }),
  z.object({ kind: z.literal(NeedKind.Binary), name: z.string() }),
  z.object({ kind: z.literal(NeedKind.File), path: z.string() }),
]);

export type ProcedureNeed = z.infer<typeof ProcedureNeedSchema>;

export const ProcedureRunSchema = z.object({ command: z.string(), need: ProcedureNeedSchema });
export type ProcedureRun = z.infer<typeof ProcedureRunSchema>;

export const EquipmentProcedureSchema = z.object({
  file: z.string(),
  body: z.string(),
  keys: z.array(z.string()).optional(),
});

export type EquipmentProcedure = z.infer<typeof EquipmentProcedureSchema>;

export type EquipmentHoldings = {
  scripts: Set<string>;
  binaries: (name: string) => boolean;
  file: (path: string) => boolean;
};
