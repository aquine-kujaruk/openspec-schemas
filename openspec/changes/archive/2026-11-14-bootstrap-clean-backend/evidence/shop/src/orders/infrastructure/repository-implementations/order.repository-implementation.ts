import type { OrderRepositoryInterface } from "../../application/repository-interfaces/order.repository-interface";
import { validateOrder, type OrderProps } from "../../domain/schemas/order.schema";
import { OrdersException, OrdersUnavailableException } from "../../domain/exceptions/orders.exceptions";
import { ValidationException } from "../../../shared/domain/exceptions/validation.exceptions";
import { orderRecordsSchema, type OrdersAcl } from "../acl/orders.acl";
export class OrderRepositoryImplementation implements OrderRepositoryInterface {
  constructor(private readonly orders: OrdersAcl) {}
  async listByCustomerId(customerId: string): Promise<OrderProps[]> {
    let raw: unknown;
    try {
      raw = await this.orders.listCustomerOrders(customerId);
    } catch (cause) {
      if (cause instanceof OrdersException || cause instanceof ValidationException) throw cause;
      throw new OrdersUnavailableException({ cause });
    }
    const result = orderRecordsSchema.safeParse(raw);
    if (!result.success) {
      const cause = result.error;
      throw new ValidationException("Orders", cause);
    }
    return result.data.filter((record) => record.customer_id === customerId).map((record) => validateOrder({
      id: record.id,
      customerId: record.customer_id,
      totalCents: record.total_cents,
      placedAt: record.placed_at,
    }));
  }
}
