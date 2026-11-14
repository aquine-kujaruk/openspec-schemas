import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions";
export class OrdersException extends DomainException {}
export class OrdersUnavailableException extends OrdersException {
  constructor(options: { cause?: unknown } = {}) {
    super("Orders are unavailable", options);
  }
}
