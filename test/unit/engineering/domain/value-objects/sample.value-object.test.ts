import { expect, it } from "vitest";
import { SampleValueObject } from "../../../../../factory/engineering/domain/value-objects/sample.value-object.ts";

import { ValidationException } from "../../../../../factory/shared/domain/exceptions/validation.exceptions.ts";

const standard = "repository-contract";

it("holds the sample files and identifies the standard each expected defect triggers", () => {
  const file = "orders/application/place-order.use-case.ts";
  const files = new Map([[file, "export class PlaceOrderUseCase {}"]]);
  const expected = [{ file, standard }];
  const sample = new SampleValueObject({ standard, files, expected });

  expect(sample.standard).toBe(standard);
  expect(sample.files).toEqual(files);
  expect(sample.expected).toEqual(expected);
});

it("rejects an expected defect with no file", () => {
  expect(() => new SampleValueObject({
    standard, files: new Map(), expected: [{ file: "", standard }],
  })).toThrow(ValidationException);
});
