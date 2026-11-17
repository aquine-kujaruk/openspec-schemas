import type { z } from "zod";
import { ValidationException } from "../exceptions/validation.exceptions.ts";

export const validateSchema = <S extends z.ZodType>(
  target: object,
  schema: S,
  props: unknown,
): z.output<S> => {
  const result = schema.safeParse(props);
  if (!result.success) throw new ValidationException(target.constructor.name, result.error);
  Object.assign(target, result.data);
  return result.data;
};
