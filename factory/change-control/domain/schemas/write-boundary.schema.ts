import { z } from "zod";
import { ProtectedAreaValueObject } from "../value-objects/protected-area.value-object.ts";

export const WritableLineSchema = z.object({
  name: z.string(),
  folder: z.string(),
  roots: z.array(z.string()),
  acceptance: z.string(),
});

export type WritableLine = z.infer<typeof WritableLineSchema>;

export const WriteBoundarySchema = z.object({
  lines: z.array(WritableLineSchema),
  changes: z.string(),
  decisions: z.string(),
  procedures: z.string(),
});

export type WriteBoundary = z.infer<typeof WriteBoundarySchema>;

export const PathKind = { Harness: "harness", Outside: "outside", Product: "product" } as const;

export const WriteBoundaryAggregateSchema = z.object({
  lines: z.array(WritableLineSchema),
  protectedAreas: z.array(z.instanceof(ProtectedAreaValueObject)),
});

export type WriteBoundaryAggregateProps = z.infer<typeof WriteBoundaryAggregateSchema>;

export const ReleasedWorkOrderSchema = z.object({
  name: z.string(),
  process: z.string(),
  builds: z.boolean(),
  line: z.string().optional(),
});

export type ReleasedWorkOrder = z.infer<typeof ReleasedWorkOrderSchema>;
