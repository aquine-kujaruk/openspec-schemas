import { DomainException } from "./domain.exceptions.ts";

/** The decision model could not be asked: the service failed or refused the request. */
export class DecisionModelUnavailable extends DomainException {}
