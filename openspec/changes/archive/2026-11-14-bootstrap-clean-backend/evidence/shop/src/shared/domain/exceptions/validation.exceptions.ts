import { DomainException } from "./domain.exceptions";
export class ValidationException extends DomainException {
  constructor(public readonly source: string, cause: unknown) {
    super(`${source} rejected its props`, { cause });
  }
}
