import { orderRecordsSchema, type OrdersAcl, type OrderRecord } from "../acl/orders.acl";
import { OrdersUnavailableException } from "../../domain/exceptions/orders.exceptions";
import { ValidationException } from "../../../shared/domain/exceptions/validation.exceptions";
export class HttpOrdersAdapter implements OrdersAcl {
  private readonly baseUrl: URL;
  constructor(baseUrl: string) {
    try {
      const url = new URL(baseUrl);
      if (!["http:", "https:"].includes(url.protocol) || url.search || url.hash || url.username || url.password) {
        throw new OrdersUnavailableException({ cause: url });
      }
      url.pathname = url.pathname.replace(/\/+$/, "") + "/";
      this.baseUrl = url;
    } catch (cause) {
      if (cause instanceof OrdersUnavailableException) throw cause;
      throw new OrdersUnavailableException({ cause });
    }
  }
  async listCustomerOrders(customerId: string): Promise<OrderRecord[]> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.href}customers/${encodeURIComponent(customerId)}/orders`, { method: "GET" });
    } catch (cause) {
      throw new OrdersUnavailableException({ cause });
    }
    if (!response.ok) throw new OrdersUnavailableException({ cause: response });
    let raw: unknown;
    try {
      raw = await response.json();
    } catch (cause) {
      throw new ValidationException("Orders JSON", cause);
    }
    const result = orderRecordsSchema.safeParse(raw);
    if (!result.success) {
      const cause = result.error;
      throw new ValidationException("Orders", cause);
    }
    return result.data;
  }
}
