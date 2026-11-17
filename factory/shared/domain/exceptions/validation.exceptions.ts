import { DomainException } from "./domain.exceptions.ts";

export class ValidationException extends DomainException {
  readonly source: string;

  constructor(source: string, cause: unknown) {
    super(`${source} rejected its props`, { cause });
    this.source = source;
  }
}
