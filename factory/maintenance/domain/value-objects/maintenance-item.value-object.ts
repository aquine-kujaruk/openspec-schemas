import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";

import {
  MaintenanceItemSchema,
  MaintenanceKind,
  type MaintenanceItemProps,
} from "../schemas/maintenance-item.schema.ts";

import { RuleChange, type RuleConformance } from "../schemas/rule-conformance.schema.ts";

export class MaintenanceItemValueObject {
  readonly kind!: MaintenanceItemProps["kind"];
  readonly requirement!: string;
  readonly detail!: string;
  readonly agent?: string;
  readonly repaired!: boolean;

  constructor(props: MaintenanceItemProps) {
    validateSchema(this, MaintenanceItemSchema, props);
  }

  static ofRule({ rule, change, files, product }: RuleConformance): MaintenanceItemValueObject | undefined {
    if (change === RuleChange.Unchanged) return undefined;

    const where = product ? ` in ${product}` : "";
    const note = (detail: string) => new MaintenanceItemValueObject({ kind: MaintenanceKind.Note, requirement: rule, detail });

    if (change === RuleChange.Removed) return note(`the rule ${rule} left with the update${where}`);
    if (!files.length) return note(`the rule ${rule} is ${change} by the update${where} and the code keeps it`);

    return new MaintenanceItemValueObject({
      kind: MaintenanceKind.Outdated,
      requirement: rule,
      detail: `the rule ${rule} is ${change} by the update${where} and ${files.length} file(s) break it: ${files.join(", ")}; adapt the code in a change before planning anything else`,
    });
  }

  get isLack(): boolean {
    return [MaintenanceKind.Missing, MaintenanceKind.Drift, MaintenanceKind.Outdated].some((kind) => kind === this.kind);
  }

  get report(): MaintenanceItemProps["kind"] | "repaired" {
    return this.repaired ? "repaired" : this.kind;
  }
}
