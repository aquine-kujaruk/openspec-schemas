import { expect, it } from "vitest";
import { MaintenanceReport } from "../../../../../factory/maintenance/domain/aggregates/maintenance-report.aggregate.ts";
import { MaintenanceKind } from "../../../../../factory/maintenance/domain/schemas/maintenance-item.schema.ts";
import { MaintenanceItem } from "../../../../../factory/maintenance/domain/value-objects/maintenance-item.value-object.ts";

const missing = new MaintenanceItem({
  kind: MaintenanceKind.Missing,
  requirement: "a schema link",
  detail: "The link is missing.",
});

it("fails with an unresolved requirement", () => {
  expect(new MaintenanceReport({ items: [missing] }).status).toBe(1);
});

it("reports a repaired requirement and exits successfully", () => {
  const repaired = new MaintenanceItem({
    kind: MaintenanceKind.Drift,
    requirement: "the pinned command",
    detail: "The pin does not match the installed package.",
    repaired: true,
  });
  expect(new MaintenanceReport({ items: [repaired] }).status).toBe(0);
  expect(repaired.report).toBe("repaired");
});

it("reports notes and suspect procedures without failing", () => {
  const note = new MaintenanceItem({
    kind: MaintenanceKind.Note,
    requirement: "maintenance",
    detail: "A runbook needs a key.",
  });
  const suspect = new MaintenanceItem({
    kind: MaintenanceKind.Suspect,
    requirement: "a suspect runbook",
    detail: "A runbook names a missing command.",
  });
  const report = new MaintenanceReport({ items: [note, suspect] });
  expect(report.status).toBe(0);
  expect(report.items.map((item) => item.report)).toEqual([MaintenanceKind.Note, MaintenanceKind.Suspect]);
});
