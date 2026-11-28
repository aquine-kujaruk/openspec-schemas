import { z } from "zod";

const ScenarioSchema = z.object({ title: z.string().min(1), requirement: z.string().min(1) });
export type Scenario = z.input<typeof ScenarioSchema>;

export const DrawingSchema = z.object({
  path: z.string().min(1),
  scenarios: z.array(ScenarioSchema),
});

export type DrawingProps = z.input<typeof DrawingSchema>;
