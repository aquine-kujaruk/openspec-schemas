import { describe, expect, it } from "vitest";
import { Authorization } from "../../../../../factory/change-control/domain/value-objects/authorization.value-object.ts";
import { ProtectedArea } from "../../../../../factory/change-control/domain/value-objects/protected-area.value-object.ts";

describe("write authorization", () => {
  it("allows an empty batch of refusals", () => {
    expect(new Authorization({ refusals: [] }).allowed).toBe(true);
  });

  it("retains the protected area and all refusal reasons without opening the batch", () => {
    const generated = new ProtectedArea({
      name: "generated tests",
      patterns: ["acceptance/orders"],
      guidance: "regenerate",
      suffix: ".feature.test.ts",
    });
    expect(generated.covers("acceptance/orders/list.feature.test.ts")).toBe(true);
    expect(generated.covers("acceptance/orders/list.feature.steps.ts")).toBe(false);
    expect(generated.covers("acceptance/orders-extra/list.feature.test.ts")).toBe(false);
    const refusals = [
      { path: "acceptance/orders/list.feature.test.ts", part: generated.name, reason: generated.guidance },
      { path: "src/orders/entity.ts", reason: "no change in implementation" },
    ];
    const authorization = new Authorization({ blockedBy: generated, refusals });
    expect(authorization.allowed).toBe(false);
    expect(authorization.blockedBy).toBe(generated);
    expect(authorization.refusals).toEqual(refusals);
  });
});
