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
import { InvoiceAlreadyPaidException } from "../exceptions/invoice.exceptions";
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
  pay() {
    if (this.isPaid) throw new InvoiceAlreadyPaidException(this.id);
    return new InvoiceEntity({ id: this.id, total: this.total, status: InvoiceStatus.PAID });
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
import { invoiceStatusLabel } from "./invoice-status.view-model";
export const invoiceRowViewModel = (invoice: InvoiceEntity) => ({
  id: invoice.id,
  label: `#${invoice.id}`,
  status: invoiceStatusLabel(invoice.status),
});
```

```ts src/module/framework/controllers/invoices.controller.ts
import { InvoiceStatus } from "../../domain/schemas/invoice.schema";
import { useListInvoicesQuery } from "../queries/list-invoices.query";
import { useInvoicesStore } from "../stores/invoices.store";
import { invoiceRowViewModel } from "../view-models/invoice-row.view-model";
import { invoiceStatusOptions } from "../view-models/invoice-status.view-model";
const ALL = "all";
export const useInvoicesController = () => {
  const { status, setStatus } = useInvoicesStore();
  const query = useListInvoicesQuery();
  const rows = (query.data ?? [])
    .filter((invoice) => !status || invoice.status === status)
    .map(invoiceRowViewModel);
  return {
    rows,
    isEmpty: query.isSuccess && rows.length === 0,
    filter: status ?? ALL,
    filterOptions: [{ value: ALL, label: "All" }, ...invoiceStatusOptions()],
    onFilter: (value: string) =>
      setStatus(Object.values(InvoiceStatus).find((s) => s === value) ?? null),
  };
};
```

```tsx src/module/framework/ui/invoices/invoices.page.tsx
import type { ComponentProps } from "react";
import { useInvoicesController } from "../../controllers/invoices.controller";
export const InvoicesPage = (props: { invoiceLink: (invoiceId: string) => ComponentProps<"a"> }) => {
  const { rows, isEmpty, filter, filterOptions, onFilter } = useInvoicesController();
  return (
    <main>
      <h1>Invoices</h1>
      <label>
        Status
        <select value={filter} onChange={(event) => onFilter(event.target.value)}>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <ul>
        {isEmpty && <li>No invoices</li>}
        {rows.map((row) => (
          <li key={row.id}>
            <a {...props.invoiceLink(row.id)}>{row.label}</a> · {row.status}
          </li>
        ))}
      </ul>
    </main>
  );
};
```

```tsx src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InvoicesRouteBridge } from "./module/framework/bridges/invoices-route.bridge";
const queryClient = new QueryClient();
createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <InvoicesRouteBridge />
    </QueryClientProvider>
  </StrictMode>,
);
```

```ts src/module/framework/view-models/invoice-status.view-model.ts
import { InvoiceStatus } from "../../domain/schemas/invoice.schema";
const LABEL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PAID]: "Paid",
  [InvoiceStatus.PENDING]: "Pending",
};
export const invoiceStatusLabel = (status: InvoiceStatus) => LABEL[status];
export const invoiceStatusOptions = () =>
  Object.values(InvoiceStatus).map((value) => ({ value, label: LABEL[value] }));
```

```ts src/module/framework/view-models/invoice-detail.view-model.ts
import type { InvoiceEntity } from "../../domain/entities/invoice.entity";
import { invoiceStatusLabel } from "./invoice-status.view-model";
export const invoiceDetailViewModel = (invoice: InvoiceEntity) => ({
  title: `Invoice #${invoice.id}`,
  total: String(invoice.total),
  status: invoiceStatusLabel(invoice.status),
});
```

```ts src/module/framework/controllers/invoice-detail.controller.ts
import { ModuleException } from "../../domain/exceptions/invoice.exceptions";
import { usePayInvoiceMutation } from "../mutations/pay-invoice.mutation";
import { useGetInvoiceQuery } from "../queries/get-invoice.query";
import { invoiceDetailViewModel } from "../view-models/invoice-detail.view-model";
export const useInvoiceDetailController = (invoiceId: string) => {
  const query = useGetInvoiceQuery(invoiceId);
  const payment = usePayInvoiceMutation();
  const failure = query.error ?? payment.error;
  return {
    invoice: query.data ? invoiceDetailViewModel(query.data) : null,
    notice: failure instanceof ModuleException ? failure.message : null,
    canPay: query.data ? !query.data.isPaid : false,
    isPaying: payment.isPending,
    onPay: () => payment.mutate(invoiceId),
  };
};
```

```tsx src/module/framework/ui/invoice-detail/invoice-detail.page.tsx
import type { ComponentProps } from "react";
import { useInvoiceDetailController } from "../../controllers/invoice-detail.controller";
export const InvoiceDetailPage = (props: { invoiceId: string; listLink: ComponentProps<"a"> }) => {
  const { invoice, notice, canPay, isPaying, onPay } = useInvoiceDetailController(props.invoiceId);
  return (
    <main>
      <a {...props.listLink}>Back to the invoices</a>
      {notice && <p role="alert">{notice}</p>}
      {invoice && (
        <section>
          <h1>{invoice.title}</h1>
          <p>
            {invoice.total} · {invoice.status}
          </p>
          {canPay && (
            <button type="button" disabled={isPaying} onClick={onPay}>
              {isPaying ? "Paying…" : "Pay"}
            </button>
          )}
        </section>
      )}
    </main>
  );
};
```

```tsx src/module/framework/bridges/invoices-route.bridge.tsx
import { type MouseEvent, useEffect, useState } from "react";
import { InvoiceDetailPage } from "../ui/invoice-detail/invoice-detail.page";
import { InvoicesPage } from "../ui/invoices/invoices.page";
const LIST = "/invoices";
const invoiceIdOf = (path: string) =>
  path.startsWith(`${LIST}/`) ? decodeURIComponent(path.slice(LIST.length + 1)) : null;
const opensElsewhere = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
export const InvoicesRouteBridge = () => {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const link = (to: string) => ({
    href: to,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (opensElsewhere(event)) return;
      event.preventDefault();
      window.history.pushState(null, "", to);
      setPath(to);
    },
  });
  const invoiceId = invoiceIdOf(path);
  return invoiceId ? (
    <InvoiceDetailPage invoiceId={invoiceId} listLink={link(LIST)} />
  ) : (
    <InvoicesPage invoiceLink={(id) => link(`${LIST}/${encodeURIComponent(id)}`)} />
  );
};
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

## S23 · page-flow-state

### local-selection

```tsx src/catalog/framework/ui/search.tsx
function SearchPage() { const [selectedId, setSelectedId] = useState(null); return <Results selected={selectedId} onSelect={setSelectedId}/>; }
```

```expect
- src/catalog/framework/ui/search.tsx (gpt-6-luna yes 0.98 · 704d2478f2da49f8870d5d8bbcc868fcc42a9ac18978cb69b27e9276ab9c07c5)
```

### reference

```tsx src/catalog/framework/ui/search.tsx
function SearchPage() { const [selectedId, select] = useSearchPageStore(s => [s.selectedId,s.select]); return <Results selected={selectedId} onSelect={select}/>; }
```

```expect
(no findings) (gpt-6-luna no 0 · 0f9dd715037b96514b20a730de220389fd1d3f9a7129acc110bd4e7758f85255)
```
