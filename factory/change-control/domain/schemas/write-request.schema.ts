import { z } from "zod";

export const WriteRequestSchema = z.object({ files: z.array(z.string()) });
export type WriteRequestProps = z.input<typeof WriteRequestSchema>;
