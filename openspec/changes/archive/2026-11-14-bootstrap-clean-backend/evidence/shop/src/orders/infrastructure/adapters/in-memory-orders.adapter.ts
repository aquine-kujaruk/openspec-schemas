import { orderRecordsSchema, type OrdersAcl, type OrderRecord } from "../acl/orders.acl";
import { ValidationException } from "../../../shared/domain/exceptions/validation.exceptions";
export class InMemoryOrdersAdapter implements OrdersAcl {
  constructor(private readonly records: OrderRecord[] = []) {}
  async listCustomerOrders(customerId: string): Promise<OrderRecord[]> {
    const result = orderRecordsSchema.safeParse(this.records);
    if (!result.success) {
      const cause = result.error;
      throw new ValidationException("Orders", cause);
    }
    return result.data.filter((record) => record.customer_id === customerId);
  }
}
