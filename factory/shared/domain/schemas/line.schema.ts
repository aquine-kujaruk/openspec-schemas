import { z } from "zod";
import { LineName } from "../value-objects/line-name.value-object.ts";
import { ProcessName } from "../value-objects/process-name.value-object.ts";
import { LineRoots } from "../value-objects/line-roots.value-object.ts";

export const LineSchema = z.object({
  name: z.instanceof(LineName),
  folder: z.string().min(1),
  process: z.instanceof(ProcessName),
  roots: z.instanceof(LineRoots),
});
export type LineProps = z.infer<typeof LineSchema>;
