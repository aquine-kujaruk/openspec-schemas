# controllers

## reference

```ts src/module/application/use-cases/list-invoices.use-case.ts
export class ListInvoicesUseCase {
  async execute(): Promise<string[]> {
    return [];
  }
}
```

```ts src/module/framework/controllers/invoice.controller.ts
import type { ListInvoicesUseCase } from "../../application/use-cases/list-invoices.use-case";

export type Io = { write(line: string): void; status(code: number): void };

export class InvoiceController {
  constructor(private readonly list: ListInvoicesUseCase, private readonly io: Io) {}

  async listInvoices(): Promise<void> {
    for (const invoice of await this.list.execute()) this.io.write(invoice);

    this.io.status(0);
  }
}
```

## controllers-vocabulary

### file-outside-controllers

```ts src/module/framework/views/invoice.view.ts
export const invoiceLine = (id: string): string => `invoice ${id}`;
```

```expect
- src/module/framework/views/invoice.view.ts (archunit)
```

## controller-reaches-core-through-use-cases

### controller-imports-adapter

```ts src/module/infrastructure/adapters/http-invoice.adapter.ts
export class HttpInvoiceAdapter {
  async listInvoices(): Promise<string[]> {
    return [];
  }
}
```

```ts src/module/framework/controllers/invoice.controller.ts
import { HttpInvoiceAdapter } from "../../infrastructure/adapters/http-invoice.adapter";

export class InvoiceController {
  async listInvoices(): Promise<string[]> {
    return new HttpInvoiceAdapter().listInvoices();
  }
}
```

```expect
- src/module/framework/controllers/invoice.controller.ts (fallow)
```
