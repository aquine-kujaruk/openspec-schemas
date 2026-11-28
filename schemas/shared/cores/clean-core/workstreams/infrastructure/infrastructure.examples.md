# infrastructure

## reference

```ts src/module/infrastructure/acl/invoice.acl.ts
import type { z } from "zod";
import { InvoiceSchema } from "../../domain/schemas/invoice.schema";
export const InvoiceRecordSchema = InvoiceSchema;
export type InvoiceRecord = z.infer<typeof InvoiceRecordSchema>;

export interface InvoiceAcl {
  listInvoices(): Promise<InvoiceRecord[]>;
  findInvoice(invoiceId: string): Promise<InvoiceRecord | null>;
  saveInvoice(invoice: InvoiceRecord): Promise<void>;
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import type { InvoiceRepositoryInterface } from "../../application/repository-interfaces/invoice.repository-interface";
import type { InvoiceProps } from "../../domain/schemas/invoice.schema";
import type { InvoiceAcl } from "../acl/invoice.acl";
import { InvoiceUnavailableException } from "../../domain/exceptions/invoice.exceptions.ts";

export class InvoiceRepositoryImplementation implements InvoiceRepositoryInterface {
  constructor(private readonly invoices: InvoiceAcl) {}
  async listInvoices(): Promise<InvoiceProps[]> {
    try {
      return await this.invoices.listInvoices();
    } catch (cause) {
      throw new InvoiceUnavailableException({ cause });
    }
  }
  findInvoice(invoiceId: string): Promise<InvoiceProps | null> {
    return this.invoices.findInvoice(invoiceId);
  }
  saveInvoice(invoice: InvoiceProps): Promise<void> {
    return this.invoices.saveInvoice(invoice);
  }
}
```

```ts src/module/application/repository-interfaces/client.repository-interface.ts
export interface ClientRepositoryInterface {
  listClients(): Promise<string[]>;
}
```

```ts src/module/infrastructure/acl/client.acl.ts
export interface ClientAcl {
  listClients(segment: string): Promise<string[]>;
}
```

```ts src/module/infrastructure/repository-implementations/client.repository-implementation.ts
import type { ClientRepositoryInterface } from "../../application/repository-interfaces/client.repository-interface";
import type { ClientAcl } from "../acl/client.acl";

export abstract class ClientRepositoryBase implements ClientRepositoryInterface {
  constructor(private readonly clients: ClientAcl) {}
  protected abstract readonly segment: string;
  listClients() {
    return this.clients.listClients(this.segment);
  }
}
```

```ts src/module/infrastructure/repository-implementations/b2b-client.repository-implementation.ts
import { ClientRepositoryBase } from "./client.repository-implementation";

export class B2bClientRepositoryImplementation extends ClientRepositoryBase {
  protected readonly segment = "b2b";
}
```

```ts src/module/infrastructure/repository-implementations/b2c-client.repository-implementation.ts
import { ClientRepositoryBase } from "./client.repository-implementation";

export class B2cClientRepositoryImplementation extends ClientRepositoryBase {
  protected readonly segment = "b2c";
}
```

## scaffolds

```ejs src/<module>/infrastructure/acl/<name>.acl.ts
export interface <%= Name %>Acl {}
```

## infrastructure-vocabulary

### folder-outside-vocabulary

```ts src/module/infrastructure/mappers/headers.ts
export const headers = () => ({});
```

```expect
- src/module/infrastructure/mappers/headers.ts (archunit)
```

### wrong-suffix

```ts src/module/infrastructure/acl/invoice.ts
export interface InvoiceAcl {
  listInvoices(): Promise<string[]>;
}
```

```expect
- src/module/infrastructure/acl/invoice.ts (archunit)
```

### emergent-wrong-suffix

```ts src/module/infrastructure/paginators/page.ts
export class PagePaginator {}
```

```expect
- src/module/infrastructure/paginators/page.ts (archunit)
```

## repository-implements-interface

### no-implements

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {
  listInvoices() {
    return [];
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### extends-base-without-interface

```ts src/module/infrastructure/repository-implementations/client.repository-implementation.ts
export abstract class ClientRepositoryBase {
  listClients() {
    return [];
  }
}
```

```ts src/module/infrastructure/repository-implementations/b2b-client.repository-implementation.ts
import { ClientRepositoryBase } from "./client.repository-implementation";
export class B2bClientRepositoryImplementation extends ClientRepositoryBase {}
```

```expect
- src/module/infrastructure/repository-implementations/b2b-client.repository-implementation.ts (archunit)
- src/module/infrastructure/repository-implementations/client.repository-implementation.ts (archunit)
```

### named-by-technology

```ts src/module/application/repository-interfaces/invoice.repository-interface.ts
export interface InvoiceRepositoryInterface {
  listInvoices(): Promise<string[]>;
}
```

```ts src/module/infrastructure/repository-implementations/http-invoice.repository-implementation.ts
import type { InvoiceRepositoryInterface } from "../../application/repository-interfaces/invoice.repository-interface";
export class HttpInvoiceRepository implements InvoiceRepositoryInterface {
  async listInvoices() {
    return [];
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/http-invoice.repository-implementation.ts (archunit)
```

## repository-depends-on-acl

### typed-by-adapter-class

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export class HttpInvoiceAdapter {
  async listInvoices() {
    return [];
  }
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import type { HttpInvoiceAdapter } from "../adapters/http-invoice.adapter";
export class InvoiceRepositoryImplementation {
  constructor(private readonly invoices: HttpInvoiceAdapter) {}
  listInvoices() {
    return this.invoices.listInvoices();
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### imports-adapter-file

```ts src/module/infrastructure/acl/invoice.acl.ts
export interface InvoiceAcl {
  listInvoices(): Promise<string[]>;
}
```

```ts src/module/infrastructure/adapters/invoice.adapter.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
export const invoiceAdapter: InvoiceAcl = { listInvoices: async () => [] };
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
import { invoiceAdapter } from "../adapters/invoice.adapter";
export class InvoiceRepositoryImplementation {
  constructor(private readonly invoices: InvoiceAcl = invoiceAdapter) {}
  listInvoices() {
    return this.invoices.listInvoices();
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### imports-adapter-with-extension

```ts src/module/infrastructure/acl/invoice.acl.ts
export interface InvoiceAcl {
  listInvoices(): Promise<string[]>;
}
```

```ts src/module/infrastructure/adapters/invoice.adapter.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
export const invoiceAdapter: InvoiceAcl = { listInvoices: async () => [] };
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
import { invoiceAdapter } from "../adapters/invoice.adapter.ts";
export class InvoiceRepositoryImplementation {
  constructor(private readonly invoices: InvoiceAcl = invoiceAdapter) {}
  listInvoices() {
    return this.invoices.listInvoices();
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

## repository-never-news-adapter

### news-adapter-in-default

```ts src/module/infrastructure/acl/invoice.acl.ts
export interface InvoiceAcl {
  listInvoices(): Promise<string[]>;
}
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
export class HttpInvoiceAdapter implements InvoiceAcl {
  async listInvoices() {
    return [];
  }
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
import { HttpInvoiceAdapter } from "../adapters/http-invoice.adapter";
export class InvoiceRepositoryImplementation {
  constructor(private readonly invoices: InvoiceAcl = new HttpInvoiceAdapter()) {}
  listInvoices() {
    return this.invoices.listInvoices();
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### news-adapter-in-method

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export class HttpInvoiceAdapter {
  async listInvoices() {
    return [];
  }
}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import { HttpInvoiceAdapter } from "../adapters/http-invoice.adapter";
export class InvoiceRepositoryImplementation {
  listInvoices() {
    return new HttpInvoiceAdapter().listInvoices();
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

## infrastructure-names-the-role

### class-named-helper

```ts src/module/infrastructure/acl/invoice-headers.acl.ts
export class InvoiceHeadersHelper {
  headers() {
    return {};
  }
}
```

```expect
- src/module/infrastructure/acl/invoice-headers.acl.ts (archunit)
```

### file-named-util

```ts src/module/infrastructure/acl/http-util.acl.ts
export const join = (base: string, path: string) => `${base}${path}`;
```

```expect
- src/module/infrastructure/acl/http-util.acl.ts (archunit)
```

## infrastructure-throws-domain-exceptions

### throws-raw-error

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {
  async findInvoice(invoiceId: string) {
    throw new Error(`invoice ${invoiceId} missing`);
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### throws-own-exception-class

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
class InvoiceMissingException extends Error {}
export class InvoiceRepositoryImplementation {
  async findInvoice(invoiceId: string) {
    throw new InvoiceMissingException("invoice missing", { cause: invoiceId });
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### throws-without-cause

```ts src/module/domain/exceptions/invoice.exceptions.ts
export class InvoiceNotFoundException extends Error {}
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import { InvoiceNotFoundException } from "../../domain/exceptions/invoice.exceptions";
export class InvoiceRepositoryImplementation {
  async findInvoice(invoiceId: string) {
    throw new InvoiceNotFoundException(invoiceId);
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

### throws-shared-exception

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions";
export class InvoiceRepositoryImplementation {
  async findInvoice(invoiceId: string) {
    throw new DomainException("invoice lookup failed", { cause: invoiceId });
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (archunit)
```

## infrastructure-imports-only-core

### imports-entry

```ts src/main.ts
export const invoicesKey = () => ["invoices"] as const;
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
import { invoicesKey } from "../../../main";
export class InvoiceRepositoryImplementation {
  key = invoicesKey();
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (fallow)
```

### imports-adapter

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export const invoicesPath = "/invoices";
```

```ts src/module/infrastructure/acl/invoice.acl.ts
import { invoicesPath } from "../adapters/http-invoice.adapter";
export const INVOICES = invoicesPath;
```

```expect
- src/module/infrastructure/acl/invoice.acl.ts (fallow)
```

## no-framework-import

### imports-framework-package

```ts src/module/infrastructure/acl/session.acl.ts
import express from "express";
export const session = express();
```

```expect
- src/module/infrastructure/acl/session.acl.ts (oxlint)
```

## only-adapters-touch-environment

### uses-platform-global

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export class InvoiceRepositoryImplementation {
  listInvoices() {
    return fetch("/invoices").then((r) => r.json());
  }
}
```

```expect
- src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts (oxlint)
```

## S05 · repository-hydration

### domain-return

```ts src/catalog/infrastructure/repository-implementations/catalog.ts
async function listItems() { const rows = await db.list(); return rows.map(row => new ItemEntity(row)); }
```

```expect
yes
```

### reference

```ts src/catalog/infrastructure/repository-implementations/catalog.ts
async function listItems() { const rows = await db.list(); return ItemRecordSchema.array().parse(rows); }
```

```expect
no
```

## S10 · external-record-validation

### unparsed-record

```ts src/catalog/infrastructure/acl/contact.ts
export async function readContact() { return (await response.json()) as ContactRecord; }
```

```expect
yes
```

### reference

```ts src/catalog/infrastructure/acl/contact.ts
export async function readContact() { const raw: unknown = await response.json(); return ContactRecordSchema.parse(raw); }
```

```expect
no
```

## S14 · shared-resource-owner

### three-resource-clients

```ts src/payments/infrastructure/adapters/backoff.adapter.ts
export class BackoffAdapter {
  afterFailure(attempt: number) { return new Promise(resolve => setTimeout(resolve, 2 ** attempt * 100)); }
}
```

```ts src/payments/infrastructure/adapters/payments.adapter.ts
import { BackoffAdapter } from "./backoff.adapter";
export class PaymentsAdapter { readonly retryDelay = new BackoffAdapter(); }
```

```ts src/shipping/infrastructure/adapters/shipping.adapter.ts
import { BackoffAdapter } from "../../../payments/infrastructure/adapters/backoff.adapter";
export class ShippingAdapter { readonly retryDelay = new BackoffAdapter(); }
```

```ts src/inventory/infrastructure/adapters/inventory.adapter.ts
import { BackoffAdapter } from "../../../payments/infrastructure/adapters/backoff.adapter";
export class InventoryAdapter { readonly retryDelay = new BackoffAdapter(); }
```

```ts src/billing/infrastructure/adapters/billing.adapter.ts
import { BackoffAdapter } from "../../../payments/infrastructure/adapters/backoff.adapter";
export class BillingAdapter { readonly retryDelay = new BackoffAdapter(); }
```

```expect
yes
```

### reference

```ts src/payments/infrastructure/adapters/backoff.adapter.ts
export class BackoffAdapter {
  afterFailure(attempt: number) { return new Promise(resolve => setTimeout(resolve, 2 ** attempt * 100)); }
}
```

```ts src/payments/infrastructure/adapters/payments.adapter.ts
import { BackoffAdapter } from "./backoff.adapter";
export class PaymentsAdapter { readonly retryDelay = new BackoffAdapter(); }
```

```ts src/shipping/infrastructure/adapters/shipping.adapter.ts
import { BackoffAdapter } from "../../../payments/infrastructure/adapters/backoff.adapter";
export class ShippingAdapter { readonly retryDelay = new BackoffAdapter(); }
```

```expect
no
```
