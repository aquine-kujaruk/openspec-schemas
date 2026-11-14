import type { OrderRepositoryInterface } from "../repository-interfaces/order.repository-interface";
import type { OrderProps } from "../../domain/schemas/order.schema";
export class ListCustomerOrdersUseCase {
  constructor(private readonly repository: OrderRepositoryInterface) {}
  async execute(customerId: string): Promise<OrderProps[]> {
    const orders = await this.repository.listByCustomerId(customerId);
    return [...orders].sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt));
  }
}
