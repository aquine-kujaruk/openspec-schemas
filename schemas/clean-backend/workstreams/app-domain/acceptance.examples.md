# acceptance

## reference

```md openspec/specs/module/list-invoices/spec.md
# module/list-invoices Specification

## Purpose

Listing the invoices of the account, so that whoever bills it sees everything that was issued.

## Requirements

### Requirement: The invoices are listed

The system SHALL list every invoice the repository holds.

#### Scenario Outline: `<count>` stored invoices are listed

- **GIVEN** the repository holds `<count>` invoices <!-- invoicesStored -->
- **WHEN** the invoices are listed <!-- invoicesListed -->
- **THEN** `<count>` invoices are returned <!-- invoicesReturned -->

##### Examples:

  | count |
  | ----- |
  | 0     |
  | 2     |
```

```ts test/acceptance/module/repositories/in-memory-invoice.repository.ts
import type { InvoiceRepositoryInterface } from "../../../../src/module/application/repository-interfaces/invoice.repository-interface";
import type { InvoiceProps } from "../../../../src/module/domain/schemas/invoice.schema";
export class InMemoryInvoiceRepository implements InvoiceRepositoryInterface {
  private invoices: InvoiceProps[] = [];
  seed(invoices: InvoiceProps[]) {
    this.invoices = invoices;
  }
  async listInvoices() {
    return this.invoices;
  }
  async findInvoice(invoiceId: string) {
    return this.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  }
}
```

```ts test/acceptance/module/list-invoices.feature.steps.ts
import { expect } from "vitest";
import { ListInvoicesUseCase } from "../../../src/module/application/use-cases/list-invoices.use-case";
import { InvoiceStatus } from "../../../src/module/domain/schemas/invoice.schema";
import { InMemoryInvoiceRepository } from "./repositories/in-memory-invoice.repository";
export function createSteps() {
  const invoices = new InMemoryInvoiceRepository();
  let listed = 0;
  return {
    async invoicesStored(count: string) {
      invoices.seed(
        Array.from({ length: Number(count) }, (_, i) => ({
          id: `i${i}`,
          total: 100,
          status: InvoiceStatus.PAID,
        })),
      );
    },
    async invoicesListed() {
      listed = (await new ListInvoicesUseCase(invoices).execute()).length;
    },
    async invoicesReturned(count: string) {
      expect(listed).toBe(Number(count));
    },
  };
}
```

```ts test/acceptance/module/list-invoices.feature.test.ts
import { createSteps } from "./list-invoices.feature.steps";
export const run = async () => {
  const steps = createSteps();
  await steps.invoicesStored("2");
  await steps.invoicesListed();
  await steps.invoicesReturned("2");
};
```

## scaffolds

```ejs test/acceptance/<module>/repositories/in-memory-<name>.repository.ts
import type { <%= Name %>RepositoryInterface } from "../../../../src/<%= module %>/application/repository-interfaces/<%= name %>.repository-interface";
import type { <%= Name %>Props } from "../../../../src/<%= module %>/domain/schemas/<%= name %>.schema";
export class InMemory<%= Name %>Repository implements <%= Name %>RepositoryInterface {
  private items: <%= Name %>Props[] = [];
  seed(items: <%= Name %>Props[]) {
    this.items = items;
  }
}
```

## acceptance-test-targets-use-case

### steps-without-use-case

```md openspec/specs/module/ghost/spec.md
# module/ghost Specification
```

```ts test/acceptance/module/ghost.feature.steps.ts
export function createSteps() {
  return {};
}
```

```expect
- test/acceptance/module/ghost.feature.steps.ts (archunit)
```

### steps-without-spec

```ts src/module/application/use-cases/pay-invoice.use-case.ts
export class PayInvoiceUseCase {
  execute() {
    return 1;
  }
}
```

```ts test/acceptance/module/pay-invoice.feature.steps.ts
export function createSteps() {
  return {};
}
```

```expect
- test/acceptance/module/pay-invoice.feature.steps.ts (archunit)
```

### hand-written-test

```ts test/acceptance/module/list-invoices.test.ts
export const run = () => 1;
```

```expect
- test/acceptance/module/list-invoices.test.ts (archunit)
```

### test-outside-module-folder

```ts test/acceptance/list-invoices.feature.steps.ts
export function createSteps() {
  return {};
}
```

```expect
- test/acceptance/list-invoices.feature.steps.ts (archunit)
```

### helper-outside-repositories

```ts test/acceptance/module/module.fakes.ts
export const inMemoryInvoices = () => ({ listInvoices: async () => [] });
```

```expect
- test/acceptance/module/module.fakes.ts (archunit)
```

## acceptance-repository-is-a-repository

### repository-without-interface

```ts test/acceptance/module/repositories/in-memory-invoice.repository.ts
export class InMemoryInvoiceRepository {
  async listInvoices() {
    return [];
  }
}
```

```expect
- test/acceptance/module/repositories/in-memory-invoice.repository.ts (archunit)
```

### repository-with-constructor-args

```ts test/acceptance/module/repositories/in-memory-invoice.repository.ts
import type { InvoiceRepositoryInterface } from "../../../../src/module/application/repository-interfaces/invoice.repository-interface";
import type { InvoiceProps } from "../../../../src/module/domain/schemas/invoice.schema";
export class InMemoryInvoiceRepository implements InvoiceRepositoryInterface {
  constructor(private readonly invoices: InvoiceProps[]) {}
  async listInvoices() {
    return this.invoices;
  }
  async findInvoice(invoiceId: string) {
    return this.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  }
}
```

```expect
- test/acceptance/module/repositories/in-memory-invoice.repository.ts (archunit)
```

### repository-misnamed

```ts test/acceptance/module/repositories/invoice-double.ts
import type { InvoiceRepositoryInterface } from "../../../../src/module/application/repository-interfaces/invoice.repository-interface";
export class InvoiceDouble implements InvoiceRepositoryInterface {
  async listInvoices() {
    return [];
  }
  async findInvoice() {
    return null;
  }
}
```

```expect
- test/acceptance/module/repositories/invoice-double.ts (archunit)
```

## acceptance-throws-domain-exceptions

### steps-throw-raw-error

```ts test/acceptance/module/list-invoices.feature.steps.ts
export function createSteps() {
  return {
    async invoicesStored(count: string) {
      if (Number.isNaN(Number(count))) throw new Error(`not a count: ${count}`);
    },
  };
}
```

```expect
- test/acceptance/module/list-invoices.feature.steps.ts (archunit)
```

### repository-throws-foreign-exception

```ts test/acceptance/module/repositories/in-memory-invoice.repository.ts
import type { InvoiceRepositoryInterface } from "../../../../src/module/application/repository-interfaces/invoice.repository-interface";
import { DomainException } from "../../../../src/shared/domain/exceptions/domain.exceptions";
export class InMemoryInvoiceRepository implements InvoiceRepositoryInterface {
  async listInvoices() {
    throw new DomainException("offline");
  }
  async findInvoice() {
    return null;
  }
}
```

```expect
- test/acceptance/module/repositories/in-memory-invoice.repository.ts (archunit)
```
