import { z } from "zod";
import { ValidationException } from "../../../shared/domain/exceptions/validation.exceptions";
export const OrderSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  totalCents: z.number().int().refine(Number.isSafeInteger),
  placedAt: z.iso.datetime({ offset: true }),
});
export type OrderProps = z.infer<typeof OrderSchema>;
export function validateOrder(props: OrderProps): OrderProps {
  const result = OrderSchema.safeParse(props);
  if (!result.success) throw new ValidationException("Order", result.error);
  return result.data;
}
