import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions.ts";
export class WorkOrderException extends DomainException {}

export class NotValidatable extends WorkOrderException {}

export class JudgementUnanswered extends WorkOrderException {}
