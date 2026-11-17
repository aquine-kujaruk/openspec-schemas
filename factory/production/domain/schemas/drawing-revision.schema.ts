import { z } from "zod";
import { DecidedBySchema } from "./decision.schema.ts";

export type DrawingPath = string;
const RequirementChangeSchema = z.object({
  name: z.string().min(1),
  operation: z.enum(["adds", "modifies", "removes", "renames"]).optional(),
  by: DecidedBySchema.optional(),
});
export type RequirementChange = z.infer<typeof RequirementChangeSchema>;

export const DrawingRevisionSchema = z.object({
  drawing: z.string().min(1),
  requirements: z.array(RequirementChangeSchema),
});
export type DrawingRevisionProps = z.input<typeof DrawingRevisionSchema>;
