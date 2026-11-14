import type { OrderProps } from "../../domain/schemas/order.schema";
export interface OrderRepositoryInterface {
  listByCustomerId(customerId: string): Promise<OrderProps[]>;
}
