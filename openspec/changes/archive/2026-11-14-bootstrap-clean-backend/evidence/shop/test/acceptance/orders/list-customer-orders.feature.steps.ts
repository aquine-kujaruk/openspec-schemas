import { expect } from "vitest";
import { ListCustomerOrdersUseCase } from "../../../src/orders/application/use-cases/list-customer-orders.use-case";
import type { OrderProps } from "../../../src/orders/domain/schemas/order.schema";
import { InMemoryOrderRepository } from "./repositories/in-memory-order.repository";

export function createSteps() {
  const repository = new InMemoryOrderRepository();
  const useCase = new ListCustomerOrdersUseCase(repository);
  let listed: OrderProps[] = [];
  const rows = (table: string[][]): OrderProps[] => {
    expect(table[0]).toEqual(["id", "customerId", "totalCents", "placedAt"]);
    return table.slice(1).map(([id, customerId, totalCents, placedAt]) => ({
      id, customerId, totalCents: Number(totalCents), placedAt,
    }));
  };
  return {
    ordersExist(table: string[][]): void { repository.seed(rows(table)); },
    async listCustomerOrders(customerId: string): Promise<void> {
      listed = await useCase.execute(customerId);
    },
    listedOrdersAre(table: string[][]): void { expect(listed).toEqual(rows(table)); },
    listedOrderCountIs(count: string): void { expect(listed).toHaveLength(Number(count)); },
  };
}
