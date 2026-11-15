# domain

## reference

```ts src/shared/domain/exceptions/domain.exceptions.ts
export class DomainException extends Error {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
  }
}
```

```ts src/shared/domain/exceptions/validation.exceptions.ts
import { DomainException } from "./domain.exceptions";
export class ValidationException extends DomainException {
  constructor(
    public readonly source: string,
    cause: unknown,
  ) {
    super(`${source} rejected its props`, { cause });
  }
}
```

```ts src/shared/domain/schemas/validation.schema.ts
import type { z } from "zod";
import { ValidationException } from "../exceptions/validation.exceptions";
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
```

```ts src/module/domain/schemas/invoice.schema.ts
import { z } from "zod";
export enum InvoiceStatus {
  PAID = "paid",
  PENDING = "pending",
}
export const InvoiceSchema = z.object({
  id: z.string().min(1),
  total: z.number().int(),
  status: z.enum(InvoiceStatus),
});
export type InvoiceProps = z.infer<typeof InvoiceSchema>;
```

```ts src/module/domain/schemas/invoice-book.schema.ts
import { z } from "zod";
import { InvoiceSchema } from "./invoice.schema";
export const InvoiceBookSchema = z.object({
  year: z.number().int(),
  invoices: z.array(InvoiceSchema),
});
export type InvoiceBookProps = z.infer<typeof InvoiceBookSchema>;
```

```ts src/module/domain/entities/invoice.entity.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { InvoiceSchema, InvoiceStatus, type InvoiceProps } from "../schemas/invoice.schema";
export class InvoiceEntity {
  public readonly id!: string;
  public readonly total!: number;
  public readonly status!: InvoiceStatus;
  constructor(props: InvoiceProps) {
    validateSchema(this, InvoiceSchema, props);
  }
  get isPaid() {
    return this.status === InvoiceStatus.PAID;
  }
}
```

```ts src/module/domain/aggregates/invoice-book.aggregate.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { InvoiceEntity } from "../entities/invoice.entity";
import { InvoiceBookSchema, type InvoiceBookProps } from "../schemas/invoice-book.schema";
export class InvoiceBookAggregate {
  public readonly year!: number;
  public readonly invoices: InvoiceEntity[];
  constructor(props: InvoiceBookProps) {
    const valid = validateSchema(this, InvoiceBookSchema, props);
    this.invoices = valid.invoices.map((invoice) => new InvoiceEntity(invoice));
  }
  get unpaid() {
    return this.invoices.filter((invoice) => !invoice.isPaid);
  }
}
```

```ts src/module/domain/exceptions/invoice.exceptions.ts
import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions";
export class ModuleException extends DomainException {}
export class InvoiceNotFoundException extends ModuleException {
  constructor(
    public readonly invoiceId: string,
    options: { cause?: unknown } = {},
  ) {
    super(`Invoice ${invoiceId} does not exist`, options);
  }
}
export class InvoiceUnavailableException extends ModuleException {
  constructor(options: { cause?: unknown } = {}) {
    super("Invoices are unavailable", options);
  }
}
export class ClientsUnavailableException extends ModuleException {
  constructor(options: { cause?: unknown } = {}) {
    super("Clients are unavailable", options);
  }
}
```

```ts src/module/domain/services/late-payment.service.ts
import type { InvoiceEntity } from "../entities/invoice.entity";
export class LatePaymentService {
  lateOn(invoices: InvoiceEntity[], graceDays: number) {
    return invoices.filter((invoice) => !invoice.isPaid && graceDays > 30);
  }
}
```

## scaffolds

```ejs src/shared/domain/exceptions/domain.exceptions.ts
export class DomainException extends Error {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
  }
}
```

```ejs src/shared/domain/exceptions/validation.exceptions.ts
import { DomainException } from "./domain.exceptions";
export class ValidationException extends DomainException {
  constructor(
    public readonly source: string,
    cause: unknown,
  ) {
    super(`${source} rejected its props`, { cause });
  }
}
```

```ejs src/shared/domain/schemas/validation.schema.ts
import type { z } from "zod";
import { ValidationException } from "../exceptions/validation.exceptions";
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
```

```ejs src/<module>/domain/schemas/<name>.schema.ts
import { z } from "zod";
export const <%= Name %>Schema = z.object({});
export type <%= Name %>Props = z.infer<typeof <%= Name %>Schema>;
```

```ejs src/<module>/domain/entities/<name>.entity.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { <%= Name %>Schema, type <%= Name %>Props } from "../schemas/<%= name %>.schema";
export class <%= Name %>Entity {
  constructor(props: <%= Name %>Props) {
    validateSchema(this, <%= Name %>Schema, props);
  }
}
```

```ejs src/<module>/domain/value-objects/<name>.value-object.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { <%= Name %>Schema, type <%= Name %>Props } from "../schemas/<%= name %>.schema";
export class <%= Name %>ValueObject {
  constructor(props: <%= Name %>Props) {
    validateSchema(this, <%= Name %>Schema, props);
  }
}
```

```ejs src/<module>/domain/exceptions/<name>.exceptions.ts
import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions";
export class <%= Name %>Exception extends DomainException {}
```

## domain-vocabulary

### folder-outside-vocabulary

```ts src/module/domain/helpers/format.ts
export const format = (s: string) => s.trim();
```

```expect
- src/module/domain/helpers/format.ts (archunit)
```

### wrong-suffix

```ts src/module/domain/entities/invoice.ts
export class InvoiceEntity {}
```

```expect
- src/module/domain/entities/invoice.ts (archunit)
```

### rules-folder

```ts src/module/domain/rules/dead-statuses.ts
export const DEAD_STATUSES = ["cancelled", "expired"];
```

```expect
- src/module/domain/rules/dead-statuses.ts (archunit)
```

## entity-validates-with-schema

### no-schema

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {
  constructor(public id: string) {}
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

### parses-directly

```ts src/module/domain/entities/invoice.entity.ts
import { InvoiceSchema, type InvoiceProps } from "../schemas/invoice.schema";
export class InvoiceEntity {
  constructor(private props: InvoiceProps) {
    this.props = InvoiceSchema.parse(props);
  }
}
```

```ts src/module/domain/schemas/invoice.schema.ts
import { z } from "zod";
export const InvoiceSchema = z.object({ id: z.string() });
export type InvoiceProps = z.infer<typeof InvoiceSchema>;
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

### validates-elsewhere

```ts src/module/domain/entities/invoice.entity.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { InvoiceSchema, type InvoiceProps } from "../schemas/invoice.schema";
export class InvoiceEntity {
  public readonly id!: string;
  private constructor() {}
  static from(props: InvoiceProps) {
    const invoice = new InvoiceEntity();
    validateSchema(invoice, InvoiceSchema, props);
    return invoice;
  }
}
```

```ts src/module/domain/schemas/invoice.schema.ts
import { z } from "zod";
export const InvoiceSchema = z.object({ id: z.string() });
export type InvoiceProps = z.infer<typeof InvoiceSchema>;
```

```ts src/shared/domain/schemas/validation.schema.ts
export const validateSchema = (target: object, schema: { parse(p: unknown): object }, props: unknown) =>
  Object.assign(target, schema.parse(props));
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

## aggregate-composes-domain-objects

### composes-nothing

```ts src/module/domain/aggregates/invoice-book.aggregate.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { InvoiceBookSchema, type InvoiceBookProps } from "../schemas/invoice-book.schema";
export class InvoiceBookAggregate {
  public readonly year!: number;
  public readonly count!: number;
  constructor(props: InvoiceBookProps) {
    validateSchema(this, InvoiceBookSchema, props);
  }
}
```

```ts src/module/domain/schemas/invoice-book.schema.ts
import { z } from "zod";
export const InvoiceBookSchema = z.object({ year: z.number(), count: z.number() });
export type InvoiceBookProps = z.infer<typeof InvoiceBookSchema>;
```

```ts src/shared/domain/schemas/validation.schema.ts
export const validateSchema = (target: object, schema: { parse(p: unknown): object }, props: unknown) =>
  Object.assign(target, schema.parse(props));
```

```expect
- src/module/domain/aggregates/invoice-book.aggregate.ts (archunit)
```

### imports-but-holds-none

```ts src/module/domain/aggregates/invoice-book.aggregate.ts
import { validateSchema } from "../../../shared/domain/schemas/validation.schema";
import { InvoiceEntity } from "../entities/invoice.entity";
import { InvoiceBookSchema, type InvoiceBookProps } from "../schemas/invoice-book.schema";
export class InvoiceBookAggregate {
  public readonly year!: number;
  constructor(props: InvoiceBookProps) {
    validateSchema(this, InvoiceBookSchema, props);
  }
  first() {
    return new InvoiceEntity({ id: "1" });
  }
}
```

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {
  constructor(public readonly props: { id: string }) {}
}
```

```ts src/module/domain/schemas/invoice-book.schema.ts
import { z } from "zod";
export const InvoiceBookSchema = z.object({ year: z.number() });
export type InvoiceBookProps = z.infer<typeof InvoiceBookSchema>;
```

```ts src/shared/domain/schemas/validation.schema.ts
export const validateSchema = (target: object, schema: { parse(p: unknown): object }, props: unknown) =>
  Object.assign(target, schema.parse(props));
```

```expect
- src/module/domain/aggregates/invoice-book.aggregate.ts (archunit)
```

## exception-extends-domain-exception

### extends-error

```ts src/module/domain/exceptions/invoice.exceptions.ts
export class InvoiceNotFoundException extends Error {}
```

```expect
- src/module/domain/exceptions/invoice.exceptions.ts (archunit)
```

### extends-nothing

```ts src/module/domain/exceptions/invoice.exceptions.ts
export class InvoiceNotFoundException {
  constructor(public readonly invoiceId: string) {}
}
```

```expect
- src/module/domain/exceptions/invoice.exceptions.ts (archunit)
```

### redeclares-base

```ts src/module/domain/exceptions/invoice.exceptions.ts
export class DomainException extends Error {}
export class InvoiceNotFoundException extends DomainException {}
```

```expect
- src/module/domain/exceptions/invoice.exceptions.ts (archunit)
```

### two-module-bases

```ts src/module/domain/exceptions/invoice.exceptions.ts
import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions";
export class InvoiceException extends DomainException {}
```

```ts src/module/domain/exceptions/client.exceptions.ts
import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions";
export class ClientException extends DomainException {}
```

```expect
- src/module/domain/exceptions/client.exceptions.ts (archunit)
- src/module/domain/exceptions/invoice.exceptions.ts (archunit)
```

## closed-set-lives-in-schema

### enum-in-entity

```ts src/module/domain/entities/invoice.entity.ts
export enum InvoiceStatus {
  PAID = "paid",
  PENDING = "pending",
}
export class InvoiceEntity {
  constructor(public readonly status: InvoiceStatus) {}
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

### enum-in-use-case

```ts src/module/application/use-cases/list-invoices.use-case.ts
export enum InvoiceFilter {
  ALL = "all",
  UNPAID = "unpaid",
}
export class ListInvoicesUseCase {
  execute(filter: InvoiceFilter) {
    return [filter];
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

### enum-in-repository

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export enum InvoiceSource {
  BILLING = "billing",
  LEGACY = "legacy",
}
export class InvoiceRepositoryImplementation {
  source = InvoiceSource.BILLING;
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

## no-magic-closed-set-strings

### compares-status-literal

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {
  constructor(public readonly status: string) {}
  get isPaid() {
    return this.status === "paid";
  }
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

### switches-on-type-literal

```ts src/module/application/use-cases/describe-invoice.use-case.ts
export class DescribeInvoiceUseCase {
  execute(invoice: { type: string }) {
    switch (invoice.type) {
      case "proforma":
        return "draft";
      default:
        return "final";
    }
  }
}
```

```expect
- src/module/application/use-cases/describe-invoice.use-case.ts (archunit)
```

## domain-service-named-by-policy

### named-helper

```ts src/module/domain/services/invoice-helper.service.ts
export class InvoiceHelperService {
  total(amounts: number[]) {
    return amounts.reduce((a, b) => a + b, 0);
  }
}
```

```expect
- src/module/domain/services/invoice-helper.service.ts (archunit)
```

### exports-no-class

```ts src/module/domain/services/late-payment.service.ts
export const isLate = (graceDays: number) => graceDays > 30;
```

```expect
- src/module/domain/services/late-payment.service.ts (archunit)
```

## domain-imports-only-domain

### imports-infrastructure

```ts src/module/domain/entities/invoice.entity.ts
import { InvoiceRepositoryImplementation } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
export class InvoiceEntity {
  repository = new InvoiceRepositoryImplementation();
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {}
```

```expect
- src/module/domain/entities/invoice.entity.ts (fallow)
```

## no-framework-import

### imports-framework-package

```ts src/module/domain/entities/invoice.entity.ts
import express from "express";
export class InvoiceEntity {
  server = express;
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (oxlint)
```

## no-environment

### calls-environment

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {
  folder() {
    return process.cwd();
  }
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (fallow, oxlint)
```
