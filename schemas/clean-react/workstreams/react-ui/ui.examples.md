# ui

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

```ts src/module/framework/view-models/invoice-row.view-model.ts
import type { InvoiceEntity } from "../../domain/entities/invoice.entity";
export const invoiceRowViewModel = (invoice: InvoiceEntity) => ({ label: `#${invoice.id}` });
```

```ts src/module/framework/controllers/invoices.controller.ts
import { useListInvoicesQuery } from "../queries/list-invoices.query";
import { invoiceRowViewModel } from "../view-models/invoice-row.view-model";
export const useInvoicesController = () => {
  const query = useListInvoicesQuery();
  const rows = (query.data ?? []).map(invoiceRowViewModel);
  return { rows, isEmpty: !query.data };
};
```

```tsx src/module/framework/ui/invoices/invoices.page.tsx
import { useInvoicesController } from "../../controllers/invoices.controller";
export const InvoicesPage = () => {
  const { rows, isEmpty } = useInvoicesController();
  return (
    <ul>
      {isEmpty && <li>No invoices</li>}
      {rows.map((row) => (
        <li key={row.label}>{row.label}</li>
      ))}
    </ul>
  );
};
```

```tsx src/main.tsx
import { InvoicesPage } from "./module/framework/ui/invoices/invoices.page";
export const App = () => <InvoicesPage />;
```


## scaffolds

```ejs src/<module>/framework/controllers/<name>.controller.ts
export const use<%= Name %>Controller = () => ({ title: "<%= Name %>" });
```

```ejs src/<module>/framework/ui/<name>/<name>.page.tsx
import { use<%= Name %>Controller } from "../../controllers/<%= name %>.controller";
export const <%= Name %>Page = () => {
  const view = use<%= Name %>Controller();
  return <main>{view.title}</main>;
};
```

## ui-reaches-core-through-controllers

### imports-query

```tsx src/module/framework/ui/invoices/invoices.page.tsx
import { useListInvoicesQuery } from "../../queries/list-invoices.query";
export const InvoicesPage = () => <p>{useListInvoicesQuery().status}</p>;
```

```ts src/module/framework/queries/list-invoices.query.ts
export const useListInvoicesQuery = () => ({ status: "success" });
```

```expect
- src/module/framework/ui/invoices/invoices.page.tsx (fallow)
```

### imports-store

```tsx src/module/framework/ui/invoices/invoices.page.tsx
import { useSelectionStore } from "../../stores/selection.store";
export const InvoicesPage = () => <p>{useSelectionStore().selected}</p>;
```

```ts src/module/framework/stores/selection.store.ts
export const useSelectionStore = () => ({ selected: "1" });
```

```expect
- src/module/framework/ui/invoices/invoices.page.tsx (fallow)
```

### imports-infrastructure

```tsx src/module/framework/ui/invoices/invoices.page.tsx
import { invoiceRepository } from "../../../infrastructure/repository-implementations/invoice.repository-implementation";
export const InvoicesPage = () => <p>{invoiceRepository.list().join(",")}</p>;
```

```ts src/module/infrastructure/repository-implementations/invoice.repository-implementation.ts
export const invoiceRepository = { list: () => [] as string[] };
```

```expect
- src/module/framework/ui/invoices/invoices.page.tsx (fallow)
```

### reads-cache-itself

```tsx src/module/framework/ui/invoices/invoices.page.tsx
import { useQueryClient } from "@tanstack/react-query";
export const InvoicesPage = () => <p>{String(useQueryClient().isFetching())}</p>;
```

```expect
- src/module/framework/ui/invoices/invoices.page.tsx (oxlint)
```

## jsx-only-in-ui

### jsx-outside-ui

```tsx src/module/domain/entities/card.tsx
export const Card = () => <div />;
```

```expect
- src/module/domain/entities/card.tsx (archunit)
```

## jsx-neither-compares-nor-counts

### jsx-compares-and-counts

```tsx src/module/framework/ui/invoices/invoice-rows.tsx
export const InvoiceRows = (p: { rows: string[]; selected: string }) => (
  <ul>
    {p.rows.length === 0 ? "No invoices" : null}
    {p.rows.map((row) => (
      <li key={row} className={row === p.selected ? "selected" : ""}>
        {row}
      </li>
    ))}
  </ul>
);
```

```expect
- src/module/framework/ui/invoices/invoice-rows.tsx (archunit)
```

## ui-never-persists

### ui-persists

```tsx src/module/framework/ui/invoices/invoices.page.tsx
export const InvoicesPage = () => (
  <button onClick={() => localStorage.setItem("selection", "1")}>Select</button>
);
```

```expect
- src/module/framework/ui/invoices/invoices.page.tsx (fallow, oxlint)
```
