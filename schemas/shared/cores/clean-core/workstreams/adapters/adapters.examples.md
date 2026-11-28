# adapters

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

```ts src/module/infrastructure/acl/client.acl.ts
export interface ClientAcl {
  listClients(segment: string): Promise<string[]>;
}
```

```ts src/shared/infrastructure/adapters/http-api.adapter.ts
import type { z } from "zod";
import type { DomainException } from "../../domain/exceptions/domain.exceptions";

export class HttpApiAdapter {
  constructor(private readonly baseUrl: string) {}
  async get<S extends z.ZodType>(
    path: string,
    schema: S,
    fail: (response: Response) => DomainException,
  ): Promise<z.output<S>> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) throw fail(response);

    return schema.parse(await response.json());
  }
  async find<S extends z.ZodType>(
    path: string,
    schema: S,
    fail: (response: Response) => DomainException,
  ): Promise<z.output<S> | null> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (response.status === 404) return null;
    if (!response.ok) throw fail(response);

    return schema.parse(await response.json());
  }
  async put(
    path: string,
    body: unknown,
    fail: (response: Response) => DomainException,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw fail(response);
  }
}
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import { InvoiceUnavailableException } from "../../domain/exceptions/invoice.exceptions";
import { HttpApiAdapter } from "../../../shared/infrastructure/adapters/http-api.adapter";
import { InvoiceRecordSchema, type InvoiceAcl, type InvoiceRecord } from "../acl/invoice.acl";
const unavailable = (response: Response) => new InvoiceUnavailableException({ cause: response });

export class HttpInvoiceAdapter implements InvoiceAcl {
  constructor(private readonly api = new HttpApiAdapter("/api")) {}
  listInvoices(): Promise<InvoiceRecord[]> {
    return this.api.get("/invoices", InvoiceRecordSchema.array(), unavailable);
  }
  findInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
    return this.api.find(`/invoices/${invoiceId}`, InvoiceRecordSchema, unavailable);
  }
  saveInvoice(invoice: InvoiceRecord): Promise<void> {
    return this.api.put(`/invoices/${invoice.id}`, invoice, unavailable);
  }
}
```

```ts src/module/infrastructure/adapters/in-memory-invoice.adapter.ts
import { InvoiceRecordSchema, type InvoiceAcl, type InvoiceRecord } from "../acl/invoice.acl";

const SEED: InvoiceRecord[] = InvoiceRecordSchema.array().parse([
  { id: "1", total: 10, status: "paid" },
  { id: "2", total: 25, status: "pending" },
]);

export class InMemoryInvoiceAdapter implements InvoiceAcl {
  private readonly rows = SEED.map((row) => ({ ...row }));
  async listInvoices(): Promise<InvoiceRecord[]> {
    return [...this.rows];
  }
  async findInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
    return this.rows.find((row) => row.id === invoiceId) ?? null;
  }
  async saveInvoice(invoice: InvoiceRecord): Promise<void> {
    const at = this.rows.findIndex((row) => row.id === invoice.id);

    if (at < 0) this.rows.push({ ...invoice });
    else this.rows[at] = { ...invoice };
  }
}
```

```ts src/module/infrastructure/adapters/invoice.adapter.ts
import type { InvoiceAcl } from "../acl/invoice.acl";
import { HttpInvoiceAdapter } from "./http-invoice.adapter";
import { InMemoryInvoiceAdapter } from "./in-memory-invoice.adapter";

export const invoiceAdapter: InvoiceAcl = process.env.NODE_ENV === "development"
  ? new InMemoryInvoiceAdapter()
  : new HttpInvoiceAdapter();
```

```ts src/module/infrastructure/adapters/http-client.adapter.ts
import { ClientsUnavailableException } from "../../domain/exceptions/invoice.exceptions";
import { HttpApiAdapter } from "../../../shared/infrastructure/adapters/http-api.adapter";
import type { ClientAcl } from "../acl/client.acl";

export class HttpClientAdapter implements ClientAcl {
  constructor(private readonly api = new HttpApiAdapter("/api")) {}
  listClients(segment: string): Promise<string[]> {
    return this.api.get(
      `/clients/${segment}`,
      { parse: (raw: unknown) => raw as string[] },
      (response) => new ClientsUnavailableException({ cause: response }),
    );
  }
}
```

```ts src/module/infrastructure/adapters/client.adapter.ts
import type { ClientAcl } from "../acl/client.acl";
import { HttpClientAdapter } from "./http-client.adapter";
export const clientAdapter: ClientAcl = new HttpClientAdapter();
```

## scaffolds

```ejs src/shared/infrastructure/adapters/http-api.adapter.ts
import type { z } from "zod";
import type { DomainException } from "../../domain/exceptions/domain.exceptions";

export class HttpApiAdapter {
  constructor(private readonly baseUrl: string) {}
  async get<S extends z.ZodType>(
    path: string,
    schema: S,
    fail: (response: Response) => DomainException,
  ): Promise<z.output<S>> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) throw fail(response);

    return schema.parse(await response.json());
  }
  async find<S extends z.ZodType>(
    path: string,
    schema: S,
    fail: (response: Response) => DomainException,
  ): Promise<z.output<S> | null> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (response.status === 404) return null;
    if (!response.ok) throw fail(response);

    return schema.parse(await response.json());
  }
  async put(
    path: string,
    body: unknown,
    fail: (response: Response) => DomainException,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw fail(response);
  }
}
```

## infrastructure-vocabulary

### wrong-suffix

```ts src/module/infrastructure/adapters/http.ts
export class HttpAdapter {}
```

```expect
- src/module/infrastructure/adapters/http.ts (archunit)
```

## acl-adapter-paired

### acl-without-adapter

```ts src/module/infrastructure/acl/invoice.acl.ts
export interface InvoiceAcl {
  listInvoices(): Promise<string[]>;
}
```

```expect
- src/module/infrastructure/acl/invoice.acl.ts (archunit)
```

### acl-exports-class

```ts src/module/infrastructure/acl/invoice.acl.ts
export class InvoiceAcl {
  async listInvoices() {
    return [];
  }
}
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import { InvoiceAcl } from "../acl/invoice.acl";
export class HttpInvoiceAdapter extends InvoiceAcl {}
```

```expect
- src/module/infrastructure/acl/invoice.acl.ts (archunit)
```

## adapter-implements-acl

### adapter-without-acl

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export class HttpInvoiceAdapter {
  async listInvoices() {
    return [];
  }
}
```

```expect
- src/module/infrastructure/adapters/http-invoice.adapter.ts (archunit)
```

### implements-other-module-acl

```ts src/other/infrastructure/acl/invoice.acl.ts
export interface InvoiceAcl {
  listInvoices(): Promise<string[]>;
}
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import type { InvoiceAcl } from "../../../other/infrastructure/acl/invoice.acl";
export class HttpInvoiceAdapter implements InvoiceAcl {
  async listInvoices() {
    return [];
  }
}
```

```expect
- src/module/infrastructure/adapters/http-invoice.adapter.ts (archunit)
```

## adapter-imports-no-domain-schema

### imports-domain-schema

```ts src/module/domain/schemas/invoice.schema.ts
import { z } from "zod";
export const InvoiceSchema = z.object({ id: z.string() });
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import { InvoiceSchema } from "../../domain/schemas/invoice.schema";
export class HttpInvoiceAdapter {
  async listInvoices() {
    return InvoiceSchema.array().parse([]);
  }
}
```

```expect
- src/module/infrastructure/adapters/http-invoice.adapter.ts (archunit)
```

## infrastructure-names-the-role

### class-named-helper

```ts src/module/infrastructure/adapters/invoice-headers.adapter.ts
export class InvoiceHeadersHelper {
  headers() {
    return {};
  }
}
```

```expect
- src/module/infrastructure/adapters/invoice-headers.adapter.ts (archunit)
```

### file-named-util

```ts src/module/infrastructure/adapters/http-util.adapter.ts
export const join = (base: string, path: string) => `${base}${path}`;
```

```expect
- src/module/infrastructure/adapters/http-util.adapter.ts (archunit)
```

## infrastructure-throws-domain-exceptions

### throws-raw-error

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export class HttpInvoiceAdapter {
  async listInvoices() {
    const response = await fetch("/invoices");
    if (!response.ok) throw new Error("invoices failed");
    return response.json();
  }
}
```

```expect
- src/module/infrastructure/adapters/http-invoice.adapter.ts (archunit)
```

### throws-own-exception-class

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
class HttpException extends Error {}
export class HttpInvoiceAdapter {
  async listInvoices() {
    const response = await fetch("/invoices");
    if (!response.ok) throw new HttpException("invoices failed", { cause: response });
    return response.json();
  }
}
```

```expect
- src/module/infrastructure/adapters/http-invoice.adapter.ts (archunit)
```

### throws-without-cause

```ts src/module/domain/exceptions/invoice.exceptions.ts
export class InvoicesUnavailableException extends Error {}
```

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import { InvoicesUnavailableException } from "../../domain/exceptions/invoice.exceptions";
export class HttpInvoiceAdapter {
  async listInvoices() {
    const response = await fetch("/invoices");
    if (!response.ok) throw new InvoicesUnavailableException(response.statusText);
    return response.json();
  }
}
```

```expect
- src/module/infrastructure/adapters/http-invoice.adapter.ts (archunit)
```

### throws-shared-exception

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
import { DomainException } from "../../../shared/domain/exceptions/domain.exceptions";
export class HttpInvoiceAdapter {
  async listInvoices() {
    throw new DomainException("invoices failed", { cause: "offline" });
  }
}
```

```expect
- src/module/infrastructure/adapters/http-invoice.adapter.ts (archunit)
```

## infrastructure-imports-only-core

### imports-entry

```ts src/main.ts
export const invoicesKey = () => ["invoices"] as const;
```

```ts src/module/infrastructure/adapters/http.adapter.ts
import { invoicesKey } from "../../../main";
export class HttpAdapter {
  key = invoicesKey();
}
```

```expect
- src/module/infrastructure/adapters/http.adapter.ts (fallow)
```

## no-framework-import

### imports-framework-package

```ts src/module/infrastructure/adapters/session.adapter.ts
import express from "express";
export const session = express();
```

```expect
- src/module/infrastructure/adapters/session.adapter.ts (oxlint)
```
