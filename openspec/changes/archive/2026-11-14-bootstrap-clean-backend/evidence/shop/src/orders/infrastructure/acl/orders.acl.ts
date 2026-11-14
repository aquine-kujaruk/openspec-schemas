import { z } from "zod";
export const orderRecordSchema = z.object({
  id: z.string().min(1),
  customer_id: z.string().min(1),
  total_cents: z.number().int().refine(Number.isSafeInteger),
  placed_at: z.iso.datetime({ offset: true }),
});
export const orderRecordsSchema = orderRecordSchema.array();
export type OrderRecord = z.infer<typeof orderRecordSchema>;
export interface OrdersAcl {
  listCustomerOrders(customerId: string): Promise<OrderRecord[]>;
}
