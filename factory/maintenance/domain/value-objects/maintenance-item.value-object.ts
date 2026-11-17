import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import {
  MaintenanceItemSchema,
  MaintenanceKind,
  type MaintenanceItemProps,
} from "../schemas/maintenance-item.schema.ts";

export class MaintenanceItem {
  readonly kind!: MaintenanceItemProps["kind"];
  readonly requirement!: string;
  readonly detail!: string;
  readonly agent?: string;
  readonly repaired!: boolean;

  constructor(props: MaintenanceItemProps) {
    validateSchema(this, MaintenanceItemSchema, props);
  }

  get isLack(): boolean {
    return this.kind === MaintenanceKind.Missing || this.kind === MaintenanceKind.Drift;
  }

  get report(): MaintenanceItemProps["kind"] | "repaired" {
    return this.repaired ? "repaired" : this.kind;
  }
}
