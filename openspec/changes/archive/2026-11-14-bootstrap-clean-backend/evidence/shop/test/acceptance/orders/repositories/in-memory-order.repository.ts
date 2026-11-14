import type { OrderRepositoryInterface } from "../../../../src/orders/application/repository-interfaces/order.repository-interface";
import { validateOrder, type OrderProps } from "../../../../src/orders/domain/schemas/order.schema";
export class InMemoryOrderRepository implements OrderRepositoryInterface {
  private orders: OrderProps[] = [];
  seed(orders: OrderProps[]): void {
    this.orders = orders.map(validateOrder);
  }
  async listByCustomerId(customerId: string): Promise<OrderProps[]> {
    return this.orders.filter((order) => order.customerId === customerId).map((order) => ({ ...order }));
  }
}
