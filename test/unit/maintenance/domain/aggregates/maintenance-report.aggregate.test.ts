import { expect, it } from "vitest";
import { MaintenanceReportAggregate } from "../../../../../factory/maintenance/domain/aggregates/maintenance-report.aggregate.ts";
import { MaintenanceKind } from "../../../../../factory/maintenance/domain/schemas/maintenance-item.schema.ts";
import { MaintenanceItemValueObject } from "../../../../../factory/maintenance/domain/value-objects/maintenance-item.value-object.ts";

const missing = new MaintenanceItemValueObject({
  kind: MaintenanceKind.Missing,
  requirement: "a schema link",
  detail: "The link is missing.",
});

it("fails with an unresolved requirement", () => {
  expect(new MaintenanceReportAggregate({ items: [missing] }).status).toBe(1);
});

it("reports a repaired requirement and exits successfully", () => {
  const repaired = new MaintenanceItemValueObject({
    kind: MaintenanceKind.Drift,
    requirement: "the pinned command",
    detail: "The pin does not match the installed package.",
    repaired: true,
  });
  expect(new MaintenanceReportAggregate({ items: [repaired] }).status).toBe(0);
  expect(repaired.report).toBe("repaired");
});

it("reports notes and suspect procedures without failing", () => {
  const note = new MaintenanceItemValueObject({
    kind: MaintenanceKind.Note,
    requirement: "maintenance",
    detail: "A runbook needs a key.",
  });
  const suspect = new MaintenanceItemValueObject({
    kind: MaintenanceKind.Suspect,
    requirement: "a suspect runbook",
    detail: "A runbook names a missing command.",
  });
  const report = new MaintenanceReportAggregate({ items: [note, suspect] });
  expect(report.status).toBe(0);
  expect(report.items.map((item) => item.report)).toEqual([MaintenanceKind.Note, MaintenanceKind.Suspect]);
});
