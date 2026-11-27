import { z } from "zod";
import { MaintenanceItemValueObject } from "../value-objects/maintenance-item.value-object.ts";

export const MaintenanceReportSchema = z.object({ items: z.array(z.instanceof(MaintenanceItemValueObject)) });
export type MaintenanceReportProps = z.input<typeof MaintenanceReportSchema>;
