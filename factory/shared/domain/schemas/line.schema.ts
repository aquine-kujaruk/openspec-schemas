import { z } from "zod";
import { LineNameSchema } from "../schemas/line-name.schema.ts";
import { ProcessNameSchema } from "../schemas/process-name.schema.ts";
import { LineRootsValueObject } from "../value-objects/line-roots.value-object.ts";

export const LineSchema = z.object({
  name: LineNameSchema,
  folder: z.string().min(1),
  process: ProcessNameSchema,
  roots: z.instanceof(LineRootsValueObject),
});

export type LineProps = z.infer<typeof LineSchema>;
