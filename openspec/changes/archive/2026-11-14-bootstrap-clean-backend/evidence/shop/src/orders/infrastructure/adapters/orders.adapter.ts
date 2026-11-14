import type { OrdersAcl } from "../acl/orders.acl";
import { HttpOrdersAdapter } from "./http-orders.adapter";
import { InMemoryOrdersAdapter } from "./in-memory-orders.adapter";
declare const process: { env: Record<string, string | undefined> };
export const ordersAdapter: OrdersAcl = process.env.NODE_ENV === "development"
  ? new InMemoryOrdersAdapter()
  : new HttpOrdersAdapter(process.env.ORDERS_API_URL ?? "");
