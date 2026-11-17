# integration

## reference

```ts test/integration/module/invoice-repository.test.ts
import type { InvoiceAcl, InvoiceRecord } from "../../../src/module/infrastructure/acl/invoice.acl";
import { InvoiceRepositoryImplementation } from "../../../src/module/infrastructure/repository-implementations/invoice.repository-implementation";
import { InvoiceStatus } from "../../../src/module/domain/schemas/invoice.schema";
class InMemoryInvoiceAdapter implements InvoiceAcl {
  constructor(private readonly records: InvoiceRecord[]) {}
  async listInvoices() {
    return this.records;
  }
  async findInvoice(invoiceId: string) {
    return this.records.find((r) => r.id === invoiceId) ?? null;
  }
  async saveInvoice(invoice: InvoiceRecord) {
    this.records.push(invoice);
  }
}
export const run = async () => {
  const invoices = new InvoiceRepositoryImplementation(new InMemoryInvoiceAdapter([]));
  await invoices.saveInvoice({ id: "1", total: 10, status: InvoiceStatus.PAID });
  return invoices.listInvoices();
};
```

## integration-test-targets-repository-implementation

### test-without-implementation

```ts test/integration/module/ghost-repository.test.ts
export const run = () => 1;
```

```expect
- test/integration/module/ghost-repository.test.ts (archunit)
```

### test-outside-module-folder

```ts test/integration/invoice-repository.test.ts
export const run = () => 1;
```

```expect
- test/integration/invoice-repository.test.ts (archunit)
```

### test-without-repository-suffix

```ts test/integration/module/invoice.test.ts
export const run = () => 1;
```

```expect
- test/integration/module/invoice.test.ts (archunit)
```
