# application

## reference

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
import type { InvoiceProps } from "../../domain/schemas/invoice.schema";

export interface InvoiceRepositoryInterface {
  listInvoices(): Promise<InvoiceProps[]>;
  findInvoice(invoiceId: string): Promise<InvoiceProps | null>;
  saveInvoice(invoice: InvoiceProps): Promise<void>;
}
```

```ts src/module/application/use-cases/list-invoices.use-case.ts
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import type { InvoiceRepositoryInterface } from "../repository-interfaces/invoice.repository-interface";

export class ListInvoicesUseCase {
  constructor(private readonly invoices: InvoiceRepositoryInterface) {}
  async execute() {
    return (await this.invoices.listInvoices()).map((props) => new InvoiceEntity(props));
  }
}
```

```ts src/module/application/use-cases/get-invoice.use-case.ts
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { InvoiceNotFoundException } from "../../domain/exceptions/invoice.exceptions";
import type { InvoiceRepositoryInterface } from "../repository-interfaces/invoice.repository-interface";

export class GetInvoiceUseCase {
  constructor(private readonly invoices: InvoiceRepositoryInterface) {}
  async execute(invoiceId: string) {
    const props = await this.invoices.findInvoice(invoiceId);
    if (!props) throw new InvoiceNotFoundException(invoiceId);

    return new InvoiceEntity(props);
  }
}
```

```ts src/module/application/use-cases/pay-invoice.use-case.ts
import { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { InvoiceNotFoundException } from "../../domain/exceptions/invoice.exceptions";
import type { InvoiceRepositoryInterface } from "../repository-interfaces/invoice.repository-interface";

export class PayInvoiceUseCase {
  constructor(private readonly invoices: InvoiceRepositoryInterface) {}
  async execute(invoiceId: string) {
    const props = await this.invoices.findInvoice(invoiceId);
    if (!props) throw new InvoiceNotFoundException(invoiceId);
    const paid = new InvoiceEntity(props).pay();
    await this.invoices.saveInvoice(paid);

    return paid;
  }
}
```

## scaffolds

```ejs src/<module>/application/repository-interfaces/<name>.repository-interface.ts
export interface <%= Name %>RepositoryInterface {}
```

## application-vocabulary

### folder-outside-vocabulary

```ts src/module/application/dto/invoice.dto.ts
export type InvoiceDto = { id: string };
```

```expect
- src/module/application/dto/invoice.dto.ts (archunit)
```

### wrong-suffix

```ts src/module/application/use-cases/list-invoices.ts
export class ListInvoicesUseCase {
  execute() {
    return [];
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.ts (archunit)
```

### services-folder

```ts src/module/application/services/invoice.service.ts
export class InvoiceService {
  list() {
    return [];
  }
}
```

```expect
- src/module/application/services/invoice.service.ts (archunit)
```

## use-case-is-class-with-execute

### no-use-case-class

```ts src/module/application/use-cases/list-invoices.use-case.ts
export const listInvoices = () => [];
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

## repository-contract-is-interface

### no-interface

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
export type InvoiceRepositoryInterface = { listInvoices(): string[] };
```

```expect
- src/module/application/repository-interfaces/invoice.repository-interface.ts (archunit)
```

### prefixed-with-i

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
export interface IInvoiceRepository {
  listInvoices(): Promise<string[]>;
}
```

```expect
- src/module/application/repository-interfaces/invoice.repository-interface.ts (archunit)
```

## repository-method-naming

### fetch-verb

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
export interface InvoiceRepositoryInterface {
  fetchInvoices(): Promise<string[]>;
}
```

```expect
- src/module/application/repository-interfaces/invoice.repository-interface.ts (archunit)
```

### bare-verb

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
export interface InvoiceRepositoryInterface {
  list(): Promise<string[]>;
}
```

```expect
- src/module/application/repository-interfaces/invoice.repository-interface.ts (archunit)
```

### get-returns-null

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
export interface InvoiceRepositoryInterface {
  getInvoice(invoiceId: string): Promise<string | null>;
}
```

```expect
- src/module/application/repository-interfaces/invoice.repository-interface.ts (archunit)
```

### find-never-null

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
export interface InvoiceRepositoryInterface {
  findInvoice(invoiceId: string): Promise<string>;
}
```

```expect
- src/module/application/repository-interfaces/invoice.repository-interface.ts (archunit)
```

## use-case-depends-on-contracts

### depends-on-implementation

```ts src/module/application/use-cases/list-invoices.use-case.ts
import { InvoiceRepositoryImplementation } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
export class ListInvoicesUseCase {
  constructor(private readonly invoices: InvoiceRepositoryImplementation) {}
  execute() {
    return this.invoices.listInvoices();
  }
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {
  async listInvoices() {
    return [];
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

### depends-on-adapter

```ts src/module/application/use-cases/list-invoices.use-case.ts
import type { HttpInvoiceAdapter } from "../../infrastructure/adapters/http-invoice.adapter";
export class ListInvoicesUseCase {
  constructor(private readonly api: HttpInvoiceAdapter) {}
  execute() {
    return this.api.listInvoices();
  }
}
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export class HttpInvoiceAdapter {
  async listInvoices() {
    return [];
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (archunit)
```

## application-imports-only-domain

### imports-infrastructure

```ts src/module/application/use-cases/list-invoices.use-case.ts
import { InvoiceRepositoryImplementation } from "../../infrastructure/repository-implementations/invoice.repository-implementation";
export class ListInvoicesUseCase {
  constructor(private repository = new InvoiceRepositoryImplementation()) {}
  execute() {
    return this.repository;
  }
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (fallow)
```

## no-framework-import

### imports-framework-package

```ts src/module/application/use-cases/list-invoices.use-case.ts
import express from "express";
export class ListInvoicesUseCase {
  execute() {
    return express;
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (oxlint)
```

## no-environment

### calls-environment

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  execute() {
    return process.cwd();
  }
}
```

```expect
- src/module/application/use-cases/list-invoices.use-case.ts (fallow, oxlint)
```

## S13 · expressive-repository-verb

### vague-operation

```ts src/catalog/application/repository-interfaces/vacancies.ts
interface VacancyRepositoryInterface { get(shift: Shift, skills: Skill[]): Promise<QualifiedAvailableWorker[]>; }
```

```ts src/catalog/infrastructure/repository-implementations/vacancies.repository-implementation.ts
export class VacancyRepositoryImplementation implements VacancyRepositoryInterface {
  constructor(private readonly workers: WorkerRecord[]) {}

  async get(shift: Shift, skills: Skill[]) {
    return this.workers
      .filter(worker => worker.isAvailableDuring(shift) && skills.every(skill => worker.hasSkill(skill)))
      .sort((first, second) => first.overtimeHours - second.overtimeHours);
  }
}
```

```expect
yes
```

### reference

```ts src/catalog/application/repository-interfaces/vacancies.repository-interface.ts
export interface VacancyRepositoryInterface {
  rankEligibleWorkersByAvailability(shift: Shift, requiredSkills: Skill[]): Promise<RankedWorker[]>;
}
```

```ts src/catalog/application/use-cases/rank-candidates.use-case.ts
export class RankCandidatesUseCase {
  constructor(private readonly vacancies: VacancyRepositoryInterface) {}
  execute(shift: Shift) { return this.vacancies.rankEligibleWorkersByAvailability(shift, shift.requiredSkills); }
}
```

```expect
no
```

## S15 · consumer-shape

### field-copy

```ts src/catalog/application/use-cases/summary.ts
function execute(item: ItemEntity) { return { code: item.code, caption: item.name, count: item.stock }; }
```

```expect
yes
```

### reference

```ts src/catalog/application/use-cases/summary.ts
function execute(item: ItemEntity) { return item.summary(); }
```

```expect
no
```

## S18 · atomic-use-case

### unrelated-methods

```ts src/catalog/application/use-cases/items.ts
class ItemsUseCase { createItem(name: string) { return this.repo.create(name); } deleteInvoice(id: string) { return this.invoices.delete(id); } }
```

```expect
yes
```

### reference

```ts src/catalog/application/use-cases/items.ts
class CreateItemUseCase { execute(name: string) { return this.repo.create(name); } }
```

```expect
no
```

## S19 · use-case-hydration

### raw-props

```ts src/catalog/application/use-cases/read.ts
class ReadItemUseCase { async execute(id: string) { const props = await this.repo.readItemProps(id); return props; } }
```

```expect
yes
```

### reference

```ts src/catalog/application/use-cases/read.ts
class ReadItemUseCase { async execute(id: string) { const props = await this.repo.readItemProps(id); return ItemEntity.from(props); } }
```

```expect
no
```
