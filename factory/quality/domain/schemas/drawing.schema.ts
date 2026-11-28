import { z } from "zod";

const ScenarioSchema = z.object({ title: z.string().min(1), requirement: z.string().min(1) });
export type Scenario = z.input<typeof ScenarioSchema>;

export const DrawingSchema = z.object({
  path: z.string().min(1),
  scenarios: z.array(ScenarioSchema),
});

export const DrawingRecordSchema = z.object({ path: z.string().min(1), file: z.string(), gherkin: z.string() });

export const GaugeBatchRecordSchema = z.object({
  exitStatus: z.number().int(),
  drawings: z.array(DrawingRecordSchema),
});

export type DrawingProps = z.input<typeof DrawingSchema>;
export type DrawingRecord = z.infer<typeof DrawingRecordSchema>;
export type GaugeBatchRecord = z.infer<typeof GaugeBatchRecordSchema>;
