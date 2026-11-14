import { describe, expect, test } from "vitest";
import { orderRecordsSchema, type OrdersAcl, type OrderRecord } from "../../../src/orders/infrastructure/acl/orders.acl";
import { InMemoryOrdersAdapter } from "../../../src/orders/infrastructure/adapters/in-memory-orders.adapter";
import { OrderRepositoryImplementation } from "../../../src/orders/infrastructure/repository-implementations/order.repository-implementation";
import { OrdersUnavailableException } from "../../../src/orders/domain/exceptions/orders.exceptions";
import { ValidationException } from "../../../src/shared/domain/exceptions/validation.exceptions";

const record: OrderRecord = {
  id: "purchase-1", customer_id: "alice", total_cents: 2501,
  placed_at: "2026-05-11T12:30:00+02:00",
};
class FailingOrdersAdapter implements OrdersAcl {
  constructor(private readonly cause: Error) {}
  async listCustomerOrders(): Promise<OrderRecord[]> { throw this.cause; }
}

describe("Order repository over the Orders ACL", () => {
  test("maps every field unchanged and excludes other customers", async () => {
    const repository = new OrderRepositoryImplementation(new InMemoryOrdersAdapter([
      record, { ...record, id: "purchase-2", customer_id: "bob" },
      { ...record, id: "purchase-3", total_cents: -100 },
    ]));
    expect(await repository.listByCustomerId("alice")).toEqual([
      { id: "purchase-1", customerId: "alice", totalCents: 2501, placedAt: record.placed_at },
      { id: "purchase-3", customerId: "alice", totalCents: -100, placedAt: record.placed_at },
    ]);
    expect(await repository.listByCustomerId("missing")).toEqual([]);
  });

  test("also isolates customers when the resource returns unrelated records", async () => {
    const acl: OrdersAcl = { listCustomerOrders: async () => [record, { ...record, customer_id: "bob" }] };
    expect(await new OrderRepositoryImplementation(acl).listByCustomerId("alice")).toHaveLength(1);
  });

  test("empty resource records produce an empty history", async () => {
    expect(await new OrderRepositoryImplementation(new InMemoryOrdersAdapter()).listByCustomerId("alice")).toEqual([]);
  });

  test.each([0, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER])("preserves exact integer cents %s", async (total_cents) => {
    const repository = new OrderRepositoryImplementation(new InMemoryOrdersAdapter([{ ...record, total_cents }]));
    expect((await repository.listByCustomerId("alice"))[0].totalCents).toBe(total_cents);
  });

  test.each([
    { id: "" }, { customer_id: "" }, { total_cents: 0.1 },
    { total_cents: Number.MAX_SAFE_INTEGER + 1 }, { placed_at: "2026-02-30T00:00:00Z" },
    { placed_at: "2026-01-01T10:00:00" },
  ])("rejects invalid seeded resource fields: %j", async (invalid) => {
    const repository = new OrderRepositoryImplementation(new InMemoryOrdersAdapter([{ ...record, ...invalid }]));
    await expect(repository.listByCustomerId("alice")).rejects.toMatchObject({
      name: "ValidationException", cause: expect.any(Error),
    });
  });

  test("repository validates ACL output independently", async () => {
    const acl: OrdersAcl = { listCustomerOrders: async () => [{ ...record, total_cents: 1.5 }] };
    await expect(new OrderRepositoryImplementation(acl).listByCustomerId("alice")).rejects.toBeInstanceOf(ValidationException);
  });

  test.each([null, {}, [null], [{ id: "incomplete" }]])("ACL rejects malformed arrays %j", (raw) => {
    expect(orderRecordsSchema.safeParse(raw).success).toBe(false);
  });

  test.each(["network", "HTTP status", "configuration"])("propagates module resource failure: %s", async (category) => {
    const cause = new Error(category);
    const error = new OrdersUnavailableException({ cause });
    const repository = new OrderRepositoryImplementation(new FailingOrdersAdapter(error));
    await expect(repository.listByCustomerId("alice")).rejects.toBe(error);
    expect(error.cause).toBe(cause);
  });

  test("propagates JSON decoding validation failure with its cause", async () => {
    const cause = new SyntaxError("Invalid JSON");
    const error = new ValidationException("Orders JSON", cause);
    const repository = new OrderRepositoryImplementation(new FailingOrdersAdapter(error));
    await expect(repository.listByCustomerId("alice")).rejects.toBe(error);
    expect(error.cause).toBe(cause);
  });

  test("translates unexpected resource errors and retains the original cause", async () => {
    const cause = new Error("resource failed");
    const repository = new OrderRepositoryImplementation(new FailingOrdersAdapter(cause));
    await expect(repository.listByCustomerId("alice")).rejects.toMatchObject({ name: "OrdersUnavailableException", cause });
  });
});
