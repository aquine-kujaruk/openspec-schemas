# modules

## modules-are-isolated

### imports-another-module

```ts src/module/domain/entities/invoice.entity.ts
import { OrderEntity } from "../../../other/domain/entities/order.entity";
export class InvoiceEntity {
  order = new OrderEntity();
}
```

```ts src/other/domain/entities/order.entity.ts
export class OrderEntity {}
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

## shared-imports-no-module

### shared-imports-module

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {}
```

```ts src/shared/domain/entities/audit.entity.ts
import { InvoiceEntity } from "../../../module/domain/entities/invoice.entity";
export class AuditEntity {
  subject = InvoiceEntity;
}
```

```expect
- src/shared/domain/entities/audit.entity.ts (archunit)
```

## no-import-cycles

### import-cycle

```ts src/module/application/use-cases/get-invoice.use-case.ts
import { ListInvoicesUseCase } from "./list-invoices.use-case";
export class GetInvoiceUseCase {
  execute() {
    return new ListInvoicesUseCase();
  }
}
```

```ts src/module/application/use-cases/list-invoices.use-case.ts
import { GetInvoiceUseCase } from "./get-invoice.use-case";
export class ListInvoicesUseCase {
  execute() {
    return new GetInvoiceUseCase();
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

## every-file-in-a-zone

### file-outside-every-zone

```ts src/module/utils/format.ts
export const format = (s: string) => s;
```

```expect
- src/module/utils/format.ts (fallow)
```

## no-tests-in-src

### test-inside-src

```ts src/module/application/use-cases/list-invoices.use-case.test.ts
export const test = 1;
```

```expect
- src/module/application/use-cases/list-invoices.use-case.test.ts (archunit)
```

## schema-package-only-at-boundaries

### schema-package-in-entity

```ts src/module/domain/entities/invoice.entity.ts
import { z } from "zod";
export class InvoiceEntity {
  constructor(public readonly id: string) {
    z.string().parse(id);
  }
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (oxlint)
```

### schema-package-in-use-case

```ts src/module/application/use-cases/list-invoices.use-case.ts
import { z } from "zod";
export class ListInvoicesUseCase {
  execute(raw: unknown) {
    return z.array(z.string()).parse(raw);
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (oxlint)
```

### schema-package-in-repository

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import { z } from "zod";
export class InvoiceRepositoryImplementation {
  async listInvoices() {
    return z.array(z.string()).parse([]);
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (oxlint)
```

## no-any-in-core

### any-in-entity

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {
  constructor(public readonly raw: any) {}
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

### any-in-repository

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {
  async listInvoices(): Promise<any[]> {
    return [];
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### record-any-in-use-case

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  execute(filters: Record<string, any>) {
    return Object.keys(filters);
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

## no-raw-error-in-core

### raw-error-in-entity

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {
  constructor(public readonly total: number) {
    if (total < 0) throw new Error("negative total");
  }
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

### raw-error-in-use-case

```ts src/module/application/use-cases/get-invoice.use-case.ts
export class GetInvoiceUseCase {
  execute(invoiceId: string) {
    if (!invoiceId) throw new Error("missing id");
    return invoiceId;
  }
}
```

```expect
- src/module/application/use-cases/get-invoice.use-case.ts (archunit)
```

## no-harness-escapes

### lint-rule-disabled

```ts src/module/domain/entities/invoice.entity.ts
export class InvoiceEntity {
  folder() {
    // oxlint-disable-next-line no-restricted-globals
    return process.cwd();
  }
}
```

```expect
- src/module/domain/entities/invoice.entity.ts (archunit)
```

### type-error-suppressed

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  execute(): number {
    // @ts-ignore
    return "none";
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

### type-error-expected

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  execute(): number {
    // @ts-expect-error
    return "none";
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

### cast-through-unknown

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {
  listInvoices(records: string[]) {
    return records as unknown as number[];
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

## S08 · shared-domain-owner

### cross-module-import

```ts src/invoicing/domain/value-objects/money.value-object.ts
export class Money {
  constructor(readonly currencyCode: string, readonly minorUnits: number) {}
  format() { return this.currencyCode + " " + (this.minorUnits / 100).toFixed(2); }
}
```

```ts src/invoicing/domain/entities/invoice.entity.ts
import { Money } from "../value-objects/money.value-object";
export class InvoiceEntity { constructor(readonly total: Money) {} }
```

```ts src/payroll/domain/entities/paycheck.entity.ts
import { Money } from "../../../invoicing/domain/value-objects/money.value-object";
export class PaycheckEntity { constructor(readonly grossPay: Money) {} }
```

```expect
- src/invoicing/domain/value-objects/money.value-object.ts (gpt-6-luna yes 0.98 · d160236b68b3af93202eb0d9530715df804dd5f71e586deb452304d9d3cc6fd3)
```

### reference

```ts src/sales/domain/entities/sale.ts
import { Unit } from "../../shared/domain/unit"; export class Sale { unit = new Unit(); }
```

```ts src/shared/domain/unit.ts
export class Unit { round(n: number) { return Math.round(n); } }
```

```ts src/catalog/domain/item.ts
import { Unit } from "../../shared/domain/unit"; export class Item { unit = new Unit(); }
```

```expect
(no findings) (gpt-6-luna no 0 · 340f60fa23a8705193b2599fd09d5560302c03f6451002818f4cb89b2bad6c6f)
```
