# Orders Shipping Fee and Payable Total Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Shipping Fee and Payable Total money columns to the shared Orders table columns used by the Orders list and Dashboard Orders.

**Architecture:** Extend `getOrderColumns` so both consumers pick up the new columns. Update Orders page column-visibility labels. Cover with the existing order-columns unit test. No API or type changes — `OrderHistory` already has `shipping_fee` and `payable_total`.

**Tech Stack:** Nuxt 4 / Vue 3, `@nuxt/ui` table columns, Vitest, i18n keys already in locale files.

## Global Constraints

- Keep existing money columns: Gross Amt, Tax Amt Exc, Net Amt.
- Append Shipping Fee then Payable Total after Net Amt.
- Format with `moneyCell(amount, currency.code)` like other order money columns.
- Reuse i18n: `components.fulfillment.shippingFee` and `table.totalAmt`.
- Do not replace `net_amt` with `net_total`.
- Do not commit unless the user explicitly asks.

---

## File map

| File | Responsibility |
|------|----------------|
| `app/utils/table-columns/order/order.ts` | Shared order table column definitions |
| `app/pages/orders/index.vue` | Column visibility label map (`ORDER_COLUMN_LABELS`) |
| `test/unit/order-columns-sorting.spec.ts` | Asserts column ids / sorting behavior |
| `app/components/Dashboard/Orders.vue` | No edit — already uses `getOrderColumns` |

---

### Task 1: Failing test for new money columns

**Files:**
- Modify: `test/unit/order-columns-sorting.spec.ts`
- Test: `test/unit/order-columns-sorting.spec.ts`

**Interfaces:**
- Consumes: `getOrderColumns(t: (key: string) => string): TableColumn<OrderHistory>[]`
- Produces: assertions that `shipping_fee` and `payable_total` exist and are sortable

- [ ] **Step 1: Extend the sortable-columns assertion to include the new keys**

In `test/unit/order-columns-sorting.spec.ts`, update the data-columns loop:

```ts
it('enables sorting on data columns', () => {
	for (const id of [
		'order_no',
		'order_type',
		'customer',
		'status',
		'gross_amt',
		'tax_amt_exc',
		'net_amt',
		'shipping_fee',
		'payable_total',
	]) {
		expect(columnById(id).enableSorting).not.toBe(false);
	}
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:vitest:run -- test/unit/order-columns-sorting.spec.ts
```

Expected: FAIL — `columnById('shipping_fee')` (or `payable_total`) not found / falsy.

---

### Task 2: Add columns to `getOrderColumns`

**Files:**
- Modify: `app/utils/table-columns/order/order.ts` (append after the `net_amt` column block)

**Interfaces:**
- Consumes: `moneyCell`, `getSortableHeader`, `tableCellMeta`, `OrderHistory.shipping_fee`, `OrderHistory.payable_total`
- Produces: columns with `accessorKey: 'shipping_fee'` and `accessorKey: 'payable_total'`

- [ ] **Step 1: Append the two column definitions after `net_amt`**

After the existing `net_amt` column object in `getOrderColumns`, add:

```ts
{
	accessorKey: 'shipping_fee',
	header: ({ column }) => getSortableHeader(column, t('components.fulfillment.shippingFee'), 'right'),
	cell: ({ row }) => moneyCell(row.original.shipping_fee ?? 0, row.original.currency.code),
	...tableCellMeta.rightNumeric,
},
{
	accessorKey: 'payable_total',
	header: ({ column }) => getSortableHeader(column, t('table.totalAmt'), 'right'),
	cell: ({ row }) => moneyCell(row.original.payable_total ?? 0, row.original.currency.code),
	...tableCellMeta.rightNumeric,
},
```

- [ ] **Step 2: Run test to verify it passes**

Run:

```bash
npm run test:vitest:run -- test/unit/order-columns-sorting.spec.ts
```

Expected: PASS.

---

### Task 3: Column visibility labels on Orders page

**Files:**
- Modify: `app/pages/orders/index.vue` (`ORDER_COLUMN_LABELS`)

**Interfaces:**
- Consumes: column keys `shipping_fee`, `payable_total` from `getOrderColumns`
- Produces: visibility/export toggles for those columns via `columnOptionsFromLabelMap`

- [ ] **Step 1: Add label map entries**

Update `ORDER_COLUMN_LABELS`:

```ts
const ORDER_COLUMN_LABELS = {
	index: 'table.no',
	order_no: 'table.orderNo',
	order_type: 'table.type',
	customer: 'table.customer',
	status: 'table.status',
	gross_amt: 'table.grossAmt',
	tax_amt_exc: 'table.taxAmtExc',
	net_amt: 'table.netAmt',
	shipping_fee: 'components.fulfillment.shippingFee',
	payable_total: 'table.totalAmt',
} as const;
```

- [ ] **Step 2: Sanity check**

Confirm Dashboard `Orders.vue` still uses `getOrderColumns(t)` with no local column list (no code change required).

- [ ] **Step 3: Re-run the unit test**

Run:

```bash
npm run test:vitest:run -- test/unit/order-columns-sorting.spec.ts
```

Expected: PASS.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Keep Gross / Tax / Net | Task 2 (append only) |
| Add Shipping Fee | Task 2 |
| Add Payable Total | Task 2 |
| moneyCell + currency | Task 2 |
| Orders list column visibility | Task 3 |
| Dashboard uses shared columns | Task 3 Step 2 (no edit) |
| Reuse i18n keys | Tasks 2–3 |
| Unit test update | Task 1 |
| No API/type changes | All tasks |
