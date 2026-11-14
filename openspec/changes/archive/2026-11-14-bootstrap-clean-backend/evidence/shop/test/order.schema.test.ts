import { describe, expect, test } from "vitest";
import { validateOrder, type OrderProps } from "../src/orders/domain/schemas/order.schema";
import { ValidationException } from "../src/shared/domain/exceptions/validation.exceptions";
import { DomainException } from "../src/shared/domain/exceptions/domain.exceptions";
import { OrdersException, OrdersUnavailableException } from "../src/orders/domain/exceptions/orders.exceptions";

const order: OrderProps = {
  id: "order-1",
  customerId: "customer-a",
  totalCents: 1234,
  placedAt: "2026-01-03T10:00:00Z",
};

describe("Order props validation", () => {
  test("resource exceptions retain their cause and domain exception family", () => {
    const cause = new Error("Orders service unavailable");
    const error = new OrdersUnavailableException({ cause });
    expect(error).toBeInstanceOf(OrdersException);
    expect(error).toBeInstanceOf(DomainException);
    expect(error.cause).toBe(cause);
    expect(error.name).toBe("OrdersUnavailableException");
    expect(new OrdersUnavailableException().cause).toBeUndefined();
  });

  test.each([0, -1234, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER])(
    "preserves safe integer cents: %s",
    (totalCents) => {
      const props = { ...order, totalCents, placedAt: "2026-01-03T11:00:00+01:00" };
      expect(validateOrder(props)).toEqual(props);
    },
  );

  test.each([1.5, Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1, NaN, Infinity])(
    "rejects invalid cents: %s",
    (totalCents) => {
      expect(() => validateOrder({ ...order, totalCents })).toThrow(ValidationException);
    },
  );

  test.each([
    "not-a-date",
    "2026-02-30T10:00:00Z",
    "2026-01-03",
    "2026-01-03T10:00:00",
    "2026-01-03T25:00:00Z",
    "2026-01-03T10:00:00+25:00",
  ])("rejects invalid or offset-free timestamps: %s", (placedAt) => {
    expect(() => validateOrder({ ...order, placedAt })).toThrow(ValidationException);
  });

  test.each(["id", "customerId"] as const)("rejects empty %s and retains the validation cause", (field) => {
    try {
      validateOrder({ ...order, [field]: "" });
      expect.fail("Expected invalid order props to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      expect(error).toMatchObject({ source: "Order", cause: expect.any(Error) });
    }
  });
});
