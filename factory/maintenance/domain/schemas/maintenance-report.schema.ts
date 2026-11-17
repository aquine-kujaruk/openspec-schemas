import { z } from "zod";
import { MaintenanceItem } from "../value-objects/maintenance-item.value-object.ts";

export const MaintenanceReportSchema = z.object({ items: z.array(z.instanceof(MaintenanceItem)) });
export type MaintenanceReportProps = z.input<typeof MaintenanceReportSchema>;
