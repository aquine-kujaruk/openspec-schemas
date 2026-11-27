import { describe, expect, it } from "vitest";
import { QualityCertificateAggregate } from "../../../../../factory/quality/domain/aggregates/quality-certificate.aggregate.ts";
import type { QualityCertificateProps } from "../../../../../factory/quality/domain/schemas/quality-certificate.schema.ts";
import { ScenarioResultValueObject } from "../../../../../factory/quality/domain/value-objects/scenario-result.value-object.ts";

const certificate = (overrides: Partial<QualityCertificateProps> = {}) =>
  new QualityCertificateAggregate({
    workOrder: "add-orders",
    digest: "digest",
    scenarios: [],
    failing: [],
    review: { state: "run", warnings: ["review warning"] },
    procedures: [],
    ...overrides,
  });

describe("quality certificates", () => {
  it("keeps review warnings and declined procedures informational", () => {
    const inspected = certificate({ procedures: [{ slug: "check", env: "local", treatment: "declined" }] });
    expect(inspected.review.warnings).toEqual(["review warning"]);
    expect(inspected.verdict).toBe("verified");
  });

  it("fails unproved scenarios, checks and unexercised procedures", () => {
    const scenario = new ScenarioResultValueObject({
      spec: "orders/list", requirement: "Orders are listed", scenario: "lists orders", result: "missing",
    });
    expect(certificate({ scenarios: [scenario] }).verdict).toBe("not verified");
    expect(certificate({ failing: [{ workstream: "modules", output: "broken" }] }).verdict).toBe("not verified");
    expect(certificate({ procedures: [{ slug: "check", env: "sandbox", treatment: "not executed" }] }).verdict)
      .toBe("not verified");
    expect(certificate({ procedures: [{ slug: "check", env: "local", treatment: "executed", outcome: "failed" }] }).verdict)
      .toBe("not verified");
  });
});
