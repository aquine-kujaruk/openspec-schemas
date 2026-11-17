import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions.ts";
export class WorkOrderException extends DomainException {}

/** The order is missing or its process has no validator. */
export class NotValidatable extends WorkOrderException {}
